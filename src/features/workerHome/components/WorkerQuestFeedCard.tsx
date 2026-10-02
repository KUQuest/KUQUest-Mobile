import React from "react";
import { useRouter } from "expo-router";
import {
  CalendarDays,
  ChevronRight,
  MapPin,
  UserRound,
  Users,
} from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import type { QuestV2BoardCard } from "@/api/questV2Contracts";
import { SATANG_PER_BAHT, formatSatang } from "@/domain/satang";
import { formatTimeInBangkok, formatTimestampDate } from "@/domain/datetime";
import { useLocale } from "@/features/preferences/localeStore";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { workerHomeMessages } from "@/locales/workerHomeMessages";
import { workerHomeStyles as styles } from "../workerHomeStyles";

interface WorkerQuestFeedCardProps {
  quest: QuestV2BoardCard;
  tagLabel?: string;
  onPress?: () => void;
}

const PLACEHOLDER = "—";

export function WorkerQuestFeedCard({
  quest,
  tagLabel,
  onPress,
}: WorkerQuestFeedCardProps) {
  const router = useRouter();
  const { colors: themeColors } = useAppTheme();
  const { locale } = useLocale();
  const messages = workerHomeMessages[locale];
  const questStartDateTime = new Date(quest.startTime);
  const hasValidQuestStartTime = !Number.isNaN(questStartDateTime.getTime());
  const formattedStartDate = hasValidQuestStartTime
    ? (formatTimestampDate(questStartDateTime, locale) ?? PLACEHOLDER)
    : PLACEHOLDER;
  const formattedStartTime = hasValidQuestStartTime
    ? formatTimeInBangkok(questStartDateTime) || PLACEHOLDER
    : PLACEHOLDER;

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    router.push({ pathname: "/quest/[id]", params: { id: quest.id } });
  };

  // Quest V2 board rewards are Baht; formatSatang requires integer Satang.
  const rewardSatang =
    typeof quest.questFundingTotal === "number"
      ? Math.round(quest.questFundingTotal * SATANG_PER_BAHT)
      : Number.NaN;
  const rewardFormatted =
    rewardSatang > 0 ? formatSatang(rewardSatang, locale) : "—";
  const location = quest.location ?? messages.online;
  const showCapacity = quest.participation === "GROUP" || quest.headcount > 1;
  const isFull = quest.activeWorkerCount >= quest.headcount;
  const capacityLabel = showCapacity
    ? messages.capacityJoined(quest.activeWorkerCount, quest.headcount)
    : null;
  const accessibilityLabel = [
    quest.title,
    messages.givenPrice,
    rewardFormatted,
    capacityLabel,
    showCapacity && isFull ? messages.capacityFull : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className={styles.feedCard}
      onPress={handlePress}
      testID={`worker-feed-card-${quest.id}`}
    >
      <View className={styles.feedCardTop}>
        <View className={styles.feedCardIdentity}>
          {tagLabel ? (
            <View className={styles.tagChip}>
              <Text className={styles.tagText} numberOfLines={1}>
                {tagLabel}
              </Text>
            </View>
          ) : null}
          <Text className={styles.feedCardTitle} numberOfLines={2}>
            {quest.title}
          </Text>
          <View className={styles.feedCardOwner}>
            <UserRound size={14} color={themeColors.textSecondary} />
            <Text className={styles.feedCardOwnerText} numberOfLines={1}>
              {quest.hirerName}
            </Text>
          </View>
        </View>
        <View className={styles.feedReward}>
          <Text className={styles.feedRewardText}>{rewardFormatted}</Text>
          <Text className={styles.feedRewardUnit}>{messages.perPerson}</Text>
        </View>
      </View>
      <View className={styles.feedMetaRow}>
        <View className="flex-row items-center gap-ku-12">
          <View className={cn(styles.feedMetaItem, styles.feedDate)}>
            <CalendarDays size={15} color={themeColors.textSecondary} />
            <Text className={styles.feedMetaDateText} numberOfLines={1}>
              {`${formattedStartDate} · ${formattedStartTime}`}
            </Text>
          </View>
          <View className={cn(styles.feedMetaItem, styles.feedMetaGrow)}>
            <MapPin size={15} color={themeColors.textSecondary} />
            <Text className={styles.feedMetaText} numberOfLines={1}>
              {location}
            </Text>
          </View>
          {!showCapacity ? (
            <ChevronRight
              color={themeColors.textSecondary}
              size={18}
              strokeWidth={2.2}
            />
          ) : null}
        </View>
        {showCapacity ? (
          <View className={styles.feedCapacity}>
            <View className={styles.feedMetaItem}>
              <Users size={15} color={themeColors.textSecondary} />
              <Text className={styles.feedMetaText} numberOfLines={1}>
                {capacityLabel}
              </Text>
            </View>
            {isFull ? (
              <Text className={styles.feedFull} numberOfLines={1}>
                {messages.capacityFull}
              </Text>
            ) : null}
            <ChevronRight
              color={themeColors.textSecondary}
              size={18}
              strokeWidth={2.2}
            />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
