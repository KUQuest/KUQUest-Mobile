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

## Known debt

- Startup hydration flash: locale defaults to `th` and workspace to `hirer` while the
  SecureStore read is in flight, so a user who chose English/Worker sees one frame of the
  default. Pre-existing behavior, preserved deliberately.
- `attachmentLinkCache` is read synchronously in `MessageBubble` render, so replacing it with
  Query requires restructuring that component's render path.
