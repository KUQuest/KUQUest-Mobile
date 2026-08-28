const { existsSync, readFileSync, realpathSync, rmSync } = require('node:fs');
const { delimiter, join, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');

function clearStaleAndroidAutolinkingCache() {
  const cacheDirectory = resolve('android/build/generated/autolinking');
  const cacheFile = join(cacheDirectory, 'autolinking.json');

  if (!existsSync(cacheFile)) {
    return;
  }

  try {
    const cachedRoot = JSON.parse(readFileSync(cacheFile, 'utf8')).root;
    if (cachedRoot && realpathSync(cachedRoot) === realpathSync(process.cwd())) {
      return;
    }
  } catch {
    // Regenerate malformed or stale generated state below.
  }

  rmSync(cacheDirectory, { force: true, recursive: true });
}

function getAndroidEnvironment() {
  if (process.env.JAVA_HOME) {
    return process.env;
  }

  const java17Candidates = [
    '/usr/lib/jvm/java-17-openjdk',
    '/usr/lib/jvm/java-17-openjdk-amd64',
  ];
  const java17Home = java17Candidates.find(existsSync);

  if (!java17Home) {
    return process.env;
  }

  return {
    ...process.env,
    JAVA_HOME: java17Home,
    PATH: `${join(java17Home, 'bin')}${delimiter}${process.env.PATH ?? ''}`,
  };
}

const platform = process.argv[2] ?? 'android';
const supportedPlatforms = new Set(['android', 'ios']);

if (!supportedPlatforms.has(platform)) {
  console.error(`Unsupported platform: ${platform}. Use "android" or "ios".`);
  process.exitCode = 1;
} else {
  if (platform === 'android') {
    clearStaleAndroidAutolinkingCache();
  }
  console.log(`Building the ${platform} development client with RNGoogleSignin included.`);
  console.log('Do not open this project in Expo Go; Expo Go cannot load this native module.');

  const expoArgs = ['expo', `run:${platform}`];
  if (platform === 'android') {
    expoArgs.push('--all-arch');
  }

  const result = spawnSync('npx', expoArgs, {
    env: platform === 'android' ? getAndroidEnvironment() : process.env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  process.exitCode = result.status ?? 1;
}
