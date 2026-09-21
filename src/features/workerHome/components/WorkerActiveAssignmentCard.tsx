import React from "react";
import { useRouter } from "expo-router";
import { BriefcaseBusiness, ChevronRight, Clock } from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import type { QuestV2Assignment } from "@/api/questV2Contracts";
import { useLocale } from "@/features/preferences/localeStore";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { workerHomeMessages } from "../workerHomeMessages";
import { workerHomeStyles as styles } from "../workerHomeStyles";

interface WorkerActiveAssignmentCardProps {
  assignment: QuestV2Assignment;
  title?: string;
  onPress?: () => void;
}

export function WorkerActiveAssignmentCard({
  assignment,
  title,
  onPress,
}: WorkerActiveAssignmentCardProps) {
  const router = useRouter();
  const { colors: themeColors } = useAppTheme();
  const { locale } = useLocale();
  const messages = workerHomeMessages[locale];
  const questTitle = title ?? messages.workTitle;

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    router.push(`/quest/${assignment.questId}/work`);
  };

  const formattedDate = assignment.startedAt
    ? new Date(assignment.startedAt).toLocaleDateString(
        locale === "th" ? "th-TH" : "en-US",
        { day: "numeric", month: "short", year: "numeric" }
      )
    : new Date(assignment.createdAt).toLocaleDateString(
        locale === "th" ? "th-TH" : "en-US",
        { day: "numeric", month: "short", year: "numeric" }
      );

  const statusLabel =
    assignment.state === "ASSIGNMENT_ACTIVE"
      ? messages.statusActive
      : assignment.state === "ASSIGNMENT_COMPLETED"
        ? messages.statusCompleted
        : assignment.state === "ASSIGNMENT_CANCELLED"
          ? messages.statusCancelled
          : messages.statusIncomplete;

  return (
    <View
      accessibilityRole="summary"
      className="rounded-[16px] border border-ku-border-subtle bg-ku-surface p-ku-md"
      testID={`worker-assignment-card-${assignment.id}`}
    >
      <View className="mb-ku-sm flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-ku-sm">
          <BriefcaseBusiness size={18} color={themeColors.primaryDeep} />
          <Text
            className={`${styles.cardTitle} text-ku-text-strong`}
            numberOfLines={1}
          >
            {questTitle}
          </Text>
        </View>
        <View className="rounded-ku-pill border border-ku-border-success bg-ku-surface-success px-[10px] py-[3px]">
          <Text className="font-ku-semibold text-ku-caption leading-[16px] text-ku-success">
            {statusLabel}
          </Text>
        </View>
      </View>
      <View className={styles.cardMetaRow}>
        <View className={styles.cardMetaItem}>
          <Clock size={14} color={themeColors.textSecondary} />
          <Text className={`${styles.cardMetaText} text-ku-text-secondary`}>
            {formattedDate}
          </Text>
        </View>
      </View>
      <Pressable
        accessibilityLabel={`${messages.viewWork}: ${questTitle}`}
        accessibilityRole="button"
        className={`${styles.actionButton} bg-ku-primary-dark`}
        onPress={handlePress}
        testID={`worker-assignment-action-${assignment.id}`}
      >
        <View className="flex-row items-center gap-[6px]">
          <Text className={`${styles.actionButtonText} text-ku-on-primary`}>
            {messages.viewWork}
          </Text>
          <ChevronRight size={16} color={themeColors.onPrimary} />
        </View>
      </Pressable>
    </View>
  );
}
