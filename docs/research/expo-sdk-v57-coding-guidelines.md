# Expo SDK 57 coding guidelines for KUQUest Mobile

**Research date:** 2026-08-11  
**Scope:** This repository, Expo SDK `57.0.0`, and first-party Expo documentation only.

## How to read this report

- **Expo requirement** means behavior or compatibility stated by Expo.
- **Team rule** means an actionable convention proposed for this repository.
- **Repo observation** records the current state without changing it.
- **Inference** is a project-specific conclusion derived from an Expo source and is not an Expo requirement.

The SDK baseline comes from the [exact Expo SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/). The procedural pages for environment variables, permissions, testing, development builds, EAS, and upgrades are linked from Expo's current first-party guides where the v57 archive does not provide a versioned workflow page; re-check those links when the SDK changes.

## Current project baseline

- **Repo observation:** The project uses Expo Router through [`main: "expo-router/entry"`](../../package.json), keeps routes in [`src/app`](../../src/app), and keeps reusable UI and feature code outside the route tree. [`tsconfig.json`](../../tsconfig.json) already maps `@/*` to `src/*`, matching Expo Router's documented top-level `src` setup ([top-level `src` directory](https://docs.expo.dev/router/reference/src-directory/)).
- **Repo observation:** The app config is the root [`app.json`](../../app.json), with `expo-router`, splash screen, font, localization, date-time picker, and web-browser plugins. The repository also enables `typedRoutes` and `reactCompiler` under `experiments` ([app config reference](https://docs.expo.dev/versions/v57.0.0/config/app/)).
- **Repo observation:** The manifest pins Expo `~57.0.9`, React Native `0.86.2`, React `19.2.3`, React Native Web `~0.21.0`, and Expo Router `~57.0.9` ([`package.json`](../../package.json)). The repo has a committed [`bun.lock`](../../bun.lock) and no `eas.json` ([root file list](../../)).
- **Repo observation:** Tests are under [`src/__tests__`](../../src/__tests__) rather than `src/app`, and Jest uses the `jest-expo` preset ([`package.json`](../../package.json)). This matches Expo Router's testing constraint that route directories contain routes/layouts, not test files ([Expo Router testing](https://docs.expo.dev/router/reference/testing/)).

## 1. SDK and runtime compatibility

### Team rules

1. Treat SDK 57 as one compatibility set. Expo documents SDK `57.0.0` with React Native `0.86`, React `19.2.3`, React Native Web `0.21.0`, and minimum Node.js `22.13.x`; it documents Android 7+, compile/target SDK 36, iOS 16.4+, and Xcode 26.4+ ([SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/)). Do not independently upgrade React Native, React, or the native toolchain outside an SDK upgrade decision.
2. Install Expo and React Native libraries with `npx expo install`, not a raw package-manager add, because Expo CLI selects a compatible version and warns about known incompatibilities ([using libraries](https://docs.expo.dev/workflow/using-libraries/)). Keep the repository's existing package manager/lockfile convention ([`bun.lock`](../../bun.lock)) consistent in team and CI workflows ([`package.json`](../../package.json)).
3. After dependency changes, run `npx expo install --fix` and `npx expo-doctor`; Expo documents these as the dependency-alignment and common-problem checks during upgrades ([upgrade Expo SDK](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)).
4. Review the recommended patch versions in the [SDK 57 module reference](https://docs.expo.dev/versions/v57.0.0/), rather than assuming every `57.x` package is interchangeable. The current manifest is broadly aligned with the SDK matrix, but its Expo Router version should be checked with `expo install --fix` against the reference before a release ([`package.json`](../../package.json), [SDK 57 Expo Router reference](https://docs.expo.dev/versions/v57.0.0/sdk/router/)).

### Do not confuse JavaScript compatibility with native compatibility

**Expo requirement:** A JavaScript update published to a binary with an incompatible native runtime can fail or crash. Expo recommends a different runtime version for each binary version and says to increment it whenever native runtime changes—for example, when adding/removing a native library or modifying `app.json` ([EAS Update: binary compatibility](https://docs.expo.dev/build/updates/)).

**Team rule:** Before using EAS Update, define and review `runtimeVersion` in [`app.json`](../../app.json). Treat changes to config plugins, native dependencies, permissions, schemes, and other native configuration as requiring a new development/preview build and a runtime-version decision, not as ordinary OTA-only changes ([`runtimeVersion` reference](https://docs.expo.dev/versions/v57.0.0/config/app/), [development builds](https://docs.expo.dev/develop/development-builds/introduction/)).

## 2. Project structure and navigation

### Team rules

- Keep all route files and `_layout.tsx` files in [`src/app`](../../src/app). Expo Router says every file there is treated as a route except special layout files, and `src/app/index.tsx` is the initial `/` route ([Router core concepts](https://docs.expo.dev/router/basics/core-concepts/)).
- Keep components, hooks, API clients, repositories, types, and test fixtures outside `src/app`, such as the repository's [`src/components`](../../src/components) and [`src/features`](../../src/features). Expo Router explicitly reserves `src/app` for navigation routes; a non-route placed there may be treated as a route ([Router core concepts](https://docs.expo.dev/router/basics/core-concepts/)).
- Keep `app.json`, `package.json`, and `tsconfig.json` at the project root. Expo's top-level `src` guidance says root config files remain at the root and that `src/app` takes precedence over a root `app` directory ([top-level `src` directory](https://docs.expo.dev/router/reference/src-directory/)). Do not add a second route tree.
- Use Expo Router entry points (`Stack`, `Tabs`, `Link`, `useRouter`, and related APIs) for application navigation. In SDK 56 and later, the SDK 57 Router reference says application code should not import external `@react-navigation/*` packages; use matching Expo Router entry points instead ([SDK 57 Router reference](https://docs.expo.dev/versions/v57.0.0/sdk/router/)).
- Put initialization that must happen before routes—font loading, splash-screen coordination, and providers—in [`src/app/_layout.tsx`](../../src/app/_layout.tsx). Expo Router documents the root layout as the pre-route initialization point ([Router core concepts](https://docs.expo.dev/router/basics/core-concepts/), [navigation layouts](https://docs.expo.dev/router/basics/navigation-layouts/)).
- Add a nested `_layout.tsx` only when a directory genuinely needs its own navigator or access boundary. Expo's navigation guide warns that unnecessary nested navigators add another stack rather than merely grouping URLs ([navigation layouts](https://docs.expo.dev/router/basics/navigation-layouts/)).
- Keep `typedRoutes` enabled only while the team can run the generated route typing successfully; it is already enabled in [`app.json`](../../app.json). Expo's SDK 57 config reference classifies the `experiments` area as potentially unstable, unsupported, or removable without deprecation notice ([app config reference](https://docs.expo.dev/versions/v57.0.0/config/app/)).

## 3. App configuration and native changes

**Expo requirement:** `app.json`/`app.config.*` configures Prebuild, Expo Go loading, and the OTA update manifest, and it must be next to `package.json` at the project root ([app config guide](https://docs.expo.dev/workflow/configuration/)). Config plugins are primarily used by `npx expo prebuild` and modify native build configuration ([app config guide](https://docs.expo.dev/workflow/configuration/), [SDK 57 app config reference](https://docs.expo.dev/versions/v57.0.0/config/app/)).

### Team rules

- Keep native behavior declarative in [`app.json`](../../app.json) or a reviewed config plugin. When adding a native package, check its SDK 57 reference for a config plugin and document any non-default option in the same change ([SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/)).
- Never put private keys, server credentials, or other sensitive values in `extra`, `app.json`, or `app.config.*`. Most app config is available at runtime through `Constants.expoConfig`; Expo recommends `npx expo config --type public` to inspect what will be embedded and says not to import the raw config file into application code ([app config guide](https://docs.expo.dev/workflow/configuration/)).
- Treat `scheme`, bundle identifiers, package names, version numbers, icons, splash configuration, permissions, and config-plugin changes as release-affecting native configuration. The SDK 57 config reference identifies these as app-config/native-build properties ([SDK 57 app config reference](https://docs.expo.dev/versions/v57.0.0/config/app/)).
- Keep the `experiments` section small and intentional. Each experimental flag should have a short reason and an upgrade check because Expo does not promise stable support for those flags ([SDK 57 app config reference](https://docs.expo.dev/versions/v57.0.0/config/app/)).

## 4. Assets, fonts, and splash screens

- Store shipped images, fonts, and sounds in the repository's [`assets/`](../../assets) tree and reference static files with `require(...)` or app-config paths. Expo's SDK 57 asset reference says its asset system supports files alongside app source and that static image resources can be referenced this way ([SDK 57 Asset reference](https://docs.expo.dev/versions/v57.0.0/sdk/asset/)).
- Keep app icon, adaptive icon, favicon, and splash assets in [`app.json`](../../app.json) and verify them in a native build. The SDK 57 config reference documents local asset paths for icons, while the splash-screen package uses build-time config-plugin settings ([SDK 57 app config reference](https://docs.expo.dev/versions/v57.0.0/config/app/), [SDK 57 SplashScreen reference](https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/)).
- Load custom fonts before rendering the route tree and coordinate hiding the splash screen from the root layout; this is the pattern shown by Expo Router's navigation-layout guide ([navigation layouts](https://docs.expo.dev/router/basics/navigation-layouts/)).
- **Inference for this repo:** Because [`src/app/_layout.tsx`](../../src/app/_layout.tsx) is the root initialization point and the manifest uses `expo-font` and `expo-splash-screen` plugins ([`app.json`](../../app.json)), font/splash changes should be tested in a development build, not only in a hot-reloaded JavaScript session ([development builds](https://docs.expo.dev/develop/development-builds/introduction/)).

## 5. Permissions and platform behavior

**Expo requirement:** Native standalone/development builds need build-time permission configuration before JavaScript can request the permission. Libraries often add Android permissions automatically; `android.permissions` adds missing permissions and `android.blockedPermissions` removes permissions introduced by package manifests. iOS permission messages belong in `ios.infoPlist` or the relevant library config plugin, and Info.plist changes require a new native binary rather than an OTA update ([permissions guide](https://docs.expo.dev/guides/permissions/), [SDK 57 app config reference](https://docs.expo.dev/versions/v57.0.0/config/app/)).

### Team rules

- For every feature that accesses photos, camera, microphone, location, notifications, or similar data, document: why it is needed, the runtime request path, the denial/restriction behavior, and the native config/plugin that supplies the platform declaration ([permissions guide](https://docs.expo.dev/guides/permissions/)).
- Review the generated permission set after adding a native library. Do not add broad permissions pre-emptively; block an automatically-added permission when the feature does not use it ([permissions guide](https://docs.expo.dev/guides/permissions/)).
- This project uses [`expo-image-picker`](../../package.json) in onboarding. Its SDK 57 reference says the config plugin adds `RECORD_AUDIO` on Android by default and supports `microphonePermission: false`; if this app only selects images, explicitly review that permission before shipping ([SDK 57 ImagePicker reference](https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/)).
- Request permission in response to the feature action and handle `granted`, denial, cancellation, and limited access. For image picking, use the library's permission APIs where needed and handle a canceled result whose assets are `null` ([SDK 57 ImagePicker reference](https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/)).
- Test permission denial and “already denied” paths by reinstalling the native app when necessary; the operating systems may not show the same permission prompt repeatedly ([permissions guide](https://docs.expo.dev/guides/permissions/)).

## 6. Environment variables and secrets

- Use `EXPO_PUBLIC_*` only for values that are safe to expose to every person who can install or inspect the client. Expo inlines these values into the application bundle and explicitly says not to store sensitive information there ([environment variables](https://docs.expo.dev/guides/environment-variables/)).
- Keep server secrets on the backend. For build/CI-only values, use EAS Environment Variables with the narrowest visibility; Expo says secret visibility protects values on EAS servers but provides no protection once a value is embedded in client code ([EAS environment variables](https://docs.expo.dev/eas/environment-variables/)).
- Use static dot notation such as `process.env.EXPO_PUBLIC_API_URL`; Expo CLI does not inline bracket notation or destructured environment access ([environment variables](https://docs.expo.dev/guides/environment-variables/)). The repository already follows this form in [`AuthService.ts`](../../src/features/auth/AuthService.ts).
- Do not overload `NODE_ENV` to select staging/production `.env` files. Expo documents surprising behavior because export and EAS Update force production semantics; use standard `.env` precedence or EAS environment selection instead ([environment variables](https://docs.expo.dev/guides/environment-variables/)).
- **Repo observation:** [` .gitignore`](../../.gitignore) ignores `.env`, `.env.example`, and `.env*.local`. If the team wants a checked-in, non-secret variable contract, add a sanitized example deliberately and adjust the ignore rule in a separate configuration change; this is repository policy, not an Expo requirement ([environment variables](https://docs.expo.dev/guides/environment-variables/)).

## 7. Testing and verification

- Use `jest-expo` as the Jest preset and `@testing-library/react-native` for component behavior. Expo's unit-testing guide says `jest-expo` mocks native Expo SDK parts and handles most setup; it also identifies React Native Testing Library as the supported component-testing path ([unit testing with Jest](https://docs.expo.dev/develop/unit-testing/)).
- Keep route integration tests outside [`src/app`](../../src/app), and use `expo-router/testing-library` when testing navigation, URLs, layouts, or route transitions. Expo provides `renderRouter` for an in-memory Router filesystem ([Expo Router testing](https://docs.expo.dev/router/reference/testing/)).
- **Repo observation:** [`package.json`](../../package.json) still includes `react-test-renderer` while the project uses React 19. The current Expo testing guide says `@testing-library/react-native` replaces the deprecated renderer because it does not support React 19+; confirm no test needs it before removing it in a focused dependency change ([unit testing with Jest](https://docs.expo.dev/develop/unit-testing/), [`package.json`](../../package.json)).
- Make the repository's existing checks part of the definition of done: `bun run lint`, `bun run typecheck`, and `bun run test` (or the equivalent command for the chosen package manager) ([`package.json`](../../package.json)). Add a development-build smoke check for changes involving native modules, permissions, config plugins, deep links, or the splash screen ([development builds](https://docs.expo.dev/develop/development-builds/introduction/)).

## 8. Development builds, release builds, and updates

- Use Expo Go for lightweight JavaScript exploration only. Expo describes a development build as a project-specific Expo Go that can use native libraries and native configuration, and recommends development builds for apps intended for app-store release ([development builds](https://docs.expo.dev/develop/development-builds/introduction/)). **Inference for this repo:** the native Google Sign-In dependency and multiple native Expo modules make a development-build workflow the safer team default ([`package.json`](../../package.json)).
- Use EAS Build for reproducible Android/iOS binaries, internal distribution, and production builds. Expo documents cloud builds, signing management, build profiles in `eas.json`, and internal distribution as supported EAS workflows ([EAS Build](https://docs.expo.dev/build/introduction/)).
- Before an OTA update, verify that the target binary's runtime version is compatible. A native dependency or app-config change requires a new build and a runtime-version update decision ([EAS Update](https://docs.expo.dev/build/updates/), [runtimeVersion reference](https://docs.expo.dev/versions/v57.0.0/config/app/)).
- **Repo recommendation:** Add reviewed development/preview/production EAS profiles before the first shared build, because the current repo has no `eas.json` ([root file list](../../), [EAS Build profiles](https://docs.expo.dev/build/introduction/)). This report does not create that file.

## 9. Upgrade discipline

1. Upgrade one Expo SDK at a time; Expo recommends incremental upgrades so breakages are attributable ([upgrade Expo SDK](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)).
2. Read the target SDK's versioned reference and release notes, then update the `expo` package and aligned dependencies with `npx expo install --fix`; run `npx expo-doctor` ([SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/), [upgrade walkthrough](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)).
3. Rebuild native projects after native changes. Expo's upgrade guide distinguishes CNG/prebuild projects from projects that maintain native directories and calls out native project updates as a separate upgrade step ([upgrade walkthrough](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)). This repo ignores generated `/ios` and `/android` directories ([`.gitignore`](../../.gitignore)), so confirm the CNG assumption before changing native files.
4. Re-run lint, typecheck, unit tests, route tests, permission flows, and a development/preview build. This combines the repository's scripts ([`package.json`](../../package.json)) with Expo's documented development-build and testing workflows ([development builds](https://docs.expo.dev/develop/development-builds/introduction/), [unit testing with Jest](https://docs.expo.dev/develop/unit-testing/)).
5. Do not publish an OTA update that expects native APIs unavailable in the installed binary; update `runtimeVersion` and ship the compatible binary first ([EAS Update](https://docs.expo.dev/build/updates/)).

## Release checklist

- [ ] `expo`, React Native, React, React Native Web, Expo Router, Node, and platform toolchain match the SDK 57 matrix ([SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/)).
- [ ] `npx expo install --fix` and `npx expo-doctor` pass ([using libraries](https://docs.expo.dev/workflow/using-libraries/), [upgrade walkthrough](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)).
- [ ] Routes remain under `src/app`; tests and non-route code remain outside it ([Router core concepts](https://docs.expo.dev/router/basics/core-concepts/), [Expo Router testing](https://docs.expo.dev/router/reference/testing/)).
- [ ] App config is reviewed as public/native configuration; no secrets are committed or embedded ([app config guide](https://docs.expo.dev/workflow/configuration/), [environment variables](https://docs.expo.dev/guides/environment-variables/)).
- [ ] Permissions are justified, accurately messaged, and checked in a fresh native install ([permissions guide](https://docs.expo.dev/guides/permissions/)).
- [ ] Asset, font, splash, deep-link, and config-plugin changes have been tested in a development or preview build ([SDK 57 Asset reference](https://docs.expo.dev/versions/v57.0.0/sdk/asset/), [development builds](https://docs.expo.dev/develop/development-builds/introduction/)).
- [ ] `bun run lint`, `bun run typecheck`, and `bun run test` pass, or the team has explicitly documented the chosen package-manager equivalent ([`package.json`](../../package.json)).
- [ ] Any OTA update has a compatible runtime version; native changes have a new binary ([EAS Update](https://docs.expo.dev/build/updates/)).
