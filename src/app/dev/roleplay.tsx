import { Redirect } from "expo-router";

import RoleplayScreen from "@/features/roleplay/RoleplayScreen";

/**
 * Development-only route. The roleplay mock never belongs in a production
 * build, so anything that reaches this path outside `__DEV__` is sent home.
 */
export default function DevRoleplayRoute() {
  if (!__DEV__) return <Redirect href="/" />;

  return <RoleplayScreen />;
}
