#!/usr/bin/env node

/**
 * Flags two classes of Expo Router mistakes:
 *
 * 1. A static route file nested under a dynamic `[param]/` segment
 *    (e.g. `src/app/quest/[id]/manage.tsx`) that no other file in `src/`
 *    references by its leaf path segment (e.g. "/manage").
 * 2. A route module under `src/app/` without a default export. Expo Router
 *    mounts every file under `src/app/` automatically, so support modules
 *    must live outside that directory.
 *
 * This is a heuristic (string search and export check, not an AST route
 * resolver): a hit confirms a reference exists, but a miss means "verify
 * manually" rather than proving a route is unreachable.
 */

const fs = require("fs");
const path = require("path");

const APP_DIR = path.resolve(__dirname, "../src/app");
const SRC_DIR = path.resolve(__dirname, "../src");
const SKIP_DIRS = new Set(["__tests__"]);
const SKIP_FILES = new Set(["_layout.tsx", "+not-found.tsx", "+html.tsx"]);

function findStaticLeaves(dir, leaves) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        findStaticLeaves(path.join(dir, entry.name), leaves);
      }
      continue;
    }
    if (!entry.name.endsWith(".tsx") || entry.name.endsWith(".test.tsx")) {
      continue;
    }
    if (SKIP_FILES.has(entry.name)) continue;
    if (!path.basename(dir).startsWith("[")) continue;
    leaves.push({
      leaf: entry.name.replace(/\.tsx$/, ""),
      file: path.join(dir, entry.name),
    });
  }
}

function findRouteModules(dir, modules) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        findRouteModules(path.join(dir, entry.name), modules);
      }
      continue;
    }
    if (!entry.name.endsWith(".tsx") || entry.name.endsWith(".test.tsx")) {
      continue;
    }
    if (SKIP_FILES.has(entry.name)) continue;
    modules.push(path.join(dir, entry.name));
  }
}

function referencesElsewhere(leaf, excludeFile) {
  const needles = [`/${leaf}"`, `/${leaf}\``, `/${leaf}'`];
  const stack = [SRC_DIR];
  let count = 0;
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(entry.name) || full === excludeFile) continue;
      const text = fs.readFileSync(full, "utf8");
      if (needles.some((needle) => text.includes(needle))) count++;
    }
  }
  return count;
}

function hasDefaultExport(file) {
  const source = fs.readFileSync(file, "utf8");
  return (
    /\bexport\s+default\b/.test(source) ||
    /\bexport\s*\{\s*default\b/.test(source) ||
    /\bexport\s*\{[^}]*\bas\s+default\b/.test(source)
  );
}

const leaves = [];
const routeModules = [];
findStaticLeaves(APP_DIR, leaves);
findRouteModules(APP_DIR, routeModules);

let orphaned = 0;
for (const { leaf, file } of leaves) {
  const refs = referencesElsewhere(leaf, file);
  const rel = path.relative(process.cwd(), file);
  if (refs === 0) {
    orphaned++;
    console.log(`${rel} — no reference to "/${leaf}" found elsewhere in src/`);
  } else {
    console.log(`${rel} — ${refs} file(s) reference "/${leaf}"`);
  }
}

let invalidModules = 0;
for (const file of routeModules) {
  if (hasDefaultExport(file)) continue;
  invalidModules++;
  console.error(
    `${path.relative(process.cwd(), file)} — route modules require a default export`
  );
}

if (orphaned > 0 || invalidModules > 0) {
  if (orphaned > 0) {
    console.error(
      `\n${orphaned} potentially orphaned route(s). Verify manually before deleting.`
    );
  }
  if (invalidModules > 0) {
    console.error(
      `\n${invalidModules} route module(s) are missing a default export.`
    );
  }
  process.exit(1);
}

console.log("\nNo orphaned or invalid route modules detected.");
