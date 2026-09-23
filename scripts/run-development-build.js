const { existsSync, readFileSync, realpathSync, rmSync } = require("node:fs");
const { delimiter, join, resolve } = require("node:path");
const { spawnSync } = require("node:child_process");
const { createInterface } = require("node:readline/promises");

const ANDROID_PACKAGE = "com.kuquest.mobile.debug";
const DEFAULT_PORT = "6767";

function clearStaleAndroidAutolinkingCache() {
  const cacheDirectory = resolve("android/build/generated/autolinking");
  const cacheFile = join(cacheDirectory, "autolinking.json");

  if (!existsSync(cacheFile)) return;

  try {
    const cachedRoot = JSON.parse(readFileSync(cacheFile, "utf8")).root;
    if (
      cachedRoot &&
      realpathSync(cachedRoot) === realpathSync(process.cwd())
    ) {
      return;
    }
  } catch {
    // Regenerate malformed or stale generated state below.
  }

  rmSync(cacheDirectory, { force: true, recursive: true });
}

function getAndroidEnvironment(environment = process.env) {
  if (environment.JAVA_HOME) return environment;

  const java17Candidates = [
    "/usr/lib/jvm/java-17-openjdk",
    "/usr/lib/jvm/java-17-openjdk-amd64",
  ];
  const java17Home = java17Candidates.find(existsSync);
  if (!java17Home) return environment;

  return {
    ...environment,
    JAVA_HOME: java17Home,
    PATH: `${join(java17Home, "bin")}${delimiter}${environment.PATH ?? ""}`,
  };
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed (${result.status ?? result.signal})`
    );
  }
  return result.stdout?.toString() ?? "";
}

function runAdb(args, environment) {
  return run("adb", args, {
    env: environment,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });
}

function listOnlineDevices(environment) {
  const output = runAdb(["devices", "-l"], environment);
  return output
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter(([serial, state]) => serial && state === "device")
    .map(([serial, , ...details]) => {
      const model = details
        .find((detail) => detail.startsWith("model:"))
        ?.slice("model:".length)
        .replaceAll("_", " ");
      const emulator = serial.startsWith("emulator-");
      return {
        serial,
        model: model || serial,
        kind: emulator ? "emulator" : "physical",
      };
    });
}

async function selectAndroidDevice(
  environment,
  stdin = process.stdin,
  stdout = process.stdout
) {
  const devices = listOnlineDevices(environment);
  const requested = environment.ANDROID_SERIAL || process.argv[3];

  if (requested) {
    const device = devices.find(({ serial }) => serial === requested);
    if (!device) throw new Error(`Android device ${requested} is not online`);
    return device;
  }
  if (devices.length === 0) throw new Error("No online Android device found");
  if (devices.length === 1) return devices[0];

  if (!stdin.isTTY) {
    throw new Error(
      "Multiple Android devices found; set ANDROID_SERIAL to select one"
    );
  }

  stdout.write("Select Android device:\n");
  devices.forEach((device, index) => {
    stdout.write(
      `  ${index + 1}. ${device.model} (${device.serial}) [${device.kind}]\n`
    );
  });
  const prompt = createInterface({ input: stdin, output: stdout });
  try {
    while (true) {
      const answer = await prompt.question("Device: ");
      const index = Number(answer);
      if (Number.isInteger(index) && index >= 1 && index <= devices.length) {
        return devices[index - 1];
      }
      stdout.write(`Choose a number from 1 to ${devices.length}.\n`);
    }
  } finally {
    prompt.close();
  }
}

function getNativeAndroidPackage() {
  const gradleFile = resolve("android/app/build.gradle");
  if (!existsSync(gradleFile)) return null;
  const source = readFileSync(gradleFile, "utf8");
  const match = source.match(/^\s*applicationId\s+["']([^"']+)["']/m);
  if (!match) {
    throw new Error(
      "Could not determine Android applicationId from android/app/build.gradle"
    );
  }
  return match[1];
}

function ensureDebugAndroidProject(environment) {
  const applicationId = getNativeAndroidPackage();
  if (applicationId === ANDROID_PACKAGE) return;

  const prebuildArgs = ["expo", "prebuild", "--platform", "android"];
  if (applicationId !== null) prebuildArgs.push("--clean");
  console.log(
    applicationId === null
      ? "Generating the Android native project for the debug variant."
      : `Android applicationId is ${applicationId}; regenerating for ${ANDROID_PACKAGE}.`
  );
  run("npx", prebuildArgs, { env: environment });

  const regeneratedPackage = getNativeAndroidPackage();
  if (regeneratedPackage !== ANDROID_PACKAGE) {
    throw new Error(
      `Android prebuild produced ${regeneratedPackage ?? "no applicationId"}; expected ${ANDROID_PACKAGE}`
    );
  }
}

function getExtraExpoArgs(args) {
  const separator = args.indexOf("--");
  return separator === -1 ? args : args.slice(separator + 1);
}

function resolvePort(args, environment) {
  const portIndex = args.findIndex((arg) => arg === "--port" || arg === "-p");
  if (portIndex !== -1)
    return args[portIndex + 1] || environment.EXPO_PORT || DEFAULT_PORT;
  const portArgument = args.find((arg) => arg.startsWith("--port="));
  return (
    portArgument?.slice("--port=".length) ||
    environment.EXPO_PORT ||
    DEFAULT_PORT
  );
}

function withoutDeviceArgument(args) {
  return args.filter((arg, index) => {
    if (arg === "--device" || arg === "-d") return false;
    if (
      index > 0 &&
      (args[index - 1] === "--device" || args[index - 1] === "-d")
    ) {
      return false;
    }
    return !arg.startsWith("--device=");
  });
}

async function runAndroidBuild(args, environment = process.env) {
  const debugEnvironment = getAndroidEnvironment({
    ...environment,
    APP_VARIANT: "debug",
  });
  console.log(`Android package: ${ANDROID_PACKAGE}`);
  const device = await selectAndroidDevice(debugEnvironment);

  ensureDebugAndroidProject(debugEnvironment);
  clearStaleAndroidAutolinkingCache();

  const extraArgs = getExtraExpoArgs(args);
  const port = resolvePort(extraArgs, debugEnvironment);
  runAdb(
    ["-s", device.serial, "reverse", `tcp:${port}`, `tcp:${port}`],
    debugEnvironment
  );
  console.log(`ADB reverse: ${device.serial} tcp:${port} -> tcp:${port}`);
  console.log(`Building ${ANDROID_PACKAGE} on ${device.serial}...`);

  const expoArgs = [
    "expo",
    "run:android",
    "--device",
    device.serial,
    ...withoutDeviceArgument(extraArgs),
  ];
  const hasPortArg = extraArgs.some(
    (arg) => arg === "--port" || arg === "-p" || arg.startsWith("--port=")
  );
  if (!hasPortArg) expoArgs.push("--port", port);
  run("npx", expoArgs, { env: debugEnvironment });
}

function runIosBuild(args, environment = process.env) {
  console.log(
    "Building the ios development client with RNGoogleSignin included."
  );
  console.log(
    "Do not open this project in Expo Go; Expo Go cannot load this native module."
  );
  const extraArgs = getExtraExpoArgs(args);
  const expoArgs = ["expo", "run:ios", ...extraArgs];
  const hasPortArg = extraArgs.some(
    (arg) => arg === "--port" || arg === "-p" || arg.startsWith("--port=")
  );
  if (!hasPortArg) {
    expoArgs.push("--port", environment.EXPO_PORT || DEFAULT_PORT);
  }
  run("npx", expoArgs, { env: environment });
}

async function main(args = process.argv.slice(2), environment = process.env) {
  const [platform = "android", ...platformArgs] = args;
  if (platform === "android") return runAndroidBuild(platformArgs, environment);
  if (platform === "ios") return runIosBuild(platformArgs, environment);
  throw new Error(`Unsupported platform: ${platform}. Use "android" or "ios".`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  ANDROID_PACKAGE,
  DEFAULT_PORT,
  getAndroidEnvironment,
  listOnlineDevices,
  selectAndroidDevice,
  getNativeAndroidPackage,
  ensureDebugAndroidProject,
  getExtraExpoArgs,
  resolvePort,
  withoutDeviceArgument,
  runAndroidBuild,
  runIosBuild,
  main,
};
