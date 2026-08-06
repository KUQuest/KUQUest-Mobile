import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Host, Button } from '@expo/ui';
import { SymbolView } from 'expo-symbols';
import {
  AuthAdapter,
  AuthErrorCode,
  AuthError,
  AuthMode,
  RoutingDestination,
} from '../auth/types';
import { authService, AuthService } from '../auth/AuthService';
import {
  authMessages,
  getAuthErrorText,
  SupportedLocale,
} from '../locales/authMessages';

export interface LoginScreenProps {
  onNext?: () => void;
  onNavigate?: (dest: RoutingDestination) => void;
  locale?: SupportedLocale;
  onLocaleChange?: (locale: SupportedLocale) => void;
  authAdapter?: AuthAdapter;
  mockCredentialForTesting?: string;
}

export default function LoginScreen({
  onNext,
  onNavigate,
  locale = 'th',
  onLocaleChange,
  authAdapter = authService,
  mockCredentialForTesting,
}: LoginScreenProps) {
  const { width } = useWindowDimensions();
  const buttonWidth = Math.min(width - 48, 420);

  const [currentLocale, setCurrentLocale] = useState<SupportedLocale>(locale);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{
    code: AuthErrorCode;
    message: string;
    lastMode?: AuthMode;
  } | null>(null);

  const messages = authMessages[currentLocale];

  const handleToggleLocale = () => {
    const nextLocale: SupportedLocale = currentLocale === 'th' ? 'en' : 'th';
    setCurrentLocale(nextLocale);
    onLocaleChange?.(nextLocale);
    if (error) {
      setError((prev) =>
        prev
          ? {
            ...prev,
            message: getAuthErrorText(prev.code, nextLocale),
          }
          : null
      );
    }
  };

  const handleAuth = async (mode: AuthMode) => {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      let session;
      if (mockCredentialForTesting) {
        session = await authAdapter.authenticateWithGoogle(
          mockCredentialForTesting,
          mode
        );
      } else if (authAdapter instanceof AuthService) {
        session = await authAdapter.signInWithNativeGoogle(mode);
      } else {
        session = await authAdapter.authenticateWithGoogle(
          'student.test@ku.th',
          mode
        );
      }

      setIsLoading(false);
      const dest = AuthService.getRoutingDestination(session);
      if (onNavigate) {
        onNavigate(dest);
      } else if (onNext) {
        onNext();
      }
    } catch (err: any) {
      setIsLoading(false);
      const errorCode: AuthErrorCode =
        err instanceof AuthError ? err.code : 'OAUTH_FAILED';
      setError({
        code: errorCode,
        message: getAuthErrorText(errorCode, currentLocale),
        lastMode: mode,
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Language Toggle */}
          <Pressable
            style={styles.langToggle}
            onPress={handleToggleLocale}
            accessibilityRole="button"
            accessibilityLabel={`Switch language to ${currentLocale === 'th' ? 'English' : 'Thai'
              }`}
            testID="language-switcher"
          >
            <Text style={styles.langToggleText}>
              {currentLocale === 'th' ? 'TH / EN' : 'EN / TH'}
            </Text>
          </Pressable>

          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>KUQUEST</Text>
            <Text style={styles.subtitle}>ACADEMIC VENTURE NETWORK</Text>
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
                tintColor="#014925"
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
                accessibilityLabel={error.message}
                testID="error-banner"
              >
                <SymbolView
                  name="exclamationmark.triangle.fill"
                  size={22}
                  tintColor="#D32F2F"
                />
                <View style={styles.errorContent}>
                  <Text style={styles.errorText} testID="error-message">
                    {error.message}
                  </Text>
                  {error.lastMode && (
                    <Pressable
                      style={styles.retryButton}
                      onPress={() => handleAuth(error.lastMode!)}
                      accessibilityRole="button"
                      accessibilityLabel={messages.retryButton}
                      testID="retry-button"
                    >
                      <Text style={styles.retryButtonText}>
                        {messages.retryButton}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}

            {/* Sign Up with Google Button */}
            <Host seedColor="#004D25" matchContents style={styles.hostWrapper}>
              <Button
                variant="filled"
                label={isLoading ? messages.loadingAuth : messages.signUpWithGoogle}
                onPress={() => handleAuth('signup')}
                style={{ width: buttonWidth }}
                disabled={isLoading}
                testID="signup-button"
              />
            </Host>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{messages.orDivider}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign In with Google Button */}
            <Host seedColor="#014925" matchContents style={styles.hostWrapper}>
              <Button
                variant="outlined"
                label={isLoading ? messages.loadingAuth : messages.signInWithGoogle}
                onPress={() => handleAuth('signin')}
                style={{ width: buttonWidth }}
                disabled={isLoading}
                testID="signin-button"
              />
            </Host>
          </View>

          {/* Footer Section */}
          <View style={styles.footerSection}>
            <View style={styles.footerLinks}>
              <Pressable onPress={() => { }}>
                <Text style={styles.footerLinkText}>
                  {messages.termsOfService}
                </Text>
              </Pressable>
              <Pressable onPress={() => { }}>
                <Text style={styles.footerLinkText}>
                  {messages.privacyPolicy}
                </Text>
              </Pressable>
              <Pressable onPress={() => { }}>
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

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    justifyContent: 'space-between',
    paddingVertical: 24,
    gap: 32,
  },
  langToggle: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F0F4F1',
    borderWidth: 1,
    borderColor: '#D0E3D5',
  }, langToggleText: {
    fontFamily: 'NotoSansThai',
    fontSize: 12,
    fontWeight: '700',
    color: '#014925',
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 4,
  },
  title: {
    fontFamily: 'NotoSansThai',
    fontSize: 44,
    fontWeight: '800',
    color: '#014925',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'NotoSansThai',
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    letterSpacing: 2.5,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 6,
  },
  formSection: {
    width: '100%',
    gap: 16,
  },
  noticeCard: {
    backgroundColor: '#EAF6ED',
    borderColor: '#C5E1C9',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  noticeText: {
    flex: 1,
    fontFamily: 'NotoSansThai',
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  noticeTextBold: {
    fontFamily: 'NotoSansThai',
    fontWeight: '700',
    color: '#111111',
  },
  errorCard: {
    backgroundColor: '#FDECEF',
    borderColor: '#F5C2C7',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 4,
  },
  errorContent: {
    flex: 1,
    gap: 10,
  },
  errorText: {
    fontFamily: 'NotoSansThai',
    fontSize: 14,
    color: '#842029',
    lineHeight: 20,
    fontWeight: '500',
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#842029',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'NotoSansThai',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  hostWrapper: {
    width: '100%',
    alignSelf: 'stretch',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    fontFamily: 'NotoSansThai',
    fontSize: 14,
    color: '#777777',
    fontWeight: '500',
  },
  footerSection: {
    alignItems: 'center',
    gap: 12,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  footerLinkText: {
    fontFamily: 'NotoSansThai',
    fontSize: 13,
    fontWeight: '500',
    color: '#666666',
  },
  copyrightText: {
    fontFamily: 'NotoSansThai',
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
  },
});
