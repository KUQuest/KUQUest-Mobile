import { VariableContextProvider } from "nativewind";
import { useMemo, type PropsWithChildren } from "react";
import { useColorScheme } from "react-native";

import { ramps, setActiveRamp } from "@/theme/colors";
import { useRoleWorkspaceStore } from "./roleWorkspaceStore";

/**
 * Binds the accent tokens to the active workspace's persona ramp, so a Worker
 * sees the worker accent and a Hirer the hirer accent without any component
 * branching on role. Role is never the only signal — the textual and icon
 * indicators stay as they are.
 */
export function RoleAccentProvider({ children }: PropsWithChildren) {
  const workspace = useRoleWorkspaceStore((state) => state.workspace);
  const scheme = useColorScheme() === "dark" ? "dark" : "light";

  // Kept in the render phase, not an effect: `getThemeColors()` and the
  // `colors` proxy read this module-level ramp during the same pass, so an
  // effect would leave imperative colours one frame behind the classes.
  // The call is idempotent, so a double render is harmless.
  setActiveRamp(workspace);

  const value = useMemo(() => {
    const ramp = ramps[workspace][scheme];
    return {
      "--color-ku-primary": ramp.primary,
      "--color-ku-primary-dark": ramp.primaryDark,
      "--color-ku-primary-deep":
        scheme === "dark" ? ramp.primary : ramp.primaryDark,
      "--color-ku-surface-accent": ramp.primarySubtle,
      "--color-ku-border-accent": ramp.accentBorder,
      "--color-ku-on-primary": ramp.onPrimary,
    } as const;
  }, [scheme, workspace]);

  return (
    <VariableContextProvider value={value}>{children}</VariableContextProvider>
  );
}
