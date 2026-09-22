# Gotchas

Mistakes agents made in this repo and the rules they produced, so the same failure is not repeated. Newest first. Any agent working here reads this file; any agent may append to it.

## Adding a gotcha

- Add a gotcha when a mistake cost real rework **and** code, tests, or automated checks cannot prevent it recurring on their own.
- Write the rule, not the story: **What happened** (1-2 lines) -> **Root cause** (1 line) -> **Rule** (imperative, verifiable).
- One topic per entry; search this file first, no duplicates.
- Date every entry. On review, prune entries the codebase or environment has made obsolete - stale rules are worse than none.

## Entries

### 2026-09-23 — Jest runs from `bash` hang and report misleading counts

**What happened**: `bunx jest` through the agent shell showed "N passed" summaries while a test had failed, and runs never exited, so later runs overwrote the same `--outputFile` concurrently.

**Root cause**: The shell's output filter condenses Jest output, and Jest keeps open handles after `HomeScreen` query tests.

**Rule**: Run Jest with `--forceExit --json --outputFile=<unique path>` and read failures from the JSON (or run it via a subprocess in `eval`); never trust the condensed summary. New `HomeScreen.test.tsx` cases go before the Quick Access test, which leaves an overlapping `act()` scope that blanks later renders.

### 2026-09-23 — `contentContainerStyle` replaces `contentContainerClassName`

**What happened**: The chat message list and the Worker Work Management scroll lost every class-based padding on device (content touching the screen edges and status bar). Jest passed because CSS is mocked.

**Root cause**: `@/tw` maps `contentContainerClassName` onto `contentContainerStyle`; an inline `contentContainerStyle` on the same list replaces the class styles instead of merging.

**Rule**: Never pass both props to one `ScrollView`/`FlatList`. Put static padding in the class or on an inner wrapper `View`, and keep only runtime values (safe-area or nav insets) in `contentContainerStyle`. Confirm the layout with a device screenshot.

### 2026-09-21 — `bun x tsc --noEmit` can pass vacuously; use `bun run typecheck`

**What happened**: Repeated `bun x tsc --noEmit` invocations reported "Build successful (0 units compiled)" while the committed code had type errors that husky's `tsc --noEmit` then caught, costing three failed commits.

**Root cause**: The shell wrapper resolved a different binary/filter path than the repo's `tsc --noEmit` script and compiled nothing.

**Rule**: Type-check with `bun run typecheck` (the repo script), never `bun x tsc --noEmit` directly.

### 2026-09-21 — An online Android device can still fail native smoke

**What happened**: `adb devices` showed a ready device, but native validation was blocked by an active agent-device lease, an occupied Metro port, and a stale/broken bundle.

**Root cause**: ADB connectivity, the agent-device lease, Metro health, and JavaScript bundle freshness are separate conditions.

**Rule**: Run `bun run mobile:android:preflight` before native work, reuse only a verified session and healthy project-owned Metro listener, then run `bun run check-android-workspace-surface` after reload.

### 2026-09-20 — Agent-device MCP paths use one mounted prefix

**What happened**: Calls addressed `xd://mcp__mcp__agent_device_*` and failed before reaching the device tool.

**Root cause**: The mounted route already includes the `mcp__` prefix.

**Rule**: Use `xd://mcp__agent_device_<command>` exactly once; retry a duplicated-prefix failure with the corrected route.

### 2026-09-19 — Shared Jest helpers do not belong under `__tests__/`

**What happened**: A shared test helper placed under `__tests__/` was auto-collected and failed with “Your test suite must contain at least one test.”

**Root cause**: Jest treats every file under a `__tests__/` directory as a test suite.

**Rule**: Put shared test helpers in `src/testing/`, such as `src/testing/queryTestUtils.tsx`, rather than under `__tests__/`.

### 2026-09-19 — Query keys must match the inputs read by their query functions

**What happened**: Chat message queries omitted `viewerId` and could serve another user's cached presentation, while Quest Board queries included unused filters and fragmented identical server data across cache entries.

**Root cause**: The query keys did not contain exactly the inputs their `queryFn` used.

**Rule**: Include every input read by `queryFn` and exclude every input the fetch ignores; follow `src/features/chat/api/chatQueries.ts` and `src/features/questBoard/api/questBoardQueries.ts`.

### 2026-09-19 — Inline empty-array fallbacks break dependency identity

**What happened**: `const xs = query.data ?? []` created a new array on every render and silently retriggered downstream `useMemo` and `useEffect` dependencies.

**Root cause**: The inline `[]` fallback has a new identity on every evaluation.

**Rule**: Preserve the fallback identity with `useMemo(() => query.data ?? [], [query.data])`.

### 2026-09-18 — Debug-build deep links use a different URI scheme than app.json

**What happened**: `adb shell am start -a android.intent.action.VIEW -d "kuquestmobile://..."` (the scheme in `app.json`) never opened the target route on the dev-client build; it landed on unrelated default screens.

**Root cause**: The debug build registers `kuquestmobile-debug://`, not `app.json`'s `"scheme": "kuquestmobile"`.

**Rule**: Before deep-linking into a dev-client/debug build, confirm the registered scheme with `adb shell dumpsys package <applicationId> | grep -A3 "android.intent.action.VIEW"` rather than assuming the manifest value.

### 2026-09-18 — `adb shell am force-stop` breaks the Metro connection on a dev-client app

**What happened**: Force-stopping the app before a cold-start deep link caused a ~90 second freeze on the splash screen, traced to a lost Metro/dev-server websocket that only recovered after a retry backoff.

**Root cause**: Force-stop kills the dev client's live Metro connection; reconnecting on cold start is slow and not guaranteed.

**Rule**: Don't `force-stop` a running dev-client app as a debugging shortcut. Retry a deep link with a warm `adb shell am start -a android.intent.action.VIEW -d "<uri>" <applicationId>` against the already-running instance instead.

### 2026-09-18 — `scroll`/`swipe` don't reliably page a horizontal paged carousel

**What happened**: Repeated `scroll` and `swipe` tool calls against `hirer-quest-carousel` (a `pagingEnabled` horizontal `ScrollView`) appeared to not move it.

**Root cause**: Those tools didn't carry enough velocity/travel to cross the carousel's snap threshold.

**Rule**: Page a `pagingEnabled` horizontal `ScrollView` with the `gesture` tool, `kind: "fling"`, an explicit `origin` near the leading/trailing edge, and `distance: 900`.

### 2026-09-17 — Keep file recovery scoped to the current worktree

**What happened**: A screen migration required repeated restoration after extraction artifacts changed tracked screens. One recovery attempt used `git show ... | sponge`, which could overwrite active edits.

**Root cause**: File recovery replaced working-tree state instead of applying a bounded edit against re-read content.

**Rule**: Re-read before recovery and use a scoped edit. Main owns Git restoration; when a baseline replacement is necessary, restore only the explicitly owned path and reapply the requested changes. Keep `git show ... | sponge` out of worktree recovery.

### 2026-09-17 — Captured command output can be summarized, truncated, or replaced

**What happened**: Three `bun run test` runs in an agent harness reported `✅ 54 passed` while the suite was `Test Suites: 1 failed, 54 passed, 55 total`; a false "tests green" claim reached a PR body. In a later session the wrapper replaced command output entirely — several runs returned only `✓ Build successful (0 units compiled)` (even for `cat` and `git log`), and `bun x jest <file>` reported `✅ 0 passed` while nothing ran.

**Root cause**: The harness wrapper summarizes or replaces captured stdout; it can drop failures or report a count for a run that never happened.

**Rule**: Verify an important command by capturing its output to a file and reading that file (`cmd > /tmp/x.log 2>&1`, then read it). Treat a bare passing count, a suspiciously short result, or output you did not expect as unverified and re-run once through the capture pattern. For scoped Jest runs, use `./node_modules/.bin/jest <file> --silent > /tmp/x.log 2>&1`; `bun x jest` can misreport.

### 2026-09-17 — The pre-commit hook reformats every staged file in full

**What happened**: A 3-line import edit to an unformatted legacy file (`CandidateReviewSheet.tsx`) was committed as 519 lines.

**Root cause**: `lint-staged` runs Prettier over each staged file, and much of the repo predates the formatter.

**Rule**: Run `bun run format` as its own commit, never inside a feature change; when a diff is dominated by reformatting, check the file was already clean before editing it.
