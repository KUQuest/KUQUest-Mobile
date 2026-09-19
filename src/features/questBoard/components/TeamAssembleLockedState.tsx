import React from "react";

import { Check, CircleX } from "lucide-react-native";

import { Text, View } from "@/tw";
import { colors } from "@/theme/colors";
import { QuestTeamStatus } from "../types";

import styles from "./groupQuestStyles";

export interface TeamAssembleLockedStateProps {
  status: QuestTeamStatus | string | undefined;
  rejectedLabel: string;
  selectedLabel: string;
  submittedTitle: string;
  description: string;
}

export function TeamAssembleLockedState({
  status,
  rejectedLabel,
  selectedLabel,
  submittedTitle,
  description,
}: TeamAssembleLockedStateProps) {
  const rejected = status === QuestTeamStatus.TEAM_REJECTED;
  return (
    <View
      accessibilityLiveRegion="polite"
      className={`${styles.notice} ${rejected ? styles.noticeDanger : styles.noticeSuccess}`}
      testID="team-assemble-locked-state"
    >
      <View
        className={`${styles.noticeIcon} ${rejected ? styles.noticeIconDanger : ""}`}
      >
        {rejected ? (
          <CircleX color={colors.dangerDark} size={18} strokeWidth={2.1} />
        ) : (
          <Check color={colors.success} size={18} strokeWidth={2.4} />
        )}
      </View>
      <View className={styles.noticeCopy}>
        <Text className={styles.noticeTitle}>
          {rejected
            ? rejectedLabel
            : status === QuestTeamStatus.TEAM_SELECTED
              ? selectedLabel
              : submittedTitle}
        </Text>
        <Text className={styles.noticeText}>{description}</Text>
      </View>
    </View>
  );
}
