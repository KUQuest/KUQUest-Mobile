import React from "react";
import { useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { BriefcaseBusiness, ChevronRight, Clock } from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import type { QuestV2Assignment } from "@/api/questV2Contracts";
import { useLocale } from "@/locales/LocaleProvider";
import { getThemeColors } from "@/theme/colors";
import { workerHomeMessages } from "../workerHomeMessages";
import { workerHomeStyles as styles } from "../workerHomeStyles";

interface WorkerActiveAssignmentCardProps {
  assignment: QuestV2Assignment;
  onPress?: () => void;
}

export function WorkerActiveAssignmentCard({
  assignment,
  onPress,
}: WorkerActiveAssignmentCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = getThemeColors(colorScheme);
  const { locale } = useLocale();
  const messages = workerHomeMessages[locale];

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    router.push({
      pathname: "/quest/[id]",
      params: { id: assignment.questId, mode: "join" },
    });
  };

  const formattedDate = assignment.startedAt
    ? new Date(assignment.startedAt).toLocaleDateString(
        locale === "th" ? "th-TH" : "en-US",
        {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      )
    : new Date(assignment.createdAt).toLocaleDateString(
        locale === "th" ? "th-TH" : "en-US",
        {
          month: "short",
          day: "numeric",
        }
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
      style={[
        styles.assignmentCard,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.borderSubtle,
        },
      ]}
      testID={`worker-assignment-card-${assignment.id}`}
    >
      <View style={styles.cardHeader}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            flex: 1,
          }}
        >
          <BriefcaseBusiness size={18} color={themeColors.primaryDeep} />
          <Text
            numberOfLines={1}
            style={[styles.cardTitle, { color: themeColors.textStrong }]}
          >
            Quest #{assignment.questId.slice(0, 8)}
          </Text>
        </View>
        <View
          style={[
            styles.badgePill,
            {
              backgroundColor: themeColors.surfaceSuccess,
              borderColor: themeColors.borderSuccess,
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: themeColors.success }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <View style={styles.cardMetaRow}>
        <View style={styles.cardMetaItem}>
          <Clock size={14} color={themeColors.textSecondary} />
          <Text
            style={[styles.cardMetaText, { color: themeColors.textSecondary }]}
          >
            {formattedDate}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityLabel={`${messages.viewWork} Quest ${assignment.questId.slice(0, 8)}`}
        accessibilityRole="button"
        onPress={handlePress}
        style={[
          styles.actionButton,
          { backgroundColor: themeColors.primaryDeep },
        ]}
        testID={`worker-assignment-action-${assignment.id}`}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={[styles.actionButtonText, { color: themeColors.white }]}>
            {messages.viewWork}
          </Text>
          <ChevronRight size={16} color={themeColors.white} />
        </View>
      </Pressable>
    </View>
  );
}
