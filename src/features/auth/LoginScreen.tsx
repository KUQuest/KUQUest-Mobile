import React, { useState } from 'react';
import { Text, View, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Host, Button } from '@expo/ui';
import { SymbolView } from 'expo-symbols';
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>KUQUEST</Text>
            <Text style={styles.subtitle}>{messages.subtitle}</Text>
          </View>

          {/* Form / Actions Section */}
          <View style={styles.formSection}>
            <View
              style={styles.noticeCard}
              accessibilityRole="text"
              accessibilityLabel={`${messages.noticeTextPrefix} ${messages.noticeEmailDomain} ${messages.noticeTextSuffix}`}
            >
              <SymbolView
                name="graduationcap.fill"
                size={24}
                tintColor={colors.primary}
              />
              <Text style={styles.noticeText}>
                {messages.noticeTextPrefix}{' '}
                <Text style={styles.noticeTextBold}>
                  {messages.noticeEmailDomain}
                </Text>{' '}
                {messages.noticeTextSuffix}
              </Text>
            </View>

            {/* Error Banner */}
            {error && (
              <View
                style={styles.errorCard}
                accessibilityRole="alert"
                accessibilityLabel={getAuthErrorText(error.code, currentLocale)}
                testID="error-banner"
              >
                <SymbolView
                  name="exclamationmark.triangle.fill"
                  size={22}
                  tintColor={colors.danger}
                />
                <View style={styles.errorContent}>
                  <Text style={styles.errorText} testID="error-message">
                    {getAuthErrorText(error.code, currentLocale)}
                  </Text>
                  {error.message && (
                    <Text style={[styles.errorText, { fontSize: 12, marginTop: 4, color: colors.dangerLight }]}>
                      {error.message}
                    </Text>
                  )}
                  <Pressable
                    style={styles.retryButton}
                    onPress={handleAuth}
                    accessibilityRole="button"
                    accessibilityLabel={messages.retryButton}
                    testID="retry-button"
                  >
                    <Text style={styles.retryButtonText}>
                      {messages.retryButton}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            <Host seedColor={colors.primary} matchContents style={styles.hostWrapper}>
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

          {/* Footer Section */}
          <View style={styles.footerSection}>
            <View style={styles.footerLinks}>
              <Pressable>
                <Text style={styles.footerLinkText}>
                  {messages.termsOfService}
                </Text>
              </Pressable>
              <Pressable>
                <Text style={styles.footerLinkText}>
                  {messages.privacyPolicy}
                </Text>
              </Pressable>
              <Pressable>
                <Text style={styles.footerLinkText}>
                  {messages.contactUs}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.copyrightText}>
              © 2024 KUQUEST. All rights reserved.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
