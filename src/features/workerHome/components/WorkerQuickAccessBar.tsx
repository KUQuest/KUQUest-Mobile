import React from "react";
import { useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { BriefcaseBusiness, ChevronRight } from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import type { QuestV2Assignment } from "@/api/questV2Contracts";
import { useLocale } from "@/locales/LocaleProvider";
import { getThemeColors } from "@/theme/colors";
import { workerHomeMessages } from "../workerHomeMessages";
import { workerHomeStyles as styles } from "../workerHomeStyles";

interface WorkerQuickAccessBarProps {
  assignment: QuestV2Assignment | null;
  bottomInset: number;
  onPress?: () => void;
}

export function WorkerQuickAccessBar({
  assignment,
  bottomInset,
  onPress,
}: WorkerQuickAccessBarProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = getThemeColors(colorScheme);
  const { locale } = useLocale();
  const messages = workerHomeMessages[locale];

  // Grab-like rule: only pop up if quest that user accepted is ongoing
  if (!assignment || assignment.state !== "ASSIGNMENT_ACTIVE") {
    return null;
  }

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    router.push({
      pathname: "/quest/[id]/proof",
      params: { id: assignment.questId },
    });
  };

  const questShortId = assignment.questId.slice(0, 8);

  return (
    <Pressable
      accessibilityHint={messages.tapToOpenWork}
      accessibilityLabel={`${messages.workingInProgress}: Quest #${questShortId}`}
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
                {messages.workingInProgress}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.quickAccessSubtitle,
                { color: themeColors.textSecondary },
              ]}
            >
              Quest #{questShortId} · {messages.tapToOpenWork}
            </Text>
          </View>
        </View>

        <ChevronRight size={18} color={themeColors.primaryDeep} />
      </View>

      {/* Progress track bar like Grab active task */}
      <View
        style={[
          styles.quickAccessProgressBar,
          { backgroundColor: themeColors.surfaceSuccess },
        ]}
      >
        <View
          style={[
            styles.quickAccessProgressFill,
            { backgroundColor: themeColors.primaryDeep },
          ]}
        />
      </View>
    </Pressable>
  );
}
