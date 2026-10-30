import type { ConfigContext, ExpoConfig } from "expo/config";

import configureApp from "./app.config";

const baseConfig: ExpoConfig = {
  name: "KUQuest",
  slug: "KUQUest-Mobile",
  version: "1.0.0",
  android: { versionCode: 1 },
  ios: {},
};

function configure(variant?: string, versionCode?: string) {
  if (variant === undefined) {
    delete process.env.APP_VARIANT;
  } else {
    process.env.APP_VARIANT = variant;
  }
  if (versionCode === undefined) {
    delete process.env.ANDROID_VERSION_CODE;
  } else {
    process.env.ANDROID_VERSION_CODE = versionCode;
  }
  return configureApp({ config: baseConfig } as ConfigContext);
}
describe("app config Android architectures", () => {
  const nodeEnv = process.env.NODE_ENV;
  const buildArchs = () => {
    const plugins = configure().plugins ?? [];
    const buildProperties = plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === "expo-build-properties"
    ) as [string, { android: { buildArchs: string[] } }];
    return buildProperties[1].android.buildArchs;
  };

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = nodeEnv;
  });

  test("builds phones only for a production build", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";

    expect(buildArchs()).toEqual(["arm64-v8a"]);
  });

  test("keeps the emulator architecture for a local build", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";

    expect(buildArchs()).toEqual(["arm64-v8a", "x86_64"]);
  });
});

describe("app config push", () => {
  afterEach(() => {
    delete process.env.GOOGLE_SERVICES_JSON;
  });

  test("turns off push for a build without google-services.json", () => {
    delete process.env.GOOGLE_SERVICES_JSON;
    const config = configure();

    expect(config.extra?.pushEnabled).toBe(false);
    expect(config.android?.googleServicesFile).toBeUndefined();
  });

  test("turns on push for a build with google-services.json", () => {
    process.env.GOOGLE_SERVICES_JSON = "/tmp/google-services.json";
    const config = configure();

    expect(config.extra?.pushEnabled).toBe(true);
    expect(config.android?.googleServicesFile).toBe(
      "/tmp/google-services.json"
    );
  });
});

describe("app config variants", () => {
  const initialApiUrl = process.env.EXPO_PUBLIC_API_URL;

  afterEach(() => {
    delete process.env.APP_VARIANT;
    delete process.env.ANDROID_VERSION_CODE;
    if (initialApiUrl === undefined) {
      delete process.env.EXPO_PUBLIC_API_URL;
    } else {
      process.env.EXPO_PUBLIC_API_URL = initialApiUrl;
    }
  });

  test("defaults to the staging identity and app.json versionCode for local runs", () => {
    const config = configure();

    expect(config.name).toBe("KUQuest Staging");
    expect(config.scheme).toBe("kuquestmobile-staging");
    expect(config.android?.package).toBe("org.kubits.kuquest.staging");
    expect(config.ios?.bundleIdentifier).toBe("org.kubits.kuquest.staging");
    expect(config.android?.versionCode).toBe(1);
    expect(config.extra?.appVariant).toBe("staging");
    expect(config.android?.softwareKeyboardLayoutMode).toBe("resize");
  });

  test("uses the CI build number for staging", () => {
    const config = configure("staging", "247");

    expect(config.name).toBe("KUQuest Staging");
    expect(config.scheme).toBe("kuquestmobile-staging");
    expect(config.android?.package).toBe("org.kubits.kuquest.staging");
    expect(config.android?.versionCode).toBe(247);
  });

  test("uses the CI build number for uat with its own coinstallable identity", () => {
    const config = configure("uat", "311");

    expect(config.name).toBe("KUQuest UAT");
    expect(config.scheme).toBe("kuquestmobile-uat");
    expect(config.android?.package).toBe("org.kubits.kuquest.uat");
    expect(config.ios?.bundleIdentifier).toBe("org.kubits.kuquest.uat");
    expect(config.android?.versionCode).toBe(311);
    expect(config.extra?.appVariant).toBe("uat");
  });

  test("rejects invalid variants and missing CI version codes", () => {
    expect(() => configure("debug")).toThrow(
      "APP_VARIANT must be staging or uat"
    );
    expect(() => configure("production")).toThrow(
      "APP_VARIANT must be staging or uat"
    );
    expect(() => configure("staging", "0")).toThrow(
      "ANDROID_VERSION_CODE must be an integer"
    );
    expect(() => configure("uat")).toThrow(
      "ANDROID_VERSION_CODE must be an integer"
    );
  });

  test("registers UAT API host for Android and iOS team invite links", () => {
    process.env.EXPO_PUBLIC_API_URL = "https://uat-api.kubits.org";
    const config = configure("uat", "247");

    expect(config.android?.intentFilters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "VIEW",
          autoVerify: true,
          category: ["BROWSABLE", "DEFAULT"],
          data: [
            {
              scheme: "https",
              host: "uat-api.kubits.org",
              pathPrefix: "/invite/team",
            },
          ],
        }),
      ])
    );
    expect(config.ios?.associatedDomains).toContain(
      "applinks:uat-api.kubits.org"
    );
  });

  test("does not register verified links for non-HTTPS API origins", () => {
    process.env.EXPO_PUBLIC_API_URL = "http://localhost:5000";
    const config = configure("staging", "1");

    expect(config.android?.intentFilters).toEqual([]);
    expect(config.ios?.associatedDomains).toBeUndefined();
  });
});
