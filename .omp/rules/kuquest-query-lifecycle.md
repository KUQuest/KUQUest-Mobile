---
description: Preserve the app-wide TanStack Query focus and network lifecycle.
condition:
  - '(?i)\b(?:AppState|Network)\.(?:addEventListener|addNetworkStateListener)\s*\('
  - '(?i)\b(?:focusManager|onlineManager)\.(?:setFocused|setOnline)\s*\('
scope:
  - 'tool:edit(*.{ts,tsx})'
  - 'tool:write(*.{ts,tsx})'
interruptMode: never
---
Use the existing `src/providers/QueryProvider.tsx` wiring. Do not add duplicate AppState or network listeners inside screens/components, and preserve native focus/online behavior.
