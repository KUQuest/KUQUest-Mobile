import { act, screen, waitFor } from "@testing-library/react-native";
import {
  renderWithQueryClient,
  renderWithAppTheme,
} from "@/testing/queryTestUtils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Text } from "@/tw";

import AuthMiddleware, { isPublicAuthRoute } from "../AuthMiddleware";

const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };
const mockGetSession = jest.fn();
const mockIsDemoEnabled = jest.fn(() => false);
const mockProtectedMount = jest.fn();
let mockSegments: string[] = [];

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useSegments: () => mockSegments,
}));

jest.mock("../AuthService", () => ({
  authService: {
    getSession: (...args: unknown[]) => mockGetSession(...args),
  },
}));

jest.mock("../authEnvironment", () => ({
  authEnvironment: {
    isDemoEnabled: () => mockIsDemoEnabled(),
    hydratePersona: jest.fn().mockResolvedValue(undefined),
  },
}));

function ProtectedContent() {
  useEffect(() => {
    mockProtectedMount();
  }, []);

  return <Text testID="protected-content">Protected content</Text>;
}

describe("AuthMiddleware", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockGetSession.mockReset();
    mockIsDemoEnabled.mockReset();
    mockIsDemoEnabled.mockReturnValue(false);
    mockProtectedMount.mockReset();
    mockSegments = [];
  });

  test("keeps the auth entry route public", () => {
    expect(isPublicAuthRoute([])).toBe(true);
    expect(isPublicAuthRoute(["index"])).toBe(true);
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  test("allows the development session handoff route only in development", () => {
    expect(isPublicAuthRoute(["dev", "import-session"], true)).toBe(true);
    expect(isPublicAuthRoute(["dev", "import-session"], false)).toBe(false);
  });

  test("bypasses session checks for development demo mode", async () => {
    mockSegments = ["(tabs)"];
    mockIsDemoEnabled.mockReturnValue(true);

    const view = await renderWithQueryClient(
      <AuthMiddleware>
        <ProtectedContent />
      </AuthMiddleware>
    );

    expect(view.getByTestId("protected-content")).toBeTruthy();
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  test("renders protected content after a valid session check", async () => {
    mockSegments = ["(tabs)"];
    mockGetSession.mockResolvedValue({ user: { id: "student-1" } });

    await act(async () => {
      renderWithQueryClient(
        <AuthMiddleware>
          <ProtectedContent />
        </AuthMiddleware>
      );
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(screen.getByTestId("protected-content")).toBeTruthy()
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("does not refetch the session when the route changes", async () => {
    mockSegments = ["(tabs)"];
    mockGetSession.mockResolvedValue({ user: { id: "student-1" } });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const view = await renderWithAppTheme(
      <QueryClientProvider client={queryClient}>
        <AuthMiddleware>
          <ProtectedContent />
        </AuthMiddleware>
      </QueryClientProvider>
    );

    await waitFor(() => expect(mockGetSession).toHaveBeenCalledTimes(1));
    mockSegments = ["settings"];

    await act(async () => {
      await view.rerender(
        <QueryClientProvider client={queryClient}>
          <AuthMiddleware>
            <ProtectedContent />
          </AuthMiddleware>
        </QueryClientProvider>
      );
      await Promise.resolve();
    });

    expect(mockGetSession).toHaveBeenCalledTimes(1);
    expect(mockProtectedMount).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("protected-content")).toBeTruthy();
  });

  test("redirects unauthenticated routes to the auth entry", async () => {
    mockSegments = ["(tabs)"];
    mockGetSession.mockResolvedValue(null);

    renderWithQueryClient(
      <AuthMiddleware>
        <ProtectedContent />
      </AuthMiddleware>
    );

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
  });

  test("redirects to the auth entry when session lookup fails", async () => {
    mockSegments = ["settings"];
    mockGetSession.mockRejectedValue(new Error("Backend unavailable"));

    renderWithQueryClient(
      <AuthMiddleware>
        <ProtectedContent />
      </AuthMiddleware>
    );

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
  });
});
