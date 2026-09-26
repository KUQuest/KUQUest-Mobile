import React from "react";

import { ActivityIndicator, Text, View } from "@/tw";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";

import styles from "../groupQuestStyles";

export interface TeamAssembleLoadingStateProps {
  label: string;
}

export function TeamAssembleLoadingState({
  label,
}: TeamAssembleLoadingStateProps) {
  const { colors } = useAppTheme();
  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      className={styles.emptyState}
      testID="team-assemble-loading"
    >
      <ActivityIndicator color={colors.primary} size="large" />
      <Text className={styles.emptyTitle}>{label}</Text>
    </View>
  );
}
