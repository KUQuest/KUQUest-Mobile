import React from "react";
import { useRouter } from "expo-router";
import { ChevronRight, Clock } from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import type { QuestV2Assignment } from "@/api/questV2Contracts";
import { useLocale } from "@/features/preferences/localeStore";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { workerHomeMessages } from "../workerHomeMessages";
import {
  workerHomeStyles as styles,
  workerHomeWorkingNowShadow,
} from "../workerHomeStyles";

interface WorkingNowFloatingBarProps {
  assignment: QuestV2Assignment | null;
  bottomInset: number;
  questTitle?: string;
  onPress?: () => void;
}

export function formatElapsedTime(
  dateString: string | null | undefined,
  locale: "en" | "th"
): string {
  if (!dateString) return locale === "th" ? "เพิ่งเริ่มงาน" : "Just started";
  const start = new Date(dateString).getTime();
  if (!Number.isFinite(start)) {
    return locale === "th" ? "เพิ่งเริ่มงาน" : "Just started";
  }
  const diffMs = Math.max(0, Date.now() - start);
  const totalMinutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (locale === "th") {
    if (hours > 0) return `${hours} ชม. ${mins} นาทีที่แล้ว`;
    return `${mins} นาทีที่แล้ว`;
  }
  if (hours > 0) return `${hours}h ${mins}m elapsed`;
  return `${mins}m elapsed`;
}

export function WorkingNowFloatingBar({
  assignment,
  bottomInset,
  questTitle,
  onPress,
}: WorkingNowFloatingBarProps) {
  const router = useRouter();
  const { colors: themeColors } = useAppTheme();
  const { locale } = useLocale();
  const messages = workerHomeMessages[locale];
  const isWaitingToStart = assignment?.questState === "QUEST_ASSIGNED";
  const isInProgress = assignment?.questState === "QUEST_IN_PROGRESS";
  if (
    !assignment ||
    assignment.state !== "ASSIGNMENT_ACTIVE" ||
    (!isWaitingToStart && !isInProgress)
  ) {
    return null;
  }
  const stateLabel = isWaitingToStart
    ? messages.stateAssigned
    : messages.stateInProgress;
  const subtitle = isWaitingToStart
    ? `${questTitle ?? messages.workTitle} · ${stateLabel}`
    : `${questTitle ?? messages.workTitle} · ${formatElapsedTime(
        assignment.startedAt,
        locale
      )}`;
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
      className={`${styles.workingNowBar} border-ku-primary-dark bg-ku-surface`}
      onPress={handlePress}
      style={[{ bottom: bottomInset + 8 }, workerHomeWorkingNowShadow]}
      testID="working-now-floating-bar"
    >
      <View className={styles.workingNowLeft}>
        <View className={`${styles.roleBadgeDot} bg-ku-primary-dark`} />
        <Clock size={16} color={themeColors.primaryDeep} />
        <View className="flex-1">
          <Text className={`${styles.workingNowTitle} text-ku-primary-dark`}>
            {stateLabel}
          </Text>
          <Text
            className={`${styles.workingNowElapsed} text-ku-text-secondary`}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        </View>
      </View>
      <ChevronRight size={18} color={themeColors.primaryDeep} />
    </Pressable>
  );
}
