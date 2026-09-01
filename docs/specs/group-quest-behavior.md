# Group and Candidate Quest Behavior Matrix

Type: Specification Reference
Domain: Quest Participation Modes, Candidate Teams, Consent Gates, Settlement
Authority: Aligned with the mirrored backend Quest Rulebook (`docs/rulebook/quest/`, synced from `KUQuest-API-Server` at commit `fc47a089f5ae4d40914ac771baef9f2e7a0bef63`). Defines the exact behavior for all participation and selection mode combinations.

---

## 1. The 2×2 Mode and Participation Matrix

Every Quest is defined by two axes:

1. **Participation**: `SINGLE` (headcount = 1) or `GROUP` (headcount > 1, up to 20).
2. **Selection Mode**: `FIRST_COME_FIRST_SERVED` (FCFS) or `CANDIDATE`.

| Dimension                    | `FIRST_COME_FIRST_SERVED` (FCFS)                                                                                                                                                                      | `CANDIDATE`                                                                                                                                                                                                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`SINGLE`** (Headcount = 1) | Direct join by first eligible Member.<br>Becomes `QUEST_ASSIGNED` immediately.<br>Worker presses Start Work.                                                                                          | Individual Candidate applications.<br>Hirer selects 1 Candidate &rarr; `QUEST_ASSIGNED`.<br>Selected Worker presses Start Work.                                                                                                                                                   |
| **`GROUP`** (Headcount > 1)  | Direct joins in arrival order.<br>Full roster at `startTime` &rarr; `QUEST_ASSIGNED`.<br>Underfilled at `startTime` &rarr; 10m Hirer / 10m Worker consent.<br>Every Active Worker presses Start Work. | Candidate Teams form via **Join Code** (Team Leader enters headcount 2..published `headcount`).<br>Leader submits team with text and &ge;1 file.<br>Hirer selects 1 Team &rarr; `QUEST_ASSIGNED`.<br>Leader starts/submits; complete Worker Reward pool paid only to Team Leader. |

---

## 2. Quadrant Specifications

### 2.1 Quadrant 1: `SINGLE + FIRST_COME_FIRST_SERVED`

- **Roster Capacity**: Exactly 1 Worker.
- **Join Mechanism**: First eligible Member joins directly; no application or team needed.
- **Lifecycle Flow**:
  1. Member joins &rarr; Quest enters `QUEST_ASSIGNED`, Assignment created (`ASSIGNMENT_ACTIVE`), Work Conversation opens.
  2. Worker presses Start Work between `startTime` and `dueAt` &rarr; `QUEST_IN_PROGRESS`.
  3. Worker submits proof (or confirms completion if `proofRequired=false`) before `dueAt`.
  4. Hirer approves &rarr; `QUEST_COMPLETED`; Reward transferred.
- **Failure**: If no Member joins before `startTime`, Quest moves to `QUEST_CANCELLED` with 100% Escrow refund. If Worker fails to start or submit by `dueAt`, Quest moves to `QUEST_FAILED`.

### 2.2 Quadrant 2: `SINGLE + CANDIDATE`

- **Roster Capacity**: Exactly 1 Worker.
- **Application Mechanism**: Multiple eligible Members apply individually while `QUEST_OPEN`.
- **Candidate Lifecycle**:
  - Candidate may withdraw an application before Selection (`APPLICATION_WITHDRAWN`) and may reapply while `QUEST_OPEN`.
  - Hirer may manually reject a Candidate (`APPLICATION_REJECTED`); the Quest stays `QUEST_OPEN`, and the rejected Candidate cannot reapply.
- **Selection**:
  - Hirer selects 1 Candidate (`APPLICATION_SELECTED`).
  - Quest moves atomically to `QUEST_ASSIGNED`, creates `ASSIGNMENT_ACTIVE`, opens Work Conversation, and auto-rejects all competing Candidates.
- **Start & Work**: Selected Worker presses Start Work between `startTime` and `dueAt` &rarr; `QUEST_IN_PROGRESS`.
- **Failure**: If no Candidate is selected before `startTime`, Quest moves to `QUEST_CANCELLED` with 100% Escrow refund.

### 2.3 Quadrant 3: `GROUP + FIRST_COME_FIRST_SERVED`

- **Roster Capacity**: Published `headcount` (2 to 20 Workers).
- **Join Mechanism**: Eligible Members join directly in arrival order while `QUEST_OPEN`. Each join creates an `ASSIGNMENT_ACTIVE` and grants Work Conversation membership.
- **Full Roster at `startTime`**:
  - If joined Workers == `headcount` at `startTime`, Quest transitions to `QUEST_ASSIGNED`.
  - **Every Active Worker** must independently press Start Work between `startTime` and `dueAt`. When all have pressed start, Quest moves to `QUEST_IN_PROGRESS`.
- **Underfilled Roster at `startTime`**:
  - If 0 Workers joined: Quest moves to `QUEST_CANCELLED` with 100% Escrow refund.
  - If 1 &le; joined Workers < `headcount`:
    1. **Hirer Gate (10 min)**: Hirer decides to proceed with the smaller roster or cancel. If Hirer cancels or times out &rarr; `QUEST_CANCELLED` (100% refund).
    2. **Worker Consent Gate (10 min)**: If Hirer proceeds, all joined Active Workers receive a consent view showing the exact new split Reward and `dueAt`.
    3. **Unanimous Consent**: If all joined Workers consent within 10 minutes &rarr; Quest enters `QUEST_ASSIGNED` with the frozen roster.
    4. **Consent Failure**: Any decline or timeout &rarr; Quest moves to `QUEST_CANCELLED` (100% refund).
    5. **Split Reward Calculation**: Original Worker Reward pool (`questReward × originalHeadcount`) is split equally among the actual Workers; any remainder satang is allocated to the earliest joined Worker.
- **Work & Submission**: Each Worker submits individual proof or confirms completion. An approved Worker receives their reward even if another Worker fails.

### 2.4 Quadrant 4: `GROUP + CANDIDATE`

- **Roster Capacity**: Published Quest `headcount` (2 to 20). Candidate Team enters Team `headcount` from 2 through published `headcount` (Team Leader counts as 1).
- **Candidate Team Formation**:
  - Before creating the team, the **Team Leader** enters a Team `headcount` (from 2 through the published Quest `headcount`).
  - Server generates a unique **Join Code** valid for 24 hours. The Team Leader sends the code to prospective Team Members; members join only by accepting the Join Code.
  - A Candidate may belong to at most one team per Quest.
  - Forming members may leave; Team Leader may remove members. If Team Leader leaves, leadership passes to the earliest joined member. If the last member leaves, the team disbands.
  - **Team Submission**: At the entered Team `headcount`, the Team Leader explicitly submits the team to the Hirer (`TEAM_SUBMITTED`). The submission requires text and at least one file (following Work Conversation Attachment type/size limits: images, PDF, video &le;10 MB). Once submitted, the team is locked, immutable, cannot withdraw, and the Join Code becomes invalid.
- **Selection**:
  - Hirer sees only `TEAM_SUBMITTED` teams.
  - Hirer may manually reject a submitted team (`TEAM_REJECTED`).
  - Hirer selects exactly 1 submitted team (`TEAM_SELECTED`).
  - Atomically: Quest enters `QUEST_ASSIGNED`, every team member receives an `ASSIGNMENT_ACTIVE`, Work Conversation opens, and all competing Candidate Teams are rejected.
- **Start Work & Submission**:
  - **Team Leader presses Start Work** on behalf of the entire team between `startTime` and `dueAt` &rarr; `QUEST_IN_PROGRESS`.
  - **Team Leader submits Proof** (or confirms completion) on behalf of the team before `dueAt`.
  - **Atomic Outcome & Reward Settlement**: Approved proof marks all members `ASSIGNMENT_COMPLETED` and pays the complete Worker Reward pool for all published slots to the Team Leader only (other team members receive no Quest Reward). Non-approved proof (`PROOF_NOT_APPROVED`) or missing submission at `dueAt` marks all members `ASSIGNMENT_INCOMPLETE` and moves Quest to `QUEST_FAILED`.

---

## 3. Quest Condition Edits in `QUEST_ASSIGNED`

Across all 4 combinations:

- Quest Edits are permitted **only while in `QUEST_ASSIGNED`**.
- Hirer submits proposed Condition Item changes.
- All Active Workers have **10 minutes** to respond.
- Unanimous approval &rarr; `EDIT_REQUEST_APPLIED` (Condition updated).
- Any decline or timeout &rarr; `EDIT_REQUEST_FAILED` (Condition unchanged; Quest remains `QUEST_ASSIGNED`).
- Does not change Quest State.

---

## 4. Cancellation Settlement Matrix

| State at Cancellation | Hirer Refund                                  | Worker Compensation                                                                                                      | Platform Fee           |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| `QUEST_OPEN`          | 100% of Quest Escrow                          | 0%                                                                                                                       | 100% refunded to Hirer |
| `QUEST_ASSIGNED`      | 80% of Worker Reward pool + 100% Platform Fee | 20% of Worker Reward pool split among Active Workers (for `GROUP + CANDIDATE`, paid 100% to Team Leader)                 | Refunded to Hirer      |
| `QUEST_IN_PROGRESS`   | 0%                                            | 100% of Worker Rewards paid to Active Workers (for `GROUP + CANDIDATE`, complete Worker Reward pool paid to Team Leader) | Retained by Platform   |

---

## 5. Invariants

1. **Hirer-Worker Mutual Exclusion**: The Hirer can never be a Worker, Candidate, or Team Leader on their own Quest.
2. **Team Immutability**: A submitted Candidate Team cannot change roster, add members, or withdraw.
3. **Atomic Selection**: Selecting a Candidate or Team atomically assigns the winner and rejects all competitors in one transaction.
4. **No Rework**: Any proof rejection (`PROOF_NOT_APPROVED`) or missed `dueAt` is immediately terminal as `QUEST_FAILED`.
5. **7-Day Money Hold**: On `QUEST_FAILED`, unpaid Escrow funds return to the Hirer but remain held in Funding Reservation for 7 days before releasing to Spending Balance.
