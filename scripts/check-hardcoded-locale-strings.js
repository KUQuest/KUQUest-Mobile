const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const DEFAULT_ROOT = path.resolve(__dirname, "..");
const BASELINE_PATH = path.join(
  __dirname,
  "hardcoded-locale-strings-baseline.json"
);
// Ratchet Thai display text selected inline by locale ternaries.
// Locale dictionary lookups and platform locale identifiers are not findings.
const THAI_TEXT = /[\u0E00-\u0E7F]/;
const LOCALE_CODES = new Set(["en", "th"]);
const FILE_EXTENSION = /\.tsx?$/;

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "__tests__") continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath, files);
    else if (FILE_EXTENSION.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

function collectText(node, values = []) {
  if (ts.isStringLiteralLike(node)) {
    values.push(node.text);
    return values;
  }
  if (ts.isJsxText(node)) {
    values.push(node.text);
    return values;
  }
  if (ts.isTemplateExpression(node)) {
    values.push(node.head.text);
    for (const span of node.templateSpans) values.push(span.literal.text);
    return values;
  }
  ts.forEachChild(node, (child) => {
    collectText(child, values);
  });
  return values;
}

function isLocaleCode(node) {
  return (
    ts.isStringLiteralLike(node) && LOCALE_CODES.has(node.text.toLowerCase())
  );
}

function isLocaleComparison(node) {
  if (!ts.isBinaryExpression(node)) return false;
  const operator = node.operatorToken.kind;
  if (
    operator !== ts.SyntaxKind.EqualsEqualsEqualsToken &&
    operator !== ts.SyntaxKind.EqualsEqualsToken &&
    operator !== ts.SyntaxKind.ExclamationEqualsEqualsToken &&
    operator !== ts.SyntaxKind.ExclamationEqualsToken
  ) {
    return false;
  }
  const left = node.left;
  const right = node.right;
  return (
    (ts.isIdentifier(left) && left.text === "locale" && isLocaleCode(right)) ||
    (ts.isIdentifier(right) && right.text === "locale" && isLocaleCode(left))
  );
}

function hasText(values) {
  return values.some((value) => value.trim().length > 0);
}

function findHardcodedLocaleStrings(sourceText, file = "source.tsx") {
  const scriptKind = file.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );
  const findings = [];

  function visit(node) {
    if (
      ts.isConditionalExpression(node) &&
      isLocaleComparison(node.condition)
    ) {
      const trueText = collectText(node.whenTrue);
      const falseText = collectText(node.whenFalse);
      if (
        hasText(trueText) &&
        hasText(falseText) &&
        THAI_TEXT.test(trueText.join(" ") + falseText.join(" "))
      ) {
        findings.push({
          file,
          line:
            sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
              .line + 1,
        });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return findings;
}

function scanSource(rootDir) {
  const sourceRoot = path.join(rootDir, "src");
  const findings = [];
  for (const filePath of walk(sourceRoot)) {
    const file = path.relative(rootDir, filePath);
    const source = fs.readFileSync(filePath, "utf8");
    findings.push(...findHardcodedLocaleStrings(source, file));
  }
  return findings;
}

function findingsByFile(findings) {
  const counts = new Map();
  for (const { file } of findings) {
    counts.set(file, (counts.get(file) ?? 0) + 1);
  }
  return counts;
}

function printFindings(findings) {
  for (const { file, line } of findings) console.log(`  ${file}:${line}`);
}

function main() {
  const findings = scanSource(DEFAULT_ROOT);
  const counts = findingsByFile(findings);
  const total = findings.length;
  const baseline = fs.existsSync(BASELINE_PATH)
    ? JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"))
    : null;

  if (process.argv.includes("--update")) {
    const top = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([file, count]) => ({ file, count }));
    fs.writeFileSync(
      BASELINE_PATH,
      `${JSON.stringify({ total, top }, null, 2)}\n`
    );
    console.log(`Locale string baseline updated: ${total} findings.`);
    return;
  }

  if (!baseline) {
    console.error(
      "Missing scripts/hardcoded-locale-strings-baseline.json. Run: node scripts/check-hardcoded-locale-strings.js --update"
    );
    process.exitCode = 1;
    return;
  }

  if (total > baseline.total) {
    console.error(
      `Hardcoded locale string ratchet exceeded: ${total} > baseline ${baseline.total}`
    );
    console.error("Move Thai/English display copy into src/locales/.");
    process.exitCode = 1;
  } else if (total < baseline.total) {
    console.log(
      `Locale string audit passed: ${total} findings (${baseline.total - total} fewer than baseline). Run --update to ratchet down.`
    );
  } else {
    console.log(`Locale string audit passed: ${total} findings at baseline.`);
  }
  printFindings(findings);
}

if (require.main === module) main();

module.exports = { findHardcodedLocaleStrings };
