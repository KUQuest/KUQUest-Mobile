import { VariableContextProvider } from "nativewind";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type PropsWithChildren,
} from "react";
import * as SystemUI from "expo-system-ui";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";

import {
  getThemeColors,
  setActiveRamp,
  type ThemeColors,
} from "@/theme/colors";
import { useRoleWorkspace } from "./roleWorkspaceStore";

export interface AppTheme {
  scheme: "light" | "dark";
  colors: ThemeColors;
}

const AppThemeContext = createContext<AppTheme | null>(null);

function toCssVariable(key: string): string {
  return `--color-ku-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

export function useAppTheme(): AppTheme {
  const theme = useContext(AppThemeContext);
  if (!theme) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }
  return theme;
}

/**
 * Owns system theme resolution, workspace accent selection, NativeWind color
 * variables, status bar, and system background.
 */
export function AppThemeProvider({ children }: PropsWithChildren) {
  const { workspace } = useRoleWorkspace();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";

  // Keep imperative `colors` consumers synchronized during same render.
  setActiveRamp(workspace);

  const themeColors = getThemeColors(scheme);
  const contextValue = useMemo<AppTheme>(
    () => ({ scheme, colors: themeColors }),
    [scheme, themeColors]
  );
  const variables = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(themeColors).map(([key, value]) => [
          toCssVariable(key),
          value,
        ])
      ),
    [themeColors]
  );

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(themeColors.background);
  }, [themeColors.background]);

  return (
    <AppThemeContext.Provider value={contextValue}>
      <VariableContextProvider value={variables}>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        {children}
      </VariableContextProvider>
    </AppThemeContext.Provider>
  );
}
