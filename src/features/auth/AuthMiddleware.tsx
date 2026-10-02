import { useEffect, useRef, type PropsWithChildren } from "react";
import { useRouter, useSegments } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import { ActivityIndicator, View } from "@/tw";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { setUnauthorizedHandler } from "@/api/ApiClient";
import { closeAllServerSockets } from "@/api/ServerSocket";

import { authEnvironment } from "./authEnvironment";
import { clearSessionCache, useSessionQuery } from "./sessionQueries";
import { authService } from "./AuthService";

export function isPublicAuthRoute(
  segments: readonly string[],
  isDevelopment = __DEV__
): boolean {
  if (
    segments.length === 0 ||
    segments.every((segment) => segment === "index")
  ) {
    return true;
  }

  if (segments[0] === "invite" && segments[1] === "team") return true;
  return (
    isDevelopment && segments[0] === "dev" && segments[1] === "import-session"
  );
}

function AuthRouteCheck({
  children,
  isPublicRoute,
}: PropsWithChildren<{
  isPublicRoute: boolean;
}>) {
  const { colors } = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionQuery = useSessionQuery({ enabled: !isPublicRoute });
  const sessionRef = useRef(sessionQuery.data);
  const expiredRef = useRef(false);
  // A failed background refetch keeps the cached session; only a missing one is invalid.
  const sessionInvalid =
    !isPublicRoute && !sessionQuery.isPending && !sessionQuery.data;

  useEffect(() => {
    sessionRef.current = sessionQuery.data;
  }, [sessionQuery.data]);

  useEffect(() => {
    if (sessionQuery.data) expiredRef.current = false;
  }, [sessionQuery.data]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (expiredRef.current || !sessionRef.current) return;
      expiredRef.current = true;
      closeAllServerSockets();
      void authService
        .signOut()
        .catch(() => undefined)
        .finally(() => {
          clearSessionCache(queryClient);
          router.replace({
            pathname: "/",
            params: { sessionExpired: "1" },
          });
        });
    });
    return () => setUnauthorizedHandler(null);
  }, [queryClient, router]);

  useEffect(() => {
    if (sessionInvalid) router.replace("/");
  }, [router, sessionInvalid]);

  const isAuthorized = isPublicRoute || Boolean(sessionQuery.data);

  return (
    <View className="flex-1">
      {children}
      {!isAuthorized && (
        <View className="absolute inset-0 items-center justify-center bg-ku-background">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

export default function AuthMiddleware({ children }: PropsWithChildren) {
  useEffect(() => {
    void authEnvironment.hydratePersona();
  }, []);

  const segments = useSegments();
  const isDemo = authEnvironment.isDemoEnabled();
  const isPublicRoute = isDemo || isPublicAuthRoute(segments);

  return (
    <AuthRouteCheck isPublicRoute={isPublicRoute}>{children}</AuthRouteCheck>
  );
}
