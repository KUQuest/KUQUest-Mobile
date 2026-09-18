import React from "react";
import { useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, Clock } from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import type { QuestV2Assignment } from "@/api/questV2Contracts";
import { useLocale } from "@/features/preferences/localeStore";
import { getThemeColors } from "@/theme/colors";
import { workerHomeMessages } from "../workerHomeMessages";
import { workerHomeStyles as styles } from "../workerHomeStyles";

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
    if (hours > 0) return `ผ่านไป ${hours} ชม. ${mins} นาที`;
    return `ผ่านไป ${mins} นาที`;
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
  const colorScheme = useColorScheme();
  const themeColors = getThemeColors(colorScheme);
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
      onPress={handlePress}
      style={[
        styles.workingNowBar,
        {
          bottom: bottomInset + 8,
          backgroundColor: themeColors.surface,
          borderColor: themeColors.primaryDeep,
        },
      ]}
      testID="working-now-floating-bar"
    >
      <View style={styles.workingNowLeft}>
        <View
          style={[
            styles.roleBadgeDot,
            { backgroundColor: themeColors.primaryDeep },
          ]}
        />
        <Clock size={16} color={themeColors.primaryDeep} />
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.workingNowTitle, { color: themeColors.primaryDeep }]}
          >
            {stateLabel}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              styles.workingNowElapsed,
              { color: themeColors.textSecondary },
            ]}
          >
            {subtitle}
          </Text>
        </View>
      </View>

      <ChevronRight size={18} color={themeColors.primaryDeep} />
    </Pressable>
  );
}
