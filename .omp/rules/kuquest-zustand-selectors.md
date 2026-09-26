---
description: Keep Zustand subscriptions narrow and stable.
condition:
  - '\buse[A-Za-z_$][A-Za-z0-9_$]*Store\s*\(\s*\)'
  - '\buse[A-Za-z_$][A-Za-z0-9_$]*Store\s*\(\s*\(?\s*[A-Za-z_$][A-Za-z0-9_$]*\s*\)?\s*=>\s*(?:\(\s*\{|\[)'
scope:
  - 'tool:edit(*.{ts,tsx})'
  - 'tool:write(*.{ts,tsx})'
interruptMode: always
---
Subscribe only to fields or actions needed. Use atomic selectors; use `useShallow` when returning multiple values in a new object or array. Follow existing store hooks instead of subscribing to the whole store.
