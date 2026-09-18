# Mobile Client Endpoint Gap & Feature Delivery Roadmap

**Date**: 2026-09-18  
**Status**: Ready for Agent Implementation  
**Target Repositories**: `KUQUest-Mobile` & `KUQuest-API-Server`  
**Authoritative References**: `CONTEXT.md`, `docs/rulebook/`, `docs/specs/`, `docs/api/api.yaml`

---

## 1. Executive Summary

This engineering plan synthesizes the findings of the systematic audit across:

1. **Mirrored Backend Rulebook (`docs/rulebook/`)**: Synced from `KUQuest-API-Server` at commit `1b55199d`.
2. **Canonical OpenAPI 3.1 Specification (`docs/api/api.yaml`)**: 216 operations across 41 tags.
3. **Current Mobile Client Implementation (`src/api/*`, `src/features/*`, `src/app/*`)**.

While the mobile client has made significant progress by adopting the Quest v2 schema for board discovery, draft creation, and basic assignment views, **critical lifecycle, finance, and media seams remain broken, disconnected, or orphaned**.

This document categorizes all discrepancies into actionable engineering tracks and outlines 5 agent-ready implementation epics.

---

## 2. API Contract Gaps & Discrepancy Matrix

### 2.1 Payouts & Payout Destinations (Finance Domain)

_Contract Reference_: `docs/rulebook/finance/payout-contract.md`

| Operation ID                    | Method & Path                                   | Spec Requirement (`api.yaml`)                                                                       | Mobile Implementation (`WalletApi.ts`)                                               | Severity     |
| :------------------------------ | :---------------------------------------------- | :-------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- | :----------- |
| `quotePayout`                   | `POST /api/v1/payouts/quotes`                   | Body: `{ receiptSatang: number }`. Returns max fee, tax, debit, and `quoteId`.                      | **MISSING**. Not implemented in `WalletApi.ts`.                                      | **CRITICAL** |
| `createPayout`                  | `POST /api/v1/payouts`                          | Body: `{ quoteId: string }` + Header: `idempotency-key`.                                            | Mismatched payload: sends `{ amountSatang, destinationId }` directly.                | **CRITICAL** |
| `getActivePayoutDestination`    | `GET /api/v1/payout-destinations`               | Response: `{ success: true, data: PayoutDestination \| null }`.                                     | Expects `{ data: { destinations: PayoutDestination[] } }`. Throws Zod parse error.   | **CRITICAL** |
| `saveActivePayoutDestination`   | `POST /api/v1/payout-destinations`              | Body: `{ givenName, surname, accountHolderName, bankCode, accountNumber, routingType }`.            | Passes `{ type, accountHolderName, accountNumber }` without legal name or bank code. | **CRITICAL** |
| `retireActivePayoutDestination` | `DELETE /api/v1/payout-destinations`            | Path has **no parameter**; retires authenticated user's active destination.                         | Calls `/api/v1/payout-destinations/${id}`, resulting in HTTP 404/405.                | **CRITICAL** |
| `getPayout`                     | `GET /api/v1/payouts/{payoutId}`                | Returns single payout status and destination snapshot.                                              | **MISSING**. Not implemented in `WalletApi.ts`.                                      | **HIGH**     |
| `listPayoutStatusHistory`       | `GET /api/v1/payouts/{payoutId}/status-history` | Returns state transition timeline (`PENDING_ADMIN_APPROVAL` &rarr; `SUBMITTED` &rarr; `SUCCEEDED`). | **MISSING**. Not implemented in `WalletApi.ts`.                                      | **MEDIUM**   |

---

### 2.2 Quest Lifecycle & Execution (Quest Domain)

_Contract References_: `quest-lifecycle-contract.md`, `proof-submission-contract.md`, `quest-condition-contract.md`, `rating-review-contract.md`

| Operation ID                   | Method & Path                                            | Spec Requirement (`api.yaml`)                                                    | Mobile Implementation                                                            | Severity     |
| :----------------------------- | :------------------------------------------------------- | :------------------------------------------------------------------------------- | :------------------------------------------------------------------------------- | :----------- |
| `reviewQuestV2ProofSubmission` | `POST /api/v2/quests/{id}/proof-submissions/{id}/review` | Body: `{ decision: "PROOF_APPROVED" \| "PROOF_NOT_APPROVED", reason?: string }`. | In `manage.tsx:206`, rejection is hardcoded as an alert: _"Reject unavailable"_. | **CRITICAL** |
| `createQuestReviewV2`          | `POST /api/v2/quests/{id}/reviews`                       | Body: `{ revieweeId?: string, rating: number, comment?: string }`.               | Wrapped in `QuestApi.ts`, but **0 UI Callers** exist in any screen.              | **HIGH**     |
| `updateQuestReviewV2`          | `PATCH /api/v2/quests/{id}/reviews/{id}`                 | Body: `{ rating?: number, comment?: string }` within 7-day window.               | Wrapped in `QuestApi.ts`, but **0 UI Callers** exist in any screen.              | **HIGH**     |
| `createQuestEditRequestV2`     | `POST /api/v2/quests/{id}/edit-requests`                 | Hirer submits modified condition list for assigned quest.                        | Wrapped in `QuestApi.ts`, but **0 UI Callers** exist for Hirers.                 | **HIGH**     |
| `createQuestV2ProofSubmission` | `POST /api/v2/quests/{id}/proof-submissions`             | Supports `multipart/form-data` with `files?: Array<binary>`.                     | `QuestProofScreen.tsx` blocks uploads with a false `PRIVATE_FILE_ID_BLOCKER`.    | **HIGH**     |
| `fileQuestDispute`             | `POST /api/v1/quests/{id}/disputes`                      | Path-only mutation (`questId`); empty body. Self-file within 1 day.              | `DisputeApi.ts` passes unexpected payload and calls non-existent `GET` endpoint. | **MEDIUM**   |

---

### 2.3 Chat & Media (Communication Domain)

_Contract Reference_: `conversation-contract.md`, `quest-work-chat-rulebook.md`

| Feature / Seam          | Expected Contract                                                               | Current Mobile Implementation                                                        | Severity   |
| :---------------------- | :------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :--------- |
| Inline Image Bubbles    | Image attachments render preview cards in chat bubbles.                         | Renders generic gray file row (`AttachmentRow`) with file name and `ImagePlus` icon. | **HIGH**   |
| Lightbox Media Viewer   | Tapping image opens in-app fullscreen viewer with pinch-to-zoom.                | Calls `Linking.openURL(link.url)`, forcing the user out of the app to Chrome.        | **HIGH**   |
| Composer Attachment Bar | Selected images display thumbnail strip with remove `[X]` before sending.       | No visual feedback in composer before pressing send.                                 | **MEDIUM** |
| Pre-signed Link Caching | 15-minute signed links cached client-side to prevent redundant network fetches. | No link resolution cache; links can expire on long active sessions.                  | **MEDIUM** |

---

## 3. Five Implementation Epics (Ready for Agent)

### Epic 1: Payout and Destinations Contract Alignment

- **Branch**: `slowyier/fix/payout-and-destinations-contract`
- **Core Goal**: Correct all contract drift in `WalletApi.ts` and `PayoutModal.tsx` so students can register Thai bank accounts and successfully withdraw earnings.
- **Key Deliverables**:
  1. Update `WalletApi.ts` to implement `quotePayout`, `getPayout`, and `listPayoutStatusHistory`.
  2. Fix `getActivePayoutDestination` schema to parse `{ success: true, data: PayoutDestination | null }`.
  3. Update `saveActivePayoutDestination` to pass legal name (`givenName`, `surname`) and bank code.
  4. Fix `retireActivePayoutDestination` to call `DELETE /api/v1/payout-destinations` without path ID.
  5. Refactor `PayoutModal.tsx` into a 2-step flow: (1) Enter amount & fetch Quote &rarr; (2) Review breakdown & confirm payout.

### Epic 2: Hirer Proof Review & Rejection with Reason

- **Branch**: `slowyier/feat/hirer-proof-review-and-rating`
- **Core Goal**: Eliminate the "Reject unavailable" alert blocker in `manage.tsx` and provide a complete Sent Work review experience.
- **Key Deliverables**:
  1. Create a `ProofReviewModal` supporting both `PROOF_APPROVED` and `PROOF_NOT_APPROVED`.
  2. For rejection, provide a mandatory reason text input (up to 1,000 characters) as required by `proof-submission-contract.md`.
  3. Render submitted proof attachments (images, PDFs, videos) and submission notes.
  4. Update `QuestProofScreen.tsx` to utilize direct binary multipart upload for Worker proof files, removing `PRIVATE_FILE_ID_BLOCKER`.

### Epic 3: Post-Terminal Rating Reviews for Hirer & Worker

- **Branch**: `slowyier/feat/hirer-proof-review-and-rating`
- **Core Goal**: Connect `questApi.createReview` and `updateReview` to the UI so participants can review each other within 7 days of completion/failure/cancellation.
- **Key Deliverables**:
  1. Create `RatingReviewModal` supporting 1–5 star rating and optional comments.
  2. Add "Leave Review" / "Edit Review" action buttons on `QuestDetailScreen` and `MyQuestsScreen` for quests in terminal states (`QUEST_COMPLETED`, `QUEST_FAILED`, `QUEST_CANCELLED`).
  3. Enforce the 7-day post-terminal edit window and disable editing once window expires.

### Epic 4: Chat Inline Image Rendering, Lightbox & Composer Preview

- **Branch**: `slowyier/feat/chat-inline-media-and-composer`
- **Core Goal**: Upgrade the mobile chat experience so pictures are rendered directly inside message bubbles and viewable in-app.
- **Key Deliverables**:
  1. Update `MessageBubble.tsx` to render an inline `<Image>` thumbnail for image attachments instead of `AttachmentRow`.
  2. Create `ImageViewerModal` with pinch-to-zoom and pan gestures, replacing the external `Linking.openURL` browser redirection.
  3. Add a `PendingAttachmentsBar` above the message composer displaying selected image thumbnails and an `[X]` remove button.
  4. Add an `AttachmentLinkCache` in `ChatApi.ts` to manage 15-minute signed URL lifecycles.

### Epic 5: Hirer Condition Edit Proposal Wizard on Assigned Quests

- **Branch**: `slowyier/feat/hirer-condition-edit-flow`
- **Core Goal**: Enable Hirers to submit condition item modifications on `QUEST_ASSIGNED` quests to initiate the 10-minute worker consensus window.
- **Key Deliverables**:
  1. Add a "Propose Condition Changes" action on `src/app/quest/[id]/manage.tsx` when status is `QUEST_ASSIGNED`.
  2. Implement `QuestConditionEditModal` allowing add, edit, remove, and reorder of conditions.
  3. Call `liveQuestService.createEditRequest()` and display the 10-minute consensus countdown status card.
