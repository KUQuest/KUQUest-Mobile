let offlinePrototypeDemoEnabled = false;

/**
 * The profile-demo flag is intentionally development-only. The in-memory flag
 * is set only after a development session lookup fails at the transport
 * boundary, allowing a debug build to use the existing prototype entry point
 * without changing production authentication behavior.
 */
export function isPrototypeDemoEnabled(): boolean {
  return __DEV__ && (process.env.EXPO_PUBLIC_PROFILE_DEMO === 'true' || offlinePrototypeDemoEnabled);
}

export function enableOfflinePrototypeDemo(): void {
  if (__DEV__) offlinePrototypeDemoEnabled = true;
}

/** Test/runtime reset for a new debug session. */
export function resetOfflinePrototypeDemo(): void {
  offlinePrototypeDemoEnabled = false;
}
