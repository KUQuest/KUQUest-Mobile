# Upstream Backend Rulebook Mirror

Type: Upstream Domain Authority
Source Repository: `KUQuest-API-Server` (`../../KUQuest-API-Server/`)
Source Path: `docs/rulebook/`
Upstream Commit: `fc47a089f5ae4d40914ac771baef9f2e7a0bef63`
Commit Message: `fc47a08 docs(quest): confirm Candidate Team rules (#353)`
Captured Date: `2026-09-01`

---

## Purpose

This directory mirrors the accepted backend rulebooks from `KUQuest-API-Server`. It serves as the local **source of truth** for all KUQuest Mobile domain policies, lifecycle transitions, state machines, financial contracts, proof submissions, conversations, and administrative boundaries.

---

## Directory Index & Contract Map

### 1. Cross-Domain Boundaries

- [`domain-boundaries.md`](domain-boundaries.md) — Cross-subsystem transaction atomicity, access rules, and seams between Quest, Chat, Finance, and Admin domains.

### 2. Quest & Work Chat Contracts (`quest/`)

- [`quest/quest-work-chat-rulebook.md`](quest/quest-work-chat-rulebook.md) — Root Quest & Work Chat accepted rulebook.
- [`quest/quest-lifecycle-contract.md`](quest/quest-lifecycle-contract.md) — 7 canonical Quest states, Start Work protocol, underfilled FCFS consensus, failure rules, and cancellation matrix.
- [`quest/quest-mode-matrix-contract.md`](quest/quest-mode-matrix-contract.md) — Full 2×2 participation matrix (`SINGLE`/`GROUP` × `FCFS`/`CANDIDATE`).
- [`quest/quest-condition-contract.md`](quest/quest-condition-contract.md) — Condition Items validation, 10-minute all-Active-Worker Quest Edit protocol, and `dueAt` deadlines.
- [`quest/proof-submission-contract.md`](quest/proof-submission-contract.md) — Proof drafts, 1–5 file uploads, 24-hour review window, `PROOF_NOT_APPROVED` failure, and Admin Review Items.
- [`quest/reward-money-contract.md`](quest/reward-money-contract.md) — Inclusive Quest Funding Total, net Reward vs Platform Fee math, atomic escrow reservation, and 7-day failure hold.
- [`quest/conversation-contract.md`](quest/conversation-contract.md) — Candidate Inquiry Conversations (1-on-1, `QUEST_OPEN`) vs Work Conversations (coordination, KU bot System Messages).
- [`quest/rating-review-contract.md`](quest/rating-review-contract.md) — Reciprocal review pairs after any terminal Quest state (`COMPLETED`, `FAILED`, `CANCELLED`), 7-day edit window.
- [`quest/quest-image-contract.md`](quest/quest-image-contract.md) — Quest detail gallery images (0–3 files, &le;5 MB, JPEG/PNG/WebP, 15-minute temporary URLs).
- [`quest/notification-audit-contract.md`](quest/notification-audit-contract.md) — KU bot System Messages, Android FCM Push notifications, and audit logging.

### 3. Finance & Wallet Contracts (`finance/`)

- [`finance/finance-rulebook.md`](finance/finance-rulebook.md) — Root Student Wallet, double-entry ledger, and money policy rulebook.
- [`finance/wallet-compartment-contract.md`](finance/wallet-compartment-contract.md) — 4 balance compartments (Spending, Earnings, Funding Reserved, Reserved for Payouts), integer Satang unit, and 2B Satang capacity cap.
- [`finance/double-entry-ledger-contract.md`](finance/double-entry-ledger-contract.md) — Balanced double-entry subledger, zero-sum postings, and account types.
- [`finance/funding-reservation-contract.md`](finance/funding-reservation-contract.md) — Generic Escrow lock, per-slot settlement, cancellation refunds, and 7-day failure money hold.
- [`finance/topup-and-conversion-contract.md`](finance/topup-and-conversion-contract.md) — PromptPay QR deposit quotes (5m expiry), webhook clearing, and instant fee-free Earnings Conversion.
- [`finance/payout-contract.md`](finance/payout-contract.md) — Application-layer encrypted bank details (AES-256-GCM), masked display, and manual Admin approval queue (`PENDING_ADMIN_APPROVAL`).
- [`finance/money-policy-contract.md`](finance/money-policy-contract.md) — Versioned policy revisions, Platform Fee calculation (`platformFeeBps`), and ceiling rounding (`UP`).

### 4. Admin Operations Contracts (`admin/`)

- [`admin/admin-rulebook.md`](admin/admin-rulebook.md) — Root Admin operations rulebook: Dispute Cases, Payout Approvals, Quest Hiding, Wallet Freezing, Trust & Safety moderation, and Penalty ladders.
- [`admin/admin-dispute-case-contract.md`](admin/admin-dispute-case-contract.md) — Dispute Cases on `QUEST_FAILED` Quests, 1-day self-file / 5-day Admin windows, 7-day money hold in Funding Reservation.
- [`admin/admin-quest-hide-contract.md`](admin/admin-quest-hide-contract.md) — Independent `hiddenAt` discovery filter flag across non-terminal Quests without mutating lifecycle or Escrow.
- [`admin/admin-wallet-freeze-contract.md`](admin/admin-wallet-freeze-contract.md) — `FROZEN`/`SUSPENDED` statuses, blocking new commitments while honoring active obligations.
- [`admin/admin-trust-safety-contract.md`](admin/admin-trust-safety-contract.md) — Work Chat & Candidate Inquiry message moderation via Evidence References.
- [`admin/admin-member-penalty-contract.md`](admin/admin-member-penalty-contract.md) — Misconduct ladder (Red Flag 7d, Temp ban 7d, Permanent ban) and Review ladder (<3.0 average).
- [`admin/admin-conduct-report-contract.md`](admin/admin-conduct-report-contract.md) — Quest misconduct reports (`CONDUCT_ABANDONED`, `CONDUCT_OUT_OF_SCOPE`, `CONDUCT_NO_SHOW`) based on Quest records.
- [`admin/admin-payout-approval-contract.md`](admin/admin-payout-approval-contract.md) — Manual approval queue under `/api/v1/admin/payouts`.
