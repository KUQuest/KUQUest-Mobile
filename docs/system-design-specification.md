# KUQuest Mobile — System Design Specification

> UI navigation and prototype evidence captured from the Android development build on 2026-08-29. Aligned with backend rulebooks on 2026-08-31.

## 1. Scope

This document records the mobile UI surfaces, navigation paths, user journeys, prototype states, and implementation boundaries for KUQuest Mobile. It describes the Expo/React Native mobile application grounded on the domain rules defined in `CONTEXT.md` and the mirrored backend rulebooks (`docs/rulebook/`, synced from `KUQuest-API-Server` at commit `1b55199d74d2e73a4a05a4662e49fb643cbee3e6`).

## 2. Platform and evidence

- Platform captured: Android emulator `medium_phone` (`emulator-5554`)
- Build: `com.kuquest.mobile.debug`
- Capture method: `adb exec-out screencap -p`
- Locale during capture: Thai with localized English Quest fixture content
- Theme captured: light
- Screenshots: [`docs/sds/screenshots/`](./sds/screenshots/)
- Development entry point: `bun run dev:android`
- Demo entry point: `เข้าแอปด้วย Demo data`

## 3. Primary navigation

Authenticated Members access five primary destinations through the bottom navigation:

| Label     | Route               | Purpose                                                                           | Aligned Specification                                                             |
| --------- | ------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Home      | `/(tabs)/index`     | Discover published `QUEST_OPEN` Quests using search, filters, and sort            | [`docs/specs/quest-state-summary.md`](specs/quest-state-summary.md)               |
| My Quests | `/(tabs)/my-quests` | Track joined/posted Quests, Assignments, and Quest Escrow funding                 | [`docs/specs/quest-state-summary.md`](specs/quest-state-summary.md)               |
| Create    | `/(tabs)/create`    | Create, configure conditions, and fund Quests with a three-step wizard            | [`docs/specs/group-quest-behavior.md`](specs/group-quest-behavior.md)             |
| Chat      | `/(tabs)/chat`      | List Candidate Inquiry and Work Conversations                                     | [`docs/specs/conversation-and-work-chat.md`](specs/conversation-and-work-chat.md) |
| Profile   | `/(tabs)/profile`   | View Public Profile, Reputation, Portfolio, Certificates, Experience, and Reviews | [`docs/specs/student-profile-redesign.md`](specs/student-profile-redesign.md)     |

Settings is reached from the Profile top bar via `/settings`.

## 4. User journeys

### 4.1 Start and authentication

1. Open the app at `/`.
2. Choose one of:
   - `Login ปกติ` — native Google sign-in path.
   - `Register / Academic Registration` — Academic Registration entry for new Members.
   - `เข้าแอปด้วย Demo data` — offline prototype scenario path.
3. Native sign-in requires a development build, not Expo Go.
4. Google accounts are restricted to the `@ku.th` domain.
5. A rejected non-KU account is cleared from native Google Sign-In before another account attempt.

Evidence: [`auth/developer-mode.png`](./sds/screenshots/auth/developer-mode.png)

### 4.2 Home / Quest discovery

1. Enter Home through the bottom navigation.
2. Search Quests in `ค้นหาเควสต์`.
3. Open `กรองโดย` to filter by category, tag, reward, deadline, start-time, and location.
4. Open `เรียงโดย` to change ordering.
5. Select a Quest card to open Quest Detail.
6. Select `สมัครเลย` or direct join from Quest Detail when the lifecycle allows it (`QUEST_OPEN`).

Evidence: [`home/quest-board.png`](./sds/screenshots/home/quest-board.png), [`quest-detail/move-boxes.png`](./sds/screenshots/quest-detail/move-boxes.png)

### 4.3 My Quests

1. Open My Quests.
2. Use the role selector to switch between:
   - Worker view: Quests joined/applied for.
   - Hirer view: Quests created, funded, and managed.
3. Use the status carousel to filter between active, assigned, history, draft, and completed states.
4. In Hirer view, the compact Quest Funding bar is visible above the Quest list.
5. Tap the funding bar to open the centered Funding details popup showing inclusive Quest Funding Total, net Worker Reward, and Platform Fee.

Evidence: [`my-quests/worker-pending.png`](./sds/screenshots/my-quests/worker-pending.png), [`my-quests/hirer-funding-bar.png`](./sds/screenshots/my-quests/hirer-funding-bar.png), [`my-quests/hirer-funding-details-popup.png`](./sds/screenshots/my-quests/hirer-funding-details-popup.png)

### 4.4 Wallet & PromptPay Top up

1. In Hirer My Quests or Wallet settings, open the funding/wallet view.
2. Review the 4 Wallet Compartments (Spending Balance, Earnings Balance, Funding Reserved, Reserved for Payouts).
3. Tap `เติมเงิน` to start PromptPay Top-up.
4. Enter a top-up amount (&ge;฿10.00) or select a quick amount.
5. Display PromptPay QR code (5-minute quote lifetime).
6. Webhook clears the top-up into the Member's Spending Balance.

Evidence: [`funding/topup-amount.png`](./sds/screenshots/funding/topup-amount.png), [`funding/topup-amount-100.png`](./sds/screenshots/funding/topup-amount-100.png), [`funding/topup-promptpay-qr.png`](./sds/screenshots/funding/topup-promptpay-qr.png)

### 4.5 Create Quest Wizard

1. Open Create.
2. Step 1 — Quest details: title, tag, description, ordered Condition Items, `dueAt` deadline, and proof requirement (`proofRequired`).
3. Step 2 — Participation & Selection Mode: `SINGLE`/`GROUP` and `FIRST_COME_FIRST_SERVED`/`CANDIDATE`. Set headcount and inclusive `questFundingTotal`.
4. Step 3 — Review: inspect the financial breakdown (net Reward, Platform Fee, total Escrow), save draft in SecureStore, or publish with atomic Escrow lock.
5. Back navigation preserves the draft and prompts for confirmation before leaving.

Evidence: [`create/create-quest-step-1-details.png`](./sds/screenshots/create/create-quest-step-1-details.png), [`create/create-quest-step-2-team.png`](./sds/screenshots/create/create-quest-step-2-team.png), [`create/create-quest-step-3-review.png`](./sds/screenshots/create/create-quest-step-3-review.png)

### 4.6 Chat & Conversations

1. Open Chat to view recent Conversations.
2. Two conversation categories:
   - **Candidate Inquiry Conversations**: 1-on-1 private Q&A during `QUEST_OPEN`.
   - **Work Conversations**: Coordination between Hirer and Active Workers for assigned Quests.
3. Select a conversation to read messages, inspect attachments, view Read Cursor updates, or send messages (&le;1,000 chars, attachments &le;10 MB, rate limits enforced).

Evidence: [`chat/chat-list.png`](./sds/screenshots/chat/chat-list.png), [`chat/chat-detail.png`](./sds/screenshots/chat/chat-detail.png)

### 4.7 Profile and Settings

1. Open Profile to view Public Profile, affiliation (Occupation, Faculty, Department), Rating, Quest count, Reviews, Experience, Portfolio Work, and Certificates.
2. Switch between About, Experience, Works, Certificates, and Reviews tabs.
3. Tap the Settings icon in the Profile top bar to access Edit Profile, Wallet & Payout destination, Switch Account, developer options, notifications, and terms.

Evidence: [`profile/profile-about.png`](./sds/screenshots/profile/profile-about.png), [`settings/settings.png`](./sds/screenshots/settings/settings.png)

## 5. Aligned Domain & Specification References

| Concern                                      | Aligned Reference                                                                 |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| Domain Glossary                              | [`CONTEXT.md`](../CONTEXT.md)                                                     |
| Quest States & Lifecycle                     | [`docs/specs/quest-state-summary.md`](specs/quest-state-summary.md)               |
| Group & Candidate Matrix                     | [`docs/specs/group-quest-behavior.md`](specs/group-quest-behavior.md)             |
| Wallet & Payments Contract                   | [`docs/specs/wallet-and-payments.md`](specs/wallet-and-payments.md)               |
| Conversations & Work Chat                    | [`docs/specs/conversation-and-work-chat.md`](specs/conversation-and-work-chat.md) |
| Proof Submissions & Reviews                  | [`docs/specs/proof-and-rating-reviews.md`](specs/proof-and-rating-reviews.md)     |
| Profile & Academic Registration              | [`docs/specs/student-profile-redesign.md`](specs/student-profile-redesign.md)     |
| Mirrored Backend Rulebooks (Source of Truth) | [`docs/rulebook/`](rulebook/README.md) (commit `1b55199`)                         |
