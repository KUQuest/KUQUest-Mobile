# KUQuest Mobile

Mobile app for Kasetsart University Members—including Staff, Lecturers, and Students—to discover, create, perform, and settle Quests.

## Authority & Source of Truth

The mirrored backend rulebook (`docs/rulebook/`, synced from `KUQuest-API-Server` at commit `fc47a089f5ae4d40914ac771baef9f2e7a0bef63`) is the canonical source of truth for domain rules, lifecycle transitions, state naming, money calculations, and administrative boundaries. This document defines the shared domain vocabulary for mobile implementation, engineering skills, and subagents.

---

## Domain Language

### 1. Identity and Roles

**Member**:
An authenticated end user of KUQuest signed in with a Google account under the `@ku.th` email domain, represented by the `auth_user` table.
_Avoid_: User, KU Account Holder, customer, account.

**Admin**:
A KUQuest operations operator signed in with credentials (not Google) through the Admin portal, represented by the `auth_admin` table. Operates with a single undifferentiated permission tier.
_Avoid_: Member, User (Admins are never Members and vice versa).

**Hirer**:
A Member who creates, publishes, and funds a Quest through Quest Escrow. The Hirer cannot be a Worker on their own Quest.
_Avoid_: Giver, employer, client, job owner.

**Worker**:
A Member accepted to perform work on a Quest, holding an active or completed Assignment.
_Avoid_: Hunter, employee, contractor, candidate.

**Candidate**:
A Member who has applied to a `CANDIDATE` Quest individually, or who belongs to a forming or submitted Candidate Team. A Candidate is not a Worker before Assignment creation.
_Avoid_: Applicant, Worker, Accepted Participant.

**Prospective Worker**:
A Member considering participation on an open Quest who does not have an active Assignment. A Prospective Worker may open a Candidate Inquiry Conversation, apply as a Candidate, join a Candidate Team, or join directly in `FIRST_COME_FIRST_SERVED` mode.
_Avoid_: Worker, Accepted Participant.

**Accepted Participant**:
The current Hirer or an Active Worker on a Quest. Only Accepted Participants have current membership and write access in the Work Conversation.
_Avoid_: Candidate, Prospective Worker, Departed Worker.

**Team Leader**:
The Candidate who creates and represents a Candidate `GROUP` Team. If the Hirer selects the Team, the Team Leader becomes a Worker. The Team Leader starts and submits or confirms the Team's required work.
_Avoid_: treating a Team Leader as the Hirer or as a leader of a FCFS Group.

**Candidate Team**:
A forming or submitted group of Candidates for one `GROUP + CANDIDATE` Quest, formed using a Server-generated Join Code. Submitted at the Team Leader-entered headcount; immutable once submitted.
_Avoid_: Quest Team, Work Conversation, direct group.

**Join Code**:
A temporary, Server-generated code valid for 24 hours that allows an eligible Prospective Worker to join a forming Candidate Team. Regeneratable by the Team Leader.
_Avoid_: Team invitation, permanent secret.

**Active Worker**:
A Worker whose Assignment on a Quest is `ASSIGNMENT_ACTIVE`.
_Avoid_: Candidate, Departed Worker.

**Departed Worker**:
A former Active Worker whose Assignment ended before Quest completion (e.g. through cancellation). Retains read-only access to messages sent up to their departure.
_Avoid_: Active Worker, Candidate.

---

### 2. Academic Registration & Profile

**Academic Registration**:
The canonical, resumable first-run step after first sign-in where a Member supplies name, Telephone, Occupation, Student ID (conditional based on Occupation), Department, and Terms acceptance, served by `/api/v1/academic-registration/*`.
_Avoid_: Onboarding (legacy debug scaffolding term), setup, sign-up.

**Occupation**:
What a Member is at KU—exactly Staff, Lecturer, or Student—stored as `auth_user.occupationId`. Each Occupation carries a `requiresStudentId` boolean; only the Student occupation requires a Student ID.
_Avoid_: Hardcoding Occupation name checks.

**Student ID**:
A KU-issued 10-digit identifier provided during Academic Registration when required. Distinct from internal auth UUIDs.
_Avoid_: User ID, student number.

**Faculty** / **Department**:
A Member's academic Department belongs to a Faculty. Both are seeded server-side and selected by canonical ID.
_Avoid_: Major, free-text faculty.

**Profile**:
Scalar fields on `auth_user` (name, bio, Telephone, Student ID, Department) served by `/api/v1/profile`. Editable fields can be replaced but never cleared.
_Avoid_: Account, treating Profile as the whole of a Member's data.

**Work Experience**:
A chronological public record of a Member's work, internship, or tutoring roles managed via `/api/v1/profile/experience`.
_Avoid_: Experience history, treating Experience as a scalar Profile field.

**Portfolio Item**:
A project or achievement showcased on a Member's profile with optional images and description, managed via `/api/v1/profile/portfolio`.
_Avoid_: Experience, job.

**Certificate**:
A credential claimed by a Member (name, issuer, issue date, credential image) managed via `/api/v1/profile/certificates`.
_Avoid_: Badge, qualification, verifyUrl (superseded).

**Public Profile**:
The read-only view of another Member (`GET /api/v1/profile/:userId`), inlining Portfolio Items, Certificates, Work Experience, Reputation, and derived Profile Tags. No opt-out.
_Avoid_: Own Profile (different schema and permissions).

**Tag**:
A shared Quest skill label. A Member's profile Tags are derived automatically from their three most frequent Tags across successfully completed Quests.
_Avoid_: Profile skill, category, manually assigned skill.

**Red Flag**:
A temporary administrative mark on a Member's profile after an Admin confirms a misconduct violation, temporarily blocking the Member from publishing Quests, applying as a Candidate, or joining FCFS Quests. Expires automatically after 7 days.
_Avoid_: Ban, Suspension, Wallet Status.

**Member Ban**:
An administrative restriction blocking a Member from signing in, resulting from misconduct or review penalty ladders. Auto-freezes the Member's Wallet.
_Avoid_: Wallet Freeze alone.

---

### 3. Quest Structure, Modes & Lifecycle

**Quest**:
A bounded agreement for work created and funded by a Hirer.

**Selection Mode**:
The mechanism for admitting Workers:

- `FIRST_COME_FIRST_SERVED` (FCFS): Eligible Workers join directly in arrival order until headcount is reached.
- `CANDIDATE`: Candidates apply individually or in Candidate Teams; the Hirer selects the accepted roster.
  _Avoid_: `NO_CANDIDATE` (legacy implementation name).

**Participation**:
The headcount structure: `SINGLE` (headcount = 1) or `GROUP` (headcount > 1, up to 20).

**Headcount**:
The published number of Worker places requested and funded by the Hirer.

**dueAt**:
The mandatory deadline for required Worker actions (Asia/Bangkok time), set before publish and immutable once `QUEST_ASSIGNED`. The Server is the sole authority on timeliness.

**Quest Condition**:
The ordered set of requirements for a Quest. Must have at least one `Condition Item` (non-empty, &le;255 characters).

**Quest Edit**:
A proposed change to Quest Condition items submitted by the Hirer while the Quest is in `QUEST_ASSIGNED`. Requires unanimous acceptance by all Active Workers within **10 minutes**. Unanimous accept &rarr; `EDIT_REQUEST_APPLIED`; any decline or timeout &rarr; `EDIT_REQUEST_FAILED` (prior condition stays).

**Quest Lifecycle States**:
The canonical 7 states for a Quest:

1. `QUEST_DRAFT`: Hirer prepares details and conditions; not discoverable.
2. `QUEST_OPEN`: Published and funded in Quest Escrow; discoverable on Quest Board; accepts joins or Candidate proposals.
3. `QUEST_ASSIGNED`: Accepted roster is fixed; Work Conversation opens; Hirer may propose Quest Edits; required starters can press Start Work.
4. `QUEST_IN_PROGRESS`: Required Start Work actions completed; work is underway until `dueAt`.
5. `QUEST_COMPLETED`: Required work/proof approved; rewards settled to Workers; Platform Fee retained; terminal.
6. `QUEST_CANCELLED`: Quest cancelled before completion; funds refunded per cancellation policy; terminal.
7. `QUEST_FAILED`: Required start work, proof, or confirmation missing at `dueAt`, or proof marked `PROOF_NOT_APPROVED`; unpaid funds held for 7 days; terminal.

_Avoid_: `QUEST_AWAITING_CONSENT`, `QUEST_SUBMITTED`, `QUEST_APPROVED`, `QUEST_REWORK`, `QUEST_DISPUTED`, `QUEST_HIDDEN`, `UNFILLED`.

**Assignment**:
The canonical record of one Worker's accepted participation in a Quest (`ASSIGNMENT_ACTIVE`, `ASSIGNMENT_COMPLETED`, `ASSIGNMENT_INCOMPLETE`, `ASSIGNMENT_CANCELLED`).

**Start Work**:
The action performed by required starters between `startTime` and `dueAt` that moves the Quest from `QUEST_ASSIGNED` to `QUEST_IN_PROGRESS`.

- `SINGLE` (FCFS or Candidate): The Worker.
- `GROUP + FCFS`: Every Active Worker must start.
- `GROUP + CANDIDATE`: Team Leader starts for the team.

**Underfilled GROUP + FCFS Quest**:
An FCFS Group Quest that reaches `startTime` with fewer Active Workers than published headcount:

1. Hirer has 10 minutes to choose proceed or cancel.
2. If proceed, each joined Active Worker has 10 minutes to consent to the new split reward and `dueAt`.
3. Unanimous consent moves Quest to `QUEST_ASSIGNED`; any decline or timeout transitions to `QUEST_CANCELLED` with a full refund.

---

### 4. Proof Submission & Reviews

**Proof Submission**:
The record of completed work submitted before `dueAt` when `proofRequired=true`.

- Required submitter: Worker for `SINGLE` and `GROUP + FCFS`; Team Leader for `GROUP + CANDIDATE`.
- Attachments: 1 to 5 files (images, PDF, video &le;10 MB each) plus optional description (&le;1,000 characters). Locked on send.
- When `proofRequired=false`: Required submitter confirms completion before `dueAt` without file uploads.

**Proof Review Window**:
The 24-hour period after proof submission where the Hirer reviews the proof (`PROOF_PENDING`, `PROOF_APPROVED`, `PROOF_NOT_APPROVED`). If no decision is made within 24 hours, the Server records `PROOF_APPROVED` automatically.

**PROOF_NOT_APPROVED**:
A Hirer's decision to reject proof (requires reason &le;1,000 chars), which immediately makes the Quest `QUEST_FAILED`, the Assignment `ASSIGNMENT_INCOMPLETE`, and creates an immutable **Admin Review Item**. There is no Rework cycle.

**Review**:
A rating and optional comment between a Hirer and a Worker after ANY Terminal Quest State (`QUEST_COMPLETED`, `QUEST_FAILED`, `QUEST_CANCELLED`).

- Allowed at most once per pair per direction.
- Author may edit for 7 days after the Quest becomes terminal. Cannot be deleted.
- Contributes to Member Reputation.

---

### 5. Finance, Wallet & Escrow

**Integer Satang**:
The canonical unit for all financial calculations and balances (฿1.00 = 100 Satang). Max balance capacity is 2,000,000,000 Satang (฿20,000,000).

**Wallet**:
A Member's funds partitioned into 4 distinct compartments:

1. `Spending Balance`: Funds available to commit to Quests.
2. `Earnings Balance`: Funds earned from completed Quests; convertible or withdrawable.
3. `Funding Reserved (Quest Escrow)`: Spending balance locked for published Quests.
4. `Reserved for Payouts (Payout Reserve)`: Earnings balance locked for pending Payouts.

**Wallet Status**:
`ACTIVE`, `FROZEN` (administrative hold), `SUSPENDED` (policy hold), `CLOSED` (terminal).

**Quest Funding Total (`questFundingTotal`)**:
The inclusive amount the Hirer commits for one Worker slot, containing that slot's `Quest Reward` and `Platform Fee`.

**Platform Fee**:
The fee retained on successful Quest completion, calculated from net Quest Reward using active Money Policy (`ceil(Quest Reward × feeRate)` with rounding mode `UP`).

**Quest Escrow**:
The atomic lock of `questFundingTotal × headcount` from the Hirer's Spending Balance at publish.

**Top-up**:
An inbound PromptPay QR deposit crediting Spending Balance upon provider webhook confirmation (quotes valid for 5 minutes).

**Earnings Conversion**:
An instant, fee-free, and irreversible transfer from Earnings Balance to Spending Balance.

**Payout**:
An outbound transfer of Earnings Balance to a verified Thai Bank or PromptPay destination, requiring manual Admin Approval (`PENDING_ADMIN_APPROVAL`).

**Cancellation Settlement**:

- Cancel while `QUEST_OPEN`: 100% refund of Quest Escrow to Hirer.
- Cancel while `QUEST_ASSIGNED`: 20% of Worker Reward pool paid to Active Workers; 80% and Platform Fee refunded to Hirer.
- Cancel while `QUEST_IN_PROGRESS`: 100% Worker Rewards settled to Workers; Platform Fee retained; 0% refunded to Hirer.

**7-Day Failure Money Hold**:
On `QUEST_FAILED`, unpaid funds return to the Hirer but remain held in the Funding Reservation for **7 days** before releasing to Spending Balance, preserving funds for potential Dispute Case resolution.

---

### 6. Conversations & Work Chat

**Candidate Inquiry Conversation (`CONVERSATION_CANDIDATE_INQUIRY`)**:
A private, 1-on-1 Conversation between the Hirer and one Prospective Worker while the Quest is `QUEST_OPEN`. Disappears completely (`INQUIRY_CLOSED`) upon assignment, quest assignment, or cancellation. Prohibits KU bot System Messages.

**Work Conversation (`CONVERSATION_WORK`)**:
The single coordination Conversation for an assigned Quest, created upon first `ASSIGNMENT_ACTIVE`. Members include the Hirer and all Active Workers. Features KU bot System Messages, attachments (&le;10 MB, 15-minute temporary URLs), private Read Cursors, and rate limits (30 msg / 10 att per min). Becomes permanent read-only archive upon terminal states.

**System Message**:
An immutable workflow event message posted exclusively in Work Conversations by the KU bot.

---

### 7. Admin Operations & Dispute Cases

**Dispute Case**:
A case opened on a `QUEST_FAILED` Quest by the Hirer/Worker (within 1 day) or by an Admin (within 5 days) that can redirect funds from the 7-day held Funding Reservation to a Worker. Does not change `QUEST_FAILED` state.
_Avoid_: `QUEST_DISPUTED`.

**Admin Review Item**:
An automatic audit record created when proof is marked `PROOF_NOT_APPROVED`.

**Quest Hiding**:
An Admin flag (`hiddenAt`) removing a Quest from discovery without affecting active work, deadlines, or chat.
