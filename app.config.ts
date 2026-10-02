import type { ConfigContext, ExpoConfig } from "expo/config";

type AppVariant = "staging" | "uat";

const APP_VARIANTS: Record<
  AppVariant,
  {
    identifier: string;
    name: string;
    scheme: string;
  }
> = {
  staging: {
    identifier: "org.kubits.kuquest.staging",
    name: "KUQuest Staging",
    scheme: "kuquestmobile-staging",
  },
  uat: {
    identifier: "org.kubits.kuquest.uat",
    name: "KUQuest UAT",
    scheme: "kuquestmobile-uat",
  },
};

function resolveAppVariant(value = process.env.APP_VARIANT): AppVariant {
  const variant = value ?? "staging";
  if (variant !== "staging" && variant !== "uat") {
    throw new Error(
      `APP_VARIANT must be staging or uat; received "${variant}"`
    );
  }
  return variant;
}

// CI and the dev-client scripts set APP_VARIANT together with a build number.
// Without APP_VARIANT (plain `expo start`) the versionCode stays app.json's.
function resolveAndroidVersionCode(
  configuredVersionCode: number | undefined
): number {
  if (process.env.APP_VARIANT === undefined) {
    if (
      !Number.isInteger(configuredVersionCode) ||
      (configuredVersionCode ?? 0) < 1
    ) {
      throw new Error("expo.android.versionCode must be a positive integer");
    }
    return configuredVersionCode as number;
  }

  const versionCode = Number(process.env.ANDROID_VERSION_CODE);
  if (
    !Number.isSafeInteger(versionCode) ||
    versionCode < 1 ||
    versionCode > 2_100_000_000
  ) {
    throw new Error(
      `ANDROID_VERSION_CODE must be an integer from 1 through 2100000000 for ${process.env.APP_VARIANT}`
    );
  }
  return versionCode;
}

export function resolveHttpsAppLinkHost(
  apiUrl = process.env.EXPO_PUBLIC_API_URL
): string | undefined {
  if (!apiUrl?.trim()) return undefined;
  try {
    const url = new URL(apiUrl);
    return url.protocol === "https:" ? url.hostname : undefined;
  } catch {
    return undefined;
  }
}

export default function configureApp({ config }: ConfigContext): ExpoConfig {
  const baseConfig = config as ExpoConfig;
  const variant = resolveAppVariant();
  const variantConfig = APP_VARIANTS[variant];
  const appLinkHost = resolveHttpsAppLinkHost();
  const iosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;
  // Android debug builds re-enable cleartext (Metro over http) from the template's
  // src/debug manifest, so release builds stay HTTPS-only for every variant.
  const buildProperties = [
    "expo-build-properties",
    {
      android: {
        usesCleartextTraffic: false,
        buildArchs: ["arm64-v8a", "x86_64"],
      },
    },
  ] as [
    string,
    { android: { usesCleartextTraffic: boolean; buildArchs: string[] } },
  ];

  return {
    ...baseConfig,
    name: variantConfig.name,
    scheme: variantConfig.scheme,
    android: {
      ...baseConfig.android,
      softwareKeyboardLayoutMode: "resize",
      // FCM needs google-services.json; builds without it still work but cannot register for push.
      ...(process.env.GOOGLE_SERVICES_JSON
        ? { googleServicesFile: process.env.GOOGLE_SERVICES_JSON }
        : {}),
      package: variantConfig.identifier,
      versionCode: resolveAndroidVersionCode(baseConfig.android?.versionCode),
      intentFilters: [
        ...(baseConfig.android?.intentFilters ?? []),
        ...(appLinkHost
          ? [
              {
                action: "VIEW" as const,
                autoVerify: true,
                data: [
                  {
                    scheme: "https",
                    host: appLinkHost,
                    pathPrefix: "/invite/team",
                  },
                ],
                category: ["BROWSABLE", "DEFAULT"],
              },
            ]
          : []),
      ],
    },
    ios: {
      ...baseConfig.ios,
      bundleIdentifier: variantConfig.identifier,
      associatedDomains: appLinkHost
        ? [
            ...new Set([
              ...(baseConfig.ios?.associatedDomains ?? []),
              `applinks:${appLinkHost}`,
            ]),
          ]
        : baseConfig.ios?.associatedDomains,
    },
    plugins: [
      ...(baseConfig.plugins ?? []),
      "./plugins/withAndroidReleaseSigning",
      buildProperties,
      ["expo-image-picker", { microphonePermission: false }],
      ...(iosUrlScheme
        ? [
            ["@react-native-google-signin/google-signin", { iosUrlScheme }] as [
              string,
              { iosUrlScheme: string },
            ],
          ]
        : []),
    ],
  };
}
