import React from "react";
import { cn } from "@/tw/cn";
import { useColorScheme, useWindowDimensions } from "react-native";
import { useAnimatedStyle, withTiming } from "react-native-reanimated";
import { Image, Pressable, Text, View } from "@/tw";
import { Animated } from "@/tw/animated";
import {
  BriefcaseBusiness,
  CircleUserRound,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Wallet,
} from "lucide-react-native";
import { useLocale } from "@/features/preferences/localeStore";
import { navigationMessages } from "@/locales/navigationMessages";
import { getAppChromeMetrics } from "@/theme/layout";
import {
  useNavigationVisible,
  showNavigation,
} from "@/features/navigation/navigationUiStore";
import styles, { getBottomNavigationColors } from "./bottomNavStyles";
import { useRoleWorkspace } from "@/features/workspace/roleWorkspaceStore";
import { authService } from "@/features/auth/AuthService";

type NavigationItem = {
  routeName: string;
  labelKey:
    "board" | "money" | "create" | "workManagement" | "chat" | "profile";
  shortLabelKey:
    | "boardShort"
    | "moneyShort"
    | "createShort"
    | "workManagementShort"
    | "chatShort"
    | "profileShort";
  icon: typeof LayoutDashboard;
  isCreate?: boolean;
  hasUnread?: boolean;
};

export const hirerNavigationItems: readonly NavigationItem[] = [
  {
    routeName: "index",
    labelKey: "board",
    shortLabelKey: "boardShort",
    icon: LayoutDashboard,
  },
  {
    routeName: "money",
    labelKey: "money",
    shortLabelKey: "moneyShort",
    icon: Wallet,
  },
  {
    routeName: "create",
    labelKey: "create",
    shortLabelKey: "createShort",
    icon: Plus,
    isCreate: true,
  },
  {
    routeName: "chat",
    labelKey: "chat",
    shortLabelKey: "chatShort",
    icon: MessageSquare,
  },
  {
    routeName: "profile",
    labelKey: "profile",
    shortLabelKey: "profileShort",
    icon: CircleUserRound,
  },
];

export const workerNavigationItems: readonly NavigationItem[] = [
  {
    routeName: "index",
    labelKey: "board",
    shortLabelKey: "boardShort",
    icon: LayoutDashboard,
  },
  {
    routeName: "money",
    labelKey: "money",
    shortLabelKey: "moneyShort",
    icon: Wallet,
  },
  {
    routeName: "my-quests",
    labelKey: "workManagement",
    shortLabelKey: "workManagementShort",
    icon: BriefcaseBusiness,
    isCreate: true,
  },
  {
    routeName: "chat",
    labelKey: "chat",
    shortLabelKey: "chatShort",
    icon: MessageSquare,
  },
  {
    routeName: "profile",
    labelKey: "profile",
    shortLabelKey: "profileShort",
    icon: CircleUserRound,
  },
];

export const navigationItems: readonly NavigationItem[] = hirerNavigationItems;

type TabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof import("expo-router").Tabs>["tabBar"]>
>[0];

export function BottomNav({
  state,
  descriptors,
  navigation,
  insets,
}: TabBarProps) {
  const { width, fontScale } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const navigationColors = getBottomNavigationColors(colorScheme);
  const metrics = getAppChromeMetrics(width, fontScale);
  const { locale } = useLocale();
  const messages = navigationMessages[locale];
  const focusedRouteKey = state.routes[state.index]?.key;
  const { workspace, switchWorkspace } = useRoleWorkspace();
  const navigationVisible = useNavigationVisible();
  const [avatarUri, setAvatarUri] = React.useState<string | null>(null);
  const lastProfilePressRef = React.useRef<number>(0);

  React.useEffect(() => {
    let active = true;
    void authService
      .getStudentApi()
      .then((api) => api.getProfile())
      .then((profile) => {
        if (active) setAvatarUri(profile.avatar?.url ?? null);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  const activeItems =
    workspace === "worker" ? workerNavigationItems : hirerNavigationItems;
  const shouldHide = !metrics.isTablet && !navigationVisible;
  const hiddenTranslateY = metrics.navHeight + Math.max(insets.bottom, 10) + 24;
  const navigationAnimationStyle = useAnimatedStyle(
    () => ({
      opacity: withTiming(shouldHide ? 0 : 1, { duration: 180 }),
      transform: [
        {
          translateY: withTiming(shouldHide ? hiddenTranslateY : 0, {
            duration: 220,
          }),
        },
      ],
    }),
    [hiddenTranslateY, shouldHide]
  );

  React.useEffect(() => {
    showNavigation();
  }, [focusedRouteKey, showNavigation]);

  return (
    <Animated.View
      className={cn(
        styles.container,
        metrics.isTablet && styles.tabletContainer
      )}
      style={[
        {
          height: metrics.isTablet ? "100%" : undefined,
          paddingTop: metrics.isTablet ? Math.max(insets.top, 16) : undefined,
          paddingBottom: metrics.isTablet
            ? Math.max(insets.bottom, 16)
            : Math.max(insets.bottom, 10),
          paddingLeft: metrics.isTablet ? Math.max(insets.left, 8) : undefined,
          paddingRight: metrics.isTablet
            ? Math.max(insets.right, 8)
            : undefined,
          position: metrics.isTablet ? "relative" : "absolute",
          width: metrics.isTablet ? metrics.tabletNavWidth : undefined,
        },
        navigationAnimationStyle,
      ]}
      pointerEvents={shouldHide ? "none" : "auto"}
      accessibilityElementsHidden={shouldHide}
      importantForAccessibility={shouldHide ? "no-hide-descendants" : "auto"}
      accessibilityRole="toolbar"
    >
      <View
        className={cn(styles.bar, metrics.isTablet && styles.tabletBar)}
        style={{ minHeight: metrics.isTablet ? undefined : metrics.navHeight }}
      >
        {activeItems.map((item) => {
          const route = state.routes.find(
            ({ name }) => name === item.routeName
          );
          if (!route) return null;

          const isFocused = route.key === focusedRouteKey;
          const options = descriptors[route.key]?.options;
          const label = messages[item.labelKey];
          const Icon = item.icon;
          const isProfileTab = item.routeName === "profile";

          const onPress = () => {
            showNavigation();
            if (isProfileTab) {
              const now = Date.now();
              if (now - lastProfilePressRef.current < 400) {
                lastProfilePressRef.current = 0;
                void switchWorkspace();
                return;
              }
              lastProfilePressRef.current = now;
            }

            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if ((item.isCreate || !isFocused) && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = isProfileTab
            ? () => {
                void switchWorkspace();
              }
            : undefined;
          return (
            <Pressable
              key={route.key}
              accessibilityLabel={options?.tabBarAccessibilityLabel ?? label}
              accessibilityRole={item.isCreate ? "button" : "tab"}
              {...(item.isCreate
                ? {}
                : { accessibilityState: { selected: isFocused } })}
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityHint={
                isProfileTab
                  ? locale === "th"
                    ? "แตะสองครั้งหรือกดค้างเพื่อสลับพื้นที่ทำงาน"
                    : "Double tap or long press to switch workspace"
                  : undefined
              }
              className={cn(
                styles.item,
                metrics.isTablet && styles.tabletItem,
                !item.isCreate && isFocused && styles.activeItem,
                item.isCreate && styles.createItem,
                metrics.isTablet && item.isCreate && styles.tabletCreateItem
              )}
              style={{ minHeight: metrics.navItemHeight }}
              testID={`tab-${item.routeName}`}
            >
              <View
                className={styles.iconSlot}
                style={{
                  height: Math.max(
                    metrics.createButtonSize,
                    metrics.iconSize + 10
                  ),
                  width: Math.max(
                    metrics.createButtonSize,
                    metrics.iconSize + 10
                  ),
                }}
              >
                {item.isCreate ? (
                  <View
                    className={styles.createIcon}
                    style={{
                      height: metrics.createButtonSize + 4,
                      width: metrics.createButtonSize + 4,
                    }}
                  >
                    <Icon
                      color={navigationColors.white}
                      size={metrics.createIconSize + 2}
                      strokeWidth={2.5}
                    />
                  </View>
                ) : isProfileTab ? (
                  avatarUri ? (
                    <View
                      className="overflow-hidden rounded-ku-pill"
                      style={{
                        height: metrics.iconSize + 8,
                        width: metrics.iconSize + 8,
                        borderWidth: isFocused ? 2 : 1.5,
                        borderColor: isFocused
                          ? navigationColors.primaryDeep
                          : navigationColors.navIconMuted,
                      }}
                    >
                      <Image
                        accessibilityLabel={label}
                        source={{ uri: avatarUri }}
                        style={{ height: "100%", width: "100%" }}
                        testID="tab-profile-avatar"
                      />
                    </View>
                  ) : (
                    <View
                      className="items-center justify-center overflow-hidden rounded-ku-pill"
                      style={{
                        height: metrics.iconSize + 8,
                        width: metrics.iconSize + 8,
                        borderWidth: isFocused ? 2 : 1.5,
                        borderColor: isFocused
                          ? navigationColors.primaryDeep
                          : navigationColors.navIconMuted,
                        backgroundColor: isFocused
                          ? navigationColors.primaryDeep
                          : "transparent",
                      }}
                    >
                      <CircleUserRound
                        color={
                          isFocused
                            ? navigationColors.white
                            : navigationColors.navIconMuted
                        }
                        size={metrics.iconSize + 2}
                        strokeWidth={2.5}
                      />
                    </View>
                  )
                ) : (
                  <Icon
                    color={
                      isFocused
                        ? navigationColors.primaryDeep
                        : navigationColors.navIconMuted
                    }
                    size={metrics.iconSize + 4}
                    strokeWidth={2.5}
                  />
                )}
              </View>
              {item.isCreate ? (
                <Text
                  className={cn(styles.label, isFocused && styles.activeLabel)}
                  style={{
                    fontSize: metrics.labelFontSize,
                    includeFontPadding: false,
                    lineHeight: metrics.labelLineHeight,
                    color: isFocused
                      ? navigationColors.primaryDeep
                      : navigationColors.textSecondary,
                  }}
                >
                  {messages[item.shortLabelKey]}
                </Text>
              ) : null}
              {!item.isCreate && isFocused ? (
                <View
                  accessibilityLabel={`${label} selected`}
                  className={styles.activeIndicator}
                  style={{ backgroundColor: navigationColors.primaryDeep }}
                />
              ) : null}
              {item.hasUnread ? (
                <View
                  accessibilityLabel="Unread messages"
                  className={styles.unreadBadge}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}
