import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LocaleProvider } from '../locales/LocaleProvider';

import {
  NotoSansThai_400Regular,
  NotoSansThai_500Medium,
  NotoSansThai_600SemiBold,
  NotoSansThai_700Bold,
} from '@expo-google-fonts/noto-sans-thai';

import {
  BeVietnamPro_700Bold,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_500Medium,
  BeVietnamPro_400Regular
} from '@expo-google-fonts/be-vietnam-pro';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    NotoSansThai_400Regular,
    NotoSansThai_500Medium,
    NotoSansThai_600SemiBold,
    NotoSansThai_700Bold,
    BeVietnamPro_700Bold,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_500Medium,
    BeVietnamPro_400Regular
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
    <SafeAreaProvider>
      <LocaleProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </LocaleProvider>
    </SafeAreaProvider>
  );
}
