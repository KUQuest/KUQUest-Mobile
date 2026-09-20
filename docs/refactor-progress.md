# State & Data Architecture Migration

Engineering log for the migration to: TanStack Query (server state), Zustand (client/app state),
pure domain reducers (complex workflows), explicit storage adapters (persistence), zero
application-owned React Context.

## Target ownership model

| Concern                    | Owner                                      |
| -------------------------- | ------------------------------------------ |
| Transient UI state         | `useState` / `useReducer`                  |
| Application / client state | Zustand (domain-scoped stores)             |
| Complex domain workflows   | Pure reducers, hosted by Zustand vanilla   |
| Server / remote state      | TanStack Query                             |
| Navigation state           | Expo Router                                |
| Persistence                | `src/infrastructure/storage` adapters      |
| Sensitive persistence      | `expo-secure-store` via the secure adapter |

## Baseline (verified)

- `bun run typecheck` — clean.
- `bun run test` — 95 suites, 648 tests, all passing.
- No pre-existing failures. Any failure after this point is a regression.
- Working tree at session start contained only user-owned documentation deletions/edits
  (no source changes). Those are untouched by this migration.
- Confirmed absent before the migration: redux, zustand, jotai, mobx, recoil, valtio, xstate,
  tanstack-query, swr, apollo, async-storage, mmkv.

## Dependencies added

- `zustand@5.0.15`
- `@tanstack/react-query@5.103.1`

Both verified compatible with React 19.2.3 / React Native 0.86.2 / Expo SDK 57.

## Architecture inventory (baseline survey)

### Application-owned React Context (3)

| Context                       | File                                                        | Persisted key              |
| ----------------------------- | ----------------------------------------------------------- | -------------------------- |
| `LocaleContext`               | `src/locales/LocaleProvider.tsx`                            | `kuquest_user_locale`      |
| `RoleWorkspaceContext`        | `src/components/navigation/RoleWorkspaceContext.tsx`        | `kuquest_active_workspace` |
| `NavigationVisibilityContext` | `src/components/navigation/NavigationVisibilityContext.tsx` | none                       |

Note: the pre-survey guessed keys `kuquest_locale` / `kuquest_role_workspace`. The actual
literals are `kuquest_user_locale` and `kuquest_active_workspace`. Repository evidence wins.

### Persisted keys (full census)

| Key                                             | Owner                                | Sensitive |
| ----------------------------------------------- | ------------------------------------ | --------- |
| `kuquest_user_locale`                           | locale preference                    | no        |
| `kuquest_active_workspace`                      | role workspace preference            | no        |
| `kuquest_active_prototype_persona`              | `authEnvironment` (dev/demo persona) | no        |
| `kuquest_cookie`                                | `@better-auth/expo` session cookie   | **yes**   |
| `kuquest_session_data`                          | `@better-auth/expo` session cache    | **yes**   |
| `kuquest.create-quest-draft` (legacy root)      | create-quest draft, migrated on read | no        |
| `kuquest.create-quest-draft.<userId>.index`     | create-quest draft index             | no        |
| `kuquest.create-quest-draft.<userId>.<draftId>` | create-quest draft payload           | no        |

### Server state

- `ApiClient` (`src/api/ApiClient.ts`) already spreads `RequestInit` into `fetch`, so `signal`
  reaches the transport with no client change required. It already throws a typed
  `ApiError { status, code, message }`.
- No response cache or invalidation architecture. Reads live in `useEffect` /
  `useFocusEffect` with hand-rolled `loading`/`error`/`let active = true`/`mountedRef` guards.
- Error representation is inconsistent across screens: `boolean`, `string | null`,
  `string | undefined`, discriminated `LoadState` unions, and domain view-model error kinds.
- Specialized caches: `src/hooks/useCalmRefresh.ts` (30s stale window + in-flight
  coalescing + focus refresh — fully subsumable by Query) and
  `src/features/chat/attachmentLinkCache.ts` (presigned-URL TTL cache with a 60s safety
  window — read synchronously during render, so it is not trivially subsumable).

### Bespoke observable stores

| Module                                           | Notes                                                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `src/features/questBoard/questFixtureAdapter.ts` | 5398 lines: fixtures + state `Map` + listener `Set` + 28-case dispatch + selectors + view models |
| `src/features/questBoard/questWorkflow.ts`       | wraps the adapter; 1s `setInterval` tick at lines 320-323 with subscriber fan-out                |
| `src/features/roleplay/roleplayMock.ts`          | mixed scenario/persona state + view-model projection + dispatch bridge                           |
| `src/features/auth/authEnvironment.ts`           | class-like singleton with its own listener `Set`; owns demo flag + active persona                |

## Decisions

- **Preferences stay in SecureStore.** The survey suggested moving non-sensitive preferences
  to synchronous storage (MMKV/AsyncStorage) to remove startup flashes. Rejected: it adds a
  dependency and changes where user data lives, for a pre-existing cosmetic issue that is not
  part of this migration. The values now route through a storage adapter, so the backing
  store can be swapped in one place later. Startup locale/workspace flash is recorded as
  known debt below.
- **No central storage-key registry.** Keys stay defined next to their owning feature, which
  is the existing convention and correct ownership. A registry would be indirection without a
  second consumer.
- **`ApiClient` is left alone.** It already forwards `signal`; cancellation support is purely
  a matter of domain API modules accepting and passing an optional `{ signal }`.

## Completed work

### Phase 1 — foundation, Context removal

- `src/infrastructure/storage/keyValueStorage.ts`: `KeyValueStorage` interface + `secureStorage`.
  Errors propagate; callers decide tolerance.
- `src/app/providers/queryClient.ts` + `QueryProvider.tsx`: one client (`staleTime` 30s,
  `refetchOnWindowFocus`), `shouldRetryRequest` skips 4xx `ApiError` and retries twice
  otherwise, `AppState` -> `focusManager`, `expo-network` -> `onlineManager`.
- Optional `{ signal }` added to every read method of `WalletApi`, `StudentApi`, `QuestApi`,
  `ChatApi`, `DisputeApi`. Writes deliberately unchanged: cancelling a write is not safe.
- All three application Contexts deleted and replaced by `localeStore`, `roleWorkspaceStore`,
  `navigationUiStore`. `grep createContext src` is empty. Scroll accumulators that drive
  navigation chrome transitions stay in module-level variables — they change per frame and
  must not be reactive state. The store exposes separate bottom-nav compactness and
  profile top-bar visibility state.

### Phase 2 — Query pilot, quest decomposition, auth env store

- Wallet is the pattern reference: `src/features/wallet/api/walletQueries.ts`.
- `questFixtureAdapter.ts` 5398 -> 3266 lines; fixtures to `questBoard/fixtures/`, pure
  validation/selector/escrow math to `questBoard/domain/`.
- `authEnvironment`'s listener `Set` replaced by `authEnvironmentStore`; persona persists
  through the storage adapter under the unchanged key.
- ADR `docs/adr/0012-state-ownership-boundaries.md`.

### Phase 3 — server state fan-out, pure quest reducer, clock redesign

- Query now owns profile/profileEdit, chat, workerHome and myQuests server state. Each
  feature owns its own key factory; no shared cross-feature key namespace.
- Chat keeps its optimistic send/upload behavior via `onMutate`/`onSuccess` cache writes, and
  socket events write through `setQueryData` instead of maintaining a parallel local copy.
- All 26 quest lifecycle transitions extracted to `questBoard/domain/questReducer.ts`
  (2012 lines, pure: no I/O, timers, React, navigation, or internal clock reads). Adapter
  methods are store-read -> reduce -> commit.
  `SEND_MESSAGE` / `MARK_CONVERSATION_READ` remain adapter-side: they mutate the in-memory
  conversation records and return chat projections, which is a genuine side effect rather
  than a quest-state transition. That exception is deliberate and documented, not a gap.
- Quest runtime state moved to a Zustand vanilla store; the hand-rolled state `Map` plus
  listener `Set` fan-out is gone. Vanilla (not React) because the adapter, workflow, fixtures
  and tests all use it from outside React.
- The global one-second `setInterval` is replaced by a one-shot timer scheduled at the real
  next deadline (earliest of `startAt`, partial-start response deadline, edit-consent
  response deadline), rescheduled after each fire and torn down at last unsubscribe. The four
  time-triggered transitions still fire because every read projects against `now` via
  `questSelectors.projectLifecycle`. Concrete win: `RoleplayScreen` previously recomputed its
  view model about once a second for as long as it was mounted; it now updates only on data
  changes and real deadlines.

### Phase 4 — remaining server state, one session owner, persistence adapter

- Query now also owns quest board/detail, create/edit/publish quest, the Hirer home
  aggregation, onboarding load, the dispute and roster routes, and the funding wallet read.
  `useCalmRefresh` has no consumers left and is deleted.
- `liveQuestService`'s composed reads (board pagination, the three-way
  `getDetail`/`getPublicDetail`/`getParticipationDetail` visibility fallback, the composed
  detail bundle with its `optionalResource` tolerance) stay in the service and are called by
  query functions with `{ signal }` threaded through. A `queryFn` calls the transport
  directly only when the read is a single API call; otherwise duplicating the composition
  into the data layer would split domain logic across two places.
- The session had five owners: `BottomNav`, `ChatInboxScreen`, `useChatConversationController`,
  `MyQuestListScreen`, and `WorkerWorkManagementScreen` each ran their own
  `authService.getSession()` effect with an `active` guard and their own `sessionUserId`.
  It now has exactly one: `src/features/auth/sessionQueries.ts`. `authService.getSession()`
  round-trips Better Auth, so Query — not a store — is the honest owner.
  Sign-in and sign-out evict `sessionKeys` through `clearSessionCache(queryClient)` at the
  React call sites (settings, login, onboarding, profile edit), so no stale signed-in user
  survives a sign-out. No listener fanout and no exported mutable client were introduced.
- `BottomNav` no longer fetches the profile itself; it reads the profile query. Its avatar
  derivation deliberately accepts only the structured `profileImage` source, because
  `ProfileViewData.profileImage` falls back to the Google session image and the existing test
  asserts the app avatar is shown _instead of_ the Google one. A second test now pins the
  no-avatar case.
- `createQuestPersistence` routes through the storage adapter. Key names and the legacy
  `kuquest.create-quest-draft` migration are untouched.

### State that must not be mirrored

Three migrations reintroduced "copy the query result into local state in an effect", which
`react-hooks/set-state-in-effect` correctly rejects:

- `AuthGate` mirrored a `loading | unauthenticated | error` status. It is now derived from
  the query plus one genuinely local fact (routing failed).
- `useQuestEdit` mirrored `draftHydrated`; it is now derived from the detail query.
- `OnboardingScreen` seeded its form from query data in an effect; it now adjusts state
  during render guarded by data identity, which is React's documented alternative and avoids
  rendering a stale form frame first.
- `useQuestPersistence` keeps its load inside an async IIFE in the effect. The draft read is
  device-local persistence, not server state, so it stays out of Query; the state it sets is
  set only after an await, which is the shape the rule permits.

### Left deliberately

- `AuthService.ts` and `authClient.ts` still import `expo-secure-store` directly: the
  Better Auth Expo client takes the SecureStore module itself, and these are the auth token
  and cookie plumbing rather than feature persistence.
- `attachmentLinkCache` is retained. `ChatApi` keeps its own private TTL cache and
  `MessageBubble` reads the feature cache synchronously during render, so a Query replacement
  cannot reproduce the behavior without changing `ChatApi`.
- `SEND_MESSAGE` / `MARK_CONVERSATION_READ` remain adapter-side side effects, as recorded
  in phase 3.

### Derived-value stability

`const xs = query.data ?? []` allocates a new array every render and silently defeats every
downstream `useMemo`. Where the value feeds a memo or effect it must be
`useMemo(() => query.data ?? [], [query.data])`. This was caught by lint in three screens
(`WorkerHomeScreen`, `WorkerWorkManagementScreen`, `useChatConversationController`) and is
the reason the repo's `react-hooks/exhaustive-deps` warnings are worth keeping at zero-delta.

### Phase 5 — last hand-rolled store, cache-key honesty, timer hygiene

- `roleplayMock` held the final bespoke observable (`Set<listener>` + manual `notify`). Its
  state now lives in a Zustand vanilla store (`roleplayStore`) and `RoleplayScreen` reads it
  through `useStore`, so the screen no longer mirrors the view model into `useState` and
  re-pushes it from four handlers. The store keeps a custom `subscribe` because the roleplay
  view model is derived from `questWorkflow` and the auth environment: the upstream
  subscriptions - and therefore the workflow's deadline timer - must exist only while the
  store has subscribers. `createRoleplayMock` had no callers and is gone.
- A query key must contain exactly the inputs its `queryFn` reads, or the cache lies.
  Three keys were wrong and are fixed: `questBoardKeys.board(filters)` keyed on filters the
  board read never applied; `onboardingKeys.profile(locale)` keyed on a locale the payload
  does not depend on (every localized string is chosen at render time); and
  `chatKeys.messages` omitted `viewerId`, so two accounts on one device could read each
  other's message page. The inverse - one key, two payload shapes - was also present:
  `createQuestKeys.detail` served both the raw `QuestV2Detail` and the mapped
  `QuestBoardQuest`; the raw read moved to `createQuestKeys.editSource(questId)`.
- `{ signal }` now reaches the remaining composed reads
  (`getCandidateInquiry`, `listCandidateInquiryParticipants`, `getCandidateInquiryMessages`,
  the live snapshot), so an unmounted chat screen stops its in-flight work.
- Two countdown cards (`PartialGroupStartConsentSheet`, `QuestConditionEditStatusCard`) ran a
  1s interval forever, including after their deadline had passed. The interval now stops once
  the deadline is behind `now`; the rendered value is identical because it is clamped at zero.

### Phase 6 — audit closeout: the screens phases 1-5 missed

Four read-only audits (fetch effects, persistence/mock coupling, render path, docs drift) were
run against the finished migration. They found that the phase-4 claim "the session has exactly
one owner" was true only of the five files phase 4 inspected. Six more sites still ran their own
`authService.getSession()` effect, and four screens had never been migrated at all.

- `src/app/quest/[id]/manage.tsx`, `src/app/quest/[id]/select-roster.tsx`,
  `QuestProofScreen`, `QuestWorkScreen` each hand-rolled snapshot/loading/refreshing/error
  `useState` plus a fetching effect. They now read `useLiveQuestSnapshotQuery`.
  `QuestBoardScreen` and `useQuestDetailController` lost their session effects;
  `CreateQuestScreen` lost its `questApi.listTags()` effect in favour of `useWorkerTagsQuery`.
- Manual polling became `refetchInterval`. `useLiveQuestSnapshotQuery` gained one optional
  trailing argument accepting `number | false | ((snapshot) => number | false)`; the predicate
  form exists because both screens' cadence depended on the snapshot itself. QuestProof polls
  at 10s only while `nextAction === "WAIT_FOR_START"` or the viewer's proof is pending;
  QuestWork returns the remaining delay until `startTime - 60s`, then 5s until
  `startTime + 120s`. The old attempt cap (`MAX_START_POLLS = 36`) was dropped because
  180s / 5s is exactly 36: the time window already implies it, and keeping a counter would
  have meant reading a ref during render, which `react-hooks/refs` correctly rejects.
- Command errors stay in component-local `useState`. Only the _fetch_ lifecycle belongs to
  Query; an error raised by a user-triggered action is local UI state, and the banner now
  renders `commandError ?? fetchError` with the original precedence.
- Persistence defect: the legacy `kuquest.create-quest-draft` migration ran only inside
  `listQuestDrafts`, but the create/edit flow mounts through `loadQuestDraft`, so an upgrading
  user with an in-progress draft saw an empty form. The read path now migrates too - gated on
  the draft index key being _absent_, not merely empty. An empty index means the user already
  used the multi-draft flow and deleted their drafts; probing the legacy key in that state
  resurrected deleted drafts and broke `deletes the exact draft from SecureStore`. Both
  properties are now pinned by tests.
- Render path: two `Intl.DateTimeFormat` instances were being constructed per list item in
  `ProfileComponents` (review dates, experience months) and are now module-scope caches keyed
  by locale; `QuestWorkScreen`'s sorted condition items are memoized; its 1s countdown stops
  at the deadline like its two sibling cards; `select-roster`'s two `renderItem` closures are
  `useCallback`s.
- Verified clean by audit, worth recording: no unauthorized `expo-secure-store` import, no
  non-secure persistence of anything sensitive, no duplicated storage-key literal, no Zustand
  selector that constructs an object or array (the v5 re-render trap), no whole-store
  subscription without a selector, and every `FlatList` has a stable `keyExtractor`.

## Known debt

- Startup hydration flash: locale defaults to `th` and workspace to `hirer` while the
  SecureStore read is in flight, so a user who chose English/Worker sees one frame of the
  default. Pre-existing behavior, preserved deliberately.
- `attachmentLinkCache` is read synchronously in `MessageBubble` render, so replacing it with
  Query requires restructuring that component's render path.
- Fixture data ships in the production bundle. `QuestBoardScreen` and `useQuestDetailController`
  import `questWorkflow`, which imports `questFixtureAdapter` and its seeds at module scope:
  3,610 lines of demo data (`questFixtureAdapter.ts` 1,544, `questFixtures.ts` 947,
  `fixtures/questSeeds.ts` 781, `fixtures/chatSeeds.ts` 298, `fixtures/memberDirectory.ts` 40).
  Both screens still branch on `previewState !== "populated"`. `HomeScreen` likewise branches
  on `isPrototypeDemoEnabled()` and imports `hirerHomeQuestFixtures`. Removing this is a
  product decision about the preview/demo mode, not a state-ownership change, so it was left
  alone deliberately.
- Onboarding, chat and profile keep bespoke empty/error presentations rather than the shared
  `StateView`: their icons, copy placement and surrounding layout genuinely differ, and
  forcing them through one component would have changed what users see.
- ADR 0005 (`system-locale-only`) no longer describes what ships and is now marked superseded:
  `getDeviceLocale()` in `src/locales/locale.ts` returns `DEFAULT_LOCALE` ('th') rather than
  reading the OS, and `localeStore` hydrates a user-selected locale from `kuquest_user_locale`.
  The ADR text itself is left intact as a record.

## Quality pass (post-migration)

Ran as six waves on top of the state migration. Every wave was verified with
`bun run typecheck`, `bun run test` (99 suites / 656 tests) and `bunx eslint src` at zero
errors before it was committed.

- **Query honesty** (`f6ba513`): `chatKeys.conversation` carries the `questId` it actually
  varies on; dead `useCandidateInquiryQuery` and the duplicate `useMyHirerQuestBoardQuery`
  deleted rather than re-keyed; the dispute mutation moved into the query layer with precise
  invalidation; `HomeScreen` and `WorkerWorkManagementScreen` gained the loading and error
  states they were missing; `HomeWalletOverview` lost its data-push effect.
- **List virtualization** (`2e1a08a`, `0154479`): wallet transactions, the worker quest feed,
  the chat inbox and the conversation history are `FlatList`s keyed by domain id. The
  conversation had no auto-scroll effect before the change, so none was added.
- **One formatter per concept** (`2c5d586`): `src/domain/satang.ts` is the only baht formatter
  and `src/domain/datetime.ts` the only date/time formatter, pinned to `Asia/Bangkok` and Thai
  Gregorian. This fixed a real conflict where a Quest card showed a Thai deadline as
  `15/10/69` (Buddhist) and its detail screen showed `15 ต.ค. 2026`. Display strings no longer
  live in data: chat carries `createdAt`/`latestAt`, not `"14:30"`.
- **Accessibility** (`918fab4`): every icon-only control has a localized name, modal shells set
  `accessibilityViewIsModal`, touch targets reach 44x44 through `hitSlop` without moving
  layout, and the hirer-home carousel reports position through `accessibilityValue`.
- **Shared UI** (`e3437f6`): `Input`, `TextArea` and `Select` left the onboarding feature for
  `src/components/ui/`, joining `StateView`, `Avatar`, `Chip`, `SearchInput` and `BottomSheet`.
  Each was adopted only where the markup genuinely matched — four sheets moved onto the shared
  shell, four centered card modals stayed put.
- **Decomposition** (`409c5f8`, `eff690c`, `0154479`): the `ProfileComponents` bucket is gone,
  split into one file per component. `ProfileEditScreen` 1,870 → 1,358; `TopUpScreen`
  1,161 → 299; `OnboardingScreen` 1,675 → 1,082; `TeamAssembleSheet` 1,360 → 577;
  `MyQuestListScreen` 881 → 453 with its inline copy moved into a bilingual locale module.
- **Copy** (`eff690c`): one wording per action per locale — Retry/Try Again/Try again became
  "Try again", three Thai renderings became one. Context-specific labels such as "Cancel Quest"
  were deliberately left specific.

One real bug surfaced and was fixed on the way (`0154479`): `CandidateReviewSheet` appended
every team application to its rows after already deriving rows from submitted teams, so a
proposal represented by both rendered twice — React's duplicate-key warning was the symptom.
