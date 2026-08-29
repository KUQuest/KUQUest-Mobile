import {
  AuthService,
  type BetterAuthClientApi,
  type NativeGoogleSigninApi,
} from "../AuthService";
import * as SecureStore from "expo-secure-store";
import { ApiClient } from "../../../api/ApiClient";
import { AuthError, type AuthSession } from "../types";
import type { SignInResponse } from "@react-native-google-signin/google-signin";

const API_BASE_URL = "https://api.example.test";

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  } as Response;
}

function createUser() {
  return {
    id: "user-1",
    name: "KU Student",
    email: "student@ku.th",
    emailVerified: true,
    image: null,
    firstName: "KU",
    lastName: "Student",
    createdAt: "2026-08-11T00:00:00.000Z",
    updatedAt: "2026-08-11T00:00:00.000Z",
  };
}

function createSession(): AuthSession {
  return {
    user: createUser(),
  };
}

function createRegistrationStatus(completed: boolean) {
  return {
    success: true,
    data: {
      firstName: "KU",
      lastName: "Student",
      telephone: completed ? "0812345678" : null,
      occupationId: completed ? "occupation-id" : null,
      studentId: completed ? "6712345678" : null,
      departmentId: completed ? "department-id" : null,
      termsAcceptedAt: completed ? "2026-08-11T00:00:00.000Z" : null,
      termsVersion: completed ? "2026-01-01" : null,
      completed,
    },
  };
}

function nativeSuccess(data: object): SignInResponse {
  return { type: "success", data } as unknown as SignInResponse;
}

function createGoogleSignin(): jest.Mocked<NativeGoogleSigninApi> {
  return {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn(),
    signOut: jest.fn().mockResolvedValue(null),
  };
}

type MockedBetterAuthClient = {
  signIn: { social: jest.Mock };
  getSession: jest.Mock;
  signOut: jest.Mock;
};

function createBetterAuthClient(): MockedBetterAuthClient {
  return {
    signIn: { social: jest.fn() },
    getSession: jest.fn(),
    signOut: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
}

describe("AuthService", () => {
  let auth: AuthService;
  let fetchMock: jest.Mock;
  let googleSignin: jest.Mocked<NativeGoogleSigninApi>;
  let betterAuth: MockedBetterAuthClient;

  beforeEach(() => {
    fetchMock = jest.fn();
    googleSignin = createGoogleSignin();
    betterAuth = createBetterAuthClient();
    auth = new AuthService({
      apiClient: new ApiClient({
        baseUrl: API_BASE_URL,
        fetchImpl: fetchMock as unknown as typeof fetch,
        cookieProvider: () => "better-auth.session_token=session-cookie",
      }),
      googleSignin,
      authClient: betterAuth as BetterAuthClientApi,
    });
  });

  test("signs in with the native Google ID token", async () => {
    googleSignin.signIn.mockResolvedValue(
      nativeSuccess({
        idToken: "google-id-token",
        user: { email: "student@ku.th" },
      }),
    );
    betterAuth.signIn.social.mockResolvedValue({
      data: { user: createUser() },
      error: null,
    });
    await expect(auth.authenticate()).resolves.toEqual(createSession());

    expect(betterAuth.signIn.social).toHaveBeenCalledWith({
      provider: "google",
      idToken: { token: "google-id-token" },
    });
    fetchMock.mockResolvedValue(response(createRegistrationStatus(false)));
    await expect(auth.getRoutingDestination()).resolves.toEqual({
      type: "ONBOARDING",
      step: 1,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/v1/academic-registration/status`,
      expect.objectContaining({
        credentials: "omit",
        headers: { Cookie: "better-auth.session_token=session-cookie" },
      }),
    );
  });

  test("does not send the Google email as an authentication credential", async () => {
    googleSignin.signIn.mockResolvedValue(
      nativeSuccess({
        idToken: "google-id-token",
        user: { email: "student@ku.th" },
      }),
    );
    betterAuth.signIn.social.mockResolvedValue({
      data: { user: createUser() },
      error: null,
    });
    await auth.authenticate();

    expect(betterAuth.signIn.social).toHaveBeenCalledWith({
      provider: "google",
      idToken: { token: "google-id-token" },
    });
  });

  test("maps Google cancellation to a cancellation error", async () => {
    googleSignin.signIn.mockResolvedValue({
      type: "cancelled",
      data: undefined,
    } as unknown as SignInResponse);

    await expect(auth.authenticate()).rejects.toEqual(
      new AuthError("OAUTH_CANCELLED"),
    );
    expect(betterAuth.signIn.social).not.toHaveBeenCalled();
  });

  test("reports unavailable Google Play Services", async () => {
    googleSignin.hasPlayServices.mockResolvedValue(false);

    await expect(auth.authenticate()).rejects.toEqual(
      new AuthError("PLAY_SERVICES_UNAVAILABLE"),
    );
    expect(googleSignin.signIn).not.toHaveBeenCalled();
  });

  test("rejects a missing Google ID token", async () => {
    googleSignin.signIn.mockResolvedValue(
      nativeSuccess({ user: { email: "student@ku.th" } }),
    );

    await expect(auth.authenticate()).rejects.toEqual(
      new AuthError(
        "OAUTH_FAILED",
        "Google Sign-In did not return an ID token",
      ),
    );
  });

  test("maps Better Auth sign-in failures", async () => {
    googleSignin.signIn.mockResolvedValue(
      nativeSuccess({
        idToken: "google-id-token",
        user: { email: "student@ku.th" },
      }),
    );
    betterAuth.signIn.social.mockResolvedValue({
      data: null,
      error: new Error("Invalid token"),
    });

    await expect(auth.authenticate()).rejects.toEqual(
      new AuthError("OAUTH_FAILED", "Invalid token"),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("rejects an email outside the student domain", async () => {
    googleSignin.signIn.mockResolvedValue(
      nativeSuccess({
        idToken: "google-id-token",
        user: { email: "someone@gmail.com" },
      }),
    );

    await expect(auth.authenticate()).rejects.toEqual(
      new AuthError("INVALID_EMAIL_DOMAIN"),
    );
    expect(betterAuth.signIn.social).not.toHaveBeenCalled();
  });

  test("clears the chosen Google account when the email domain is rejected", async () => {
    googleSignin.signIn.mockResolvedValue(
      nativeSuccess({
        idToken: "google-id-token",
        user: { email: "someone@gmail.com" },
      }),
    );

    await expect(auth.authenticate()).rejects.toThrow();
    expect(googleSignin.signOut).toHaveBeenCalledTimes(1);
  });

  test("clears the chosen Google account when Better Auth rejects the sign-in", async () => {
    googleSignin.signIn.mockResolvedValue(
      nativeSuccess({
        idToken: "google-id-token",
        user: { email: "student@ku.th" },
      }),
    );
    betterAuth.signIn.social.mockResolvedValue({
      data: null,
      error: new Error("Invalid token"),
    });

    await expect(auth.authenticate()).rejects.toThrow();
    expect(googleSignin.signOut).toHaveBeenCalledTimes(1);
  });

  test("clears the chosen Google account when no ID token comes back", async () => {
    googleSignin.signIn.mockResolvedValue(
      nativeSuccess({ user: { email: "student@ku.th" } }),
    );

    await expect(auth.authenticate()).rejects.toThrow();
    expect(googleSignin.signOut).toHaveBeenCalledTimes(1);
  });

  test("keeps the Google account when the user cancels before choosing one", async () => {
    googleSignin.signIn.mockResolvedValue({
      type: "cancelled",
      data: undefined,
    } as unknown as SignInResponse);

    await expect(auth.authenticate()).rejects.toThrow();
    expect(googleSignin.signOut).not.toHaveBeenCalled();
  });

  test("still reports the sign-in failure when clearing the account fails", async () => {
    googleSignin.signIn.mockResolvedValue(
      nativeSuccess({
        idToken: "google-id-token",
        user: { email: "someone@gmail.com" },
      }),
    );
    googleSignin.signOut.mockRejectedValue(new Error("Play Services offline"));

    await expect(auth.authenticate()).rejects.toEqual(
      new AuthError("INVALID_EMAIL_DOMAIN"),
    );
  });

  test("retrieves the Better Auth session without reading a local token", async () => {
    betterAuth.getSession.mockResolvedValue({
      data: { user: createUser() },
      error: null,
    });

    await expect(auth.getSession()).resolves.toEqual(createSession());
  });

  test("normalizes Better Auth Date timestamps in the session user", async () => {
    betterAuth.getSession.mockResolvedValue({
      data: {
        user: {
          ...createUser(),
          createdAt: new Date("2026-08-11T00:00:00.000Z"),
          updatedAt: new Date("2026-08-11T00:00:00.000Z"),
        },
      },
      error: null,
    });

    await expect(auth.getSession()).resolves.toEqual(createSession());
  });

  test("returns no session when Better Auth has no active session", async () => {
    betterAuth.getSession.mockResolvedValue({ data: null, error: null });

    await expect(auth.getSession()).resolves.toBeNull();
  });

  test("reports academic registration failures separately from sign-in", async () => {
    fetchMock.mockRejectedValue(new Error("Registration service unavailable"));

    await expect(auth.getRoutingDestination()).rejects.toEqual(
      new AuthError("API_ERROR", "Registration service unavailable"),
    );
  });

  test("routes according to refreshed academic registration status", async () => {
    fetchMock.mockResolvedValue(response(createRegistrationStatus(true)));

    await expect(auth.getRoutingDestination()).resolves.toEqual({
      type: "HOME",
    });
  });

  test("runs native Google sign-out when Better Auth sign-out fails", async () => {
    betterAuth.signOut.mockRejectedValue(new Error("Backend unavailable"));

    await expect(auth.signOut()).resolves.toBeUndefined();
    expect(betterAuth.signOut).toHaveBeenCalledTimes(1);
    expect(googleSignin.signOut).toHaveBeenCalledTimes(1);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("kuquest_cookie");
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("kuquest_session_data");
  });

  test("does not hang when a sign-out provider never responds", async () => {
    jest.useFakeTimers();
    betterAuth.signOut.mockReturnValue(new Promise(() => undefined));
    googleSignin.signOut.mockReturnValue(new Promise(() => undefined));

    const signOut = auth.signOut();
    await jest.advanceTimersByTimeAsync(2000);

    await expect(signOut).resolves.toBeUndefined();
    jest.useRealTimers();
  });
});
