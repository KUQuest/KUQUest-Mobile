import { Stack } from "expo-router";
import { useFonts, NotoSansThai_400Regular, NotoSansThai_700Bold } from '@expo-google-fonts/noto-sans-thai';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    NotoSansThai: NotoSansThai_400Regular,
    'NotoSansThai-Bold': NotoSansThai_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return <Stack />;
}
