---
description: Keep remote query state out of duplicate Zustand state.
condition:
  - '(?s)\buseEffect\s*\(\s*\(\s*\)\s*=>.{0,900}\bset[A-Za-z_$][A-Za-z0-9_$]*\s*\(.{0,180}\b(?:query|queries|[A-Za-z_$][A-Za-z0-9_$]*Query)(?:\.|\?\.)data\b'
  - '(?s)\buse[A-Za-z_$][A-Za-z0-9_$]*Store\.(?:setState|set)\s*\(.{0,220}\b(?:query|queries|[A-Za-z_$][A-Za-z0-9_$]*Query)(?:\.|\?\.)data\b'
scope:
  - 'tool:edit(*.{ts,tsx})'
  - 'tool:write(*.{ts,tsx})'
interruptMode: always
---
Keep server state in TanStack Query and client/application state in Zustand. Do not copy query data into a store unless an explicit ownership boundary requires it; remove duplicate sources of truth.
