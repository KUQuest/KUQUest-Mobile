# Canonical Quest Adapter for Candidate Proposals and Partial-Start Consent

**Status:** Accepted for prototype

For the mobile prototype, `src/features/questBoard/questFixtures.ts` (`questFixtures`) is the single fixture catalog and `src/features/questBoard/questFixtureAdapter.ts` (`questFixtureAdapter`) is the canonical adapter and source of truth for Quest, Quest Team, Candidate Proposal/Quest Application, invitation, Assignment, Consent, Settlement, and Work Chat state. Screens and routes must consume the adapter rather than derive competing domain state; the exact lifecycle values are `QUEST_DRAFT`, `QUEST_OPEN`, `QUEST_ASSIGNED`, `QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT`, `QUEST_AWAITING_EDIT_CONSENT`, `QUEST_IN_PROGRESS`, and `QUEST_CANCELLED`.

The adapter models multiple independent team Proposals, one team per Worker per Quest, non-empty partial team submission, `TEAM_SUBMITTED` review/roster locking, one-team Selection with automatic rejection of competing submissions, and requested-versus-actual headcount settlement/refund. Manual Proposal rejection leaves the Quest `QUEST_OPEN` but makes that Proposal unable to resubmit; a withdrawn individual Quest Application may be replaced by a new Proposal while the Quest remains open. A direct partial Group start freezes the roster and requires unanimous Hirer + joined-Worker approval within 5 minutes; approval enters `QUEST_IN_PROGRESS`, while rejection or timeout enters `QUEST_CANCELLED` with full refund, removed Assignments, and read-only Work Chat. Edit consent remains a separate 5-minute unanimous-worker vote in `QUEST_AWAITING_EDIT_CONSENT` with rollback on rejection or timeout.

This decision covers prototype/local fixture behavior only. The backend API contract does not yet define these fields and transitions, so the adapter's representation remains provisional and must be reconciled with the backend contract before production integration.

## Prototype boundaries

- The four hidden, route-addressable scenario records are `team-forming-demo`, `team-selection-demo`, `single-candidate-demo`, and `partial-group-start-demo`; normal Quest Board discovery excludes them.
- The four deterministic prototype personas are Hirer, Applicant, Quest Team Leader, and Worker. `questFixtureAdapter.reset()` restores their Team, Proposal, invitation, Assignment, Consent, Settlement, Work Chat membership, and session-message state to the catalog seed.
- Work Chat IDs, membership, and capabilities come from the adapter. Prototype adapter messages are session-only and are not persisted to SecureStore or a local database.
- Quest drafts use SecureStore only. The entire `src/data/localDemo` path must be deleted, and the legacy `questApplication` store and static domain fallbacks must likewise be removed rather than retained as compatibility sources.
- Create Quest Review uses the existing shared bottom-sheet surface; no new dependency is introduced.

## Considered options

- Keep lifecycle, team, consent, settlement, application, or chat decisions in individual screens, legacy stores, or static fixtures. Rejected because those projections can disagree about Proposal Selection, frozen rosters, chat access, and refunds.
- Wait for the backend contract before modeling the behavior. Rejected for the prototype because the mobile flows need deterministic state transitions and acceptance coverage now.
- Use one fixture catalog plus one canonical local adapter. Chosen to keep the four participation/mode combinations, exact consent states, persona scenarios, and reset behavior consistent while keeping the backend boundary explicit.

## Consequences

- Candidate Proposal, team Selection, partial-start consent, requested/actual settlement, and session chat behavior can be exercised deterministically without presenting local fixtures as persisted production data.
- SecureStore remains the only draft persistence boundary, while adapter reset provides deterministic scenario state without a second database.
- Adapter field names and lifecycle mappings may change when the backend contract is finalized; the behavior specification and this ADR must be revisited at that boundary.
