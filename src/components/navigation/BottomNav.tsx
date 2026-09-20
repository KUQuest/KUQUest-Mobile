import React from "react";
import { cn } from "@/tw/cn";
import { useColorScheme, useWindowDimensions } from "react-native";
import { useAnimatedStyle, withTiming } from "react-native-reanimated";
import { Image, Pressable, View } from "@/tw";
import { Animated } from "@/tw/animated";

import { useLocale } from "@/features/preferences/localeStore";
import { navigationMessages } from "@/locales/navigationMessages";
import { getAppChromeMetrics } from "@/theme/layout";
import {
  useNavigationCompact,
  showNavigation,
} from "@/features/navigation/navigationUiStore";
import styles, { getBottomNavigationColors } from "./bottomNavStyles";
import { useRoleWorkspace } from "@/features/workspace/roleWorkspaceStore";
import { useProfileQuery } from "@/features/profile/api/profileQueries";
import {
  getRoleWorkspaceAccessibilityLabel,
  getRoleWorkspaceNavigation,
} from "@/features/navigation/roleWorkspaceNavigation";

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
  const { workspace } = useRoleWorkspace();
  const navigationCompact = useNavigationCompact();
  const profileQuery = useProfileQuery(locale);
  const profileImage = profileQuery.data?.profileImage;
  const avatarUri =
    typeof profileImage === "object" &&
    profileImage !== null &&
    "uri" in profileImage &&
    typeof profileImage.uri === "string"
      ? profileImage.uri
      : null;
  const activeItems = getRoleWorkspaceNavigation(workspace);
  const workspaceLabel = getRoleWorkspaceAccessibilityLabel(workspace, locale);
  const compactNavigationPadding = Math.max(
    32,
    Math.min(56, (width - 248) / 2)
  );
  const isCompact = navigationCompact && !metrics.isTablet;
  const navigationAnimationStyle = useAnimatedStyle(
    () => ({
      paddingLeft: withTiming(
        metrics.isTablet
          ? Math.max(insets.left, 8)
          : isCompact
            ? compactNavigationPadding
            : 32,
        { duration: 220 }
      ),
      paddingRight: withTiming(
        metrics.isTablet
          ? Math.max(insets.right, 8)
          : isCompact
            ? compactNavigationPadding
            : 32,
        { duration: 220 }
      ),
    }),
    [
      compactNavigationPadding,
      insets.left,
      insets.right,
      isCompact,
      metrics.isTablet,
    ]
  );
  const navigationBarAnimationStyle = useAnimatedStyle(
    () => ({
      minHeight: withTiming(
        isCompact ? metrics.navItemHeight : metrics.navHeight,
        { duration: 220 }
      ),
      paddingBottom: withTiming(isCompact ? 0 : 3, { duration: 220 }),
      paddingTop: withTiming(isCompact ? 0 : 3, { duration: 220 }),
    }),
    [isCompact, metrics.navHeight, metrics.navItemHeight]
  );

  React.useEffect(() => {
    showNavigation();
  }, [focusedRouteKey]);

  return (
    <Animated.View
      accessibilityLabel={workspaceLabel}
      accessibilityRole="toolbar"
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
    >
      <Animated.View
        className={cn(styles.bar, metrics.isTablet && styles.tabletBar)}
        style={[
          { minHeight: metrics.isTablet ? undefined : metrics.navHeight },
          !metrics.isTablet && navigationBarAnimationStyle,
        ]}
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
          const iconColor = isFocused
            ? navigationColors.primaryDeep
            : navigationColors.navIconMuted;

          const onPress = () => {
            showNavigation();

            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if ((item.isCreate || !isFocused) && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityLabel={options?.tabBarAccessibilityLabel ?? label}
              accessibilityRole={item.isCreate ? "button" : "tab"}
              {...(item.isCreate
                ? {}
                : { accessibilityState: { selected: isFocused } })}
              onPress={onPress}
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
                    className={cn(
                      styles.createIcon,
                      item.routeName === "my-quests" && styles.workIcon
                    )}
                    style={{
                      height: metrics.createButtonSize + 2,
                      width: metrics.createButtonSize + 2,
                    }}
                  >
                    {item.asset ? (
                      <Image
                        contentFit="contain"
                        source={item.asset}
                        style={{
                          height: metrics.createIconSize,
                          width: metrics.createIconSize,
                        }}
                      />
                    ) : Icon ? (
                      <Icon
                        color={navigationColors.onPrimary}
                        size={metrics.createIconSize}
                        strokeWidth={2.5}
                      />
                    ) : null}
                  </View>
                ) : isProfileTab ? (
                  avatarUri ? (
                    <View
                      className="overflow-hidden rounded-ku-pill"
                      style={{
                        height: metrics.iconSize + 6,
                        width: metrics.iconSize + 6,
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
                        height: metrics.iconSize + 6,
                        width: metrics.iconSize + 6,
                        borderWidth: isFocused ? 2 : 1.5,
                        borderColor: isFocused
                          ? navigationColors.primaryDeep
                          : navigationColors.navIconMuted,
                        backgroundColor: isFocused
                          ? navigationColors.primaryDeep
                          : "transparent",
                      }}
                    >
                      <Image
                        contentFit="contain"
                        source={item.asset}
                        style={{
                          height: metrics.iconSize,
                          width: metrics.iconSize,
                          tintColor: isFocused
                            ? navigationColors.onPrimary
                            : navigationColors.navIconMuted,
                        }}
                      />
                    </View>
                  )
                ) : item.asset ? (
                  <Image
                    contentFit="contain"
                    source={item.asset}
                    style={{
                      height: metrics.iconSize + 2,
                      width: metrics.iconSize + 2,
                      tintColor: iconColor,
                    }}
                  />
                ) : Icon ? (
                  <Icon
                    color={iconColor}
                    size={metrics.iconSize}
                    strokeWidth={2.5}
                  />
                ) : null}
              </View>
              {!item.isCreate && isFocused ? (
                <View
                  accessibilityLabel={`${label} selected`}
                  className={styles.activeIndicator}
                  style={{ backgroundColor: navigationColors.primaryDeep }}
                />
              ) : null}
              {item.hasUnread ? (
                <View
                  accessibilityLabel={messages.unreadMessages}
                  className={styles.unreadBadge}
                />
              ) : null}
            </Pressable>
          );
        })}
      </Animated.View>
    </Animated.View>
  );
}
