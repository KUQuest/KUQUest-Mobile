import React from 'react';
import { Image } from 'expo-image';
import { ChevronLeft } from 'lucide-react-native';
import { TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { colors } from '@/theme/colors';
import { getAppChromeMetrics } from '@/theme/layout';
import styles from './topBarStyles';

interface TopBarProps {
  onBackPress?: () => void;
}

export function TopBar({ onBackPress }: TopBarProps) {
  const { width, fontScale } = useWindowDimensions();
  const metrics = getAppChromeMetrics(width, fontScale);

  return (
    <View style={[styles.container, { height: metrics.headerHeight }]}>
      {onBackPress ? (
        <TouchableOpacity
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onBackPress}
          style={[styles.backButton, { height: metrics.backButtonSize, width: metrics.backButtonSize }]}
          testID="header-back-button"
        >
          <ChevronLeft color={colors.primaryDeep} size={metrics.iconSize} strokeWidth={2.5} />
        </TouchableOpacity>
      ) : <View style={[styles.backButton, { height: metrics.backButtonSize, width: metrics.backButtonSize }]} />}
      <Image
        accessibilityLabel="KUQuest"
        contentFit="contain"
        source={require('../../../logo.svg')}
        style={[styles.logo, { height: metrics.logoHeight, width: metrics.logoWidth }]}
      />
    </View>
  );
}
