import type { ConfigContext, ExpoConfig } from 'expo/config';

type AppVariant = 'debug' | 'staging' | 'production';

const APP_VARIANTS: Record<AppVariant, {
  identifier: string;
  name: string;
  scheme: string;
}> = {
  debug: {
    identifier: 'com.kuquest.mobile.debug',
    name: 'KUQuest Debug',
    scheme: 'kuquestmobile-debug',
  },
  staging: {
    identifier: 'com.kuquest.mobile.staging',
    name: 'KUQuest Staging',
    scheme: 'kuquestmobile-staging',
  },
  production: {
    identifier: 'com.kuquest.mobile',
    name: 'KUQuest',
    scheme: 'kuquestmobile',
  },
};

function resolveAppVariant(value = process.env.APP_VARIANT): AppVariant {
  const variant = value ?? 'debug';
  if (variant !== 'debug' && variant !== 'staging' && variant !== 'production') {
    throw new Error(`APP_VARIANT must be debug, staging, or production; received "${variant}"`);
  }
  return variant;
}

function resolveAndroidVersionCode(
  variant: AppVariant,
  configuredVersionCode: number | undefined,
): number {
  if (variant !== 'staging') {
    if (!Number.isInteger(configuredVersionCode) || (configuredVersionCode ?? 0) < 1) {
      throw new Error('expo.android.versionCode must be a positive integer');
    }
    return configuredVersionCode as number;
  }

  const versionCode = Number(process.env.ANDROID_VERSION_CODE);
  if (!Number.isSafeInteger(versionCode) || versionCode < 1 || versionCode > 2_100_000_000) {
    throw new Error('ANDROID_VERSION_CODE must be an integer from 1 through 2100000000 for staging');
  }
  return versionCode;
}

export default function configureApp({ config }: ConfigContext): ExpoConfig {
  const baseConfig = config as ExpoConfig;
  const variant = resolveAppVariant();
  const variantConfig = APP_VARIANTS[variant];
  const iosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;
  const isDevelopmentBuild = variant === 'debug';
  const developmentBuildProperties = [
    'expo-build-properties',
    {
      android: {
        usesCleartextTraffic: isDevelopmentBuild,
        ...(isDevelopmentBuild ? { buildArchs: ['arm64-v8a', 'x86_64'] } : {}),
      },
    },
  ] as [string, { android: { usesCleartextTraffic: boolean; buildArchs?: string[] } }];

  return {
    ...baseConfig,
    name: variantConfig.name,
    scheme: variantConfig.scheme,
    android: {
      ...baseConfig.android,
      package: variantConfig.identifier,
      versionCode: resolveAndroidVersionCode(variant, baseConfig.android?.versionCode),
    },
    ios: {
      ...baseConfig.ios,
      bundleIdentifier: variantConfig.identifier,
      infoPlist: {
        ...baseConfig.ios?.infoPlist,
        NSAppTransportSecurity: {
          ...(baseConfig.ios?.infoPlist?.NSAppTransportSecurity as object | undefined),
          NSAllowsArbitraryLoads: isDevelopmentBuild,
        },
      },
    },
    plugins: [
      ...(baseConfig.plugins ?? []),
      './plugins/withAndroidReleaseSigning',
      developmentBuildProperties,
      ['expo-image-picker', { microphonePermission: false }],
      ...(iosUrlScheme ? [['@react-native-google-signin/google-signin', { iosUrlScheme }] as [string, { iosUrlScheme: string }]] : []),
    ],
  };
}
