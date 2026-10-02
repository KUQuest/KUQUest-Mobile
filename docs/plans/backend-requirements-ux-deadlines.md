# Backend requirements: deadlines, cancel preview, proof/dispute visibility

Source: mobile UX review of the Hirer Manage page and Worker Work Hub. All items are **additive** (new optional fields or one new read endpoint). Nothing here changes an existing response shape or a rulebook rule. Mobile keeps working without them; each item lists what the app does today and what it will do once shipped.

Terms follow `CONTEXT.md`. Times are ISO-8601 with offset; the server clock is the only clock (the app already offsets with `serverNow()`).

## Summary

| #   | Requirement                                                    | Type                        | Blocks mobile feature                                | Priority           |
| --- | -------------------------------------------------------------- | --------------------------- | ---------------------------------------------------- | ------------------ |
| B1  | `reviewDeadlineAt` on Proof Submission                         | new field                   | Proof auto-approve countdown (Hirer + Worker)        | High               |
| B2  | `GET /api/v2/quests/{questId}/cancel-preview`                  | new endpoint                | Real refund/payout amounts in the cancel guardrail   | High               |
| B3  | `reviewReason` + `reviewedAt` on Proof Submission              | new fields                  | Worker sees why proof was not approved               | High               |
| B4  | `disputeDeadlineAt` + `disputeCase` summary on the v2 snapshot | new fields                  | Dispute window countdown, Dispute status in Work Hub | Medium             |
| B5  | `moneyHoldReleasesAt` on Quest settlement                      | new field                   | Hirer/Worker see when the 7-day hold ends            | Medium             |
| B6  | Realtime event types for the above                             | new `changeType` values     | Live refresh without polling                         | Medium             |
| B7  | Underfilled / start-time decision deadlines on iOS push        | infra                       | Time-boxed decisions reach backgrounded iOS users    | Low (product call) |
| B8  | Confirm `assignments[]` visibility for Workers on GROUP Quests | confirmation                | Group FCFS "who has started" list                    | Confirm only       |
| B9  | Expose the Team Leader to Team Members after selection         | new field or readable route | Work Hub Team Leader / Team Member screens           | High               |

---

## B1. `reviewDeadlineAt` on Proof Submission

**Why.** `PROOF_PENDING` auto-approves 24 h after submit (rulebook). The Hirer cannot see the clock; the Worker cannot see when payment is guaranteed. Today `GET /api/v2/quests/{questId}/proof-submissions` returns `submittedAt` but no deadline, so the client would have to hardcode `submittedAt + 24h`, which breaks if the rule or the extension logic changes.

**Contract.** On every item of `listQuestV2ProofSubmissions` and in the `proof` object returned by `reviewQuestV2ProofSubmission` / `submitQuestV2ProofSubmission`:

```
reviewDeadlineAt: string(date-time) | null
```

- Non-null only while `status = PROOF_PENDING`.
- `null` for drafts (`submittedAt = null`), `PROOF_APPROVED`, `PROOF_NOT_APPROVED`.
- Must equal the exact instant the auto-approve job will act on.
- Visible to both Hirer and Worker (it is not private evidence). For `visibility = SUMMARY` rows it is still returned.

**Edge cases the backend must define.**

- Proof submitted when `dueAt` is seconds away: deadline is still `submittedAt + 24h` (past `dueAt`). State this explicitly.
- GROUP Quest with several proof submissions: each has its own deadline.
- Re-submit/edit of a pending proof: if editing resets the clock, `reviewDeadlineAt` must move; if not allowed, say so.
- Hirer reviews exactly at the deadline: the idempotent first decision wins (existing 409 on second decision).
- Server clock vs job lag: if the job runs late, the field should still show the nominal deadline, not be nulled.

**Mobile once shipped.** Hirer proof review and Manage page show "Auto-approves in Xh Ym" using `useServerCountdown`. Worker Work Hub shows "Payment guaranteed by …". Until then: static note only.

---

## B2. Cancel preview

**Why.** The Hirer confirms an irreversible cancel from rules text only (OPEN 100% refund; ASSIGNED 20% of Worker Reward pool paid, 80% + Platform Fee returned; IN_PROGRESS full Worker Rewards + Platform Fee, no refund). `cancelQuestV2` reports `paidSatang` / `refundedSatang` only **after** the money moved. The amounts depend on headcount, partial assignment, and the fee, so the client must not recompute them.

**Endpoint.** `GET /api/v2/quests/{questId}/cancel-preview` (Hirer only; session auth).

```
200 { success: true, data: {
  questStatus: QuestStatus,
  tier: "NO_PENALTY" | "PARTIAL_PENALTY" | "FULL_PENALTY",
  paidSatang: integer,        // to Workers
  refundedSatang: integer,    // back to Hirer wallet
  platformFeeSatang: integer, // retained or refunded per tier, itemised
  affectedWorkerCount: integer,
  computedAt: string(date-time),
  previewVersion: string      // opaque; changes when Quest/assignments change
} }
403 not the Hirer · 404 masked not-found · 409 Quest not cancellable (terminal/DRAFT rules as `cancelQuestV2`)
```

**Rules.**

- Same calculation code path as `cancelQuestV2`. A preview must never disagree with the real cancel unless state changed in between.
- Read-only, no idempotency key, no side effects, no ledger writes.
- Cacheable for a few seconds is fine; do not cache across Quest state changes.

**Optional (recommended).** Accept `previewVersion` as an optional header/body hint on `cancelQuestV2`; if Quest state changed since the preview, return `409 CANCEL_PREVIEW_STALE` with the fresh preview so the app can re-confirm instead of silently charging a different amount.

**Edge cases.**

- A Worker presses Start Work while the Hirer's sheet is open (ASSIGNED → IN_PROGRESS): the real cancel is a different tier. Without `previewVersion` the Hirer pays more than they confirmed.
- Zero assigned Workers on an ASSIGNED GROUP Quest (all left): preview must show the correct tier.
- Underfilled decision window open: state which tier applies.
- DRAFT: tier `NO_PENALTY`, all zeros (or 404, but pick one).

**Mobile once shipped.** The cancel guardrail sheet shows the real amounts and, if stale, re-confirms. Today it shows the rule text only.

---

## B3. Proof review reason and decision time

**Why.** `reviewQuestV2ProofSubmission` accepts `reason` (≤1000 chars) but **no response returns it**. `PROOF_NOT_APPROVED` fails the Quest immediately with no rework, so the Worker must be able to read why before deciding to dispute. Today the Worker sees only the status.

**Contract.** On Proof Submission (list + review response):

```
reviewReason: string | null     // exactly what the Hirer sent; null if none or not reviewed
reviewedAt: string(date-time) | null
reviewedBy: "HIRER" | "AUTO_APPROVE" | null
```

**Rules.**

- `reviewReason` visible to the submitter Worker, other Workers on the same Quest only if the Hirer can already see their proof (follow current `visibility`), and to the Hirer.
- Never leak to non-participants.
- Sanitise like chat text (no HTML); return as stored.
- `reviewedBy = AUTO_APPROVE` lets the UI say "Approved automatically after 24 hours".

**Edge cases.** Auto-approve has no reason (`null`). Reason on `PROOF_APPROVED` is allowed but optional. A proof reviewed after the Quest already `QUEST_FAILED` (server-allowed): still record reason.

---

## B4. Dispute window and status on the snapshot

**Why.** After `QUEST_FAILED` there is a Dispute Case window and a money hold. `GET /api/v1/quests/{questId}/disputes/mine` returns only the case the caller filed (or null) and has **no deadline**. The Work Hub / Manage page cannot say "you have until X to dispute" or show an already-filed case without an extra v1 call.

**Contract.** Add to the v2 Quest snapshot (or `GET /api/v2/quests/{questId}` participation block; pick one place and document it):

```
dispute: {
  canFile: boolean,
  windowEndsAt: string(date-time) | null,   // null once closed or never opened
  myCase: { id, displayId, status, createdAt } | null
} | null
```

- `null` unless the Quest is `QUEST_FAILED` (or another state where disputes are allowed by the rulebook).
- `canFile` is the server's decision; the client already follows `capabilities` for everything else and must not compute it (today Manage shows File Dispute to any viewer on a FAILED Quest).
- `myCase.status` uses the existing `DISPUTE_CASE_*` values.

**Edge cases.**

- Worker vs Hirer both filing: each sees only their own `myCase`.
- Window closes while the filing screen is open: `POST /disputes` returns 409 with a stable error code (`DISPUTE_WINDOW_CLOSED`); document it.
- GROUP Quest: one case per filer or per Quest? State the rule.
- Quest cancelled by Hirer: `dispute = null`.

---

## B5. Money hold release time

**Why.** Rulebook: 7-day hold after `QUEST_FAILED` / after settlement for Worker rewards. The wallet shows balances but not when held money becomes spendable/withdrawable.

**Contract.** On each wallet hold line, or on the settlement object of the Quest snapshot:

```
moneyHoldReleasesAt: string(date-time) | null
heldSatang: integer
```

**Edge cases.** A dispute opened during the hold extends/suspends it: return `null` plus a reason code (`ON_DISPUTE_HOLD`) or the new date; state which.

---

## B6. Realtime events

Existing channels carry `{ type, version: 1, questId, changeType }` and no data; the client refetches REST. Add `changeType` values (same channels: `/api/v2/quests/{id}/events`, `/api/v2/me/hirer-quests/events`):

| `changeType`                                                    | When                                | Audience         |
| --------------------------------------------------------------- | ----------------------------------- | ---------------- |
| `PROOF_REVIEWED`                                                | Hirer decision or auto-approve      | Worker + Hirer   |
| `PROOF_AUTO_APPROVED` (or `PROOF_REVIEWED` with no actor field) | 24 h job fires                      | Worker + Hirer   |
| `DISPUTE_WINDOW_OPENED` / `DISPUTE_WINDOW_CLOSED`               | Quest fails / window ends           | Worker + Hirer   |
| `DISPUTE_CASE_UPDATED`                                          | Case status changes                 | filer            |
| `QUEST_FAILED_AT_DEADLINE` (or generic `QUEST_FAILED`)          | `dueAt` passes with unfinished work | all participants |

Open question for backend: **does a `QUEST_FAILED` event fire at `dueAt` today?** The client currently relies on a countdown + refetch and cannot confirm. Please state it.

Already shipped and handled by the app: `ASSIGNMENT_JOINED`, `ASSIGNMENT_STARTED`, `QUEST_AUTO_CANCELLED`, `PROOF_SUBMITTED`.

---

## B7. iOS push for time-boxed decisions (product + infra)

**Why.** Push exists on Android only. Three flows have hard deadlines and silent failure:

- GROUP + FCFS underfilled at `startTime`: Hirer has 10 minutes to decide, else the Quest cancels.
- Worker consent after Hirer chooses reduced reward: 10 minutes.
- Quest Edit vote: Workers have a window, else the edit fails.
- CANDIDATE Quest still `OPEN` at `startTime`: auto-cancels (Hirer should be warned beforehand).

**Ask.** APNs delivery for the same notification types as Android, plus one new reminder: "Your Quest starts in 1 hour and has no selected Candidate" (configurable offset). If out of scope, confirm so the app can show in-app banners only.

---

## B8. Confirmation only: Worker access to all assignments on a GROUP Quest

The new Work Hub list shows every active Worker's start status on a Group first-come Quest. It reads `assignments[]` from `listQuestAssignmentsV2` as the Worker and `startedAt` per row.

Please confirm:

1. A Worker on a GROUP Quest receives **all** active assignments for that Quest, not only their own.
2. `member.displayName` is present for those rows (already agreed in the `MemberSummary` change).
3. `startedAt` is returned to Workers, not only the Hirer.

If (1) is false, mobile will show only the viewer's own status and the count ("N of M started") from a new `startedCount` / `activeCount` pair on the snapshot instead. Say which.

---

## B9. Team Leader visibility after selection (`GROUP + CANDIDATE`)

**Why.** The rulebook makes the Team Leader the only required starter and proof submitter. Once the Hirer selects a Team the Quest leaves `QUEST_OPEN`, and `GET /api/v2/quests/{questId}/teams` answers `404 QUEST_NOT_FOUND` to the Worker. `GET /api/v2/quests/{questId}/participation`, `listQuestAssignmentsV2` and `/assignments/mine` carry no leader or team field, so a Team Member cannot be told apart from the Team Leader. The Work Hub therefore cannot show separate Team Leader and Team Member screens, and every teammate is offered Start Work, proof and confirm-completion controls; the server rejects non-leaders with `START_WORK_NOT_REQUIRED`.

**Contract (pick one).**

1. Keep `GET /api/v2/quests/{questId}/teams` readable by the selected Team's members while the Quest is `QUEST_ASSIGNED` or later, or
2. Add to the `participation` block and to each Assignment of a `GROUP + CANDIDATE` Quest:

```
teamRole: "LEADER" | "MEMBER" | null   // null for every other Quest shape
team: { id, name, leaderId, members: MemberSummary[] } | null
```

**Mobile once shipped.** `LiveQuestSnapshot.teamRole` already drives `TeamLeaderWorkScreen` and `TeamMemberWorkScreen`; option 1 needs no mobile change (the role is derived from `team.leaderId`), option 2 needs one mapping in `liveQuestService`. Until then `teamRole` is `UNKNOWN` after selection and the shared Work Hub is shown.

**Edge cases.** The Team Leader leaves or is removed before selection (state who becomes leader). Hirer cancels after selection: field stays readable for the archive. A Worker on the same Quest outside the Team gets `null`.

---

## Compatibility and rollout

- All new fields optional in mobile Zod schemas until the backend is on staging; mobile treats `undefined` as "not provided" and hides the related UI.
- No breaking changes. Existing clients ignore new fields.
- Regenerate `docs/api/api.yaml` after merge; mobile will then make the new fields required where the contract guarantees them.

## Acceptance (backend)

1. B1: pending proof returns non-null `reviewDeadlineAt`; approved/rejected/draft return `null`; auto-approve acts at exactly that instant.
2. B2: `cancel-preview` amounts equal the `paidSatang` / `refundedSatang` of an immediate real cancel in the same state, for OPEN, ASSIGNED, IN_PROGRESS.
3. B3: a rejected proof returns the Hirer's `reason` to the submitting Worker and not to unrelated Members.
4. B4: FAILED Quest returns `dispute.windowEndsAt` and `canFile`; after the window `canFile = false` and `POST /disputes` returns the documented 409 code.
5. B6: each new `changeType` is emitted once per transition.
6. B8: answers recorded in the OpenAPI description.
7. B9: a selected Team Member receives the Team Leader's id (or `teamRole`) on a `QUEST_ASSIGNED` and `QUEST_IN_PROGRESS` Quest; a non-member still gets `404`.
