import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Pressable, Text, View } from "@/tw";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { useLocale } from "@/features/preferences/localeStore";
import { notificationMessages } from "@/locales/notificationMessages";

import {
  useNotificationCoordinator,
  type ForegroundNotice,
} from "./useNotificationCoordinator";

export function NotificationBannerHost({
  notices,
  dismiss,
  open,
}: {
  notices: ForegroundNotice[];
  dismiss: () => void;
  open: (notice: ForegroundNotice) => void;
}) {
  const insets = useSafeAreaInsets();
  const [screenReaderEnabled, setScreenReaderEnabled] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      if (mounted) setScreenReaderEnabled(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      setScreenReaderEnabled
    );
    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  const { colors } = useAppTheme();
  const { locale } = useLocale();
  const current = notices[0];

  useEffect(() => {
    if (!current || screenReaderEnabled !== false) return;
    const timeout = setTimeout(dismiss, 4_000);
    return () => clearTimeout(timeout);
  }, [current, dismiss, screenReaderEnabled]);

  if (!current) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      className="absolute top-0 right-0 left-0 z-50 px-ku-md"
      pointerEvents="box-none"
      style={{ paddingTop: Math.max(insets.top, 8) }}
      testID="notification-banner-host"
    >
      <View className="flex-row items-stretch rounded-ku-card border border-ku-border bg-ku-surface p-ku-xs shadow-lg">
        <Pressable
          accessibilityLabel={`${current.title}. ${current.message}`}
          accessibilityRole="button"
          className="min-h-12 flex-1 justify-center px-ku-md py-ku-sm"
          onPress={() => open(current)}
          testID="notification-banner-open"
        >
          <Text className="font-ku-semibold text-ku-body text-ku-text-strong">
            {current.title}
          </Text>
          <Text className="mt-ku-xs font-ku-regular text-ku-body-small text-ku-text-secondary">
            {current.message}
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel={notificationMessages[locale].dismiss}
          accessibilityRole="button"
          className="h-12 w-12 items-center justify-center"
          onPress={dismiss}
          testID="notification-banner-dismiss"
        >
          <X color={colors.textSecondary} size={20} />
        </Pressable>
      </View>
    </View>
  );
}

export function NotificationCoordinator() {
  const { notices, dismiss, open } = useNotificationCoordinator();
  return (
    <NotificationBannerHost notices={notices} dismiss={dismiss} open={open} />
  );
}
