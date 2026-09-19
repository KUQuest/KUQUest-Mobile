import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { useRouter, useSegments } from "expo-router";

import { ActivityIndicator, View } from "@/tw";
import { colors } from "@/theme/colors";

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
  routeKey,
}: PropsWithChildren<{
  isPublicRoute: boolean;
  routeKey: string;
}>) {
  const router = useRouter();
  const routeVisit = useRouteVisit(routeKey);
  const [authorizedRouteVisit, setAuthorizedRouteVisit] = useState<
    symbol | null
  >(() => (isPublicRoute ? routeVisit : null));

  const { refetch: refetchSession } = useSessionQuery({ enabled: false });

  useEffect(() => {
    if (isPublicRoute) return;

    let active = true;

    void refetchSession().then(({ data, error }) => {
      if (!active) return;

      if (error || !data) {
        router.replace("/");
        return;
      }

      setAuthorizedRouteVisit(routeVisit);
    });

    return () => {
      active = false;
    };
  }, [isPublicRoute, refetchSession, routeVisit, router]);

  const isAuthorized = isPublicRoute || authorizedRouteVisit === routeVisit;

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

function useRouteVisit(routeKey: string): symbol {
  return useMemo(() => Symbol(routeKey), [routeKey]);
}

export default function AuthMiddleware({ children }: PropsWithChildren) {
  useEffect(() => {
    void authEnvironment.hydratePersona();
  }, []);

  const segments = useSegments();
  const isDemo = authEnvironment.isDemoEnabled();
  const isPublicRoute = isDemo || isPublicAuthRoute(segments);
  const routeKey = `${isDemo}:${segments.join("/")}`;

  return (
    <AuthRouteCheck isPublicRoute={isPublicRoute} routeKey={routeKey}>
      {children}
    </AuthRouteCheck>
  );
}
