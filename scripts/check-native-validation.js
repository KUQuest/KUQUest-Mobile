const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");

const METRO_PORT = Number(process.env.METRO_PORT ?? 6767);
const METRO_REUSE = process.env.METRO_REUSE === "1";
const ALLOWED_SESSION = process.env.AGENT_DEVICE_SESSION;
const AGENT_DEVICE_RECENT_WINDOW_MS = 15 * 60 * 1000;

function run(command, args) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function findOnlineDevices() {
  const output = run("adb", ["devices"]);
  return output
    .split("\n")
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter(([serial, state]) => serial && state === "device")
    .map(([serial]) => serial);
}

function readPortOwner(port) {
  for (const [command, args] of [
    ["ss", ["-ltnp", `sport = :${port}`]],
    ["lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"]],
  ]) {
    try {
      const output = run(command, args).trim();
      if (output) {
        const ssPid = output.match(/pid=(\d+)/)?.[1];
        const lsofPid = output.match(/\n[^\s]+\s+(\d+)\s/)?.[1];
        return {
          command,
          output,
          pid: Number(ssPid ?? lsofPid ?? 0) || null,
        };
      }
    } catch {
      // Try the next host inspection command.
    }
  }
  return null;
}

function readProcessInfo(pid) {
  if (!pid) return null;
  try {
    const processDirectory = `/proc/${pid}`;
    const command = fs
      .readFileSync(`${processDirectory}/cmdline`, "utf8")
      .split("\0")
      .filter(Boolean)
      .join(" ");
    return {
      command: command || "unknown",
      cwd: fs.readlinkSync(`${processDirectory}/cwd`),
      openFiles: fs.readdirSync(`${processDirectory}/fd`).length,
      openFileLimit: readOpenFileLimit(pid),
    };
  } catch {
    return null;
  }
}

function readOpenFileLimit(pid = process.pid) {
  try {
    const limits = fs.readFileSync(`/proc/${pid}/limits`, "utf8");
    const line = limits
      .split("\n")
      .find((entry) => entry.startsWith("Max open files"));
    return line?.replace(/\s+/g, " ").trim() ?? "unavailable";
  } catch {
    return "unavailable";
  }
}

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    const finish = (open) => {
      socket.destroy();
      resolve(open);
    };
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.setTimeout(500, () => finish(false));
  });
}

function readMetroHealth(port) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    const request = http.get(
      { host: "127.0.0.1", path: "/status", port, timeout: 1000 },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () =>
          finish({
            body: body.slice(0, 200),
            healthy:
              response.statusCode === 200 &&
              body.includes("packager-status:running"),
            statusCode: response.statusCode ?? 0,
          })
        );
      }
    );
    request.on("error", () => finish(null));
    request.on("timeout", () => {
      request.destroy();
      finish(null);
    });
  });
}

function readMetroBundleHealth(port) {
  const appId = encodeURIComponent(
    process.env.EXPO_APP_ID ?? "com.kuquest.mobile.debug"
  );
  const bundlePath =
    `/.expo/.virtual-metro-entry.bundle?platform=android&dev=true&lazy=true&minify=false&app=${appId}` +
    "&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server";

  return new Promise((resolve) => {
    const request = http.get(
      { host: "127.0.0.1", path: bundlePath, port, timeout: 3000 },
      (response) => {
        const result = {
          healthy: response.statusCode === 200,
          statusCode: response.statusCode ?? 0,
        };
        response.once("data", () => {
          response.destroy();
          resolve(result);
        });
        response.once("end", () => resolve(result));
      }
    );
    request.on("error", () => resolve(null));
    request.on("timeout", () => {
      request.destroy();
      resolve(null);
    });
  });
}

function readAgentDeviceSessions() {
  try {
    const parsed = JSON.parse(
      run("agent-device", ["session", "list", "--json"])
    );
    return parsed.data?.sessions ?? parsed.sessions ?? [];
  } catch {
    return null;
  }
}

function readRecentAgentDeviceSessions() {
  const stateDirectory =
    process.env.AGENT_DEVICE_STATE_DIR ??
    `${process.env.HOME ?? ""}/.agent-device`;
  const sessionsDirectory = `${stateDirectory}/sessions`;

  try {
    return fs
      .readdirSync(sessionsDirectory, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() &&
          entry.name !== "default" &&
          entry.name !== ALLOWED_SESSION
      )
      .flatMap((entry) => {
        const eventsPath = `${sessionsDirectory}/${entry.name}/events.ndjson`;
        try {
          const lines = fs
            .readFileSync(eventsPath, "utf8")
            .trim()
            .split("\n")
            .filter(Boolean);
          const lastEvent = JSON.parse(lines[lines.length - 1]);
          const age = Date.now() - Date.parse(lastEvent.ts);
          const closed =
            lastEvent.command === "close" && lastEvent.status === "ok";
          const failed =
            lastEvent.kind === "request.finished" &&
            lastEvent.status === "error";
          return age >= 0 &&
            age <= AGENT_DEVICE_RECENT_WINDOW_MS &&
            !closed &&
            !failed
            ? [entry.name]
            : [];
        } catch {
          return [];
        }
      });
  } catch {
    return [];
  }
}

function readInotifyLimit(name) {
  try {
    return fs.readFileSync(`/proc/sys/fs/inotify/${name}`, "utf8").trim();
  } catch {
    return "unavailable";
  }
}

function readInotifyLimitNumber(name) {
  const value = Number(readInotifyLimit(name));
  return Number.isFinite(value) ? value : null;
}

function readInotifyUsage() {
  let instances = 0;
  let watches = 0;

  try {
    const processDirectories = fs
      .readdirSync("/proc", { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name));

    for (const processDirectory of processDirectories) {
      const fdDirectory = `/proc/${processDirectory.name}/fd`;
      let descriptors;
      try {
        descriptors = fs.readdirSync(fdDirectory);
      } catch {
        continue;
      }

      for (const descriptor of descriptors) {
        try {
          const target = fs.readlinkSync(`${fdDirectory}/${descriptor}`);
          if (!target.includes("inotify")) continue;
          instances += 1;
          const info = fs.readFileSync(
            `/proc/${processDirectory.name}/fdinfo/${descriptor}`,
            "utf8"
          );
          watches += (info.match(/^inotify wd:/gm) ?? []).length;
        } catch {
          // Processes can exit while /proc is being inspected.
        }
      }
    }
  } catch {
    return null;
  }

  return { instances, watches };
}

async function main() {
  const requestedSerial = process.env.ANDROID_SERIAL;
  const onlineDevices = findOnlineDevices();
  if (onlineDevices.length === 0) {
    throw new Error("No online Android device found");
  }
  if (!requestedSerial && onlineDevices.length !== 1) {
    throw new Error(
      `Multiple Android devices found; set ANDROID_SERIAL (${onlineDevices.join(", ")})`
    );
  }
  if (requestedSerial && !onlineDevices.includes(requestedSerial)) {
    throw new Error(`ANDROID_SERIAL ${requestedSerial} is not online`);
  }

  const serial = requestedSerial ?? onlineDevices[0];
  const recentSessions = readRecentAgentDeviceSessions();
  const sessions = readAgentDeviceSessions();
  const matchingSessions =
    sessions
      ?.filter((session) => JSON.stringify(session).includes(serial))
      .filter(
        (session) =>
          !ALLOWED_SESSION || !JSON.stringify(session).includes(ALLOWED_SESSION)
      ) ?? [];
  const metroOpen = await isPortOpen(METRO_PORT);
  const metroHealth = metroOpen ? await readMetroHealth(METRO_PORT) : null;
  const metroBundleHealth = metroOpen
    ? await readMetroBundleHealth(METRO_PORT)
    : null;
  const portOwner = metroOpen ? readPortOwner(METRO_PORT) : null;
  const processInfo = readProcessInfo(portOwner?.pid);
  const inotifyUsage = readInotifyUsage();
  const projectDirectory = path.resolve(process.cwd());
  const metroOwnsProject =
    processInfo?.cwd && path.resolve(processInfo.cwd) === projectDirectory;
  const canReuseMetro =
    METRO_REUSE &&
    metroHealth?.healthy &&
    metroBundleHealth?.healthy &&
    metroOwnsProject;

  console.log(`Android device: ${serial}`);
  console.log(
    `Metro port ${METRO_PORT}: ${metroOpen ? "occupied" : "available"}`
  );
  console.log(
    `Metro health: ${
      metroHealth
        ? `${metroHealth.healthy ? "healthy" : "unhealthy"} (HTTP ${metroHealth.statusCode})`
        : "not running"
    }`
  );
  console.log(
    `Metro bundle: ${
      metroBundleHealth
        ? `${metroBundleHealth.healthy ? "healthy" : "unhealthy"} (HTTP ${metroBundleHealth.statusCode})`
        : "not checked"
    }`
  );
  console.log(
    `Agent-device session: ${
      sessions === null
        ? "CLI not inspectable"
        : matchingSessions.length > 0
          ? `${matchingSessions.length} CLI matching session(s)`
          : "no CLI matching session"
    }; recent records=${
      recentSessions.length > 0 ? recentSessions.join(", ") : "none"
    }`
  );
  console.log(
    `File descriptors: ${readOpenFileLimit()} (preflight process limit)`
  );
  const inotifyWatchesLimit = readInotifyLimitNumber("max_user_watches");
  const inotifyInstancesLimit = readInotifyLimitNumber("max_user_instances");
  const formattedInotifyUsage = inotifyUsage
    ? `${inotifyUsage.watches} watches across ${inotifyUsage.instances} instances`
    : "unavailable";
  console.log(
    `inotify usage: ${formattedInotifyUsage}; limits: watches=${
      inotifyWatchesLimit ?? "unavailable"
    }, instances=${inotifyInstancesLimit ?? "unavailable"}`
  );

  if (portOwner) {
    console.log(
      `Metro listener: pid=${portOwner.pid ?? "unknown"}, cwd=${
        processInfo?.cwd ?? "unknown"
      }, openFiles=${processInfo?.openFiles ?? "unknown"}, limit=${
        processInfo?.openFileLimit ?? "unknown"
      }`
    );
    console.log(`Metro command: ${processInfo?.command ?? portOwner.output}`);
  }
  if (
    inotifyUsage &&
    ((inotifyWatchesLimit !== null &&
      inotifyUsage.watches >= inotifyWatchesLimit * 0.9) ||
      (inotifyInstancesLimit !== null &&
        inotifyUsage.instances >= inotifyInstancesLimit * 0.9))
  ) {
    throw new Error(
      `inotify capacity is nearly exhausted (${formattedInotifyUsage}); stop stale file-watching processes before starting Metro`
    );
  }

  if (matchingSessions.length > 0 || recentSessions.length > 0) {
    throw new Error(
      `An agent-device session appears active; reuse it with AGENT_DEVICE_SESSION or close it before opening another (device ${serial})`
    );
  }
  if (metroOpen && !canReuseMetro) {
    throw new Error(
      `Metro port ${METRO_PORT} is occupied by a non-reusable or unhealthy listener; stop it, or set METRO_REUSE=1 only for a healthy listener rooted at ${projectDirectory}`
    );
  }
  if (canReuseMetro) {
    console.log("Metro reuse approved for the current project.");
  }

  console.log("Native validation preflight passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
