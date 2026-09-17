---
name: query-api
description: Query and inspect the KUQuest OpenAPI specification from docs/api/api.yaml. Use when looking up API endpoints, operation IDs, request/response schemas, status codes, required parameters, headers, or verifying mobile API contract compatibility.
---

The canonical KUQuest API specification lives at `docs/api/api.yaml` (50,000+ lines, 218 operations across 41 tags). Never read or grep the raw file directly into context: use the `query-api` CLI for instant, cached lookups.

## CLI Execution

Run via `bun` or `node`:

```bash
bun run query-api <command> [options]
# or
node scripts/query-api.js <command> [options]
```

## Discovery

Find available endpoints by keyword, tag, or HTTP method:

```bash
# Search by keyword across paths, operationIds, summaries, descriptions
bun run query-api search "wallet"
bun run query-api search "candidate"

# Filter by tag
bun run query-api search "proof" --tag "Quest Proof v2"

# Filter by HTTP method
bun run query-api search "quests" --method POST

# List all 41 tags and endpoint counts
bun run query-api tags
```

## Operation Inspection

Inspect the full contract for a specific endpoint (operationId, method + path, or path):

```bash
# Look up by operationId
bun run query-api get getOwnWallet

# Look up by method and path
bun run query-api get "POST /api/v1/wallet/earnings-conversions"

# Look up by path (if ambiguous, prompts for method)
bun run query-api get /api/v1/profile
```

The output details:

1. **HTTP Method & Path**
2. **Operation ID & Tags**
3. **Summary & Description**
4. **Security Scheme**: Cookie (`better-auth.session_token`), Admin cookie (`kuquest-admin.session_token`), or public
5. **Parameters**: Path, query, or header parameters with types, requirements, and constraints (`min`, `max`, `pattern`)
6. **Request Body**: Content types (`application/json`, `multipart/form-data`) and required/optional properties
7. **Responses**: All status codes (`200`, `400`, `401`, `404`, `409`, `502`) with schema shapes

## Schema Extraction

Extract exact payload schemas for code generation, TypeScript interface authoring, or contract validation:

```bash
# Inspect 200 response schema
bun run query-api schema getOwnWallet --response 200

# Inspect request body schema
bun run query-api schema convertEarnings --request

# Dump unformatted raw JSON schema
bun run query-api schema getOwnWallet --response 200 --raw

# List or inspect reusable component schemas
bun run query-api components
bun run query-api components AuthUser
```

## Interactive Exploration

When exploring interactively in a terminal:

```bash
bun run query-api interactive
```

Presents a menu to search endpoints, browse by tag, look up by ID/path, or browse component schemas.

## Contract Invariants & Mobile Conventions

Always align mobile client code (`src/api/*`, hooks, and types) with these specification rules:

1. **Envelope Structure**:
   - Success (`2xx`): `{ success: true, data: { ... } }`
   - Failure (`4xx`, `5xx`): `{ success: false, error: { code: string, message: string } }`
2. **Monetary Values (Satang)**:
   - All currency values are strictly integer Satang (`minimum: 0` or `minimum: 1`).
   - 1 THB = 100 Satang. Never send floats or THB decimals.
3. **Session Authentication**:
   - Student routes require `betterAuthSession` cookie `better-auth.session_token`.
   - Native Google OAuth signs in via `POST /api/auth/sign-in/social` with `idToken` parameter.
4. **Idempotency**:
   - Financial mutations and irreversible actions require header `idempotency-key` (`minLength: 1`, `pattern: \S`).

## Completion Criteria

Before finalizing changes to `src/api/*`, mock data fixtures, or feature integrations:

- Verify the exact route path and HTTP method match `docs/api/api.yaml`.
- Verify all required request properties and headers (e.g. `idempotency-key`) are provided.
- Verify the mobile TypeScript interface matches the spec's `data` schema.
