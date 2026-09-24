import * as SecureStore from "expo-secure-store";

import { authClient } from "../authClient";
import { AUTH_COOKIE_STORAGE_KEY } from "../authStorage";
import { signInWithStagingTestAccount } from "../stagingTestAuth";

function response(setCookie: string | null, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) => (name === "set-cookie" ? setCookie : null),
    },
  } as Response;
}

const devFlag = globalThis as typeof globalThis & { __DEV__?: boolean };
const initialDevFlag = devFlag.__DEV__;
const initialApiUrl = process.env.EXPO_PUBLIC_API_URL;
const API_BASE_URL = "https://kuquest-dev-api.kubits.org";

describe("signInWithStagingTestAccount", () => {
  beforeEach(() => {
    devFlag.__DEV__ = true;
    process.env.EXPO_PUBLIC_API_URL = API_BASE_URL;
    (authClient.getCookie as jest.Mock).mockReturnValue("");
  });

  afterEach(() => {
    if (initialDevFlag === undefined) delete devFlag.__DEV__;
    else devFlag.__DEV__ = initialDevFlag;
    if (initialApiUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = initialApiUrl;
    jest.clearAllMocks();
  });

  test("posts to the requested staging test-auth route and stores the session cookie", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(
        response("better-auth.session_token=staging-session; Path=/; HttpOnly")
      );

    await signInWithStagingTestAccount("account-1", { fetchImpl });

    expect(fetchImpl).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/staging/test-auth/sign-in/account-1`,
      expect.objectContaining({ method: "POST" })
    );
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      AUTH_COOKIE_STORAGE_KEY,
      JSON.stringify({
        "better-auth.session_token": {
          value: "staging-session",
          expires: null,
        },
      })
    );
  });

  test("signs out of a stored staging session before switching accounts", async () => {
    (authClient.getCookie as jest.Mock).mockReturnValue(
      "better-auth.session_token=previous-session"
    );
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(response(null, 200))
      .mockResolvedValueOnce(
        response("better-auth.session_token=next-session")
      );

    await signInWithStagingTestAccount("account-2", { fetchImpl });

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      `${API_BASE_URL}/api/staging/test-auth/sign-out`,
      expect.objectContaining({
        method: "POST",
        headers: { Cookie: "better-auth.session_token=previous-session" },
      })
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      `${API_BASE_URL}/api/staging/test-auth/sign-in/account-2`,
      expect.objectContaining({ method: "POST" })
    );
  });

  test("skips sign-out when no staging session is stored yet", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(response("better-auth.session_token=first-session"));

    await signInWithStagingTestAccount("default", { fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  test("throws and stores nothing when the API rejects the sign-in", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(response(null, 403));

    await expect(
      signInWithStagingTestAccount("default", { fetchImpl })
    ).rejects.toThrow("STAGING_TEST_AUTH_ENABLED");
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  test("throws when EXPO_PUBLIC_API_URL is not configured", async () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    const fetchImpl = jest.fn();

    await expect(
      signInWithStagingTestAccount("default", { fetchImpl })
    ).rejects.toThrow("EXPO_PUBLIC_API_URL is not configured");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test("refuses to run outside a debug build", async () => {
    devFlag.__DEV__ = false;
    const fetchImpl = jest.fn();

    await expect(
      signInWithStagingTestAccount("default", { fetchImpl })
    ).rejects.toThrow("debug builds");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
