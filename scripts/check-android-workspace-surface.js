const { execFileSync } = require("node:child_process");

function run(command, args) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 10 * 1024 * 1024,
  });
}

function resolveSerial() {
  const output = run("adb", ["devices"]);
  const online = output
    .split("\n")
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter(([serial, state]) => serial && state === "device")
    .map(([serial]) => serial);
  const requested = process.env.ANDROID_SERIAL;

  if (requested) {
    if (!online.includes(requested)) {
      throw new Error(`ANDROID_SERIAL ${requested} is not online`);
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

function readAgentDeviceSnapshot() {
  try {
    const parsed = JSON.parse(run("agent-device", ["snapshot", "--json"]));
    const nodes = parsed.data?.nodes ?? parsed.nodes ?? [];
    if (Array.isArray(nodes) && nodes.length > 0) {
      return { kind: "agent-device", nodes };
    }
  } catch {
    // Fall back to Android's accessibility dump.
  }
  return null;
}

function readAccessibilityXml(serial) {
  run("adb", [
    "-s",
    serial,
    "shell",
    "uiautomator",
    "dump",
    "/sdcard/window.xml",
  ]);
  return run("adb", ["-s", serial, "exec-out", "cat", "/sdcard/window.xml"]);
}

function hasIdentifier(snapshot, identifier) {
  if (typeof snapshot === "string") {
    const escapedIdentifier = identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(
      `(?:resource-id|content-desc)="[^"]*${escapedIdentifier}[^"]*"`
    ).test(snapshot);
  }

  return snapshot.nodes.some((node) => {
    const nodeIdentifier = node.identifier ?? "";
    return (
      nodeIdentifier === identifier || nodeIdentifier.endsWith(`/${identifier}`)
    );
  });
}

function checkWorkerHome(snapshot) {
  if (hasIdentifier(snapshot, "switch-to-hirer-button")) {
    throw new Error(
      "Worker Home still exposes switch-to-hirer-button; the installed bundle is stale"
    );
  }
  console.log(
    "Workspace surface passed: Worker Home has no role-switch control."
  );
}

function checkSettings(snapshot) {
  if (!hasIdentifier(snapshot, "settings-workspace")) {
    throw new Error(
      "Settings is visible but settings-workspace is missing; the installed bundle is stale"
    );
  }
  console.log(
    "Workspace surface passed: Settings exposes workspace switching."
  );
}

function main() {
  const serial = resolveSerial();
  const agentDeviceSnapshot = readAgentDeviceSnapshot();
  const snapshot = agentDeviceSnapshot ?? readAccessibilityXml(serial);
  const isWorkerHome =
    hasIdentifier(snapshot, "worker-home-scroll") ||
    hasIdentifier(snapshot, "worker-home-title");
  const isSettings =
    hasIdentifier(snapshot, "settings-content") ||
    hasIdentifier(snapshot, "settings-scroll");

  console.log(`Android device: ${serial}`);
  if (isWorkerHome) {
    checkWorkerHome(snapshot);
    return;
  }
  if (isSettings) {
    checkSettings(snapshot);
    return;
  }
  throw new Error(
    "Open Worker Home or Settings, then rerun check-android-workspace-surface"
  );
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
