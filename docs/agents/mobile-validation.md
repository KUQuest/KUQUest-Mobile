# Native mobile validation

Android and iOS are the product targets. A web run is not evidence for native behavior.

## Environment

- Read `README.md` for the environment contract before starting Metro.
- The normal connected flow uses `bun run staging:start`, which targets the develop staging API and the development client.
- Use `bun run dev:start`, `bun run dev:local`, or demo scripts only when the task explicitly requires that environment.
- Build and install a development build with `bun run dev:android` or `bun run dev:ios`; Expo Go is not evidence for native modules.

### Physical Android device preparation

Before opening a development build on a connected Android device, run:

```bash
bun run mobile:android:prepare
```

The command selects `ANDROID_SERIAL` or the single online device and runs
`adb reverse tcp:8081 tcp:8081`. Bind device tooling to
`metroHost: 127.0.0.1`, `metroPort: 8081`, and
`bundleUrl: http://127.0.0.1:8081`. Pass `ANDROID_SERIAL` when more than one
device is online.

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

Prefer semantic refs and selectors over coordinates. Keep logs and snapshots narrow enough to inspect. If a development overlay appears, inspect the accessibility tree and app state before treating it as a startup failure.

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
