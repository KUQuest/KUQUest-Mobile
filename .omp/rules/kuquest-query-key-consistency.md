---
description: Keep TanStack Query keys inside feature key factories.
condition:
  - '(?i)\bqueryKey\s*:\s*\[(?!\s*\.\.\.\s*[A-Za-z_$][A-Za-z0-9_$]*Keys\b)'
  - '(?i)\bqueryKey\s*:\s*"'
scope:
  - 'tool:edit(*.{ts,tsx})'
  - 'tool:write(*.{ts,tsx})'
interruptMode: always
---
Inspect the feature's existing key factory before adding this query. Reuse its hierarchy, include every value read by `queryFn`, and omit filters the fetch ignores; do not create an ad-hoc key.
