import React from "react";

import { Pressable, Text, View } from "@/tw";
import { CircleAlert } from "lucide-react-native";
import { colors } from "@/theme/colors";

import styles from "../groupQuestStyles";

export interface TeamAssembleErrorStateProps {
  message: string;
  retryLabel: string;
  onRetry?: () => void;
}

export function TeamAssembleErrorState({
  message,
  retryLabel,
  onRetry,
}: TeamAssembleErrorStateProps) {
  return (
    <View
      accessibilityRole="alert"
      className={`${styles.notice} ${styles.noticeDanger}`}
      testID="team-assemble-error"
    >
      <View className={`${styles.noticeIcon} ${styles.noticeIconDanger}`}>
        <CircleAlert color={colors.dangerDark} size={18} strokeWidth={2.1} />
      </View>
      <View className={styles.noticeCopy}>
        <Text className={styles.noticeTitle}>{message}</Text>
        {onRetry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={retryLabel}
            className={styles.retryButton}
            onPress={onRetry}
            testID="team-assemble-retry"
          >
            <Text className={styles.retryButtonText}>{retryLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
