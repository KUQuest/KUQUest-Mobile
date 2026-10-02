---
description: Catch TypeScript suppressions, non-null assertions, and unsafe double assertions.
condition:
  - '(?m)^\s*(?://|/\*)\s*@ts-(?:ignore|nocheck)\b'
astCondition:
  - '$X!'
  - '$X as unknown as $T'
scope:
  - 'tool:edit(*.{ts,tsx,mts,cts})'
  - 'tool:write(*.{ts,tsx,mts,cts})'
interruptMode: always
---
Use proper narrowing, type guards, discriminated unions, or schema validation at external boundaries. Remove suppressions and unsafe assertions; do not hide a type error to make compilation pass. Built-in `ts-no-any` already covers `any` and `as any`.
