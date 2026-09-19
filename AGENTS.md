# KUQuest Mobile — Agent Guide

This file is the root operating contract for AI coding agents working in this repository.

Keep this file concise. Detailed domain rules, architecture, debugging procedures, and workflows live in the referenced repository documentation and skills. Read only the branches relevant to the task.

## Core rules

- Use **Bun** by default for package management and scripts.
- This is an **Expo native mobile app**. Android and iOS are the product targets.
- Web support and web-specific optimization are out of scope unless explicitly requested.
- Preserve existing behavior and unrelated work.
- Prefer repository evidence over assumptions or remembered framework behavior.
- Read the canonical domain and architecture documentation before changing behavior.
- Never invent backend routes, schemas, domain states, fixture behavior, or product rules.
- Keep changes scoped to the smallest owning feature.
- Validate the behavior you changed before delivery.

---

## Expo SDK 57

Expo has changed substantially.

Before writing or modifying Expo / React Native framework code, read the exact versioned Expo documentation:

https://docs.expo.dev/versions/v57.0.0/

Do not rely on memorized APIs from older Expo SDKs or React Native versions.

When changing a specific Expo feature, read its SDK 57 documentation rather than relying only on the SDK landing page.

Prefer Expo-supported installation/version alignment mechanisms for Expo-managed dependencies.

Do not perform unrelated framework or dependency upgrades.

### Development builds

Native Google Sign-In requires an installed development build.

Use the mobile development-build scripts defined in `package.json` when validating flows that depend on native Google Sign-In.

Do not use Expo Go as proof that native Google Sign-In works.

---

# Repository entry points

Before making code, route, fixture, API, test, or deletion changes, read:

- `docs/agents/repository-context.md`

It is the current repository map and contains:

- source ownership seams
- compatibility drift
- test topology
- debugging boundaries
- preservation rules
- known architectural constraints

Then use:

- `CONTEXT.md` — canonical ubiquitous domain language
- `docs/agents/routing.md` — routes a task to the correct feature/persona documentation
- `CODE_STYLES.md` — implementation, formatting, NativeWind, feature architecture, and Jest conventions
- `docs/agents/gotchas.md` — known repository-specific traps

Do not reconstruct information that already exists in these documents.

---

# Domain authority

Use the terminology in root `CONTEXT.md`.

Do not introduce synonyms for canonical domain concepts.

The primary sources of truth are:

## Backend rulebooks

Mirrored from `KUQuest-API-Server` at:

`1b55199d74d2e73a4a05a4662e49fb643cbee3e6`

Located under:

```text
docs/rulebook/
```

Important branches include:

```text
docs/rulebook/quest/quest-work-chat-rulebook.md
docs/rulebook/finance/finance-rulebook.md
docs/rulebook/admin/admin-rulebook.md
```

Read applicable sub-contracts as routed by `docs/agents/routing.md`.

## Backend API contract

Canonical OpenAPI specification:

```text
docs/api/api.yaml
```

Do **not** manually read or grep the entire OpenAPI file.

Use:

```text
bun run query-api
```

or the `query-api` skill.

Use `query-api` before changing:

```text
src/api/*
API-backed mocks
request/response schemas
route names
query/path parameters
API-derived fixtures
```

If a route or schema cannot be found, record the missing contract as a gap.

Do not invent a substitute.

## Mobile domain specifications

```text
docs/specs/quest-state-summary.md
docs/specs/group-quest-behavior.md
docs/specs/wallet-and-payments.md
docs/specs/conversation-and-work-chat.md
docs/specs/proof-and-rating-reviews.md
docs/specs/student-profile-redesign.md
```

## Architecture

Architecture decisions:

```text
docs/adr/
```

System/navigation design:

```text
docs/system-design-specification.md
```

Existing ADRs take precedence over stylistic preferences.

If a requested change intentionally violates an ADR, identify the conflict before changing the architecture.

---

# Domain branch resolution

For work involving any of these areas:

```text
Quest
Work Chat
Candidate Inquiry
Profile
Wallet / Money
Proof Submission
Review
Settlement
```

determine the active domain branch before changing behavior.

Resolve these facts where relevant:

1. **Actor**

   - `Hirer`
   - `Worker`
   - `Candidate`
   - `Prospective Worker`
   - `Accepted Participant`

2. **Quest State**

   - `QUEST_DRAFT`
   - `QUEST_OPEN`
   - `QUEST_ASSIGNED`
   - `QUEST_IN_PROGRESS`
   - `QUEST_COMPLETED`
   - `QUEST_CANCELLED`
   - `QUEST_FAILED`

3. **Selection Mode**

   - `FIRST_COME_FIRST_SERVED`
   - `CANDIDATE`

   Never introduce or restore legacy `NO_CANDIDATE`.

4. **Participation**

   - `SINGLE` — headcount = 1
   - `GROUP` — headcount > 1, maximum 20

5. **Submission conditions**

   - `proofRequired`
   - `dueAt`

These become especially important for:

```text
Sent Work
Proof Submission
review
deadline behavior
payment
settlement
```

Use `docs/agents/routing.md` to locate the correct rulebook/spec branch.

### Missing domain context

For interactive work, state what is already known and ask for **one missing domain fact at a time** only when repository evidence cannot safely determine it.

For explicitly autonomous or non-interactive tasks:

```text
inspect canonical docs
→ infer the narrowest supported branch
→ record the assumption
→ proceed reversibly
```

Do not block a long autonomous run merely because a detail can be safely resolved from repository evidence.

Never invent product semantics.

---

# Repository-preserving workflow

Use preserve-first debugging.

Before changing code:

1. Read `docs/agents/repository-context.md`.
2. Inspect the owning feature.
3. Inspect the relevant domain documentation.
4. Inspect tests for existing behavior.
5. Check `git status`.
6. Protect unrelated user changes.

Debug the smallest owning path first.

Prefer fixing code created or modified by the current task before modifying older unrelated systems.

---

# Preservation rules

These are non-negotiable.

Do not:

- delete unrelated source files
- delete unrelated tests
- disable tests
- skip tests to hide failures
- weaken an assertion to make a test pass
- rename unrelated tests
- remove fixtures that demonstrate existing behavior
- erase QA evidence
- use reset/clean scripts as routine debugging
- use destructive Git cleanup against user work
- invent missing routes or fixtures
- broadly weaken TypeScript
- add widespread `any`
- hide errors with unexplained `@ts-ignore`
- perform unrelated cleanup while fixing a scoped issue

Change a test only when the product contract intentionally changed.

Replacement assertions must remain behavioral.

A pre-existing file or test may be deleted only when:

- the user explicitly requested the deletion, or
- the task directly requires it and the reason is documented.

Remove imports, variables, helpers, and files that **your own change** made unused.

Leave unrelated pre-existing dead code alone and mention it separately.

---

# Absence is evidence

When an expected surface does not exist, do not fabricate it.

Examples:

```text
missing backend route
missing OpenAPI schema
missing fixture
missing rulebook branch
missing navigation route
missing domain state
```

Record the absence as a contract/repository gap.

Do not silently:

```text
invent an API
invent a mock
redirect to a different feature
delete the requirement
reuse an unrelated route
```

---

# Agent skills

Repository skills are operational procedures.

Use the relevant skill instead of recreating its workflow manually.

Known workflows include:

## Discovery and planning

- `grilling` / `grill-me`

  - interactive requirements interview

- `grill-with-docs`

  - requirements interview grounded in ADRs/domain documentation

- `batch-grill-me`

  - collect multiple open questions at once

## Specification

- `to-spec`

  - synthesize an existing plan into one specification issue
  - no requirements interview

- `to-tickets`

  - split a plan into blocking tracer-bullet tickets

## Long-running work

- `wayfinder`

  - shared map issue plus child ticket issues
  - use when work is larger than one reasonable session

## QA and issue handling

- `qa`

  - conversational bug intake and GitHub issue creation

- `triage`

  - categorize issues/PRs using canonical triage labels

## Architecture/domain

- `domain-modeling`

  - terminology, domain modeling, ADR work

- `improve-codebase-architecture`

  - architecture/refactor scanning

## API contracts

- `query-api`

  - inspect canonical backend routes, parameters, and schemas

Use it before modifying API-facing mobile code or API-derived fixtures.

## Retrospective

If the `retro` skill is available, use it for substantial or long-running implementation work.

Invoke it at meaningful checkpoints, particularly when:

- a planned approach fails twice
- tests expose a wrong assumption
- a change causes unexpectedly broad regressions
- the diff grows faster than the simplification achieved
- an architectural boundary turns out to be wrong
- a major migration/refactor checkpoint completes
- you are about to expand a newly introduced pattern across many files

A retro must influence subsequent work.

Do not invoke it ceremonially and ignore the result.

---

# Self-steering for long-running work

For autonomous implementation, continuously operate as:

```text
OBSERVE
→ REASSESS
→ PRIORITIZE
→ EXECUTE
→ VALIDATE
→ RETRO
→ UPDATE PLAN
→ repeat
```

Do not blindly execute an initial plan after repository evidence changes.

## Observe

Inspect current reality:

```text
git status
current diff
tests
type errors
lint errors
domain contracts
architecture boundaries
new coupling
remaining legacy behavior
blockers
```

## Reassess

Ask internally:

```text
What assumption changed?
Did this actually simplify ownership?
Did I create duplicated behavior?
Did a prerequisite appear?
Can obsolete code now be removed?
Is the planned next task still the highest-leverage task?
```

## Prioritize

Prefer:

```text
correctness
product contract
behavior preservation
security
architectural ownership
testability
simplicity
performance where relevant
cleanup
```

Do not optimize for number of files changed.

## Execute

Work in small coherent batches with one clear purpose.

## Validate

Use the cheapest relevant check first, then expand validation as needed.

## Retro

Use the `retro` skill when available at major boundaries or when the current approach is producing friction.

## Update plan

Repository evidence overrides the initial roadmap.

If blocked on one task, document the blocker and continue independent work.

---

# Issue tracker

Issues are tracked in GitHub Issues using `gh`.

Read:

```text
docs/agents/issue-tracker.md
docs/agents/triage-labels.md
docs/agents/domain.md
```

Canonical triage states:

```text
needs-triage
needs-info
ready-for-agent
ready-for-human
wontfix
```

Do not invent alternate triage labels for the same lifecycle states.

---

# Typical workflow

A normal feature workflow is approximately:

```text
grilling / grill-with-docs
→ to-spec / to-tickets
→ query-api when an API contract is involved
→ implementation
→ validation
→ triage as issues appear
→ wayfinder when scope exceeds one session
```

This is guidance, not mandatory ceremony.

Use only the steps justified by the task.

---

# Code style

Follow:

```text
CODE_STYLES.md
```

for:

- formatting
- import grouping
- feature architecture
- NativeWind conventions
- Jest conventions
- naming
- composition patterns

Do not create competing style conventions in this file.

---

# Large screens

Before creating or substantially expanding a screen that is likely to:

- exceed roughly 400 lines, or
- contain multiple independently testable visual regions

read:

```text
CODE_STYLES.md §3 — Large Screen Composition
```

Prefer:

```text
feature-local components
→ assembled by the screen
```

Promote a component to global `src/components/` only when it is genuinely domain-agnostic and has a second real consumer.

Do not create global abstractions for hypothetical reuse.

---

# Mobile-first validation

Android and iOS behavior are the target.

Focus implementation and validation on native mobile behavior.

Do not spend time on:

```text
React Native Web
browser-only layout
web bundling optimization
web-specific routing
desktop browser behavior
```

unless explicitly requested.

For native-facing changes, consider both platforms even when only one platform can be executed locally.

Document intentional platform differences.

---

# Package management

Use Bun by default.

Examples:

```bash
bun install
bun add <package>
bun remove <package>
bun run <script>
bun test
```

Before installing or upgrading an Expo-managed package, verify SDK 57 compatibility using the versioned Expo documentation.

Do not introduce a second package-manager lockfile.

Do not replace Bun with npm, pnpm, or Yarn unless explicitly required.

---

# API changes

Before modifying `src/api/*` or any API-derived fixture:

1. Read the routed domain rulebook/spec.
2. Use `query-api`.
3. Verify route.
4. Verify HTTP method.
5. Verify path/query parameters.
6. Verify request body.
7. Verify response schema.
8. Verify relevant error states.
9. Inspect existing API abstraction conventions.

The OpenAPI contract is canonical for transport shape.

The rulebooks/specs are canonical for domain semantics.

If they conflict, do not silently choose one. Record the mismatch.

---

# Gotchas

Read:

```text
docs/agents/gotchas.md
```

before implementation.

If a failure or discovery is likely to affect future unrelated sessions, append a concise reusable entry.

Good gotchas contain:

```text
symptom
cause
correct approach
relevant command/path
```

Do not add one-off debugging diary entries.

---

# Subagents and parallel work

The main agent owns:

```text
shared worktree
branch
Git mutations
integration
final validation
```

For delegated implementation, assign:

- one writer per file
- an explicit file allowlist
- a clear responsibility boundary

Subagents should use read-only Git inspection.

Each implementation handoff must include:

```text
changed files
git status --short --untracked-files=all
git diff --stat <base>
validation performed
```

Before accepting a handoff, the main agent must verify that every modified/untracked path is inside the assigned allowlist.

A subagent may cite a repository rule only as:

```text
path/to/file:line
```

Do not accept invented rule names or fabricated lint constraints.

Avoid parallel writers touching the same file.

---

# Git safety

Before editing:

```bash
git status --short --untracked-files=all
```

Never destroy work that predates the current task.

Do not use routine destructive commands such as:

```text
git reset --hard
git clean -fd
project reset scripts
```

to resolve ordinary implementation problems.

If your own approach must be backed out, revert only your own changes safely.

The main agent owns commits and other Git mutations during subagent work.

---

# Tests

Tests represent preserved product behavior.

Before changing complex logic, inspect existing tests.

For risky behavior changes, prefer characterization coverage before refactoring.

Never modify a test merely because implementation changed.

A test change requires a contract reason.

When fixing a bug:

```text
reproduce
→ identify owning code
→ add/adjust behavioral coverage where useful
→ fix smallest owning path
→ validate
```

Do not hide regressions by snapshot churn.

---

# Validation

Use repository scripts rather than guessed commands.

Inspect `package.json` first.

Prefer focused checks while iterating, then broader validation before delivery.

Typical order:

```text
targeted test
→ typecheck
→ affected test suite
→ lint
→ broader mobile validation where justified
```

For Expo/native dependency, configuration, routing, or development-build changes, use the repository's corresponding native validation scripts.

Do not treat successful web execution as proof of Android/iOS correctness.

---

# Deletions and compatibility changes

At delivery, inspect every:

```text
deleted file
changed test
changed fixture
changed persisted key
changed API contract
changed navigation route
compatibility fallback removal
```

Each must be:

- directly required by the task, or
- explicitly justified by the resulting architecture/product contract.

Do not perform opportunistic deletion.

---

# Delivery checklist

Before finishing:

1. Re-read the task.
2. Inspect `git status`.
3. Inspect changed files.
4. Verify changed paths belong to the task.
5. Run relevant validation.
6. Confirm Android/iOS implications.
7. Confirm API work matches `query-api`.
8. Confirm domain language matches `CONTEXT.md`.
9. Confirm applicable rulebooks/specs were followed.
10. Confirm no unrelated test was weakened.
11. Confirm no unrelated file was deleted.
12. Confirm no persisted contract was silently broken.
13. Add a reusable gotcha if the session uncovered one.
14. Run `retro` for substantial long-running work when available.

Report:

- what changed
- validation performed
- known limitations/blockers
- any intentional compatibility changes

Do not claim validation that was not actually run.
