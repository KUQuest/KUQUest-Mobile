# KUQuest Mobile

KUQuest Mobile connects students and staff for on-campus peer tasks, powered by Expo, Native Google Sign-In, and Better Auth.

> [!IMPORTANT]
> Because native Google OAuth and secure session storage require custom native modules, this project runs exclusively via **Development Builds** (`--dev-client`), not standard Expo Go.

## 1. Local Backend Connection & Environment Setup

Create a `.env.local` file in the project root:

```env
# Backend API URL (Auto-updated to your local LAN IP on Metro start)
EXPO_PUBLIC_API_URL=http://localhost:5000

# Terms of Service version required by registration
EXPO_PUBLIC_TERMS_VERSION=v1.0

# Native Google OAuth Web Client ID
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com

# (Optional) iOS URL Scheme for Google Sign-In
# EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME=com.googleusercontent.apps.your-id
```

### Automatic LAN IP Resolution

Mobile emulators and physical devices cannot reach `localhost` directly on your host machine. Every time Metro starts (`bun run start` or `bun run dev:start`), the built-in script `scripts/update-api-env.js` automatically resolves your machine's active local IPv4 address and updates `EXPO_PUBLIC_API_URL` in `.env.local` (e.g. `http://192.168.1.50:5000`).

To manually refresh your local API address without starting Metro:

```bash
bun run update-api-env
```

## 2. Running the Project

### Prerequisites

- [Bun](https://bun.sh) (v1.2+)
- Android Studio with an Android Emulator or Xcode with iOS Simulator
- JDK 17 configured for Android builds

### Step 1: Install Dependencies

```bash
bun install
```

### Step 2: Build & Install Native Development Client

Because this project contains native modules (`@react-native-google-signin/google-signin`, `@expo/ui`, etc.), compile and install the development client once before launching Metro:

```bash
# For Android (automatically clears autolinking caches and builds for all architectures)
bun run dev:android

# For iOS
bun run dev:ios
```

### Step 3: Start Metro Development Server

Once the development client is installed on your emulator or connected device, start the Metro bundler:

```bash
bun run dev:start
```

> [!NOTE]
> `bun run dev:start` automatically runs `update-api-env` before launching Metro so your phone/emulator connects to your host machine's current local IP.

---

## 3. Standalone Offline Demo Mode

If you need to test the UI, Quest flows, or screen layouts without a running backend server, launch the app in seeded demo mode:

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
```

### Pre-commit Hooks

The repository uses **Husky** + **lint-staged** + **Prettier**. Every `git commit` automatically:

1. Runs Prettier formatting on all staged files.
2. Runs `bun run typecheck`.
3. Runs `bun run test`.
