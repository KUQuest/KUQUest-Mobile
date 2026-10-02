---
description: Keep NativeWind conditional styles deterministic in both appearances.
condition:
  - '(?i)\bdark:[A-Za-z0-9_-]+'
scope:
  - 'tool:edit(*.{ts,tsx})'
  - 'tool:write(*.{ts,tsx})'
interruptMode: never
---
Give every changed `dark:` utility an explicit base counterpart, such as `text-black dark:text-white`. Use semantic `ku-*` tokens and verify light and dark states; do not rely on a bare conditional value.
