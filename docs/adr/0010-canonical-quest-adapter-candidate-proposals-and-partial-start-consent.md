# Canonical Quest Adapter and Workflow for Candidate Proposals and Partial-Start Consent

**Status:** Superseded by Mirrored Backend Rulebook (`docs/rulebook/quest/`, synced from `KUQuest-API-Server` at commit `fc47a089f5ae4d40914ac771baef9f2e7a0bef63`)

## Context

During early mobile prototyping, `src/features/questBoard/questFixtureAdapter.ts` provided a provisional state machine and fixture model for candidate proposals, partial-start consent, and group formation before the backend contracts were finalized.

## Decision and Alignment with Backend Rulebook

The backend rulebook is the authoritative source of truth. The provisional prototype states and mechanisms have been reconciled with the accepted backend contracts:

1. **Canonical Quest States**:
   - Exactly 7 states: `QUEST_DRAFT`, `QUEST_OPEN`, `QUEST_ASSIGNED`, `QUEST_IN_PROGRESS`, `QUEST_COMPLETED`, `QUEST_CANCELLED`, and `QUEST_FAILED`.
   - The provisional intermediate states (`QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT`, `QUEST_AWAITING_EDIT_CONSENT`, and legacy `QUEST_AWAITING_CONSENT`) are retired from the Quest state enum.
2. **Underfilled FCFS Group Consent Gate**:
   - At `startTime`, an underfilled `GROUP + FIRST_COME_FIRST_SERVED` Quest triggers a 10-minute Hirer choice, followed by a 10-minute Active Worker consent gate showing the exact split reward and `dueAt`. Unanimous consent moves the Quest from `QUEST_OPEN` &rarr; `QUEST_ASSIGNED`. Rejection or timeout moves it to `QUEST_CANCELLED` with a full refund.
3. **Quest Edit Protocol**:
   - Permitted strictly within `QUEST_ASSIGNED`. Hirer submits proposed condition edits. All Active Workers have 10 minutes to accept. Unanimous accept &rarr; `EDIT_REQUEST_APPLIED`; any decline or timeout &rarr; `EDIT_REQUEST_FAILED`. Does not pause or change Quest State.
4. **Candidate Team Formation**:
   - Teams for `GROUP + CANDIDATE` form using a Server-generated **Join Code** (valid for 24 hours, regeneratable by the Team Leader). The Team Leader submits the team at exact headcount (`TEAM_SUBMITTED`). Hirer selects one submitted team (`TEAM_SELECTED`) &rarr; `QUEST_ASSIGNED`.
5. **Start Work Gate**:
   - Required starter(s) press Start Work between `startTime` and `dueAt` &rarr; `QUEST_IN_PROGRESS`. Missing start at `dueAt` transitions directly to `QUEST_FAILED`.
6. **Proof and Terminal Failure**:
   - Proof submitter submits 1–5 files before `dueAt`. 24-hour review window. Rejection (`PROOF_NOT_APPROVED`) or missing submission at `dueAt` transitions the Quest to `QUEST_FAILED` with an Admin Review Item. No Rework cycle.

## Consequences

- Mobile UI and fixture adapters must project the canonical 7 states and accepted protocols.
- Prototype fixtures and tests align with the backend rulebook contracts defined in `docs/specs/quest-state-summary.md` and `docs/specs/group-quest-behavior.md`.
