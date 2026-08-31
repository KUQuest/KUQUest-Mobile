# Proof Submission and Rating Review Specification

Type: Specification Reference
Domain: Work Proofs, Hirer Decisions, Terminal Rating Reviews
Authority: Aligned with the mirrored backend Proof Submission Contract (`docs/rulebook/quest/proof-submission-contract.md` and `rating-review-contract.md`, synced from `KUQuest-API-Server` at commit `1b55199d74d2e73a4a05a4662e49fb643cbee3e6`).

---

## 1. Proof Submission Contract

### 1.1 Proof Requirement Paths

- **When `proofRequired = false`**:
  - The required submitter confirms completion before `dueAt`.
  - No file attachments are uploaded and no Hirer review is required.
  - Submitter: Worker for `SINGLE` and `GROUP + FCFS`; Team Leader for `GROUP + CANDIDATE`.
- **When `proofRequired = true`**:
  - The required submitter must submit proof files before `dueAt` for Hirer review.

### 1.2 Draft and Send Lifecycle

1. **Drafting**:
   - Submitter can save, edit, and replace an unsent draft before `dueAt`.
   - Draft is private and visible only to the submitter (creates no notifications or chat messages).
   - Description is optional (&le;1,000 characters).
   - Submitter can attach **1 to 5 files** (images, PDF, video up to 10 MB each).
   - At least one description or file attachment is required.
2. **Sending**:
   - Sending locks the Proof Submission permanently; no further edits or file replacements are allowed.
   - If the network fails, the draft is preserved locally and the submitter must retry before `dueAt`.

### 1.3 Hirer Review and Decision

- **Review Window**: The Hirer has a **24-hour review window** starting from the moment proof is sent.
- **Review UI**: Hirer reviews each Proof Submission individually in a dedicated Review Popup showing attached evidence and description.
- **Decisions**:
  - `PROOF_APPROVED`: Work accepted &rarr; Assignment becomes `ASSIGNMENT_COMPLETED` &rarr; Quest enters `QUEST_COMPLETED` (or waits for other group assignments) &rarr; Reward transferred.
  - `PROOF_NOT_APPROVED`: Hirer rejects proof (mandatory reason &le;1,000 characters). Immediately makes the Assignment `ASSIGNMENT_INCOMPLETE` and transitions the Quest to **`QUEST_FAILED`**.
- **Auto-Approval**: If the Hirer does not submit a decision within **24 hours**, the Server automatically records `PROOF_APPROVED`.
- **No Rework Policy**: There is no rework quota, revision request, or secondary submission. Non-approval is final and immediately terminal.

### 1.4 Admin Review Items and Failure Isolation

- Every `PROOF_NOT_APPROVED` decision automatically creates an **Admin Review Item** in the Admin queue for audit and dispute context.
- In `GROUP + FIRST_COME_FIRST_SERVED`:
  - An approved Worker keeps their settled Reward even if a subsequent Worker's non-approval causes the Quest to enter `QUEST_FAILED`.
  - Other pending proofs submitted on time can still be reviewed by the Hirer post-failure, settling rewards from the 7-day held Funding Reservation.

---

## 2. Rating Review Contract

### 2.1 Post-Terminal Review Availability

- Reviews become available after the Quest enters **ANY Terminal State**:
  - `QUEST_COMPLETED`
  - `QUEST_FAILED`
  - `QUEST_CANCELLED`
- Reviews are optional and do not block or delay terminal transitions or money settlements.

### 2.2 Review Pairs & Eligibility

- **Direction**: Strictly reciprocal per Hirer/Worker pair:
  - The Hirer may review each Worker who held an Assignment.
  - Each Worker may review the Hirer.
  - In `GROUP` Quests, Workers do not review other Workers.
- **Quota**: At most one review per direction per Quest.
- **Failed Quest Coverage**: Applies equally to failed Quests, including after `PROOF_NOT_APPROVED` decisions.

### 2.3 Review Rules & Reputation

- **Edit Window**: The author may edit their review for **7 days** after the Quest becomes terminal.
- **Immutability**: Reviews **cannot be deleted**.
- **Reputation**: Submitted reviews contribute directly to the reviewed Member's aggregate **Profile Rating** and **Reputation**.

### 2.4 Mobile Access Points

- KU bot posts a System Message in the Work Conversation with direct links to the Rating Review page upon terminal transition.
- Members can also open the review page from **Quest Detail** or **My Quests History** during the 7-day edit window.
