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

After Metro starts, run `bun android` to build and install the development client on the selected Android device; use `bun ios` for the iOS development build. The development client is the **staging** variant (`org.kubits.kuquest.staging`, signed with the local debug key). The CI staging APK has the same package ID but a different signature, so uninstall one before installing the other.

### Android Google Sign-In

Android sign-in requires one Google Cloud **Android** OAuth client per package ID and signing key: `org.kubits.kuquest.staging` twice (the CI staging keystore, and the local debug key used by the development client, see `run.md`) and `org.kubits.kuquest.uat` once (the UAT keystore). `EXPO_PUBLIC_GOOGLE_CLIENT_ID` must remain the **Web** OAuth client ID and must include the `.apps.googleusercontent.com` suffix.

Each GitHub Environment holds its own signing key. Generate it, register its SHA-1 with Google, then upload the secrets (`--help` lists the options):

```bash
node scripts/bootstrap-android-signing.js generate --environment staging --keystore /secure/kuquest-staging.jks
node scripts/bootstrap-android-signing.js generate --environment uat --keystore /secure/kuquest-uat.jks
node scripts/bootstrap-android-signing.js upload --environment uat --keystore /secure/kuquest-uat.jks
```

After changing OAuth configuration or signing keys, rebuild and reinstall the native app. Existing APKs do not receive native OAuth configuration changes from JavaScript updates.

### Build variants and environments

The two variants mirror the backend environments and install side by side, because each has its own package ID.

| Variant   | Package ID                   | API                                  | Built by                                                                                                                                    |
| --------- | ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `staging` | `org.kubits.kuquest.staging` | `https://kuquest-dev-api.kubits.org` | `bun android` / `bun ios` (development client, debug key); `android-staging.yml` on every push to `develop` (release APK, staging keystore) |
| `uat`     | `org.kubits.kuquest.uat`     | `https://uat.api.kubits.org`         | `android-uat.yml` on every push to `main` (release APK, UAT keystore)                                                                       |

- CI builds run on a self-hosted runner (labels `self-hosted, linux, x64, android`) on the build server, provisioned by `scripts/provision-android-runner.sh`. `android-apk-build.yml` is the shared build; it reads variables and secrets from the GitHub Environment its caller names (`staging`, `uat`), and its `Validate build configuration` step lists the required names and fails fast when one is missing. The `uat` Environment accepts deployments from `main` only.
- Each publish job replaces a rolling prerelease (`staging-latest`, `uat-latest`) with the new APK and its `.sha256`.
- `staging` and `uat` take `versionCode` from the workflow run number; a local `expo start` without `APP_VARIANT` keeps the `app.json` value.

#### Promoting `develop` to `main`

`main` is not a descendant of `develop` and only squash merges are enabled, so a plain `develop` to `main` pull request conflicts. From a clean checkout (`git read-tree -u --reset` overwrites tracked files), open the promotion from a branch based on `main` whose tree equals `develop`:

```bash
git fetch origin
git switch -c release/promote-develop origin/main
git read-tree -u --reset origin/develop
git commit -m "chore(release): promote develop to main"
git push -u origin release/promote-develop   # then open a pull request into main
```

Merging it pushes to `main`, which starts the UAT build.

### Android download page

`download-page/` is a static page (no build step) that lists the rolling `uat-latest` and `staging-latest` prereleases published by the UAT and staging workflows (see [Build variants and environments](#build-variants-and-environments)). APKs download straight from GitHub.

Each card shows version, build, package ID, commit, the commit subject and a link to the build log (both written into the release notes by the publish job), size, date, SHA-256, a download button and a QR code for the APK link. The page re-checks every 5 minutes while it is open. The QR encoder is vendored in `download-page/vendor/` (qrcode-generator 1.5.2, MIT).

It is hosted by nginx on the build server (`192.168.1.101`, LAN only). nginx serves the files and proxies `/api/uat-latest` and `/api/staging-latest` to the GitHub release API with a one-minute cache, so visitors share one GitHub request per minute instead of the 60 per hour per IP limit. Deploy or update it from a checkout:

```bash
ssh root@192.168.1.101 'mkdir -p /var/www/kuquest-download/vendor /var/cache/nginx /etc/nginx/snippets'
scp download-page/{index.html,app.js,release.js,style.css,favicon.svg} root@192.168.1.101:/var/www/kuquest-download/
scp download-page/vendor/qrcode.js root@192.168.1.101:/var/www/kuquest-download/vendor/
scp download-page/kuquest-release-proxy.conf root@192.168.1.101:/etc/nginx/snippets/
scp download-page/nginx.conf root@192.168.1.101:/etc/nginx/sites-available/kuquest-download
ssh root@192.168.1.101 'chmod -R a+rX /var/www/kuquest-download && ln -sf /etc/nginx/sites-available/kuquest-download /etc/nginx/sites-enabled/ && rm -f /etc/nginx/sites-enabled/default && nginx -t && systemctl reload nginx'
```

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
