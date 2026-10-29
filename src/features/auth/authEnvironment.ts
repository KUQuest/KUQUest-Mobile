function isDemoEnabled(): boolean {
  return __DEV__ && process.env.EXPO_PUBLIC_PROFILE_DEMO === "true";
}

export const authEnvironment = {
  isDemoEnabled,
};
