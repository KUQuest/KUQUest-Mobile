---
description: Reconcile affected TanStack Query caches after mutations.
condition:
  - '\buseMutation\s*\(\s*\{'
scope:
  - 'tool:edit(*.{ts,tsx})'
  - 'tool:write(*.{ts,tsx})'
interruptMode: never
---
After this mutation, identify exact affected feature keys. Add targeted invalidation, `setQueryData`, or optimistic rollback where required; do not invalidate every query or leave stale reads.
