import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "@/tw";
import { useRouter } from "expo-router";
import { colors } from "@/theme/colors";
import LoginScreen from "./LoginScreen";
import { authService } from "./AuthService";
import { useSessionQuery } from "./sessionQueries";
import { authMessages } from "../../locales/authMessages";
import { useLocale } from "@/features/preferences/localeStore";
import { RoutingDestination } from "./types";

export default function Index() {
  const [routingFailed, setRoutingFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const router = useRouter();
  const { locale } = useLocale();
  const messages = authMessages[locale];
  const sessionQuery = useSessionQuery();

  const handleNavigate = React.useCallback(
    (dest: RoutingDestination) => {
      if (dest.type === "HOME") {
        router.replace("/(tabs)");
      } else {
        router.replace({
          pathname: "/onboarding",
          params: { step: String(dest.step) },
        });
      }
    },
    [router]
  );

  useEffect(() => {
    if (!sessionQuery.data) return;
    let mounted = true;
    void authService
      .getRoutingDestination()
      .then((dest) => {
        if (mounted) handleNavigate(dest);
      })
      .catch(() => {
        if (mounted) setRoutingFailed(true);
      });
    return () => {
      mounted = false;
    };
  }, [attempt, handleNavigate, sessionQuery.data]);

  const status =
    sessionQuery.isError || routingFailed
      ? "error"
      : sessionQuery.isPending || sessionQuery.isFetching || sessionQuery.data
        ? "loading"
        : "unauthenticated";

  if (status === "loading") {
    return (
      <View
        className="flex-1 items-center justify-center bg-ku-background"
        testID="auth-gate-loading"
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (status === "error") {
    return (
      <View
        className="flex-1 items-center justify-center bg-ku-background p-[24px]"
        accessibilityRole="alert"
        testID="auth-gate-error"
      >
        <Text className="text-center font-ku-bold text-ku-subtitle text-ku-text-strong">
          {messages.sessionLoadTitle}
        </Text>
        <Text className="mt-[8px] text-center text-ku-text-secondary">
          {messages.sessionLoadDescription}
        </Text>
        <Pressable
          accessibilityRole="button"
          className="mt-[20px] min-h-[44px] justify-center rounded-ku-pill bg-ku-primary px-[24px]"
          onPress={() => {
            setRoutingFailed(false);
            setAttempt((value) => value + 1);
            void sessionQuery.refetch();
          }}
          testID="auth-gate-retry"
        >
          <Text className="font-ku-semibold text-ku-white">
            {messages.retryButton}
          </Text>
        </Pressable>
      </View>
    );
  }

  return <LoginScreen onNavigate={handleNavigate} />;
}
