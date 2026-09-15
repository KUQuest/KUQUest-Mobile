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
        className="flex-1 justify-center items-center bg-ku-background"
        testID="auth-gate-loading"
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (status === "error") {
    return (
      <View
        className="flex-1 justify-center items-center p-[24px] bg-ku-background"
        accessibilityRole="alert"
        testID="auth-gate-error"
      >
        <Text className="text-ku-text-strong text-ku-subtitle font-ku-bold text-center">
          {messages.sessionLoadTitle}
        </Text>
        <Text className="text-ku-text-secondary mt-[8px] text-center">
          {messages.sessionLoadDescription}
        </Text>
        <Pressable
          accessibilityRole="button"
          className="mt-[20px] rounded-ku-pill bg-ku-primary min-h-[44px] px-[24px] justify-center"
          onPress={() => {
            setStatus("loading");
            setAttempt((value) => value + 1);
          }}
          testID="auth-gate-retry"
        >
          <Text className="text-ku-white font-ku-semibold">
            {messages.retryButton}
          </Text>
        </Pressable>
      </View>
    );
  }

  return <LoginScreen onNavigate={handleNavigate} />;
}
