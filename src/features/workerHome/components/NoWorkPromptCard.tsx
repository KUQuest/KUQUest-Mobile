import React from "react";
import { useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import { useLocale } from "@/features/preferences/localeStore";
import { getThemeColors } from "@/theme/colors";
import { workerHomeMessages } from "../workerHomeMessages";
import { workerHomeStyles as styles } from "../workerHomeStyles";

interface NoWorkPromptCardProps {
  onFindQuests?: () => void;
}

export function NoWorkPromptCard({ onFindQuests }: NoWorkPromptCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = getThemeColors(colorScheme);
  const { locale } = useLocale();
  const messages = workerHomeMessages[locale];

  const handlePress = () => {
    if (onFindQuests) {
      onFindQuests();
      return;
    }
    router.replace("/(tabs)");
  };

  return (
    <View
      accessibilityRole="summary"
      style={[
        styles.noWorkPromptCard,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.borderSubtle,
        },
      ]}
      testID="no-work-prompt-card"
    >
      <View
        style={[
          styles.noWorkIconCircle,
          { backgroundColor: themeColors.surfaceMuted },
        ]}
      >
        <Search size={24} color={themeColors.primaryDeep} />
      </View>

      <Text
        style={[styles.noWorkTitle, { color: themeColors.textStrong }]}
        testID="no-work-prompt-title"
      >
        {messages.noWorkPromptTitle}
      </Text>
      <Text
        style={[styles.noWorkDesc, { color: themeColors.textSecondary }]}
        testID="no-work-prompt-desc"
      >
        {messages.noWorkPromptDesc}
      </Text>

      <Pressable
        accessibilityLabel={messages.findQuestsAction}
        accessibilityRole="button"
        onPress={handlePress}
        style={[
          styles.findQuestsBtn,
          { backgroundColor: themeColors.primaryDeep },
        ]}
        testID="find-quests-button"
      >
        <Text style={[styles.findQuestsBtnText, { color: themeColors.white }]}>
          {messages.findQuestsAction}
        </Text>
      </Pressable>
    </View>
  );
}
