# Wallet, Payments and Financial Contract

Type: Specification Reference
Domain: Student Wallets, Double-Entry Ledger, Quest Escrow, Top-ups, Payouts
Authority: Aligned with the mirrored backend Finance Rulebook (`docs/rulebook/finance/finance-rulebook.md`, synced from `KUQuest-API-Server` at commit `1b55199d74d2e73a4a05a4662e49fb643cbee3e6`) and accepted financial ADRs.

---

## 1. Core Financial Architecture

KUQuest uses an authoritative, balanced **double-entry ledger** represented entirely in **Integer Satang** (฿1.00 = 100 Satang).

### 1.1 Four Wallet Compartments

Every Member's Wallet is partitioned into four independent compartments:

| Compartment                               | Source of Inbound Funds                             | Allowed Outbound Operations                                         | Purpose                                                                               |
| ----------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Spending Balance**                      | Top-ups, Earnings Conversions, Quest Escrow refunds | Quest Escrow funding                                                | Funds available to commit to Quest rewards and fees. Cannot be directly withdrawn.    |
| **Earnings Balance**                      | Completed Quest Reward settlements                  | Earnings Conversion, Payout requests                                | Funds earned from performing work. Can be converted to Spending Balance or withdrawn. |
| **Funding Reserved (Quest Escrow)**       | Spending Balance (locked at Quest publish)          | Settlement to Worker Earnings, Platform Revenue, or refund to Hirer | Funds locked to guarantee payment for published Quests. Decoupled from Quest entity.  |
| **Reserved for Payouts (Payout Reserve)** | Earnings Balance (locked at Payout creation)        | Outbound bank transfer, or refund to Earnings upon rejection        | Funds locked while awaiting manual Admin Payout approval and provider processing.     |

### 1.2 Balance Limits & Overflow Safeguards

- **Currency Unit**: Integer Satang (positive integers only; no floating-point arithmetic).
- **Maximum Wallet Capacity**: 2,000,000,000 Satang (฿20,000,000.00) total across compartments.
- **Wallet Statuses**:
  - `ACTIVE`: Normal user-initiated operations permitted.
  - `FROZEN`: Administrative hold; blocks new commitments; continues in-flight reconciliations.
  - `SUSPENDED`: Policy violation hold; requires administrative review.
  - `CLOSED`: Terminal account state.

---

## 2. Quest Escrow & Inclusive Quest Funding Total

### 2.1 Funding Arithmetic

At the API boundary, the Hirer specifies the **inclusive Quest Funding Total** (`questFundingTotal`) per Worker slot in Baht:

$$\text{questFundingTotal} = \text{questReward} + \text{platformFee}$$

1. **Conversion**: Input Baht is converted to integer Satang.
2. **Platform Fee Calculation**: The Server derives the net `questReward` such that:
   $$\text{requiredFee} = \lceil\text{questReward} \times \text{feeRate}\rceil$$
   $$\text{platformFee} = \text{questFundingTotal} - \text{questReward}$$
   _(Rounding mode is strictly `UP`; any rounding remainder up to 1 Satang remains in the Platform Fee)._
3. **Escrow Lock**: At Quest publish, Quest Escrow atomically reserves:
   $$\text{totalEscrow} = \text{questFundingTotal} \times \text{headcount}$$

### 2.2 Visibility Rules

- **Hirer Views**: Display full breakdown—`questFundingTotal`, net `questReward`, `platformFee`, `platformFeeBps`, and `reservationId`.
- **Worker & Public Views**: Display **only** the net `questReward`. Platform Fee, Money Policy details, and Escrow reservation IDs are strictly hidden.

---

## 3. Financial Lifecycles and User Journeys

### 3.1 PromptPay QR Top-Up

1. Member enters top-up amount (&ge;฿10.00).
2. Server creates a PromptPay QR code with a **5-minute quote lifetime**.
3. Member completes transfer via Thai banking app.
4. Payment gateway webhook triggers atomic clearing &rarr; credited to Member's **Spending Balance**.

### 3.2 Earnings Conversion

- **Nature**: Instant, fee-free, and **irreversible**.
- **Action**: Member transfers an explicit Satang amount from **Earnings Balance** &rarr; **Spending Balance**.
- **Rule**: Converted funds cannot be converted back to Earnings Balance or withdrawn.

### 3.3 Payout Management

1. **Destination**: Member registers a verified Thai Bank account or PromptPay destination (encrypted at application layer with AES-256-GCM; masked in UI as `***-***-1234`).
2. **Request**: Member requests payout of an amount from Earnings Balance. Amount + provider fee + tax are moved to **Reserved for Payouts** (`PENDING_ADMIN_APPROVAL`).
3. **Admin Approval Gate**: All Payouts require explicit manual Admin Approval (ADR 0022). There is no automatic approval or timeout.
4. **Outcome**:
   - **Approved**: Provider initiates bank transfer &rarr; `SUCCEEDED` (funds deducted from reserve).
   - **Rejected**: Full Payout Reserve returned to Member's **Earnings Balance**; notification sent.

---

## 4. Settlement & Cancellation Matrix

| Quest State at Event              | Hirer Spending Balance                                                                 | Worker Earnings Balance                                       | Platform Revenue      |
| --------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------- |
| **`QUEST_COMPLETED`**             | 0%                                                                                     | 100% of net `questReward` transferred immediately             | Platform Fee retained |
| **Cancel in `QUEST_OPEN`**        | 100% of Quest Escrow refunded                                                          | 0%                                                            | 0%                    |
| **Cancel in `QUEST_ASSIGNED`**    | 80% of Worker Reward pool + 100% Platform Fee refunded                                 | 20% of Worker Reward pool split among Active Workers          | 0%                    |
| **Cancel in `QUEST_IN_PROGRESS`** | 0% refund                                                                              | 100% of Worker Rewards settled to Active Workers              | Platform Fee retained |
| **`QUEST_FAILED`**                | 100% of unpaid slot funding + fee returned, **held for 7 days** in Funding Reservation | Unpaid: 0%<br>Completed group workers: retain settled rewards | 0% on failed slots    |

---

## 5. 7-Day Failure Money Hold and Dispute Resolution

- When a Quest reaches `QUEST_FAILED`, returned funds are **not released immediately** to the Hirer's Spending Balance.
- Funds remain locked in the Quest's `Funding Reservation` for **7 days**.
- **Dispute Case Window**:
  - Hirer or Worker may file a Dispute Case within **1 day** of failure.
  - Admin may file a Dispute Case within **5 days** of failure.
- **Resolution**: An approved Dispute Case executes a reversing transaction from the held Funding Reservation directly to the affected Worker's Earnings Balance.
- After 7 days, any remaining held funds release automatically to the Hirer's Spending Balance.
