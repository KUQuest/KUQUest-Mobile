import { useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CircleAlert,
  CircleUserRound,
  ClipboardCheck,
  Clock3,
  ImageOff,
  MapPin,
  Plus,
  Star,
  UsersRound,
  type LucideIcon,
} from "lucide-react-native";
import { RefreshControl } from "react-native";

import { Image, Pressable, ScrollView, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { colors } from "@/theme/colors";
import { formatSatang } from "@/domain/satang";
import type { GroupQuestMessages } from "@/locales/groupQuestMessages";
import type { QuestBoardMessages } from "@/locales/questBoardMessages";
import { getQuestRewardSatang } from "../questWorkflow";
import { formatDeadline } from "../questDetailFormat";
import type { LiveQuestSnapshot } from "../liveQuestService";
import type { QuestBoardQuest, QuestDetailState } from "../types";
import styles from "../questDetailStyles";
import {
  QuestParticipantRoster,
  type QuestParticipant,
} from "./QuestParticipantRoster";
import {
  GroupQuestEntrySurfaces,
  LiveEntrySurface,
} from "./QuestDetailEntrySurfaces";

function locationLabel(
  quest: QuestBoardQuest,
  messages: QuestBoardMessages
): string {
  return quest.locationMode === "online" ? messages.online : messages.onCampus;
}

function proofLabel(
  quest: QuestBoardQuest,
  messages: QuestBoardMessages
): string {
  if (quest.proofRequired === "required") return messages.required;
  if (quest.proofRequired === "optional") return messages.optional;
  return messages.notNeeded;
}

function proofDescription(
  quest: QuestBoardQuest,
  messages: QuestBoardMessages
): string {
  if (quest.proofRequired === "required")
    return messages.proofRequiredDescription;
  if (quest.proofRequired === "optional")
    return messages.proofOptionalDescription;
  return messages.proofNotNeededDescription;
}

function candidateDescription(
  quest: QuestBoardQuest,
  messages: QuestBoardMessages
): string {
  return quest.candidateMode === "NO_CANDIDATE"
    ? messages.firstComeDescription
    : messages.reviewCandidatesDescription;
}

function DetailRow({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <View className={styles.requirementRow}>
      <View className={styles.requirementIcon}>
        <Icon color={colors.primary} size={20} strokeWidth={2} />
      </View>
      <View className={styles.requirementCopy}>
        <Text className={styles.requirementLabel}>{label}</Text>
        <Text className={styles.requirementValue}>{value}</Text>
        {description ? (
          <Text className={styles.requirementDescription}>{description}</Text>
        ) : null}
      </View>
    </View>
  );
}

function QuestImage({
  uri,
  index,
  messages,
  featured = false,
}: {
  uri: string;
  index: number;
  messages: QuestBoardMessages;
  featured?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const label = messages.questImageLabel(index);
  const imageClassName = cn(
    styles.questImage,
    featured ? styles.questImageFeatured : styles.questImageThumbnail
  );

  if (failed) {
    return (
      <View
        accessibilityLabel={`${label}. ${messages.imageUnavailable}`}
        className={cn(
          styles.questImageFallback,
          featured
            ? styles.questImageFallbackFeatured
            : styles.questImageFallbackThumbnail
        )}
      >
        <ImageOff color={colors.textMuted} size={24} strokeWidth={1.8} />
        <Text className={styles.questImageFallbackText}>
          {messages.imageUnavailable}
        </Text>
      </View>
    );
  }

  return (
    <Image
      accessibilityLabel={label}
      cachePolicy="memory-disk"
      contentFit="cover"
      onError={() => setFailed(true)}
      source={{ uri }}
      className={imageClassName}
    />
  );
}

function ScheduleTimeline({
  locale,
  messages,
  quest,
}: {
  locale: "en" | "th";
  messages: QuestBoardMessages;
  quest: QuestBoardQuest;
}) {
  return (
    <View
      accessibilityLabel={messages.schedule}
      className={styles.scheduleCard}
      testID="quest-schedule-timeline"
    >
      <View className={styles.scheduleHeader}>
        <View className={styles.scheduleHeaderIcon}>
          <CalendarDays color={colors.primary} size={19} strokeWidth={2} />
        </View>
        <View className={styles.scheduleHeaderCopy}>
          <Text className={styles.scheduleTitle}>{messages.schedule}</Text>
          <Text className={styles.scheduleDescription}>
            {messages.scheduleDescription}
          </Text>
        </View>
      </View>
      <View className={styles.scheduleTimeline}>
        <View className={styles.timelineRail}>
          <View className={styles.timelineDotActive} />
          <View className={styles.timelineLine} />
          <View className={styles.timelineDot} />
        </View>
        <View className={styles.timelineEvents}>
          <View className={styles.timelineEvent}>
            <Text className={styles.timelineLabel}>{messages.startWork}</Text>
            <Text className={styles.timelineDate}>
              {formatDeadline(quest.startDate, locale)}
            </Text>
            <View className={styles.timelineTimeRow}>
              <Clock3 color={colors.primary} size={15} strokeWidth={2} />
              <Text className={styles.timelineTimeLabel}>
                {messages.workWindow}
              </Text>
              <Text className={styles.timelineTime}>
                {quest.timeRange ?? messages.timeNotSpecified}
              </Text>
            </View>
          </View>
          <View className={styles.timelineEvent}>
            <Text className={styles.timelineLabel}>{messages.finishBy}</Text>
            <Text className={styles.timelineDate}>
              {formatDeadline(quest.deadline, locale)}
            </Text>
            <Text className={styles.timelineDescription}>
              {messages.finishByDescription}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
export interface QuestDetailBodyProps {
  quest: QuestBoardQuest;
  locale: "en" | "th";
  messages: QuestBoardMessages;
  imageUris: string[];
  canonicalStatus?: string;
  refreshing: boolean;
  onRefresh: () => void;
  canParticipate: boolean;
  participationFirstCome: boolean;
  onOpenParticipation: () => void;
  participationBusy: boolean;
  participants?: readonly QuestParticipant[];
  participantCount?: number;
  onOpenParticipantProfile?: (participantId: string) => void;
  status?: {
    title: string;
    description: string;
    unavailable: boolean;
    postView: boolean;
    leftQuest: boolean;
    history: boolean;
    Icon: LucideIcon;
    iconColor: string;
  };
  onOpenWorkHub: () => void;
  prototypeEntry?: {
    state: QuestDetailState;
    viewerId: string;
    isHirer: boolean;
    messages: GroupQuestMessages;
    onOpenTeam: () => void;
    onOpenCandidateReview: () => void;
    onOpenPartialConsent: () => void;
  };
  liveEntry?: {
    snapshot: LiveQuestSnapshot;
    groupMessages: GroupQuestMessages;
    busy?: boolean;
    onOpenTeam: () => void;
    onOpenCandidateReview: () => void;
    onOpenPartialConsent: () => void;
  };
  canReportQuest: boolean;
  onReportQuest: () => void;
  reviewAction?: {
    canReview: boolean;
    hasReviewed: boolean;
    rating?: number;
    isExpired: boolean;
    onOpenReview: () => void;
  };
}

export function QuestDetailBody({
  quest,
  locale,
  messages,
  imageUris,
  canonicalStatus,
  refreshing,
  onRefresh,
  canParticipate,
  participationFirstCome,
  onOpenParticipation,
  participationBusy,
  participants = [],
  participantCount = participants.length,
  onOpenParticipantProfile,
  status,
  onOpenWorkHub,
  prototypeEntry,
  liveEntry,
  canReportQuest,
  onReportQuest,
  reviewAction,
}: QuestDetailBodyProps) {
  const StatusIcon = status?.Icon;
  return (
    <ScrollView
      contentContainerClassName={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className={styles.header}>
        <Text accessibilityRole="header" className={styles.title}>
          {quest.title}
        </Text>
        {canonicalStatus ? (
          <Text
            accessibilityLabel={messages.statusLabel(canonicalStatus)}
            className={styles.canonicalStatus}
            testID="quest-canonical-status"
          >
            {messages.statusLabel(canonicalStatus)}
          </Text>
        ) : null}
        <View className={styles.creatorRow}>
          <View className={styles.creatorAvatar}>
            <CircleUserRound color={colors.primary} size={17} strokeWidth={2} />
          </View>
          <View className={styles.creatorCopy}>
            <Text className={styles.creatorLabel}>{messages.creator}</Text>
            <Text
              className={styles.creatorValue}
              numberOfLines={1}
            >{`${quest.creator.name}${quest.creator.faculty ? ` · ${quest.creator.faculty}` : ""}`}</Text>
          </View>
        </View>
        <View accessibilityLabel={messages.tags} className={styles.tagRow}>
          {quest.tags.map((tag) => (
            <Text key={tag} className={styles.tag}>
              {tag}
            </Text>
          ))}
        </View>
      </View>
      {imageUris.length > 0 ? (
        <View
          accessibilityLabel={messages.imageCount(imageUris.length)}
          className={styles.imageGallery}
        >
          <QuestImage
            featured
            index={1}
            messages={messages}
            uri={imageUris[0]}
          />
          {imageUris.length > 1 ? (
            <View className={styles.imageThumbnailRow}>
              {imageUris.slice(1).map((uri, index) => (
                <QuestImage
                  key={`${uri}-${index + 1}`}
                  index={index + 2}
                  messages={messages}
                  uri={uri}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
      <View className={styles.heroCard}>
        <View className={styles.heroPrimary}>
          <View>
            <Text className={styles.heroLabel}>{messages.reward}</Text>
            <Text
              className={styles.heroRewardValue}
            >{`${formatSatang(getQuestRewardSatang(quest), locale)} ${messages.perPerson}`}</Text>
          </View>
          <View className={styles.heroSpots}>
            <Text className={styles.heroSpotsLabel}>{messages.spots}</Text>
            <Text
              className={styles.heroSpotsValue}
            >{`${quest.acceptedParticipants}/${quest.headcount}`}</Text>
          </View>
        </View>
        <View className={styles.heroDetails}>
          <View className={styles.heroItem}>
            <View className={styles.heroItemIcon}>
              <UsersRound color={colors.primary} size={17} strokeWidth={2} />
            </View>
            <View className={styles.heroItemCopy}>
              <Text className={styles.heroLabel}>{messages.participation}</Text>
              <Text className={styles.heroValue}>
                {quest.participationMode === "team"
                  ? messages.team
                  : messages.singlePerson}
              </Text>
            </View>
          </View>
          <View className={cn(styles.heroItem, styles.heroItemDivider)}>
            <View className={styles.heroItemIcon}>
              <CircleUserRound
                color={colors.primary}
                size={17}
                strokeWidth={2}
              />
            </View>
            <View className={styles.heroItemCopy}>
              <Text className={styles.heroLabel}>{messages.candidateMode}</Text>
              <Text className={styles.heroValue}>
                {quest.candidateMode === "NO_CANDIDATE"
                  ? messages.firstCome
                  : messages.reviewCandidates}
              </Text>
            </View>
          </View>
        </View>
        <View className={styles.heroLocation}>
          <MapPin color={colors.primary} size={20} strokeWidth={2} />
          <View className={styles.heroLocationCopy}>
            <Text className={styles.heroLabel}>{messages.location}</Text>
            <Text className={styles.heroLocationValue}>{quest.location}</Text>
            <Text className={styles.heroDetail}>
              {locationLabel(quest, messages)}
            </Text>
          </View>
        </View>
      </View>
      {quest.participationMode === "team" && onOpenParticipantProfile ? (
        <QuestParticipantRoster
          countLabel={messages.participantsSummary(
            participantCount,
            quest.headcount
          )}
          onOpenProfile={onOpenParticipantProfile}
          participants={participants}
          profileLabel={messages.participantProfile}
          title={messages.participants}
        />
      ) : null}
      {canParticipate ? (
        <View
          className={styles.participationCard}
          testID="quest-participation-action"
        >
          <View className={styles.participationCopy}>
            <Text className={styles.participationTitle}>
              {participationFirstCome
                ? messages.confirmParticipationTitle
                : messages.confirmApplicationTitle}
            </Text>
            <Text className={styles.participationDescription}>
              {participationFirstCome
                ? messages.confirmParticipationDescription
                : messages.confirmApplicationDescription}
            </Text>
          </View>
          <Pressable
            accessibilityLabel={
              participationFirstCome ? messages.joinNow : messages.applyNow
            }
            accessibilityRole="button"
            disabled={participationBusy}
            onPress={onOpenParticipation}
            className={cn(
              styles.participationAction,
              participationBusy && styles.participationActionDisabled
            )}
            testID="quest-apply-button"
          >
            <Plus color={colors.primary} size={18} strokeWidth={2.4} />
            <Text className={styles.participationActionText}>
              {participationFirstCome ? messages.joinNow : messages.applyNow}
            </Text>
          </Pressable>
        </View>
      ) : null}
      <ScheduleTimeline locale={locale} messages={messages} quest={quest} />
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>{messages.description}</Text>
        <View className={styles.descriptionCard}>
          <Text className={styles.body}>{quest.description}</Text>
        </View>
      </View>
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>{messages.requirements}</Text>
        <View className={styles.requirementCard}>
          <DetailRow
            icon={ClipboardCheck}
            label={messages.completionCriteria}
            value={quest.completionCriteria}
          />
          <DetailRow
            icon={Check}
            label={messages.proofRequired}
            value={proofLabel(quest, messages)}
            description={proofDescription(quest, messages)}
          />
          <DetailRow
            icon={UsersRound}
            label={messages.candidateMode}
            value={
              quest.candidateMode === "NO_CANDIDATE"
                ? messages.firstCome
                : messages.reviewCandidates
            }
            description={candidateDescription(quest, messages)}
          />
          <DetailRow
            icon={BriefcaseBusiness}
            label={messages.participation}
            value={
              quest.participationMode === "team"
                ? messages.team
                : messages.singlePerson
            }
          />
        </View>
      </View>
      {status?.title ? (
        <View
          accessibilityRole="alert"
          className={cn(
            styles.statusCard,
            status.unavailable && styles.statusCardBlocked,
            status.postView && styles.statusCardOwner,
            (status.leftQuest || status.history) && styles.statusCardMuted
          )}
        >
          {StatusIcon ? (
            <StatusIcon color={status.iconColor} size={25} strokeWidth={2.2} />
          ) : null}
          <Text className={styles.statusTitle}>{status.title}</Text>
          <Text className={styles.statusDescription}>{status.description}</Text>
          {!status.unavailable && !status.postView && !status.leftQuest ? (
            <Pressable
              accessibilityRole="button"
              onPress={onOpenWorkHub}
              className={styles.statusAction}
              testID="view-my-quests"
            >
              <Text className={styles.statusActionText}>
                {messages.viewMyQuests}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {reviewAction && reviewAction.canReview ? (
        <View
          className="bg-ku-surface-subtle border border-ku-border-subtle rounded-2xl p-4 mt-6"
          testID="quest-review-card"
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <View className="h-8 w-8 rounded-full bg-ku-surface-accent items-center justify-center">
                <Star
                  color="#EAA023"
                  fill="#EAA023"
                  size={18}
                  strokeWidth={2}
                />
              </View>
              <Text className="text-ku-text font-ku-bold text-base">
                {reviewAction.hasReviewed
                  ? messages.editReview
                  : messages.rateAndReview}
              </Text>
            </View>
            {reviewAction.hasReviewed && reviewAction.rating ? (
              <View className="flex-row items-center gap-1 bg-ku-surface-accent px-2.5 py-1 rounded-full">
                <Star color="#EAA023" fill="#EAA023" size={14} />
                <Text className="text-ku-primary-dark font-ku-bold text-xs">
                  {reviewAction.rating} / 5
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="text-ku-text-secondary font-ku-regular text-xs mb-3.5">
            {reviewAction.isExpired
              ? messages.reviewWindowExpired
              : reviewAction.hasReviewed
                ? messages.reviewUpdated
                : messages.reviewRatingPrompt}
          </Text>
          <Pressable
            accessibilityLabel={
              reviewAction.hasReviewed
                ? messages.editReview
                : messages.rateAndReview
            }
            accessibilityRole="button"
            className={cn(
              "h-11 flex-row items-center justify-center rounded-ku-pill bg-ku-primary px-4",
              reviewAction.isExpired &&
                "bg-ku-surface-subtle border border-ku-border-subtle"
            )}
            onPress={reviewAction.onOpenReview}
            testID="quest-rate-review-button"
          >
            <Star
              color={
                reviewAction.isExpired ? colors.textSecondary : colors.white
              }
              size={16}
              strokeWidth={2}
            />
            <Text
              className={cn(
                "font-ku-semibold text-sm ml-2",
                reviewAction.isExpired
                  ? "text-ku-text-secondary"
                  : "text-ku-white"
              )}
            >
              {reviewAction.isExpired
                ? messages.reviewQuest
                : reviewAction.hasReviewed
                  ? messages.editReview
                  : messages.rateAndReview}
            </Text>
          </Pressable>
        </View>
      ) : null}
      {prototypeEntry ? (
        <GroupQuestEntrySurfaces
          state={prototypeEntry.state}
          viewerId={prototypeEntry.viewerId}
          isHirer={prototypeEntry.isHirer}
          messages={prototypeEntry.messages}
          onOpenTeam={prototypeEntry.onOpenTeam}
          onOpenCandidateReview={prototypeEntry.onOpenCandidateReview}
          onOpenPartialConsent={prototypeEntry.onOpenPartialConsent}
        />
      ) : null}
      {liveEntry ? (
        <LiveEntrySurface
          snapshot={liveEntry.snapshot}
          messages={messages}
          groupMessages={liveEntry.groupMessages}
          busy={liveEntry.busy}
          onOpenTeam={liveEntry.onOpenTeam}
          onOpenCandidateReview={liveEntry.onOpenCandidateReview}
          onOpenPartialConsent={liveEntry.onOpenPartialConsent}
        />
      ) : null}
      {canReportQuest ? (
        <View className={styles.reportCard} testID="quest-report-card">
          <View className={styles.reportHeader}>
            <View className={styles.reportIcon}>
              <CircleAlert color={colors.danger} size={21} strokeWidth={2.2} />
            </View>
            <View className={styles.reportCopy}>
              <Text className={styles.reportTitle}>{messages.reportQuest}</Text>
              <Text className={styles.reportDescription}>
                {messages.reportQuestDescription}
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityLabel={messages.reportQuest}
            accessibilityRole="button"
            className={styles.reportAction}
            onPress={onReportQuest}
            style={{ backgroundColor: colors.danger }}
            testID="quest-report-button"
          >
            <Text className={styles.reportActionText}>
              {messages.reportQuest}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}
