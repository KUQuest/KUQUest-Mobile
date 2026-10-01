---
name: android-device-quick
description: Inspect and drive Android emulator or phone screens quickly with the repository ADB helper during native app debugging.
---

# Android Device Quick

Use `scripts/android-ui.sh` for repeated ADB inspection and interaction. It
chooses a device only when there is exactly one authorized device; when several
are connected, pass `--device SERIAL` so commands cannot hit the wrong phone.

Prefer semantic targets over remembered coordinates:

```sh
scripts/android-ui.sh --device emulator-5554 size
scripts/android-ui.sh --device emulator-5554 find "Candidate review"
scripts/android-ui.sh --device emulator-5554 tap "Candidate review"
scripts/android-ui.sh --device emulator-5554 dump
scripts/android-ui.sh --device emulator-5554 screenshot /tmp/screen.png
```

`tap` acts only when one clickable text, content description, or resource ID
matches. If it finds zero or multiple targets, inspect `find`/`dump` and choose
a more specific label. Use `text`, `swipe`, and `back` for direct input and
navigation. Keep screenshots and device dumps in `/tmp` unless the task asks to
preserve QA artifacts in the repository.

Before native smoke work, follow `README.md` and
`docs/agents/mobile-validation.md` for staging startup, development-build
state, preflight, evidence, and cleanup. This helper speeds up screen driving;
it does not replace those checks or visual confirmation after meaningful
interactions.
