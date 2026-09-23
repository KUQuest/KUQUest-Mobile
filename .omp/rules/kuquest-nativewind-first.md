---
description: Prefer repository NativeWind primitives for static styling.
astCondition:
  - 'StyleSheet.create($$$ARGS)'
scope:
  - 'tool:edit(*.{ts,tsx,js,jsx,mts,mjs})'
  - 'tool:write(*.{ts,tsx,js,jsx,mts,mjs})'
interruptMode: never
---
Use `@/tw` primitives and `className` for static styling. Keep `StyleSheet` or `style` for measured, animated, safe-area, runtime, or third-party-only values; never drive one property from both systems.
