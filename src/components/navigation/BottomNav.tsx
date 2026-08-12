import React from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
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
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}
      accessibilityRole="toolbar"
    >
      <View style={[styles.bar, { minHeight: metrics.navHeight }]}>
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
              style={({ pressed }) => [
                styles.item,
                { minHeight: metrics.navItemHeight },
                item.isCreate && styles.createItem,
                pressed && styles.itemPressed,
              ]}
              testID={`tab-${item.routeName}`}
            >
              {item.isCreate ? (
                <View
                  style={[
                    styles.createIcon,
                    {
                      height: metrics.createButtonSize,
                      marginTop: metrics.createButtonOffset,
                      width: metrics.createButtonSize,
                    },
                  ]}
                >
                  <Icon color={colors.white} size={metrics.createIconSize} strokeWidth={2.5} />
                </View>
              ) : (
                <Icon
                  color={isFocused ? colors.successBright : colors.navIconMuted}
                  size={metrics.iconSize}
                  strokeWidth={2.5}
                />
              )}
              <Text
                style={[
                  styles.label,
                  { fontSize: metrics.labelFontSize, lineHeight: metrics.labelLineHeight },
                  isFocused && !item.isCreate && styles.activeLabel,
                ]}
                numberOfLines={1}
              >
                {messages[item.shortLabelKey]}
              </Text>
              {item.hasUnread ? <View accessibilityLabel="Unread messages" style={styles.unreadBadge} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
