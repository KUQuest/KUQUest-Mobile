const { spawnSync } = require("node:child_process");

const STAGING_API_URL = "https://kuquest-dev-api.kubits.org";
const REQUIRED_ENVIRONMENT = [
  "EXPO_PUBLIC_API_URL",
  "EXPO_PUBLIC_GOOGLE_CLIENT_ID",
  "EXPO_PUBLIC_TERMS_VERSION",
];

function assertStagingApiUrl(value) {
  if (!value) {
    throw new Error("EXPO_PUBLIC_API_URL is required for staging:start");
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`EXPO_PUBLIC_API_URL must be ${STAGING_API_URL}`);
  }

  const isExactStagingOrigin =
    url.protocol === "https:" &&
    url.hostname === "kuquest-dev-api.kubits.org" &&
    url.port === "" &&
    url.pathname === "/" &&
    url.search === "" &&
    url.hash === "" &&
    url.username === "" &&
    url.password === "";

  if (!isExactStagingOrigin) {
    throw new Error(`EXPO_PUBLIC_API_URL must be ${STAGING_API_URL}`);
  }
}

function createStagingEnvironment(environment = process.env) {
  for (const name of REQUIRED_ENVIRONMENT) {
    if (!environment[name]?.trim()) {
      throw new Error(`${name} is required for staging:start`);
    }
  }

  assertStagingApiUrl(environment.EXPO_PUBLIC_API_URL.trim());

  return {
    ...environment,
    EXPO_PUBLIC_API_URL: environment.EXPO_PUBLIC_API_URL.trim(),
    EXPO_PUBLIC_GOOGLE_CLIENT_ID: environment.EXPO_PUBLIC_GOOGLE_CLIENT_ID.trim(),
    EXPO_PUBLIC_TERMS_VERSION: environment.EXPO_PUBLIC_TERMS_VERSION.trim(),
    APP_VARIANT: "staging",
    ANDROID_VERSION_CODE: "1",
    EXPO_NO_DOTENV: "1",
    EXPO_PUBLIC_PROFILE_DEMO: "false",
  };
}

function runStagingStart({
  environment = process.env,
  spawn = spawnSync,
} = {}) {
  const stagingEnvironment = createStagingEnvironment(environment);
  const result = spawn("bun", ["x", "expo", "start", "--dev-client"], {
    env: stagingEnvironment,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  return result.status ?? 1;
}

if (require.main === module) {
  try {
    process.exitCode = runStagingStart();
  } catch (error) {
    console.error(`Unable to start staging: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  STAGING_API_URL,
  REQUIRED_ENVIRONMENT,
  assertStagingApiUrl,
  createStagingEnvironment,
  runStagingStart,
};
