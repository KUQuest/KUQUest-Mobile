import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { renderWithQueryClient } from "@/testing/queryTestUtils";

import LoginScreen from "../LoginScreen";
import { AuthAdapter, AuthError, type AuthSession } from "../types";
import { authMessages } from "../../../locales/authMessages";
import { signInWithStagingTestAccount } from "../stagingTestAuth";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: { extra: { appVariant: "staging" } },
  },
}));

let mockLocale: "en" | "th" = "th";
let mockSearchParams: { sessionExpired?: string } = {};

const mockExpoConstants = jest.requireMock("expo-constants").default;

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockSearchParams,
}));

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: mockLocale }),
}));
const mockSignInWithStagingTestAccount =
  signInWithStagingTestAccount as jest.Mock;

jest.mock("../stagingTestAuth", () => {
  const actual = jest.requireActual("../stagingTestAuth");
  return {
    ...actual,
    signInWithStagingTestAccount: jest.fn(),
  };
});

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "th" }],
}));

function createSession(): AuthSession {
  return {
    user: {
      id: "user-1",
      name: "KU Student",
      email: "student@ku.th",
      emailVerified: true,
      image: null,
      firstName: "KU",
      lastName: "Student",
      createdAt: "2026-08-11T00:00:00.000Z",
      updatedAt: "2026-08-11T00:00:00.000Z",
    },
  };
}

function createAdapter(): jest.Mocked<AuthAdapter> {
  return {
    authenticate: jest.fn(),
    getSession: jest.fn(),
    getRoutingDestination: jest.fn(),
    signOut: jest.fn(),
  };
}

describe("LoginScreen", () => {
  beforeEach(() => {
    mockLocale = "th";
    mockSearchParams = {};
    mockSignInWithStagingTestAccount.mockReset();
    mockExpoConstants.expoConfig.extra.appVariant = "staging";
  });
  test("offers one Google sign-in action in Thai", async () => {
    const authAdapter = createAdapter();
    await renderWithQueryClient(<LoginScreen authAdapter={authAdapter} />);

    expect(screen.getByTestId("signin-button")).toBeTruthy();
    expect(screen.queryByTestId("signup-button")).toBeNull();
    expect(screen.getByText(authMessages.th.signInWithGoogle)).toBeTruthy();
  });

  test("routes a completed Student to the home destination", async () => {
    const authAdapter = createAdapter();
    authAdapter.authenticate.mockResolvedValue(createSession());
    authAdapter.getRoutingDestination.mockResolvedValue({ type: "HOME" });
    const onNavigate = jest.fn();
    await renderWithQueryClient(
      <LoginScreen authAdapter={authAdapter} onNavigate={onNavigate} />
    );

    await fireEvent.press(screen.getByTestId("signin-button"));

    await waitFor(() => {
      expect(authAdapter.authenticate).toHaveBeenCalledWith();
      expect(onNavigate).toHaveBeenCalledWith({ type: "HOME" });
    });
  });

  test("routes an incomplete Student to onboarding", async () => {
    const authAdapter = createAdapter();
    authAdapter.authenticate.mockResolvedValue(createSession());
    authAdapter.getRoutingDestination.mockResolvedValue({
      type: "ONBOARDING",
      step: 1,
    });
    const onNavigate = jest.fn();
    await renderWithQueryClient(
      <LoginScreen authAdapter={authAdapter} onNavigate={onNavigate} />
    );

    await fireEvent.press(screen.getByTestId("signin-button"));

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith({ type: "ONBOARDING", step: 1 });
    });
  });

  test("shows a retry action for an authentication failure", async () => {
    const authAdapter = createAdapter();
    authAdapter.authenticate.mockRejectedValue(new AuthError("OAUTH_FAILED"));
    await renderWithQueryClient(<LoginScreen authAdapter={authAdapter} />);

    await fireEvent.press(screen.getByTestId("signin-button"));

    await waitFor(() => {
      expect(screen.getByTestId("error-message").props.children).toBe(
        authMessages.th.errors.OAUTH_FAILED
      );
      expect(screen.getByTestId("retry-button")).toBeTruthy();
    });
  });

  test("offers every staging test account in staging builds", async () => {
    const authAdapter = createAdapter();
    await renderWithQueryClient(<LoginScreen authAdapter={authAdapter} />);

    expect(screen.queryByTestId("staging-test-signin-account-1")).toBeNull();
    await fireEvent.press(screen.getByTestId("staging-test-toggle"));

    for (let index = 1; index <= 10; index += 1) {
      expect(
        screen.getByTestId(`staging-test-signin-account-${index}`)
      ).toBeTruthy();
    }
    expect(screen.queryByTestId("staging-test-signin-default")).toBeNull();
    expect(screen.getByText("Nattapong Srisawat")).toBeTruthy();
    expect(screen.getByText("Nichakan Kaewmanee")).toBeTruthy();
  });

  test("hides staging test accounts in UAT builds", async () => {
    mockExpoConstants.expoConfig.extra.appVariant = "uat";
    const authAdapter = createAdapter();
    await renderWithQueryClient(<LoginScreen authAdapter={authAdapter} />);

    expect(screen.queryByTestId("staging-test-toggle")).toBeNull();
  });

  test("signs in with a staging test account and routes to the resolved destination", async () => {
    const authAdapter = createAdapter();
    mockSignInWithStagingTestAccount.mockResolvedValue(undefined);
    authAdapter.getRoutingDestination.mockResolvedValue({ type: "HOME" });
    const onNavigate = jest.fn();
    await renderWithQueryClient(
      <LoginScreen authAdapter={authAdapter} onNavigate={onNavigate} />
    );

    await fireEvent.press(screen.getByTestId("staging-test-toggle"));
    await fireEvent.press(screen.getByTestId("staging-test-signin-account-1"));

    await waitFor(() => {
      expect(mockSignInWithStagingTestAccount).toHaveBeenCalledWith(
        "account-1"
      );
      expect(authAdapter.authenticate).not.toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalledWith({ type: "HOME" });
    });
  });

  test("shows a retry action for a staging test sign-in failure", async () => {
    const authAdapter = createAdapter();
    mockSignInWithStagingTestAccount.mockRejectedValue(
      new Error("STAGING_TEST_AUTH_ENABLED")
    );
    await renderWithQueryClient(<LoginScreen authAdapter={authAdapter} />);

    await fireEvent.press(screen.getByTestId("staging-test-toggle"));
    await fireEvent.press(screen.getByTestId("staging-test-signin-account-1"));

    await waitFor(() => {
      expect(screen.getByTestId("error-message").props.children).toBe(
        authMessages.th.stagingTestSignInFailed
      );
      expect(screen.getByTestId("retry-button")).toBeTruthy();
    });
  });

  test.each(["en", "th"] as const)(
    "shows the session-expired message for sessionExpired=1 (%s)",
    async (locale) => {
      mockLocale = locale;
      mockSearchParams = { sessionExpired: "1" };
      const authAdapter = createAdapter();
      await renderWithQueryClient(<LoginScreen authAdapter={authAdapter} />);

      expect(screen.getByTestId("error-message").props.children).toBe(
        authMessages[locale].errors.SESSION_EXPIRED
      );
      expect(screen.getByTestId("retry-button")).toBeTruthy();
    }
  );
});
