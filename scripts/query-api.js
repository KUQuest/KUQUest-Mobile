#!/usr/bin/env node

/**
 * Fast CLI query tool for the KUQuest OpenAPI specification (docs/api/api.yaml).
 * Supports search, endpoint inspection, schema viewing, tags browsing, and interactive exploration.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Paths
const SPEC_FILE = path.resolve(__dirname, "../docs/api/api.yaml");
const CACHE_DIR = path.resolve(__dirname, "../node_modules/.cache");
const CACHE_FILE = path.resolve(CACHE_DIR, "kuquest-api-spec.json");
const STAGING_SPEC_URL = "https://kuquest-dev-api.kubits.org/openapi/json";
const STAGING_CACHE_FILE = path.resolve(
  CACHE_DIR,
  "kuquest-staging-openapi.json"
);

// Color helpers
const useColor =
  Boolean(process.stdout.isTTY) &&
  !process.env.NO_COLOR &&
  !process.argv.includes("--no-color");

const c = {
  bold: (t) => (useColor ? `\x1b[1m${t}\x1b[0m` : t),
  dim: (t) => (useColor ? `\x1b[2m${t}\x1b[0m` : t),
  cyan: (t) => (useColor ? `\x1b[36m${t}\x1b[0m` : t),
  green: (t) => (useColor ? `\x1b[32m${t}\x1b[0m` : t),
  yellow: (t) => (useColor ? `\x1b[33m${t}\x1b[0m` : t),
  red: (t) => (useColor ? `\x1b[31m${t}\x1b[0m` : t),
  magenta: (t) => (useColor ? `\x1b[35m${t}\x1b[0m` : t),
  blue: (t) => (useColor ? `\x1b[34m${t}\x1b[0m` : t),
};

const METHOD_COLORS = {
  GET: c.green,
  POST: c.blue,
  PUT: c.yellow,
  PATCH: c.magenta,
  DELETE: c.red,
  OPTIONS: c.dim,
  HEAD: c.dim,
};

function formatMethod(method) {
  const m = (method || "").toUpperCase();
  const colorFn = METHOD_COLORS[m] || c.bold;
  return colorFn(m.padEnd(7));
}

/**
 * Load and cache the OpenAPI specification.
 */
function loadSpec(options = {}) {
  const specPath = options.specPath || SPEC_FILE;
  const cachePath = options.cachePath || CACHE_FILE;
  const refresh = Boolean(options.refresh || options.noCache);

  if (!fs.existsSync(specPath)) {
    throw new Error(`OpenAPI spec not found at: ${specPath}`);
  }

  const specStat = fs.statSync(specPath);

  // Check cache validity
  if (!refresh && fs.existsSync(cachePath)) {
    try {
      const cacheStat = fs.statSync(cachePath);
      if (cacheStat.mtimeMs >= specStat.mtimeMs) {
        const raw = fs.readFileSync(cachePath, "utf8");
        const doc = JSON.parse(raw);
        return { doc, operations: extractOperations(doc) };
      }
    } catch {
      // Cache invalid or unreadable; fall back to parsing YAML
    }
  }

  // Parse YAML
  let yaml;
  try {
    yaml = require("yaml");
  } catch {
    try {
      yaml = require("js-yaml");
    } catch {
      throw new Error(
        "Neither 'yaml' nor 'js-yaml' is installed. Please run `bun install`."
      );
    }
  }

  const parseFn =
    (typeof yaml?.parse === "function" && yaml.parse.bind(yaml)) ||
    (typeof yaml?.load === "function" && yaml.load.bind(yaml)) ||
    (typeof yaml?.default?.parse === "function" &&
      yaml.default.parse.bind(yaml.default)) ||
    (typeof yaml?.default?.load === "function" &&
      yaml.default.load.bind(yaml.default));

  if (!parseFn) {
    throw new Error("Unable to locate parse/load function on YAML library");
  }
  const content = fs.readFileSync(specPath, "utf8");
  const doc = parseFn(content);

  // Attempt saving to cache
  if (!options.noCache) {
    try {
      if (!fs.existsSync(path.dirname(cachePath))) {
        fs.mkdirSync(path.dirname(cachePath), { recursive: true });
      }
      fs.writeFileSync(cachePath, JSON.stringify(doc));
    } catch {
      // Ignore cache write errors (e.g. read-only filesystem)
    }
  }
  return { doc, operations: extractOperations(doc) };
}
/**
 * Load the live staging OpenAPI JSON document.
 *
 * The repository YAML remains the default source. Staging is intentionally
 * opt-in because its published contract can lag or differ from the checked-in
 * mobile contract.
 */
async function loadStagingSpec(options = {}) {
  const cachePath = options.cachePath || STAGING_CACHE_FILE;
  const refresh = Boolean(options.refresh || options.noCache);
  if (!refresh && fs.existsSync(cachePath)) {
    try {
      const doc = JSON.parse(fs.readFileSync(cachePath, "utf8"));
      return { doc, operations: extractOperations(doc) };
    } catch {
      // Cache invalid or unreadable; fetch the live document.
    }
  }

  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    throw new Error("Global fetch is unavailable; use Node 18 or newer.");
  }
  const response = await fetchImpl(STAGING_SPEC_URL);
  if (!response.ok) {
    throw new Error(
      `Staging OpenAPI request failed with HTTP ${response.status}`
    );
  }
  const doc = await response.json();
  if (!doc || typeof doc !== "object" || typeof doc.openapi !== "string") {
    throw new Error("Staging OpenAPI response is not a valid OpenAPI document");
  }

  try {
    if (!fs.existsSync(path.dirname(cachePath))) {
      fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    }
    fs.writeFileSync(cachePath, JSON.stringify(doc));
  } catch {
    // Ignore cache write errors; the fetched document is still usable.
  }
  return { doc, operations: extractOperations(doc) };
}

/**
 * Flatten all paths and methods into an array of operation records.
 */
function extractOperations(doc) {
  const operations = [];
  const paths = doc?.paths || {};
  const httpMethods = [
    "get",
    "post",
    "put",
    "delete",
    "patch",
    "options",
    "head",
  ];

  for (const [routePath, pathObj] of Object.entries(paths)) {
    if (!pathObj || typeof pathObj !== "object") continue;

    const commonParams = Array.isArray(pathObj.parameters)
      ? pathObj.parameters
      : [];

    for (const method of httpMethods) {
      const opObj = pathObj[method];
      if (!opObj || typeof opObj !== "object") continue;

      const opParams = Array.isArray(opObj.parameters) ? opObj.parameters : [];
      const combinedParams = [...commonParams, ...opParams];

      operations.push({
        path: routePath,
        method: method.toUpperCase(),
        operationId: opObj.operationId || "",
        summary: opObj.summary || "",
        description: opObj.description || "",
        tags: Array.isArray(opObj.tags) ? opObj.tags : [],
        security: Array.isArray(opObj.security)
          ? opObj.security
          : doc?.security || [],
        parameters: combinedParams,
        requestBody: opObj.requestBody || null,
        responses: opObj.responses || {},
        deprecated: Boolean(opObj.deprecated),
      });
    }
  }

  return operations;
}

/**
 * Filter operations by keyword query and optional tag/method filters.
 */
function searchOperations(operations, query = "", filters = {}) {
  const q = query.trim().toLowerCase();
  const filterTag = (filters.tag || "").toLowerCase();
  const filterMethod = (filters.method || "").toUpperCase();

  return operations.filter((op) => {
    if (filterMethod && op.method !== filterMethod) {
      return false;
    }

    if (filterTag) {
      const matchesTag = op.tags.some((t) =>
        t.toLowerCase().includes(filterTag)
      );
      if (!matchesTag) return false;
    }

    if (!q) return true;

    // Keyword search across path, operationId, summary, description, and tags
    return (
      op.path.toLowerCase().includes(q) ||
      op.operationId.toLowerCase().includes(q) ||
      op.summary.toLowerCase().includes(q) ||
      op.description.toLowerCase().includes(q) ||
      op.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
}

/**
 * Find an exact or best-matching operation by ID, method+path, or path.
 */
function findOperation(operations, identifier, methodFilter) {
  if (!identifier) return null;
  const input = identifier.trim();

  // Pattern 1: "GET /api/v1/wallet" or "POST /quests"
  const methodMatch = input.match(
    /^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s+(\S+)$/i
  );
  if (methodMatch) {
    const m = methodMatch[1].toUpperCase();
    const p = methodMatch[2];
    return (
      operations.find((op) => op.method === m && op.path === p) ||
      operations.find(
        (op) =>
          op.method === m &&
          (op.path === p || op.path.replace(/\/$/, "") === p.replace(/\/$/, ""))
      )
    );
  }

  // Pattern 2: Exact operationId match
  const byOpId = operations.find(
    (op) => op.operationId.toLowerCase() === input.toLowerCase()
  );
  if (byOpId) return byOpId;

  // Pattern 3: Exact path match with method filter
  if (methodFilter) {
    const m = methodFilter.toUpperCase();
    const byPathAndMethod = operations.find(
      (op) => op.path === input && op.method === m
    );
    if (byPathAndMethod) return byPathAndMethod;
  }

  // Pattern 4: Path match without method (returns first or match)
  const pathMatches = operations.filter(
    (op) =>
      op.path === input ||
      op.path.replace(/\/$/, "") === input.replace(/\/$/, "")
  );
  if (pathMatches.length === 1) return pathMatches[0];
  if (pathMatches.length > 1) {
    // If multiple methods, return array of matches so caller can clarify
    return pathMatches;
  }

  // Pattern 5: Substring / fuzzy match
  const partial = operations.filter(
    (op) =>
      op.operationId.toLowerCase().includes(input.toLowerCase()) ||
      op.path.toLowerCase().includes(input.toLowerCase())
  );
  if (partial.length === 1) return partial[0];
  if (partial.length > 1) return partial;

  return null;
}

/**
 * Resolve a JSON Schema $ref against the root document.
 */
function resolveRef(doc, ref) {
  if (!ref || typeof ref !== "string" || !ref.startsWith("#/")) {
    return null;
  }

  const parts = ref.slice(2).split("/");
  let current = doc;
  for (const part of parts) {
    if (!current || typeof current !== "object") return null;
    current = current[part];
  }
  return current;
}

/**
 * Format a schema node compactly for human/agent reading.
 */
function formatSchemaCompact(
  schema,
  doc,
  indentLevel = 0,
  visited = new Set()
) {
  if (!schema || typeof schema !== "object") return "unknown";

  const indent = "  ".repeat(indentLevel);

  if (schema.$ref) {
    const refName = schema.$ref.split("/").pop();
    if (visited.has(schema.$ref)) {
      return `${c.yellow(refName)} (recursive)`;
    }
    const resolved = resolveRef(doc, schema.$ref);
    if (!resolved) return c.yellow(refName);
    visited.add(schema.$ref);
    const resolvedText = formatSchemaCompact(
      resolved,
      doc,
      indentLevel,
      visited
    );
    visited.delete(schema.$ref);
    return `${c.yellow(refName)} => ${resolvedText}`;
  }

  if (schema.anyOf || schema.oneOf) {
    const variants = schema.anyOf || schema.oneOf;
    return variants
      .map((v) => formatSchemaCompact(v, doc, indentLevel, visited))
      .join(" | ");
  }

  if (schema.allOf) {
    return schema.allOf
      .map((v) => formatSchemaCompact(v, doc, indentLevel, visited))
      .join(" & ");
  }

  const type = schema.type || (schema.properties ? "object" : "any");

  if (type === "array") {
    const items = schema.items
      ? formatSchemaCompact(schema.items, doc, indentLevel, visited)
      : "any";
    return `Array<${items}>`;
  }

  if (type === "object") {
    const properties = schema.properties || {};
    const requiredList = new Set(
      Array.isArray(schema.required) ? schema.required : []
    );
    const keys = Object.keys(properties);

    if (keys.length === 0) {
      if (schema.additionalProperties) {
        return "Record<string, any>";
      }
      return "{}";
    }

    const lines = ["{"];
    for (const key of keys) {
      const prop = properties[key];
      const isReq = requiredList.has(key);
      const reqMarker = isReq ? c.red("*") : c.dim("?");
      const propType = formatSchemaCompact(prop, doc, indentLevel + 1, visited);
      let note = "";
      if (prop.minimum !== undefined) note += ` min=${prop.minimum}`;
      if (prop.maximum !== undefined) note += ` max=${prop.maximum}`;
      if (prop.enum) note += ` enum=[${prop.enum.join(",")}]`;
      if (prop.format) note += ` format=${prop.format}`;

      lines.push(
        `  ${indent}${key}${reqMarker}: ${propType}${note ? c.dim(note) : ""}`
      );
    }
    lines.push(`${indent}}`);
    return lines.join("\n");
  }

  let base = type;
  if (schema.format) base += `(${schema.format})`;
  if (schema.enum) base += `[${schema.enum.join("|")}]`;
  if (schema.const !== undefined)
    base = `const(${JSON.stringify(schema.const)})`;
  if (schema.nullable) base += " | null";
  return base;
}

/**
 * Render detailed information for an operation.
 */
function renderOperationDetail(op, doc) {
  const lines = [];

  lines.push("");
  lines.push(`${formatMethod(op.method)} ${c.bold(op.path)}`);
  if (op.operationId) {
    lines.push(`  ${c.dim("operationId:")} ${c.cyan(op.operationId)}`);
  }
  if (op.tags.length > 0) {
    lines.push(
      `  ${c.dim("tags:")}        ${op.tags.map((t) => c.magenta(t)).join(", ")}`
    );
  }
  if (op.deprecated) {
    lines.push(`  ${c.red("[DEPRECATED]")}`);
  }
  if (op.summary) {
    lines.push(`  ${c.dim("summary:")}     ${op.summary}`);
  }
  if (op.description && op.description !== op.summary) {
    lines.push(`  ${c.dim("description:")} ${op.description.trim()}`);
  }

  // Security
  if (op.security && op.security.length > 0) {
    const secList = op.security
      .flatMap((s) => Object.keys(s))
      .map((k) => {
        if (k === "betterAuthSession") {
          return `${k} (cookie: better-auth.session_token)`;
        }
        if (k === "betterAuthAdminSession") {
          return `${k} (cookie: kuquest-admin.session_token)`;
        }
        if (k === "xenditWebhookAuth") {
          return `${k} (header: x-callback-token)`;
        }
        return k;
      });
    lines.push(`  ${c.dim("security:")}    ${secList.join(", ")}`);
  } else {
    lines.push(`  ${c.dim("security:")}    None (Public route)`);
  }

  // Parameters
  if (op.parameters && op.parameters.length > 0) {
    lines.push("");
    lines.push(`  ${c.bold("Parameters:")}`);
    for (const p of op.parameters) {
      const inType = p.in || "query";
      const isReq = p.required ? c.red("required") : c.dim("optional");
      const schemaType = p.schema
        ? formatSchemaCompact(p.schema, doc, 1)
        : "string";
      lines.push(
        `    • ${c.cyan(p.name)} (${c.yellow(inType)}, ${isReq}): ${schemaType}`
      );
      if (p.description) {
        lines.push(`      ${c.dim(p.description)}`);
      }
    }
  }

  // Request Body
  if (op.requestBody) {
    lines.push("");
    const isReq = op.requestBody.required
      ? c.red("(required)")
      : c.dim("(optional)");
    lines.push(`  ${c.bold("Request Body:")} ${isReq}`);
    if (op.requestBody.description) {
      lines.push(`    ${c.dim(op.requestBody.description)}`);
    }
    const content = op.requestBody.content || {};
    for (const [contentType, mediaObj] of Object.entries(content)) {
      lines.push(`    ${c.yellow(contentType)}:`);
      if (mediaObj.schema) {
        const schemaFormatted = formatSchemaCompact(mediaObj.schema, doc, 3);
        lines.push(`      ${schemaFormatted}`);
      }
    }
  }

  // Responses
  if (op.responses && Object.keys(op.responses).length > 0) {
    lines.push("");
    lines.push(`  ${c.bold("Responses:")}`);
    for (const [status, respObj] of Object.entries(op.responses)) {
      const is2xx = status.startsWith("2");
      const statusColor = is2xx
        ? c.green
        : status.startsWith("4")
          ? c.yellow
          : c.red;
      const desc = respObj.description || "";
      lines.push(`    [${statusColor(status)}] ${c.dim(desc)}`);

      const content = respObj.content || {};
      for (const [contentType, mediaObj] of Object.entries(content)) {
        if (mediaObj.schema) {
          const schemaFormatted = formatSchemaCompact(mediaObj.schema, doc, 3);
          lines.push(`      ${c.dim(contentType)}:\n      ${schemaFormatted}`);
        }
      }
    }
  }

  lines.push("");
  return lines.join("\n");
}

/**
 * Print help manual.
 */
function printHelp() {
  console.log(`
${c.bold("KUQuest API Query CLI")}
Inspect the checked-in OpenAPI or the live staging OpenAPI source.

${c.bold("USAGE:")}
  bun run query-api <command> [options]
  node scripts/query-api.js <command> [options]

${c.bold("COMMANDS:")}
  ${c.cyan("search")} <query>               Search endpoints by path, operationId, or description
  ${c.cyan("get")} <id|method path|path>   Show full details of an endpoint
  ${c.cyan("schema")} <id|path>            Print request or response JSON schema
  ${c.cyan("tags")}                        List all tags and endpoint counts
  ${c.cyan("components")} [name]           List or inspect component schemas
  ${c.cyan("interactive")}                 Launch interactive terminal exploration
  ${c.cyan("help")}                        Show this manual

${c.bold("OPTIONS:")}
  ${c.yellow("--staging")}                  Query the live staging OpenAPI JSON
  ${c.yellow("--tag <tag>")}                 Filter search by tag
  ${c.yellow("--method <METHOD>")}           Filter search by method
  ${c.yellow("--response <status>")}         Select response status for schema command (default: 200)
  ${c.yellow("--request")}                   Select requestBody schema instead of response
  ${c.yellow("--raw")}                       Output unformatted JSON
  ${c.yellow("--no-cache")}                  Bypass the selected source cache
  ${c.yellow("--no-color")}                 Disable ANSI color formatting

${c.bold("EXAMPLES:")}
  bun run query-api search "wallet"
  bun run query-api search "candidate" --tag "Quest Candidates v2"
  bun run query-api search "quests" --staging --no-cache
  bun run query-api get getOwnWallet
  bun run query-api get "POST /api/v1/wallet/earnings-conversions"
  bun run query-api schema getOwnWallet --response 200
  bun run query-api schema createQuest --request
  bun run query-api components AuthUser
`);
}

/**
 * CLI Commands runner.
 */
async function runCli(args = process.argv.slice(2)) {
  if (args.length === 0) {
    if (process.stdin.isTTY) {
      return runInteractive();
    }
    printHelp();
    return;
  }

  const cmd = args[0];
  const rest = args.slice(1);

  if (cmd === "help" || cmd === "--help" || cmd === "-h") {
    printHelp();
    return;
  }

  // Parse common flags
  const flags = {
    staging: false,
    tag: "",
    method: "",
    response: "200",
    request: false,
    raw: false,
    noCache: false,
  };

  const positional = [];
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "--staging") {
      flags.staging = true;
    } else if (arg === "--tag" && i + 1 < rest.length) {
      flags.tag = rest[++i];
    } else if (arg === "--method" && i + 1 < rest.length) {
      flags.method = rest[++i];
    } else if (arg === "--response" && i + 1 < rest.length) {
      flags.response = rest[++i];
    } else if (arg === "--request") {
      flags.request = true;
    } else if (arg === "--raw") {
      flags.raw = true;
    } else if (arg === "--no-cache" || arg === "--refresh") {
      flags.noCache = true;
    } else if (arg === "--no-color") {
      // Handled globally
    } else if (!arg.startsWith("--")) {
      positional.push(arg);
    }
  }

  const source = flags.staging
    ? await loadStagingSpec({ noCache: flags.noCache })
    : loadSpec({ noCache: flags.noCache });
  const { doc, operations } = source;

  switch (cmd) {
    case "tags": {
      const tagMap = new Map();
      for (const op of operations) {
        for (const t of op.tags) {
          if (!tagMap.has(t)) tagMap.set(t, []);
          tagMap.get(t).push(op);
        }
      }

      console.log(`\n${c.bold(`API Tags (${tagMap.size}):`)}`);
      const sortedTags = Array.from(tagMap.keys()).sort();
      for (const tag of sortedTags) {
        const ops = tagMap.get(tag);
        console.log(
          `  • ${c.magenta(tag.padEnd(28))} ${c.cyan(String(ops.length).padStart(3))} endpoints`
        );
      }
      console.log(
        `\n${c.dim("Use `query-api search --tag <tag>` to view endpoints for a tag.")}\n`
      );
      break;
    }

    case "search": {
      const query = positional.join(" ");
      const matches = searchOperations(operations, query, flags);

      if (matches.length === 0) {
        console.log(
          `\n${c.yellow("No endpoints matched")} query: "${query}"${
            flags.tag ? ` in tag: "${flags.tag}"` : ""
          }${flags.method ? ` with method: ${flags.method}` : ""}\n`
        );
        return;
      }

      console.log(
        `\n${c.bold(`Found ${matches.length} matching endpoint(s):`)}`
      );
      for (const op of matches) {
        const opId = op.operationId ? ` (${c.cyan(op.operationId)})` : "";
        const tag = op.tags.length > 0 ? ` ${c.dim(`[${op.tags[0]}]`)}` : "";
        const summary = op.summary ? ` - ${c.dim(op.summary)}` : "";
        console.log(
          `  ${formatMethod(op.method)} ${c.bold(op.path)}${opId}${tag}${summary}`
        );
      }
      console.log(
        `\n${c.dim("View details: `query-api get <operationId|path>`")}\n`
      );
      break;
    }

    case "get": {
      const identifier = positional.join(" ");
      if (!identifier) {
        console.error(c.red("Error: Missing operation ID or path to look up."));
        console.log(c.dim("Example: query-api get getOwnWallet"));
        process.exit(1);
      }

      const match = findOperation(operations, identifier, flags.method);

      if (!match) {
        console.error(c.red(`Operation not found for: "${identifier}"`));
        // Search suggestions
        const suggestions = searchOperations(operations, identifier).slice(
          0,
          5
        );
        if (suggestions.length > 0) {
          console.log(c.dim("\nDid you mean one of these?"));
          for (const s of suggestions) {
            console.log(
              `  ${formatMethod(s.method)} ${s.path} (${s.operationId})`
            );
          }
        }
        process.exit(1);
      }

      if (Array.isArray(match)) {
        console.log(
          c.yellow(
            `\nMultiple operations matched "${identifier}". Specify HTTP method with --method:`
          )
        );
        for (const op of match) {
          console.log(
            `  ${formatMethod(op.method)} ${op.path} (${c.cyan(op.operationId)})`
          );
        }
        console.log("");
        return;
      }

      console.log(renderOperationDetail(match, doc));
      break;
    }

    case "schema": {
      const identifier = positional.join(" ");
      if (!identifier) {
        console.error(c.red("Error: Missing operation ID or path."));
        process.exit(1);
      }

      const match = findOperation(operations, identifier, flags.method);
      if (!match || Array.isArray(match)) {
        console.error(
          c.red(`Could not resolve unique operation for: "${identifier}"`)
        );
        process.exit(1);
      }

      let targetSchema = null;
      let label = "";

      if (flags.request) {
        label = `Request Body Schema for ${match.method} ${match.path}`;
        const content = match.requestBody?.content || {};
        const firstType = Object.keys(content)[0];
        targetSchema = content[firstType]?.schema;
      } else {
        const statusCode = flags.response || "200";
        label = `Response ${statusCode} Schema for ${match.method} ${match.path}`;
        const resp = match.responses?.[statusCode];
        const content = resp?.content || {};
        const firstType = Object.keys(content)[0];
        targetSchema = content[firstType]?.schema;
      }

      if (!targetSchema) {
        console.log(c.yellow(`No schema found for ${label}`));
        return;
      }

      if (flags.raw) {
        console.log(JSON.stringify(targetSchema, null, 2));
      } else {
        console.log(`\n${c.bold(label)}:`);
        console.log(formatSchemaCompact(targetSchema, doc, 1));
        console.log("");
      }
      break;
    }

    case "components": {
      const name = positional[0];
      const schemas = doc?.components?.schemas || {};

      if (!name) {
        const names = Object.keys(schemas);
        console.log(`\n${c.bold(`Component Schemas (${names.length}):`)}`);
        for (const sName of names) {
          const item = schemas[sName];
          const props = item.properties
            ? Object.keys(item.properties).length
            : 0;
          console.log(
            `  • ${c.cyan(sName.padEnd(30))} ${c.dim(`(type: ${item.type || "object"}, ${props} properties)`)}`
          );
        }
        console.log(
          `\n${c.dim("View schema: `query-api components <name>`")}\n`
        );
        return;
      }

      const schema = schemas[name];
      if (!schema) {
        console.error(c.red(`Component schema "${name}" not found.`));
        process.exit(1);
      }

      if (flags.raw) {
        console.log(JSON.stringify(schema, null, 2));
      } else {
        console.log(`\n${c.bold(`Component Schema: ${c.cyan(name)}`)}:`);
        console.log(formatSchemaCompact(schema, doc, 1));
        console.log("");
      }
      break;
    }

    case "interactive": {
      await runInteractive();
      break;
    }

    default:
      console.error(c.red(`Unknown command: "${cmd}"`));
      printHelp();
      process.exit(1);
  }
}

/**
 * Interactive menu mode for terminal users.
 */
async function runInteractive() {
  const { doc, operations } = loadSpec();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) =>
    new Promise((resolve) => rl.question(prompt, resolve));

  console.log(`\n${c.bold("=== KUQuest API Interactive Explorer ===")}`);
  console.log(
    c.dim(`Loaded ${operations.length} operations from docs/api/api.yaml\n`)
  );

  let running = true;
  while (running) {
    console.log(c.bold("Choose an option:"));
    console.log("  1) Search endpoints");
    console.log("  2) Browse by tag");
    console.log("  3) Lookup endpoint by ID or path");
    console.log("  4) Browse component schemas");
    console.log("  5) Exit");

    const answer = (await question(`\n${c.cyan("> ")}`)).trim();

    if (answer === "1") {
      const q = await question("Enter search keyword: ");
      const results = searchOperations(operations, q).slice(0, 25);
      console.log(`\nFound ${results.length} results:`);
      results.forEach((r, idx) => {
        console.log(
          `  [${idx + 1}] ${formatMethod(r.method)} ${r.path} (${c.cyan(r.operationId)})`
        );
      });
      if (results.length > 0) {
        const pick = await question(
          "\nSelect number to inspect (or Enter to back): "
        );
        const idx = parseInt(pick, 10) - 1;
        if (results[idx]) {
          console.log(renderOperationDetail(results[idx], doc));
        }
      }
    } else if (answer === "2") {
      const tagMap = new Map();
      for (const op of operations) {
        for (const t of op.tags) {
          if (!tagMap.has(t)) tagMap.set(t, []);
          tagMap.get(t).push(op);
        }
      }
      const tags = Array.from(tagMap.keys()).sort();
      tags.forEach((t, i) => {
        console.log(`  [${i + 1}] ${t} (${tagMap.get(t).length})`);
      });
      const pick = await question("\nSelect tag number: ");
      const idx = parseInt(pick, 10) - 1;
      if (tags[idx]) {
        const tagOps = tagMap.get(tags[idx]);
        tagOps.forEach((op, i) => {
          console.log(
            `  [${i + 1}] ${formatMethod(op.method)} ${op.path} (${op.operationId})`
          );
        });
        const opPick = await question(
          "\nSelect endpoint to inspect (or Enter to back): "
        );
        const opIdx = parseInt(opPick, 10) - 1;
        if (tagOps[opIdx]) {
          console.log(renderOperationDetail(tagOps[opIdx], doc));
        }
      }
    } else if (answer === "3") {
      const id = await question(
        "Enter operationId or path (e.g. getOwnWallet or /api/v1/wallet): "
      );
      const op = findOperation(operations, id);
      if (op && !Array.isArray(op)) {
        console.log(renderOperationDetail(op, doc));
      } else if (Array.isArray(op)) {
        console.log("\nMultiple matches:");
        op.forEach((o, i) => {
          console.log(`  [${i + 1}] ${formatMethod(o.method)} ${o.path}`);
        });
        const pick = await question("Select number: ");
        const idx = parseInt(pick, 10) - 1;
        if (op[idx]) console.log(renderOperationDetail(op[idx], doc));
      } else {
        console.log(c.red("No operation found.\n"));
      }
    } else if (answer === "4") {
      const schemas = Object.keys(doc?.components?.schemas || {});
      schemas.forEach((s, i) => console.log(`  [${i + 1}] ${s}`));
      const pick = await question("\nSelect schema number: ");
      const idx = parseInt(pick, 10) - 1;
      if (schemas[idx]) {
        const sName = schemas[idx];
        console.log(`\n${c.bold(sName)}:`);
        console.log(formatSchemaCompact(doc.components.schemas[sName], doc, 1));
        console.log("");
      }
    } else if (
      answer === "5" ||
      answer.toLowerCase() === "exit" ||
      answer.toLowerCase() === "q"
    ) {
      running = false;
    }
  }

  rl.close();
}

// Export for programmatic use and unit tests
module.exports = {
  STAGING_SPEC_URL,
  loadSpec,
  loadStagingSpec,
  extractOperations,
  searchOperations,
  findOperation,
  resolveRef,
  formatSchemaCompact,
  renderOperationDetail,
  runCli,
};

// Execute if run directly
if (require.main === module) {
  runCli().catch((err) => {
    console.error(c.red(`Error: ${err.message}`));
    process.exit(1);
  });
}
