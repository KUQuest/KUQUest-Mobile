import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from '@/tw';
import { useRouter } from "expo-router";
import { colors } from '@/theme/colors';
import LoginScreen from './LoginScreen';
import { authService } from './AuthService';
import { RoutingDestination } from './types';
import { authMessages } from '../../locales/authMessages';
import { useLocale } from '../../locales/LocaleProvider';

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
  const router = useRouter();
  const { locale } = useLocale();
  const messages = authMessages[locale];
  const demoBypassEnabled = __DEV__ && process.env.EXPO_PUBLIC_PROFILE_DEMO === 'true';

  const chooseDemoLaunchTarget = React.useCallback((target: DemoLaunchTarget) => {
    setDemoLaunchTarget(target);
    if (target === 'login') {
      setStatus('unauthenticated');
    } else if (target === 'register') {
      router.replace({ pathname: '/onboarding', params: { step: '1' } });
    } else {
      router.replace('/(tabs)');
    }
  }, [router]);

  const handleNavigate = React.useCallback((dest: RoutingDestination) => {
    if (dest.type === 'HOME') {
      router.replace('/(tabs)');
    } else {
      router.replace({ pathname: '/onboarding', params: { step: String(dest.step) } });
    }
  }, [router]);

  useEffect(() => {
    let mounted = true;
    if (demoBypassEnabled) {
      return () => { mounted = false; };
    }

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
  }, [attempt, demoBypassEnabled, handleNavigate]);

  if (demoBypassEnabled && demoLaunchTarget === null) {
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
