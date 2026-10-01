# KUQuest Mobile: user-journey audit

Date: 2026-09-30. Scope: whole app, user journeys, state sync, navigation, async feedback, redundant taps.

**Method.** 13 slice readers, 13 refutation verifiers and 6 second-pass hunters, plus lead spot-checks of the decisive lines. The audit was read-only and no source files changed. Nothing was run on a device, so every finding comes from reading the code and docs. Lead-verified: the stale-state findings on Money, Work Hub and Manage, the Board inquiry side effect, the hard-coded Public Profile stats, the ADR 0003 gap, the `openWorkHub` destination, and the absence of a pending-edit id in `api.yaml` and `asyncapi.yaml`.

**Checkout gaps.** `docs/specs/`, `docs/system-design-specification.md` and `docs/qa/` do not exist in this checkout. Spec-level copy and flow were checked against the ADRs, the rulebook and `docs/api/*` instead.

**Root cause behind most stale-state findings.**

- `<Tabs>` and Stack screens stay mounted. `(tabs)/_layout.tsx` sets no `lazy`, `unmountOnBlur` or `freezeOnBlur`.
- React Query's `focusManager` is tied to `AppState` only (`QueryProvider.tsx:15-22`). Returning to a tab never refetches.
- A hidden screen refreshes only on an invalidation, a WebSocket event, a pull-to-refresh, an app foreground, or a `refetchInterval`.
- There is no wallet event in `docs/api/asyncapi.yaml`.

---

## Findings

### 1. Worker never sees, and cannot vote on, the Hirer's Quest Edit

**Severity:** High · **Type:** Stale State · **Confidence:** High (app side); server-side delivery unverified

**User scenario:** The Hirer proposes a Condition edit on a `QUEST_ASSIGNED` Quest. Every Active Worker must accept within 10 minutes.

**Current behavior:**

- The Worker opens Work Hub. It shows no proposal and no Accept/Decline.
- The edit only resolves by timeout.
- The Hirer's own request id is also lost if the Manage screen remounts.

**Expected behavior:** The Worker sees the proposed Conditions and can respond on any device. The Hirer and Workers all see the result.

**Root cause:**

- The API has no "list pending edits" route. `api.yaml` only has `GET /edit-requests/{requestId}`, and no Quest payload carries an edit id.
- The only id carrier is the WebSocket event `QUEST_EDIT_UPDATED.editRequestId` (`asyncapi.yaml:326-343`).
- The mobile subscriber drops the event payload: `subscribeToQuestEvents(questId, invalidateSnapshot, invalidateSnapshot)` at `questBoardQueries.ts:186-190`.
- `useQuestWorkFeature.ts:80-82` builds `snapshotOptions` from a route param only. `liveQuestService.ts:867-872` returns `editRequest = null` when no id is given.
- The Hirer keeps the id in `useState` only (`useHirerQuestManageFeature.ts:47,197`).

**Reproduction:**

1. The Hirer proposes a Condition edit in Manage.
2. An Active Worker opens Work Hub from Work Management.
3. There is no proposal card and no vote controls.

**Why it matters:** The consensus gate from `CONTEXT.md:145` cannot complete from normal navigation.

**Fix:** Keep `event.editRequestId` from the per-Quest WebSocket stream, and feed it into the live snapshot query key or options. Also recover the id for the Hirer on remount.

**Before:** Hirer proposes → Worker Work Hub → nothing → timeout.
**After:** Hirer proposes → WebSocket event → Work Hub shows the request → vote.

---

### 2. Money tab shows a stale balance after publish, cancel, proof approval and failure

**Severity:** High · **Type:** Stale State · **Confidence:** High

**User scenario:** A Hirer publishes a funded Quest, cancels one, or approves a proof. They then open the Money tab.

**Current behavior:** The Money tab still shows the old Spending, Reserved and Earnings balances and the old history. It only refreshes by pull-to-refresh, app foreground, or a remount.

**Expected behavior:** The balance and history reflect the settlement the server just made.

**Root cause:**

- The wallet query (`walletQueries.ts:14-27`) has no interval and no event.
- Both shared invalidators omit wallet keys: `createQuestQueries.ts:57-67` and `questBoardQueries.ts:219-246`.
- Wallet keys are only invalidated by top-up simulation and earnings conversion (`walletQueries.ts:61-85`).

**Evidence by action:**

| Action                    | Wallet invalidated? | Consequence                             |
| ------------------------- | ------------------- | --------------------------------------- |
| Publish (escrow lock)     | No                  | Stale spendable balance                 |
| Cancel and refund         | No                  | Refund not visible                      |
| Proof approve / complete  | No                  | Stale Hirer reserve and Worker earnings |
| Quest failed (7-day hold) | No                  | Hold not visible                        |
| Top-up paid               | Yes                 |                                         |
| Earnings conversion       | Yes                 |                                         |

**Reproduction:**

1. Open Money, then publish a Quest.
2. Return to Money within the session.
3. The Spending balance is unchanged.

**Why it matters:** Users may think the refund or payout failed. They may also spend against a balance that is already reserved.

**Fix:** Add `walletKeys.all` to both invalidators. Worker earnings on the Hirer's approval still need a cross-user trigger. That needs a wallet or settlement WebSocket event, or a pull-on-tab-focus hook. This is a backend gap for the cross-user case.

**Before:** action → Money stale → pull-to-refresh.
**After:** action → Money already correct.

---

### 3. Work Conversation composer stays writable after the Quest goes terminal

**Severity:** High · **Type:** Stale State · **Confidence:** High

**User scenario:** A Worker sits in chat while the Quest completes or cancels, or while the Worker is removed.

**Current behavior:**

- The composer stays enabled, because `canWrite` comes from one fetched snapshot (`chatQueries.ts:283-286`).
- The chat controller only handles chat-socket message events (`useChatConversationController.ts:201-263`). It has no Quest event subscription and no interval.
- The send then fails with a generic error.

**Expected behavior:** The conversation flips to a read-only archive (`conversation-contract.md:80-86`).

**Fix:** Refetch the conversation snapshot on per-Quest events, or subscribe via the existing `useLiveQuestSnapshotQuery`.

**Before:** terminal → stale composer → send error.
**After:** terminal → read-only archive.

---

### 4. A chat retry reuses no id, so one intended message can become two

**Severity:** High · **Type:** Duplicate Action · **Confidence:** High (client); server dedupe unverified

**User scenario:** The socket drops after the server accepted the message but before the ack.

**Current behavior:**

- A fresh `clientMessageId` is built on every tap (`useChatConversationController.ts:562-564`).
- On error the optimistic row is removed and the draft is kept (`chatQueries.ts:445-457`).
- The retry resends the same content under a new id.

**Expected behavior:** Retry is idempotent. `conversation-contract.md:94-96` says retry cannot duplicate a Message.

**Contrast:** Start Work already reuses its key across an ambiguous failure (`useQuestWorkFeature.ts:197-198,211`).

**Fix:** Hold the id with the failed draft, and rotate it only after confirmed acceptance or an edit to the content.

---

### 5. A Worker cannot rate the Hirer

**Severity:** High · **Type:** UX Flow · **Confidence:** High

**Current behavior:**

- The server capability `canCreateReview` covers Hirer and Worker (`liveQuestService.ts:510-512`).
- The Quest Detail CTA is Hirer-only (`questDetailPresentation.ts:689-693`).
- Work Management terminal cards open the same review modal for Workers (`myQuestService.ts:79`).
- That modal only lists `workerId` targets (`useQuestReviewFeature.ts:52-71`), so a Worker sees themselves or co-workers. There is no Hirer target.
- The test only covers Hirer → Worker (`QuestReviewModal.test.tsx:128-151`).

**Expected behavior:** The Worker rates the Hirer, once.

**Fix:** Pick the targets by actor. A Worker's target is the Hirer.

**Related gaps:** Review edit within 7 days is not implemented (`canUpdateReview: false`, no update UI even though the API exists). There is also no "already reviewed" state on reopen, so a second submit is treated as a fresh create and relies on server rejection.

---

### 6. Tapping the Hirer's name on a Board card silently creates a Candidate Inquiry

**Severity:** High · **Type:** Duplicate Action · **Confidence:** High

**Current behavior:**

- Live mappers hard-code `ownerStudentId: ""` (`liveQuestService.ts:128,168,208`). So the fallback at `useQuestBoardController.ts:203-209` always runs.
- It calls `getHirerParticipant`, which calls `chatApi.createCandidateInquiry(questId)` (`liveQuestService.ts:648`).
- That creates an inquiry conversation as a side effect of opening a profile.
- The catch swallows errors and the UI shows "profile unavailable". This happens whenever the Quest is not `OPEN`, or the viewer is the Hirer.

**Expected behavior:** The profile tap is read-only.

**Fix:** Resolve the Hirer id from Board or detail data. The Board DTO should expose the owner id.

**Before:** Board → tap name → create inquiry → Profile.
**After:** Board → tap name → Profile.

---

### 7. Cancelling an assigned or in-progress Quest has only a single confirm

**Severity:** High · **Type:** Redundant Interaction (friction missing) · **Confidence:** High

**Current behavior:** One `showConfirmModal` serves every state (`useHirerQuestManageFeature.ts:142-176`). ADR 0003 requires slide-to-cancel for the 20% penalty tier and typed-keyword confirmation for the 100% tier.

**Why it matters:** An accidental tap during `QUEST_IN_PROGRESS` forfeits all Worker rewards, and the Platform Fee is retained.

**Fix:** Implement Tier 2 and Tier 3 as the ADR says.

---

### 8. A Hirer cannot reach review of a still-pending proof on a FAILED Quest

**Severity:** High · **Type:** Navigation · **Confidence:** High

**Current behavior:**

- The rulebook (`proof-submission-contract.md:45-46`) says the Hirer may review another Worker's on-time `PROOF_PENDING` after the Quest becomes `QUEST_FAILED`.
- The server reports `canReviewProof` in that state (`liveQuestService.ts:390-391,509-510`).
- Home hides terminal Quests.
- My Quests terminal cards open the Rating modal, and the card body opens Detail in post mode (`useMyQuestListController.ts:79-101`). Manage is unreachable for terminal cards.
- Detail's action bar exposes `canEditPost` or `canReview` (Rating), not `canReviewProof`.

**Result:** The only ordinary exit is waiting for the 24h auto-approval. Money then goes to a Worker the Hirer never got to review.

**Fix:** Add a proof-review CTA on post-mode Detail and on the Manage card while `canReviewProof` is true.

---

### 9. Publish is not durable across process death

**Severity:** Medium (rare trigger, money impact) · **Type:** Duplicate Action · **Confidence:** Medium

**Current behavior:**

- Review-entry creates a `QUEST_DRAFT` on the server (`useQuestPublish.ts:260-274`).
- The publish key and quest id live in refs only (`useQuestPublish.ts:183-188`). The persisted JSON is `{draft, step, state}` with no server id (`createQuestPersistence.ts:144-155`).
- If the app dies after the server commits and before `deleteQuestDraft`, a resume creates a second server Quest.
- A second publish locks a second escrow, if the balance allows.
- Same-session retry is correctly idempotent.

**Fix:** Persist `questId` and the publish key with the local draft. Check the server state before any create.

---

### 10. No global 401 handling

**Severity:** Medium · **Type:** Stale State · **Confidence:** Medium

- `AuthMiddleware.tsx:34-42` redirects only when the session query itself errors.
- `ApiClient` does not convert 401s into a session transition.
- Profile and onboarding handle `SESSION_EXPIRED` locally (`profileModule.ts:49-62`). Quest, Work, Wallet and Chat surface per-screen errors.
- There is no cache clear and no WebSocket teardown on expiry.

**Fix:** Centralise 401 handling at the API boundary: clear the cache, then `router.replace('/')`.

---

### 11. Manage's Candidate sheet stays open after selection

**Severity:** Medium · **Type:** Navigation / Duplicate Action · **Confidence:** High

**Current behavior:**

- `selectApplication` and `selectTeam` (`useHirerQuestManageFeature.ts:122-141`) never close the sheet. `candidateOpen` stays true, and the sheet renders an empty state over the now-assigned Quest.
- `viewerCommand` (`:62-75`) has no busy guard, and each call mints a new idempotency key. A second tap fires a second select and yields an error alert.
- Selection behaves three ways by entry point:
  - Home banner → Select-roster: confirm, then back.
  - Detail sheet: no confirm, then `router.push('/my-quests')`.
  - Manage sheet: no confirm, and the sheet stays open.

**Fix:** Converge on one selection path: confirm once, close the sheet, go to the Quest's Manage.

---

### 12. Work Hub commands refresh only Work Hub

**Severity:** Medium · **Type:** Stale State · **Confidence:** High

- Start Work, edit-response and completion call `liveQuestService` directly and refetch only the Work Hub snapshot (`useQuestWorkFeature.ts:124-243`).
- Worker Home (`workerHomeKeys.assignments` and `participationDetail`) and Work Management (`myQuestsKeys.worker`) have no event subscription and no invalidation.
- The retained cards can still say "Start Work".
- The proof mutation omits `participationDetail`.

**Fix:** Move these commands behind mutation hooks and reuse the Worker projection invalidator. Apply it in the Work Hub commands too.

---

### 13. The join / select destination is wrong

**Severity:** Medium · **Type:** Navigation · **Confidence:** Medium

- `openWorkHub` is `router.push("/my-quests")` (`useQuestDetailNavigation.ts:82-84`). It is used after an FCFS join and after a Hirer's candidate selection.
- `/my-quests` renders by active workspace (`my-quests.tsx:10-24`).
- A user in the Hirer workspace who reaches the Board through the Hirer Home "Board" shortcut (`/quest-board`) and joins lands on Hirer My Quests. The new Assignment is not on that list.
- I did not confirm that join is reachable from that context. I am inferring that part.

**Fix:** Navigate to `/quest/[id]/work`. The Hirer selection path should go to Manage.

---

### 14. A selected Candidate or Team takes several extra taps to reach Start Work

**Severity:** Medium · **Type:** Redundant Interaction · **Confidence:** Medium

- The selection banner opens Detail (`useNotificationCoordinator.ts:204-214`).
- A selected-application card in Work Management opens Detail, not Work Hub (`useWorkerWorkController.ts:104-115`).
- The Team screen shows a static locked notice with no CTA (`TeamAssembleView.tsx:468-476`).

**Before:** banner → Detail → "View My Quests" → card → Work Hub → Start Work (4 taps).
**After:** banner → Work Hub → Start Work (1 tap).

---

### 15. PromptPay payment is not detected automatically

**Severity:** Medium · **Type:** Redundant Interaction · **Confidence:** High

- `useTopUpStatusQuery` is `enabled: false`. Status comes from the manual "Check Status" button (`TopUpScreen.tsx:161-175`).
- The active top-up is local `useState`. Leaving the screen loses the QR, and no pending top-up is offered back.

**Fix:** Poll for a bounded time while pending and on app foreground. Resume the pending top-up from `listTopUps`.

---

### 16. Public Profile stats are hard-coded empty

**Severity:** Medium · **Type:** Stale State · **Confidence:** High

- `PublicProfileScreen.tsx:164-172` builds `statsData` with `totalQuests: null`, `ratingAverage: null`, `ratingCount: 0` and a zero distribution, inside a memo with no dependencies.
- The DTO already carries `reputation.totalQuests`, `reputation.rating.average` and a reviews `total` (`contracts.ts:263-277`).
- The review list itself renders.

**Why it matters:** Hirers decide on Candidates without seeing reputation.

**Related:** `useCreateReviewMutation` does not invalidate `profileKeys.public*`. This is Low.

---

### 17. Proof composition is lost when the Worker leaves Work Hub before Submit

**Severity:** Medium · **Type:** Stale State · **Confidence:** High (narrowed)

- Files are `useState([])`. The description only hydrates from a server draft at mount (`WorkerProofForm.tsx:78-85`).
- The server draft is written only after the confirmed Submit (`:230-247`).
- There is no `beforeRemove` guard or discard prompt.
- Partial uploads after Submit are retained correctly.

**Fix:** Add a discard guard, or save a draft before leaving.

---

### 18. The edit-draft dirty flag is cleared by an unrelated data change

**Severity:** Medium (conditional) · **Type:** Stale State · **Confidence:** High

- `useQuestEdit.ts:68-83` clears `dirty` before the same-version guard.
- React Query's structural sharing avoids this for identical payloads.
- It does trigger when `images` differ at the same `version`, because image upload and delete are separate mutations (`useQuestEdit.ts:92-152`).
- The `beforeRemove` guard then skips the prompt and the edits are lost.

---

### 19. Chat attachment upload on HTTP 429 discards the file

**Severity:** Medium · **Type:** Async Feedback · **Confidence:** High

- `useChatConversationController.ts:501-505` removes the pending attachment on any error.
- The user sees a generic alert.
- `conversation-contract.md:104-111` requires the wait time and a preserved attachment.

---

### 20. The client clock decides server-owned eligibility

**Severity:** Low–Medium · **Type:** State Architecture · **Confidence:** Medium

- Start Work is gated only by `now >= startTime`, never by `dueAt` (`QuestWorkScreen.tsx:98-105`). Polling stops while `canStartWork` is true (`useQuestWorkFeature.ts:66-71`). A server error is mapped after the tap.
- `canCreateTeam` and `canJoinTeam` use `Date.now()` against the server `startTime` (`liveQuestService.ts:344-450`).
- The underfilled consent countdown uses the device clock to hide the Accept/Decline buttons (`PartialGroupStartConsentContent.tsx:250-321`).
- The per-Quest WebSocket stream probably closes the gap at `dueAt`. I did not verify that the server emits an event at the deadline.

**Fix:** Use the server-provided capability. Add a server-time offset for countdowns.

---

### 21. Lower-severity items

| Item                                                                                                                                                         | Sev        | Evidence                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `createQuestQueries.invalidateQuestReads` omits `questBoardKeys.board()`. Edit-flow cancel therefore differs from Manage and card cancel                     | Low        | `createQuestQueries.ts:57-67`. Publish already fires `QUEST_BOARD_INVALIDATED` and the Hirer's own Quest is excluded from the Board            |
| `router.back()` with no `canGoBack` fallback on scheme-addressable routes                                                                                    | Low        | Manage, Roster, ProofReview, Settings, Report, TopUp. Only Detail and Work Hub guard. Expo Router's no-history outcome was not runtime-checked |
| Manage shows File Dispute to any viewer on a FAILED Quest                                                                                                    | Low        | `HirerQuestManageScreen.tsx:245-255,371-378`                                                                                                   |
| Onboarding does not reconcile completion from another session                                                                                                | Low        | `useOnboardingController.ts`                                                                                                                   |
| Duplicate routes: `/top-up` and `/wallet/top-up`; `/quest-board` and the Board tab; `/create?editQuestId` (local draft) vs `/quest/[id]/edit` (server Quest) | Low        | Same screens re-exported                                                                                                                       |
| `SweetAlert` holds a single `current` slot. A second alert replaces a pending confirm and its `onConfirm` is lost. No production collision was found         | Low (risk) | `SweetAlert.tsx:143-149`                                                                                                                       |
| My Quests card body opens Detail `mode=post`. The CTA opens Manage. Home card opens Detail                                                                   | Low        | `useMyQuestListController.ts:90-101`                                                                                                           |
| Worker Home "available quests" feed duplicates the Board with a separate query, limit 20                                                                     | Low        | `workerHomeQueries.ts:23-38`                                                                                                                   |
| Preview params in Detail are not `__DEV__`-gated                                                                                                             | Low        | `questDetailRoute.ts:84-86`. Reachability in a production build was not established                                                            |

**Repository gaps (not bugs):** no mobile surface for Payout, Red Flag display, or Dispute status beyond the Work Hub card. The missing `docs/specs/`, `docs/system-design-specification.md` and `docs/qa/` are noted above.

---

## 1. Top problems by user impact

1. **Money tab stale after publish, cancel, approve and fail (#2).** It touches every financial action.
2. **Hirer can't review a pending proof on a FAILED Quest (#8).** This routes money wrongly.
3. **Workers can't see or vote on Quest Edits (#1).** The consent gate can't complete.
4. **Cancel of an in-progress Quest has only one confirm (#7).** It is irreversible and costs the full reward.
5. **Work Conversation stays writable after terminal (#3).** Sending ends in an error.
6. **Chat retry can duplicate a message (#4).**
7. **Worker can't rate the Hirer (#5).**
8. **Board name-tap silently creates an inquiry (#6).**
9. **Manage sheet stays open after select, with three inconsistent selection paths (#11).**
10. **Work Hub commands leave other Worker screens stale (#12).**
11. **Wrong destination after join / select (#13, #14).**
12. **Publish duplicates after a process kill (#9).** The trigger is rare, but the impact is real money.

## 2. Journey map

- **Cold start:** `_layout` → `AuthMiddleware` → `AuthGate` → session → `/(tabs)` or `/onboarding` → Home.
- **Discover & join:** Board → `/quest/[id]` → confirm → join or apply → invalidate board, detail, snapshot and Worker reads → `/my-quests`.
- **Team:** Detail → `/quest/[id]/team` → submit → Hirer select → Detail.
- **Create:** Create tab → steps 1–2 saved to SecureStore → Review-entry creates the server draft → Publish → completion → Board.
- **Hirer manage:**
  - Home banner → Select-roster → back.
  - Home card → Detail.
  - My Quests CTA → Manage → sheet / cancel / proof review.
  - Proof-review popup → approve or reject.
- **Worker work:**
  - Work Management → `/quest/[id]/work` → Start Work → inline proof → submit.
  - Candidate decision: 30s poll → banner → Detail.
- **Chat:** Inbox → `/chat/[id]` → optimistic send → ack or socket echo → invalidate list and unread.
- **Money:** Money tab → `/top-up` → quote → QR → manual Check Status → refetch → back.
- **Terminal:** My Quests card (Rating modal, or Dispute for FAILED) / Detail post mode.

## 3. State-transition maps

**Quest:** `DRAFT → OPEN → ASSIGNED → IN_PROGRESS → COMPLETED`. `CANCELLED` is reachable from `OPEN`, `ASSIGNED` and `IN_PROGRESS`. `FAILED` is reachable from `ASSIGNED` and `IN_PROGRESS`.

| State         | Hirer                                  | Worker                   | UI gap                                 |
| ------------- | -------------------------------------- | ------------------------ | -------------------------------------- |
| `OPEN`        | Select, cancel (Tier 1)                | Join, apply, inquiry     | Board name-tap creates an inquiry (#6) |
| `ASSIGNED`    | Edit proposal, cancel (Tier 2 missing) | Start Work, vote on edit | Edit vote unreachable (#1)             |
| `IN_PROGRESS` | Proof review, cancel (Tier 3 missing)  | Proof / confirm          |                                        |
| `FAILED`      | Proof review (server-allowed), dispute | Dispute                  | No entry to proof review (#8)          |
| Terminal      | Rating                                 | Rating                   | Worker → Hirer target missing (#5)     |

**Proof:** `draft → PROOF_PENDING → PROOF_APPROVED / PROOF_NOT_APPROVED` (auto-approve at 24h). The pre-submit draft is not durable (#17).

**Quest Edit:** `PENDING → APPLIED / FAILED`. The Worker can't see the pending state (#1).

**Top-up:** `PENDING → PAID / EXPIRED / FAILED`. Only a manual check moves the client (#15).

**Conversation:** `OPEN → terminal read-only`. The client lags the transition (#3).

## 4. Screens most likely to show stale data

1. **Money / Wallet.** No event, no focus refetch, absent from invalidators.
2. **Worker Home and Work Management.** No per-Quest subscription. Start Work, edit-response and completion skip them.
3. **Work Conversation composer.** The capability is fetched once.
4. **Manage sheet.** The local `candidateOpen` state outlives the entity change.
5. **Chat inbox and unread.** Polls only the unread key; the list needs a pull.
6. **Public Profile.** Hard-coded stats and no review invalidation.
7. **Board, in rare cases.** Edit-flow cancel skips the board key.

## 5. Flows with unnecessary taps or screens

- Selected Candidate / Team Leader → Start Work: 4 taps, should be 1 (#14).
- FCFS join → `/my-quests` list → card → Hub (#13).
- Manage select: sheet → select → close the empty sheet manually (#11).
- PromptPay: pay, return, tap Check Status, often more than once (#15).
- Chat 429 upload: re-pick the same file (#19).
- Hirer proof review of a FAILED Quest: no path (#8).

## 6. Duplicate or overlapping features and actions

- Candidate selection in three places (Home banner → roster; Detail sheet; Manage sheet) with different confirm and exit behaviour.
- Hirer Quest entry from My Quests card body (Detail) vs card CTA (Manage) vs Home card (Detail).
- `/top-up` and `/wallet/top-up`; `/quest-board` and the Board tab.
- `/create?editQuestId` (local draft) vs `/quest/[id]/edit` (server Quest).
- Worker Home feed vs Board discovery.
- Cancel implemented in two mutation hooks with different invalidation sets: `createQuestQueries` (edit-flow cancel) vs `questBoardQueries` (Manage and card cancel).
- "Work Hub" CTA routes to the `/my-quests` list.

## 7. Multiple sources of truth

- **Hirer edit request id:** Hirer `useState` vs server vs WebSocket event, where the event value is discarded (#1).
- **Create draft:** SecureStore local draft vs server `QUEST_DRAFT`, with no link between them (#9).
- **Proof composition:** local files vs server draft vs snapshot (#17).
- **Client-clock eligibility** vs server `capabilities` (#20).
- **Chat capability** (`canWrite`) in a one-shot query vs the live Quest state (#3).
- **Top-up:** `activeTopUp` in component state vs the server's `listTopUps` (#15).
- **Manage `candidateOpen`** vs the snapshot's `canSelect*` (#11).
- **Wallet cache** vs the settlement events that change it (#2).
- **Edit-draft `dirty` ref** vs query data (#18).

## 8. Suggested simplified flows

- **Select Candidate:** one path. Card or banner → roster/sheet → confirm once → sheet closes → Manage. Delete the two divergent implementations.
- **Start Work:** banner or card for a selected Assignment → Work Hub directly.
- **FCFS join:** confirm → join → `/quest/[id]/work` (not the list).
- **Money:** every money-moving mutation invalidates `walletKeys.all`, and pending top-up polls with a bounded timeout. A server wallet event would cover the Worker earnings case.
- **Cancel:** state-tiered guardrail as ADR 0003 says.
- **FAILED Quest with a pending proof:** Detail post mode and Manage get a "Review proof" CTA while `canReviewProof` is true.
- **Quest Edit:** carry `editRequestId` from the WebSocket event into the snapshot query, so the Worker's Work Hub renders and votes without a route param.
- **Chat:** hold the `clientMessageId` with the draft. Refetch the conversation snapshot on per-Quest events.

---

**Not exercised.** No builds, tests or device runs, and the backend was not inspected. Server-side items to confirm are edit-request delivery to Workers, chat message dedupe by `clientMessageId`, and whether a `QUEST_FAILED` event fires at `dueAt`.
