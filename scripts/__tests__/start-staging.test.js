const {
  STAGING_API_URL,
  createStagingEnvironment,
  runStagingStart,
} = require("../start-staging");

describe("staging:start", () => {
  const environment = {
    EXPO_PUBLIC_API_URL: STAGING_API_URL,
    EXPO_PUBLIC_GOOGLE_CLIENT_ID:
      "12345678901234567890-staging-web.apps.googleusercontent.com",
    EXPO_PUBLIC_TERMS_VERSION: "2026-01-01",
    EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME: "com.googleusercontent.apps.example",
  };

  test("builds a strict staging environment without reading dotenv files", () => {
    expect(createStagingEnvironment(environment)).toEqual({
      ...environment,
      APP_VARIANT: "staging",
      ANDROID_VERSION_CODE: "1",
      EXPO_NO_DOTENV: "1",
      EXPO_PUBLIC_PROFILE_DEMO: "false",
    });
  });

  test("disables demo data when inherited environment enables it", () => {
    expect(
      createStagingEnvironment({
        ...environment,
        EXPO_PUBLIC_PROFILE_DEMO: "true",
      }).EXPO_PUBLIC_PROFILE_DEMO
    ).toBe("false");
  });

  test("trims the externally supplied staging API origin", () => {
    expect(
      createStagingEnvironment({
        ...environment,
        EXPO_PUBLIC_API_URL: ` ${STAGING_API_URL} `,
      }).EXPO_PUBLIC_API_URL
    ).toBe(STAGING_API_URL);
  });

  test("trims externally supplied client and terms values", () => {
    const stagingEnvironment = createStagingEnvironment({
      ...environment,
      EXPO_PUBLIC_GOOGLE_CLIENT_ID:
        " 12345678901234567890-staging-web.apps.googleusercontent.com ",
      EXPO_PUBLIC_TERMS_VERSION: " 2026-01-01 ",
    });

    expect(stagingEnvironment.EXPO_PUBLIC_GOOGLE_CLIENT_ID).toBe(
      "12345678901234567890-staging-web.apps.googleusercontent.com"
    );
    expect(stagingEnvironment.EXPO_PUBLIC_TERMS_VERSION).toBe("2026-01-01");
  });

  test.each([
    ["http://kuquest-dev-api.kubits.org", "uses HTTPS"],
    ["https://api.example.test", "uses the staging host"],
    ["https://kuquest-dev-api.kubits.org/api", "does not use an API path"],
    ["", "requires the API URL"],
  ])("rejects an invalid API URL (%s)", (apiUrl) => {
    expect(() =>
      createStagingEnvironment({ ...environment, EXPO_PUBLIC_API_URL: apiUrl })
    ).toThrow();
  });
  test.each([
    ["google-client-id.apps.googleusercontent.com", "rejects placeholders"],
    ["12345678901234567890-staging-web", "rejects incomplete IDs"],
  ])("rejects malformed Google Web client IDs (%s)", (clientId) => {
    expect(() =>
      createStagingEnvironment({
        ...environment,
        EXPO_PUBLIC_GOOGLE_CLIENT_ID: clientId,
      })
    ).toThrow(
      "EXPO_PUBLIC_GOOGLE_CLIENT_ID must be a Google OAuth Web client ID"
    );
  });

  test("requires externally supplied staging credentials and terms", () => {
    expect(() =>
      createStagingEnvironment({
        ...environment,
        EXPO_PUBLIC_GOOGLE_CLIENT_ID: "",
      })
    ).toThrow("EXPO_PUBLIC_GOOGLE_CLIENT_ID is required");
    expect(() =>
      createStagingEnvironment({
        ...environment,
        EXPO_PUBLIC_TERMS_VERSION: "  ",
      })
    ).toThrow("EXPO_PUBLIC_TERMS_VERSION is required");
  });

  test("starts Expo in dev-client mode with staging selectors", () => {
    const spawn = jest.fn().mockReturnValue({ status: 0 });

    expect(runStagingStart({ environment, spawn })).toBe(0);
    expect(spawn).toHaveBeenCalledWith(
      "bun",
      ["x", "expo", "start", "--dev-client"],
      expect.objectContaining({
        env: expect.objectContaining({
          APP_VARIANT: "staging",
          ANDROID_VERSION_CODE: "1",
          EXPO_NO_DOTENV: "1",
          EXPO_PUBLIC_PROFILE_DEMO: "false",
        }),
        stdio: "inherit",
      })
    );
  });

  test("passes an explicit Expo port to avoid an occupied Metro port", () => {
    const spawn = jest.fn().mockReturnValue({ status: 0 });

    expect(
      runStagingStart({
        environment: { ...environment, EXPO_PORT: "8082" },
        spawn,
      })
    ).toBe(0);
    expect(spawn).toHaveBeenCalledWith(
      "bun",
      ["x", "expo", "start", "--dev-client", "--port", "8082"],
      expect.anything()
    );
  });
});
