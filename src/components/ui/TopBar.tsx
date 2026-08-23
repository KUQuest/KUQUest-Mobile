import React from 'react';
import { cn } from '@/tw/cn';
import { Image, Text, TouchableOpacity, View } from '@/tw';
import { ChevronLeft } from 'lucide-react-native';
import { useLocale } from '@/locales/LocaleProvider';
import { navigationMessages } from '@/locales/navigationMessages';
import { useWindowDimensions } from 'react-native';
import { colors } from '@/theme/colors';
import { getAppChromeMetrics } from '@/theme/layout';
import styles from './topBarStyles';

interface TopBarProps {
  onBackPress?: () => void;
  backLabel?: string;
  title?: string;
  variant?: 'default' | 'profile' | 'board' | 'detail';
}

export function TopBar({ onBackPress, backLabel, title, variant = 'default' }: TopBarProps) {
  const { width, fontScale } = useWindowDimensions();
  const { locale } = useLocale();
  const resolvedBackLabel = backLabel ?? navigationMessages[locale].back;
  const metrics = getAppChromeMetrics(width, fontScale);

  const isProfile = variant === 'profile';

  return (
    <View
      className={cn(styles.container, isProfile && styles.profileContainer, variant === 'board' && styles.boardContainer, variant === 'detail' && styles.detailContainer)}
      style={{ height: isProfile ? metrics.headerHeight : 48 }}
    >
      {onBackPress ? (
        <TouchableOpacity
          accessibilityLabel={resolvedBackLabel}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onBackPress}
          className={cn(styles.backButton, styles.backButtonPosition)} style={{ height: metrics.backButtonSize, width: metrics.backButtonSize }}
          testID="header-back-button"
        >
          <ChevronLeft color={colors.primaryDeep} size={metrics.iconSize} strokeWidth={2.5} />
        </TouchableOpacity>
      ) : null}
      {title ? <Text accessibilityRole="header" className={styles.title}>{title}</Text> : <Image
        accessibilityLabel="KUQuest"
        contentFit="contain"
        source={require('../../../topbar-logo.svg')}
        style={{ height: isProfile ? metrics.logoHeight : 32, width: isProfile ? metrics.logoWidth : 60 }}
      />}
    </View>
  );
}
