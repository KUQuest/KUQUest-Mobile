const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const DEFAULT_ROOT = path.resolve(__dirname, "..");
const UNSTYLED_MODULES = [
  "react-native",
  "react-native-reanimated",
  "react-native-safe-area-context",
  "expo-image",
  "expo-router",
];
const ACCENT_VARIABLES = [
  "--color-ku-primary",
  "--color-ku-primary-dark",
  "--color-ku-primary-deep",
  "--color-ku-surface-accent",
  "--color-ku-border-accent",
  "--color-ku-on-primary",
];
const INTENTIONAL_LITERAL_FILES = new Set([
  "src/components/ui/ImageViewerModal.tsx",
  "src/features/onboarding/styles/registrationStyles.ts",
  "src/features/wallet/components/TopUpPromptPayStep.tsx",
  "src/features/wallet/WalletPaymentModal.tsx",
]);

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }
    if (
      /\.(tsx|ts)$/.test(entry.name) &&
      !entry.name.endsWith(".test.ts") &&
      !entry.name.endsWith(".test.tsx") &&
      !entry.name.endsWith(".spec.ts") &&
      !entry.name.endsWith(".spec.tsx") &&
      !fullPath.includes(`${path.sep}__tests__${path.sep}`)
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

function importedBindings(sourceFile, moduleName) {
  const direct = new Set();
  const namespaces = new Set();

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (statement.moduleSpecifier.text !== moduleName) continue;

    const clause = statement.importClause;
    if (!clause || clause.isTypeOnly) continue;
    if (clause.name) direct.add(clause.name.text);

    const namedBindings = clause.namedBindings;
    if (!namedBindings) continue;
    if (ts.isNamedImports(namedBindings)) {
      for (const element of namedBindings.elements) {
        if (!element.isTypeOnly) direct.add(element.name.text);
      }
    } else if (ts.isNamespaceImport(namedBindings)) {
      namespaces.add(namedBindings.name.text);
    }
  }

  return { direct, namespaces };
}

function tagRootName(tagName) {
  if (ts.isIdentifier(tagName)) return tagName.text;
  if (
    ts.isPropertyAccessExpression(tagName) &&
    ts.isIdentifier(tagName.expression)
  ) {
    return tagName.expression.text;
  }
  return null;
}

function hasClassNameAttribute(node) {
  const attributes = ts.isJsxElement(node)
    ? node.openingElement.attributes
    : node.attributes;
  return attributes.properties.some(
    (property) =>
      ts.isJsxAttribute(property) && property.name.text === "className"
  );
}

function findNativeClassNameViolations(sourceText, fileName = "source.tsx") {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const direct = new Set();
  const namespaces = new Set();
  for (const moduleName of UNSTYLED_MODULES) {
    const bindings = importedBindings(sourceFile, moduleName);
    for (const binding of bindings.direct) direct.add(binding);
    for (const binding of bindings.namespaces) namespaces.add(binding);
  }
  const violations = [];

  function visit(node) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      if (hasClassNameAttribute(node)) {
        const tagName = ts.isJsxElement(node)
          ? node.openingElement.tagName
          : node.tagName;
        const rootName = tagRootName(tagName);
        if (rootName && (direct.has(rootName) || namespaces.has(rootName))) {
          const position = sourceFile.getLineAndCharacterOfPosition(
            node.getStart(sourceFile)
          );
          violations.push({
            fileName,
            line: position.line + 1,
            column: position.character + 1,
            tag: rootName,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

function findMissingScaleTokens(rootDir) {
  const cssPath = path.join(rootDir, "src/global.css");
  const cnPath = path.join(rootDir, "src/tw/cn.ts");
  const css = fs.readFileSync(cssPath, "utf8");
  const cn = fs.readFileSync(cnPath, "utf8");
  const missing = [];
  const declarationPattern = /--(text|spacing|radius)-([a-z0-9-]+):/g;

  for (const match of css.matchAll(declarationPattern)) {
    const kind = match[1];
    const token = match[2].split("--", 1)[0];
    if (!token.startsWith("ku-")) continue;
    const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const quotedToken = new RegExp(`(["'])${escapedToken}\\1`);
    if (!quotedToken.test(cn)) {
      missing.push(
        `src/global.css declares --${kind}-${token}, but src/tw/cn.ts does not register ${token}`
      );
    }
  }
  return missing;
}

function findMissingAccentWiring(rootDir) {
  const files = {
    css: fs.readFileSync(path.join(rootDir, "src/global.css"), "utf8"),
    provider: fs.readFileSync(
      path.join(rootDir, "src/features/workspace/AppThemeProvider.tsx"),
      "utf8"
    ),
    metro: fs.readFileSync(path.join(rootDir, "metro.config.js"), "utf8"),
  };
  const providerUsesPaletteMapper =
    files.provider.includes("toCssVariable") &&
    files.provider.includes("Object.entries(themeColors)");
  const missing = [];

  for (const variable of ACCENT_VARIABLES) {
    for (const [owner, source] of Object.entries(files)) {
      if (
        !source.includes(variable) &&
        !(owner === "provider" && providerUsesPaletteMapper)
      ) {
        missing.push(`${variable} is missing from ${owner}`);
      }
    }
  }
  return missing;
}

function findUnexpectedLiteralForegrounds(rootDir) {
  const violations = [];
  const patterns = [
    /\btext-ku-white\b/,
    /\b(?:colors|themeColors|palette)\.white\b/,
    /\bborder-ku-white\b/,
  ];

  for (const filePath of walk(path.join(rootDir, "src"))) {
    const relativePath = path.relative(rootDir, filePath);
    if (INTENTIONAL_LITERAL_FILES.has(relativePath)) continue;
    const source = fs.readFileSync(filePath, "utf8");
    if (patterns.some((pattern) => pattern.test(source))) {
      violations.push(
        `${relativePath} uses an unapproved literal white foreground; use ku-on-primary or document the surface`
      );
    }
  }
  return violations;
}

function auditNativeWind({ rootDir = DEFAULT_ROOT } = {}) {
  const violations = [];
  const sourceRoot = path.join(rootDir, "src");

  for (const filePath of walk(sourceRoot)) {
    const relativePath = path.relative(rootDir, filePath);
    const source = fs.readFileSync(filePath, "utf8");
    for (const violation of findNativeClassNameViolations(
      source,
      relativePath
    )) {
      violations.push(
        `${violation.fileName}:${violation.line}:${violation.column} uses className on an unstyled native component ${violation.tag}; import the styled primitive from @/tw`
      );
    }
  }

  violations.push(...findMissingScaleTokens(rootDir));
  violations.push(...findMissingAccentWiring(rootDir));
  violations.push(...findUnexpectedLiteralForegrounds(rootDir));
  return violations;
}

if (require.main === module) {
  const violations = auditNativeWind();
  if (violations.length > 0) {
    console.error("NativeWind audit failed:");
    for (const violation of violations) console.error(`- ${violation}`);
    process.exitCode = 1;
  } else {
    console.log("NativeWind audit passed.");
  }
}

module.exports = {
  auditNativeWind,
  findMissingAccentWiring,
  findMissingScaleTokens,
  findNativeClassNameViolations,
  findUnexpectedLiteralForegrounds,
};
