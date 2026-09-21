import "../global.css";

import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useLocaleStore } from "@/features/preferences/localeStore";
import { QueryProvider } from "@/providers/QueryProvider";
import AuthMiddleware from "@/features/auth/AuthMiddleware";
import { useRoleWorkspaceStore } from "@/features/workspace/roleWorkspaceStore";
import { AppThemeProvider } from "@/features/workspace/AppThemeProvider";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    KuriousMedium: require("../../assets/fonts/Kurious-Medium.otf"),
    KuriousSemiBold: require("../../assets/fonts/Kurious-SemiBold.otf"),
  });
  useEffect(() => {
    void useLocaleStore.getState().hydrateLocale();
    void useRoleWorkspaceStore.getState().hydrateWorkspace();
  }, []);
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
      <AppThemeProvider>
        <QueryProvider>
          <AuthMiddleware>
            <Stack screenOptions={{ headerShown: false }} />
          </AuthMiddleware>
        </QueryProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
