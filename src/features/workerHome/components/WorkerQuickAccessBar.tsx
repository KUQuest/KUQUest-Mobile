import React from "react";
import { useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { BriefcaseBusiness, ChevronRight } from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import type { QuestV2Assignment, QuestV2State } from "@/api/questV2Contracts";
import { useLocale } from "@/features/preferences/localeStore";
import { getThemeColors } from "@/theme/colors";
import { workerHomeMessages } from "../workerHomeMessages";
import { workerHomeStyles as styles } from "../workerHomeStyles";

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
  const colorScheme = useColorScheme();
  const themeColors = getThemeColors(colorScheme);
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
      onPress={handlePress}
      style={[
        styles.quickAccessFloatingContainer,
        {
          bottom: bottomInset + 8,
          backgroundColor: themeColors.surface,
          borderColor: themeColors.primaryDeep,
        },
      ]}
      testID="worker-quick-access-bar"
    >
      <View style={styles.quickAccessTopRow}>
        <View style={styles.quickAccessLeft}>
          <View
            style={[
              styles.quickAccessIndicator,
              { backgroundColor: themeColors.primaryDeep },
            ]}
          />
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <BriefcaseBusiness size={14} color={themeColors.primaryDeep} />
              <Text
                style={[
                  styles.quickAccessTitle,
                  { color: themeColors.primaryDeep },
                ]}
              >
                {stateLabel}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.quickAccessSubtitle,
                { color: themeColors.textSecondary },
              ]}
            >
              {questTitle ?? messages.workTitle} · {messages.tapToOpenWork}
            </Text>
          </View>
        </View>

        <ChevronRight size={18} color={themeColors.primaryDeep} />
      </View>

      <View
        style={[
          styles.quickAccessProgressBar,
          { backgroundColor: themeColors.surfaceSuccess },
        ]}
      >
        <View
          style={[
            styles.quickAccessProgressFill,
            {
              backgroundColor: themeColors.primaryDeep,
              width: progressWidth,
            },
          ]}
        />
      </View>
    </Pressable>
  );
}
