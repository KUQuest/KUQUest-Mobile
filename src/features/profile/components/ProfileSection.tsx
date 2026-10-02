import React from "react";
import { useWindowDimensions } from "react-native";
import { Pressable, Text, View } from "@/tw";
import { getProfileLayoutMetrics } from "../../../theme/profileLayout";
import type { ProfileLayoutMetrics } from "../../../theme/profileLayout";
import styles from "../styles/profileComponentStyles";

export interface SectionNoticeProps {
  errorText?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function EmptyState({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className={styles.emptyState}>
      <Text className={styles.emptyText} maxFontSizeMultiplier={2}>
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          className={styles.emptyAction}
          onPress={onAction}
        >
          <Text className={styles.emptyActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

interface SectionProps {
  title: string;
  children: (metrics: ProfileLayoutMetrics) => React.ReactNode;
  bottomMargin?: number;
}

export function Section({
  title,
  children,
  bottomMargin = 0,
  errorText,
  retryLabel,
  onRetry,
}: SectionProps & SectionNoticeProps) {
  const { width, fontScale } = useWindowDimensions();
  const metrics = getProfileLayoutMetrics(width, fontScale);

  return (
    <View
      testID={`profile-section-${title}`}
      className={styles.section}
      style={{ marginBottom: bottomMargin, padding: metrics.cardPadding }}
    >
      <Text
        accessibilityRole="header"
        className={styles.sectionTitle}
        maxFontSizeMultiplier={2}
        style={{
          fontSize: metrics.sectionTitleFontSize,
          lineHeight: Math.round(metrics.sectionTitleFontSize * 1.3),
        }}
      >
        {title}
      </Text>
      <View className={styles.rule} />
      {errorText ? (
        <SectionNotice
          errorText={errorText}
          retryLabel={retryLabel}
          onRetry={onRetry}
        />
      ) : null}
      {errorText ? null : children(metrics)}
    </View>
  );
}

export function SectionNotice({
  errorText,
  retryLabel,
  onRetry,
}: SectionNoticeProps) {
  return (
    <View accessibilityRole="alert" className={styles.sectionNotice}>
      <Text className={styles.sectionNoticeText}>{errorText}</Text>
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
          onPress={onRetry}
          className={styles.sectionRetry}
        >
          <Text className={styles.sectionRetryText}>{retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
