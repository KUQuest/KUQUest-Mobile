import React from "react";
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
import { formatDate } from "@/domain/datetime";
import { colors } from "@/theme/colors";
import {
  questBoardMessages,
  type QuestBoardMessages,
} from "@/locales/questBoardMessages";
import type { QuestBoardQuest } from "../../domain/types";
import styles from "../questBoardStyles";

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
  locale: "en" | "th",
  rewardSatang: number
): string {
  const messages = questBoardMessages[locale];
  return [
    quest.title,
    `${messages.reward}: ${formatSatang(rewardSatang, locale)} ${messages.perPerson}`,
    participationLabel(quest, messages),
    messages.participantsSummary(quest.acceptedParticipants, quest.headcount),
    `${messages.schedule}: ${quest.timeRange ? `${quest.timeRange} · ` : ""}${formatDate(quest.startDate, locale, "")}`,
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
  rewardSatang: number;
  onDetail: () => void;
  onOwnerPress: (event: { stopPropagation?: () => void }) => void;
}

export function QuestCard({
  quest,
  locale,
  rewardSatang,
  onDetail,
  onOwnerPress,
}: QuestCardProps) {
  const messages = questBoardMessages[locale];
  const tags = [...new Set(quest.tags)].slice(0, 1);
  const spotsRemaining = quest.headcount - quest.acceptedParticipants;
  const scheduleLabel = quest.timeRange
    ? `${quest.timeRange} · ${formatDate(quest.startDate, locale, "")}`
    : formatDate(quest.startDate, locale, "");

  const ownerDisplayName = quest.creator.name || quest.hirerName || "Hirer";
  const ownerInitials =
    ownerDisplayName
      .split(" ")
      .map((s: string) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <Pressable
      accessibilityLabel={questCardAccessibilityLabel(
        quest,
        locale,
        rewardSatang
      )}
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
          onPress={onOwnerPress}
          className={styles.ownerRow}
          testID={`quest-card-owner-${quest.id}`}
        >
          <View className={styles.ownerAvatar}>
            {quest.creator.avatarUri ? (
              <Image
                source={{ uri: quest.creator.avatarUri }}
                className="h-full w-full"
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
              {formatSatang(rewardSatang, locale)}
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
