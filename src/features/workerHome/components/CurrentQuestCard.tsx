import React from "react";
import { useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, UserRound } from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import type { QuestV2Assignment } from "@/api/questV2Contracts";
import { useLocale } from "@/locales/LocaleProvider";
import { getThemeColors } from "@/theme/colors";
import { workerHomeMessages } from "../workerHomeMessages";
import { workerHomeStyles as styles } from "../workerHomeStyles";

interface CurrentQuestCardProps {
  assignment: QuestV2Assignment;
  title?: string;
  hirerName?: string;
  state?: string;
  onPress?: () => void;
}

export function CurrentQuestCard({
  assignment,
  title,
  hirerName = "Hirer",
  state,
  onPress,
}: CurrentQuestCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = getThemeColors(colorScheme);
  const { locale } = useLocale();
  const messages = workerHomeMessages[locale];

  const questState = state ?? assignment.questState ?? "QUEST_IN_PROGRESS";
  const questTitle = title ?? `Quest #${assignment.questId.slice(0, 8)}`;

  const isAssigned =
    questState === "QUEST_ASSIGNED" ||
    questState === "QUEST_IN_PROGRESS" ||
    questState === "QUEST_COMPLETED";
  const isInProgress =
    questState === "QUEST_IN_PROGRESS" || questState === "QUEST_COMPLETED";
  const isReviewDone = questState === "QUEST_COMPLETED";

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    router.push({
      pathname: "/quest/[id]/work",
      params: { id: assignment.questId },
    });
  };

  return (
    <Pressable
      accessibilityHint="Opens current quest work screen"
      accessibilityLabel={`${messages.currentQuest}: ${questTitle}`}
      accessibilityRole="button"
      onPress={handlePress}
      style={[
        styles.currentQuestCard,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.primaryDeep,
        },
      ]}
      testID="current-quest-card"
    >
      {/* Top row */}
      <View style={styles.currentQuestTop}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View
            style={[
              styles.roleBadgeDot,
              { backgroundColor: themeColors.primaryDeep },
            ]}
          />
          <Text
            style={[
              styles.currentQuestLabel,
              { color: themeColors.primaryDeep },
            ]}
          >
            {messages.currentQuest}
          </Text>
        </View>
        <ChevronRight size={18} color={themeColors.textSecondary} />
      </View>

      {/* Body: Left details + Right timeline */}
      <View style={styles.currentQuestBody}>
        {/* Left Column: Title & Hirer Profile */}
        <View style={styles.currentQuestLeft}>
          <Text
            numberOfLines={2}
            style={[styles.cardTitle, { color: themeColors.textStrong }]}
          >
            {questTitle}
          </Text>

          <View style={styles.hirerRow}>
            <View
              style={[
                styles.hirerAvatar,
                { backgroundColor: themeColors.surfaceMuted },
              ]}
            >
              <UserRound size={18} color={themeColors.primaryDeep} />
            </View>
            <View>
              <Text
                numberOfLines={1}
                style={[styles.hirerName, { color: themeColors.textStrong }]}
              >
                {hirerName}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: themeColors.textSecondary,
                }}
              >
                Quest #{assignment.questId.slice(0, 8)}
              </Text>
            </View>
          </View>
        </View>

        {/* Right Column: Quest State Timeline */}
        <View
          style={[
            styles.currentQuestRight,
            { borderColor: themeColors.borderSubtle },
          ]}
        >
          <Text
            style={[styles.timelineTitle, { color: themeColors.textSecondary }]}
          >
            {messages.questState}
          </Text>

          {/* Node 1: Assigned */}
          <View style={styles.timelineStepRow}>
            <View
              style={[
                styles.timelineDot,
                isAssigned
                  ? {
                      backgroundColor: themeColors.primaryDeep,
                      borderColor: themeColors.primaryDeep,
                    }
                  : {
                      backgroundColor: "transparent",
                      borderColor: themeColors.borderSubtle,
                    },
              ]}
            />
            <Text
              style={[
                styles.timelineStepText,
                {
                  color: isAssigned
                    ? themeColors.textStrong
                    : themeColors.textSecondary,
                  fontWeight: isAssigned ? "600" : "400",
                },
              ]}
            >
              {messages.stageAssigned}
            </Text>
          </View>

          {/* Node 2: In Progress */}
          <View style={styles.timelineStepRow}>
            <View
              style={[
                styles.timelineDot,
                isInProgress
                  ? {
                      backgroundColor: themeColors.primaryDeep,
                      borderColor: themeColors.primaryDeep,
                    }
                  : {
                      backgroundColor: "transparent",
                      borderColor: themeColors.borderSubtle,
                    },
              ]}
            />
            <Text
              style={[
                styles.timelineStepText,
                {
                  color: isInProgress
                    ? themeColors.textStrong
                    : themeColors.textSecondary,
                  fontWeight: isInProgress ? "600" : "400",
                },
              ]}
            >
              {messages.stageInProgress}
            </Text>
          </View>

          {/* Node 3: Review / Done */}
          <View style={styles.timelineStepRow}>
            <View
              style={[
                styles.timelineDot,
                isReviewDone
                  ? {
                      backgroundColor: themeColors.success,
                      borderColor: themeColors.success,
                    }
                  : {
                      backgroundColor: "transparent",
                      borderColor: themeColors.borderSubtle,
                    },
              ]}
            />
            <Text
              style={[
                styles.timelineStepText,
                {
                  color: isReviewDone
                    ? themeColors.success
                    : themeColors.textSecondary,
                  fontWeight: isReviewDone ? "600" : "400",
                },
              ]}
            >
              {messages.stageReview}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
