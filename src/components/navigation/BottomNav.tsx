import React from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import {
  CheckSquare,
  CircleUserRound,
  Grid2X2,
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
  icon: typeof Grid2X2;
  isCreate?: boolean;
  hasUnread?: boolean;
};

export const navigationItems: readonly NavigationItem[] = [
  { routeName: 'index', labelKey: 'board', icon: Grid2X2 },
  { routeName: 'my-quests', labelKey: 'myQuests', icon: CheckSquare },
  { routeName: 'create', labelKey: 'create', icon: Plus, isCreate: true },
  { routeName: 'chat', labelKey: 'chat', icon: MessageSquare },
  { routeName: 'profile', labelKey: 'profile', icon: CircleUserRound },
];

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof import('expo-router').Tabs>['tabBar']>>[0];

export function BottomNav({ state, descriptors, navigation, insets }: TabBarProps) {
  const { width, fontScale } = useWindowDimensions();
  const metrics = getAppChromeMetrics(width, fontScale);
  const { locale } = useLocale();
  const messages = navigationMessages[locale];

  return (
    <View
      style={[styles.bar, { minHeight: metrics.navHeight, paddingBottom: insets.bottom }]}
      accessibilityRole="toolbar"
    >
      {state.routes.map((route, index) => {
        const item = navigationItems.find(({ routeName }) => routeName === route.name);
        if (!item) return null;

        const isFocused = state.index === index;
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
            style={[
              styles.item,
              { minHeight: metrics.navItemHeight },
              isFocused && !item.isCreate && styles.activeItem,
              item.isCreate && styles.createItem,
            ]}
            testID={`tab-${item.routeName}`}
          >
            {item.isCreate ? (
              <View style={[styles.createIcon, { height: metrics.createButtonSize, marginTop: metrics.createButtonOffset, width: metrics.createButtonSize }]}>
                <Icon color={colors.white} size={metrics.createIconSize} strokeWidth={2.5} />
              </View>
            ) : (
              <Icon color={isFocused ? colors.primary : colors.textSecondary} size={metrics.iconSize} strokeWidth={2.5} style={styles.icon} />
            )}
            <Text
              style={[
                item.isCreate ? styles.createLabel : styles.label,
                { fontSize: metrics.labelFontSize, lineHeight: metrics.labelLineHeight },
                isFocused && !item.isCreate && styles.activeLabel,
              ]}
            >
              {label}
            </Text>
            {item.hasUnread ? <View accessibilityLabel="Unread messages" style={styles.unreadBadge} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
