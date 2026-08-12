import React, { useState } from 'react';
import { cn } from '@/tw/cn';
import { useWindowDimensions } from 'react-native';
import { Pressable, SafeAreaView, Text, View } from '@/tw';
import { StatusBar } from 'expo-status-bar';
import { Host, Button } from '@expo/ui';
import { GraduationCap, TriangleAlert } from 'lucide-react-native';
import {
  AuthAdapter,
  AuthErrorCode,
  AuthError,
  RoutingDestination,
} from './types';
import { authService } from './AuthService';
import {
  authMessages,
  getAuthErrorText,
} from '../../locales/authMessages';
import { useLocale } from '../../locales/LocaleProvider';
import { colors } from '@/theme/colors';
import styles from './styles/loginStyles';

interface LoginErrorState {
  code: AuthErrorCode;
  message?: string;
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
  const buttonWidth = Math.min(width - 48, 420);

  const { locale: currentLocale } = useLocale();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LoginErrorState | null>(null);

  const messages = authMessages[currentLocale];

  const handleAuth = async () => {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      await authAdapter.authenticate();
      const destination = await authAdapter.getRoutingDestination();

      setIsLoading(false);
      if (onNavigate) {
        onNavigate(destination);
      } else if (onNext) {
        onNext();
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const errorCode: AuthErrorCode =
        err instanceof AuthError ? err.code : 'OAUTH_FAILED';
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      setError({
        code: errorCode,
        message,
      });
    }
  };

  return (
    <SafeAreaView className={styles.safeArea}>
      <StatusBar style="dark" />
      <View className={styles.container}>
        <View className={styles.content}>
          {/* Header Section */}
          <View className={styles.headerSection}>
            <Text className={styles.title}>KUQUEST</Text>
            <Text className={styles.subtitle}>{messages.subtitle}</Text>
          </View>

          {/* Form / Actions Section */}
          <View className={styles.formSection}>
            <View
              className={styles.noticeCard}
              accessibilityRole="text"
              accessibilityLabel={`${messages.noticeTextPrefix} ${messages.noticeEmailDomain} ${messages.noticeTextSuffix}`}
            >
              <GraduationCap color={colors.primary} size={24} strokeWidth={2} />
              <Text className={styles.noticeText}>
                {messages.noticeTextPrefix}{' '}
                <Text className={styles.noticeTextBold}>
                  {messages.noticeEmailDomain}
                </Text>{' '}
                {messages.noticeTextSuffix}
              </Text>
            </View>

            {/* Error Banner */}
            {error && (
              <View
                className={styles.errorCard}
                accessibilityRole="alert"
                accessibilityLabel={getAuthErrorText(error.code, currentLocale)}
                testID="error-banner"
              >
                <TriangleAlert color={colors.danger} size={22} strokeWidth={2} />
                <View className={styles.errorContent}>
                  <Text className={styles.errorText} testID="error-message">
                    {getAuthErrorText(error.code, currentLocale)}
                  </Text>
                  {error.message && (
                    <Text className={cn(styles.errorText, 'text-[12px] mt-[4px] text-ku-danger-light')}>
                      {error.message}
                    </Text>
                  )}
                  <Pressable
                    className={styles.retryButton}
                    onPress={handleAuth}
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
                  label={isLoading ? messages.loadingAuth : messages.signInWithGoogle}
                  onPress={handleAuth}
                  style={{ width: buttonWidth }}
                  disabled={isLoading}
                  testID="signin-button"
                />
              </Host>
            </View>
          </View>

          {/* Footer Section */}
          <View className={styles.footerSection}>
            <View className={styles.footerLinks} accessibilityRole="text">
              <Text className={styles.footerLinkText}>{messages.termsOfService}</Text>
              <Text className={styles.footerLinkText}>{messages.privacyPolicy}</Text>
              <Text className={styles.footerLinkText}>{messages.contactUs}</Text>
            </View>
            <Text className={styles.copyrightText}>
              © 2024 KUQUEST. All rights reserved.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
