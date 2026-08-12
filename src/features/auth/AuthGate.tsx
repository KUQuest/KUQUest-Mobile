import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { colors } from '@/theme/colors';
import LoginScreen from './LoginScreen';
import { authService } from './AuthService';
import { RoutingDestination } from './types';
import { authMessages } from '../../locales/authMessages';
import { useLocale } from '../../locales/LocaleProvider';

export default function Index() {
  const [status, setStatus] = useState<'loading' | 'unauthenticated' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const router = useRouter();
  const { locale } = useLocale();
  const messages = authMessages[locale];

  const handleNavigate = React.useCallback((dest: RoutingDestination) => {
    if (dest.type === 'HOME') {
      router.replace('/(tabs)');
    } else {
      router.replace({ pathname: '/onboarding', params: { step: String(dest.step) } });
    }
  }, [router]);

  useEffect(() => {
    let mounted = true;
    async function checkSession() {
      try {
        const session = await authService.getSession();
        if (session && mounted) {
          handleNavigate(await authService.getRoutingDestination());
          return;
        }
      } catch {
        if (mounted) setStatus('error');
        return;
      }
      if (mounted) setStatus('unauthenticated');
    }
    checkSession();
    return () => { mounted = false; };
  }, [attempt, handleNavigate]);

  if (status === 'loading') {
    return <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }
  if (status === 'error') {
    return (
      <View style={styles.error} accessibilityRole="alert">
        <Text style={styles.errorTitle}>{messages.sessionLoadTitle}</Text>
        <Text style={styles.errorText}>{messages.sessionLoadDescription}</Text>
        <Pressable accessibilityRole="button" style={styles.retry} onPress={() => { setStatus('loading'); setAttempt((value) => value + 1); }}>
          <Text style={styles.retryText}>{messages.retryButton}</Text>
        </Pressable>
      </View>
    );
  }
  return <LoginScreen onNavigate={handleNavigate} />;
}

const styles = {
  loading: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.background,
  },
  error: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 24,
    backgroundColor: colors.background,
  },
  errorTitle: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  errorText: {
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center' as const,
  },
  retry: {
    marginTop: 20,
    borderRadius: 999,
    backgroundColor: colors.primary,
    minHeight: 44,
    paddingHorizontal: 24,
    justifyContent: 'center' as const,
  },
  retryText: {
    color: colors.white,
    fontWeight: '600' as const,
  },
};
