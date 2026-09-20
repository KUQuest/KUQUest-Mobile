# Native mobile validation

Android and iOS are the product targets. A web run is not evidence for native behavior.

## Environment

- Read `README.md` for the environment contract before starting Metro.
- The normal connected flow uses `bun run staging:start`, which targets the develop staging API and the development client.
- Use `bun run dev:start`, `bun run dev:local`, or demo scripts only when the task explicitly requires that environment.
- Build and install a development build with `bun run dev:android` or `bun run dev:ios`; Expo Go is not evidence for native modules.

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

## Evidence

Report the exact command and device state used. Distinguish native smoke evidence from Jest: CSS is mocked in Jest, so tests cannot prove resolved NativeWind colors or layout.
