import React from 'react';
import { cn } from '@/tw/cn';
import { Image, Text, TouchableOpacity, View } from '@/tw';
import { ChevronLeft } from 'lucide-react-native';
import { useWindowDimensions } from 'react-native';
import { colors } from '@/theme/colors';
import { getAppChromeMetrics } from '@/theme/layout';
import styles from './topBarStyles';

interface TopBarProps {
  onBackPress?: () => void;
  title?: string;
  variant?: 'default' | 'profile' | 'board' | 'detail';
}

export function TopBar({ onBackPress, title, variant = 'default' }: TopBarProps) {
  const { width, fontScale } = useWindowDimensions();
  const metrics = getAppChromeMetrics(width, fontScale);

  return (
    <View
      className={cn(styles.container, variant === 'profile' && styles.profileContainer, variant === 'board' && styles.boardContainer, variant === 'detail' && styles.detailContainer)} style={{ height: variant === 'profile' ? 48 : metrics.headerHeight }}
    >
      {onBackPress ? (
        <TouchableOpacity
          accessibilityLabel="Go back"
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
        style={{ height: metrics.logoHeight, width: metrics.logoWidth }}
      />}
    </View>
  );
}
