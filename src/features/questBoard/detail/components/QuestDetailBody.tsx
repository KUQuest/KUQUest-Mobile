import { useState, type ReactNode } from "react";
import {
  CalendarCheck,
  CalendarClock,
  CircleAlert,
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
import type { GroupQuestMessages } from "@/locales/groupQuestMessages";
import type { QuestBoardMessages } from "@/locales/questBoardMessages";
import { getQuestRewardSatang } from "../../presentation/questBoardViewData";
import { formatDate } from "@/domain/datetime";
import type { LiveQuestSnapshot } from "../../live/liveQuestService";
import type { QuestBoardQuest, QuestDetailState } from "../../domain/types";
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
}: QuestDetailBodyProps) {
  const { colors } = useAppTheme();
  const [viewingImage, setViewingImage] = useState<number | null>(null);
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
            label={messages.participation}
            value={
              quest.participationMode === "team"
                ? messages.team
                : messages.singlePerson
            }
          />
          <InfoRow
            icon={UserRoundCheck}
            label={messages.candidateMode}
            value={
              quest.candidateMode === "NO_CANDIDATE"
                ? messages.firstCome
                : messages.reviewCandidates
            }
            description={candidateDescription(quest, messages)}
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
            description={proofDescription(quest, messages)}
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
