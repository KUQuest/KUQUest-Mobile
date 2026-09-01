# Conversation and Work Chat Specification

Type: Specification Reference
Domain: Chat Conversations, Candidate Inquiries, Work Coordination, Attachments
Authority: Aligned with the mirrored backend Conversation Contract (`docs/rulebook/quest/conversation-contract.md` and `quest-work-chat-rulebook.md`, synced from `KUQuest-API-Server` at commit `fc47a089f5ae4d40914ac771baef9f2e7a0bef63`).

---

## 1. Overview of Conversation Types

KUQuest supports two strictly separated conversation types:

| Attribute                  | Candidate Inquiry Conversation                                                      | Work Conversation                                           |
| -------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Database `type`**        | `CONVERSATION_CANDIDATE_INQUIRY`                                                    | `CONVERSATION_WORK`                                         |
| **Purpose**                | Pre-assignment Q&A: Prospective Workers clarify details before applying or joining. | Active coordination between Hirer and assigned Workers.     |
| **Multiplicity**           | Many per Quest (at most 1 per Prospective Worker).                                  | Exactly 1 per Quest.                                        |
| **Participants**           | Strictly 2: Hirer + 1 Prospective Worker.                                           | Hirer + all current Active Workers.                         |
| **Active Quest State**     | Exclusively during `QUEST_OPEN`.                                                    | From first `ASSIGNMENT_ACTIVE` through terminal states.     |
| **Lifecycle End**          | `INQUIRY_CLOSED` &rarr; Disappears completely from Member views.                    | Terminal states &rarr; Becomes permanent read-only archive. |
| **History Transfer**       | **Never transferred** or copied to Work Conversation.                               | Preserved in place for Accepted Participants.               |
| **KU bot System Messages** | **Prohibited** (Human-to-human messages only).                                      | **Enabled** (Official workflow event messages).             |
| **Push Notifications**     | Notifies only the single other participant.                                         | Notifies all other Accepted Participants.                   |
| **Moderation**             | Report abusive messages &rarr; opens Report Case.                                   | Report abusive messages &rarr; opens Report Case.           |

---

## 2. Candidate Inquiry Conversation

### 2.1 Opening and Access

- Any authenticated Member who can view an open Quest (`QUEST_OPEN`) can start **one Candidate Inquiry Conversation** with that Quest's Hirer.
- Available across all selection modes (`FIRST_COME_FIRST_SERVED` and `CANDIDATE`) and participation shapes (`SINGLE` and `GROUP`).
- Opening an inquiry does not create an Assignment, change Quest State, or grant Accepted Participant status.
- Strictly 2 participants: Hirer and Prospective Worker. Completely invisible to other Members and Candidates.

### 2.2 Closing and Disappearance

- Begins as `INQUIRY_OPEN`.
- **Closing Triggers**:
  1. Prospective Worker receives `ASSIGNMENT_ACTIVE` (closes atomically in the same transaction).
  2. Quest transitions to `QUEST_ASSIGNED` (closes all remaining inquiries for that Quest).
  3. Quest transitions to `QUEST_CANCELLED` while open (closes all remaining inquiries).
- **Disappearance**: Setting `INQUIRY_CLOSED` causes the conversation to **disappear completely** from user inboxes and Quest detail screens.
- Closed inquiry messages are **never** migrated or copied into the Work Conversation.

---

## 3. Work Conversation

### 3.1 Opening and Membership

- Created automatically when the first Worker receives `ASSIGNMENT_ACTIVE`.
- Members: The Hirer and all current Active Workers. Candidates and Prospective Workers never join.
- Newly added Workers can read retained history from the beginning of the Work Conversation.
- A Departed Worker (e.g. through cancellation) retains read-only access to messages created up to their departure.
- When a Quest reaches a terminal state (`QUEST_COMPLETED`, `QUEST_CANCELLED`, `QUEST_FAILED`), the conversation becomes **read-only** for Members, but remains permanently visible in chat history.

### 3.2 Messages & Attachments

- **Message Text**: Optional when an attachment is present; maximum 1,000 characters.
- **Attachments**: Images, PDF, or video files up to 10 MB each.
- **Temporary URLs**: Attachment downloads use temporary signed URLs valid for **15 minutes**.
- **Immutability**: Sent messages cannot be edited, deleted, reacted to, or replied to.
- **Ordering**: Server acceptance timestamp defines message order. The mobile UI loads the 50 newest messages first.
- **Read Cursor**: Private per Member. Opening the conversation advances the Member's Read Cursor; unread counts are strictly private.

### 3.3 Rate Limits

Enforced per Member per Quest:

- Maximum **30 Chat Messages** per minute.
- Maximum **10 Chat Attachments** per minute.
- When limited, the UI displays the remaining cooldown time and preserves the draft content.

### 3.4 KU Bot System Messages

KU bot posts immutable workflow event messages exclusively in Work Conversations:

- Assignment creation and roster finalization.
- Quest Edit proposals, voting countdowns, and outcomes.
- Start Work alerts.
- Proof submission events and 24-hour review countdowns.
- Quest completion / failure / cancellation outcomes with Rating Review action links.

---

## 4. Trust & Safety Moderation

- Members can report offensive or abusive messages in either conversation type.
- Reporting a message creates a **Report Case** (`REPORT_CASE_PENDING`) in the Admin review queue.
- Admin views reported messages strictly through **Evidence References**; Admins have no general browse access to private chats.
