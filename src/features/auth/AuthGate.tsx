import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "@/tw";
import { useRouter } from "expo-router";
import { colors } from "@/theme/colors";
import LoginScreen from "./LoginScreen";
import { authService } from "./AuthService";
import { RoutingDestination } from "./types";
import { authMessages } from "../../locales/authMessages";
import { useLocale } from "../../locales/LocaleProvider";

export default function Index() {
  const [status, setStatus] = useState<"loading" | "unauthenticated" | "error">(
    "loading"
  );
  const [attempt, setAttempt] = useState(0);
  const router = useRouter();
  const { locale } = useLocale();
  const messages = authMessages[locale];

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
    let mounted = true;

    async function checkSession() {
      let session;
      try {
        session = await authService.getSession();
      } catch {
        if (mounted) setStatus("error");
        return;
      }

      if (session && mounted) {
        try {
          const dest = await authService.getRoutingDestination();
          handleNavigate(dest);
        } catch {
          if (mounted) setStatus("error");
        }
        return;
      }

      if (mounted) setStatus("unauthenticated");
    }

    void checkSession();
    return () => {
      mounted = false;
    };
  }, [attempt, handleNavigate]);

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
            setStatus("loading");
            setAttempt((value) => value + 1);
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
