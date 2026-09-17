# Gotchas

Mistakes agents made in this repo and the rules they produced, so the same failure is not repeated. Newest first. Any agent working here reads this file; any agent may append to it.

## Adding a gotcha

- Add a gotcha when a mistake cost real rework **and** code, tests, or automated checks cannot prevent it recurring on their own.
- Write the rule, not the story: **What happened** (1-2 lines) -> **Root cause** (1 line) -> **Rule** (imperative, verifiable).
- One topic per entry; search this file first, no duplicates.
- Date every entry. On review, prune entries the codebase or environment has made obsolete - stale rules are worse than none.

## Entries

### 2026-09-17 — Summarized Jest output can hide a failing suite

**What happened**: Three `bun run test` runs in an agent harness reported `✅ 54 passed` while the suite was `Test Suites: 1 failed, 54 passed, 55 total` and `Tests: 1 failed, 372 passed, 373 total`; a false "tests green" claim reached a PR body.

**Root cause**: The harness wrapper reports passing test counts and drops Jest's failure summary.

**Rule**: Confirm a Jest run by reading its `Test Suites:` and `Tests:` lines — capture the output to a file and read it when the wrapper summarizes — and treat a bare passing count as unverified.

### 2026-09-17 — The pre-commit hook reformats every staged file in full

**What happened**: A 3-line import edit to an unformatted legacy file (`CandidateReviewSheet.tsx`) was committed as 519 lines.

**Root cause**: `lint-staged` runs Prettier over each staged file, and much of the repo predates the formatter.

**Rule**: Run `bun run format` as its own commit, never inside a feature change; when a diff is dominated by reformatting, check the file was already clean before editing it.
