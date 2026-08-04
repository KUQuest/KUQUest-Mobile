import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';

import {
  font42dotSans_400Regular,
  font42dotSans_500Medium,
  font42dotSans_600SemiBold,
  font42dotSans_700Bold,
} from '@expo-google-fonts/42dot-sans';

import {
  BeVietnamPro_700Bold
} from '@expo-google-fonts/be-vietnam-pro';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    font42dotSans_400Regular,
    font42dotSans_500Medium,
    font42dotSans_600SemiBold,
    font42dotSans_700Bold,
    BeVietnamPro_700Bold
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