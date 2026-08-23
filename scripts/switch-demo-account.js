#!/usr/bin/env node

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');

const APP_PACKAGE = 'com.anonymous.KUQUestMobile';
const APP_SCHEME = 'kuquestmobile';
const VERSION = '1.0.0';

function printHelp() {
  process.stdout.write(`Usage: npm run demo:android:account -- --cookie-file <path> [options]

Import the userSessionCookie from a local Bruno environment into an Android
 development build. The cookie value is never printed.

Options:
  --cookie-file <path>  Bruno environment file containing userSessionCookie
  --serial <id>         Android emulator/device serial when more than one exists
  --json                Print machine-readable output
  --help                Show this help
  --version             Show the version

Examples:
  npm run demo:android:account -- --cookie-file ../KUQuest-API-Server/bruno/environments/local-demo/Demo.bru
  npm run demo:android:account -- --cookie-file ./demo.bru --serial emulator-5554
`);
}

function parseArgs(argv) {
  const options = { json: false };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help' || argument === '-h') {
      options.help = true;
    } else if (argument === '--version') {
      options.version = true;
    } else if (argument === '--json') {
      options.json = true;
    } else if (argument === '--cookie-file') {
      options.cookieFile = argv[++index];
    } else if (argument === '--serial') {
      options.serial = argv[++index];
    } else {
      throw new CliError(2, `Unknown option: ${argument}`);
    }
  }

  return options;
}

class CliError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function extractUserSessionCookie(content) {
  const match = content.match(/^\s*userSessionCookie:\s*(.*?)\s*$/m);
  const cookie = match?.[1]?.trim().replace(/^(['"])(.*)\1$/, '$2');
  if (!cookie) {
    throw new CliError(3, 'The Bruno environment does not contain userSessionCookie');
  }

  const sessionCookie = cookie.split(';').find((part) => {
    const name = part.slice(0, part.indexOf('=')).trim();
    return name === 'better-auth.session_token' || name === '__Secure-better-auth.session_token';
  });
  if (!sessionCookie || !sessionCookie.slice(sessionCookie.indexOf('=') + 1).trim()) {
    throw new CliError(3, 'userSessionCookie must contain a Better Auth session token');
  }

  return cookie;
}

function buildSessionImportLink(fileName) {
  return `${APP_SCHEME}://dev/import-session?file=${encodeURIComponent(fileName)}`;
}

function adbCommand(serial, args) {
  return ['-s', serial, ...args];
}

function runAdb(serial, args) {
  const result = spawnSync('adb', adbCommand(serial, args), {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.error) {
    throw new CliError(4, `Unable to run adb: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new CliError(4, (result.stderr || result.stdout || 'adb command failed').trim());
  }
  return result;
}

function findDevice(requestedSerial) {
  const result = spawnSync('adb', ['devices'], { encoding: 'utf8' });
  if (result.error) {
    throw new CliError(4, `Unable to run adb: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new CliError(4, (result.stderr || 'adb devices failed').trim());
  }

  const devices = result.stdout
    .split('\n')
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter(([serial, status]) => serial && status === 'device')
    .map(([serial]) => serial);

  if (requestedSerial) {
    if (!devices.includes(requestedSerial)) {
      throw new CliError(3, `Android device '${requestedSerial}' is not available`);
    }
    return requestedSerial;
  }
  if (devices.length === 0) {
    throw new CliError(75, 'No Android emulator/device is connected');
  }
  if (devices.length > 1) {
    throw new CliError(2, `More than one Android device is connected; use --serial (${devices.join(', ')})`);
  }
  return devices[0];
}

function writeOutput(options, data) {
  if (options.json) {
    process.stdout.write(`${JSON.stringify({ status: 'ok', data, warnings: [] })}\n`);
    return;
  }
  process.stdout.write(`Imported demo session into ${data.serial}.\n`);
  process.stdout.write('The app was restarted through the development-only session import route.\n');
}

function writeError(options, error) {
  if (options.json) {
    process.stderr.write(`${JSON.stringify({
      status: 'error',
      error: { code: error.code ?? 1, message: error.message, transient: error.code === 75 },
    })}\n`);
    return;
  }
  process.stderr.write(`Error: ${error.message}\n`);
}

function main(argv = process.argv.slice(2)) {
  let options;
  let localHandoffDirectory;
  try {
    options = parseArgs(argv);
    if (options.help) {
      printHelp();
      return 0;
    }
    if (options.version) {
      process.stdout.write(`${VERSION}\n`);
      return 0;
    }
    if (!options.cookieFile) {
      throw new CliError(2, 'Missing --cookie-file. Run with --help for examples.');
    }

    const cookieFile = path.resolve(options.cookieFile);
    const cookie = extractUserSessionCookie(fs.readFileSync(cookieFile, 'utf8'));
    const serial = findDevice(options.serial);
    const handoffFileName = `.kuquest-session-${randomUUID()}`;
    localHandoffDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'kuquest-demo-'));
    const localHandoffPath = path.join(localHandoffDirectory, handoffFileName);
    const remoteTemporaryPath = `/data/local/tmp/${handoffFileName}`;
    fs.writeFileSync(localHandoffPath, cookie, { encoding: 'utf8', mode: 0o600 });

    runAdb(serial, ['shell', 'am', 'force-stop', APP_PACKAGE]);
    runAdb(serial, ['push', localHandoffPath, remoteTemporaryPath]);
    runAdb(serial, ['shell', 'run-as', APP_PACKAGE, 'cp', remoteTemporaryPath, `files/${handoffFileName}`]);
    runAdb(serial, ['shell', 'rm', '-f', remoteTemporaryPath]);
    runAdb(serial, [
      'shell', 'am', 'start', '-W',
      '-a', 'android.intent.action.VIEW',
      '-d', buildSessionImportLink(handoffFileName),
    ]);

    writeOutput(options, { package: APP_PACKAGE, serial });
    return 0;
  } catch (error) {
    const cliError = error instanceof CliError
      ? error
      : new CliError(1, error instanceof Error ? error.message : String(error));
    writeError(options ?? { json: false }, cliError);
    return cliError.code;
  } finally {
    if (localHandoffDirectory) {
      fs.rmSync(localHandoffDirectory, { force: true, recursive: true });
    }
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = { extractUserSessionCookie, buildSessionImportLink, main, parseArgs };


