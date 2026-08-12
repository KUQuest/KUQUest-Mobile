import React from 'react';
import { Image } from 'expo-image';
import { ChevronLeft } from 'lucide-react-native';
import { TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { colors } from '@/theme/colors';
import { getAppChromeMetrics } from '@/theme/layout';
import styles from './topBarStyles';

interface TopBarProps {
  onBackPress?: () => void;
  variant?: 'default' | 'profile';
}

export function TopBar({ onBackPress, variant = 'default' }: TopBarProps) {
  const { width, fontScale } = useWindowDimensions();
  const metrics = getAppChromeMetrics(width, fontScale);

  return (
    <View style={[styles.container, variant === 'profile' && styles.profileContainer, { height: variant === 'profile' ? 48 : metrics.headerHeight }]}>
      {onBackPress ? (
        <TouchableOpacity
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onBackPress}
          style={[styles.backButton, styles.backButtonPosition, { height: metrics.backButtonSize, width: metrics.backButtonSize }]}
          testID="header-back-button"
        >
          <ChevronLeft color={colors.primaryDeep} size={metrics.iconSize} strokeWidth={2.5} />
        </TouchableOpacity>
      ) : null}
      <Image
        accessibilityLabel="KUQuest"
        contentFit="contain"
        source={require('../../../topbar-logo.svg')}
        style={[styles.logo, { height: 65, width: 121 }]}
      />
    </View>
  );
}
