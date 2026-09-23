# KUQuest Mobile

KUQuest Mobile connects students and staff for on-campus peer tasks, powered by Expo, Native Google Sign-In, and Better Auth.

> [!IMPORTANT]
> Because native Google OAuth and secure session storage require custom native modules, this project runs exclusively via **Development Builds** (`--dev-client`), not standard Expo Go.

## 1. Staging-only environment setup

The mobile app must connect to the remote **develop staging API**:

```text
https://kuquest-dev-api.kubits.org
```

Do **not** run the local API. The mobile app's local API/LAN setup will not work for the normal development flow. Use `bun run staging:start` for the staging API; `bun run dev:local` is only for explicitly requested local-LAN work.

Create `.env.local` in the project root by copying the template:

```bash
cp .env.example .env.local
```

Your `.env.local` should contain:

```env
# Remote develop staging backend
EXPO_PUBLIC_API_URL=https://kuquest-dev-api.kubits.org

# Terms of Service version required by registration
EXPO_PUBLIC_TERMS_VERSION=v1.0

# Native Google OAuth Web Client ID
EXPO_PUBLIC_GOOGLE_CLIENT_ID=673221928877-d133t4thj3ipo94a3kfj4vle2hokmbi4.apps.googleusercontent.com
```

`.env.local` is ignored by Git. Never commit credentials or other private values to the repository.

> **Important:** `bun run staging:start` intentionally ignores dotenv files and requires the three staging variables in its environment. Load the `.env.local` values into the current terminal before starting Metro:

```bash
set -a
source .env.local
set +a
```

## 2. Running the Project

### Prerequisites

- [Bun](https://bun.sh) v1.2+
- Android Studio with an Android Emulator, or Xcode with an iOS Simulator
- JDK 17 for Android builds
- A native Development Build; Expo Go is not supported

### Step 1: Install dependencies

```bash
bun install
```

### Step 2: Build and install the native Development Build

This project uses native modules, including Google Sign-In and `@expo/ui`. Build the native client before starting Metro:

```bash
# Android
bun android

# iOS
bun ios
```

Do not open the project in Expo Go. Expo Go cannot load the native modules used by this app.

### Step 3: Start Metro against staging

In the terminal where the `.env.local` values were loaded:

```bash
bun run staging:start
```

This command:

- Connects Metro to `https://kuquest-dev-api.kubits.org`
- Forces the `staging` app variant
- Rejects local HTTP/LAN API URLs
- Does not run the local API updater

### Step 4: Launch the app

After Metro starts, run `bun android` to build and install the debug development client on the selected Android device; use `bun ios` for the iOS development build.

### Android Google Sign-In

Android staging sign-in requires a Google Cloud **Android** OAuth client for package `com.kuquest.mobile.staging` and the SHA-1 fingerprint of the staging signing key. `EXPO_PUBLIC_GOOGLE_CLIENT_ID` must remain the **Web** OAuth client ID and must include the `.apps.googleusercontent.com` suffix.

For staging APK signing setup:

```bash
node scripts/bootstrap-android-signing.js generate \
  --environment staging \
  --keystore /secure/kuquest-staging.jks
```

After changing OAuth configuration or signing keys, rebuild and reinstall the native app. Existing APKs do not receive native OAuth configuration changes from JavaScript updates.

### Verify the staging backend

Optional endpoint and account verification:

```bash
bun run verify:staging
```

This checks the staging health endpoint and the configured Quest, wallet, and Work Chat API surfaces.

---

## 3. Standalone Offline Demo Mode

If you need to test the UI, Quest flows, or screen layouts without any backend connection, launch the app in seeded demo mode:

```bash
bun run demo:start
```

- **Features**: Includes Quest Board, Quest Details, My Quests, Team Assembly, and Chat with mock data and local SQLite/memory persistence.
- **Switch Test Accounts on Android**:
  ```bash
  bun run demo:android:account
  ```

---

## 4. Code Quality & Testing

### Verification Scripts

```bash
# Typecheck TypeScript definitions
bun run typecheck

# Run Jest unit and component test suite
bun run test

# Lint source files with Expo ESLint
bun run lint

# Full static, lint, formatting, route, NativeWind, and Jest verification
bun run verify
```

### Pre-commit Hooks

The repository uses **Husky** + **lint-staged** + **Prettier**. Every `git commit` automatically:

1. Runs Prettier formatting on all staged files.
2. Runs the NativeWind and route audits.
3. Runs `bun run typecheck`.
4. Runs `bun run lint` with the repository warning budget.
5. Runs `bun run test`.
