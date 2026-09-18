# Gotchas

Mistakes agents made in this repo and the rules they produced, so the same failure is not repeated. Newest first. Any agent working here reads this file; any agent may append to it.

## Adding a gotcha

- Add a gotcha when a mistake cost real rework **and** code, tests, or automated checks cannot prevent it recurring on their own.
- Write the rule, not the story: **What happened** (1-2 lines) -> **Root cause** (1 line) -> **Rule** (imperative, verifiable).
- One topic per entry; search this file first, no duplicates.
- Date every entry. On review, prune entries the codebase or environment has made obsolete - stale rules are worse than none.

## Entries

### 2026-09-18 — Debug-build deep links use a different URI scheme than app.json

**What happened**: `adb shell am start -a android.intent.action.VIEW -d "kuquestmobile://..."` (the scheme in `app.json`) never opened the target route on the dev-client build; it landed on unrelated default screens.

**Root cause**: The debug build registers `kuquestmobile-debug://`, not `app.json`'s `"scheme": "kuquestmobile"`.

**Rule**: Before deep-linking into a dev-client/debug build, confirm the registered scheme with `adb shell dumpsys package <applicationId> | grep -A3 "android.intent.action.VIEW"` rather than assuming the manifest value.

### 2026-09-18 — `adb shell am force-stop` breaks the Metro connection on a dev-client app

**What happened**: Force-stopping the app before a cold-start deep link caused a ~90 second freeze on the splash screen, traced to a lost Metro/dev-server websocket that only recovered after a retry backoff.

**Root cause**: Force-stop kills the dev client's live Metro connection; reconnecting on cold start is slow and not guaranteed.

**Rule**: Don't `force-stop` a running dev-client app as a debugging shortcut. Retry a deep link with a warm `adb shell am start -a android.intent.action.VIEW -d "<uri>" <applicationId>` against the already-running instance instead.

### 2026-09-18 — A double-tap near the profile tab silently switches Hirer/Worker workspace

**What happened**: During on-device automation, the app unexpectedly flipped from the Hirer to the Worker home screen with no tap on that control intended.

**Root cause**: `BottomNav.tsx` treats two taps on the profile tab within 400ms as a request to call `switchWorkspace()`, toggling the persisted `RoleWorkspaceContext` workspace. Closely-timed automated taps near that control can misfire it.

**Rule**: After any accidental double-tap near the profile tab during device automation, check which workspace is showing before continuing; recover with `switch-to-hirer-button` (on `WorkerHomeScreen`) or a deliberate `switchWorkspace("hirer")` path.

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
