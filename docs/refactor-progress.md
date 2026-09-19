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
  `navigationUiStore`. `grep createContext src` is empty. Scroll accumulators that drove
  nav auto-hide stay in module-level variables — they change per frame and must not be
  reactive state.

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

## Known debt

- Startup hydration flash: locale defaults to `th` and workspace to `hirer` while the
  SecureStore read is in flight, so a user who chose English/Worker sees one frame of the
  default. Pre-existing behavior, preserved deliberately.
- `attachmentLinkCache` is read synchronously in `MessageBubble` render, so replacing it with
  Query requires restructuring that component's render path.
