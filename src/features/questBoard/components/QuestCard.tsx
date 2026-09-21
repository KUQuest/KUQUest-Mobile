import React from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import {
  BriefcaseBusiness,
  ChevronRight,
  CircleUserRound,
  ClipboardCheck,
  Clock3,
  MapPin,
} from "lucide-react-native";

import { Pressable, Image, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { formatSatang } from "@/domain/satang";
import { colors } from "@/theme/colors";
import {
  questBoardMessages,
  type QuestBoardMessages,
} from "@/locales/questBoardMessages";
import { liveQuestService } from "../liveQuestService";
import { getQuestRewardSatang } from "../questDetailFormat";
import type { QuestBoardQuest } from "../types";
import styles from "../questBoardStyles";

function formatDeadline(value: string, locale: "en" | "th"): string {
  if (locale === "th") {
    return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(new Date(`${value}T12:00:00`));
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}

function participationLabel(
  quest: QuestBoardQuest,
  messages: QuestBoardMessages
): string {
  const participation =
    quest.participationMode === "team" ? messages.team : messages.singlePerson;
  const mode =
    quest.candidateMode === "CANDIDATE"
      ? messages.applyForReview
      : messages.firstCome;
  return `${participation} · ${mode}`;
}

function questCardAccessibilityLabel(
  quest: QuestBoardQuest,
  locale: "en" | "th"
): string {
  const messages = questBoardMessages[locale];
  return [
    quest.title,
    `${messages.reward}: ${formatSatang(getQuestRewardSatang(quest), locale)} ${messages.perPerson}`,
    participationLabel(quest, messages),
    messages.participantsSummary(quest.acceptedParticipants, quest.headcount),
    `${messages.schedule}: ${quest.timeRange ? `${quest.timeRange} · ` : ""}${formatDeadline(quest.startDate, locale)}`,
    `${messages.location}: ${quest.location}`,
    messages.viewDetails,
  ]
    .filter(Boolean)
    .join(". ");
}

function InfoIcon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <View className={cn(styles.infoIcon, className)}>{children}</View>;
}

export interface QuestCardProps {
  quest: QuestBoardQuest;
  locale: "en" | "th";
  onDetail: () => void;
}

export function QuestCard({ quest, locale, onDetail }: QuestCardProps) {
  const router = useRouter();
  const messages = questBoardMessages[locale];
  const tags = [...new Set(quest.tags)].slice(0, 1);
  const spotsRemaining = quest.headcount - quest.acceptedParticipants;
  const scheduleLabel = quest.timeRange
    ? `${quest.timeRange} · ${formatDeadline(quest.startDate, locale)}`
    : formatDeadline(quest.startDate, locale);

  const ownerDisplayName = quest.creator.name || quest.hirerName || "Hirer";
  const ownerInitials =
    ownerDisplayName
      .split(" ")
      .map((s: string) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  const handleOwnerPress = async (e: { stopPropagation?: () => void }) => {
    e?.stopPropagation?.();
    if (quest.ownerStudentId) {
      router.push(`/profile/${quest.ownerStudentId}`);
      return;
    }
    try {
      const hirer = await liveQuestService.getHirerParticipant(quest.id);
      if (hirer?.id) {
        router.push(`/profile/${hirer.id}`);
      } else {
        Alert.alert("Profile", "Profile unavailable for this quest.");
      }
    } catch {
      Alert.alert("Profile", "Profile unavailable for this quest.");
    }
  };

  return (
    <Pressable
      accessibilityLabel={questCardAccessibilityLabel(quest, locale)}
      accessibilityRole="button"
      onPress={onDetail}
      className={styles.card}
      testID={`quest-detail-${quest.id}`}
    >
      <View
        accessible={false}
        className={styles.cardBody}
        testID={`quest-card-${quest.id}`}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Profile of ${ownerDisplayName}`}
          onPress={handleOwnerPress}
          className={styles.ownerRow}
          testID={`quest-card-owner-${quest.id}`}
        >
          <View className={styles.ownerAvatar}>
            {quest.creator.avatarUri ? (
              <Image
                source={{ uri: quest.creator.avatarUri }}
                className="w-full h-full"
                contentFit="cover"
              />
            ) : (
              <Text className={styles.ownerAvatarText}>{ownerInitials}</Text>
            )}
          </View>
          <Text className={styles.ownerName} numberOfLines={1}>
            {ownerDisplayName}
          </Text>
        </Pressable>
        <View className={styles.cardTopRow}>
          <View className={styles.cardTitleColumn}>
            <Text
              className={styles.cardTitle}
              testID={`quest-card-title-${quest.id}`}
            >
              {quest.title}
            </Text>
            {tags.map((tag) => (
              <View
                key={tag}
                className={styles.cardCategory}
                testID={`quest-card-tags-${quest.id}`}
              >
                <BriefcaseBusiness
                  color={colors.primary}
                  size={16}
                  strokeWidth={2.1}
                />
                <Text className={styles.cardCategoryText}>{tag}</Text>
              </View>
            ))}
          </View>
          <View className={styles.rewardBlock}>
            <Text className={styles.rewardAmount}>
              {formatSatang(getQuestRewardSatang(quest), locale)}
            </Text>
            <Text className={styles.rewardUnit}>{messages.perPerson}</Text>
          </View>
        </View>
        {quest.description ? (
          <Text
            className={styles.cardDescription}
            numberOfLines={2}
            testID={`quest-card-description-${quest.id}`}
          >
            {quest.description}
          </Text>
        ) : null}
        <View className={styles.cardDivider} />
        <View className={styles.infoList}>
          <View
            className={styles.infoRow}
            testID={`quest-card-participation-${quest.id}`}
          >
            <InfoIcon className={styles.infoIconMuted}>
              <CircleUserRound
                color={colors.textSubtle}
                size={20}
                strokeWidth={1.9}
              />
            </InfoIcon>
            <Text
              className={cn(
                styles.infoText,
                styles.infoTextPrimary,
                styles.infoTextFlexible
              )}
              numberOfLines={2}
            >
              {participationLabel(quest, messages)}
            </Text>
          </View>
          <View
            className={styles.infoRow}
            testID={`quest-card-participants-${quest.id}`}
          >
            <InfoIcon className={styles.infoIconMuted}>
              <ClipboardCheck
                color={colors.textSubtle}
                size={20}
                strokeWidth={1.9}
              />
            </InfoIcon>
            <Text className={styles.infoText}>{messages.participants}</Text>
            <View className={styles.participantCount}>
              <Text
                className={styles.participantCountText}
              >{`${quest.acceptedParticipants}/${quest.headcount}`}</Text>
            </View>
            <Text className={styles.spotsLeftText} numberOfLines={1}>
              {messages.spotsSummary(spotsRemaining, quest.headcount)}
            </Text>
          </View>
          <View
            className={styles.infoRow}
            testID={`quest-card-schedule-${quest.id}`}
          >
            <InfoIcon className={styles.infoIconMuted}>
              <Clock3 color={colors.textSubtle} size={20} strokeWidth={1.9} />
            </InfoIcon>
            <Text
              className={cn(styles.infoText, styles.infoTextFlexible)}
              numberOfLines={1}
            >
              {scheduleLabel}
            </Text>
          </View>
          <View
            className={styles.infoRow}
            testID={`quest-card-location-${quest.id}`}
          >
            <InfoIcon className={styles.infoIconMuted}>
              <MapPin color={colors.textSubtle} size={20} strokeWidth={1.9} />
            </InfoIcon>
            <View className={styles.locationContent}>
              <Text className={styles.locationText} numberOfLines={2}>
                {quest.location}
              </Text>
            </View>
          </View>
        </View>
        <View className={styles.cardFooter}>
          <ChevronRight
            color={colors.primaryDeep}
            size={20}
            strokeWidth={2.2}
          />
        </View>
        <Text
          className={styles.cardAccessibilityMeta}
          testID={`quest-card-spots-${quest.id}`}
        >
          {messages.spotsSummary(spotsRemaining, quest.headcount)}
        </Text>
      </View>
    </Pressable>
  );
}
