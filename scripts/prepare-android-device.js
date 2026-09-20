const { execFileSync } = require("child_process");
const METRO_PORT = Number(
  process.env.METRO_PORT ?? process.env.EXPO_PORT ?? 8081
);

function runAdb(args) {
  try {
    return execFileSync("adb", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const detail = error.stderr?.toString().trim();
    throw new Error(detail || `adb ${args.join(" ")} failed`);
  }
}

function findOnlineDevices() {
  const output = runAdb(["devices"]);
  return output
    .split("\n")
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter(([serial, state]) => serial && state === "device")
    .map(([serial]) => serial);
}

function resolveSerial() {
  const requested = process.env.ANDROID_SERIAL ?? process.argv[2];
  const online = findOnlineDevices();

  if (requested) {
    if (!online.includes(requested)) {
      throw new Error(`Android device ${requested} is not online`);
    }
    return requested;
  }

  if (online.length !== 1) {
    throw new Error(
      online.length === 0
        ? "No online Android device found"
        : `Multiple Android devices found; set ANDROID_SERIAL (${online.join(", ")})`
    );
  }

  return online[0];
}

try {
  const serial = resolveSerial();
  runAdb(["-s", serial, "reverse", `tcp:${METRO_PORT}`, `tcp:${METRO_PORT}`]);
  console.log(`Android device prepared: ${serial}`);
  console.log("Metro device configuration:");
  console.log("  metroHost=127.0.0.1");
  console.log(`  metroPort=${METRO_PORT}`);
  console.log(`  bundleUrl=http://127.0.0.1:${METRO_PORT}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
