import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithQueryClient } from "@/testing/queryTestUtils";
import React from "react";
import AuthGate from "../AuthGate";

const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };
const mockGetSession = jest.fn();
const mockGetRoutingDestination = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
}));

jest.mock("../AuthService", () => ({
  authService: {
    getSession: () => mockGetSession(),
    getRoutingDestination: () => mockGetRoutingDestination(),
  },
}));

jest.mock("../LoginScreen", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return {
    __esModule: true,
    default: () => (
      <View testID="login-screen">
        <Text>Login Screen</Text>
      </View>
    ),
  };
});

jest.mock("../../../features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));

describe("AuthGate real user authentication flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("routes an authenticated user to the Home tabs when registration is complete", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "user-1", email: "student@ku.th" },
    });
    mockGetRoutingDestination.mockResolvedValueOnce({ type: "HOME" });

    await renderWithQueryClient(<AuthGate />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
    });
  });

  it("routes an authenticated user to onboarding when registration is pending", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: { id: "user-2", email: "student2@ku.th" },
    });
    mockGetRoutingDestination.mockResolvedValueOnce({
      type: "ONBOARDING",
      step: 1,
    });

    await renderWithQueryClient(<AuthGate />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: "/onboarding",
        params: { step: "1" },
      });
    });
  });

  it("renders the LoginScreen when no active session exists", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const view = await renderWithQueryClient(<AuthGate />);

    await waitFor(() => {
      expect(view.getByTestId("login-screen")).toBeTruthy();
    });
  });

  it("displays the error surface and supports retry on session load failure", async () => {
    mockGetSession.mockRejectedValueOnce(new Error("Network failure"));

    const view = await renderWithQueryClient(<AuthGate />);

    await waitFor(() => {
      expect(view.getByTestId("auth-gate-error")).toBeTruthy();
      expect(view.getByTestId("auth-gate-retry")).toBeTruthy();
    });

    // When retry is clicked
    mockGetSession.mockResolvedValueOnce({
      user: { id: "user-1", email: "student@ku.th" },
    });
    mockGetRoutingDestination.mockResolvedValueOnce({ type: "HOME" });

    fireEvent.press(view.getByTestId("auth-gate-retry"));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
    });
  });
});
