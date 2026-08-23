import type { ConfigContext, ExpoConfig } from 'expo/config';

export default function configureApp({ config }: ConfigContext): ExpoConfig {
  const baseConfig = config as ExpoConfig;
  const iosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;
  const isDevelopment = process.env.NODE_ENV === 'development';
  const developmentBuildProperties = [
    'expo-build-properties',
    { android: { usesCleartextTraffic: isDevelopment } },
  ] as [string, { android: { usesCleartextTraffic: boolean } }];

  return {
    ...baseConfig,
    ios: {
      ...baseConfig.ios,
      infoPlist: {
        ...baseConfig.ios?.infoPlist,
        NSAppTransportSecurity: {
          ...(baseConfig.ios?.infoPlist?.NSAppTransportSecurity as object | undefined),
          NSAllowsArbitraryLoads: isDevelopment,
        },
      },
    },
    plugins: [
      ...(baseConfig.plugins ?? []),
      developmentBuildProperties,
      ['expo-image-picker', { microphonePermission: false }],
      ...(iosUrlScheme ? [['@react-native-google-signin/google-signin', { iosUrlScheme }] as [string, { iosUrlScheme: string }]] : []),
    ],
  };
}
