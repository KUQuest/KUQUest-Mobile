# KUQuest Mobile Repository Context

This document is the implementation map and safe-debug contract for agents working in this repository. Read it before editing source, tests, routes, fixtures, API boundaries, or project files. It complements the domain glossary in `CONTEXT.md`; the mirrored rulebooks remain the business source of truth.

## Read order and authority

Use this order before a domain or UI change:

1. `CONTEXT.md` — canonical ubiquitous language and domain meanings.
2. `docs/rulebook/README.md` and the relevant contract under `docs/rulebook/` — target backend behavior, lifecycle, money, conversation, proof, notification, image, and Admin rules.
3. `docs/agents/routing.md` — deterministic route to the matching specification, rulebook contract, and ADR.
4. `docs/specs/` — mobile behavior and UI contracts.
5. `docs/adr/` and `docs/system-design-specification.md` — architectural and navigation decisions.
6. `DESIGN.md` and `docs/agents/ui-design-rules.md` — visual identity plus platform UI/accessibility behavior.
7. The owning source module and its adjacent `__tests__/` files — current implementation evidence.

Precedence when sources disagree:

`CONTEXT.md` terminology → mirrored backend rulebook target behavior → mobile specifications → ADRs → system-design UI evidence → current implementation and fixtures.

Current code can intentionally lag the rulebook. Treat that as an implementation gap to diagnose, not as permission to delete tests, fixtures, or compatibility values.

For UI work, `docs/agents/ui-design-rules.md` governs platform behavior,
accessibility, adaptive layout, navigation, forms, and native proof; `DESIGN.md`
governs the visual system. Current code is evidence of implementation, not a
reason to weaken either contract.

## Repository boundaries

### Product and project configuration

- `package.json` — Bun scripts, Expo SDK 57 dependencies, Jest configuration.
- `app.json`, `app.config.ts`, `eas.json` — Expo/native configuration and build profiles.
- `README.md` — staging environment, development-build setup, and verification commands.
- `CODE_STYLES.md` — review standards, feature boundaries, NativeWind, and test conventions.
- `DESIGN.md` — KUQuest visual identity, tokens, typography, and component appearance.
- `docs/agents/ui-design-rules.md` — platform UI behavior, accessibility, adaptive layout, navigation, forms, sheets, and native proof.
- `docs/agents/nativewind.md` — NativeWind/Tailwind styling: token naming, dark mode, role accent, and v5-vs-v4 traps.
- `AGENTS.md` / `CLAUDE.md` — agent operating rules and pointers.
- `android/` — native/generated Android build project. Change it only for an explicit native Android task; do not use generated build output as application source.
- `.expo/`, `node_modules/`, build outputs, and caches are generated state. They are not source-of-truth files.

### App version and updates

`expo.version` in `app.json` stays `1.0.0` for a long time and says nothing about a build. Android installs a build as an update only when its `versionCode` is higher than the installed one (same package ID and signing key), so every CI build carries a higher `versionCode` than the one before it, and that number is what makes each build update the last.

- `staging` and `uat` take `versionCode` from `github.run_number` of their own workflow (`android-staging.yml`, `android-uat.yml`). The number only grows. It is visible in the APK name (`KUQuest-Staging-v1.0.0-build.<versionCode>-<sha>.apk`) and in the Build row of the download page.
- Keep those workflow file names. A new workflow file restarts `run_number` at 1, and Android then rejects the new builds as downgrades (`INSTALL_FAILED_VERSION_DOWNGRADE`) until the number passes the installed one.
- Leave `expo.version` and `expo.android.versionCode` in `app.json` alone for builds; raise `expo.version` only when the user names a release version.

### Mobile route layer

`src/app/` is the Expo Router entry layer. Route files should compose the owning feature and navigation shell; domain rules do not belong only in a route component.

- `src/app/_layout.tsx` — fonts, splash, safe-area provider, store hydration, status bar, and root stack.
- `src/app/index.tsx` — root/auth entry.
- `src/app/(tabs)/_layout.tsx` — authenticated tab shell.
- `src/app/(tabs)/index.tsx` — Quest Board.
- `src/app/(tabs)/my-quests.tsx` — Work Management: Hirer My Quests or Worker Work Management by Role Workspace.
- `src/app/(tabs)/create.tsx` — Create Quest wizard.
- `src/app/(tabs)/chat.tsx` and `src/app/(tabs)/chat/[id].tsx` — Chat inbox and conversation.
- `src/app/(tabs)/profile.tsx` — Student Profile.
- `src/app/quest/[id].tsx` — Quest Detail.
- `src/app/quest/[id]/manage.tsx` — Hirer quest management (cancel, chat, proof review, candidate/team selection fallback). Reached from My Quests (`MyQuestsScreen.openManageQuest`) and live Home Active Quest cards.
- `src/app/quest/[id]/select-roster.tsx` — Hirer Quest roster: assigned Workers with profile access for every mode, plus Candidate/Candidate Team select and reject for a CANDIDATE-mode quest. Reached from Home's Worker banners and applicant items in Needs your attention.
- `src/app/quest/[id]/work.tsx` — Worker Work Hub: one page per Quest for status, inline proof submission, completion, edit responses, conditions, and chat.
- `src/app/quest/[id]/proof-review.tsx` — Hirer proof review list: one row per Assignment (or the selected Candidate Team for `GROUP + CANDIDATE`), `PROOF_PENDING` first; each pending Proof Submission opens the review Popup. Reached from Home and from Quest management.
- `src/app/quest/[id]/inquiry/[conversationId].tsx` — Candidate Inquiry conversation detail.
- `src/app/quest/[id]/team.tsx` — Worker Quest Team screen for a `GROUP + CANDIDATE` Quest: create, join by Join Code, rename, roster, leave/remove, proposal, and submit. Reached from the Quest Detail team card; reads the same live snapshot as Quest Detail, so Quest and Candidate roster WebSocket invalidations refresh it.
- Quest Board implementation: `src/features/questBoard/board/QuestBoardScreen.tsx`.
- `src/app/profile/edit/index.tsx` and `src/app/profile/edit/[section].tsx` — Profile editing.
- `src/app/settings.tsx` — Settings.
- `src/app/notifications.tsx` — Member Notification inbox (penalty Events, ADR 0035). Reached from the bell in `ProfileTopBar` (unread badge) and from penalty Push taps.
- `src/app/report.tsx` — Report flow.

The route tree currently has no dedicated route file for Sent Work, Wallet/Conversion/Payout, Rating Review action, or Admin operations. Verify code and fixtures before claiming one exists; the QA checklist records unverified surfaces as explicit gaps.

### Feature layer

`src/features/` owns vertical slices. Keep feature-local components, types, styles, adapters, and tests together.

- `src/features/*/api/` — per-feature TanStack Query key factories and hooks; `src/features/wallet/api/walletQueries.ts` is the canonical example.
- `src/features/questBoard/domain/` — pure Quest types, capability rules, and proof ownership with no I/O.
- `auth/` — Better Auth session, SecureStore, native Google Sign-In, auth gate, login, routing destination.
- `onboarding/` — Academic Registration validation, steps, persistence coordinator, inputs/selects/checkbox/file-size modal.
- `questBoard/` — Quest Board, Quest Detail, live Quest service and snapshot projections, proof/team/candidate/partial-consent sheets.
- `myQuests/` — Hirer My Quests projections, status views, funding summary integration, and the shared Worker snapshot query used by `workerWork/`.
- `createQuest/` — the three-step Quest draft, publish, and server-edit flow.
  `domain/` owns draft rules; `api/` owns queries and Quest V2 DTO adapters;
  `presentation/` owns view mapping and localized validation; `workflow/` owns
  screen and wizard orchestration; `draft/`, `publish/`, and `edit/` own their
  respective lifecycles; `components/teamSetup/` owns setup and logistics UI.
- `chat/` — Conversation inbox, Work Conversation, messages, attachments, read state, loading states.
- `profile/` — Student Profile, public data adapters, demo data, tabs, reputation and profile components.
- `profileEdit/` — editable basics, Experience, Portfolio, Certificates, validation and save behavior.
- `settings/` — account/settings/help/preferences surface.
- `report/` — Report form, categories, validation and submit state.
- `home/` — Hirer Workspace Home, including its loading state and Quest carousel. `api/homeQueries.ts` derives attention from all active Quests while the carousel stays capped at five.
- `workerHome/` — Worker Workspace Home screen with real assignment and board endpoints, quick stats, and available quests feed.
- `workerWork/` — Worker Work Management (the `my-quests` tab in the Worker workspace), which triages live Assignment snapshots into active/history and opens each Quest's Work Hub, plus the inline `WorkerProofForm` rendered by the Work Hub.
- `wallet/` — Money tab (`WalletScreen`: balances, transaction history, Earnings transfer), Top-up quote and payment flow, `walletModule.ts` Top-up and Earnings Conversion rules. No in-app Payout surface exists (the Quest Board wallet overview and its Payout modal were removed); `WalletApi` still exposes the payout transport.
- `preferences/` — locale preference store (`localeStore.ts`); owns the persisted `kuquest_user_locale` value.
- `workspace/` — Hirer/Worker role workspace store (`roleWorkspaceStore.ts`); owns the persisted `kuquest_active_workspace` value.
- `navigation/` — navigation chrome UI store (`navigationUiStore.ts`); owns bottom-nav compactness, profile top-bar visibility, and scroll accumulation. Scroll owners: `home/`, `questBoard/`, `chat/`, `profile/`, `workerHome/`, `workerWork/`, and `myQuests/screens/`.
- `notifications/` — foreground in-app notice banner (`NotificationBannerHost`) and root-mounted `useNotificationCoordinator`: Hirer-owned Quest stream events (including `UNDERFILLED_DECISION_PENDING` with server `expiresAt`), chat unread increases, Worker Candidate application decisions, and Worker underfilled-start transitions (Hirer deciding, response required, assigned, cancelled with the server `cancellationReason`), all polled from the shared `GET /api/v2/assignments/mine` `underfilled` summary. Countdowns use the server `expiresAt` through `src/features/questBoard/shared/useServerCountdown.ts`.
- `notifications/inbox/` — Member Notification inbox: `notificationQueries.ts` (cursor list, unread count, mark read) and `memberNotificationCopy.ts`, the app-written Thai/English copy shared by inbox rows and penalty Push alerts. An unknown `type` renders as a generic row. Quest lifecycle rows (the eight Quest push types) reuse `pushMessages.ts` copy and open `/quest/[id]` (`UNDERFILLED_CONSENT_PENDING` → `/quest/[id]/partial-start`). The inbox filters by category (`PENALTY`, `QUEST`, `DISPUTE`) and an Unread toggle; chip counts come from `unread-count.byCategory`. Dispute rows (`DISPUTE_CASE_FILED_AGAINST_YOU`, `DISPUTE_CASE_DECIDED`, on staging since 2026-10-31): the first opens `DisputeRespondSheet` (`questBoard/dispute/`), the only place a respondent gets `disputeCaseId` because no Quest read returns a case the Member did not file; the second opens `/quest/[id]` with the server's `viewerWon` verdict and no amount.
- `notifications/push/` — Android-only FCM data-only push. `PushNotificationHost` (root-mounted) registers the device via `POST /api/v1/push/devices` while signed in (`AuthService.signOut` deletes it first) and routes taps (`UNDERFILLED_CONSENT_PENDING` → `/quest/[id]/partial-start`, Member penalty types → `/notifications`, others → `/quest/[id]`). `pushTask.ts` defines the `expo-task-manager` task at module scope; it presents a localized local notification only when the app is not active and dedupes by `transitionId` (Member penalty Push by `eventKey`, recorded before the alert). Needs a development build with `google-services.json` (`GOOGLE_SERVICES_JSON` env path in `app.config.ts`, which also sets `extra.pushEnabled`); a build without it does not register a device or ask for notification permission, and only foreground notices run. Expo Go is not evidence.

### Shared and transport layer

- `src/api/` — `ApiClient`, request/error boundary, Zod/API contracts, `StudentApi`, `ProfileApi`. Network behavior belongs here, not in screen render code.
- `src/components/ui/SweetAlert.tsx` — shared app-wide alerts and confirmations (`showSweetAlert`, `showConfirmModal`, `showErrorAlert`) rendered by the root `SweetAlertHost`.
- `src/components/navigation/` — BottomNav; `src/features/profile/components/ProfileTopBar.tsx` owns profile top chrome. Both consume navigation state from `src/features/navigation/navigationUiStore.ts`.
- `src/components/layout/` — shared screen roots and safe-area ownership (`ScreenLayout`).
- `src/domain/` — cross-slice domain primitives; `questLifecycle.ts` owns shared Quest status and next-action values and predicates, while `satang.ts` owns Integer Satang parsing and display.
- `src/locales/` — Thai/English dictionaries plus `locale.ts` (`SupportedLocale`, `DEFAULT_LOCALE`, storage key); user-visible strings belong here. Locale state lives in `src/features/preferences/localeStore.ts`.
- `src/theme/` — colors, spacing, typography, layout/profile metrics.
- `src/tw/` — NativeWind primitives and class-name/image/animation helpers.
- `src/global.css` — global NativeWind/CSS setup.
- `src/infrastructure/storage/` — the persistence boundary. `keyValueStorage.ts` exports the `KeyValueStorage` interface and the SecureStore-backed `secureStorage` adapter. Feature code persists through an adapter, not through `expo-secure-store` directly.
- `src/app/providers/` — `QueryProvider` and `createQueryClient`: TanStack Query owns server state, including focus/online integration for React Native.
- `src/testing/` — shared test harnesses such as `renderWithQueryClient` in `queryTestUtils.tsx`; keep helpers here, outside any `__tests__/` directory, because Jest auto-collects every file under `__tests__/` as a test suite.

## Quest implementation seams

For Quest behavior, follow the owning subfeature path instead of guessing:

`route → feature screen/hook → API/query or workflow projection → domain/presentation`.

- `src/features/questBoard/domain/types.ts` owns Quest domain types and compatibility values; `src/features/questBoard/live/liveQuestTypes.ts` owns live transport snapshots and capabilities.
- `src/features/questBoard/api/questBoardQueries.ts` and `src/features/questBoard/live/liveQuestService.ts` own production query/service boundaries.

There is no client-side fixture lifecycle: the former `fixtures/` adapter, `workflow/` projections, Board/Detail `previewState`, prototype scenario menu, and dev Roleplay simulator were removed on 2026-10-29. Every Quest surface reads the live snapshot or public detail; tests build state with inline builders, live snapshots, or mocked `questApi` calls.

## Compatibility and rulebook drift already present

The rulebook is canonical, but current source contains compatibility/legacy values. Preserve them while tracing callsites and tests; migrate deliberately rather than deleting them because they look non-canonical.

- `QuestStatus` contains legacy/sub-state values such as `QUEST_AWAITING_*`, `QUEST_SUBMITTED`, `QUEST_APPROVED`, `QUEST_REWORK`, `QUEST_DISPUTED`, and `QUEST_HIDDEN`; the target Quest lifecycle still has exactly seven canonical states.
- `NO_CANDIDATE` is gone from source: `QuestBoardQuest` carries the contract values `mode` (`QuestMode`: `FIRST_COME_FIRST_SERVED | CANDIDATE`) and `participation` (`QuestParticipation`: `SINGLE | GROUP`) unchanged from the transport. Only the mirrored `docs/api/api.yaml` and rulebook text still quote `NO_CANDIDATE`. Board list rows are `QuestBoardCard` (no description, criteria, proof requirement, or status); detail reads are `QuestBoardQuest`, whose `acceptedParticipants` is absent on the Hirer's canonical read and supplied by the detail projection from the roster.
- `QuestProofStatus.PROOF_REJECTED` and `PROOF_AUTO_APPROVED`, plus `REWORK_PROOF` and `DEFAULT_REWORK_LIMIT`, remain in the adapter/types while the target contract uses `PROOF_NOT_APPROVED`, server auto-approval, and no rework cycle.
- `EDIT_CONSENT_WINDOW_MS` and `PARTIAL_GROUP_START_CONSENT_WINDOW_MS` are currently five minutes in the adapter, while the rulebook/spec target is ten minutes. This is a contract discrepancy requiring focused diagnosis and tests; do not silently rewrite or remove the existing tests.

When debugging a discrepancy, record both the canonical target and the observed implementation value. Never “fix” the discrepancy by deleting the test that exposes it.

## Test topology and preservation

Tests are behavior evidence, not disposable scaffolding.

- Feature tests live beside the feature under `src/features/<feature>/__tests__/`.
- API tests live under `src/api/__tests__/`.
- Shared component/navigation tests live under their adjacent `__tests__/` folders.
- Cross-cutting token tests live under `src/__tests__/`.
- Script tests live under `scripts/__tests__/`.
- Use Jest through Bun: `bun run test`, or a focused Jest path during a narrow debug loop.

Preserve existing tests and fixtures. If a test fails after a change, first classify whether the implementation, the intended contract, or the test is wrong. Change a test only when the product contract intentionally changed and the replacement assertion still defends observable behavior. Do not delete, disable, skip, weaken, or rename unrelated tests to make a failure disappear.

## Safe debugging protocol

1. State the active actor, canonical Quest state, selection mode, participation, `proofRequired`, and `dueAt` branch.
2. Read the owning source file and adjacent tests before editing an exported symbol or workflow.
3. Reproduce the failure at the smallest surface: focused test, route, fixture action, or mobile flow.
4. Fix the smallest source path that owns the behavior, preferably the code created or changed for the current task.
5. Keep unrelated files, tests, fixtures, rulebook rows, and evidence assets intact.
6. Add or update a regression assertion only when it protects the observed contract; do not pad tests.
7. Run focused verification first, then the relevant broader check (`bun run typecheck`, `bun run lint`, or `bun run test`) when the change warrants it.
8. Before delivery, inspect the changed-file list and confirm every deletion or test change is directly requested and explained.

Deleting a pre-existing test, source file, fixture, documentation, or screenshot requires explicit user approval. A failing test, stale-looking legacy value, type error, or generated artifact is not approval. Do not use reset/clean commands or project reset scripts as a normal debugging technique.

If the requested surface is absent, report the missing route/owner and preserve the evidence as a gap. Do not invent a route, silently substitute another actor/state, or create a no-op placeholder.

## Current QA evidence

- `docs/qa/mobile-ui-feature-checklist.tsv` is the importable QA flow with Rulebook checkpoints, `Check`, `แก้ไข`, `หมายเหตุ`, and `ภาพอ้างอิง / Screenshot` columns.
- `docs/qa/mobile-ui-screenshots/` contains Android development-build captures and explicit evidence gaps. Preserve unrelated captures when updating one flow.
- `docs/system-design-specification.md` refers to historical `docs/sds/screenshots/` evidence; that directory is not the current evidence location. Do not claim those historical files exist unless the path is present.
