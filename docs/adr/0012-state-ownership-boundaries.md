# State Ownership Boundaries

Every piece of state in the app has exactly one owner, chosen by what the state _is_ rather than by which component happens to need it.

`useState` / `useReducer` own transient state that only one component or subtree can observe: modal visibility, input text, local toggles, animation state, one-screen ephemeral selection. `useReducer` is preferred once that local state has meaningful transitions.

Zustand owns application, client, and domain state that outlives a single component: user preferences, role workspace, navigation chrome, client-side domain workflows. Stores are domain-scoped and colocated with the owning feature (`src/features/<feature>/<name>Store.ts`); there is no root store. Stores expose named actions that describe a transition (`setLocale`, `switchWorkspace`, `showNavigation`), not generic setters. Derived values are computed in selectors, never stored alongside their source. Components subscribe through narrow selectors so that high-frequency updates do not re-render unrelated trees; values that change at input frequency — scroll offsets, accumulators — stay in module-level variables outside reactive state, and the store is written only when an observable value actually changes.

TanStack Query owns server state. Reads go through query hooks keyed by a per-domain key factory colocated with the domain (`src/features/<feature>/api/`); raw key arrays never appear in components. Writes go through `useMutation` and then invalidate the narrowest correct key, or write canonical response data straight into the cache with `setQueryData`. Server entities are never mirrored into Zustand — Zustand may hold client-owned state _about_ a remote entity (selected id, draft, filters, UI mode) but not a copy of the entity. Manual request lifecycle — `loading`/`error` tuples, `let active = true`, `mountedRef`, focus-driven reloads, post-mutation refetch calls — is Query's job and is not reimplemented per screen.

Expo Router owns navigation state. The current route, the stack, and screen params are read from the router and never duplicated into a store. Zustand holds only navigation _chrome_ state the router does not model, such as whether the bottom navigation is visible.

Persistence goes through `src/infrastructure/storage`. `KeyValueStorage` is the interface; `secureStorage` is the `expo-secure-store` implementation. Feature code does not call a storage SDK directly, so the backing store for a value class can change in one place. Sensitive values — session cookies and cached session data, owned by `@better-auth/expo` — stay in secure storage. Persisted key literals are defined next to the feature that owns them and are treated as a compatibility contract: renaming one requires an explicit migration.

Complex domain workflows are pure functions and reducers with explicit inputs, including time (`now` is a parameter, never read inside). They perform no I/O, no storage access, no navigation, and no React work; a Zustand store hosts them at runtime and side effects happen at the store boundary. This keeps domain rules testable without mounting anything.

Application-owned React Context is not used as a state transport. Third-party providers (`QueryClientProvider`, `SafeAreaProvider`) are unaffected.
