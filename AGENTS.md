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
- `CODE_STYLES.md` — review standards, composition, NativeWind, and Jest conventions
- `docs/agents/nativewind.md` — NativeWind v5 styling and token reference
- `docs/agents/mobile-validation.md` — canonical staging and native device smoke flow
- `docs/agents/engineering-workflow.md` — detailed planning, delegation, safety, testing, and delivery workflow
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

# Engineering workflow

Read `docs/agents/engineering-workflow.md` for planning, delegation, Git
safety, testing, validation, and delivery. Keep this file to repository
navigation, domain authorities, and hard invariants.

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

# Code and native style

Read `CODE_STYLES.md` for review standards, composition, NativeWind, and Jest
conventions. Read `docs/agents/mobile-validation.md` before native smoke work.

---

# Package management

Use Bun and the scripts in `package.json`:

```bash
bun install
bun run <script>
bun run test
bun run verify
```

Before installing or upgrading an Expo-managed package, verify SDK 57
compatibility using the versioned Expo documentation. Do not introduce a
second package-manager lockfile or replace Bun with another package manager.

---

# Delegation, safety, tests, validation, and delivery

Read `docs/agents/engineering-workflow.md` for shared-worktree ownership,
file allowlists, handoff evidence, Git safety, behavioral test rules,
validation order, compatibility/deletion checks, and final reporting.
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
