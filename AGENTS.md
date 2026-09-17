# KUQuest Mobile Agent Guide

```
use bun by default
```

## Platform focus

This repository is an Expo app for native Android and iOS. Treat Android and iOS behavior as the product target and keep implementation, testing, and run instructions focused on mobile.

Web support and web-specific optimization are out of scope unless the user explicitly asks for them. Keep responses focused on the requested mobile behavior rather than explaining development-server internals.

Native Google Sign-In requires an installed development build; use the mobile development-build scripts in `package.json` rather than Expo Go when validating the app.

## Expo version

Expo has changed. Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing code.

---

## Domain Authority & Reference Docs

Always use the canonical ubiquitous language from `CONTEXT.md`.

- **Glossary & Domain Language**: Root `CONTEXT.md`.
- **Deterministic Routing Directory**: `docs/agents/routing.md` — routes directly by feature, task branch, or user persona.
- **Mirrored Backend Rulebook (Source of Truth)**: `docs/rulebook/` (synced from `KUQuest-API-Server` at commit `1b55199d74d2e73a4a05a4662e49fb643cbee3e6`):
  - **Quest & Work Chat**: `docs/rulebook/quest/quest-work-chat-rulebook.md` and sub-contracts.
  - **Finance & Wallet**: `docs/rulebook/finance/finance-rulebook.md` and sub-contracts.
  - **Admin Operations**: `docs/rulebook/admin/admin-rulebook.md` and sub-contracts.
- **Backend OpenAPI Specification**: `docs/api/api.yaml` (canonical backend routes/schemas) — inspect via `bun run query-api` / `query-api` skill; do not read or grep the 50k-line file directly.
- **Mobile Domain Specifications**:
  - Quest States & Lifecycle: `docs/specs/quest-state-summary.md`
  - Group & Candidate Matrix: `docs/specs/group-quest-behavior.md`
  - Wallet & Payments: `docs/specs/wallet-and-payments.md`
  - Conversations & Work Chat: `docs/specs/conversation-and-work-chat.md`
  - Proofs & Rating Reviews: `docs/specs/proof-and-rating-reviews.md`
  - Student Profile Redesign: `docs/specs/student-profile-redesign.md`
- **Architecture Decisions**: `docs/adr/` (e.g. `0001` through `0010`).
- **UI Navigation & System Design**: `docs/system-design-specification.md`.

---

## Clarifying Domain Context

When a request touches a Quest, Work Chat, Candidate Inquiry, Profile, or Money/Wallet flow, identify the active branch before planning or coding. Read the domain docs first. If context is missing, clarify these facts in order:

1. **Actor**: `Hirer`, `Worker`, `Candidate`, `Prospective Worker`, or `Accepted Participant`.
2. **Quest State**: One of the canonical 7 states (`QUEST_DRAFT`, `QUEST_OPEN`, `QUEST_ASSIGNED`, `QUEST_IN_PROGRESS`, `QUEST_COMPLETED`, `QUEST_CANCELLED`, `QUEST_FAILED`).
3. **Selection Mode**: `FIRST_COME_FIRST_SERVED` (FCFS) or `CANDIDATE`. (Never use legacy `NO_CANDIDATE`).
4. **Participation**: `SINGLE` (headcount = 1) or `GROUP` (headcount > 1, up to 20).
5. **Submission Rules**: `proofRequired` (true/false) and `dueAt` when touching Sent Work, Proof Submission, review, deadline, or settlement.

Ask one missing fact at a time when interviewing the user. State known context before asking.

---

## Agent Skills & Workflow

### Issue tracker & Triage

- Issues live in GitHub Issues (`gh` CLI). See `docs/agents/issue-tracker.md`.
- Canonical triage labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.
- Domain guidelines: `docs/agents/domain.md`.

### Workflow

- Idea → sharpened plan: `grilling`/`grill-me` (interview only), `grill-with-docs` (interview + ADR/glossary), `batch-grill-me` (many open questions at once).
- Plan → issue tracker: `to-spec` (synthesis, no interview, one spec issue), `to-tickets` (breaks plan into blocking tracer-bullet tickets).
- Work bigger than one session: `wayfinder` — shared map issue + child ticket issues with blocking edges, resolved one at a time.
- Bug reports / QA: `qa` — conversational bug intake, files GitHub issues.
- Issue lifecycle: `triage` — categorises issues/PRs into the five labels above.
- Domain/architecture: `domain-modeling` (terminology, ADRs), `improve-codebase-architecture` (refactor scan).
- API contract inspection: `query-api` — search routes, parameters, and schemas (`bun run query-api`) before modifying `src/api/*` or mock fixtures.

Typical chain: `grilling`/`grill-with-docs` → `to-spec`/`to-tickets` → `query-api` (API contract check) → `triage` as issues come in → `wayfinder` if scope exceeds one session.

### Gotchas

- Read `docs/agents/gotchas.md` before working in this repo.
- Append to `docs/agents/gotchas.md` when a session's failure generalizes beyond the current task.

---

## Code Style

Follow `CODE_STYLES.md` at the repo root for formatting, import grouping, feature architecture, NativeWind UI conventions, and Jest testing standards.

---

## Subagent Workflow

For delegated or parallel work, keep one writer per file; use read-only scout/reviewer/verifier roles for independent work.

- Require each subagent handoff to list the files it changed.
- Require a handoff to cite a repo rule by `file:line` or not at all: a handoff once reported the lint rule `ts-no-tiny-functions`, which `eslint.config.js` does not define.

---

## Repository Map & Preserve-First Debugging

Before any code, route, fixture, API, test, or deletion task, read [`docs/agents/repository-context.md`](docs/agents/repository-context.md). It contains the current source tree, ownership seams, compatibility drift, test topology, and the safe debugging contract. Use [`CONTEXT.md`](CONTEXT.md) for domain language, [`docs/agents/routing.md`](docs/agents/routing.md) to select the rulebook/spec/ADR branch, and `query-api` for backend API contracts.

Non-negotiable preservation rules:

- Debug the smallest owning path, especially code created or changed in the current task.
- Preserve pre-existing tests, fixtures, source files, documentation, and QA evidence.
- Never delete, disable, skip, weaken, or rename an unrelated test to make a failure disappear.
- Never use reset/clean commands or project reset scripts as routine debugging.
- Change a test only when the product contract intentionally changed; keep the replacement assertion behavioral.
- Delete a pre-existing file or test only with explicit user approval and a documented reason.
- Remove imports, variables, and functions that your change made unused; leave pre-existing dead code alone and mention it instead of deleting it.
- When a route, fixture, API, or rulebook surface is absent, record it as a gap instead of inventing a substitute or deleting the corresponding requirement.

At delivery, verify the changed-file list and confirm every deletion, test change, and compatibility change is directly requested or explicitly justified.
