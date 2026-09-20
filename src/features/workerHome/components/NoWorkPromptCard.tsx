import React from "react";
import { useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import { useLocale } from "@/features/preferences/localeStore";
import { getThemeColors } from "@/theme/colors";
import { workerHomeMessages } from "../workerHomeMessages";

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
      className="mb-[18px] items-center rounded-[18px] border border-ku-border-subtle bg-ku-surface p-[22px]"
      testID="no-work-prompt-card"
    >
      <View className="mb-[10px] h-[48px] w-[48px] items-center justify-center rounded-[24px] bg-ku-surface-muted">
        <Search size={24} color={themeColors.primaryDeep} />
      </View>
      <Text
        className="text-center font-ku-semibold text-ku-body leading-[22px]"
        testID="no-work-prompt-title"
      >
        {messages.noWorkPromptTitle}
      </Text>
      <Text
        className="mt-[4px] text-center font-ku-regular text-ku-meta leading-[18px]"
        testID="no-work-prompt-desc"
      >
        {messages.noWorkPromptDesc}
      </Text>
      <Pressable
        accessibilityLabel={messages.findQuestsAction}
        accessibilityRole="button"
        className="mt-[14px] min-h-[42px] items-center justify-center rounded-[10px] bg-ku-primary-dark px-ku-lg py-[10px]"
        onPress={handlePress}
        testID="find-quests-button"
      >
        <Text className="font-ku-semibold text-ku-body-small leading-[20px] text-ku-on-primary">
          {messages.findQuestsAction}
        </Text>
      </Pressable>
    </View>
  );
}
