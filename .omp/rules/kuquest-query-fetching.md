---
description: Route server reads through TanStack Query instead of effect fetching.
condition:
  - '(?s)\buseEffect\s*\(.{0,900}\bfetch\s*\('
  - '(?s)\buseEffect\s*\(.{0,900}\b(?:api|[A-Za-z_$][A-Za-z0-9_$]*Api)\s*\.\s*(?:get|post|put|patch|delete)\s*\('
scope:
  - 'tool:edit(*.{ts,tsx})'
  - 'tool:write(*.{ts,tsx})'
interruptMode: never
---
Check whether this effect is fetching server state. If so, move the read or write to the feature's TanStack Query hook; keep `useEffect` for real side effects such as subscriptions, hydration, and navigation.
