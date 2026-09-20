# KUQuest Mobile Repository Context

This document is the implementation map and safe-debug contract for agents working in this repository. Read it before editing source, tests, routes, fixtures, API boundaries, or project files. It complements the domain glossary in `CONTEXT.md`; the mirrored rulebooks remain the business source of truth.

## Read order and authority

Use this order before a domain change:

1. `CONTEXT.md` — canonical ubiquitous language and domain meanings.
2. `docs/rulebook/README.md` and the relevant contract under `docs/rulebook/` — target backend behavior, lifecycle, money, conversation, proof, notification, image, and Admin rules.
3. `docs/agents/routing.md` — deterministic route to the matching specification, rulebook contract, and ADR.
4. `docs/specs/` — mobile behavior and UI contracts.
5. `docs/adr/` and `docs/system-design-specification.md` — architectural and navigation decisions.
6. The owning source module and its adjacent `__tests__/` files — current implementation evidence.

Precedence when sources disagree:

`CONTEXT.md` terminology → mirrored backend rulebook target behavior → mobile specifications → ADRs → system-design UI evidence → current implementation and fixtures.

Current code can intentionally lag the rulebook. Treat that as an implementation gap to diagnose, not as permission to delete tests, fixtures, or compatibility values.

## Repository boundaries

### Product and project configuration

- `package.json` — Bun scripts, Expo SDK 57 dependencies, Jest configuration.
- `app.json`, `app.config.ts`, `eas.json` — Expo/native configuration and build profiles.
- `README.md` — staging environment, development-build setup, and verification commands.
- `CODE_STYLES.md` — review standards, feature boundaries, accessibility, and test conventions.
- `docs/agents/nativewind.md` — NativeWind/Tailwind styling: token naming, dark mode, role accent, and v5-vs-v4 traps.
- `docs/agents/mobile-validation.md` — canonical staging and native device smoke flow.
- `docs/agents/engineering-workflow.md` — detailed planning, delegation, safety, testing, and delivery workflow.
- `AGENTS.md` / `CLAUDE.md` — agent operating rules and pointers.
- `android/` — native/generated Android build project. Change it only for an explicit native Android task; do not use generated build output as application source.
- `.expo/`, `node_modules/`, build outputs, and caches are generated state. They are not source-of-truth files.

### Mobile route layer

`src/app/` is the Expo Router entry layer. Route files should compose the owning feature and navigation shell; domain rules do not belong only in a route component.

- `src/app/_layout.tsx` — fonts, splash, safe-area provider, store hydration, status bar, and root stack.
- `src/app/index.tsx` — root/auth entry.
- `src/app/(tabs)/_layout.tsx` — authenticated tab shell.
- `src/app/(tabs)/index.tsx` — Quest Board.
- `src/app/(tabs)/my-quests.tsx` — My Quests.
- `src/app/(tabs)/create.tsx` — Create Quest wizard.
- `src/app/(tabs)/chat.tsx` and `src/app/(tabs)/chat/[id].tsx` — Chat inbox and conversation.
- `src/app/(tabs)/profile.tsx` — Student Profile.
- `src/app/quest/[id].tsx` — Quest Detail.
- `src/app/quest/[id]/manage.tsx` — Hirer quest management (cancel, chat, proof review, candidate/team selection fallback). Reached only from My Quests (`MyQuestsScreen.openManageQuest`); the Home Active Quest carousel opens `quest/[id].tsx` instead.
- `src/app/quest/[id]/select-roster.tsx` — Hirer candidate/team selection for a CANDIDATE-mode quest with pending applicants. Reached from `HirerQuestRosterModal`'s manage action.
- `src/app/quest/[id]/dispute.tsx` — Dispute case submission.
- `src/app/quest/[id]/work.tsx` — Worker work-in-progress screen.
- `src/app/quest/[id]/proof.tsx` — Worker proof submission.
- `src/app/quest/[id]/inquiry/[conversationId].tsx` — Candidate Inquiry conversation detail.
- `src/app/onboarding/index.tsx` — Academic Registration entry.
- `src/app/profile/edit/index.tsx` and `src/app/profile/edit/[section].tsx` — Profile editing.
- `src/app/settings.tsx` — Settings.
- `src/app/report.tsx` — Report flow.
- `src/app/dev/import-session.tsx` — development-only session import; never treat it as a production flow.

The route tree currently has no dedicated route file for Sent Work, Wallet/Conversion/Payout, Rating Review action, or Admin operations. Verify code and fixtures before claiming one exists; the QA checklist records unverified surfaces as explicit gaps.

### Feature layer

`src/features/` owns vertical slices. Keep feature-local components, types, styles, adapters, and tests together.

- `src/features/*/api/` — per-feature TanStack Query key factories and hooks; `src/features/wallet/api/walletQueries.ts` is the canonical example.
- `src/features/questBoard/domain/` — pure Quest reducer and selectors with no I/O.
- `src/features/questBoard/fixtures/` — demo and seed data consumed by `questFixtureAdapter.ts`.
- `src/features/questBoard/store/` — Zustand/vanilla ownership of current Quest state (`questStore.ts`) and injectable clock state (`questClockStore.ts`).
- `auth/` — Better Auth session, SecureStore, native Google Sign-In, auth gate, login, routing destination.
- `onboarding/` — Academic Registration validation, steps, persistence coordinator, inputs/selects/checkbox/file-size modal.
- `questBoard/` — Quest Board, Quest Detail, Quest lifecycle adapter, workflow projections, fixtures, prototype harness, proof/team/candidate/partial-consent sheets.
- `myQuests/` — Worker/Hirer My Quests projections, status views, funding summary integration.
- `createQuest/` — three-step Quest draft model, persistence, publish checks, schedule/location/proof/funding UI.
- `chat/` — Conversation inbox, Work Conversation, messages, attachments, read state, loading states.
- `profile/` — Student Profile, public data adapters, demo data, tabs, reputation and profile components.
- `profileEdit/` — editable basics, Experience, Portfolio, Certificates, validation and save behavior.
- `settings/` — account/settings/help/preferences surface.
- `report/` — Report form, categories, validation and submit state.
- `home/` — home composition where used by the route shell.
- `workerHome/` — Worker Workspace Home screen with real assignment and board endpoints, quick stats, and available quests feed.
- `wallet/` — four-compartment wallet overview (spending, earnings, funding reserved, payout reserve), Top-up quote and payment flow, transaction history modal, `walletModule.ts` Top-up and Earnings Conversion rules.
- `roleplay/` — development-only Roleplay prototype screen, prototype persona switching, four quest fixture scenarios, mock view-model store, candidate/team/consent actions dispatched through the questBoard fixture adapter.
- `preferences/` — locale preference store (`localeStore.ts`); owns the persisted `kuquest_user_locale` value.
- `workspace/` — Hirer/Worker role workspace store (`roleWorkspaceStore.ts`); owns the persisted `kuquest_active_workspace` value.
- `navigation/` — navigation chrome UI store (`navigationUiStore.ts`); owns bottom-nav compactness, profile top-bar visibility, and scroll accumulation. Scroll owners: `home/`, `questBoard/`, `chat/`, `profile/`, `workerHome/`, and `myQuests/screens/`.

### Shared and transport layer

- `src/api/` — `ApiClient`, request/error boundary, Zod/API contracts, `StudentApi`, `ProfileApi`. Network behavior belongs here, not in screen render code.
- `src/components/ui/` — shared UI primitives, loading/placeholder/button, TopBar, Quest Funding Summary, Prototype Menu.
- `src/components/navigation/` — BottomNav; `src/features/profile/components/ProfileTopBar.tsx` owns profile top chrome. Both consume navigation state from `src/features/navigation/navigationUiStore.ts`.
- `src/components/layout/` — shared screen roots and safe-area ownership (`ScreenLayout`).
- `src/domain/` — cross-slice domain primitives; `satang.ts` owns Integer Satang parsing and display.
- `src/locales/` — Thai/English dictionaries plus `locale.ts` (`SupportedLocale`, `DEFAULT_LOCALE`, storage key); user-visible strings belong here. Locale state lives in `src/features/preferences/localeStore.ts`.
- `src/theme/` — colors, spacing, typography, layout/profile metrics.
- `src/tw/` — NativeWind primitives and class-name/image/animation helpers.
- `src/data/questPrototype/` — prototype data entry point.
- `src/global.css` — global NativeWind/CSS setup.
- `src/infrastructure/storage/` — the persistence boundary. `keyValueStorage.ts` exports the `KeyValueStorage` interface and the SecureStore-backed `secureStorage` adapter. Feature code persists through an adapter, not through `expo-secure-store` directly.
- `src/app/providers/` — `QueryProvider` and `createQueryClient`: TanStack Query owns server state, including focus/online integration for React Native.
- `src/testing/` — shared test harnesses such as `renderWithQueryClient` in `queryTestUtils.tsx`; keep helpers here, outside any `__tests__/` directory, because Jest auto-collects every file under `__tests__/` as a test suite.

## Quest implementation seams

For Quest behavior, follow the path instead of guessing:

`route → feature screen → questWorkflow → questFixtureAdapter → questFixtures/types`.

- `src/features/questBoard/types.ts` holds transport/domain types and currently includes explicit compatibility values.
- `questFixtureAdapter.ts` is the deterministic local state/action adapter used by the prototype and many tests.
- `questWorkflow.ts` projects adapter state into Board, Detail, My Quests, settlement, conversation capability, and action surfaces.
- `questBoardHarness.ts` exposes Board preview states: populated, loading, empty, error, pending, accepted, full, and closed.
- `questFixtures.ts` owns seeded scenario data; it is test/prototype evidence, not proof that the production API supports every scenario.
- `src/components/ui/prototypeMenuData.ts` and `PrototypeMenu.tsx` own the prototype scenario/persona menu.

When a behavior exists only in fixtures, label it as prototype coverage. Do not present it as a production API guarantee.

## Compatibility and rulebook drift already present

The rulebook is canonical, but current source contains compatibility/legacy values. Preserve them while tracing callsites and tests; migrate deliberately rather than deleting them because they look non-canonical.

- `QuestStatus` contains legacy/sub-state values such as `QUEST_AWAITING_*`, `QUEST_SUBMITTED`, `QUEST_APPROVED`, `QUEST_REWORK`, `QUEST_DISPUTED`, and `QUEST_HIDDEN`; the target Quest lifecycle still has exactly seven canonical states.
- `QuestCandidateMode.NO_CANDIDATE` remains in source and fixtures; the target domain term is `FIRST_COME_FIRST_SERVED`.
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
