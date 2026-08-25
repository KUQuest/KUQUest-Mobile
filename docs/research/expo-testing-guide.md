# Expo SDK 57 testing guide

Research date: 2026-08-13

This guide answers how KUQUest-Mobile should use unit tests, fixtures, component/integration tests, and end-to-end tests. “Fixtures” here means controlled test data and route fixtures, not mock data embedded in production code.

## Recommendation

Use three layers:

1. Jest unit tests for pure domain logic, repositories, validation, and auth/session contracts.
2. React Native Testing Library tests for components and screen interactions, including Expo Router navigation through `expo-router/testing-library`.
3. Maestro E2E flows against Android and iOS development builds, run locally first and in EAS Workflows in CI.

Keep the layers separate. Unit and component tests should not need a simulator. E2E tests should verify a small number of user-critical journeys against a real build and should not duplicate every unit assertion.

Expo’s SDK 57 documentation is the version baseline for this repository: [Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/).

## Current repository state

The project already has the core JavaScript test setup recommended by Expo:

- `jest-expo` preset in `package.json`.
- `@testing-library/react-native` for rendered component tests.
- `jest.setup.js` for native-module test doubles.
- Tests remain outside `src/app`, with feature-owned tests in feature `__tests__` directories and cross-feature tests in `src/__tests__`.
- Existing coverage of auth, login UI, profile persistence, and onboarding-step parsing.
- `react-test-renderer` is still listed as a dev dependency, although Expo’s current guide says it is deprecated for React 19 and should be replaced by React Native Testing Library for new tests.

The current gap is E2E coverage: there is no `.maestro/` directory or EAS test workflow yet. There is also no shared fixture directory; most test data is currently created inside individual test files.

Expo’s Jest guide recommends `jest-expo` because it mocks the native portion of the Expo SDK and supplies the base Jest configuration. It also recommends React Native Testing Library for component tests. See [Expo: Unit testing with Jest](https://docs.expo.dev/develop/unit-testing/).

## Test folder structure

Expo does not require one universal test-folder layout. Its Jest guide presents a root `__tests__` directory as a common pattern and also documents multiple area-specific `__tests__` directories as a valid alternative. Expo Router adds one hard rule: test files must not live inside `src/app`, because every file there is treated as a route or layout. See [Expo: Structure your tests](https://docs.expo.dev/develop/unit-testing/#structure-your-tests) and [Expo Router: Testing configuration](https://docs.expo.dev/router/reference/testing/#configuration).

For this existing repository, use this policy:

```text
src/
  app/                         # routes and layouts only
  __tests__/                   # existing cross-feature and router tests
  test/
    fixtures/                  # shared deterministic test data
  features/
    auth/
      __tests__/               # new auth-specific tests, if useful
```

- Keep the remaining cross-feature tests in `src/__tests__/`; a wholesale move is not needed.
- Put new tests beside a feature in `__tests__/` when ownership is obvious, or keep them in `src/__tests__/` when they cross feature boundaries.
- Never put tests under `src/app`.
- Use one naming convention: `*.test.ts` or `*.test.tsx` for this repository.
- Keep fixtures under `src/test/fixtures/`, not in production fallback paths.

This is a repository convention, not an Expo requirement. The important boundary is that route files remain separate from test files.

## 1. Unit tests

### What belongs here

Unit-test code that can run without React Native rendering or a device:

- `parseOnboardingStep` and other route/state parsers.
- `isAuthSession` and profile validation.
- `ProfileRepository` serialization, user isolation, and malformed-storage behavior.
- Auth error mapping and session expiration.
- Date/URL/field validation.

A unit test should answer one small behavioral question and use explicit inputs and outputs. Native calls, network requests, and SecureStore should be replaced with controlled test doubles at this layer.

Example shape:

```ts
test('rejects a session with an invalid onboarding step', () => {
  const value = { ...validSession, user: { ...validSession.user, onboardingStep: 9 } };

  expect(isAuthSession(value)).toBe(false);
});
```

Run the existing suite with:

```bash
bun run test -- --runInBand
```

For a focused test file:

```bash
bun run test -- src/features/auth/__tests__/AuthService.test.ts
```

For the full tester gate used before review:

```bash
bun run typecheck
bun run lint
bun run test -- --runInBand
```

For CI and coverage:

```bash
bun run test -- --ci
bun run test -- --coverage --runInBand
```

Expo documents `jest-expo`, test discovery, coverage, and CI usage in [Unit testing with Jest](https://docs.expo.dev/develop/unit-testing/). EAS’s example uses a test job that installs dependencies and runs Jest with `--ci`; this repository can use the equivalent Bun command in [Automate development builds with EAS Workflows](https://docs.expo.dev/tutorial/cicd/development-builds/).

## 2. Fixtures and test data

Fixtures should be reusable, deterministic, and owned by tests. They must never become fallback data in the app.

Recommended structure:

```text
src/
  test/
    fixtures/
      auth.ts
      profile.ts
      router.ts
  __tests__/
    AppChromeMetrics.test.ts
    ProfileLayoutMetrics.test.ts
  features/
    auth/
      __tests__/
        AuthService.test.ts
        LoginScreen.test.tsx
```

Prefer factories with overrides over one giant mutable fixture:

```ts
export function createAuthSession(
  overrides: Partial<AuthSession['user']> = {}
): AuthSession {
  return {
    token: 'test-token',
    user: {
      id: 'test-user',
      email: 'student@ku.th',
      name: 'Test Student',
      onboardingStatus: 'COMPLETED',
      ...overrides,
    },
    createdAt: 1_000,
    expiresAt: Date.now() + 60_000,
  };
}
```

Rules for fixtures:

- Create a fresh object per test; do not mutate a module-level object.
- Give fixtures stable IDs and values that reveal the scenario.
- Use an override for the one variable under test.
- Keep API response fixtures separate from UI fixtures when their shapes differ.
- Reset SecureStore, in-memory repositories, timers, and Jest mocks in `beforeEach`/`afterEach`.
- Keep fake accounts, fake names, and fake tokens under test-only paths such as `src/test` or `src/__tests__`.

For Expo Router, a fixture can also mean a small filesystem used to render routes in memory. Expo Router’s testing utilities support inline route maps, a path to a fixture directory, and fixture directories with route overrides. Test files must remain outside the `app` directory. See [Expo Router: Testing configuration](https://docs.expo.dev/router/reference/testing/).

## 3. Component and integration tests

Use React Native Testing Library when the question crosses a component boundary or includes user interaction:

- Does the login screen call the injected `AuthAdapter` with `signup` or `signin`?
- Does an auth error render the correct retry action?
- Does editing a profile load and save the current user’s data?
- Does a route transition land on the expected pathname and params?

Query in this order:

1. Role and accessibility label.
2. Label, placeholder, or visible text.
3. `testID` when a stable semantic query is not available.

The React Native Testing Library guidance explains the difference between `getBy`, `queryBy`, and `findBy` and recommends semantic queries before test IDs: [How should I query?](https://callstack.github.io/react-native-testing-library/docs/guides/how-to-query).

Example:

```tsx
test('retry repeats the same auth mode', async () => {
  const adapter = createAuthAdapter();
  adapter.authenticate
    .mockRejectedValueOnce(new AuthError('ACCOUNT_NOT_FOUND'))
    .mockResolvedValueOnce(createAuthSession());

  await render(<LoginScreen authAdapter={adapter} />);
  await fireEvent.press(screen.getByTestId('signin-button'));
  await screen.findByTestId('retry-button');
  await fireEvent.press(screen.getByTestId('retry-button'));

  expect(adapter.authenticate).toHaveBeenLastCalledWith('signin');
});
```

For native modules, mock the boundary and test that application code sends the correct arguments and handles success/failure. Expo’s guidance covers mocking native calls and recommends resetting mocks between tests: [Mocking native calls in Expo modules](https://docs.expo.dev/modules/mocking/).

For Router tests, use `renderRouter` and assert route state with matchers such as `toHavePathname`, `toHavePathnameWithParams`, `toHaveSegments`, and `useLocalSearchParams`. This is preferable to mocking `useRouter` for every test because it exercises the routing boundary in memory. See [Expo Router testing](https://docs.expo.dev/router/reference/testing/).

## 4. End-to-end tests

### Recommended tool: Maestro

Use Maestro as the first E2E tool for this Expo project. Expo provides a first-party EAS Workflows guide for Maestro, and Maestro’s React Native integration works at the accessibility/UI layer without adding an npm dependency to the app. Expo’s workflow guide describes Maestro flows for navigation and screen content against Android and iOS development builds: [Run E2E tests with Maestro on EAS Workflows](https://docs.expo.dev/tutorial/cicd/e2e-tests/).

Maestro’s React Native guide says it supports Expo Go, development builds, and EAS Workflows. For standalone/development builds, use `launchApp` with the application ID. For Expo Go, use `openLink` because the app is running inside the Expo container. See [Maestro: React Native](https://docs.maestro.dev/platform-support/react-native).

Start with flows for:

- app launch and unauthenticated login screen;
- onboarding step 1 → step 2 → step 3;
- profile save → return to profile → persisted values visible;
- logout → login screen;
- one failure/retry path.

Example flow shape:

```yaml
appId: com.kuquest.mobile.staging
---
- launchApp
- assertVisible: "KUQUEST"
- tapOn:
    id: "signin-button"
```

Add stable `testID` values to controls that need E2E interaction. Prefer IDs for E2E because visible text changes with localization; Maestro explicitly documents `testID` as the stable strategy. Avoid asserting implementation details such as a particular View hierarchy.

### Test environment boundaries

Do not make E2E flows depend on a developer’s personal account or production data. Use one of these explicit environments:

- a dedicated backend staging environment with seeded test accounts;
- a deterministic local/test backend;
- a test-only deep link or seed step that creates a known session.

For native Google OAuth, a real device flow is an external dependency and is usually a poor first E2E target. Keep Google SDK behavior covered by mocked unit/component tests, and use a controlled authenticated test entry point for profile/onboarding E2E coverage. This is a project recommendation, not a claim from the Expo docs.

### Detox alternative

Detox is a valid gray-box E2E framework for React Native and runs tests on a real device or simulator. However, Detox’s own documentation says Expo integration is community-driven and directs Expo users to Expo’s EAS/Detox guidance. Choose Detox when the team specifically needs Detox’s synchronization and gray-box capabilities; do not add it alongside Maestro without a concrete need. See [Detox: Getting started](https://wix.github.io/Detox/docs/introduction/getting-started/) and [Detox: Expo environment setup](https://wix.github.io/Detox/docs/introduction/environment-setup/).

## 5. Suggested rollout for KUQUest-Mobile

### Now

- Keep the current Jest suite green.
- Move repeated auth/profile factories into `src/test/fixtures`.
- Add Router integration tests for `/onboarding?step=2` and `/onboarding?mode=edit`.
- Add coverage collection as a separate CI command; do not enforce an arbitrary percentage until the baseline is measured.

### Next

- Add `.maestro/login.yaml`, `.maestro/onboarding.yaml`, and `.maestro/profile.yaml`.
- Add `testID` values to onboarding inputs, save buttons, and profile sections where localization makes text selectors brittle.
- Create a non-production test backend/session seed for authenticated E2E flows.

### CI

Run unit/component tests on every pull request. Run Maestro flows against development builds on pull requests that change app routes, native configuration, authentication, or profile/onboarding behavior. Expo’s EAS workflow guide identifies the Maestro job as alpha, so keep a local command and CI logs that can reproduce failures: [Expo E2E workflow guide](https://docs.expo.dev/tutorial/cicd/e2e-tests/).

## Avoid these patterns

- Production code that silently falls back to fake accounts when an API is unavailable.
- One enormous fixture object reused and mutated by multiple tests.
- Snapshot tests as the primary UI safety net; Expo recommends E2E tests over snapshot tests for UI testing.
- Testing navigation by asserting only that `router.push` was called when an in-memory Router test can assert the resulting path and params.
- E2E flows that use translated visible text everywhere instead of stable accessibility labels or IDs.
- Running E2E against production or a developer’s personal OAuth account.
