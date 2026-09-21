const fs = require("fs");
const path = require("path");

// Ratchet gate for lifecycle enum literals.
//
// The named-value contract lives in `src/features/questBoard/types.ts`
// (QuestStatus, QuestTeamStatus, QuestMode, ...) and the drift guard test
// `src/features/questBoard/__tests__/lifecycleEnumConsistency.test.ts` pins it
// against the wire schemas in `src/api/questV2Contracts.ts`. New production
// code must compare against the named values, not re-inline the wire string.
//
// The gate counts raw literals across `src` (excluding tests and the two
// contract files) and fails when the count grows past the committed baseline.
// Migrate call sites to the named enums to lower the count, then run
// `node scripts/check-enum-literals.js --update` to ratchet the baseline down.

const DEFAULT_ROOT = path.resolve(__dirname, "..");
const BASELINE_PATH = path.join(__dirname, "enum-literals-baseline.json");

// The two declaration sites legitimately contain the literals.
const CONTRACT_FILES = new Set([
  "src/features/questBoard/types.ts",
  "src/api/questV2Contracts.ts",
]);

const LIFECYCLE_LITERAL = new RegExp(
  [
    String.raw`"(?:QUEST|TEAM|APPLICATION|PROOF|EDIT|ASSIGNMENT|INVITATION|UNDERFILLED|CONSENT)[A-Z0-9_]*"`,
    String.raw`"(?:SOLO|GROUP|SINGLE|CANDIDATE|NO_CANDIDATE|FIRST_COME_FIRST_SERVED|FIRST_COME|PROCEED|ACCEPT|DECLINE)"`,
  ].join("|"),
  "g"
);

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "__tests__") continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.tsx?$/.test(entry.name)) files.push(full);
  }
  return files;
}

function countLiterals(rootDir) {
  const perFile = new Map();
  let total = 0;
  for (const filePath of walk(path.join(rootDir, "src"))) {
    const relative = path.relative(rootDir, filePath);
    if (CONTRACT_FILES.has(relative)) continue;
    const source = fs.readFileSync(filePath, "utf8");
    const count = (source.match(LIFECYCLE_LITERAL) || []).length;
    if (count > 0) {
      perFile.set(relative, count);
      total += count;
    }
  }
  return { total, perFile };
}

function main() {
  const rootDir = DEFAULT_ROOT;
  const { total, perFile } = countLiterals(rootDir);
  const baseline = fs.existsSync(BASELINE_PATH)
    ? JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"))
    : null;

  if (process.argv.includes("--update")) {
    const top = [...perFile.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([file, count]) => ({ file, count }));
    fs.writeFileSync(
      BASELINE_PATH,
      `${JSON.stringify({ total, top }, null, 2)}\n`
    );
    console.log(`Enum literal baseline updated: ${total} remaining literals.`);
    return;
  }

  if (!baseline) {
    console.error(
      "Missing scripts/enum-literals-baseline.json. Run: node scripts/check-enum-literals.js --update"
    );
    process.exitCode = 1;
    return;
  }

  if (total > baseline.total) {
    console.error(
      `Lifecycle enum literal ratchet exceeded: ${total} > baseline ${baseline.total}`
    );
    console.error(
      "Compare against the named values in src/features/questBoard/types.ts (e.g. QuestStatus.QUEST_FAILED), not raw strings."
    );
    const offenders = [...perFile.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([file, count]) => `  ${count}  ${file}`)
      .join("\n");
    console.error(offenders);
    process.exitCode = 1;
    return;
  }

  if (total < baseline.total) {
    console.log(
      `Enum literal audit passed: ${total} literals (${baseline.total - total} fewer than baseline). Run --update to ratchet down.`
    );
    return;
  }

  console.log(`Enum literal audit passed: ${total} literals at baseline.`);
}

main();
