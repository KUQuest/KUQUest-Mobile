import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { colors } from '@/theme/colors';

export interface LoadingSkeletonProps {
  loadingLabel: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface SkeletonBlockProps {
  height: number;
  width?: number | `${number}%` | 'auto';
  variant?: 'block' | 'image';
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function useReducedMotionPreference(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  return reduceMotion;
}

/**
 * A screen-level loading state. The only accessible element is the busy
 * progressbar; all of the geometry inside it is decorative.
 */
export function LoadingSkeleton({ loadingLabel, children, style, contentStyle, testID }: LoadingSkeletonProps) {
  const reduceMotion = useReducedMotionPreference();
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 1 : withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.72, { duration: 600 }),
      ),
      -1,
      false,
    ),
  }), [reduceMotion]);

  return (
    <Animated.View
      accessible
      accessibilityLabel={loadingLabel}
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      style={[style, animatedStyle]}
      testID={testID}
    >
      <View accessible={false} importantForAccessibility="no" style={contentStyle}>
        {children}
      </View>
    </Animated.View>
  );
}

export function SkeletonBlock({ height, width = '100%', variant = 'block', borderRadius = 8, style, testID }: SkeletonBlockProps) {
  return (
    <View
      accessible={false}
      importantForAccessibility="no"
      style={[
        {
          backgroundColor: variant === 'image' ? colors.surfacePlaceholder : colors.surfaceMuted,
          borderRadius,
          height,
          width,
        },
        style,
      ]}
      testID={testID}
    />
  );
}
