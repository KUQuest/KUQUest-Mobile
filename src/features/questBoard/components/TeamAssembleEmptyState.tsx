import React from "react";

import { Plus, UsersRound } from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import { colors } from "@/theme/colors";

import styles from "./groupQuestStyles";

export interface TeamAssembleEmptyStateProps {
  title: string;
  description: string;
  createLabel: string;
  onCreateTeam?: () => void;
}

export function TeamAssembleEmptyState({
  title,
  description,
  createLabel,
  onCreateTeam,
}: TeamAssembleEmptyStateProps) {
  return (
    <View className={styles.emptyState} testID="team-assemble-empty">
      <View className={styles.emptyIcon}>
        <UsersRound color={colors.primary} size={26} strokeWidth={1.9} />
      </View>
      <Text className={styles.emptyTitle}>{title}</Text>
      <Text className={styles.emptyText}>{description}</Text>
      {onCreateTeam ? (
        <Pressable
          accessibilityLabel={createLabel}
          accessibilityRole="button"
          className={styles.retryButton}
          onPress={onCreateTeam}
          testID="team-assemble-create"
        >
          <Plus color={colors.onPrimary} size={18} strokeWidth={2.5} />
          <Text className={styles.retryButtonText}>{createLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
