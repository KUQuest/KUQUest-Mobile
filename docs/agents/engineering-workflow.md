# Engineering workflow

This is the detailed workflow behind the concise root `AGENTS.md` pointer.

## Before editing

1. Read `docs/agents/repository-context.md`.
2. Inspect the owning feature, applicable domain specification/rulebook, existing tests, and current status.
3. For API-facing work, use `bun run query-api` before changing routes, schemas, or fixtures.
4. Preserve unrelated changes. Do not invent missing routes, schemas, fixtures, or domain states.

## Plan and execute

- Work in small batches with one clear purpose.
- Reassess after discovery, failed checks, or a boundary change; repository evidence overrides the first plan.
- Prefer the smallest owning fix. Remove obsolete code created by the change; do not perform unrelated cleanup.
- The main agent owns the shared worktree, branch, integration, and final validation.
- If delegating, assign one writer per file with an explicit allowlist and responsibility boundary. Avoid parallel writers on the same file.
- Handoffs must include changed files, `git status --short --untracked-files=all`, `git diff --stat <base>`, and validation performed. Verify every path against the allowlist before accepting it.

## Git safety

- Inspect `git status --short --untracked-files=all` before editing.
- Never use routine destructive cleanup such as `git reset --hard`, `git clean -fd`, or project reset scripts.
- The main agent owns commits and other Git mutations. Back out only the current change when necessary.

## Tests and validation

- Tests preserve product behavior. Change a test only for a contract reason; assert consumer-visible behavior, boundaries, transitions, errors, accessibility, and invariants.
- Bug work follows: reproduce, trace the owning path, add useful behavioral coverage, fix the smallest owner, validate.
- Use repository scripts rather than guessed commands. The normal order is targeted check, typecheck, affected tests, lint, format check, then native validation when relevant.
- Do not treat a successful web run as proof of Android or iOS behavior.
- Add a reusable gotcha only when the discovery applies to future unrelated sessions.

## Delivery

Before finishing:

1. Re-read the task and inspect the final status and changed files.
2. Confirm every changed path belongs to the task.
3. Run relevant verification and report exact results.
4. Confirm Android/iOS implications, API contract, domain language, and applicable rulebooks.
5. Confirm no unrelated test was weakened, file deleted, or persisted/API/navigation contract silently broken.
6. Report changes, validation, limitations, and intentional compatibility changes.
7. Run the `retro` skill for substantial work when available.

Never claim a check that was not run.
