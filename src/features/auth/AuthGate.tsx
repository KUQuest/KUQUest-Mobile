import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { colors } from '@/theme/colors';
import LoginScreen from './LoginScreen';
import { authService } from './AuthService';
import { RoutingDestination } from './types';

export default function Index() {
  const [status, setStatus] = useState<'loading' | 'unauthenticated'>('loading');
  const router = useRouter();

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
        // Ignore error and fall through to show login
      }
      if (mounted) setStatus('unauthenticated');
    }
    checkSession();
    return () => { mounted = false; };
  }, [handleNavigate]);

  if (status === 'loading') {
    return <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /></View>;
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
};
