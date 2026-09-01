# Mobile Agent Routing Directory

Deterministic routing table for agents to navigate directly to mobile specifications, mirrored backend rulebooks, architecture decision records (ADRs), and UI system design documentation before planning or coding.

---

## 1. Quick Route by Feature & Domain Area

| Feature / Topic                            | Primary Mobile Specification                                                   | Mirrored Backend Rulebook                                                                  | Mobile Architecture Decision                                                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Domain Glossary & Terms**                | [`CONTEXT.md`](../../CONTEXT.md)                                               | [`domain-boundaries.md`](../rulebook/domain-boundaries.md)                                 | —                                                                                                                                           |
| **Native Google Auth & Sign-in**           | [`system-design-specification.md`](../system-design-specification.md) §4.1     | —                                                                                          | [ADR 0004](../adr/0004-native-google-oauth-with-better-auth.md)                                                                             |
| **Academic Registration (First-run)**      | [`system-design-specification.md`](../system-design-specification.md) §4.1     | —                                                                                          | —                                                                                                                                           |
| **Student Profile & Header Tabs**          | [`student-profile-redesign.md`](../specs/student-profile-redesign.md)          | —                                                                                          | [ADR 0008](../adr/0008-public-student-profile-reputation.md)                                                                                |
| **Profile Editing & Experience**           | [`student-profile-editing-api.md`](../specs/student-profile-editing-api.md)    | —                                                                                          | —                                                                                                                                           |
| **Quest Board Discovery & Cards**          | [`quest-state-summary.md`](../specs/quest-state-summary.md) §1                 | —                                                                                          | [ADR 0001](../adr/0001-compact-horizontal-quest-card-density.md), [ADR 0009](../adr/0009-quest-board-discovery-and-application-boundary.md) |
| **Create Quest Wizard (3-Step)**           | [`group-quest-behavior.md`](../specs/group-quest-behavior.md)                  | [`quest-lifecycle-contract.md`](../rulebook/quest/quest-lifecycle-contract.md)             | [ADR 0002](../adr/0002-three-step-quest-creation-wizard.md)                                                                                 |
| **2×2 Mode Matrix (FCFS / Candidate)**     | [`group-quest-behavior.md`](../specs/group-quest-behavior.md) §2               | [`quest-mode-matrix-contract.md`](../rulebook/quest/quest-mode-matrix-contract.md)         | [ADR 0010](../adr/0010-canonical-quest-adapter-candidate-proposals-and-partial-start-consent.md)                                            |
| **Candidate Teams & Join Code**            | [`group-quest-behavior.md`](../specs/group-quest-behavior.md) §2.4             | [`quest-lifecycle-contract.md`](../rulebook/quest/quest-lifecycle-contract.md)             | —                                                                                                                                           |
| **Underfilled FCFS Consent Gate**          | [`group-quest-behavior.md`](../specs/group-quest-behavior.md) §2.3             | [`quest-lifecycle-contract.md`](../rulebook/quest/quest-lifecycle-contract.md)             | —                                                                                                                                           |
| **Start Work Protocol**                    | [`quest-state-summary.md`](../specs/quest-state-summary.md) §4.1               | [`quest-lifecycle-contract.md`](../rulebook/quest/quest-lifecycle-contract.md)             | —                                                                                                                                           |
| **Quest Conditions & 10m Edits**           | [`quest-state-summary.md`](../specs/quest-state-summary.md) §4.3               | [`quest-condition-contract.md`](../rulebook/quest/quest-condition-contract.md)             | —                                                                                                                                           |
| **Proof Submission (1–5 files)**           | [`proof-and-rating-reviews.md`](../specs/proof-and-rating-reviews.md) §1       | [`proof-submission-contract.md`](../rulebook/quest/proof-submission-contract.md)           | —                                                                                                                                           |
| **Hirer Proof Review & 24h Auto-Approval** | [`proof-and-rating-reviews.md`](../specs/proof-and-rating-reviews.md) §1.3     | [`proof-submission-contract.md`](../rulebook/quest/proof-submission-contract.md)           | —                                                                                                                                           |
| **Candidate Inquiry (1-on-1 Chat)**        | [`conversation-and-work-chat.md`](../specs/conversation-and-work-chat.md) §2   | [`conversation-contract.md`](../rulebook/quest/conversation-contract.md)                   | —                                                                                                                                           |
| **Work Conversation (Coordination)**       | [`conversation-and-work-chat.md`](../specs/conversation-and-work-chat.md) §3   | [`conversation-contract.md`](../rulebook/quest/conversation-contract.md)                   | —                                                                                                                                           |
| **Chat Attachments & Rate Limits**         | [`conversation-and-work-chat.md`](../specs/conversation-and-work-chat.md) §3.2 | [`conversation-contract.md`](../rulebook/quest/conversation-contract.md)                   | —                                                                                                                                           |
| **Wallet 4 Compartments & Satang**         | [`wallet-and-payments.md`](../specs/wallet-and-payments.md) §1                 | [`wallet-compartment-contract.md`](../rulebook/finance/wallet-compartment-contract.md)     | —                                                                                                                                           |
| **Inclusive Quest Funding & Escrow**       | [`wallet-and-payments.md`](../specs/wallet-and-payments.md) §2                 | [`reward-money-contract.md`](../rulebook/quest/reward-money-contract.md)                   | —                                                                                                                                           |
| **PromptPay QR Top-up**                    | [`wallet-and-payments.md`](../specs/wallet-and-payments.md) §3.1               | [`topup-and-conversion-contract.md`](../rulebook/finance/topup-and-conversion-contract.md) | —                                                                                                                                           |
| **Earnings Conversion (Instant)**          | [`wallet-and-payments.md`](../specs/wallet-and-payments.md) §3.2               | [`topup-and-conversion-contract.md`](../rulebook/finance/topup-and-conversion-contract.md) | —                                                                                                                                           |
| **Payout Requests & Destinations**         | [`wallet-and-payments.md`](../specs/wallet-and-payments.md) §3.3               | [`payout-contract.md`](../rulebook/finance/payout-contract.md)                             | —                                                                                                                                           |
| **Cancellation & Tiered Guardrail**        | [`group-quest-behavior.md`](../specs/group-quest-behavior.md) §4               | [`quest-lifecycle-contract.md`](../rulebook/quest/quest-lifecycle-contract.md)             | [ADR 0003](../adr/0003-tiered-cancellation-guardrail.md)                                                                                    |
| **Failure 7-Day Money Hold**               | [`wallet-and-payments.md`](../specs/wallet-and-payments.md) §5                 | [`admin-dispute-case-contract.md`](../rulebook/admin/admin-dispute-case-contract.md)       | —                                                                                                                                           |
| **Post-Terminal Rating Reviews**           | [`proof-and-rating-reviews.md`](../specs/proof-and-rating-reviews.md) §2       | [`rating-review-contract.md`](../rulebook/quest/rating-review-contract.md)                 | —                                                                                                                                           |
| **Primary Navigation & Shell**             | [`system-design-specification.md`](../system-design-specification.md) §3       | —                                                                                          | [ADR 0007](../adr/0007-authenticated-primary-navigation.md)                                                                                 |

---

## 2. Route by Actor & Quest Lifecycle

### Hirer

- `QUEST_DRAFT`: Create Quest wizard, set conditions & `dueAt`, fund inclusive `questFundingTotal` via Quest Escrow ([`group-quest-behavior.md`](../specs/group-quest-behavior.md)).
- `QUEST_OPEN`: Answer 1-on-1 Candidate Inquiries ([`conversation-and-work-chat.md`](../specs/conversation-and-work-chat.md)), review and select Candidate / Candidate Team ([`group-quest-behavior.md`](../specs/group-quest-behavior.md)), or cancel with 100% refund.
- `QUEST_ASSIGNED`: Submit Condition edits (10m consensus gate) ([`quest-state-summary.md`](../specs/quest-state-summary.md)), coordinate in Work Conversation.
- `QUEST_IN_PROGRESS`: Coordinate in Work Conversation, review submitted proofs within 24h ([`proof-and-rating-reviews.md`](../specs/proof-and-rating-reviews.md)).
- `QUEST_COMPLETED` / `QUEST_FAILED` / `QUEST_CANCELLED`: Submit reciprocal Rating Review within 7 days ([`proof-and-rating-reviews.md`](../specs/proof-and-rating-reviews.md)).

### Prospective Worker / Candidate

- `QUEST_OPEN`: Ask clarifying questions in private Candidate Inquiry ([`conversation-and-work-chat.md`](../specs/conversation-and-work-chat.md)), join directly (FCFS), apply as Candidate, or join a Candidate Team using a Join Code ([`group-quest-behavior.md`](../specs/group-quest-behavior.md)).

### Worker

- `QUEST_ASSIGNED`: Press Start Work between `startTime` and `dueAt` ([`quest-state-summary.md`](../specs/quest-state-summary.md)), vote on Quest Condition edits within 10 minutes ([`quest-state-summary.md`](../specs/quest-state-summary.md)), participate in Work Conversation.
- `QUEST_IN_PROGRESS`: Perform work, save drafts, and submit proof (1–5 files) before `dueAt` ([`proof-and-rating-reviews.md`](../specs/proof-and-rating-reviews.md)).
- `QUEST_COMPLETED` / `QUEST_FAILED` / `QUEST_CANCELLED`: Submit reciprocal Rating Review within 7 days ([`proof-and-rating-reviews.md`](../specs/proof-and-rating-reviews.md)).

---

## 3. Precedence Hierarchy

1. **`CONTEXT.md`**: Ubiquitous language definition. Always authoritative for domain terminology.
2. **Mirrored Backend Rulebooks** (`docs/rulebook/`, synced from API Server at commit `fc47a08`): Authoritative for target business rules, state transitions, and finance.
3. **Mobile Specifications** (`docs/specs/`): Authoritative for mobile-specific behaviors, UI flows, and screen contracts.
4. **Architecture Decisions** (`docs/adr/`): Authoritative for mobile technical architecture decisions.
5. **System Design Specification** (`docs/system-design-specification.md`): Authoritative for UI navigation, journeys, and captured prototype layouts.
