---
name: asyncapi-query
description: Inspect KUQuest AsyncAPI WebSocket channels, operations, authentication, and event payloads. Use for realtime Quest or Candidate roster stream questions and WebSocket contract checks; use query-api for REST routes and schemas.
---

## Refresh contract

At the start of every invocation, fetch the live contract at `https://kuquest-dev-api.kubits.org/asyncapi.yaml` with `read`. Treat that response as current; do not rely on prior context or a stale local copy. If the fetch fails, stop and report the source unavailable rather than answering from cached material.

## Query WebSocket contract

Inspect the freshly fetched AsyncAPI 3.x document for the requested `channels`, `operations`, `components/messages`, and `components/securitySchemes`. Report exact channel address, path parameters, operation action, message names, payload fields/constraints, authentication, and behavior relevant to the question. Resolve `$ref` targets before describing a contract.

For KUQuest streams, preserve these contract distinctions:

- `QUEST_UPDATED` and `CANDIDATE_ROSTER_UPDATED` are invalidations, not state snapshots; query current state through REST after each event and after reconnect.
- Streams do not replay missed events after reconnect and are read-only; client messages close the connection with code `1008`.
- Session authentication uses the `better-auth.session_token` cookie, with authorization checked for the Quest and stream.

Use `query-api` to verify any REST endpoint named by the AsyncAPI contract. If the REST contract is missing or conflicts, report the gap; do not infer or substitute routes. Do not infer reconnect semantics, payload fields, or write support beyond the two specifications.

## Answer

Give the exact contract path and evidence from the fresh AsyncAPI document. Separate documented behavior from inference. When pairing a stream with REST, cite both the AsyncAPI operation and the `query-api` result.
