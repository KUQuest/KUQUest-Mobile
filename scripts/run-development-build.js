const { spawnSync } = require('node:child_process');

const platform = process.argv[2] ?? 'android';
const supportedPlatforms = new Set(['android', 'ios']);

if (!supportedPlatforms.has(platform)) {
  console.error(`Unsupported platform: ${platform}. Use "android" or "ios".`);
  process.exitCode = 1;
} else {
  console.log(`Building the ${platform} development client with RNGoogleSignin included.`);
  console.log('Do not open this project in Expo Go; Expo Go cannot load this native module.');

  const result = spawnSync('npx', [`expo`, `run:${platform}`], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  process.exitCode = result.status ?? 1;
}
