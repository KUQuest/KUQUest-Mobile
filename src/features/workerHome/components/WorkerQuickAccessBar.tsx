import React from "react";
import { useRouter } from "expo-router";
import { BriefcaseBusiness, ChevronRight, Clock3 } from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import type { QuestV2Assignment, QuestV2State } from "@/api/questV2Contracts";
import {
  QuestAssignmentStatus,
  QuestStatus,
} from "@/features/questBoard/domain/types";
import { useLocale } from "@/features/preferences/localeStore";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { workerHomeMessages } from "@/locales/workerHomeMessages";
import { spacing } from "@/theme/spacing";
import {
  workerHomeDockShadow,
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
    currentQuestState === QuestStatus.QUEST_ASSIGNED ||
    currentQuestState === QuestStatus.QUEST_IN_PROGRESS;

  if (
    !assignment ||
    assignment.state !== QuestAssignmentStatus.ASSIGNMENT_ACTIVE ||
    !isActiveQuest
  ) {
    return null;
  }

  const isWaitingToStart = currentQuestState === QuestStatus.QUEST_ASSIGNED;
  const stateLabel = isWaitingToStart
    ? messages.stateAssigned
    : messages.stateInProgress;

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
      className={styles.dock}
      onPress={handlePress}
      style={[{ bottom: bottomInset + spacing.sm }, workerHomeDockShadow]}
      testID="worker-quick-access-bar"
    >
      <View className={styles.dockIcon}>
        {isWaitingToStart ? (
          <Clock3 color={themeColors.onWorker} size={20} strokeWidth={2.2} />
        ) : (
          <BriefcaseBusiness
            color={themeColors.onWorker}
            size={20}
            strokeWidth={2.2}
          />
        )}
      </View>
      <View className={styles.dockCopy}>
        <View className={styles.dockStateRow}>
          {isWaitingToStart ? null : <View className={styles.dockLiveDot} />}
          <Text className={styles.dockState} numberOfLines={1}>
            {stateLabel}
          </Text>
        </View>
        <Text className={styles.dockTitle} numberOfLines={1}>
          {questTitle ?? messages.workTitle}
        </Text>
      </View>
      <View className={styles.dockAction}>
        <Text className={styles.dockActionText}>{messages.viewWork}</Text>
        <ChevronRight
          color={themeColors.workerDark}
          size={16}
          strokeWidth={2.4}
        />
      </View>
    </Pressable>
  );
}
