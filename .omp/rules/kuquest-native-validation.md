---
description: Keep KUQuest native work on staging and development builds.
condition:
  - '(?i)\b(?:bun|npm)\s+run\s+(?:start|dev:start|dev:local|update-api-env)\b'
  - '(?i)\bexpo\s+start(?:\s|$)'
  - '(?i)\bexpo\s+go\b'
  - '(?i)\badb\s+shell\s+am\s+force-stop\b'
scope: tool:bash
interruptMode: always
---
Pause and confirm environment. This repository uses the remote develop staging API and an installed development build, not Expo Go or local-API startup scripts. Before Android native work, run `bun run mobile:android:preflight`; do not force-stop a running development client when retrying a deep link.
