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
  const stateClasses =
    questState === "QUEST_CANCELLED" || questState === "QUEST_FAILED"
      ? "border-ku-danger bg-ku-surface-danger text-ku-danger"
      : questState === "QUEST_COMPLETED"
        ? "border-ku-success bg-ku-surface-success text-ku-success"
        : "border-ku-primary-dark bg-ku-surface-accent text-ku-primary-dark";
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
  const timelineDot = (complete: boolean, tone = "primary") =>
    complete
      ? tone === "danger"
        ? "border-ku-danger bg-ku-danger"
        : tone === "success"
          ? "border-ku-success bg-ku-success"
          : "border-ku-primary-dark bg-ku-primary-dark"
      : "border-ku-border-subtle bg-transparent";
  return (
    <View
      className={`${styles.currentQuestCard} border-ku-primary-dark bg-ku-surface`}
    >
      <Pressable
        accessibilityHint="Opens current quest work screen"
        accessibilityLabel={`${messages.currentQuest}: ${questTitle}`}
        accessibilityRole="button"
        className="gap-[10px]"
        onPress={handlePress}
        testID="current-quest-card"
      >
        <View className={styles.currentQuestTop}>
          <View className="flex-row items-center gap-[6px]">
            <View className={`${styles.roleBadgeDot} bg-ku-primary-dark`} />
            <Text
              className={`${styles.currentQuestLabel} text-ku-primary-dark`}
            >
              {messages.currentQuest}
            </Text>
          </View>
          <View
            className={`flex-row items-center gap-[5px] rounded-ku-pill border px-ku-sm py-[4px] ${stateClasses}`}
          >
            <View className="h-[8px] w-[8px] rounded-[4px] bg-current" />
            <Text className="font-ku-semibold text-ku-caption leading-[15px]">
              {stateLabel}
            </Text>
          </View>
        </View>
        <View className={styles.currentQuestBody}>
          <View className={styles.currentQuestLeft}>
            <Text
              className={`${styles.cardTitle} text-ku-text-strong`}
              numberOfLines={2}
            >
              {questTitle}
            </Text>
            <View className={styles.hirerRow}>
              <View className={`${styles.hirerAvatar} bg-ku-surface-muted`}>
                <UserRound color={themeColors.primaryDeep} size={18} />
              </View>
              <View>
                <Text
                  className={`${styles.hirerName} text-ku-text-strong`}
                  numberOfLines={1}
                >
                  {hirerName}
                </Text>
              </View>
            </View>
          </View>
          <View
            className={`${styles.currentQuestRight} border-ku-border-subtle`}
          >
            <Text className={`${styles.timelineTitle} text-ku-text-secondary`}>
              {messages.questState}
            </Text>
            <View className={styles.timelineStepRow}>
              <View
                className={`${styles.timelineDot} ${timelineDot(isAssigned)}`}
              />
              <Text
                className={`${styles.timelineStepText} ${
                  isAssigned
                    ? "font-ku-semibold text-ku-text-strong"
                    : "text-ku-text-secondary"
                }`}
              >
                {messages.stageAssigned}
              </Text>
            </View>
            <View className={styles.timelineStepRow}>
              <View
                className={`${styles.timelineDot} ${timelineDot(
                  isInProgress || isReviewDone
                )}`}
              />
              <Text
                className={`${styles.timelineStepText} ${
                  isInProgress || isReviewDone
                    ? "font-ku-semibold text-ku-text-strong"
                    : "text-ku-text-secondary"
                }`}
              >
                {messages.stageInProgress}
              </Text>
            </View>
            <View className={styles.timelineStepRow}>
              <View
                className={`${styles.timelineDot} ${timelineDot(
                  isReviewDone,
                  isTerminal
                    ? questState === "QUEST_COMPLETED"
                      ? "success"
                      : "danger"
                    : "success"
                )}`}
              />
              <Text
                className={`${styles.timelineStepText} ${
                  isReviewDone
                    ? isTerminal
                      ? questState === "QUEST_COMPLETED"
                        ? "text-ku-success"
                        : "text-ku-danger"
                      : "text-ku-success"
                    : "text-ku-text-secondary"
                } ${isReviewDone ? "font-ku-semibold" : ""}`}
              >
                {messages.stageReview}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
      <View className="mt-[14px] border-t border-ku-border-subtle pt-[14px]">
        <View className="flex-row items-center justify-between gap-[10px]">
          <View className="flex-1 gap-[3px]">
            <View className="flex-row items-center gap-[6px]">
              <BriefcaseBusiness color={themeColors.primaryDeep} size={15} />
              <Text className="font-ku-semibold text-ku-label text-ku-text-strong">
                {proofRequired === undefined
                  ? messages.submitWork
                  : proofRequired
                    ? messages.proofRequiredLabel
                    : messages.proofNotRequiredLabel}
              </Text>
            </View>
            {submitHint ? (
              <Text className="text-[11px] leading-[15px] text-ku-text-secondary">
                {submitHint}
              </Text>
            ) : null}
          </View>
          <Pressable
            accessibilityLabel={messages.submitWork}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit }}
            className={`min-h-[44px] flex-row items-center justify-center gap-[6px] rounded-[10px] border px-[13px] ${
              canSubmit
                ? "border-ku-primary-dark bg-ku-primary-dark"
                : "border-ku-border-subtle bg-ku-surface-muted opacity-80"
            }`}
            disabled={!canSubmit}
            onPress={onSubmit}
            testID="current-quest-submit-button"
          >
            {canSubmit ? (
              <Upload color={themeColors.onPrimary} size={16} />
            ) : (
              <LockKeyhole color={themeColors.textSecondary} size={16} />
            )}
            <Text
              className={`font-ku-semibold text-[13px] ${
                canSubmit ? "text-ku-on-primary" : "text-ku-text-secondary"
              }`}
            >
              {messages.submitWork}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
