import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/tw/cn";
import { useWindowDimensions } from "react-native";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { Host, Button } from "@expo/ui";
import { GraduationCap, TriangleAlert } from "lucide-react-native";
import {
  AuthAdapter,
  AuthErrorCode,
  AuthError,
  RoutingDestination,
} from "./types";
import { authService } from "./AuthService";
import {
  signInWithStagingTestAccount,
  STAGING_TEST_ACCOUNTS,
  type StagingTestAccount,
} from "./stagingTestAuth";
import { clearSessionCache } from "./sessionQueries";
import { authMessages, getAuthErrorText } from "../../locales/authMessages";
import { useLocale } from "@/features/preferences/localeStore";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import styles from "./styles/loginStyles";

type LoginErrorCode = AuthErrorCode | "STAGING_TEST_AUTH_FAILED";

interface LoginErrorState {
  code: LoginErrorCode;
  message?: string;
  retry: () => void;
}

export interface LoginScreenProps {
  onNext?: () => void;
  onNavigate?: (dest: RoutingDestination) => void;
  authAdapter?: AuthAdapter;
}

export default function LoginScreen({
  onNext,
  onNavigate,
  authAdapter = authService,
}: LoginScreenProps) {
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const buttonWidth = Math.min(width - 48, 420);

  const { locale: currentLocale } = useLocale();
  const queryClient = useQueryClient();
  const messages = authMessages[currentLocale];

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LoginErrorState | null>(null);

  const completeSignIn = async () => {
    clearSessionCache(queryClient);
    const destination = await authAdapter.getRoutingDestination();
    setIsLoading(false);
    if (onNavigate) {
      onNavigate(destination);
    } else if (onNext) {
      onNext();
    }
  };

  const handleAuth = async () => {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      await authAdapter.authenticate();
      await completeSignIn();
    } catch (err: unknown) {
      setIsLoading(false);
      const errorCode: LoginErrorCode =
        err instanceof AuthError ? err.code : "OAUTH_FAILED";
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      setError({ code: errorCode, message, retry: handleAuth });
    }
  };

  const handleStagingTestAuth = async (accountId: StagingTestAccount) => {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      await signInWithStagingTestAccount(accountId);
      await completeSignIn();
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      setError({
        code: "STAGING_TEST_AUTH_FAILED",
        message,
        retry: () => handleStagingTestAuth(accountId),
      });
    }
  };

  const errorText = error
    ? error.code === "STAGING_TEST_AUTH_FAILED"
      ? messages.stagingTestSignInFailed
      : getAuthErrorText(error.code, currentLocale)
    : "";

  return (
    <ScreenLayout className={styles.safeArea}>
      <ScrollView contentContainerClassName={styles.scrollContent}>
        <View className={styles.content}>
          <View className={styles.hero}>
            <View className={styles.heroMark}>
              <GraduationCap color={colors.primary} size={28} strokeWidth={2} />
            </View>
            <Text className={styles.title} accessibilityRole="header">
              KUQuest
            </Text>
            <Text className={styles.subtitle}>{messages.subtitle}</Text>
          </View>

          <View className={styles.formSection}>
            <View
              className={styles.noticeCard}
              accessibilityRole="text"
              accessibilityLabel={`${messages.noticeTextPrefix} ${messages.noticeEmailDomain} ${messages.noticeTextSuffix}`}
            >
              <GraduationCap color={colors.primary} size={24} strokeWidth={2} />
              <Text className={styles.noticeText}>
                {messages.noticeTextPrefix}{" "}
                <Text className={styles.noticeTextBold}>
                  {messages.noticeEmailDomain}
                </Text>{" "}
                {messages.noticeTextSuffix}
              </Text>
            </View>

            {error && (
              <View
                className={styles.errorCard}
                accessibilityRole="alert"
                accessibilityLabel={errorText}
                testID="error-banner"
              >
                <TriangleAlert
                  color={colors.danger}
                  size={22}
                  strokeWidth={2}
                />
                <View className={styles.errorContent}>
                  <Text className={styles.errorText} testID="error-message">
                    {errorText}
                  </Text>
                  {error.message && (
                    <Text className={cn(styles.errorText, "text-ku-label")}>
                      {error.message}
                    </Text>
                  )}
                  <Pressable
                    className={styles.retryButton}
                    onPress={error.retry}
                    accessibilityRole="button"
                    accessibilityLabel={messages.retryButton}
                    testID="retry-button"
                  >
                    <Text className={styles.retryButtonText}>
                      {messages.retryButton}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            <View className={styles.hostWrapper}>
              <Host seedColor={colors.primary} matchContents>
                <Button
                  variant="filled"
                  label={
                    isLoading ? messages.loadingAuth : messages.signInWithGoogle
                  }
                  onPress={handleAuth}
                  style={{ width: buttonWidth }}
                  disabled={isLoading}
                  testID="signin-button"
                />
              </Host>
            </View>

            {__DEV__ && (
              <View className={styles.stagingTestSection}>
                <Text className={styles.stagingTestHeading}>
                  {messages.stagingTestHeading}
                </Text>
                <View className={styles.stagingTestRow}>
                  {STAGING_TEST_ACCOUNTS.map((accountId) => (
                    <Pressable
                      key={accountId}
                      className={styles.stagingTestButton}
                      onPress={() => handleStagingTestAuth(accountId)}
                      disabled={isLoading}
                      accessibilityRole="button"
                      accessibilityLabel={`${messages.stagingTestHeading}: ${accountId}`}
                      testID={`staging-test-signin-${accountId}`}
                    >
                      <Text className={styles.stagingTestButtonText}>
                        {accountId}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View className={styles.footerSection}>
            <View className={styles.footerLinks} accessibilityRole="text">
              <Text className={styles.footerLinkText}>
                {messages.termsOfService}
              </Text>
              <Text className={styles.footerLinkText}>
                {messages.privacyPolicy}
              </Text>
              <Text className={styles.footerLinkText}>
                {messages.contactUs}
              </Text>
            </View>
            <Text className={styles.copyrightText}>
              © {new Date().getFullYear()} KUQuest. All rights reserved.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
