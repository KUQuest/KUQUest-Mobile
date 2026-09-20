const { execFileSync } = require("child_process");

const NAVIGATION_TARGET_GROUPS = [
  { label: "home", ids: ["tab-index"] },
  { label: "money", ids: ["tab-money"] },
  { label: "work-or-create", ids: ["tab-create", "tab-my-quests"] },
  { label: "chat", ids: ["tab-chat"] },
  { label: "profile", ids: ["tab-profile"] },
];
const MIN_TARGET_DP = Number(process.env.MIN_NAVIGATION_TARGET_DP ?? 44);

function runAdb(serial, args) {
  try {
    return execFileSync("adb", ["-s", serial, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const detail = error.stderr?.toString().trim();
    throw new Error(detail || `adb ${args.join(" ")} failed`);
  }
}

function resolveSerial() {
  let devices;
  try {
    devices = execFileSync("adb", ["devices"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const detail = error.stderr?.toString().trim();
    throw new Error(detail || "adb is required for Android navigation checks");
  }

  const online = devices
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

function readDensity(serial) {
  const output = runAdb(serial, ["shell", "wm", "density"]);
  const match = output.match(/(?:Override|Physical) density:\s*(\d+)/);
  if (!match) throw new Error("Could not read Android display density");
  return Number(match[1]) / 160;
}

function tryReadAgentDeviceSnapshot() {
  try {
    const raw = execFileSync("agent-device", ["snapshot", "--json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 10 * 1024 * 1024,
    });
    const parsed = JSON.parse(raw);
    const nodes = parsed.data?.nodes ?? parsed.nodes ?? [];
    if (Array.isArray(nodes) && nodes.length > 0) {
      return nodes;
    }
  } catch {
    // Fall back to uiautomator dump
  }
  return null;
}

function readAccessibilityXml(serial) {
  runAdb(serial, ["shell", "uiautomator", "dump", "/sdcard/window.xml"]);
  return runAdb(serial, ["exec-out", "cat", "/sdcard/window.xml"]);
}

function readXmlAttributes(node) {
  return Object.fromEntries(
    [...node.matchAll(/([\w:-]+)="([^"]*)"/g)].map((match) => [
      match[1],
      match[2],
    ])
  );
}

function findTargetInAgentDeviceNodes(nodes, targetIds) {
  return nodes.find((node) => {
    const identifier = node.identifier ?? "";
    return targetIds.some(
      (targetId) =>
        identifier === targetId || identifier.endsWith(`/${targetId}`)
    );
  });
}

function findTargetInXml(xml, targetIds) {
  const nodes = [...xml.matchAll(/<node\b[^>]*>/g)].map(([node]) => {
    const attributes = readXmlAttributes(node);
    return { attributes };
  });

  return nodes.find(({ attributes }) => {
    const resourceId = attributes["resource-id"] ?? "";
    return targetIds.some(
      (targetId) =>
        resourceId === targetId || resourceId.endsWith(`/${targetId}`)
    );
  });
}

function readBoundsFromXml(bounds) {
  const match = bounds.match(/^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$/);
  if (!match) throw new Error(`Invalid Android bounds: ${bounds}`);
  const [, left, top, right, bottom] = match.map(Number);
  return { width: right - left, height: bottom - top };
}

function main() {
  const serial = resolveSerial();
  const density = readDensity(serial);
  const state = process.env.NAVIGATION_STATE ?? "current";
  const agentDeviceNodes = tryReadAgentDeviceSnapshot();
  const xml = agentDeviceNodes ? null : readAccessibilityXml(serial);
  const failures = [];

  for (const targetGroup of NAVIGATION_TARGET_GROUPS) {
    let widthDp;
    let heightDp;
    let enabled;
    let hittable;

    if (agentDeviceNodes) {
      const node = findTargetInAgentDeviceNodes(
        agentDeviceNodes,
        targetGroup.ids
      );
      if (!node) {
        failures.push(
          `${targetGroup.label}: none of ${targetGroup.ids.join(", ")} found in snapshot`
        );
        continue;
      }
      widthDp = (node.rect?.width ?? 0) / density;
      heightDp = (node.rect?.height ?? 0) / density;
      enabled = node.enabled !== false;
      hittable = node.hittable !== false;
    } else {
      const target = findTargetInXml(xml, targetGroup.ids);
      if (!target) {
        failures.push(
          `${targetGroup.label}: none of ${targetGroup.ids.join(", ")} found in window xml`
        );
        continue;
      }
      const { attributes } = target;
      const { width, height } = readBoundsFromXml(attributes.bounds ?? "");
      widthDp = width / density;
      heightDp = height / density;
      enabled = attributes.enabled === "true";
      hittable = true;
    }

    if (!enabled) {
      failures.push(`${targetGroup.label}: enabled=false`);
    }
    if (!hittable) {
      failures.push(`${targetGroup.label}: hittable=false`);
    }
    if (widthDp < MIN_TARGET_DP || heightDp < MIN_TARGET_DP) {
      failures.push(
        `${targetGroup.label}: ${widthDp.toFixed(1)}x${heightDp.toFixed(1)}dp ` +
          `(minimum ${MIN_TARGET_DP}dp)`
      );
    }

    console.log(
      `${targetGroup.label}: ${widthDp.toFixed(1)}x${heightDp.toFixed(1)}dp ` +
        `enabled=${enabled} hittable=${hittable}`
    );
  }

  if (failures.length > 0) {
    throw new Error(
      `Android navigation target check failed (${state}):\n- ${failures.join(
        "\n- "
      )}`
    );
  }

  console.log(
    `Android navigation target check passed (${state}) on ${serial} ` +
      `via ${agentDeviceNodes ? "agent-device snapshot" : "uiautomator dump"}`
  );
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
