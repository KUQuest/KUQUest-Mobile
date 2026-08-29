# KUQuest Mobile — System Design Specification

> UI navigation and prototype evidence captured from the Android development build on 2026-08-29.

## 1. Scope

This document records the current mobile UI surfaces, navigation paths, user journeys, prototype states, and known implementation boundaries. It describes the current Expo/React Native prototype; it is not a payment or production API contract.

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

Authenticated users access five destinations through the bottom navigation:

| Label | Route | Purpose |
|---|---|---|
| Home | `/(tabs)/index` | Discover published Quests using search, filters, and sort |
| My Quests | `/(tabs)/my-quests` | Track joined/posted Quests and Hirer funding |
| Create | `/(tabs)/create` | Create or edit a Quest with a three-step wizard |
| Chat | `/(tabs)/chat` | List Quest conversations |
| Profile | `/(tabs)/profile` | View public profile, reputation, work, and reviews |

Settings is reached from the Profile top bar and uses `/settings`.

## 4. User journeys

### 4.1 Start and authentication

1. Open the app at `/`.
2. Choose one of:
   - `Login ปกติ` — native Google sign-in path.
   - `Register / Onboarding` — registration/onboarding entry.
   - `เข้าแอปด้วย Demo data` — offline prototype path.
3. Native sign-in requires a development build, not Expo Go.
4. Google accounts are restricted to the `@ku.th` domain.
5. A rejected non-KU account is cleared from native Google Sign-In before another account attempt.

Evidence: [`auth/developer-mode.png`](./sds/screenshots/auth/developer-mode.png)

### 4.2 Home / Quest discovery

1. Enter Home through the bottom navigation.
2. Search Quests in `ค้นหาเควสต์`.
3. Open `กรองโดย` to edit category, tag, reward, deadline, start-time, and location filters.
4. Open `เรียงโดย` to change ordering.
5. Select a Quest card to open Quest Detail.
6. Select `สมัครเลย` from Quest Detail when the lifecycle allows it.

Evidence: [`home/quest-board.png`](./sds/screenshots/home/quest-board.png), [`quest-detail/move-boxes.png`](./sds/screenshots/quest-detail/move-boxes.png)

### 4.3 My Quests

1. Open My Quests.
2. Use the role selector to switch between:
   - Worker view: Quests joined/applied for.
   - Hirer view: Quests posted and managed.
3. Use the status carousel to move between pending, accepted, history, active, draft, and completed states.
4. In Hirer view, the compact Quest Funding bar is visible above the Quest list.
5. Tap the funding bar to open the centered Funding details popup.

Evidence: [`my-quests/worker-pending.png`](./sds/screenshots/my-quests/worker-pending.png), [`my-quests/hirer-funding-bar.png`](./sds/screenshots/my-quests/hirer-funding-bar.png), [`my-quests/hirer-funding-details-popup.png`](./sds/screenshots/my-quests/hirer-funding-details-popup.png)

### 4.4 Quest Funding and PromptPay Top up

1. In Hirer My Quests, tap the compact funding bar.
2. Review reserved Worker-place funding, settlement, refund, and payment-service status.
3. Tap `เติมเงิน`.
4. Enter a top-up amount or choose a quick amount.
5. Continue to the PromptPay QR screen.
6. The current QR is a prototype image and cannot be scanned; no real payment or balance mutation occurs.
7. Close the flow or use Android Back to return.
8. `โอนเงิน` remains disabled until the payment service exists.

Evidence: [`funding/topup-amount.png`](./sds/screenshots/funding/topup-amount.png), [`funding/topup-amount-100.png`](./sds/screenshots/funding/topup-amount-100.png), [`funding/topup-promptpay-qr.png`](./sds/screenshots/funding/topup-promptpay-qr.png)

### 4.5 Create Quest

1. Open Create.
2. Step 1 — Quest details: title, tag, description, completion criteria, and evidence.
3. Step 2 — Team setup: participation and candidate/direct-join mode.
4. Step 3 — Review: inspect the summary, save a draft, or publish.
5. Back navigation preserves the draft and asks for confirmation before leaving.

Evidence: [`create/create-quest-step-1-details.png`](./sds/screenshots/create/create-quest-step-1-details.png), [`create/create-quest-step-2-team.png`](./sds/screenshots/create/create-quest-step-2-team.png), [`create/create-quest-step-3-review.png`](./sds/screenshots/create/create-quest-step-3-review.png)

### 4.6 Chat

1. Open Chat to see recent Quest conversations.
2. Use conversation search.
3. Select a conversation.
4. Read messages, search, view files, open Quest Detail, attach a file, or compose a message according to conversation capability.

Evidence: [`chat/chat-list.png`](./sds/screenshots/chat/chat-list.png), [`chat/chat-detail.png`](./sds/screenshots/chat/chat-detail.png)

### 4.7 Profile and Settings

1. Open Profile to view profile identity, affiliation, Quest categories, rating, Quest count, reviews, and profile sections.
2. Switch between About, Work, and Reviews tabs.
3. Tap the Settings icon in the Profile top bar.
4. Settings provides Edit Profile, Switch Account, developer options, Quest notifications, language, appearance, help, terms, and privacy.

Evidence: [`profile/profile-about.png`](./sds/screenshots/profile/profile-about.png), [`settings/settings.png`](./sds/screenshots/settings/settings.png)

## 5. Prototype and state boundaries

- Quest data currently uses the Canonical Quest Adapter and deterministic fixtures.
- Demo data is session/prototype data, not a production data source.
- Google authentication is native-only in the development build.
- Quest Funding currently exposes an honest unavailable/payment-service prototype state.
- PromptPay QR is illustrative and intentionally non-scannable.
- Top up does not call a provider, charge an account, or change a balance.
- Transfer is unavailable until a payment contract and backend are implemented.
- The current capture set represents the primary happy paths and key prototype surfaces; loading, error, empty, filter-sheet, onboarding, and edit-profile variants remain additional state captures for a later QA pass.

## 6. Source map

| Concern | Source |
|---|---|
| App routes | `src/app/` |
| Auth | `src/features/auth/` |
| Home discovery | `src/features/questBoard/QuestBoardScreen.tsx` |
| Quest Detail | `src/features/questBoard/QuestDetailScreen.tsx` |
| My Quests | `src/features/myQuests/MyQuestsScreen.tsx` |
| Funding UI | `src/components/ui/QuestFundingSummary.tsx` |
| Create Quest | `src/features/createQuest/CreateQuestScreen.tsx` |
| Chat | `src/features/chat/` |
| Profile | `src/features/profile/ProfileScreen.tsx` |
| Settings | `src/features/settings/SettingsScreen.tsx` |
| Localization | `src/locales/` |
| Domain glossary | `CONTEXT.md` |
| Architecture decisions | `docs/adr/` |

## 7. Validation record

At capture time, the implementation had passed:

- `bun run typecheck`
- `bun run lint`
- Full Jest suite: 50 suites / 337 tests
- Android emulator manual navigation for the captured paths
