import React from "react";
import { useRouter } from "expo-router";
import { Bell, Settings } from "lucide-react-native";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAnimatedStyle, withTiming } from "react-native-reanimated";

import { Animated } from "@/tw/animated";
import { Pressable, Text, View } from "@/tw";
import { useLocale } from "@/features/preferences/localeStore";
import { navigationMessages } from "@/locales/navigationMessages";
import { settingsMessages } from "@/locales/settingsMessages";
import { memberNotificationMessages } from "@/locales/memberNotificationMessages";
import { useUnreadNotificationCountQuery } from "@/features/notifications/inbox/notificationQueries";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { getAppChromeMetrics } from "@/theme/layout";
import { useNavigationVisibility } from "@/features/navigation/navigationUiStore";

const styles = {
  container: "absolute left-0 right-0 top-0 items-stretch bg-ku-background",
  content: "relative w-full flex-1 items-center justify-center",
  title: "text-ku-text-strong font-ku-semibold text-ku-subtitle",
  settingsButton:
    "absolute items-center justify-center min-h-[48px] min-w-[48px]",
  // Count pill pinned to the bell glyph's top-right corner and growing
  // rightward, so the bell stays readable; the background-colored ring cuts
  // it out of the glyph like the bottom-nav unread dot.
  badge:
    "absolute left-[26px] top-[5px] h-[20px] min-w-[20px] items-center justify-center rounded-ku-pill border-2 border-ku-background bg-ku-danger px-ku-5",
  badgeText: "text-ku-on-primary font-ku-bold text-ku-caption leading-[16px]",
} as const;

export function ProfileTopBar() {
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { locale } = useLocale();
  const { navigationVisible } = useNavigationVisibility();
  const { colors } = useAppTheme();
  const unreadCount = useUnreadNotificationCountQuery().data ?? 0;
  const metrics = getAppChromeMetrics(width, fontScale);
  const topBarHeight = metrics.headerHeight + insets.top;
  const shouldHide = !metrics.isTablet && !navigationVisible;
  const animationStyle = useAnimatedStyle(
    () => ({
      opacity: withTiming(shouldHide ? 0 : 1, { duration: 180 }),
      transform: [
        {
          translateY: withTiming(shouldHide ? -topBarHeight : 0, {
            duration: 220,
          }),
        },
      ],
    }),
    [shouldHide, topBarHeight]
  );

  return (
    <Animated.View
      accessibilityElementsHidden={shouldHide}
      className={styles.container}
      importantForAccessibility={shouldHide ? "no-hide-descendants" : "auto"}
      pointerEvents={shouldHide ? "none" : "box-none"}
      style={[
        {
          height: topBarHeight,
          paddingLeft: Math.max(insets.left, 12),
          paddingRight: Math.max(insets.right, 12),
          zIndex: 10,
        },
        animationStyle,
      ]}
      testID="profile-top-bar"
    >
      <View className={styles.content} style={{ height: metrics.headerHeight }}>
        <Text
          accessibilityRole="header"
          className={styles.title}
          maxFontSizeMultiplier={2}
        >
          {navigationMessages[locale].profile}
        </Text>
        <Pressable
          accessibilityLabel={memberNotificationMessages[locale].openInbox(
            unreadCount
          )}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.push("/notifications")}
          className={styles.settingsButton}
          style={{ left: 0 }}
          testID="open-notifications"
        >
          <Bell color={colors.primary} size={24} strokeWidth={2.2} />
          {unreadCount > 0 ? (
            <View
              className={styles.badge}
              importantForAccessibility="no-hide-descendants"
              testID="notifications-unread-badge"
            >
              <Text className={styles.badgeText} maxFontSizeMultiplier={1.5}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable
          accessibilityLabel={settingsMessages[locale].title}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.push("/settings")}
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
