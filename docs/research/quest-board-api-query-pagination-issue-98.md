# Issue #98: Quest Board API query and pagination handoff

## Scope

Mobile issue [#98](https://github.com/KUQuest/KUQUest-Mobile/issues/98) replaces local production Quest Board filtering with `GET /api/v2/quests` query parameters and cursor pagination. Its acceptance criteria require supported filters to be sent to the API, cursor reset on filter changes, later pages fetched from `nextCursor`, and no client-side business-eligibility filtering of API results.

## Authoritative sources

1. [Mobile issue #98](https://github.com/KUQuest/KUQUest-Mobile/issues/98)
2. [Backend v2 Board issue #377](https://github.com/KUQuest/KUQuest-API-Server/issues/377)
3. [Backend v2 contract issue #370](https://github.com/KUQuest/KUQuest-API-Server/issues/370)
4. [Backend frontend handoff](https://github.com/KUQuest/KUQuest-API-Server/blob/develop/docs/agents/quest-api-v2-frontend-handoff.md)
5. [Backend v1 schema](https://github.com/KUQuest/KUQuest-API-Server/blob/develop/src/modules/quest/quest.schema.ts), which is **not** the contract for new Mobile work.

Backend #361 and #362 were closed as superseded: their issue comments state that `/api/v1/quests/*` is frozen and that v2 is the canonical Board surface. Do not copy v1 field names or enum values into this work.

## V2 Board request contract

`GET /api/v2/quests` requires an authenticated Member session and accepts only:

- `q`
- `tagId` — one exact Tag UUID
- `mode` — `FIRST_COME_FIRST_SERVED` or `CANDIDATE`
- `participation` — `SINGLE` or `GROUP`
- `minQuestReward`, `maxQuestReward` — inclusive Baht amounts, up to two decimal places
- `maxDurationMinutes`
- `startFrom`, `startTo` — `+07:00` schedule timestamps
- `limit` — 1–50, default 20
- `cursor` — opaque

For each new filter/search combination, request the first page without a cursor. Later requests use exactly the returned `nextCursor`; do not parse or transform it.

## Server/client responsibility boundary

The server, before pagination, owns hidden-state, ownership, Quest-state, timing, and joinability decisions. Mobile must not apply those business filters to API items.

Mobile may retain only presentation logic that can be fully justified by data already returned. The v2 endpoint fixes result ordering by `startTime` then Quest ID, so UI sort controls that imply a different dataset order must be removed, disabled, or explicitly deferred rather than locally re-sorting paginated results.

The existing fixture filter controls are not all representable by v2:

- Multiple tag selection: v2 supports one `tagId`.
- Location mode: no v2 Board query parameter.
- Fixture deadline bucket: v2 offers `maxDurationMinutes`, not a deadline-relative bucket.
- Fixture start-time buckets: map only if their semantics can be exactly represented by `startFrom`/`startTo` in `+07:00`; otherwise remove/defer.

## Current branch findings

`src/features/questBoard/QuestBoardScreen.tsx` already has API page state, cursor state, and `FlatList.onEndReached`, but:

- `apiQuery` currently forwards only `q`, `minReward`, and `maxReward`.
- Its local production path must not call `applyQuestBoardFilters`, `getVisibleQuests`, or `sortQuests` over API data.
- The existing filter UI is fixture-oriented and must be narrowed to the v2-supported contract.
- `src/api/questBoard/questBoardContracts.ts` currently uses legacy `NO_CANDIDATE` / `SOLO` enums and `minReward` / `maxReward`; replace them with the v2 values and names above before wiring UI filters.

## Completion checks

Add focused tests that prove:

1. Each supported UI filter becomes the correct API query parameter.
2. Changing search or a filter clears prior items and does not send the old cursor.
3. `onEndReached` sends the opaque returned cursor once, appends the returned page, and stops when `nextCursor` is null.
4. Production API results are rendered as returned, without local eligibility filtering or a fallback to fixtures.
5. Unsupported fixture filter/sort controls are unavailable in the API-backed path.
