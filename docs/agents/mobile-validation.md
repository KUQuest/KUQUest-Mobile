# Native mobile validation

Android and iOS are the product targets. A web run is not evidence for native behavior.

## Environment

- Read `README.md` for the environment contract before starting Metro.
- The normal connected flow uses `bun run staging:start`, which targets the develop staging API and the development client.
- Use `bun run dev:local` or demo scripts only when the task explicitly requires that environment.
- Build and install with `bun android` or `bun ios`; Expo Go is not evidence for native modules.

### Android device selection and Metro reverse

`bun android` selects the sole online Android device automatically, prompts when multiple devices are online, and honors `ANDROID_SERIAL=<serial>` without prompting. It applies `adb reverse` to the selected serial using `EXPO_PORT` (default `6767`) before invoking Expo for that same device. Use the same port for Metro:

```bash
EXPO_PORT=8082 bun run staging:start
EXPO_PORT=8082 ANDROID_SERIAL=<serial> bun android
```

### Preflight

Before starting Metro or opening a development build, run:

```bash
bun run mobile:android:preflight
```

The preflight requires one online Android device (or `ANDROID_SERIAL`), reports
Metro health, listener ownership, open-file pressure, and inotify limits, and
checks for an existing agent-device session. An occupied port or active session
fails by default. Reuse only an explicitly verified owner:

```bash
AGENT_DEVICE_SESSION=existing-session METRO_REUSE=1 \
  bun run mobile:android:preflight
```

If preflight reports near-exhausted inotify capacity, do not retry Metro.
Release stale file-watching processes through their owning session or ask the
host administrator to raise the system limit. A healthy `/status` response is
not sufficient when the bundle endpoint returns `500`.

The reuse form is valid only when the Metro listener is healthy, rooted in this
worktree, and the named agent-device session is the session you already own.
Do not open a second session for the same device.

If the device reports `DEVICE_IN_USE`, continue through the existing session
that owns the device or close it through that same session context. Do not
retry `open` against the same serial until the lease is released.

Agent-device MCP paths use exactly one `mcp__` prefix:
`xd://mcp__agent_device_<command>`.

## Device loop

1. Start the canonical Metro command for the environment.
2. Open the installed development build once on the selected device.
3. Wait for a stable app selector or visible text; a screenshot of the splash screen is not proof that startup failed.
4. Capture an accessibility snapshot with interactive elements only.
5. Re-observe after every press, fill, navigation, or appearance change; refs expire after mutations.
6. Exercise the smallest state matrix that covers the change. Styling changes normally require light/dark and every role or persona that owns an accent.
7. Record the device, build variant, states exercised, and any pre-existing warnings.
8. Close the same app session and stop the supervised Metro process.

### Workspace surface smoke gate

For Role Workspace changes, run
`bun run check-android-workspace-surface` after the JavaScript bundle reloads
on Worker Home, then run it again after navigating to Settings. The check
rejects a stale Worker Home bundle that still exposes
`switch-to-hirer-button` and rejects Settings when `settings-workspace` is
absent.

Prefer semantic refs and selectors over coordinates. Keep logs and snapshots narrow enough to inspect. If a development overlay appears, inspect the accessibility tree and app state before treating it as a startup failure.

If a physical device rejects interaction with `INJECT_EVENTS`, record native
startup and accessibility evidence but do not claim interaction coverage.
Switch to an emulator or an approved device session for semantic presses; do
not repeatedly retry the same denied input.

For UI and accessibility changes, also exercise the applicable matrix from
`docs/agents/ui-design-rules.md`: compact and larger windows, portrait and
landscape, light and dark appearance, large text, keyboard-visible forms,
reduced motion, and every role/workspace accent. Confirm that labels, roles,
states, error text, focus order, and non-color state cues appear in the
accessibility snapshot. These are native checks; Jest and a web run cannot
prove them.

For scroll-driven chrome transitions, validate both expanded and compact
states. Every `tab-*` control must remain visible, enabled, hittable, and
at least 48 logical units in both states. Run
`bun run check-android-navigation-targets` on the screen where the navbar is
visible after each state is reached. The checker currently enforces a 44dp
floor; treat any changed target below 48 logical units as a failure.

## Evidence

Report the exact command and device state used. Distinguish native smoke evidence from Jest: CSS is mocked in Jest, so tests cannot prove resolved NativeWind colors or layout.
