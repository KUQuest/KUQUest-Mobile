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

  test("uses the coinstallable debug identity by default", () => {
    const config = configure();

    expect(config.name).toBe("KUQuest Debug");
    expect(config.scheme).toBe("kuquestmobile-debug");
    expect(config.android?.package).toBe("com.kuquest.mobile.debug");
    expect(config.ios?.bundleIdentifier).toBe("com.kuquest.mobile.debug");
    expect(config.android?.versionCode).toBe(1);
    expect(config.android?.softwareKeyboardLayoutMode).toBe("resize");
  });

  test("uses the CI build number for staging", () => {
    const config = configure("staging", "247");

    expect(config.name).toBe("KUQuest Staging");
    expect(config.scheme).toBe("kuquestmobile-staging");
    expect(config.android?.package).toBe("com.kuquest.mobile.staging");
    expect(config.android?.versionCode).toBe(247);
  });

  test("uses the CI build number for uat with its own coinstallable identity", () => {
    const config = configure("uat", "311");

    expect(config.name).toBe("KUQuest UAT");
    expect(config.scheme).toBe("kuquestmobile-uat");
    expect(config.android?.package).toBe("com.kuquest.mobile.uat");
    expect(config.ios?.bundleIdentifier).toBe("com.kuquest.mobile.uat");
    expect(config.android?.versionCode).toBe(311);
  });

  test("rejects invalid variants and missing CI version codes", () => {
    expect(() => configure("production")).toThrow(
      "APP_VARIANT must be debug, staging, or uat"
    );
    expect(() => configure("staging", "0")).toThrow(
      "ANDROID_VERSION_CODE must be an integer"
    );
    expect(() => configure("uat")).toThrow(
      "ANDROID_VERSION_CODE must be an integer"
    );
  });

  test("registers HTTPS team invite links for Android and iOS", () => {
    process.env.EXPO_PUBLIC_API_URL = "https://invite.example.test/api";
    const config = configure("staging", "247");

    expect(config.android?.intentFilters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "VIEW",
          autoVerify: true,
          category: ["BROWSABLE", "DEFAULT"],
          data: [
            {
              scheme: "https",
              host: "invite.example.test",
              pathPrefix: "/invite/team",
            },
          ],
        }),
      ])
    );
    expect(config.ios?.associatedDomains).toContain(
      "applinks:invite.example.test"
    );
  });

  test("does not register verified links for non-HTTPS API origins", () => {
    process.env.EXPO_PUBLIC_API_URL = "http://localhost:5000";
    const config = configure("debug");

    expect(config.android?.intentFilters).toEqual([]);
    expect(config.ios?.associatedDomains).toBeUndefined();
  });
});
