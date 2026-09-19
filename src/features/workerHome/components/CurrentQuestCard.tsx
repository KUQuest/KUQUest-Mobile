import React from "react";
import { useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import {
  BriefcaseBusiness,
  LockKeyhole,
  Upload,
  UserRound,
} from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import type { QuestV2Assignment, QuestV2State } from "@/api/questV2Contracts";
import { useLocale } from "@/features/preferences/localeStore";
import { getThemeColors } from "@/theme/colors";
import { workerHomeMessages } from "../workerHomeMessages";
import { workerHomeStyles as styles } from "../workerHomeStyles";

interface CurrentQuestCardProps {
  assignment: QuestV2Assignment;
  title?: string;
  hirerName?: string;
  state?: QuestV2State;
  proofRequired?: boolean;
  submitEnabled?: boolean;
  submissionPending?: boolean;
  onPress?: () => void;
  onSubmit?: () => void;
}

function getQuestStateLabel(
  state: QuestV2State,
  messages: typeof workerHomeMessages.en
): string {
  switch (state) {
    case "QUEST_ASSIGNED":
      return messages.stateAssigned;
    case "QUEST_IN_PROGRESS":
      return messages.stateInProgress;
    case "QUEST_COMPLETED":
      return messages.stateCompleted;
    case "QUEST_CANCELLED":
      return messages.stateCancelled;
    case "QUEST_FAILED":
      return messages.stateFailed;
    case "QUEST_DRAFT":
    case "QUEST_OPEN":
      return messages.stateAssigned;
  }
}

export function CurrentQuestCard({
  assignment,
  title,
  hirerName = "Hirer",
  state,
  proofRequired,
  submitEnabled,
  submissionPending = false,
  onPress,
  onSubmit,
}: CurrentQuestCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = getThemeColors(colorScheme);
  const { locale } = useLocale();
  const messages = workerHomeMessages[locale];

  const questState = state ?? assignment.questState;
  const questTitle = title ?? messages.workTitle;
  const isAssigned =
    questState === "QUEST_ASSIGNED" ||
    questState === "QUEST_IN_PROGRESS" ||
    questState === "QUEST_COMPLETED" ||
    questState === "QUEST_CANCELLED" ||
    questState === "QUEST_FAILED";
  const isInProgress = questState === "QUEST_IN_PROGRESS";
  const isTerminal =
    questState === "QUEST_COMPLETED" ||
    questState === "QUEST_CANCELLED" ||
    questState === "QUEST_FAILED";
  const isReviewDone = isTerminal || submissionPending;
  const canSubmit =
    isInProgress && !submissionPending && submitEnabled !== false;
  const stateLabel = getQuestStateLabel(questState, messages);
  const stateColor =
    questState === "QUEST_CANCELLED" || questState === "QUEST_FAILED"
      ? themeColors.danger
      : questState === "QUEST_COMPLETED"
        ? themeColors.success
        : themeColors.primaryDeep;
  const submitHint = submissionPending
    ? messages.submissionPending
    : isTerminal
      ? messages.submitUnavailable
      : !isInProgress
        ? messages.submitLockedUntilStart
        : undefined;

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
    <View
      style={[
        styles.currentQuestCard,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.primaryDeep,
        },
      ]}
    >
      <Pressable
        accessibilityHint="Opens current quest work screen"
        accessibilityLabel={`${messages.currentQuest}: ${questTitle}`}
        accessibilityRole="button"
        onPress={handlePress}
        style={{ gap: 10 }}
        testID="current-quest-card"
      >
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
          <View
            style={{
              alignItems: "center",
              backgroundColor:
                questState === "QUEST_CANCELLED" ||
                questState === "QUEST_FAILED"
                  ? themeColors.surfaceDanger
                  : themeColors.surfaceAccent,
              borderColor: stateColor,
              borderRadius: 999,
              borderWidth: 1,
              flexDirection: "row",
              gap: 5,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <View
              style={{
                backgroundColor: stateColor,
                borderRadius: 4,
                height: 8,
                width: 8,
              }}
            />
            <Text
              style={{
                color: stateColor,
                fontFamily: styles.currentQuestLabel.fontFamily,
                fontSize: 11,
                lineHeight: 15,
              }}
            >
              {stateLabel}
            </Text>
          </View>
        </View>

        <View style={styles.currentQuestBody}>
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
              </View>
            </View>
          </View>

          <View
            style={[
              styles.currentQuestRight,
              { borderColor: themeColors.borderSubtle },
            ]}
          >
            <Text
              style={[
                styles.timelineTitle,
                { color: themeColors.textSecondary },
              ]}
            >
              {messages.questState}
            </Text>

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

            <View style={styles.timelineStepRow}>
              <View
                style={[
                  styles.timelineDot,
                  isInProgress || isReviewDone
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
                    color:
                      isInProgress || isReviewDone
                        ? themeColors.textStrong
                        : themeColors.textSecondary,
                    fontWeight: isInProgress || isReviewDone ? "600" : "400",
                  },
                ]}
              >
                {messages.stageInProgress}
              </Text>
            </View>

            <View style={styles.timelineStepRow}>
              <View
                style={[
                  styles.timelineDot,
                  isReviewDone
                    ? {
                        backgroundColor: isTerminal
                          ? stateColor
                          : themeColors.success,
                        borderColor: isTerminal
                          ? stateColor
                          : themeColors.success,
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
                      ? isTerminal
                        ? stateColor
                        : themeColors.success
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

      <View
        style={{
          borderColor: themeColors.borderSubtle,
          borderTopWidth: 1,
          marginTop: 14,
          paddingTop: 14,
        }}
      >
        <View
          style={{
            alignItems: "center",
            flexDirection: "row",
            gap: 10,
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1, gap: 3 }}>
            <View
              style={{ alignItems: "center", flexDirection: "row", gap: 6 }}
            >
              <BriefcaseBusiness color={themeColors.primaryDeep} size={15} />
              <Text
                style={{
                  color: themeColors.textStrong,
                  fontFamily: styles.currentQuestLabel.fontFamily,
                  fontSize: 12,
                }}
              >
                {proofRequired === undefined
                  ? messages.submitWork
                  : proofRequired
                    ? messages.proofRequiredLabel
                    : messages.proofNotRequiredLabel}
              </Text>
            </View>
            {submitHint ? (
              <Text
                style={{
                  color: themeColors.textSecondary,
                  fontSize: 11,
                  lineHeight: 15,
                }}
              >
                {submitHint}
              </Text>
            ) : null}
          </View>

          <Pressable
            accessibilityLabel={messages.submitWork}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit }}
            disabled={!canSubmit}
            onPress={onSubmit}
            style={{
              alignItems: "center",
              backgroundColor: canSubmit
                ? themeColors.primaryDeep
                : themeColors.surfaceMuted,
              borderColor: canSubmit
                ? themeColors.primaryDeep
                : themeColors.borderSubtle,
              borderRadius: 10,
              borderWidth: 1,
              flexDirection: "row",
              gap: 6,
              minHeight: 44,
              opacity: canSubmit ? 1 : 0.8,
              paddingHorizontal: 13,
            }}
            testID="current-quest-submit-button"
          >
            {canSubmit ? (
              <Upload color={themeColors.white} size={16} />
            ) : (
              <LockKeyhole color={themeColors.textSecondary} size={16} />
            )}
            <Text
              style={{
                color: canSubmit
                  ? themeColors.white
                  : themeColors.textSecondary,
                fontFamily: styles.currentQuestLabel.fontFamily,
                fontSize: 13,
              }}
            >
              {messages.submitWork}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
