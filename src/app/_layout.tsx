import "../global.css";

import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LocaleProvider } from "../locales/LocaleProvider";
import { AppearanceProvider, useAppearance } from "../theme/AppearanceProvider";
import AuthMiddleware from "@/features/auth/AuthMiddleware";
import { colors, darkColors } from "../theme/colors";

import {
  NotoSansThai_400Regular,
  NotoSansThai_500Medium,
  NotoSansThai_600SemiBold,
  NotoSansThai_700Bold,
} from "@expo-google-fonts/noto-sans-thai";

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { appearance } = useAppearance();
  const backgroundColor =
    appearance === "dark" ? darkColors.background : colors.background;

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(backgroundColor);
  }, [backgroundColor]);

  return (
    <SafeAreaProvider>
      <StatusBar style={appearance === "dark" ? "light" : "dark"} />
      <LocaleProvider>
        <AuthMiddleware>
          <Stack screenOptions={{ headerShown: false }} />
        </AuthMiddleware>
      </LocaleProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    NotoSansThai_400Regular,
    NotoSansThai_500Medium,
    NotoSansThai_600SemiBold,
    NotoSansThai_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AppearanceProvider>
      <RootLayoutContent />
    </AppearanceProvider>
  );
}
