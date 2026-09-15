# Running KUQuest Mobile (Staging & Local Development)

This guide documents the exact commands, configuration, and verification steps to run `KUQUest-Mobile` against the remote develop staging backend.

---

## 1. Environment Configuration

The app MUST target the remote develop staging API. Copy `.env.example` to `.env.local` and keep the values aligned with this template:

```ini
# Remote develop staging backend
EXPO_PUBLIC_API_URL=https://kuquest-dev-api.kubits.org

# Terms version required by Academic Registration
EXPO_PUBLIC_TERMS_VERSION=v1.0

# Google OAuth Web Client ID
EXPO_PUBLIC_GOOGLE_CLIENT_ID=673221928877-d133t4thj3ipo94a3kfj4vle2hokmbi4.apps.googleusercontent.com
```

> **Important**: `scripts/update-api-env.js` is guarded and will **not** overwrite remote HTTPS URLs. Do not run `bun run dev:start` for staging; that command is for local-LAN development. Use `bun run staging:start`. To force local LAN development, run `bun run dev:local`.

---

## 2. Workstation Prerequisites (Android SDK)

Set the Android SDK path in your shell session:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator
```

---

## 3. How to Run the App (Step-by-Step)

### Step 1: Start the Android Emulator

Launch the configured virtual device in the background:

```bash
$HOME/Android/Sdk/emulator/emulator -avd KUQuest_API36 &
```

Confirm the emulator is online:

```bash
adb devices
# Expected output: emulator-5554 device
```

### Step 2: Start the Metro Development Server

In a terminal window:

```bash
bun run staging:start
```

### Step 3: Install & Launch on the Emulator

In a second terminal window (or press `a` in Metro):

```bash
bun run android
```

---

## 4. Google OAuth Configuration (Fixing DEVELOPER_ERROR Code 10)

Native Android Google Sign-In requires the APK's Package Name and Keystore SHA-1 to be registered as an **Android OAuth 2.0 Client ID** in Google Cloud Console under project `673221928877`:

- **Google Cloud Console**: [Credentials Page](https://console.cloud.google.com/apis/credentials)
- **Application Type**: Android
- **Package Name**: `com.kuquest.mobile.debug`
- **SHA-1 Fingerprint**: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
- **SHA-256 Fingerprint**: `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C`

> **Scope**: The debug keystore is checked into the repository (`android/app/debug.keystore`), so adding this SHA-1 once fixes Google Sign-In for all emulators, simulators, and team workstations.

---

## 5. Live Staging Verification Script

To verify that the staging backend endpoints, admin credentials, test accounts, quest board, wallet, and work chat are live and healthy:

```bash
bun run verify:staging
```

This runs `scripts/verify-staging-backend.js` against `https://kuquest-dev-api.kubits.org`:

- Health check (`/health`)
- Admin authentication (`admin@kubit.org`)
- Overview & ledger integrity audits
- Tags query (`/api/v1/tags`)
- Quest Board v2 (`/api/v2/quests`)
- Hirer Quests (`/api/v2/quests/mine`)
- Wallet balances (`/api/v1/wallet`)
- Work Chat conversations (`/api/v1/chat/conversations`)

---

## 6. PromptPay QR Payment Verification (Test Mode)

When creating or funding quests on staging:

1. Open **Quest Funding** in **My Quests** or **Create Quest**.
2. Tap **Top Up**, enter an amount (e.g. `฿100`), and tap **Continue**.
3. On the PromptPay QR screen, tap **Verify Payment (Test Mode)**.
4. The app calls the backend with `{ simulate: true }`, triggering Xendit's payment simulation.
5. The transaction is recorded in the ledger and the wallet balance credits immediately.
