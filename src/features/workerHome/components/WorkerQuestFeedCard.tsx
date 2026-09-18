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
    router.push({
      pathname: "/quest/[id]",
      params: { id: quest.id },
    });
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
        <View style={styles.feedCardIdentity}>
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
            style={[styles.feedCardTitle, { color: themeColors.textStrong }]}
          >
            {quest.title}
          </Text>
          <View style={styles.feedCardOwner}>
            <UserRound size={13} color={themeColors.textSecondary} />
            <Text
              numberOfLines={1}
              style={[
                styles.feedCardOwnerText,
                { color: themeColors.textSecondary },
              ]}
            >
              {quest.hirerName}
            </Text>
          </View>
        </View>
        <View style={styles.feedRewardBlock}>
          <Text
            style={[styles.feedRewardText, { color: themeColors.primaryDeep }]}
          >
            {rewardFormatted}
          </Text>
          <Text
            style={[
              styles.feedRewardUnit,
              { color: themeColors.textSecondary },
            ]}
          >
            {messages.perPerson}
          </Text>
        </View>
      </View>

      <View style={styles.feedMetaGrid}>
        <View style={styles.feedMetaItem}>
          <CalendarDays size={15} color={themeColors.primaryDeep} />
          <Text
            numberOfLines={1}
            style={[styles.feedMetaText, { color: themeColors.textStrong }]}
          >
            {formatQuestDate(quest.startTime, locale)}
          </Text>
        </View>
        <View style={styles.feedMetaItem}>
          <Clock3 size={15} color={themeColors.primaryDeep} />
          <Text
            numberOfLines={1}
            style={[styles.feedMetaText, { color: themeColors.textStrong }]}
          >
            {formatQuestTime(quest.startTime, locale)}
          </Text>
        </View>
        <View style={styles.feedMetaItem}>
          <MapPin size={15} color={themeColors.primaryDeep} />
          <Text
            numberOfLines={1}
            style={[styles.feedMetaText, { color: themeColors.textStrong }]}
          >
            {location}
          </Text>
        </View>
        <View style={styles.feedMetaItem}>
          <Users size={15} color={themeColors.primaryDeep} />
          <Text
            numberOfLines={1}
            style={[styles.feedMetaText, { color: themeColors.textStrong }]}
          >
            {`${quest.activeWorkerCount}/${quest.headcount}`}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.feedCardFooter,
          { borderTopColor: themeColors.borderSubtle },
        ]}
      >
        <Text
          style={[
            styles.feedCardFooterText,
            { color: themeColors.primaryDeep },
          ]}
        >
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
