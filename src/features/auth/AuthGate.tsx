import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from '@/tw';
import { useRouter } from "expo-router";
import { colors } from '@/theme/colors';
import LoginScreen from './LoginScreen';
import { authService, isAuthNetworkError } from './AuthService';
import { RoutingDestination } from './types';
import { authMessages } from '../../locales/authMessages';
import { useLocale } from '../../locales/LocaleProvider';
import { enableOfflinePrototypeDemo, isPrototypeDemoEnabled } from './demoMode';
import { getInitialPrototypeDeepLink, subscribeToPrototypeDeepLinks } from './demoDeepLink';
import type { PrototypeScenarioRoute } from '@/components/ui/prototypeMenuData';

type DemoLaunchTarget = 'login' | 'register' | 'home';

function DemoLaunchOverlay({ onSelect }: { onSelect: (target: DemoLaunchTarget) => void }) {
  return (
    <View className="flex-1 justify-center bg-ku-background p-[24px]">
      <Text className="text-ku-primary font-ku-bold text-ku-title">Developer mode</Text>
      <Text className="text-ku-text-secondary text-ku-body mt-[8px] mb-[24px]">เลือกหน้าที่ต้องการเปิดสำหรับทดสอบ</Text>
      <Pressable accessibilityRole="button" className="bg-ku-primary rounded-ku-pill min-h-[52px] justify-center px-[20px] mb-[12px]" onPress={() => onSelect('login')} testID="dev-launch-login">
        <Text className="text-ku-white font-ku-bold text-center">Login ปกติ</Text>
      </Pressable>
      <Pressable accessibilityRole="button" className="border border-ku-primary rounded-ku-pill min-h-[52px] justify-center px-[20px] mb-[12px]" onPress={() => onSelect('register')} testID="dev-launch-register">
        <Text className="text-ku-primary font-ku-bold text-center">Register / Onboarding</Text>
      </Pressable>
      <Pressable accessibilityRole="button" className="border border-ku-border rounded-ku-pill min-h-[52px] justify-center px-[20px]" onPress={() => onSelect('home')} testID="dev-launch-home">
        <Text className="text-ku-text-strong font-ku-bold text-center">เข้าแอปด้วย Demo data</Text>
      </Pressable>
    </View>
  );
}

export default function Index() {
  const [status, setStatus] = useState<'loading' | 'unauthenticated' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [demoLaunchTarget, setDemoLaunchTarget] = useState<DemoLaunchTarget | null>(null);
  const [demoLaunchAvailable, setDemoLaunchAvailable] = useState(() => isPrototypeDemoEnabled());
  const [initialDemoRoute, setInitialDemoRoute] = useState<PrototypeScenarioRoute | undefined>();
  const [initialDemoRouteResolved, setInitialDemoRouteResolved] = useState(() => !__DEV__);
  const router = useRouter();
  const { locale } = useLocale();
  const messages = authMessages[locale];

  const chooseDemoLaunchTarget = React.useCallback((target: DemoLaunchTarget) => {
    const requestedRoute = initialDemoRoute;
    setInitialDemoRoute(undefined);
    setDemoLaunchTarget(target);
    if (target === 'login') {
      setStatus('unauthenticated');
    } else if (target === 'register') {
      router.replace({ pathname: '/onboarding', params: { step: '1' } });
    } else {
      router.replace(requestedRoute ?? '/(tabs)');
    }
  }, [initialDemoRoute, router]);

  const handleNavigate = React.useCallback((dest: RoutingDestination) => {
    if (dest.type === 'HOME') {
      router.replace('/(tabs)');
    } else {
      router.replace({ pathname: '/onboarding', params: { step: String(dest.step) } });
    }
  }, [router]);

  useEffect(() => {
    if (!__DEV__) return undefined;
    let mounted = true;
    const unsubscribe = subscribeToPrototypeDeepLinks((route) => {
      if (!mounted) return;
      setInitialDemoRoute(route);
    });
    void getInitialPrototypeDeepLink().then((route) => {
      if (!mounted) return;
      if (route) setInitialDemoRoute(route);
      setInitialDemoRouteResolved(true);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (__DEV__ && !initialDemoRouteResolved) {
      return () => { mounted = false; };
    }
    if (demoLaunchAvailable || isPrototypeDemoEnabled()) {
      return () => { mounted = false; };
    }

    async function checkSession() {
      let session;
      try {
        session = await authService.getSession();
      } catch (error) {
        if (__DEV__ && isAuthNetworkError(error)) {
          enableOfflinePrototypeDemo();
          if (mounted) {
            setDemoLaunchAvailable(true);
            setStatus('unauthenticated');
          }
          return;
        }
        if (mounted) setStatus('error');
        return;
      }

      if (session && mounted) {
        if (initialDemoRoute) {
          router.replace(initialDemoRoute);
          return;
        }
        try {
          handleNavigate(await authService.getRoutingDestination());
        } catch {
          if (mounted) setStatus('error');
        }
        return;
      }
      if (mounted) setStatus('unauthenticated');
    }
    void checkSession();
    return () => { mounted = false; };
  }, [attempt, demoLaunchAvailable, handleNavigate, initialDemoRoute, initialDemoRouteResolved, router]);

  const demoLaunchOverlayVisible = (demoLaunchAvailable || isPrototypeDemoEnabled()) && demoLaunchTarget === null;
  if (demoLaunchOverlayVisible && !initialDemoRouteResolved) {
    return <View className="flex-1 justify-center items-center bg-ku-background"><ActivityIndicator size="large" color={colors.primary} /></View>;
  }
  if (demoLaunchOverlayVisible) {
    return <DemoLaunchOverlay onSelect={chooseDemoLaunchTarget} />;
  }

  if (status === 'loading') {
    return <View className="flex-1 justify-center items-center bg-ku-background"><ActivityIndicator size="large" color={colors.primary} /></View>;
  }
  if (status === 'error') {
    return (
      <View className="flex-1 justify-center items-center p-[24px] bg-ku-background" accessibilityRole="alert">
        <Text className="text-ku-text-strong text-ku-subtitle font-ku-bold text-center">{messages.sessionLoadTitle}</Text>
        <Text className="text-ku-text-secondary mt-[8px] text-center">{messages.sessionLoadDescription}</Text>
        <Pressable accessibilityRole="button" className="mt-[20px] rounded-ku-pill bg-ku-primary min-h-[44px] px-[24px] justify-center" onPress={() => { setStatus('loading'); setAttempt((value) => value + 1); }}>
          <Text className="text-ku-white font-ku-semibold">{messages.retryButton}</Text>
        </Pressable>
      </View>
    );
  }
  return <LoginScreen onNavigate={handleNavigate} />;
}
