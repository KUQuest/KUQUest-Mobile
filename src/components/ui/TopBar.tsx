import React from 'react';
import { cn } from '@/tw/cn';
import { Image, TouchableOpacity, View } from '@/tw';
import { ChevronLeft } from 'lucide-react-native';
import { useWindowDimensions } from 'react-native';
import { colors } from '@/theme/colors';
import { getAppChromeMetrics } from '@/theme/layout';
import styles from './topBarStyles';

interface TopBarProps {
  onBackPress?: () => void;
  variant?: 'default' | 'profile' | 'board' | 'detail';
}

export function TopBar({ onBackPress, variant = 'default' }: TopBarProps) {
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
      <Image
        accessibilityLabel="KUQuest"
        contentFit="contain"
        source={require('../../../topbar-logo.svg')}
        style={{ height: metrics.logoHeight, width: metrics.logoWidth }}
      />
    </View>
  );
}
