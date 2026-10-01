---
name: android-device-quick
description: Start Android emulators, launch KUQuest development builds, and quickly inspect or drive screens during native app debugging.
---

# Android Device Quick

Use this skill for repeatable Android emulator/phone smoke checks. Read
`README.md` and `docs/agents/mobile-validation.md` before native validation;
these commands are shortcuts for that repo workflow, not a replacement.

## Start devices and the app

List available AVDs, then start the requested one. Start a second AVD only when
the scenario needs another persona/device:

```sh
emulator -list-avds
"$HOME/Android/Sdk/emulator/emulator" -avd KUQuest_API36 -no-snapshot-load &
# Optional second emulator, in another terminal:
"$HOME/Android/Sdk/emulator/emulator" -avd OTHER_AVD -no-snapshot-load &
```

Wait for boot and check actual serials; emulator serials can vary:

```sh
adb devices -l
adb -s emulator-5554 shell getprop sys.boot_completed # wait for 1
```

Unlock physical phones and approve USB debugging. Do not assume a serial from a
previous run. Run preflight for the same port and one explicit target before
starting Metro (repeat for whichever device owns that validation session):

```sh
METRO_PORT=8082 ANDROID_SERIAL=emulator-5554 bun run mobile:android:preflight
```

For staging, load the ignored local environment in the Metro terminal and use
the repo command:

```sh
set -a
source .env.local
set +a
EXPO_PORT=8082 bun run staging:start
```

Install/build the native development client on each device that needs it, one
device at a time:

```sh
EXPO_PORT=8082 ANDROID_SERIAL=emulator-5554 bun android
EXPO_PORT=8082 ANDROID_SERIAL=R5CW419RHAF bun android
```

Alternatively, run `./scripts/android-device.sh`; it lists connected devices,
prompts for one, and runs `bun android` on that target. In the running Expo
terminal, press `a` to open the first Android device or `Shift+A` to choose a
different attached device. Devices opened against the same Metro server share
its JavaScript bundle. Use a separate account/persona per device when needed.
Never use Expo Go for this native app.

## Inspect and drive screens

Use `scripts/android-ui.sh` for repeated ADB inspection and interaction. Always
pass `--device SERIAL` when more than one authorized device is connected:

```sh
scripts/android-ui.sh --device emulator-5554 size
scripts/android-ui.sh --device emulator-5554 find "Candidate review"
scripts/android-ui.sh --device emulator-5554 tap "Candidate review"
scripts/android-ui.sh --device emulator-5554 dump
scripts/android-ui.sh --device emulator-5554 screenshot /tmp/screen.png
scripts/android-ui.sh --device emulator-5554 logs 250
```

`tap` acts only when one clickable text, content description, or resource ID
matches. If it finds zero or multiple targets, inspect `find`/`dump` and choose
a more specific label. Use `text`, `swipe`, and `back` for direct input and
navigation. Keep screenshots and device dumps in `/tmp` unless the task asks to
preserve QA artifacts in the repository. Re-observe and visually verify the
screen after each meaningful action.

At the end, close the app session and stop only the Metro process started for
this smoke run. Leave emulators/phones running unless asked to shut them down.
