import "../global.css";

import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useLocaleStore } from "@/features/preferences/localeStore";
import { QueryProvider } from "@/providers/QueryProvider";
import AuthMiddleware from "@/features/auth/AuthMiddleware";
import { useRoleWorkspaceStore } from "@/features/workspace/roleWorkspaceStore";
import { RoleAccentProvider } from "@/features/workspace/RoleAccentProvider";
import { colors, darkColors } from "../theme/colors";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const backgroundColor =
    colorScheme === "dark" ? darkColors.background : colors.background;
  const [fontsLoaded, fontError] = useFonts({
    KuriousMedium: require("../../assets/fonts/Kurious-Medium.otf"),
    KuriousSemiBold: require("../../assets/fonts/Kurious-SemiBold.otf"),
  });
  useEffect(() => {
    void useLocaleStore.getState().hydrateLocale();
    void useRoleWorkspaceStore.getState().hydrateWorkspace();
  }, []);
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(backgroundColor);
  }, [backgroundColor]);
  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);
  if (!fontsLoaded && !fontError) {
    return null;
  }
  return (
    <SafeAreaProvider>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <RoleAccentProvider>
        <QueryProvider>
          <AuthMiddleware>
            <Stack screenOptions={{ headerShown: false }} />
          </AuthMiddleware>
        </QueryProvider>
      </RoleAccentProvider>
    </SafeAreaProvider>
  );
}
