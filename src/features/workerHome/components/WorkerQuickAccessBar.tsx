import React from "react";
import { useRouter } from "expo-router";
import { BriefcaseBusiness, ChevronRight } from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import type { QuestV2Assignment, QuestV2State } from "@/api/questV2Contracts";
import { useLocale } from "@/features/preferences/localeStore";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { workerHomeMessages } from "../workerHomeMessages";
import {
  workerHomeQuickAccessShadow,
  workerHomeStyles as styles,
} from "../workerHomeStyles";

interface WorkerQuickAccessBarProps {
  assignment: QuestV2Assignment | null;
  bottomInset: number;
  questTitle?: string;
  questState?: QuestV2State;
  onPress?: () => void;
}

export function WorkerQuickAccessBar({
  assignment,
  bottomInset,
  questTitle,
  questState,
  onPress,
}: WorkerQuickAccessBarProps) {
  const router = useRouter();
  const { colors: themeColors } = useAppTheme();
  const { locale } = useLocale();
  const messages = workerHomeMessages[locale];

  const currentQuestState = questState ?? assignment?.questState;
  const isActiveQuest =
    currentQuestState === "QUEST_ASSIGNED" ||
    currentQuestState === "QUEST_IN_PROGRESS";

  if (
    !assignment ||
    assignment.state !== "ASSIGNMENT_ACTIVE" ||
    !isActiveQuest
  ) {
    return null;
  }

  const isWaitingToStart = currentQuestState === "QUEST_ASSIGNED";
  const stateLabel = isWaitingToStart
    ? messages.stateAssigned
    : messages.stateInProgress;
  const progressWidth = isWaitingToStart ? "0%" : "70%";

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    router.push("/my-quests");
  };

  return (
    <Pressable
      accessibilityHint={messages.tapToOpenWork}
      accessibilityLabel={`${stateLabel}: ${questTitle ?? messages.workTitle}`}
      accessibilityRole="button"
      className={`${styles.quickAccessFloatingContainer} border-ku-worker-dark bg-ku-surface`}
      onPress={handlePress}
      style={[{ bottom: bottomInset + 8 }, workerHomeQuickAccessShadow]}
      testID="worker-quick-access-bar"
    >
      <View className={styles.quickAccessTopRow}>
        <View className={styles.quickAccessLeft}>
          <View
            className={`${styles.quickAccessIndicator} bg-ku-worker-dark`}
          />
          <View className="flex-1">
            <View className="flex-row items-center gap-ku-6">
              <BriefcaseBusiness size={14} color={themeColors.workerDeep} />
              <Text
                className={`${styles.quickAccessTitle} text-ku-worker-dark`}
              >
                {stateLabel}
              </Text>
            </View>
            <Text
              className={`${styles.quickAccessSubtitle} text-ku-text-secondary`}
              numberOfLines={1}
            >
              {questTitle ?? messages.workTitle} · {messages.tapToOpenWork}
            </Text>
          </View>
        </View>
        <ChevronRight size={18} color={themeColors.workerDeep} />
      </View>
      <View
        className={`${styles.quickAccessProgressBar} bg-ku-surface-success`}
      >
        <View
          className={`${styles.quickAccessProgressFill} bg-ku-worker-dark`}
          style={{ width: progressWidth }}
        />
      </View>
    </Pressable>
  );
}
