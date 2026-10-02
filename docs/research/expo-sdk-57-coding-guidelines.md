# Expo SDK 57 coding guidelines

**Repository:** KUQUest-Mobile  
**Research date:** 2026-08-11  
**Scope:** Expo SDK `57.0.0`, with guidance applied to this repository's Expo Router app.

## Recommended team rules

### 1. Treat the Expo SDK as a compatibility unit

Keep `expo`, React Native, React, React Native Web, and Expo SDK packages on the versions supported by SDK 57. SDK 57 targets React Native `0.86`, React `19.2.3`, React Native Web `0.21.0`, and Node.js `22.13.x` or newer in the supported line. Its documented platform baseline is Android 7+, Android compile/target SDK 36, iOS 16.4+, and Xcode 26.4+. ([SDK reference](https://docs.expo.dev/versions/v57.0.0/))

Use Expo's installer for Expo and React Native packages:

```sh
npx expo install <package>
npx expo install --check
npx expo-doctor
```

The installer and Doctor validate package compatibility; use `--fix` only as an intentional dependency update. Do not manually force a package version that Expo reports as incompatible without recording why. ([SDK reference](https://docs.expo.dev/versions/v57.0.0/), [package.json reference](https://docs.expo.dev/versions/v57.0.0/config/package-json/))

### 2. Keep navigation in Expo Router's file-system model

This project uses Expo Router. Every file under `src/app` is a route, `src/app/_layout.tsx` is the root layout and initialization boundary, and reusable non-route components belong outside `src/app`. ([Router core concepts](https://docs.expo.dev/router/basics/core-concepts/))

Prefer imports from `expo-router`. In SDK 56 and later, application code should not import navigation APIs directly from external `@react-navigation/*` packages; use the corresponding Expo Router entry points instead. ([SDK 57 Expo Router reference](https://docs.expo.dev/versions/v57.0.0/sdk/router/))

Keep typed routes enabled and treat route changes as typed API changes: update the file tree and fix resulting type errors rather than passing arbitrary strings around. This repository already enables `experiments.typedRoutes` in [`app.json`](../../app.json).

### 3. Put native configuration in app config and plugins

Use [`app.json`](../../app.json) for build-time identity, platform settings, schemes, assets, permissions, and config plugins. A value in app config is not a runtime substitute for JavaScript configuration: for example, a URL `scheme` is build-time configuration and has no effect in Expo Go. ([app config reference](https://docs.expo.dev/versions/v57.0.0/config/app/))

When a library needs native configuration, prefer its official config plugin and rebuild the development client after changing the native dependency or app config. Config-plugin changes are applied during prebuild; they are not made available by refreshing an existing Expo Go installation. ([app config reference](https://docs.expo.dev/versions/v57.0.0/config/app/), [development builds](https://docs.expo.dev/develop/development-builds/use-development-builds/))

For permission-sensitive APIs, request permission at the user-action boundary and handle denial/cancellation explicitly. For this repository's image-picker usage, the SDK 57 docs note that its plugin controls native permission messages and that Android adds `RECORD_AUDIO` by default unless `microphonePermission` is disabled. Review that setting before shipping. ([ImagePicker reference](https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/))

### 4. Keep secrets out of the client bundle

Expo inlines variables named `EXPO_PUBLIC_*` into application code. Treat every such value, and values exposed through app config `extra`, as public. Never put passwords, private signing material, or server credentials in them. Use a server for secrets; use EAS secret variables only for values needed by EAS build/workflow jobs and never assume a value embedded in the client remains secret. ([Environment variables in Expo](https://docs.expo.dev/guides/environment-variables/), [EAS environment variables](https://docs.expo.dev/eas/environment-variables/))

Keep local environment files out of version control, especially `.env*.local`, and use direct static references such as `process.env.EXPO_PUBLIC_API_URL` when a value is intentionally public. Clear Metro's cache after changing environment or bundler configuration. ([Metro reference](https://docs.expo.dev/versions/v57.0.0/config/metro/), [Environment variables in Expo](https://docs.expo.dev/guides/environment-variables/))

Use `expo-secure-store` for small sensitive values that belong on the device, such as session material, and keep a deliberate fallback for platforms or test environments where native secure storage is unavailable. Native modules require a compatible development build. ([Expo SDK reference](https://docs.expo.dev/versions/v57.0.0/), [development builds](https://docs.expo.dev/develop/development-builds/use-development-builds/))

### 5. Design for platform differences deliberately

Expo targets Android, iOS, and web, but a native API is not automatically equivalent on all three. Keep platform-specific behavior at a clear boundary, use platform file extensions where appropriate, and test the user-facing permission and cancellation paths on each supported platform. For example, ImagePicker calls on mobile web must happen directly from a user interaction, while native permission behavior differs by platform. ([ImagePicker reference](https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/), [Metro reference](https://docs.expo.dev/versions/v57.0.0/config/metro/))

Do not introduce web-only global CSS into shared native UI. Expo's SDK 57 Metro reference describes global CSS and CSS Modules as web-only, and recommends importing global CSS from the root layout when using Expo Router. ([Metro reference](https://docs.expo.dev/versions/v57.0.0/config/metro/))

### 6. Verify changes with the repository's checks

For each feature or native/configuration change, run the smallest relevant checks and then the full project checks before handoff:

```sh
npm run lint
npm run typecheck
npm test -- --runInBand
npx expo-doctor
```

This repository already uses `eslint-config-expo`, `jest-expo`, TypeScript, and a Jest preset configured in [`package.json`](../../package.json). Expo's Jest guide recommends `jest-expo` because it mocks native Expo APIs and supplies the Expo test configuration. ([Unit testing with Jest](https://docs.expo.dev/develop/unit-testing/))

After changing Metro, Babel, or environment configuration, rerun the relevant command with `npx expo start --clear`. ([Metro reference](https://docs.expo.dev/versions/v57.0.0/config/metro/))

### 7. Rebuild when the native runtime changes

JavaScript and asset-only changes can be refreshed in a development build, but adding or updating native libraries, changing app config, changing native code, or upgrading the Expo SDK requires a new native build. Do not use an old development client to validate a new native dependency. ([development builds](https://docs.expo.dev/develop/development-builds/use-development-builds/))

If the project adopts EAS Update, keep the JavaScript bundle compatible with the installed native runtime. Configure and review `runtimeVersion` whenever the native API surface changes; Expo documents runtime versions as the compatibility boundary between a build and an OTA update. ([SDK 57 updates reference](https://docs.expo.dev/versions/v57.0.0/sdk/updates/), [runtime versions and updates](https://docs.expo.dev/eas-update/runtime-versions/))

## Repository-specific follow-ups

- The dependency set in [`package.json`](../../package.json) is already centered on Expo 57, React Native `0.86.2`, and React `19.2.3`; run `npx expo-doctor` and `npx expo install --check` before changing those versions.
- The app config already includes the Expo Router plugin, typed routes, and React Compiler. Keep route files under [`src/app`](../../src/app) and feature components outside it.
- `expo-image-picker` is used in onboarding but is not currently listed in [`app.json`](../../app.json)'s plugin array. Before release, decide explicitly whether its config plugin is needed and review the default microphone permission described in the SDK 57 reference.
- SecureStore is used by the authentication and profile code. Validate those paths in a development build as well as Jest/web fallback paths.

## Source boundary

This note uses Expo's official versioned SDK 57 documentation for SDK, configuration, Router, Metro, ImagePicker, and Updates behavior. The environment-variable, development-build, runtime-version, and Jest pages are Expo's first-party guides; where a guide is not versioned, verify it again when upgrading the SDK.
