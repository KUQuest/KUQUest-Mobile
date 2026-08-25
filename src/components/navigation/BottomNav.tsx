import React from 'react';
import { cn } from '@/tw/cn';
import { useWindowDimensions } from 'react-native';
import { Pressable, Text, View } from '@/tw';
import {
  CheckSquare,
  CircleUserRound,
  LayoutDashboard,
  MessageSquare,
  Plus,
} from 'lucide-react-native';
import { useLocale } from '@/locales/LocaleProvider';
import { navigationMessages } from '@/locales/navigationMessages';
import { colors } from '@/theme/colors';
import { getAppChromeMetrics } from '@/theme/layout';
import styles from './bottomNavStyles';

type NavigationItem = {
  routeName: string;
  labelKey: 'board' | 'myQuests' | 'create' | 'chat' | 'profile';
  shortLabelKey: 'boardShort' | 'myQuestsShort' | 'createShort' | 'chatShort' | 'profileShort';
  icon: typeof LayoutDashboard;
  isCreate?: boolean;
  hasUnread?: boolean;
};

export const navigationItems: readonly NavigationItem[] = [
  { routeName: 'index', labelKey: 'board', shortLabelKey: 'boardShort', icon: LayoutDashboard },
  { routeName: 'my-quests', labelKey: 'myQuests', shortLabelKey: 'myQuestsShort', icon: CheckSquare },
  { routeName: 'create', labelKey: 'create', shortLabelKey: 'createShort', icon: Plus, isCreate: true },
  { routeName: 'chat', labelKey: 'chat', shortLabelKey: 'chatShort', icon: MessageSquare },
  { routeName: 'profile', labelKey: 'profile', shortLabelKey: 'profileShort', icon: CircleUserRound },
];

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof import('expo-router').Tabs>['tabBar']>>[0];

export function BottomNav({ state, descriptors, navigation, insets }: TabBarProps) {
  const { width, fontScale } = useWindowDimensions();
  const metrics = getAppChromeMetrics(width, fontScale);
  const { locale } = useLocale();
  const messages = navigationMessages[locale];
  const focusedRouteKey = state.routes[state.index]?.key;

  return (
    <View
      className={cn(styles.container, metrics.isTablet && styles.tabletContainer)} style={{
        height: metrics.isTablet ? '100%' : undefined,
        paddingTop: metrics.isTablet ? Math.max(insets.top, 16) : undefined,
        paddingBottom: metrics.isTablet ? Math.max(insets.bottom, 16) : Math.max(insets.bottom, 10),
        paddingLeft: metrics.isTablet ? Math.max(insets.left, 8) : undefined,
        paddingRight: metrics.isTablet ? Math.max(insets.right, 8) : undefined,
        position: metrics.isTablet ? 'relative' : 'absolute',
        width: metrics.isTablet ? metrics.tabletNavWidth : undefined,
      }}
      accessibilityRole="toolbar"
    >
      <View className={cn(styles.bar, metrics.isTablet && styles.tabletBar)} style={{ minHeight: metrics.isTablet ? undefined : metrics.navHeight }}>
        {state.routes.map((route) => {
          const item = navigationItems.find(({ routeName }) => routeName === route.name);
          if (!item) return null;

          const isFocused = route.key === focusedRouteKey;
          const options = descriptors[route.key]?.options;
          const label = messages[item.labelKey];
          const Icon = item.icon;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
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
              accessibilityRole={item.isCreate ? 'button' : 'tab'}
              {...(item.isCreate ? {} : { accessibilityState: { selected: isFocused } })}
              onPress={onPress}
              className={cn(
                styles.item,
                metrics.isTablet && styles.tabletItem,
                !item.isCreate && isFocused && styles.activeItem,
                item.isCreate && styles.createItem,
                metrics.isTablet && item.isCreate && styles.tabletCreateItem,
              )}
              style={{ minHeight: metrics.navItemHeight }}
              testID={`tab-${item.routeName}`}
            >
              <View
                className={styles.iconSlot}
                style={{
                  height: metrics.createButtonSize,
                  width: metrics.createButtonSize,
                }}
              >
                {item.isCreate ? (
                  <View
                    className={styles.createIcon}
                    style={{
                      height: metrics.createButtonSize,
                      width: metrics.createButtonSize,
                    }}
                  >
                    <Icon color={colors.white} size={metrics.createIconSize} strokeWidth={2.5} />
                  </View>
                ) : (
                  <Icon
                    color={isFocused ? colors.primaryDeep : colors.navIconMuted}
                    size={metrics.iconSize}
                    strokeWidth={2.5}
                  />
                )}
              </View>
              <Text
                className={cn(styles.label, isFocused && styles.activeLabel)}
                style={{
                  fontSize: metrics.labelFontSize,
                  includeFontPadding: false,
                  lineHeight: metrics.labelLineHeight,
                  color: isFocused ? colors.primaryDeep : undefined,
                }}
              >
                {messages[item.shortLabelKey]}
              </Text>
              {!item.isCreate && isFocused ? <View accessibilityLabel={`${label} selected`} className={styles.activeIndicator} style={{ backgroundColor: colors.primaryDeep }} /> : null}
              {item.hasUnread ? <View accessibilityLabel="Unread messages" className={styles.unreadBadge} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
