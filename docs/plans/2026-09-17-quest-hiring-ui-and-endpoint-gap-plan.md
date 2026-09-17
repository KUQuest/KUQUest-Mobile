# Quest Hiring UI and Endpoint Gap Plan

## Problem

The Quest hiring flow is only partially live. Board discovery, public detail,
Hirer Quest listing, FCFS join, and a few generic commands exist, but the
production route does not carry a Member from joining to doing and settling
work. Candidate and Candidate Team controls are fixture-only and unreachable
on the live detail path. Worker My Quests is rendered with no live items.

This plan separates:

- **Backend route exists / mobile wrapper missing** — implement in the mobile
  API and service layers.
- **Mobile UI or route missing** — implement after the API seam is available.
- **True backend contract gap** — backend contract or endpoint must be supplied;
  do not guess a payload or convert identifiers.
- **Intentional no-endpoint behavior** — UI must consume server state instead of
  inventing a command.

Authoritative sources: `CONTEXT.md`, `docs/rulebook/`,
`docs/specs/`, and `docs/agents/quest-api-v2-frontend-handoff.md`.

## Evidence from the current mobile code

### Critical usability breaks

1. `QuestDetailScreen` loads live Quest data, but
   `emptyDetailState()` and `emptyDetailProjection()` always return `null`
   (`src/features/questBoard/QuestDetailScreen.tsx:894-903`). Candidate
   review, Candidate Team, partial-start consent, assignment capabilities, and
   conversation capabilities therefore never render on the live path.
2. The only live join mutation is FCFS `joinQuest()`
   (`QuestDetailScreen.tsx:1119-1148`). Candidate application is a fixture
   dispatch; Candidate Team creation, joining, submission, and selection are
   fixture dispatches.
3. The post-join action bar offers message, local leave, and apply/join only
   (`QuestDetailScreen.tsx:1774-1853`). It has no assignment work hub,
   automatic-start status, proof/confirmation flow, condition-edit consent,
   terminal review, cancellation, or dispute action.
4. Accepted Worker leave is local-only
   (`QuestDetailScreen.tsx:1165-1197`), while the rulebook explicitly says an
   Active Worker cannot voluntarily leave. This must be removed from the live
   path; an accepted Worker remains assigned until a server terminal outcome.
5. Worker My Quests intentionally returns an empty array when the role is
   Worker (`src/features/myQuests/MyQuestsScreen.tsx:1075-1081`). The screen
   has pending/accepted/history tabs and cards, but no live assignment source.
6. Hirer My Quests loads live Quests, but non-draft cards all use a generic
   detail action (`MyQuestsScreen.tsx:483-530`). There is no live applicant,
   team, underfilled, proof-review, cancellation, or settlement control.
7. The route `src/app/quest/[id].tsx` is only a re-export. It has no route-level
   lifecycle, permission, or action handling.
8. `ProofSubmissionSheet` is a local image/note form only. It has no draft
   persistence, retry state, dueAt, PDF/video support, 10 MB validation, or
   proof API integration (`src/features/questBoard/components/ProofSubmissionSheet.tsx:18-21,37-64,123-217`).
9. `PartialGroupStartConsentSheet` does not show the exact revised reward or
   dueAt and models Hirer and Worker voting together
   (`PartialGroupStartConsentSheet.tsx:123-147,184-225`). The canonical flow
   is a 10-minute Hirer decision followed by a 10-minute Worker consent gate.
10. `TeamAssembleSheet` does not implement Join Codes, regeneration, leave,
    member removal, leadership transfer, or exact-headcount submission. Its
    submit guard accepts a non-empty roster rather than exact headcount
    (`TeamAssembleSheet.tsx:224-239,265-282`).
11. `questWorkflow` is a fixture adapter facade
    (`src/features/questBoard/questWorkflow.ts:1-18,287-290,410-415`). Its
    terminal projection omits `QUEST_FAILED`
    (`questWorkflow.ts:246-268`). Fixture coverage must not be presented as
    production support.

### Existing API boundary

`src/api/QuestApi.ts` currently wraps 15 of the 45 Quest v2 routes:

- Board, public detail, participation detail, owner detail, image upload,
  Hirer Quest list, Worker assignment list, create, draft edit, publish-check,
  publish, cancel, FCFS join, proof-free completion confirmation, and create
  review.

The existing wrappers also have contract mismatches:

- `editQuest()` sends neither the required `Idempotency-Key` nor `If-Match`
  (`QuestApi.ts:153-164`).
- State-changing wrappers accept optional keys even though v2 requires a
  nonblank key for every command (`QuestApi.ts:95-114,192-249`).
- `createReview()` sends `score` instead of `rating`, requires `revieweeId`
  even for a Worker, omits idempotency, and returns only `{ id }`
  (`QuestApi.ts:252-265`; handoff §14).
- `confirmCompletion()` expects `{ completedAt }`, while the v2 response is
  `{ confirmed, confirmedAt, questStatus }` (`QuestApi.ts:231-249`; handoff
  §12.8).
- `joinQuest()` returns an unparsed generic response instead of a typed
  contract (`QuestApi.ts:210-229`).
- Board query support omits mode, participation, reward, duration, and start
  filters required by handoff §6.1.
- `questV2Contracts.ts` has no typed contracts for applications, teams, edit
  requests, underfilled decisions, proof submissions, or Quest reviews.

`src/api/ChatApi.ts` covers only basic Work Chat list/messages/send/read.
Candidate Inquiry is called through a raw request in
`src/features/questBoard/liveQuestService.ts:146-160`, not a client method.
`src/api/WalletApi.ts` covers wallet balances, conversion, top-up creation,
status, simulation, and activity history, but not payout destinations,
payouts, or disputes.

## Required user journeys

### Shared lifecycle

```text
OPEN QUEST
  -> branch-specific join / apply / team action
  -> ASSIGNMENT_ACTIVE + Work Conversation membership
  -> QUEST_ASSIGNED before startTime
  -> server lifecycle worker auto-transitions at startTime
  -> QUEST_IN_PROGRESS after required start conditions
  -> proof submission OR proof-free confirmation
  -> Hirer review (if proofRequired) or server completion
  -> QUEST_COMPLETED / QUEST_FAILED / QUEST_CANCELLED
  -> read-only Work Chat archive + optional Rating Review
```

There is **no v2 Start Work endpoint**. The handoff explicitly forbids
`POST /api/v2/quests/:questId/start` (§3, §10.1, §20.1). The app must refresh
participation/detail/assignments around `startTime`, render
`startedAt`, tolerate a delayed lifecycle worker, and avoid showing a false
failure while the server is catching up. A pending Quest Edit blocks automatic
start.

### Worker next steps after joining

After a successful FCFS join, the UI must not stop at a success alert:

1. Update or refresh the participation detail and Assignment.
2. Show the Worker in `My Quests > Accepted` with Quest state and exact next
   action, not a generic application card.
3. Open the assigned Quest work hub. Before `startTime`, show the countdown,
   assigned status, read-only Conditions, Work Chat entry, and any pending
   Quest Edit response.
4. At/after `startTime`, poll or refresh until the server returns
   `QUEST_IN_PROGRESS` and a non-null `assignment.startedAt`.
5. Show Work Chat and the required completion action. For proof-required work,
   open the proof draft composer. For proof-free work, show Confirm Completion.
6. Preserve unsent proof drafts and failed uploads across retry. After send,
   lock the proof and show the 24-hour review countdown/status.
7. On any terminal state, show the read-only archive, settlement/result from
   the server, eligible Rating Review CTA, and Dispute CTA only for
   `QUEST_FAILED` within the allowed window.

### 2x2 mode matrix

| Branch                             | Prospective Worker path                                                                         | Hirer path                                                                          | Work obligation                                                     |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `SINGLE + FIRST_COME_FIRST_SERVED` | Open detail → direct Join → immediate `QUEST_ASSIGNED`                                          | View assignment detail and Work Chat; no candidate review                           | Worker is automatic starter and submitter                           |
| `SINGLE + CANDIDATE`               | Open detail → Apply → view application status; withdraw before selection                        | List applications → reject or atomically select one Candidate                       | Selected Worker is automatic starter and submitter                  |
| `GROUP + FIRST_COME_FIRST_SERVED`  | Direct Join while slots remain; show roster count and Work Chat                                 | At `startTime`, decide underfilled proceed/cancel, then see split consent responses | Every Active Worker must start and submit/confirm individually      |
| `GROUP + CANDIDATE`                | Create or join Candidate Team with 24-hour Join Code; fill exact headcount; Team Leader submits | List only submitted Teams → reject or atomically select one Team                    | Team Leader is automatic starter and submits/ confirms for the Team |

#### `SINGLE + FIRST_COME_FIRST_SERVED`

- `POST /quests/:id/join` creates the Assignment and moves the Quest to
  `QUEST_ASSIGNED`.
- The assigned Work hub waits for the automatic start transition.
- One Worker submits one Proof Submission, or confirms completion when
  `proofRequired=false`.
- Hirer approves/non-approves the proof. Non-approval immediately fails the
  Quest; there is no Rework flow.

#### `SINGLE + CANDIDATE`

- Candidate applies while `QUEST_OPEN`; the Candidate can withdraw before
  selection.
- Hirer sees all applications and selects exactly one. Selection atomically
  rejects competitors, creates the Assignment, changes the Quest to
  `QUEST_ASSIGNED`, and opens Work Chat.
- The selected Worker follows the same assigned → automatic start → proof or
  confirmation path as the FCFS single branch.
- A rejected Candidate cannot reapply; do not show a generic Join CTA.

#### `GROUP + FIRST_COME_FIRST_SERVED`

- Members join slot-by-slot until `headcount`; Work Chat opens on the first
  Assignment.
- A full roster becomes assigned at `startTime`; every Active Worker must be
  represented in the start/assignment status before work is shown as active.
- If underfilled at `startTime`, render the server-created Underfilled object:
  Hirer gets a 10-minute `PROCEED`/`CANCEL` gate. Proceed starts a separate
  10-minute Worker consent gate showing exact split reward and `dueAt`.
- Any decline/timeout cancels with full refund. Unanimous consent freezes the
  roster; each Worker still completes an individual proof/confirmation.
- Approved Workers can retain their reward even if another Worker later causes
  `QUEST_FAILED`; Hirer must be able to review pending proofs after failure.

The handoff Underfilled example has an inconsistent `questState` value while
pending (§11.1), while the lifecycle/spec says consent success reaches
`QUEST_ASSIGNED`. Key UI controls on `underfilled.state` and the server-returned
Quest state; record backend clarification before relying on the example.

#### `GROUP + CANDIDATE`

- A Prospective Worker creates a Team and becomes Team Leader, or joins a
  forming Team with its current Join Code.
- The Team Leader manages the forming roster. Leaving transfers leadership to
  the earliest remaining member; the last member disbands the Team.
- At exact `headcount`, the Team Leader submits immutable text plus required
  private file IDs. Submission invalidates the Join Code.
- Hirer sees only submitted Teams and atomically selects one. All selected
  members receive active Assignments and Work Chat membership.
- Only the Team Leader performs the automatic-start acknowledgement in the UI
  and submits/confirms work for the whole Team. Approved proof completes all
  teammate Assignments; non-approval or missing submission fails the Quest for
  the whole Team.

## Endpoint backlog

### P0 — core worker and Hirer lifecycle

The following routes are in the backend handoff but lack mobile wrappers and
contracts. They are not new backend requirements; the client needs typed,
idempotent methods and service adapters for them.

| Endpoint                                                            | Actor                  | What it does / why UI needs it                                                                      |
| ------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------- |
| `GET /api/v2/quests/:questId/assignments`                           | Hirer or active Worker | Roster and Assignment status. Required after join, selection, refresh, failure, and group progress. |
| `POST /api/v2/quests/:questId/applications`                         | Candidate              | Apply to `SINGLE + CANDIDATE` without creating an Assignment.                                       |
| `GET /api/v2/quests/:questId/applications`                          | Hirer or Candidate     | Hirer candidate inbox; Candidate's own status.                                                      |
| `GET /api/v2/quests/:questId/applications/:applicationId`           | Hirer or Candidate     | Refresh one application after a mutation or selection race.                                         |
| `POST /api/v2/quests/:questId/applications/:applicationId/withdraw` | Candidate              | Withdraw before selection; prevents a false permanent pending state.                                |
| `POST /api/v2/quests/:questId/applications/:applicationId/select`   | Hirer                  | Atomically select one Candidate, reject competitors, assign, and open Work Chat.                    |
| `GET /api/v2/quests/:questId/underfilled`                           | Hirer or active Worker | Read the server-created underfilled process, timer, split reward, and own response.                 |
| `POST /api/v2/quests/:questId/underfilled/decision`                 | Hirer                  | Proceed/cancel within the first 10-minute gate.                                                     |
| `POST /api/v2/quests/:questId/underfilled/consent`                  | Active Worker          | Accept/decline the exact split reward in the second 10-minute gate.                                 |
| `POST /api/v2/quests/:questId/edit-requests`                        | Hirer                  | Propose a complete Condition replacement while assigned.                                            |
| `GET /api/v2/quests/edit-requests/:requestId`                       | Hirer or active Worker | Show old/proposed Conditions, countdown, response summary, and own response.                        |
| `POST /api/v2/quests/edit-requests/:requestId/respond`              | Active Worker          | Accept/decline once; pending edits block automatic start.                                           |

### P0 — Candidate Team lifecycle

| Endpoint                                                         | Actor                | What it does / why UI needs it                                                                  |
| ---------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------- |
| `POST /api/v2/quests/:questId/teams`                             | Prospective Worker   | Create a forming Team and issue the first 24-hour Join Code.                                    |
| `GET /api/v2/quests/:questId/teams`                              | Hirer or Team member | Hirer proposal inbox; member's own Team status.                                                 |
| `GET /api/v2/quests/:questId/teams/:teamId`                      | Hirer or Team member | Refresh roster, leadership, code expiry, and submission.                                        |
| `PATCH /api/v2/quests/:questId/teams/:teamId`                    | Team Leader          | Rename a forming Team.                                                                          |
| `POST /api/v2/quests/:questId/teams/:teamId/join`                | Prospective Worker   | Join with the current Join Code.                                                                |
| `POST /api/v2/quests/:questId/teams/:teamId/leave`               | Team member          | Leave before submission and trigger server leadership transfer/disbanding.                      |
| `DELETE /api/v2/quests/:questId/teams/:teamId/members/:memberId` | Team Leader          | Remove another member while forming.                                                            |
| `POST /api/v2/quests/:questId/teams/:teamId/join-code`           | Team Leader          | Invalidate the old code and issue a new 24-hour code.                                           |
| `POST /api/v2/quests/:questId/teams/:teamId/submit`              | Team Leader          | Submit exact-headcount immutable Team proposal.                                                 |
| `POST /api/v2/quests/:questId/teams/:teamId/select`              | Hirer                | Atomically select a submitted Team, reject competitors, assign all members, and open Work Chat. |

**True backend blocker:** Team submission requires private `fileIds`, but
Work Chat uploads return Chat Attachment IDs. The handoff explicitly says no
generic frontend upload route returns the required private File ID (§9.10,
§20.2). Backend must provide one of:

1. a private Quest/Candidate-Team upload endpoint returning private `fileId`,
2. a documented shared upload contract that returns the required identifier, or
3. a contract change allowing the Team submitter to reference an accepted
   upload resource.

The mobile client must not convert or guess the identifier.

### P0 — Proof and completion

| Endpoint                                                                   | Actor                          | What it does / why UI needs it                                                                          |
| -------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `POST /api/v2/quests/:questId/proof-submissions`                           | Active Worker / Team Leader    | Create a private draft with description and/or files. Supports direct multipart files for Worker proof. |
| `PATCH /api/v2/quests/:questId/proof-submissions/:proofSubmissionId`       | Proof owner                    | Edit draft description/file list or retry one failed upload slot.                                       |
| `DELETE /api/v2/quests/:questId/proof-submissions/:proofSubmissionId`      | Proof owner                    | Delete an unsent draft.                                                                                 |
| `POST /api/v2/quests/:questId/proof-submissions/:proofSubmissionId/submit` | Proof owner                    | Lock and send the proof before `dueAt`; retry with same idempotency key if uncertain.                   |
| `GET /api/v2/quests/:questId/proof-submissions`                            | Hirer or permitted participant | Hirer review queue; Worker proof status; group partial-success visibility.                              |
| `POST /api/v2/quests/:questId/proof-submissions/:proofSubmissionId/review` | Hirer                          | Approve or non-approve one proof. Non-approval requires a reason and fails the Quest.                   |
| `POST /api/v2/quests/:questId/completion-confirmation`                     | Required Worker / Team Leader  | Existing wrapper, but fix response typing and expose proof-free UI.                                     |

Proof rules: 1–5 files, image/PDF/video, 10 MB each, description max 1,000
characters, draft private and mutable until send, sent proof immutable, 24-hour
review window, automatic approval after 24 hours, no Rework. For
`GROUP + CANDIDATE`, Team Leader is the single submitter and outcome applies to
the Team.

### P0 — Rating and cancellation

| Endpoint                                          | Actor           | What it does / why UI needs it                                                                                   |
| ------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------- |
| `PATCH /api/v2/quests/:questId/reviews/:reviewId` | Review author   | Edit a review within seven days; existing create wrapper must be corrected.                                      |
| `POST /api/v2/quests/:questId/reviews`            | Hirer or Worker | Existing route, but correct body (`rating`, Worker omits `revieweeId`), idempotency, and full response contract. |
| `POST /api/v2/quests/:questId/cancel`             | Hirer           | Existing route; use returned `paidSatang`/`refundedSatang` and show state-specific outcome.                      |
| `DELETE /api/v2/quests/:questId/images/:imageId`  | Hirer           | Existing draft image lifecycle is incomplete without deletion/repacking.                                         |

Reviews are allowed after `QUEST_COMPLETED`, `QUEST_FAILED`, or
`QUEST_CANCELLED`, once per direction, editable for seven days, never deleted.
Cancellation is allowed for Draft, Open, Assigned, and In Progress in the v2
handoff. The server's Satang outcome is authoritative.

### P0 — Conversation dependencies

Work Chat and Candidate Inquiry stay on `/api/v1/chat`; do not invent v2 chat
routes.

**Work Conversation wrappers missing from `ChatApi`:**

- `GET /api/v1/chat/conversations/:conversationId/participants`
- `POST /api/v1/chat/conversations/:conversationId/attachments`
- `GET /api/v1/chat/conversations/:conversationId/attachments/:attachmentId/link`
- `DELETE /api/v1/chat/conversations/:conversationId/attachments/:attachmentId`
- `WS /api/v1/chat/conversations/:conversationId/events`

Existing message send must support `clientMessageId`, optional text, and
`attachmentIds`. Enforce the visible 1,000-character/10 MB constraints, signed
15-minute links, private read cursors, and 30-message/10-attachment per-minute
cooldowns while preserving drafts on rate-limit or network failure.

**Candidate Inquiry wrappers missing from `ChatApi`:**

- `POST /api/v1/chat/candidate-inquiries` with `{ questId }`
- `GET /api/v1/chat/candidate-inquiries`
- `GET /api/v1/chat/candidate-inquiries/:conversationId`
- `GET /api/v1/chat/candidate-inquiries/:conversationId/participants`
- `POST /api/v1/chat/candidate-inquiries/:conversationId/attachments`
- `GET /api/v1/chat/candidate-inquiries/:conversationId/attachments/:attachmentId/link`
- `DELETE /api/v1/chat/candidate-inquiries/:conversationId/attachments/:attachmentId`
- `GET /api/v1/chat/candidate-inquiries/:conversationId/messages`
- `POST /api/v1/chat/candidate-inquiries/:conversationId/messages`
- `POST /api/v1/chat/candidate-inquiries/:conversationId/read`
- `WS /api/v1/chat/candidate-inquiries/:conversationId/events`

Inquiry is private one-to-one pre-assignment only and disappears after
assignment/Quest assignment/cancellation. It must never be shown as Work Chat
or copied into Work Chat.

### P1 — Wallet, payout, and dispute dependencies

These are outside the 45 Quest v2 routes and need a typed mobile boundary plus
missing mobile routes. Backend route names below are based on the mounted
backend evidence and must be reconciled with the server's current OpenAPI or
route contract before implementation:

- Payout destination read/save/delete: manage a verified Thai Bank or PromptPay
  destination with masked display. The UI needs destination validation and
  safe confirmation before payout.
- Payout quote/create/list/detail/status history: move Earnings Balance into
  Reserved for Payouts and show manual Admin approval states. Never promise
  automatic approval.
- Top-up history/list if the wallet surface needs a complete transaction
  timeline beyond the current status lookup.
- `POST /api/v1/quests/:questId/disputes`: file a Dispute Case on
  `QUEST_FAILED` within one day for a Hirer/Worker, against the seven-day held
  Funding Reservation. The current Quest handoff catalog omits this route;
  backend documentation must expose request/response/error details before the
  UI ships.

There is no standalone notification route in the inspected backend evidence.
Workflow System Messages belong in Work Chat and Android FCM Push is an
operational delivery channel. Do not add a fabricated notification endpoint;
clarify device-token registration and in-app alert read APIs separately if the
product requires them.

## Screen and route plan

### Shared screens

1. **Open Quest Detail** — public fields, ordered Conditions, mode and
   participation, reward, schedule, proof requirement, inquiry CTA, and the
   branch-specific primary CTA. Distinguish `QUEST_OPEN` from stale/full/not
   found and preserve a retry path.
2. **Candidate Inquiry Conversation** — one-to-one pre-assignment Q&A, with
   explicit close/disappear behavior after assignment.
3. **Assigned Quest Work Hub** — assignment state, server countdown, immutable
   current Conditions, pending edit response, Work Chat CTA, and automatic
   transition status. This is the missing answer to “what does a Worker do
   after joining?”
4. **Work Conversation** — active coordination with participants and KU bot
   System Messages; terminal states become read-only archive.
5. **Sent Work / Proof** — proof draft composer, upload progress and retry,
   proof lock on send, proof-free confirmation alternative, and deadline state.
6. **Hirer Proof Review** — one proof at a time, evidence, 24-hour timer,
   approve/non-approve confirmation, mandatory non-approval reason.
7. **Rating Review** — per Hirer/Worker pair after every terminal state, with
   seven-day edit window.
8. **Failed Quest Dispute** — only when server says `QUEST_FAILED` and the
   filing window is open; show the seven-day hold and case status.

### Branch-specific screens

- **Candidate application status:** apply, pending, withdrawn, selected, or
  rejected; no direct Join CTA on Candidate Quests.
- **Candidate Team:** create Team, enter Join Code, roster/leader status, code
  expiry/regeneration, leave/remove, exact-headcount submission, and
  submission lock. Team Leader sees the next action; ordinary members see
  waiting status.
- **Hirer Candidate Review:** individual applications for `SINGLE`; submitted
  Teams only for `GROUP`; selection/rejection confirms atomic server outcome.
- **Underfilled FCFS:** Hirer decision screen followed by Worker consent screen.
  Show exact split reward, `dueAt`, timer, response counts, and terminal cancel
  outcome.
- **Worker My Quests:** live Pending/Accepted/History lists backed by
  assignments/applications/teams, with status-specific next action labels.
- **Hirer My Quests:** live Draft/Open/Assigned/In Progress/Terminal filters;
  each card opens the correct management surface instead of a generic detail.
- **Wallet/Payout:** add only after payout/dispute contracts are confirmed;
  keep all money values server-authoritative integer Satang.

Proposed route ownership (names are implementation targets, not backend
requirements):

```text
src/app/quest/[id].tsx                 open/public or owner detail
src/app/quest/[id]/inquiry/[conversationId].tsx
src/app/quest/[id]/work.tsx            assigned/in-progress/archive hub
src/app/quest/[id]/proof.tsx            Sent Work / proof draft
src/app/quest/[id]/reviews.tsx         reciprocal terminal reviews
src/app/quest/[id]/dispute.tsx         failed Quest Dispute Case
src/app/wallet/index.tsx
src/app/wallet/payout.tsx
```

Keep route files thin. Put lifecycle branching in API-backed services and a
canonical adapter, not in route-only conditionals.

## Dependency-aware implementation sequence

### Phase 1 — Correct the transport contract

- Add typed Zod schemas for applications, Teams, Underfilled, Quest Edits,
  Proof Submissions, Quest Reviews, assignment detail, and error envelopes.
- Correct existing `QuestApi` headers, idempotency requirements, `If-Match`,
  review field names, completion response, join parsing, and Board filters.
- Add the missing v2 wrappers in the endpoint tables above.
- Add explicit error-code mapping and refresh-after-command behavior.

**Exit condition:** API methods can represent every documented v2 command and
read without legacy enum casts or untyped response bodies.

### Phase 2 — Replace fixture-only live state

- Introduce an API-backed Quest/Assignment adapter alongside the fixture
  adapter.
- Normalize actor, Quest state, mode, participation, Assignment, Team,
  application, proof, conversation capability, and server-derived next action.
- Make `QuestDetailScreen` consume the live projection instead of nulling the
  workflow state. Keep prototype preview routes explicitly demo-only.
- Make `MyQuestsScreen` load Worker assignments/applications/Teams and include
  `QUEST_FAILED` in terminal history.

**Exit condition:** FCFS join visibly produces an Assignment card and a
state-specific next action for the Worker.

### Phase 3 — Ship the worker core journey

- Implement the Assigned Quest Work Hub and Work Conversation entry.
- Add focus refresh and scheduled polling around automatic start; render
  `startedAt` and server Quest state, never a client Start Work command.
- Implement proof-required draft/send and proof-free confirmation.
- Implement terminal archive, settlement display, Rating Review eligibility,
  and failure-state messaging.

**Exit condition:** A Worker can browse, join, see what to do next, wait for
server start, coordinate, submit/confirm, and reach a terminal result.

### Phase 4 — Implement all four hiring branches

- Wire Candidate SINGLE apply/withdraw/status and Hirer application review.
- Replace TeamAssemble fixture actions with Join Code, roster, exact submit,
  and selected-Team state. Stop at the private `fileId` blocker for file-bearing
  submission until backend supplies the contract.
- Implement GROUP FCFS Underfilled decision and Worker consent as two staged
  server processes with exact reward/dueAt display.
- Implement Hirer live Candidate/Team selection and cancellation outcomes.

**Exit condition:** Each 2x2 branch has a distinct CTA, state projection, and
next action; no branch falls through to a generic Join/Apply card.

### Phase 5 — Conditions, proof review, and conversations

- Add assigned Condition read view and Hirer edit request flow.
- Add Worker edit response with 10-minute countdown and decline reason.
- Add Hirer proof review popup/list with post-failure partial-success handling.
- Complete Work Chat attachments/participants/events and Candidate Inquiry
  routes while preserving their strict separation.

**Exit condition:** Pending actions, locks, timers, and retry/error recovery are
visible and server-driven.

### Phase 6 — Terminal operations and finance

- Add Rating Review create/edit UI and direct entry from Quest detail/history
  and Work Chat System Messages.
- Confirm and implement Dispute Case contract before adding the failed-Quest
  route.
- Add payout destination, payout request, payout status, and full wallet
  history only after backend path/schema reconciliation.

**Exit condition:** Terminal Quests remain read-only while eligible reviews,
disputes, and payout states are accurately exposed.

## Verification scenarios

Use a development build and authenticated Member accounts. Preserve the
existing uncommitted user changes; this plan file is the only intended new
artifact for this investigation.

1. `SINGLE + FCFS`, proof required: join → Assignment → automatic start
   refresh → Work Chat → proof draft/send → Hirer approve → completed review.
2. `SINGLE + FCFS`, proof not required: join → automatic start → Confirm
   Completion → completed review.
3. `SINGLE + CANDIDATE`: apply → Hirer sees application → withdraw; then a
   separate run selects one Candidate and rejects competitors.
4. `GROUP + FCFS`, full: join multiple Members → assignment → every Worker
   status is represented → individual proof/confirmation and partial outcome.
5. `GROUP + FCFS`, underfilled: scheduled underfilled object → Hirer proceed
   or cancel → Worker exact split consent → assignment or full refund.
6. `GROUP + CANDIDATE`: create Team → join by code → exact headcount → submit
   and lock; selection creates all Assignments. Block and report file-bearing
   submission if private `fileId` is unavailable.
7. Assigned Quest Edit: Hirer proposes → all Active Workers see old/proposed
   Conditions → accept/decline/timeout → automatic start is blocked while
   pending.
8. Proof review: pending list → approve or non-approve with reason → verify
   terminal state and Admin Review Item behavior; verify 24-hour auto-approval
   display.
9. Failure and terminal behavior: no false Start Work failure during delayed
   worker transition; read-only archive; review window; dispute CTA only when
   contract/window allows.
10. Reliability: uncertain command retries reuse the same idempotency key and
    body; conflicts refresh canonical state; drafts survive failed uploads and
    rate limits; temporary URLs are refreshed after expiry.

## Acceptance checklist

- [ ] Worker My Quests is populated from live Assignment/application data.
- [ ] FCFS join lands on a state-specific Worker Work Hub with an explicit next
      action.
- [ ] Candidate SINGLE and Candidate GROUP never expose FCFS Join behavior.
- [ ] Group FCFS exposes staged Underfilled Hirer decision and Worker consent.
- [ ] Group Candidate exposes Team formation, Join Code, exact submission, and
      Team Leader-only work submission.
- [ ] The app never calls or invents a v2 Start Work endpoint.
- [ ] Proof-required and proof-free paths are separate and deadline-aware.
- [ ] Hirer can review Candidates/Teams, proofs, and cancellation outcomes from
      live server data.
- [ ] Work Chat and Candidate Inquiry are separate v1 conversation types.
- [ ] Terminal states include `QUEST_FAILED`, are read-only, and expose review
      eligibility.
- [ ] Every v2 mutation has idempotency and every draft edit uses `If-Match`.
- [ ] Team private file ID and Dispute Case contract blockers are resolved or
      explicitly surfaced without a fabricated workaround.
- [ ] Existing fixture scenarios remain available only as explicit demo/test
      coverage and are not used as production guarantees.
