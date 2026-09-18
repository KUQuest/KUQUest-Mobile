#!/usr/bin/env node

/**
 * Flags a static route file nested under a dynamic `[param]/` segment
 * (e.g. `src/app/quest/[id]/manage.tsx`) that no other file in `src/`
 * references by its leaf path segment (e.g. "/manage"). expo-router
 * mounts every file under src/app/ automatically, so nothing else forces
 * these to stay wired to real navigation once their one caller changes.
 *
 * This is a heuristic (string search, not an AST route resolver): a hit
 * confirms a reference exists, but a miss only means "verify manually
 * before deleting" - it does not prove the route is truly unreachable.
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
      if (!SKIP_DIRS.has(entry.name))
        findStaticLeaves(path.join(dir, entry.name), leaves);
      continue;
    }
    if (!entry.name.endsWith(".tsx") || entry.name.endsWith(".test.tsx"))
      continue;
    if (SKIP_FILES.has(entry.name)) continue;
    if (!path.basename(dir).startsWith("[")) continue;
    leaves.push({
      leaf: entry.name.replace(/\.tsx$/, ""),
      file: path.join(dir, entry.name),
    });
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

const leaves = [];
findStaticLeaves(APP_DIR, leaves);

let orphaned = 0;
for (const { leaf, file } of leaves) {
  const refs = referencesElsewhere(leaf, file);
  const rel = path.relative(process.cwd(), file);
  if (refs === 0) {
    orphaned++;
    console.log(
      `⚠️  ${rel} — no reference to "/${leaf}" found elsewhere in src/`
    );
  } else {
    console.log(`✅ ${rel} — ${refs} file(s) reference "/${leaf}"`);
  }
}

if (orphaned > 0) {
  console.log(
    `\n${orphaned} potentially orphaned route(s). Verify manually before deleting.`
  );
  process.exit(1);
}
console.log("\nNo orphaned dynamic sub-routes detected.");
