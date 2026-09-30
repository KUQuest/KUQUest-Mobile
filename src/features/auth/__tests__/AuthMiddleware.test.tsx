import { z } from "zod";
import { ApiClient, setUnauthorizedHandler } from "@/api/ApiClient";
import { act, screen, waitFor } from "@testing-library/react-native";
import {
  renderWithQueryClient,
  renderWithAppTheme,
} from "@/testing/queryTestUtils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Text } from "@/tw";

import AuthMiddleware, { isPublicAuthRoute } from "../AuthMiddleware";
import { sessionKeys, useSessionQuery } from "../sessionQueries";

const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };
const mockGetSession = jest.fn();
const mockSignOut = jest.fn();
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
    signOut: (...args: unknown[]) => mockSignOut(...args),
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

function SessionStatus() {
  const session = useSessionQuery();
  return <Text testID="session-user">{session.data?.user.id}</Text>;
}
function unauthorizedClient(): ApiClient {
  return new ApiClient({
    baseUrl: "https://api.example.test",
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          code: "UNAUTHORIZED",
          message: "Session expired",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
  });
}

describe("AuthMiddleware", () => {
  beforeEach(() => {
    setUnauthorizedHandler(null);
    mockSignOut.mockReset();
    mockSignOut.mockResolvedValue(undefined);
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

  test("two concurrent 401s sign out, clear the cache and replace with sessionExpired once", async () => {
    mockSegments = ["(tabs)"];
    mockGetSession.mockResolvedValue({ user: { id: "student-1" } });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(["private", "wallet"], { spending: 100 });
    await renderWithAppTheme(
      <QueryClientProvider client={queryClient}>
        <AuthMiddleware>
          <>
            <ProtectedContent />
            <SessionStatus />
          </>
        </AuthMiddleware>
      </QueryClientProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("session-user").props.children).toBe(
        "student-1"
      )
    );
    await act(async () => {
      await Promise.resolve();
    });

    let releaseSignOut: () => void = () => undefined;
    mockSignOut.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          releaseSignOut = resolve;
        })
    );
    const client = unauthorizedClient();
    let results: PromiseSettledResult<unknown>[] = [];
    await act(async () => {
      results = await Promise.allSettled([
        client.get("/api/v1/profile", z.unknown()),
        client.get("/api/v1/wallet", z.unknown()),
      ]);
    });
    expect(results).toEqual([
      {
        status: "rejected",
        reason: expect.objectContaining({ status: 401 }),
      },
      {
        status: "rejected",
        reason: expect.objectContaining({ status: 401 }),
      },
    ]);
    await act(async () => {
      releaseSignOut();
    });
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: "/",
        params: { sessionExpired: "1" },
      })
    );
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(["private", "wallet"])).toBeUndefined();
  });

  test("ignores a 401 when there is no session", async () => {
    mockSegments = ["(tabs)"];
    mockGetSession.mockResolvedValue(null);
    await renderWithQueryClient(
      <AuthMiddleware>
        <ProtectedContent />
      </AuthMiddleware>
    );
    await waitFor(() => expect(mockGetSession).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
    const redirectsBeforeRequest = mockReplace.mock.calls.length;

    await expect(
      unauthorizedClient().get("/api/v1/profile", z.unknown())
    ).rejects.toMatchObject({ status: 401 });

    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledTimes(redirectsBeforeRequest);
  });

  test("re-arms after a new session appears", async () => {
    mockSegments = ["(tabs)"];
    mockGetSession.mockResolvedValue({ user: { id: "student-1" } });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const view = await renderWithAppTheme(
      <QueryClientProvider client={queryClient}>
        <AuthMiddleware>
          <>
            <ProtectedContent />
            <SessionStatus />
          </>
        </AuthMiddleware>
      </QueryClientProvider>
    );
    await waitFor(() => expect(screen.getByText("student-1")).toBeTruthy());
    await act(async () => {
      await Promise.resolve();
    });
    const client = unauthorizedClient();
    await act(async () => {
      await expect(
        client.get("/api/v1/profile", z.unknown())
      ).rejects.toMatchObject({ status: 401 });
    });
    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: "/",
        params: { sessionExpired: "1" },
      })
    );
    mockGetSession.mockResolvedValue({ user: { id: "student-2" } });

    await act(async () => {
      queryClient.setQueryData(sessionKeys.detail(), {
        user: { id: "student-2" },
      });
      await view.rerender(
        <QueryClientProvider client={queryClient}>
          <AuthMiddleware>
            <>
              <ProtectedContent />
              <SessionStatus />
            </>
          </AuthMiddleware>
        </QueryClientProvider>
      );
    });
    await waitFor(() => expect(screen.getByText("student-2")).toBeTruthy());
    await act(async () => {
      await expect(
        client.get("/api/v1/profile", z.unknown())
      ).rejects.toMatchObject({ status: 401 });
    });
    await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(2));
  });
});
