import {
  formatDate,
  formatTimestampDate,
  formatTimeInBangkok,
} from "@/domain/datetime";
import {
  useServerCountdown,
  formatCountdown,
} from "../../shared/useServerCountdown";
import { useState, type ReactNode } from "react";
import {
  CalendarCheck,
  CalendarClock,
  CircleUserRound,
  ClipboardCheck,
  FileCheck,
  ImageOff,
  MapPin,
  Plus,
  UserRoundCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react-native";
import { RefreshControl } from "react-native";

import { ImageViewerModal } from "@/components/ui/ImageViewerModal";
import { Image, Pressable, ScrollView, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { formatSatang } from "@/domain/satang";
import {
  groupQuestMessages,
  underfilledCancellationDescription,
  type GroupQuestMessages,
} from "@/locales/groupQuestMessages";
import type { QuestBoardMessages } from "@/locales/questBoardMessages";
import { getQuestRewardSatang } from "../../presentation/questBoardViewData";
import type { LiveQuestSnapshot } from "../../live/liveQuestService";
import {
  QuestCandidateMode,
  QuestStatus,
  QuestUnderfilledConsentDecision,
  QuestUnderfilledState,
  type QuestBoardQuest,
  type QuestDetailState,
} from "../../domain/types";
import { localizeFacultyName } from "@/locales/academicUnits";
import styles from "../../styles/questDetailStyles";
import {
  QuestParticipantRoster,
  type QuestParticipant,
} from "./QuestParticipantRoster";
import {
  GroupQuestEntrySurfaces,
  LiveEntrySurface,
} from "./QuestDetailEntrySurfaces";

function proofLabel(
  quest: QuestBoardQuest,
  messages: QuestBoardMessages
): string {
  if (quest.proofRequired === "required") return messages.required;
  if (quest.proofRequired === "optional") return messages.optional;
  return messages.notNeeded;
}

function InfoRow({
  icon: Icon,
  label,
  value,
  description,
  divided = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  description?: string;
  divided?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <View className={cn(styles.infoRow, divided && styles.infoRowDivided)}>
      <View className={styles.infoIcon}>
        <Icon color={colors.primary} size={20} strokeWidth={2} />
      </View>
      <View className={styles.infoCopy}>
        <Text className={styles.infoLabel}>{label}</Text>
        <Text className={styles.infoValue}>{value}</Text>
        {description ? (
          <Text className={styles.infoDescription}>{description}</Text>
        ) : null}
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className={styles.section}>
      <Text accessibilityRole="header" className={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function QuestImage({
  uri,
  index,
  messages,
  onPress,
  featured = false,
}: {
  uri: string;
  index: number;
  messages: QuestBoardMessages;
  onPress: () => void;
  featured?: boolean;
}) {
  const { colors } = useAppTheme();
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
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      className={imageClassName}
    >
      <Image
        accessibilityLabel={label}
        cachePolicy="memory-disk"
        contentFit="cover"
        onError={() => setFailed(true)}
        source={{ uri }}
        className="h-full w-full"
      />
    </Pressable>
  );
}

function ScheduleLocation({
  locale,
  messages,
  quest,
}: {
  locale: "en" | "th";
  messages: QuestBoardMessages;
  quest: QuestBoardQuest;
}) {
  const [startTime, endTime] = quest.timeRange?.split("–") ?? [];
  const online = quest.locationMode === "online";
  return (
    <View className={styles.infoCard} testID="quest-schedule-location">
      <InfoRow
        icon={CalendarClock}
        label={messages.startWork}
        value={`${formatDate(quest.startDate, locale, "")} · ${startTime ?? messages.timeNotSpecified}`}
      />
      <InfoRow
        divided
        icon={CalendarCheck}
        label={messages.finishBy}
        value={`${formatDate(quest.deadline, locale, "")} · ${endTime ?? messages.timeNotSpecified}`}
      />
      <InfoRow
        divided
        icon={MapPin}
        label={messages.location}
        value={online ? messages.online : quest.location}
        description={online ? undefined : messages.onCampus}
      />
    </View>
  );
}
function GroupFcfsJourneyCard({
  groupFcfs,
  quest,
  locale,
  messages,
  onOpenPartialConsent,
  onOpenWorkHub,
}: {
  groupFcfs: NonNullable<QuestDetailBodyProps["groupFcfs"]>;
  quest: QuestBoardQuest;
  locale: "en" | "th";
  messages: QuestBoardMessages;
  onOpenPartialConsent: () => void;
  onOpenWorkHub: () => void;
}) {
  const underfilled = groupFcfs.underfilled;
  const deadline =
    underfilled?.state === QuestUnderfilledState.UNDERFILLED_DECISION_PENDING
      ? underfilled.decision.expiresAt
      : underfilled?.state === QuestUnderfilledState.UNDERFILLED_CONSENT_PENDING
        ? underfilled.consent.expiresAt
        : null;
  const countdown = useServerCountdown(deadline);
  const startRemaining = useServerCountdown(groupFcfs.startTime);
  const full =
    groupFcfs.activeWorkerCount >= groupFcfs.headcount ||
    groupFcfs.state === QuestStatus.QUEST_ASSIGNED;
  const joined = groupFcfs.isJoined;
  const preStart =
    groupFcfs.state === QuestStatus.QUEST_OPEN &&
    !underfilled &&
    (startRemaining ?? 0) > 0;
  const cancellationReason = underfilledCancellationDescription(
    groupQuestMessages[locale],
    underfilled?.cancellationReason,
    underfilled?.ownResponse?.decision ===
      QuestUnderfilledConsentDecision.DECLINE,
    false
  );
  const cancellationDate = underfilled?.cancelledAt
    ? formatTimestampDate(underfilled.cancelledAt, locale)
    : undefined;
  const cancellationTime = underfilled?.cancelledAt
    ? formatTimeInBangkok(underfilled.cancelledAt)
    : "";
  const title =
    underfilled?.state === QuestUnderfilledState.UNDERFILLED_DECISION_PENDING
      ? messages.groupFcfsUnderfillDecisionPending
      : underfilled?.state === QuestUnderfilledState.UNDERFILLED_CONSENT_PENDING
        ? messages.groupFcfsConsentRequired
        : underfilled?.state === QuestUnderfilledState.UNDERFILLED_COMPLETED
          ? messages.groupFcfsConsentComplete
          : underfilled?.state === QuestUnderfilledState.UNDERFILLED_CANCELLED
            ? cancellationReason
            : joined
              ? full
                ? messages.groupFcfsAllFilledJoined
                : messages.groupFcfsYouAreIn
              : full
                ? messages.groupFcfsFullForOthers
                : messages.groupFcfsJoinedProgress(
                    groupFcfs.activeWorkerCount,
                    groupFcfs.headcount
                  );
  const description = underfilled
    ? ""
    : full
      ? messages.groupFcfsAllSpotsFilled
      : preStart
        ? ""
        : groupFcfs.state === QuestStatus.QUEST_OPEN &&
            groupFcfs.activeWorkerCount < groupFcfs.headcount
          ? `${messages.groupFcfsJoinedProgress(groupFcfs.activeWorkerCount, groupFcfs.headcount)} · ${messages.groupFcfsWorkersNeeded(groupFcfs.headcount - groupFcfs.activeWorkerCount)}`
          : "";
  return (
    <View className={styles.statusCard} testID="group-fcfs-journey">
      <Text accessibilityLiveRegion="polite" className={styles.statusTitle}>
        {title}
      </Text>
      {underfilled?.state === QuestUnderfilledState.UNDERFILLED_CANCELLED &&
      cancellationDate &&
      cancellationTime ? (
        <Text className={styles.statusDescription}>
          {groupQuestMessages[locale].cancelledAt(
            cancellationDate,
            cancellationTime
          )}
        </Text>
      ) : null}
      {description ? (
        <Text
          accessibilityLiveRegion="polite"
          className={styles.statusDescription}
        >
          {description}
        </Text>
      ) : null}
      <Text className={styles.prototypeMeta}>
        {`${messages.startTime}: ${formatDate(quest.startDate, locale, "")}${groupFcfs.startTime ? ` · ${groupFcfs.startTime.split("T")[1]?.slice(0, 5) ?? ""}` : ""}`}
      </Text>
      {underfilled?.state ===
        QuestUnderfilledState.UNDERFILLED_DECISION_PENDING ||
      underfilled?.state ===
        QuestUnderfilledState.UNDERFILLED_CONSENT_PENDING ? (
        <Text
          accessibilityLiveRegion={
            countdown === 0 ||
            (countdown !== null &&
              Math.floor(countdown / 60_000) !==
                Math.floor((countdown + 1_000) / 60_000))
              ? "polite"
              : "none"
          }
          className={styles.prototypeMeta}
        >
          {`${messages.consentCountdown}: ${countdown === null ? "--:--" : formatCountdown(countdown)}`}
        </Text>
      ) : null}
      {underfilled?.state ===
        QuestUnderfilledState.UNDERFILLED_CONSENT_PENDING &&
      groupFcfs.canConsent ? (
        <Pressable
          accessibilityRole="button"
          className={styles.statusAction}
          onPress={onOpenPartialConsent}
          testID="group-fcfs-consent-action"
        >
          <Text className={styles.statusActionText}>
            {messages.groupFcfsConsentAction}
          </Text>
        </Pressable>
      ) : null}
      {joined && full ? (
        <Pressable
          accessibilityRole="button"
          className={styles.statusAction}
          onPress={onOpenWorkHub}
          testID="group-fcfs-open-work-hub"
        >
          <Text className={styles.statusActionText}>
            {messages.openWorkHub}
          </Text>
        </Pressable>
      ) : null}
      {underfilled?.state === QuestUnderfilledState.UNDERFILLED_CANCELLED ? (
        <Text className={styles.statusDescription}>
          {messages.groupFcfsCancelledNextStep}
        </Text>
      ) : null}
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
  groupFcfs?: {
    activeWorkerCount: number;
    headcount: number;
    isJoined: boolean;
    state: string;
    startTime?: string;
    underfilled: LiveQuestSnapshot["underfilled"];
    canConsent: boolean;
  };
  onOpenPartialConsent: () => void;
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
  groupFcfs,
  onOpenPartialConsent,
}: QuestDetailBodyProps) {
  const { colors } = useAppTheme();
  const [viewingImage, setViewingImage] = useState<number | null>(null);
  const StatusIcon = status?.Icon;
  const canJoin =
    canParticipate &&
    !(
      groupFcfs &&
      (groupFcfs.activeWorkerCount >= groupFcfs.headcount ||
        groupFcfs.state !== QuestStatus.QUEST_OPEN)
    );
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
            <Text className={styles.creatorValue} numberOfLines={1}>
              {`${quest.creator.name}${quest.creator.faculty ? ` · ${localizeFacultyName(quest.creator.faculty, locale)}` : ""}`}
            </Text>
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
            onPress={() => setViewingImage(0)}
            uri={imageUris[0]}
          />
          {imageUris.length > 1 ? (
            <View className={styles.imageThumbnailRow}>
              {imageUris.slice(1).map((uri, index) => (
                <QuestImage
                  key={`${uri}-${index + 1}`}
                  index={index + 2}
                  messages={messages}
                  onPress={() => setViewingImage(index + 1)}
                  uri={uri}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
      <ImageViewerModal
        closeLabel={messages.closeImageViewer}
        imageAccessibilityLabel={
          viewingImage === null
            ? ""
            : messages.questImageLabel(viewingImage + 1)
        }
        imageUrl={
          viewingImage === null ? null : (imageUris[viewingImage] ?? null)
        }
        onClose={() => setViewingImage(null)}
        visible={viewingImage !== null}
      />
      <View className={styles.heroCard}>
        <View className={styles.heroPrimary}>
          <View className={styles.heroReward}>
            <Text className={styles.heroLabel}>{messages.reward}</Text>
            <Text className={styles.heroRewardValue}>
              {formatSatang(getQuestRewardSatang(quest), locale)}
              <Text
                className={styles.heroRewardUnit}
              >{` ${messages.perPerson}`}</Text>
            </Text>
          </View>
          <View
            accessible
            accessibilityLabel={messages.participantsSummary(
              quest.acceptedParticipants,
              quest.headcount
            )}
            className={styles.heroCount}
          >
            <Text className={styles.heroLabel}>{messages.participants}</Text>
            <Text
              className={styles.heroCountValue}
            >{`${quest.acceptedParticipants}/${quest.headcount}`}</Text>
          </View>
        </View>
        <View className={styles.heroFacts}>
          <InfoRow
            icon={UsersRound}
            label={
              groupFcfs ? messages.groupFcfsHeadcount : messages.participation
            }
            value={
              groupFcfs
                ? messages.groupFcfsRequestedWorkers(quest.headcount)
                : quest.participationMode === "team"
                  ? messages.team
                  : messages.singlePerson
            }
          />
          <InfoRow
            icon={UserRoundCheck}
            label={messages.candidateMode}
            value={
              quest.candidateMode === QuestCandidateMode.NO_CANDIDATE
                ? messages.firstCome
                : messages.reviewCandidates
            }
          />
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
      {groupFcfs ? (
        <GroupFcfsJourneyCard
          groupFcfs={groupFcfs}
          locale={locale}
          messages={messages}
          onOpenPartialConsent={onOpenPartialConsent}
          onOpenWorkHub={onOpenWorkHub}
          quest={quest}
        />
      ) : null}
      {canJoin ? (
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
      <Section title={messages.description}>
        <Text className={styles.descriptionText}>{quest.description}</Text>
      </Section>
      <Section title={messages.scheduleLocation}>
        <ScheduleLocation locale={locale} messages={messages} quest={quest} />
      </Section>
      <Section title={messages.requirements}>
        <View className={styles.infoCard}>
          <InfoRow
            icon={ClipboardCheck}
            label={messages.completionCriteria}
            value={quest.completionCriteria}
          />
          <InfoRow
            divided
            icon={FileCheck}
            label={messages.proofRequired}
            value={proofLabel(quest, messages)}
          />
        </View>
      </Section>
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
          {status.unavailable ? (
            <Text className={styles.statusDescription}>
              {status.description}
            </Text>
          ) : null}
          {!status.unavailable && !status.postView && !status.leftQuest ? (
            <Pressable
              accessibilityRole="button"
              onPress={onOpenWorkHub}
              className={styles.statusAction}
              testID="open-work-hub"
            >
              <Text className={styles.statusActionText}>
                {messages.openWorkHub}
              </Text>
            </Pressable>
          ) : null}
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
          locale={locale}
          groupMessages={liveEntry.groupMessages}
          busy={liveEntry.busy}
          onOpenTeam={liveEntry.onOpenTeam}
          onOpenCandidateReview={liveEntry.onOpenCandidateReview}
          onOpenPartialConsent={liveEntry.onOpenPartialConsent}
        />
      ) : null}
    </ScrollView>
  );
}
