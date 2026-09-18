import React from "react";
import { useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { MapPin, UserRound, Users } from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import type { QuestV2BoardCard } from "@/api/questV2Contracts";
import { formatSatang } from "@/domain/satang";
import { useLocale } from "@/locales/LocaleProvider";
import { getThemeColors } from "@/theme/colors";
import { workerHomeMessages } from "../workerHomeMessages";
import { workerHomeStyles as styles } from "../workerHomeStyles";

interface WorkerQuestFeedCardProps {
  quest: QuestV2BoardCard;
  onPress?: () => void;
}

export function WorkerQuestFeedCard({
  quest,
  onPress,
}: WorkerQuestFeedCardProps) {
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
      params: { id: quest.id },
    });
  };

  const rewardFormatted =
    quest.questReward > 0 ? formatSatang(quest.questReward) : "—";

  return (
    <Pressable
      accessibilityLabel={`${quest.title}, ${messages.reward} ${rewardFormatted}`}
      accessibilityRole="button"
      onPress={handlePress}
      style={[
        styles.feedCard,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.borderSubtle,
        },
      ]}
      testID={`worker-feed-card-${quest.id}`}
    >
      <View style={styles.feedCardTop}>
        <View style={{ flex: 1, marginRight: 8 }}>
          {quest.tag?.name ? (
            <View
              style={[
                styles.tagChip,
                { backgroundColor: themeColors.surfaceMuted },
              ]}
            >
              <Text
                style={[styles.tagText, { color: themeColors.primaryDeep }]}
              >
                {quest.tag.name}
              </Text>
            </View>
          ) : null}
          <Text
            numberOfLines={2}
            style={[styles.cardTitle, { color: themeColors.textStrong }]}
          >
            {quest.title}
          </Text>
        </View>
        <Text
          style={[styles.feedRewardText, { color: themeColors.primaryDeep }]}
        >
          {rewardFormatted}
        </Text>
      </View>

      <View style={styles.cardMetaRow}>
        {quest.hirerName ? (
          <View style={styles.cardMetaItem}>
            <UserRound size={13} color={themeColors.textSecondary} />
            <Text
              numberOfLines={1}
              style={[
                styles.cardMetaText,
                { color: themeColors.textSecondary },
              ]}
            >
              {quest.hirerName}
            </Text>
          </View>
        ) : null}

        {quest.location ? (
          <View style={styles.cardMetaItem}>
            <MapPin size={13} color={themeColors.textSecondary} />
            <Text
              numberOfLines={1}
              style={[
                styles.cardMetaText,
                { color: themeColors.textSecondary },
              ]}
            >
              {quest.location}
            </Text>
          </View>
        ) : null}

        <View style={styles.cardMetaItem}>
          <Users size={13} color={themeColors.textSecondary} />
          <Text
            style={[styles.cardMetaText, { color: themeColors.textSecondary }]}
          >
            {quest.headcount}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
