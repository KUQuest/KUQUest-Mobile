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

  test("keeps the explicit app version code for production", () => {
    const config = configure("production", "999");

    expect(config.name).toBe("KUQuest");
    expect(config.scheme).toBe("kuquestmobile");
    expect(config.android?.package).toBe("com.kuquest.mobile");
    expect(config.android?.versionCode).toBe(1);
  });

  test("rejects invalid variants and staging version codes", () => {
    expect(() => configure("preview")).toThrow(
      "APP_VARIANT must be debug, staging, or production"
    );
    expect(() => configure("staging", "0")).toThrow(
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
