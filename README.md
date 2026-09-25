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

### Realtime connections

- Work Chat and Candidate Inquiry use authenticated WebSocket endpoints: `/v1/chat/conversations/:conversationId/events` and `/v1/chat/candidate-inquiries/:conversationId/events`. Connected clients send messages over WebSocket; REST remains send fallback when disconnected.
- Authorized Quest readers subscribe to `/api/v2/quests/:questId/events`; Hirers who can select Candidates and Candidate Team Members subscribe to `/api/v2/quests/:questId/candidate-roster/events`. Both read-only streams refresh authoritative REST snapshots after accepted `SUBSCRIBED` messages, matching updates, and reconnects.
- Any authenticated Member can subscribe to read-only `/api/v2/quests/board/events`. `QUEST_BOARD_INVALIDATED` carries a Quest ID, not a Board Card; Board query owners refetch filtered `GET /api/v2/quests` results after accepted subscriptions, invalidations, and reconnects.
- HTTPS API origins map to WSS. The app authenticates sockets with its current session cookie. `/health/ws` is an operational health endpoint; the app does not poll it.

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

To choose a connected Android device before building and installing, run `./scripts/android-device.sh`. It lists authorized devices and passes your selection to `bun android`. `bun android` by itself also prompts when multiple devices are online.

Apps already connected to the same Metro server receive the same JavaScript updates; this picker only targets the native build/install to the selected device.
The picker already opens the selected device. In an Expo terminal, lowercase `a` opens on the first Android device (often an emulator); press `Shift+A` only if you need to choose a different device to open.

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

### Debugging API traffic

Development builds print API diagnostics to the Metro terminal through `debugLog` (`src/api/debugLog.ts`); release builds and Jest stay silent:

- `[api]` — every REST request: method, path, status, duration, and error `code` on failure.
- `[socket]` — WebSocket open, close (code, reason, terminal, next attempt), and not-started reasons.
- `[query]` / `[mutation]` — every failed TanStack query or mutation with its key, including response-schema (Zod) issue paths.

Logs never include cookies, request or response bodies, or signed-URL query strings.

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
