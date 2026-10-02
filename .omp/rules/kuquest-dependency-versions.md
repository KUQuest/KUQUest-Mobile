---
description: Check installed versions before changing framework dependencies.
condition:
  - '(?i)"(?:@expo/[^"]+|expo|react-native(?:-[^"]+)?|@react-native/[^"]+|zustand|nativewind|@tanstack/react-query)"\s*:'
scope:
  - 'tool:edit(package.json)'
  - 'tool:write(package.json)'
interruptMode: always
---
Before changing this dependency, inspect `package.json`, `bun.lock`, and installed versions. Use APIs compatible with Expo SDK 57, React Native 0.86, Zustand 5, TanStack Query 5, and NativeWind 5 preview; do not copy another major version silently.
