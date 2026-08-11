import type { ConfigContext, ExpoConfig } from 'expo/config';

export default function configureApp({ config }: ConfigContext): ExpoConfig {
  const baseConfig = config as ExpoConfig;
  const iosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;

  return {
    ...baseConfig,
    plugins: [
      ...(baseConfig.plugins ?? []),
      ['expo-image-picker', { microphonePermission: false }],
      ...(iosUrlScheme ? [['@react-native-google-signin/google-signin', { iosUrlScheme }] as [string, { iosUrlScheme: string }]] : []),
    ],
  };
}
