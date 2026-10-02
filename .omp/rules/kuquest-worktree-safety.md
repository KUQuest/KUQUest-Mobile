---
description: Protect unrelated KUQuest worktree changes from destructive shell cleanup.
condition:
  - '(?i)\bgit\s+reset\s+--hard\b'
  - '(?i)\bgit\s+clean\b[^\n]*(?:--force|-[^\n\s]*f[^\n\s]*)(?:\s|$)'
  - '(?i)\bgit\s+(?:checkout|restore)\s+--\s'
  - '(?i)\brm\s+-(?:[A-Za-z]*r[A-Za-z]*|[A-Za-z]*f[A-Za-z]*)\b'
  - '(?i)\brm\s+--(?:recursive|force)\b'
scope: tool:bash
interruptMode: always
---
Pause before running this command. Preserve unrelated working-tree changes. Use a scoped, non-destructive inspection or edit; only back out paths owned by the current task, and require explicit user approval for destructive cleanup.
