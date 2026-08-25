#!/usr/bin/env node

const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { Writable } = require('node:stream');
const readline = require('node:readline/promises');

const VERSION = '1.0.0';
const ENVIRONMENT_CONFIG = {
  staging: {
    alias: 'kuquest-staging',
    distinguishedName: 'CN=KUQuest Android Staging, OU=Mobile, O=KUQuest, C=TH',
    packageName: 'com.kuquest.mobile.staging',
  },
  production: {
    alias: 'kuquest-production',
    distinguishedName: 'CN=KUQuest Android Production, OU=Mobile, O=KUQuest, C=TH',
    packageName: 'com.kuquest.mobile',
  },
};

class CliError extends Error {
  constructor(code, message, fix) {
    super(message);
    this.code = code;
    this.fix = fix;
  }
}

function printHelp() {
  process.stdout.write(`Generate stable Android signing keys and upload them to GitHub Environments.

Usage:
  node scripts/bootstrap-android-signing.js generate --environment <name> --keystore <path> [options]
  node scripts/bootstrap-android-signing.js upload --environment <name> --keystore <path> [options]

Commands:
  generate  Create a JKS keystore and print its SHA-1/SHA-256 fingerprints
  upload    Verify a keystore and send its credentials directly to GitHub secrets

Options:
  --environment <name>  staging or production
  --keystore <path>     Explicit keystore path outside the repository
  --alias <name>        Key alias (default: kuquest-staging or kuquest-production)
  --backup-file <path>  Required identical backup for production uploads
  --repository <owner/repo>  GitHub repository (default: current gh repository)
  --dry-run             Validate and describe changes without mutating local or remote state
  --json                Print machine-readable output
  --help                Show this help
  --version             Show the script version

Passwords are read without echo from a terminal. For non-interactive use, set
KUQUEST_KEYSTORE_PASSWORD and KUQUEST_KEY_PASSWORD; secrets are never accepted
as command-line flags.

Examples:
  node scripts/bootstrap-android-signing.js generate --environment staging --keystore /secure/kuquest-staging.jks
  node scripts/bootstrap-android-signing.js upload --environment staging --keystore /secure/kuquest-staging.jks
  node scripts/bootstrap-android-signing.js upload --environment production --keystore /secure/kuquest-production.jks --backup-file /vault/kuquest-production.jks
`);
}

function parseArgs(argv) {
  const options = { dryRun: false, json: false };
  if (argv.length === 0 || argv[0].startsWith('-')) {
    throw new CliError(2, 'Missing command: use generate or upload', 'Run with --help for examples.');
  }
  options.command = argv[0];
  if (options.command !== 'generate' && options.command !== 'upload') {
    throw new CliError(2, `Unknown command: ${options.command}`, 'Use generate or upload.');
  }

  for (let index = 1; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help' || argument === '-h') {
      options.help = true;
    } else if (argument === '--version') {
      options.version = true;
    } else if (argument === '--json') {
      options.json = true;
    } else if (argument === '--dry-run') {
      options.dryRun = true;
    } else if (argument === '--environment') {
      options.environment = argv[++index];
    } else if (argument === '--keystore') {
      options.keystore = argv[++index];
    } else if (argument === '--alias') {
      options.alias = argv[++index];
    } else if (argument === '--backup-file') {
      options.backupFile = argv[++index];
    } else if (argument === '--repository') {
      options.repository = argv[++index];
    } else {
      throw new CliError(2, `Unknown option: ${argument}`, 'Run with --help for supported options.');
    }
  }
  return options;
}

function validateOptions(options) {
  if (!ENVIRONMENT_CONFIG[options.environment]) {
    throw new CliError(2, '--environment must be staging or production');
  }
  if (!options.keystore) {
    throw new CliError(2, 'Missing --keystore', 'Choose a secure path outside the repository.');
  }

  options.keystore = path.resolve(options.keystore);
  options.alias ??= ENVIRONMENT_CONFIG[options.environment].alias;
  if (!/^[A-Za-z0-9._-]+$/.test(options.alias)) {
    throw new CliError(2, 'Key alias may contain only letters, digits, dot, underscore, and hyphen.');
  }

  const relativeToRepository = path.relative(process.cwd(), options.keystore);
  if (relativeToRepository !== '..' && !relativeToRepository.startsWith(`..${path.sep}`)) {
    throw new CliError(
      78,
      'Keystore path must be outside the repository checkout',
      'Use an administrator-controlled path such as /secure/kuquest-production.jks.',
    );
  }
  if (options.backupFile) {
    options.backupFile = path.resolve(options.backupFile);
  }
  return options;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    env: options.env ?? process.env,
    input: options.input,
    stdio: options.input === undefined ? ['ignore', 'pipe', 'pipe'] : ['pipe', 'pipe', 'pipe'],
  });
  if (result.error) {
    throw new CliError(3, `Unable to run ${command}: ${result.error.message}`, `Install ${command} and retry.`);
  }
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || `${command} exited ${result.status}`).trim();
    throw new CliError(options.failureCode ?? 1, `${command} failed: ${detail}`, options.fix);
  }
  return result.stdout.trim();
}

async function readSecret(label) {
  if (!process.stdin.isTTY) {
    throw new CliError(
      78,
      `${label} is unavailable in non-interactive mode`,
      'Set KUQUEST_KEYSTORE_PASSWORD and KUQUEST_KEY_PASSWORD.',
    );
  }
  process.stderr.write(`${label}: `);
  const hiddenOutput = new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });
  const prompt = readline.createInterface({ input: process.stdin, output: hiddenOutput, terminal: true });
  const value = await prompt.question('');
  prompt.close();
  process.stderr.write('\n');
  return value;
}

async function credentials(confirmValues) {
  const storePassword = process.env.KUQUEST_KEYSTORE_PASSWORD ?? await readSecret('Keystore password');
  const keyPassword = process.env.KUQUEST_KEY_PASSWORD ?? await readSecret('Key password');
  if (storePassword.length < 6 || keyPassword.length < 6) {
    throw new CliError(78, 'Android keystore passwords must contain at least 6 characters.');
  }

  if (confirmValues && !process.env.KUQUEST_KEYSTORE_PASSWORD) {
    const confirmation = await readSecret('Confirm keystore password');
    if (confirmation !== storePassword) {
      throw new CliError(78, 'Keystore password confirmation does not match.');
    }
  }
  if (confirmValues && !process.env.KUQUEST_KEY_PASSWORD) {
    const confirmation = await readSecret('Confirm key password');
    if (confirmation !== keyPassword) {
      throw new CliError(78, 'Key password confirmation does not match.');
    }
  }
  return { keyPassword, storePassword };
}

function keytoolEnvironment(signingCredentials) {
  return {
    ...process.env,
    KUQUEST_KEY_PASSWORD: signingCredentials.keyPassword,
    KUQUEST_STORE_PASSWORD: signingCredentials.storePassword,
  };
}

function inspectKeystore(options, signingCredentials) {
  const output = run('keytool', [
    '-list', '-v',
    '-keystore', options.keystore,
    '-alias', options.alias,
    '-storepass:env', 'KUQUEST_STORE_PASSWORD',
  ], {
    env: keytoolEnvironment(signingCredentials),
    failureCode: 78,
    fix: 'Check the keystore path, alias, and password.',
  });
  const sha1 = output.match(/^\s*SHA1:\s*(.+)$/m)?.[1]?.trim();
  const sha256 = output.match(/^\s*SHA256:\s*(.+)$/m)?.[1]?.trim();
  if (!sha1 || !sha256) {
    throw new CliError(1, 'keytool did not report SHA-1 and SHA-256 fingerprints.');
  }
  return { sha1, sha256 };
}

function sha256(file) {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function verifyProductionBackup(options) {
  if (options.environment !== 'production') {
    return;
  }
  if (!options.backupFile) {
    throw new CliError(
      78,
      'Production upload requires --backup-file',
      'Copy the keystore to encrypted offline storage, then pass that distinct backup path.',
    );
  }
  if (!fs.existsSync(options.backupFile)) {
    throw new CliError(3, `Production backup does not exist: ${options.backupFile}`);
  }
  if (fs.realpathSync(options.backupFile) === fs.realpathSync(options.keystore)) {
    throw new CliError(78, 'Production backup must be a distinct file.');
  }
  if (sha256(options.backupFile) !== sha256(options.keystore)) {
    throw new CliError(78, 'Production backup does not match the signing keystore.');
  }
}

function resolveRepository(requestedRepository) {
  const repository = requestedRepository ?? run('gh', [
    'repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner',
  ], { failureCode: 4, fix: 'Run gh auth login from the KUQuest repository.' });
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new CliError(2, `Invalid GitHub repository: ${repository}`);
  }
  return repository;
}

async function generate(options) {
  if (fs.existsSync(options.keystore)) {
    throw new CliError(5, `Keystore already exists: ${options.keystore}`, 'Use upload or choose a new path; keys are never overwritten.');
  }
  if (options.dryRun) {
    return { alias: options.alias, environment: options.environment, keystore: options.keystore, planned: 'generate' };
  }

  const signingCredentials = await credentials(true);
  fs.mkdirSync(path.dirname(options.keystore), { mode: 0o700, recursive: true });
  run('keytool', [
    '-genkeypair',
    '-keystore', options.keystore,
    '-storetype', 'JKS',
    '-alias', options.alias,
    '-keyalg', 'RSA',
    '-keysize', '4096',
    '-sigalg', 'SHA256withRSA',
    '-validity', '10000',
    '-dname', ENVIRONMENT_CONFIG[options.environment].distinguishedName,
    '-storepass:env', 'KUQUEST_STORE_PASSWORD',
    '-keypass:env', 'KUQUEST_KEY_PASSWORD',
  ], { env: keytoolEnvironment(signingCredentials), failureCode: 78 });
  fs.chmodSync(options.keystore, 0o600);
  const fingerprints = inspectKeystore(options, signingCredentials);
  return {
    alias: options.alias,
    environment: options.environment,
    keystore: options.keystore,
    packageName: ENVIRONMENT_CONFIG[options.environment].packageName,
    ...fingerprints,
    uploaded: false,
  };
}

async function upload(options) {
  if (!fs.existsSync(options.keystore)) {
    throw new CliError(3, `Keystore does not exist: ${options.keystore}`, 'Run the generate command first.');
  }
  const signingCredentials = await credentials(false);
  const fingerprints = inspectKeystore(options, signingCredentials);
  verifyProductionBackup(options);
  const repository = resolveRepository(options.repository);

  if (!options.dryRun) {
    run('gh', ['auth', 'status'], { failureCode: 4, fix: 'Run gh auth login and retry.' });
    run('gh', ['api', `repos/${repository}/environments/${options.environment}`], {
      failureCode: 3,
      fix: `Create the ${options.environment} GitHub Environment before uploading secrets.`,
    });
    const secrets = {
      ANDROID_KEYSTORE_BASE64: fs.readFileSync(options.keystore).toString('base64'),
      ANDROID_KEYSTORE_PASSWORD: signingCredentials.storePassword,
      ANDROID_KEY_ALIAS: options.alias,
      ANDROID_KEY_PASSWORD: signingCredentials.keyPassword,
    };
    for (const [name, value] of Object.entries(secrets)) {
      run('gh', ['secret', 'set', name, '--env', options.environment, '--repo', repository], {
        input: value,
        failureCode: 4,
        fix: `Verify admin access to ${repository} and rerun upload; uploads are idempotent.`,
      });
    }
  }

  return {
    alias: options.alias,
    environment: options.environment,
    keystore: options.keystore,
    packageName: ENVIRONMENT_CONFIG[options.environment].packageName,
    repository,
    ...fingerprints,
    uploaded: !options.dryRun,
  };
}

function writeSuccess(options, data) {
  if (options.json) {
    process.stdout.write(`${JSON.stringify({ status: 'ok', data, warnings: [] })}\n`);
    return;
  }
  if (data.planned) {
    process.stdout.write(`Would ${data.planned} ${data.environment} signing key at ${data.keystore}.\n`);
    return;
  }
  process.stdout.write(`Android ${data.environment} signing key verified.\n`);
  process.stdout.write(`Package: ${data.packageName}\nAlias: ${data.alias}\nSHA-1: ${data.sha1}\nSHA-256: ${data.sha256}\n`);
  if (data.uploaded) {
    process.stdout.write(`Secrets uploaded to ${data.repository} Environment '${data.environment}'.\n`);
  } else {
    process.stdout.write(`Next: register both fingerprints for ${data.packageName}, back up production keys, then run the upload command.\n`);
  }
}

function writeError(options, error) {
  if (options?.json) {
    process.stderr.write(`${JSON.stringify({
      status: 'error',
      error: {
        code: error.code ?? 1,
        message: error.message,
        fix: error.fix,
        transient: error.code === 75,
      },
    })}\n`);
    return;
  }
  process.stderr.write(`Error: ${error.message}\n`);
  if (error.fix) {
    process.stderr.write(`Fix: ${error.fix}\n`);
  }
}

async function main(argv = process.argv.slice(2)) {
  let options;
  try {
    if (argv.includes('--help') || argv.includes('-h')) {
      printHelp();
      return 0;
    }
    if (argv.includes('--version')) {
      process.stdout.write(`${VERSION}\n`);
      return 0;
    }
    options = validateOptions(parseArgs(argv));
    const data = options.command === 'generate' ? await generate(options) : await upload(options);
    writeSuccess(options, data);
    return 0;
  } catch (error) {
    const cliError = error instanceof CliError
      ? error
      : new CliError(1, error instanceof Error ? error.message : String(error));
    writeError(options, cliError);
    return cliError.code;
  }
}

if (require.main === module) {
  main().then((exitCode) => {
    process.exitCode = exitCode;
  });
}

module.exports = { main, parseArgs, validateOptions, verifyProductionBackup };
