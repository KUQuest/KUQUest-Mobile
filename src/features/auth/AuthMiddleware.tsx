import { useEffect, type PropsWithChildren } from "react";
import { useRouter, useSegments } from "expo-router";

import { ActivityIndicator, View } from "@/tw";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";

import { authEnvironment } from "./authEnvironment";
import { useSessionQuery } from "./sessionQueries";

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
  const sessionQuery = useSessionQuery({ enabled: !isPublicRoute });
  const sessionInvalid =
    !isPublicRoute &&
    !sessionQuery.isPending &&
    (sessionQuery.isError || !sessionQuery.data);

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
