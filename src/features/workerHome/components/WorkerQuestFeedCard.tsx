import React from "react";
import { useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  UserRound,
  Users,
} from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import type { QuestV2BoardCard } from "@/api/questV2Contracts";
import { SATANG_PER_BAHT, formatSatang } from "@/domain/satang";
import { useLocale } from "@/features/preferences/localeStore";
import { getThemeColors } from "@/theme/colors";
import { workerHomeMessages } from "../workerHomeMessages";
import { workerHomeStyles as styles } from "../workerHomeStyles";

interface WorkerQuestFeedCardProps {
  quest: QuestV2BoardCard;
  onPress?: () => void;
}

function formatQuestDate(value: string, locale: "en" | "th"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(
    locale === "th" ? "th-TH-u-ca-buddhist" : "en-GB",
    { day: "numeric", month: "short", timeZone: "Asia/Bangkok" }
  ).format(date);
}

function formatQuestTime(value: string, locale: "en" | "th"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(date);
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
    router.push({ pathname: "/quest/[id]", params: { id: quest.id } });
  };

  // Quest V2 board rewards are Baht; formatSatang requires integer Satang.
  const rewardSatang = Math.round(quest.questReward * SATANG_PER_BAHT);
  const rewardFormatted =
    rewardSatang > 0 ? formatSatang(rewardSatang, locale) : "—";
  const location = quest.location ?? messages.online;

  return (
    <Pressable
      accessibilityLabel={`${quest.title}, ${messages.reward} ${rewardFormatted}`}
      accessibilityRole="button"
      className="rounded-[18px] border border-ku-border-subtle bg-ku-surface p-ku-md"
      onPress={handlePress}
      testID={`worker-feed-card-${quest.id}`}
    >
      <View className={styles.feedCardTop}>
        <View className={styles.feedCardIdentity}>
          {quest.tag?.name ? (
            <View className={`${styles.tagChip} bg-ku-surface-muted`}>
              <Text className={`${styles.tagText} text-ku-primary-dark`}>
                {quest.tag.name}
              </Text>
            </View>
          ) : null}
          <Text
            className={`${styles.feedCardTitle} text-ku-text-strong`}
            numberOfLines={2}
          >
            {quest.title}
          </Text>
          <View className={styles.feedCardOwner}>
            <UserRound size={13} color={themeColors.textSecondary} />
            <Text
              className={`${styles.feedCardOwnerText} text-ku-text-secondary`}
              numberOfLines={1}
            >
              {quest.hirerName}
            </Text>
          </View>
        </View>
        <View className={styles.feedRewardBlock}>
          <Text className={`${styles.feedRewardText} text-ku-primary-dark`}>
            {rewardFormatted}
          </Text>
          <Text className={`${styles.feedRewardUnit} text-ku-text-secondary`}>
            {messages.perPerson}
          </Text>
        </View>
      </View>
      <View className={styles.feedMetaGrid}>
        <View className={styles.feedMetaItem}>
          <CalendarDays size={15} color={themeColors.primaryDeep} />
          <Text
            className={`${styles.feedMetaText} text-ku-text-strong`}
            numberOfLines={1}
          >
            {formatQuestDate(quest.startTime, locale)}
          </Text>
        </View>
        <View className={styles.feedMetaItem}>
          <Clock3 size={15} color={themeColors.primaryDeep} />
          <Text
            className={`${styles.feedMetaText} text-ku-text-strong`}
            numberOfLines={1}
          >
            {formatQuestTime(quest.startTime, locale)}
          </Text>
        </View>
        <View className={styles.feedMetaItem}>
          <MapPin size={15} color={themeColors.primaryDeep} />
          <Text
            className={`${styles.feedMetaText} text-ku-text-strong`}
            numberOfLines={1}
          >
            {location}
          </Text>
        </View>
        <View className={styles.feedMetaItem}>
          <Users size={15} color={themeColors.primaryDeep} />
          <Text
            className={`${styles.feedMetaText} text-ku-text-strong`}
            numberOfLines={1}
          >
            {`${quest.activeWorkerCount}/${quest.headcount}`}
          </Text>
        </View>
      </View>
      <View className={`${styles.feedCardFooter} border-ku-border-subtle`}>
        <Text className={`${styles.feedCardFooterText} text-ku-primary-dark`}>
          {messages.viewDetails}
        </Text>
        <ChevronRight
          color={themeColors.primaryDeep}
          size={18}
          strokeWidth={2.2}
        />
      </View>
    </Pressable>
  );
}
