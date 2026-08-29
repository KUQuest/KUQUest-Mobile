# Group and Candidate Quest Behavior

This document is the behavior source of truth for the four `Participation` + `Candidate Mode` combinations. The canonical combinations are `SINGLE` or `GROUP` with `CANDIDATE` or `NO_CANDIDATE`; `NO_CANDIDATE` is the canonical value for the user-facing First-Come-First-Served flow.

The short lifecycle labels used in prose map to these exact adapter values:

| Short label | Exact lifecycle value |
| --- | --- |
| `DRAFT` | `QUEST_DRAFT` |
| `OPEN` | `QUEST_OPEN` |
| `ASSIGNED` | `QUEST_ASSIGNED` |
| Partial Group start consent | `QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT` |
| Edit consent | `QUEST_AWAITING_EDIT_CONSENT` |
| `IN_PROGRESS` | `QUEST_IN_PROGRESS` |
| `CANCELLED` | `QUEST_CANCELLED` |

`QUEST_AWAITING_CONSENT` is a legacy generic value only. It must not be emitted for either consent flow; an old edit-consent use is projected as `QUEST_AWAITING_EDIT_CONSENT`. A failed pre-start Quest uses `QUEST_CANCELLED`.

## Domain quantities and records

- **Requested headcount** is the Hirer's requested capacity. It is `1` for every `SINGLE` Quest and is the number of reward places initially funded for a `GROUP` Quest.
- **Actual headcount** is the number of Workers in the roster that is selected or approved to start. It is fixed at direct admission for a `SINGLE` Quest, when a full direct Group reaches capacity, when a Candidate is selected, or when a partial Group start receives unanimous consent.
- **Proposal** is a Candidate's request for Selection. A `SINGLE + CANDIDATE` Proposal names one Applicant; a `GROUP + CANDIDATE` Proposal names one submitted Quest Team roster. A Quest Application is the transport-compatible record for an individual Proposal.
- **Selection** is the Hirer's one-time decision to accept one eligible Proposal. Selection creates the Worker Assignments and opens Work Chat for the selected roster.
- **Settlement** pays the reward for Actual Headcount. Reserved reward places from Requested Headcount minus Actual Headcount are refunded; a Quest cancelled before work starts receives a full refund and has no active Assignments.

A Hirer funds Requested Headcount before publishing. An invitation or Proposal does not create a Worker: a Worker relationship and Quest Assignment exist only after a direct join or Selection.

## Role and action matrix

| Role or actor | `SINGLE + NO_CANDIDATE` | `SINGLE + CANDIDATE` | `GROUP + NO_CANDIDATE` | `GROUP + CANDIDATE` |
| --- | --- | --- | --- | --- |
| Hirer | Publishes, funds, and may cancel; cannot join their own Quest. | Publishes, reviews Proposals, may manually reject while leaving the Quest `OPEN`, selects one winner, and may cancel; cannot apply. | Publishes, funds, may cancel, and must vote in a partial-start gate. | Publishes, reviews only `TEAM_SUBMITTED` Proposals, may manually reject while leaving the Quest `OPEN`, selects one team, and may cancel; cannot join a team. |
| Eligible KU Account Holder | Joins directly if capacity is available. | Submits one individual Proposal; may withdraw before Selection and may reapply after withdrawal while the Quest remains `OPEN`. | Joins directly if capacity is available; the first join opens shared Work Chat. | Creates or joins at most one Quest Team for this Quest; an invited member accepts or declines before submission. |
| Applicant | Not applicable. | May submit one Proposal; several Applicants may submit concurrently. A withdrawn Proposal can be replaced by a new Proposal; a rejected Proposal cannot be resubmitted. | Not applicable. | A team member is represented by the team's roster Proposal, not by an individual Proposal. |
| Quest Team Leader | Not applicable. | Not applicable. | Not applicable; this mode creates no team. | Uses KU-member search to invite members, reviews the accepted roster, submits any non-empty roster, and cannot change it after submission. |
| Invited KU Account Holder | Not applicable. | Not applicable. | Not applicable. | Accepts or declines an invitation within 24 hours. A declined or expired invitation may be replaced by the Leader before submission. |
| Worker | Becomes the sole Worker after the direct join. | Becomes the sole Worker only if their Proposal is selected. | Becomes a Worker on direct join; joined Workers vote in a partial-start gate. | Becomes a Worker only when their submitted team is selected; each member receives a separate Assignment. |
| System / adapter | Creates the Assignment and applies exact start-time transitions. | Keeps a manual rejection at `QUEST_OPEN`, allows a withdrawn Applicant to reapply, selects one winner, auto-rejects competing Proposals, and creates one Assignment. | Opens shared chat on first join, freezes a partial roster at start, records consent, and settles or refunds by Actual Headcount. | Stores independent teams, exposes only `TEAM_SUBMITTED` Proposals to the Hirer, rejects competing teams after Selection, creates one Assignment per selected member, and settles or refunds by Actual Headcount. |

The Hirer is never a Worker on the same Quest. A pending Proposal, pending invitation, or forming team does not grant Work Chat access or create an Assignment.

## `SINGLE + CANDIDATE`

- `headcount = 1` (Requested Headcount is exactly `1`).
- The Quest may receive multiple individual Proposals, one from each eligible Applicant. An Applicant may have at most one active Proposal for the Quest.
- An Applicant may withdraw their pending Proposal before the Hirer selects a winner. The withdrawn record remains `APPLICATION_WITHDRAWN`; the Applicant may submit a new Proposal while the Quest is still `QUEST_OPEN` and no Selection has occurred.
- A Hirer may manually reject an individual Proposal while the Quest remains `QUEST_OPEN`. The rejected record is `APPLICATION_REJECTED` and cannot be resubmitted; rejection does not select another Applicant or create an Assignment.
- The Hirer selects exactly one winner. The winner becomes `APPLICATION_SELECTED`, every competing pending Proposal becomes `APPLICATION_REJECTED`, and the winner receives one Quest Assignment and Work Chat access.
- Selection fixes Actual Headcount at `1`. There is no additional Worker after Selection, and no new individual Proposal can change the selected roster.
- Before start, the selected Quest is `QUEST_ASSIGNED`; at `startTime` it becomes `QUEST_IN_PROGRESS`. If no Applicant is selected when the participation window closes or start is reached, the Quest becomes `QUEST_CANCELLED` with a full refund and no active Assignment.

## `SINGLE + NO_CANDIDATE`

- The Requested Headcount is exactly `1`; there are no Proposals or Quest Teams.
- The first eligible KU Account Holder to join becomes the sole Worker and receives one Quest Assignment and Work Chat access.
- A successful join moves the Quest from `QUEST_OPEN` to `QUEST_ASSIGNED`. At `startTime`, it moves to `QUEST_IN_PROGRESS`.
- If no Worker has joined at `startTime`, the Quest moves from `QUEST_OPEN` to `QUEST_CANCELLED` with a full refund. There is no partial-start consent because a single Quest is either empty or full.

## `GROUP + CANDIDATE`

### Independent teams and invitations

- The Quest accepts multiple independent team Proposals. A KU Account Holder may belong to at most one Quest Team for this Quest, either as Leader or member; the same Worker cannot be used in two competing rosters.
- A Quest Team Leader creates a team and invites KU Account Holders found through KU-member search. A team has no user-editable name; its identity is its Leader and roster.
- An invitation is pending for 24 hours from creation. The invited person may accept or decline while it is pending. An expired or declined invitation does not occupy the final roster and may be replaced by the Leader before submission; a pending invitation is not a roster member.
- The Leader may not invite the Hirer, themself, a person already on another team for this Quest, or a person with a duplicate pending invitation.

### Partial Proposal submission and Selection

- The Leader's Review step shows the accepted roster and Requested Headcount. Any non-empty roster, including the Leader alone, may be submitted as a partial Proposal; it does not have to fill Requested Headcount.
- Confirming Review is the submit action: it submits one team Proposal and changes the team to `TEAM_SUBMITTED`. This confirmation locks the roster; no new invitation, invitation response, replacement, removal, or team edit can change it. Unaccepted or pending invitees cannot join after submission.
- The Hirer sees only team Proposals whose team status is `TEAM_SUBMITTED`. Forming teams and pending invitations are not selectable.
- A Hirer may manually reject one submitted team while the Quest remains `QUEST_OPEN`. That team becomes `TEAM_REJECTED` and its Proposal cannot be resubmitted; other submitted teams remain eligible for Selection.
- The Hirer accepts exactly one submitted team and automatically rejects every other submitted team. The selected team becomes `TEAM_SELECTED`; every member of its locked roster receives a separate Quest Assignment and access to the selected Work Chat.
- The selected team may be smaller than Requested Headcount. Selection fixes Actual Headcount to the selected roster size, and the Quest is `QUEST_ASSIGNED` until `startTime`, then `QUEST_IN_PROGRESS`. The selected roster does not enter partial-start consent: Selection is the Hirer's approval to proceed with that actual roster.
- Once a team is selected, no new Worker, Proposal, invitation acceptance, or roster change is allowed. A selected team remains immutable through the Quest.
- Rewards settle once per selected Worker. The difference between Requested and Actual Headcount is refunded; an accepted two-person team on a requested three-person Quest settles two rewards and refunds one reserved place.
- If every submitted team is manually rejected, the Quest remains `QUEST_OPEN` until its participation window closes or a later cancellation; no rejected team can resubmit.

## `GROUP + NO_CANDIDATE`

### Direct joins and shared chat

- There are no Proposals, Quest Teams, Leaders, or invitations. Eligible KU Account Holders join directly in arrival order until Requested Headcount is reached.
- The first successful join creates shared Work Chat for the Hirer and joined Workers. Each later join adds one Worker and one separate Quest Assignment while the Quest is `QUEST_OPEN`.
- A partial Quest remains `QUEST_OPEN` before `startTime` and may accept more Workers. When Actual Headcount reaches Requested Headcount, it becomes `QUEST_ASSIGNED` and stops accepting joins.

### Start-time gate for a partial roster

At `startTime`, the direct Group Quest follows exactly one path:

1. **Full roster:** `QUEST_ASSIGNED` becomes `QUEST_IN_PROGRESS` automatically. Actual Headcount equals Requested Headcount.
2. **Partial roster:** if at least one Worker has joined but Actual Headcount is below Requested Headcount, the Quest becomes `QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT`.
3. **Empty roster:** if no Worker has joined, the Quest becomes `QUEST_CANCELLED` with a full refund, no Assignments, and no writable Work Chat (any retained chat projection is read-only).

For `QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT`:

- The roster is frozen at the moment the gate opens. No new join, leave, replacement, or headcount change is accepted.
- The consent window is exactly 5 minutes. The required voters are the Hirer and every Worker in the frozen roster; all of them must approve. A partial-start vote is not an edit vote.
- The shared Work Chat remains readable and writable for its existing participants while the gate is pending. It does not admit new participants.
- Unanimous approval before the deadline changes the consent to `PARTIAL_START_APPROVED` and the Quest to `QUEST_IN_PROGRESS` with the frozen Actual Headcount. Settlement uses that Actual Headcount and refunds unused requested places.
- Any rejection changes the consent to `PARTIAL_START_REJECTED` and the Quest immediately to `QUEST_CANCELLED`. Reaching the 5-minute deadline without unanimous approval changes the consent to `PARTIAL_START_TIMED_OUT` and the Quest to `QUEST_CANCELLED`.
- Rejection or timeout receives a full refund; the frozen Assignments are removed, and Work Chat becomes read-only. No Worker may be added after cancellation.

A partial direct Group Quest never silently starts. It must receive unanimous approval from the Hirer and all joined Workers or it is cancelled.

## Edit consent

An edit request is a separate consent flow and must not reuse the partial-start state. The former edit-consent use of `QUEST_AWAITING_CONSENT` is renamed to `QUEST_AWAITING_EDIT_CONSENT`.

- A Hirer may request an allowed Quest edit after Assignments exist. The Quest enters `QUEST_AWAITING_EDIT_CONSENT` and stores the requested changes plus its previous lifecycle state.
- Every active Worker must vote within 5 minutes. The Hirer does not vote on this edit request; this is a unanimous-worker vote.
- If every active Worker approves before the deadline, the changes apply and the Quest returns to its previous lifecycle state.
- If any active Worker rejects, or the 5-minute window expires before unanimous approval, the requested changes are discarded and the Quest rolls back to its previous lifecycle state.
- A pending edit request cannot be replaced by another edit request. Partial-start consent and edit consent cannot be pending at the same time.

## Prototype source, persistence, and scenario harness

The prototype has one Quest fixture catalog and one canonical state adapter:

- `src/features/questBoard/questFixtures.ts` exports `questFixtures`, the catalog for normal discovery records and route/test-only scenario records. `prototypeOnly` records remain hidden from normal Quest Board results but are route-addressable.
- `src/features/questBoard/questFixtureAdapter.ts` exports `questFixtureAdapter`, the canonical source for Quest, Quest Team, Candidate Proposal/Quest Application, invitation, Assignment, both consent flows, Work Chat membership/capability, session messages, Actual Headcount, and Settlement state. Screens and route projections do not derive competing lifecycle state.
- The entire `src/data/localDemo` path must be deleted; it is not a valid source and must not be used as a compatibility fallback. The legacy `src/features/questBoard/questApplication` store and static domain fallbacks must likewise be removed, not treated as sources of truth.
- Quest drafts are persisted only through SecureStore. Draft persistence is separate from the fixture adapter and never uses `src/data/localDemo`, the Quest catalog, or adapter state.
- The adapter owns prototype Work Chat conversation membership and capability. Adapter chat messages are session-only in-memory state: they are not persisted to SecureStore or a local database, and `reset()` clears them.
- Create Quest Review uses the existing shared bottom-sheet review surface for summary and publish checks; no new dependency is introduced for this review step.

### Hidden scenario routes and personas

These four prototype-only route IDs are hidden from discovery but must remain addressable for acceptance coverage:

| Hidden scenario route | Primary behavior covered | Persona(s) exercised |
| --- | --- | --- |
| `team-forming-demo` | KU-member search, 24-hour invitation, decline/expiry replacement, and partial `TEAM_SUBMITTED` Proposal. | Team Leader (`demo-team-leader`) and invited Worker. |
| `team-selection-demo` | Multiple independent submitted teams, manual rejection that leaves the Quest open, and one-team Selection. | Hirer (`demo-hirer`) and competing Team Leaders. |
| `single-candidate-demo` | Multiple individual Proposals, withdrawal/reapply, manual rejection, and one-winner Selection. | Hirer (`demo-hirer`) and Applicant (`single-applicant-a`). |
| `partial-group-start-demo` | First shared-chat join, frozen partial roster, five-minute unanimous consent, and cancellation. | Hirer (`demo-hirer`) and joined Workers (`student-demo`, `demo-worker-2`). |

The four deterministic prototype personas are **Hirer**, **Applicant**, **Team Leader**, and **Worker**. Peer identities used to demonstrate multiple Proposals or joined rosters are seeded in the same catalog and do not create a second source of truth.

`questFixtureAdapter.reset()` restores the catalog seed for all four personas and clears mutations to Teams, Proposals, invitations, Assignments, consent responses, Actual Headcount, Settlement, Work Chat membership, and session messages. Reset is an adapter scenario reset, not a second draft store; SecureStore draft data remains governed by SecureStore persistence.

## Lifecycle state transitions

These are the canonical Quest lifecycle states for this behavior. Post-work proof, review, completion, and dispute states continue under their existing rules.

| Exact state | Meaning | Allowed exits |
| --- | --- | --- |
| `QUEST_DRAFT` | Hirer is preparing and funding the Quest; it is not discoverable. | Publish → `QUEST_OPEN`; invalid funding or required fields block publish. |
| `QUEST_OPEN` | Published Quest accepts direct joins or Candidate Proposals according to its combination. | Capacity/Selection → `QUEST_ASSIGNED`; partial start → `QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT`; no participant or no Selection by close → `QUEST_CANCELLED`; Hirer cancellation → `QUEST_CANCELLED`. Manual Proposal rejection returns/remains here. |
| `QUEST_ASSIGNED` | The admitted or selected roster is fixed before start. | Full or selected roster at `startTime` → `QUEST_IN_PROGRESS`; Hirer cancellation → `QUEST_CANCELLED`; allowed edit request → `QUEST_AWAITING_EDIT_CONSENT`. |
| `QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT` | A non-empty direct Group roster is below Requested Headcount at start and awaits the five-minute unanimous Hirer + Worker vote. | Unanimous approval → `QUEST_IN_PROGRESS`; rejection or timeout → `QUEST_CANCELLED`. |
| `QUEST_AWAITING_EDIT_CONSENT` | An edit request awaits the five-minute unanimous active-Worker vote. | Unanimous approval → previous state with changes; rejection or timeout → previous state without changes. |
| `QUEST_IN_PROGRESS` | Quest is running with its fixed Actual Headcount roster. | Existing proof/completion rules; an allowed edit request → `QUEST_AWAITING_EDIT_CONSENT`; later cancellation follows the applicable policy. |
| `QUEST_CANCELLED` | Quest will not start or has been cancelled. | Terminal for these pre-start flows; no new Worker or Proposal is admitted. |

### Combination transition table

| Combination | Trigger | Result |
| --- | --- | --- |
| `SINGLE + NO_CANDIDATE` | First direct join | `QUEST_OPEN` → `QUEST_ASSIGNED`, Actual Headcount `1`, one Assignment. |
| `SINGLE + NO_CANDIDATE` | Start with the Assignment | `QUEST_ASSIGNED` → `QUEST_IN_PROGRESS`. |
| `SINGLE + NO_CANDIDATE` | Start with no Worker | `QUEST_OPEN` → `QUEST_CANCELLED`, full refund. |
| `SINGLE + CANDIDATE` | One or more individual Proposals | Quest remains `QUEST_OPEN`; no Assignment or chat is created. |
| `SINGLE + CANDIDATE` | Applicant withdraws before Selection | Proposal becomes `APPLICATION_WITHDRAWN`; Quest remains `QUEST_OPEN`, and the Applicant may submit a new Proposal. |
| `SINGLE + CANDIDATE` | Hirer manually rejects one Proposal | Proposal becomes `APPLICATION_REJECTED`; Quest remains `QUEST_OPEN`, and that Proposal cannot be resubmitted. |
| `SINGLE + CANDIDATE` | Hirer selects one individual | `QUEST_OPEN` → `QUEST_ASSIGNED`; one Proposal selected, competing pending Proposals rejected, one Assignment and chat. |
| `SINGLE + CANDIDATE` | Start after a winner is selected | `QUEST_ASSIGNED` → `QUEST_IN_PROGRESS`. |
| `SINGLE + CANDIDATE` | Close/start with no selected winner | `QUEST_OPEN` → `QUEST_CANCELLED`, full refund. |
| `GROUP + CANDIDATE` | Leader submits any non-empty roster | Team becomes `TEAM_SUBMITTED`; Quest remains `QUEST_OPEN`; roster is locked. |
| `GROUP + CANDIDATE` | Hirer manually rejects one submitted team | Team becomes `TEAM_REJECTED`; Quest remains `QUEST_OPEN`; that Proposal cannot be resubmitted. |
| `GROUP + CANDIDATE` | Hirer selects one submitted team | Team becomes `TEAM_SELECTED`; `QUEST_OPEN` → `QUEST_ASSIGNED`; one Assignment per member and selected chat. |
| `GROUP + CANDIDATE` | Start after team Selection | `QUEST_ASSIGNED` → `QUEST_IN_PROGRESS` with selected Actual Headcount. |
| `GROUP + CANDIDATE` | Close/start with no selected team | `QUEST_OPEN` → `QUEST_CANCELLED`, full refund; no team receives Assignments. |
| `GROUP + NO_CANDIDATE` | First join, below Requested Headcount | Shared chat opens; Quest remains `QUEST_OPEN`. |
| `GROUP + NO_CANDIDATE` | Direct joins reach Requested Headcount | `QUEST_OPEN` → `QUEST_ASSIGNED`; no consent gate. |
| `GROUP + NO_CANDIDATE` | Start with full roster | `QUEST_ASSIGNED` → `QUEST_IN_PROGRESS`. |
| `GROUP + NO_CANDIDATE` | Start with non-empty partial roster | `QUEST_OPEN` → `QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT`; roster freezes. |
| `GROUP + NO_CANDIDATE` | Hirer and every joined Worker approve within 5 minutes | Awaiting state → `QUEST_IN_PROGRESS`; Actual Headcount is frozen and unused places refund. |
| `GROUP + NO_CANDIDATE` | Any rejection or five-minute timeout | Awaiting state → `QUEST_CANCELLED`; full refund, Assignments removed, chat read-only. |
| `GROUP + NO_CANDIDATE` | Start with zero participants | `QUEST_OPEN` → `QUEST_CANCELLED`; full refund, no Assignments, and no writable chat. |

### Edit-consent transition table

| Current state | Trigger | Result |
| --- | --- | --- |
| `QUEST_ASSIGNED` or `QUEST_IN_PROGRESS` | Hirer requests an allowed edit | Enter `QUEST_AWAITING_EDIT_CONSENT`; save previous state and five-minute deadline. |
| `QUEST_AWAITING_EDIT_CONSENT` | Every active Worker approves in time | Apply all requested changes and return to saved previous state. |
| `QUEST_AWAITING_EDIT_CONSENT` | Any active Worker rejects | Discard all requested changes and return to saved previous state. |
| `QUEST_AWAITING_EDIT_CONSENT` | Five-minute deadline expires without unanimity | Discard all requested changes and return to saved previous state. |

## Proposal, team, invitation, consent, assignment, and chat states

| Record | States and rules |
| --- | --- |
| Individual Candidate Proposal / Quest Application | `APPLICATION_APPLIED` → `APPLICATION_WITHDRAWN` before Selection, `APPLICATION_SELECTED` by Hirer Selection, or `APPLICATION_REJECTED` by manual or automatic rejection. A withdrawn Applicant may submit a new Proposal while `QUEST_OPEN`; a rejected Proposal cannot be resubmitted. |
| Quest Team / team Proposal | `TEAM_FORMING` → `TEAM_SUBMITTED` after non-empty Review confirmation → `TEAM_SELECTED` or `TEAM_REJECTED`. Submission and Selection lock the roster; a rejected Proposal cannot be resubmitted. |
| Team Invitation | `INVITATION_PENDING` for 24 hours → `INVITATION_ACCEPTED`, `INVITATION_DECLINED`, `INVITATION_EXPIRED`, or `INVITATION_REVOKED`. Declined/expired invitations may be replaced only while the team is forming. |
| Partial-Start Consent | `PARTIAL_START_PENDING` → `PARTIAL_START_APPROVED`, `PARTIAL_START_REJECTED`, or `PARTIAL_START_TIMED_OUT`; required voters are the Hirer and every Worker in the frozen roster. |
| Quest Assignment | Created for each direct Worker or selected Candidate/team member; no pending Proposal or invitation has an Assignment. Assignments are removed when a partial-start gate rejects or times out. |
| Work Chat | Opens on the first direct Group join or after Candidate Selection. Adapter membership/capability is authoritative; messages are session-only. It is writable for active participants and while partial-start consent is pending, and read-only after cancellation or another terminal state. |

## Settlement and refund rules

For a reward of `rewardPerWorker`:

```text
reserved = rewardPerWorker × Requested Headcount
settled  = rewardPerWorker × Actual Headcount
refund   = reserved - settled
```

| Outcome | Requested Headcount | Actual Headcount | Settlement |
| --- | ---: | ---: | --- |
| Full direct Group starts | `3` | `3` | Settle three rewards; refund zero unused places. |
| Partial Candidate Team is selected | `3` | `2` | Settle two rewards; refund one reserved place. |
| Partial direct Group receives unanimous consent | `3` | `2` | Settle two rewards; refund one reserved place. |
| Pre-start partial consent rejects or times out | `3` | `0` | Full refund of all three reserved places; remove Assignments. |
| No participant reaches start | `3` | `0` | Full refund; no Assignments and no writable chat. |

Actual Headcount is fixed at Selection or unanimous partial-start approval. A cancelled pre-start Quest never settles a Worker reward.

## Invariants

1. Every `SINGLE` Quest has Requested Headcount `1` and can have at most one Actual Worker and one active Assignment.
2. A `GROUP` Actual Headcount never exceeds Requested Headcount. Requested Headcount is capacity, not a minimum; a partial actual roster is valid only after Candidate Selection or unanimous partial-start consent.
3. The Hirer cannot appear in the Worker roster, a Candidate Proposal, or a Quest Team for their own Quest.
4. `NO_CANDIDATE` has direct joins only. It creates no Applicant, Proposal, Quest Team, Team Leader, or invitation.
5. `SINGLE + CANDIDATE` accepts multiple individual Proposals but selects exactly one winner. A withdrawn Applicant may reapply while `QUEST_OPEN`; a rejected Proposal cannot be resubmitted.
6. `GROUP + CANDIDATE` allows multiple independent team Proposals, but each KU Account Holder belongs to at most one team per Quest. A team Proposal may be submitted only from a non-empty roster.
7. A submitted team has no name and an immutable roster. Only `TEAM_SUBMITTED` teams are visible to the Hirer for Selection; only one submitted team can become `TEAM_SELECTED`.
8. Manual Proposal rejection leaves the Quest `QUEST_OPEN` and makes that rejected Proposal terminal for resubmission. Selection auto-rejects competing Proposals, creates one Assignment per selected Worker, and prevents all later Worker additions or roster changes.
9. In a direct Group partial-start gate, the frozen roster cannot change and the required voters are exactly the Hirer plus every joined Worker. Approval is unanimous and expires after 5 minutes.
10. Edit consent is distinct from partial-start consent: only active Workers vote, the window is 5 minutes, and rejection or timeout rolls back the requested changes and prior state.
11. Actual Headcount is fixed at Selection or unanimous partial-start approval. Settlement pays Actual Headcount and refunds reserved places not used.
12. A pre-start `QUEST_CANCELLED` result has a full refund, no active Assignments, and read-only or absent Work Chat. A cancelled partial Group Quest never adds a Worker later.
13. The prototype has one `questFixtures` catalog and one `questFixtureAdapter` source for Quest, Team, Proposal/Application, Consent, Assignment, Settlement, and Chat state.
14. Prototype-only scenario records are hidden from discovery, the four personas use the same adapter, `reset()` restores deterministic seed state, and adapter chat messages are session-only.
15. Quest drafts use SecureStore only; `src/data/localDemo`, the legacy `questApplication` store, and static domain fallbacks are not valid state sources.

## Failure and edge cases

| Situation | Required behavior |
| --- | --- |
| Applicant withdraws before individual Selection | Mark the Proposal `APPLICATION_WITHDRAWN`; do not create chat or Assignment; allow a new Proposal while `QUEST_OPEN`. |
| Applicant tries to withdraw after Selection | Reject the action; the selected Assignment follows normal Quest cancellation rules. |
| Hirer manually rejects an individual or team Proposal | Keep the Quest `QUEST_OPEN`; mark the Proposal rejected; never allow that same Proposal to resubmit. |
| Two Applicants or teams are selected concurrently | Accept one atomic Selection; the first accepted decision wins and all competing submitted Proposals are rejected. |
| Team has only its Leader | It is non-empty and may submit; if selected, Actual Headcount is `1`. |
| Team has pending, declined, or expired invitees at Review | Count only accepted roster members. The Leader may replace declined/expired invitees before submit; pending invitees do not block a partial submit. |
| Leader tries to change a submitted team | Reject the action. The submitted roster is locked. |
| Invite is accepted after 24 hours or after submission | Reject the response; it cannot add a member. |
| Worker is invited to or joins two teams for one Quest | Reject the second membership; one Worker may belong to only one team. |
| Hirer views a forming or incomplete team | Do not show it as a selectable Proposal; show only `TEAM_SUBMITTED` teams. |
| Selected team is smaller than Requested Headcount | Accept it as a valid partial Selection; fix Actual Headcount to the roster, settle actual rewards, refund unused places, and do not recruit after Selection. |
| Direct Group is partial at start | Freeze the roster and enter `QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT`; never auto-start. |
| A required partial-start voter rejects | Immediately cancel, full-refund, remove Assignments, and make chat read-only. |
| Partial-start deadline is reached without unanimity | Treat the gate as timed out: cancel, full-refund, remove Assignments, and make chat read-only. |
| A new Worker tries to join while partial consent is pending | Reject the join because the roster is frozen. |
| No Worker joins a direct Group by start | Cancel with a full refund, no Assignments, and no writable chat. |
| A duplicate or late partial-start vote is submitted | Reject it; only the Hirer and frozen Workers may vote once before the five-minute deadline. |
| A duplicate or late edit-consent vote is submitted | Reject it; only active Workers may vote once before the five-minute deadline. |
| An edit vote rejects or times out | Discard every requested edit and restore the prior Quest lifecycle state. |
| Requested Headcount is not `1` for `SINGLE`, or is not a positive integer for `GROUP` | Block publication; do not silently reinterpret capacity. |
| A route-only scenario appears in normal discovery | Filter it from Quest Board results while keeping the route/test ID addressable. |
| A screen needs Quest or chat state after a reset | Read the fresh state from `questFixtureAdapter`; do not restore a static fallback or local demo record. |

## Acceptance examples: dishwashing

### Headcount `1`: `SINGLE + CANDIDATE`

1. The Hirer funds Requested Headcount `1` for “Dishwashing after club dinner.”
2. Mali, Niran, and Pim each submit an individual Proposal. Pim withdraws before Selection and may submit a new Proposal while the Quest remains `QUEST_OPEN`.
3. The Hirer manually rejects Niran; the Quest remains `QUEST_OPEN`, and Niran's rejected Proposal cannot be resubmitted. The Hirer then selects Mali; Mali's Proposal is `APPLICATION_SELECTED`, Pim's current Proposal is rejected if pending, and Mali receives one Assignment and Work Chat.
4. The Quest has Actual Headcount `1`. It is `QUEST_ASSIGNED` before start and `QUEST_IN_PROGRESS` at start. No second Worker can be added.
5. Settlement pays one reward. There is no unused place to refund.

### Headcount `2/3`: `GROUP + CANDIDATE`

1. The Hirer funds Requested Headcount `3` for “Dishwashing after the faculty fair.”
2. Team A has a Leader and one accepted member after another invite expires. The Leader may replace that invitation but submits the non-empty two-person roster during Review; confirmation changes the team to `TEAM_SUBMITTED` and locks it.
3. Team B submits a three-person roster. The Hirer sees Team A and Team B because both are `TEAM_SUBMITTED`, then selects Team A and automatically rejects Team B.
4. Team A becomes `TEAM_SELECTED`; its two members receive separate Assignments and selected Work Chat access. Actual Headcount is `2`, Requested Headcount is `3`, and no third Worker may be added.
5. Settlement pays two rewards and refunds one reserved place. No partial-start consent is needed because Selection approved the two-person roster.

### Headcount `2/3`: `GROUP + NO_CANDIDATE`

1. The Hirer publishes the same dishwashing Quest with Requested Headcount `3`. Mali and Niran join directly; the first join opens their shared Work Chat. The Quest remains `QUEST_OPEN` with Actual Headcount `2`.
2. At `startTime`, the Quest enters `QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT`. Mali, Niran, and the Hirer each have five minutes to approve; the roster is frozen and chat remains writable.
3. If all three approve in time, the Quest becomes `QUEST_IN_PROGRESS` with Actual Headcount `2`; two rewards settle and one reserved place is refunded. If Niran rejects or the window expires, the Quest becomes `QUEST_CANCELLED`, receives a full refund, removes both Assignments, and makes the chat read-only.

## Prototype boundary

`docs/specs/group-quest-behavior.md` is the product behavior source of truth. The local fixture adapter is authoritative only for this prototype; its fields, route scenarios, and transitions remain provisional pending the backend contract.
