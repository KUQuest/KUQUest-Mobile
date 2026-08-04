import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';

import {
  BeVietnamPro_700Bold,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_500Medium,
  BeVietnamPro_400Regular,
} from '@expo-google-fonts/be-vietnam-pro';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BeVietnamPro_700Bold,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_500Medium,
    BeVietnamPro_400Regular,
  });
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);
  if (!fontsLoaded) {
    return null;
  }
  return <Stack />;
}