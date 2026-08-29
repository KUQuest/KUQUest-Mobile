import React from 'react';
import { useRouter } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { Animated } from '@/tw/animated';
import { Pressable, Text, View } from '@/tw';
import { useLocale } from '@/locales/LocaleProvider';
import { navigationMessages } from '@/locales/navigationMessages';
import { settingsMessages } from '@/locales/settingsMessages';
import { colors } from '@/theme/colors';
import { getAppChromeMetrics } from '@/theme/layout';
import { useNavigationVisibility } from '@/components/navigation/NavigationVisibilityContext';

const styles = {
  container: 'absolute left-0 right-0 top-0 items-stretch',
  content: 'relative w-full flex-1 items-center justify-center',
  title: 'text-ku-text-strong font-ku-semibold text-ku-subtitle',
  settingsButton: 'absolute items-center justify-center min-h-[48px] min-w-[48px]',
} as const;

export function ProfileTopBar() {
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { locale } = useLocale();
  const { navigationVisible } = useNavigationVisibility();
  const metrics = getAppChromeMetrics(width, fontScale);
  const topBarHeight = metrics.headerHeight + insets.top;
  const shouldHide = !metrics.isTablet && !navigationVisible;
  const animationStyle = useAnimatedStyle(() => ({
    opacity: withTiming(shouldHide ? 0 : 1, { duration: 180 }),
    transform: [{ translateY: withTiming(shouldHide ? -topBarHeight : 0, { duration: 220 }) }],
  }), [shouldHide, topBarHeight]);

  return (
    <Animated.View
      accessibilityElementsHidden={shouldHide}
      className={styles.container}
      importantForAccessibility={shouldHide ? 'no-hide-descendants' : 'auto'}
      pointerEvents={shouldHide ? 'none' : 'box-none'}
      style={[{
        backgroundColor: 'transparent',
        height: topBarHeight,
        paddingLeft: Math.max(insets.left, 12),
        paddingRight: Math.max(insets.right, 12),
        zIndex: 10,
      }, animationStyle]}
      testID="profile-top-bar"
    >
      <View className={styles.content} style={{ height: metrics.headerHeight }}>
        <Text accessibilityRole="header" className={styles.title} maxFontSizeMultiplier={2}>
          {navigationMessages[locale].profile}
        </Text>
        <Pressable
          accessibilityLabel={settingsMessages[locale].title}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.push('/settings')}
          className={styles.settingsButton}
          style={{ right: 0 }}
          testID="open-settings"
        >
          <Settings color={colors.primary} size={24} strokeWidth={2.2} />
        </Pressable>
      </View>
    </Animated.View>
  );
}
