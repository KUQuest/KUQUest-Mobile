import React, { useEffect, useState } from "react";
import { cn } from "@/tw/cn";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CircleAlert,
  CircleUserRound,
  ClipboardCheck,
  Clock3,
  ImageOff,
  LogOut,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react-native";
import {
  AccessibilityInfo,
  Alert,
  BackHandler,
  Modal,
  RefreshControl,
} from "react-native";
import { Image, Pressable, SafeAreaView, ScrollView, Text, View } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ApiError } from "@/api/ApiClient";
import { createQuestIdempotencyKey } from "@/api/QuestApi";
import type { UploadAsset } from "@/api/fileUpload";
import { useCalmRefresh } from "@/hooks/useCalmRefresh";
import { authService } from "../auth/AuthService";
import {
  canonicalToQuestBoardQuest,
  liveQuestService,
  publicDetailToQuestBoardQuest,
  type LiveQuestNextAction,
  type LiveQuestSnapshot,
} from "./liveQuestService";
import type { QuestFixtureError } from "./questFixtureAdapter";
import { TopBar } from "@/components/ui/TopBar";
import {
  LoadingSkeleton,
  SkeletonBlock,
} from "@/components/ui/LoadingSkeleton";
import { useLocale } from "@/locales/LocaleProvider";
import {
  groupQuestMessages,
  type GroupQuestMessages,
} from "@/locales/groupQuestMessages";
import {
  questBoardMessages,
  type QuestBoardMessages,
} from "@/locales/questBoardMessages";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import styles from "./questDetailStyles";
import {
  getQuestDetailFixture,
  parseBoardPreviewState,
  type BoardPreviewState,
} from "./questBoardHarness";
import {
  parseQuestDetailMode,
  parseQuestIntent,
  parseQuestJoinStatus,
  parseQuestRouteId,
  parseStudentId,
  type QuestDetailMode,
  type QuestJoinStatus,
} from "./questRoute";
import { formatSatang } from "@/domain/satang";
import {
  MAX_QUEST_IMAGES,
  QuestCandidateMode,
  QuestInvitationStatus,
  QuestPartialStartConsentStatus,
  QuestParticipation,
  QuestStatus,
  QuestTeamStatus,
  type QuestBoardQuest,
  type QuestDetailState,
} from "./types";
import { getChatRouteParams } from "@/features/chat/chatData";
import {
  getQuestRewardSatang,
  type QuestActionResult,
  questWorkflow,
  type QuestViewerApplicationStatus,
} from "./questWorkflow";
import {
  CandidateReviewSheet,
  PartialGroupStartConsentSheet,
  TeamAssembleSheet,
  type PartialGroupStartVoter,
  type TeamDirectoryMember,
} from "./components";

export interface QuestDetailScreenProps {
  previewState?: BoardPreviewState;
  questId?: string;
  studentId?: string;
  mode?: QuestDetailMode;
  joinStatus?: QuestJoinStatus;
}

type DisplayApplicationStatus = QuestViewerApplicationStatus;

function getActionBarPaddingBottom(bottomInset: number): number {
  return Math.max(spacing.md, bottomInset + spacing.sm);
}

function getLiveActionError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return `${error.code}: ${error.message}`;
  return error instanceof Error ? error.message : fallback;
}

function getQuestFixtureError(
  result: QuestActionResult
): QuestFixtureError | undefined {
  return result.ok === false ? result.error : undefined;
}
function announce(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

function formatDeadline(value: string, locale: "en" | "th"): string {
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

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
function toQuestBoardQuest(snapshot: LiveQuestSnapshot): QuestBoardQuest {
  return "questFundingTotal" in snapshot.quest
    ? canonicalToQuestBoardQuest(snapshot.quest)
    : publicDetailToQuestBoardQuest(snapshot.quest);
}

function getLiveApplicationStatus(
  snapshot: LiveQuestSnapshot | null
): DisplayApplicationStatus {
  if (snapshot?.assignment?.state === "ASSIGNMENT_ACTIVE") return "accepted";
  if (snapshot?.application?.state === "APPLICATION_APPLIED") return "pending";
  return "none";
}

function getLiveJoinStatus(
  snapshot: LiveQuestSnapshot | null
): QuestJoinStatus | undefined {
  if (!snapshot) return undefined;
  if (
    snapshot.assignment?.state === "ASSIGNMENT_COMPLETED" ||
    snapshot.assignment?.state === "ASSIGNMENT_INCOMPLETE" ||
    snapshot.assignment?.state === "ASSIGNMENT_CANCELLED"
  )
    return "history";
  if (snapshot.assignment?.state === "ASSIGNMENT_ACTIVE") return "accepted";
  if (snapshot.application?.state === "APPLICATION_APPLIED") return "pending";
  return undefined;
}

function getNextActionLabel(
  action: LiveQuestNextAction,
  messages: QuestBoardMessages
): string {
  switch (action) {
    case "JOIN":
      return messages.joinNow;
    case "APPLY":
      return messages.applyNow;
    case "WITHDRAW_APPLICATION":
      return messages.withdrawApplication;
    case "CREATE_TEAM":
    case "JOIN_TEAM":
    case "SUBMIT_TEAM":
      return messages.viewMyQuests;
    case "SELECT_CANDIDATE":
    case "SELECT_TEAM":
      return messages.viewMyQuests;
    default:
      return messages.viewMyQuests;
  }
}

function LiveEntrySurface({
  snapshot,
  messages,
  groupMessages,
  busy = false,
  onOpenTeam,
  onOpenCandidateReview,
  onOpenPartialConsent,
}: {
  snapshot: LiveQuestSnapshot;
  messages: QuestBoardMessages;
  groupMessages: GroupQuestMessages;
  busy?: boolean;
  onOpenTeam: () => void;
  onOpenCandidateReview: () => void;
  onOpenPartialConsent: () => void;
}) {
  const isGroupCandidate =
    snapshot.participation === "GROUP" && snapshot.mode === "CANDIDATE";
  const isHirer = snapshot.actor === "HIRER";
  const isUnderfilled =
    snapshot.nextAction === "DECIDE_UNDERFILLED" ||
    snapshot.nextAction === "CONSENT_UNDERFILLED";
  const shouldRender =
    isUnderfilled ||
    (isGroupCandidate &&
      !isHirer &&
      (snapshot.team !== null ||
        snapshot.capabilities.canCreateTeam ||
        snapshot.capabilities.canJoinTeam ||
        snapshot.capabilities.canUpdateTeam ||
        snapshot.capabilities.canSubmitTeam ||
        snapshot.capabilities.canSelectTeam)) ||
    (isHirer &&
      (snapshot.capabilities.canSelectCandidate ||
        snapshot.capabilities.canSelectTeam ||
        snapshot.capabilities.canRejectCandidate ||
        snapshot.capabilities.canRejectTeam));
  if (!shouldRender) return null;

  const title = isUnderfilled
    ? groupMessages.partialConsentTitle
    : isHirer
      ? groupMessages.candidateReviewTitle
      : groupMessages.noTeamTitle;
  const description = isUnderfilled
    ? groupMessages.partialConsentSubtitle
    : isHirer
      ? groupMessages.candidateReviewSubtitle
      : groupMessages.noTeamDescription;
  const testID = isUnderfilled
    ? "quest-live-underfilled-entry"
    : isHirer
      ? "quest-candidate-review-entry"
      : "quest-team-entry-surface";
  const onOpen = isUnderfilled
    ? onOpenPartialConsent
    : isHirer
      ? onOpenCandidateReview
      : onOpenTeam;
  const actionLabel = isUnderfilled
    ? getNextActionLabel(snapshot.nextAction, messages)
    : isHirer
      ? groupMessages.selectProposal
      : snapshot.team
        ? groupMessages.reviewRoster
        : groupMessages.createTeam;

  return (
    <View
      accessibilityRole="alert"
      className={cn(styles.statusCard, isHirer && styles.statusCardOwner)}
      testID={testID}
    >
      {isUnderfilled ? (
        <Clock3 color={colors.primary} size={25} strokeWidth={2.2} />
      ) : isHirer ? (
        <CircleUserRound color={colors.primary} size={25} strokeWidth={2.2} />
      ) : (
        <UsersRound color={colors.primary} size={25} strokeWidth={2.2} />
      )}
      <Text className={styles.statusTitle}>{title}</Text>
      <Text className={styles.statusDescription}>{description}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: busy }}
        className={cn(styles.statusAction, busy && styles.statusActionDisabled)}
        disabled={busy}
        onPress={onOpen}
        testID={`${testID}-action`}
      >
        <Text className={styles.statusActionText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

function NotFoundState({
  title,
  description,
  actionLabel,
  onAction,
  error = false,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  error?: boolean;
}) {
  return (
    <View
      accessibilityRole="alert"
      className={error ? styles.errorState : styles.section}
      testID={error ? "quest-detail-error-state" : "quest-detail-not-found"}
    >
      <Text className={error ? styles.errorTitle : styles.sectionTitle}>
        {title}
      </Text>
      <Text className={error ? styles.errorDescription : styles.body}>
        {description}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onAction}
        className={error ? styles.errorAction : styles.primaryAction}
      >
        <Text
          className={error ? styles.errorActionText : styles.primaryActionText}
        >
          {actionLabel}
        </Text>
      </Pressable>
    </View>
  );
}

function QuestDetailSkeleton({ loadingLabel }: { loadingLabel: string }) {
  const insets = useSafeAreaInsets();
  return (
    <LoadingSkeleton
      loadingLabel={loadingLabel}
      style={{ flex: 1 }}
      contentStyle={{ flex: 1 }}
      testID="quest-detail-loading-skeleton"
    >
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerClassName={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View className={styles.header} style={{ gap: spacing.xs }}>
            <SkeletonBlock height={34} width="86%" borderRadius={6} />
            <View
              style={{
                flexDirection: "row",
                gap: spacing.xs,
                marginTop: spacing.xs,
              }}
            >
              <SkeletonBlock height={24} width={64} borderRadius={12} />
              <SkeletonBlock height={24} width={82} borderRadius={12} />
            </View>
            <View
              style={{
                alignItems: "center",
                flexDirection: "row",
                gap: spacing.sm,
                marginTop: spacing.sm,
              }}
            >
              <SkeletonBlock
                variant="image"
                height={32}
                width={32}
                borderRadius={16}
              />
              <View style={{ flex: 1, gap: spacing.xs }}>
                <SkeletonBlock height={14} width="24%" borderRadius={4} />
                <SkeletonBlock height={17} width="58%" borderRadius={4} />
              </View>
            </View>
          </View>
          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            <SkeletonBlock
              variant="image"
              height={196}
              borderRadius={16}
              testID="quest-detail-skeleton-featured-image"
            />
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <SkeletonBlock
                variant="image"
                height={76}
                borderRadius={16}
                style={{ flex: 1 }}
              />
              <SkeletonBlock
                variant="image"
                height={76}
                borderRadius={16}
                style={{ flex: 1 }}
              />
            </View>
          </View>
          <View className={styles.heroCard} style={{ gap: spacing.md }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <View style={{ gap: spacing.xs }}>
                <SkeletonBlock height={14} width={54} borderRadius={4} />
                <SkeletonBlock height={28} width={126} borderRadius={5} />
              </View>
              <SkeletonBlock height={52} width={78} borderRadius={12} />
            </View>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <SkeletonBlock height={58} borderRadius={8} style={{ flex: 1 }} />
              <SkeletonBlock height={58} borderRadius={8} style={{ flex: 1 }} />
            </View>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <SkeletonBlock height={20} width={20} borderRadius={10} />
              <View style={{ flex: 1, gap: spacing.xs }}>
                <SkeletonBlock height={14} width="24%" borderRadius={4} />
                <SkeletonBlock height={18} width="74%" borderRadius={4} />
                <SkeletonBlock height={14} width="38%" borderRadius={4} />
              </View>
            </View>
          </View>
          <View className={styles.scheduleCard} style={{ gap: spacing.md }}>
            <View
              style={{
                alignItems: "center",
                flexDirection: "row",
                gap: spacing.sm,
              }}
            >
              <SkeletonBlock height={36} width={36} borderRadius={18} />
              <View style={{ flex: 1, gap: spacing.xs }}>
                <SkeletonBlock height={20} width="34%" borderRadius={5} />
                <SkeletonBlock height={14} width="58%" borderRadius={4} />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <SkeletonBlock height={132} width={12} borderRadius={6} />
              <View style={{ flex: 1, gap: spacing.sm }}>
                <SkeletonBlock height={18} width="46%" borderRadius={4} />
                <SkeletonBlock height={22} width="64%" borderRadius={5} />
                <SkeletonBlock height={15} width="54%" borderRadius={4} />
                <SkeletonBlock height={18} width="42%" borderRadius={4} />
                <SkeletonBlock height={22} width="58%" borderRadius={5} />
              </View>
            </View>
          </View>
          {[1, 2].map((section) => (
            <View
              key={section}
              style={{ gap: spacing.sm, marginTop: spacing.lg }}
            >
              <SkeletonBlock
                height={22}
                width={section === 1 ? 126 : 112}
                borderRadius={5}
              />
              <View
                className={styles.descriptionCard}
                style={{ gap: spacing.sm }}
              >
                <SkeletonBlock height={16} width="94%" borderRadius={4} />
                <SkeletonBlock height={16} width="78%" borderRadius={4} />
                <SkeletonBlock height={16} width="58%" borderRadius={4} />
              </View>
            </View>
          ))}
        </ScrollView>
        <View
          className={styles.actionBar}
          style={{ paddingBottom: getActionBarPaddingBottom(insets.bottom) }}
          testID="quest-detail-loading-action-bar"
        >
          <SkeletonBlock height={52} borderRadius={26} />
        </View>
      </View>
    </LoadingSkeleton>
  );
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

function GroupQuestEntrySurfaces({
  state,
  viewerId,
  isHirer,
  messages,
  onOpenTeam,
  onOpenCandidateReview,
  onOpenPartialConsent,
}: {
  state: QuestDetailState;
  viewerId: string;
  isHirer: boolean;
  messages: GroupQuestMessages;
  onOpenTeam: () => void;
  onOpenCandidateReview: () => void;
  onOpenPartialConsent: () => void;
}) {
  const {
    quest,
    teams,
    invitations,
    applications,
    partialStartConsent,
    capabilities,
  } = state;
  const isCandidateGroup =
    quest.participation === QuestParticipation.GROUP &&
    quest.candidateMode === QuestCandidateMode.CANDIDATE;
  const isCandidateQuest = quest.candidateMode === QuestCandidateMode.CANDIDATE;
  const ownTeam = teams.find(
    (team) =>
      team.members.some((member) => member.workerId === viewerId) ||
      team.leaderId === viewerId
  );
  const ownInvitation = invitations.find(
    (invitation) =>
      invitation.invitedWorkerId === viewerId &&
      invitation.status === QuestInvitationStatus.INVITATION_PENDING
  );
  const invitationTeam = ownInvitation
    ? teams.find((team) => team.id === ownInvitation.teamId)
    : undefined;
  const team = ownTeam ?? invitationTeam;
  const canCreateTeam = capabilities.availableActions.includes("CREATE_TEAM");
  const shouldShowTeamSurface =
    isCandidateGroup && !isHirer && (Boolean(team) || canCreateTeam);
  const teamStatus = team?.status;
  const teamTitle = !team
    ? messages.noTeamTitle
    : teamStatus === QuestTeamStatus.TEAM_SELECTED
      ? messages.teamSelected
      : teamStatus === QuestTeamStatus.TEAM_REJECTED
        ? messages.teamRejected
        : teamStatus === QuestTeamStatus.TEAM_SUBMITTED
          ? messages.submittedTitle
          : messages.teamTitle;
  const teamDescription = !team
    ? messages.noTeamDescription
    : teamStatus === QuestTeamStatus.TEAM_FORMING
      ? messages.teamSubtitle
      : messages.lockedDescription;
  const teamActionLabel =
    !team || teamStatus === QuestTeamStatus.TEAM_FORMING
      ? messages.reviewRoster
      : messages.submittedTitle;
  const reviewableProposalCount =
    quest.participation === QuestParticipation.GROUP
      ? teams.filter(
          (candidate) => candidate.status !== QuestTeamStatus.TEAM_FORMING
        ).length
      : applications.filter((application) => !application.teamId).length;
  const partialPending =
    partialStartConsent?.status ===
    QuestPartialStartConsentStatus.PARTIAL_START_PENDING;
  const partialApproved =
    partialStartConsent?.status ===
    QuestPartialStartConsentStatus.PARTIAL_START_APPROVED;
  const partialDescription = partialPending
    ? messages.partialConsentSubtitle
    : partialApproved
      ? messages.approvedDescription(
          state.actualHeadcount ??
            partialStartConsent?.frozenWorkerIds.length ??
            0
        )
      : partialStartConsent?.status ===
          QuestPartialStartConsentStatus.PARTIAL_START_TIMED_OUT
        ? messages.timedOutDescription
        : messages.cancelledDescription;

  return (
    <>
      {shouldShowTeamSurface ? (
        <View
          accessibilityRole="alert"
          className={cn(
            styles.statusCard,
            teamStatus === QuestTeamStatus.TEAM_REJECTED &&
              styles.statusCardBlocked,
            !team && styles.statusCardOwner
          )}
          testID="quest-team-entry-surface"
        >
          <UsersRound
            color={
              teamStatus === QuestTeamStatus.TEAM_REJECTED
                ? colors.dangerDark
                : colors.primary
            }
            size={25}
            strokeWidth={2.2}
          />
          <Text className={styles.statusTitle}>{teamTitle}</Text>
          <Text className={styles.statusDescription}>{teamDescription}</Text>
          <Text className={styles.statusDescription}>
            {messages.rosterCount(team?.members.length ?? 0, quest.headcount)}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onOpenTeam}
            className={styles.statusAction}
            testID="quest-open-team-sheet"
          >
            <Text className={styles.statusActionText}>
              {!team && canCreateTeam ? messages.createTeam : teamActionLabel}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {isCandidateQuest && isHirer ? (
        <View
          accessibilityRole="alert"
          className={cn(styles.statusCard, styles.statusCardOwner)}
          testID="quest-candidate-review-entry"
        >
          <CircleUserRound color={colors.primary} size={25} strokeWidth={2.2} />
          <Text className={styles.statusTitle}>
            {messages.candidateReviewTitle}
          </Text>
          <Text className={styles.statusDescription}>
            {messages.candidateReviewSubtitle}
          </Text>
          <Text className={styles.statusDescription}>
            {messages.proposalCount(reviewableProposalCount)}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onOpenCandidateReview}
            className={styles.statusAction}
            testID="quest-open-candidate-review-sheet"
          >
            <Text className={styles.statusActionText}>
              {messages.selectProposal}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {quest.participation === QuestParticipation.GROUP &&
      quest.candidateMode === QuestCandidateMode.NO_CANDIDATE &&
      partialStartConsent ? (
        <View
          accessibilityRole="alert"
          className={cn(
            styles.statusCard,
            partialPending
              ? styles.statusCardOwner
              : partialApproved
                ? styles.statusCard
                : styles.statusCardBlocked
          )}
          testID="quest-partial-start-entry"
        >
          <Clock3
            color={
              partialApproved
                ? colors.primary
                : partialPending
                  ? colors.primary
                  : colors.dangerDark
            }
            size={25}
            strokeWidth={2.2}
          />
          <Text className={styles.statusTitle}>
            {partialPending
              ? messages.partialConsentTitle
              : partialApproved
                ? messages.approvedTitle
                : messages.cancelledTitle}
          </Text>
          <Text className={styles.statusDescription}>{partialDescription}</Text>
          <Text className={styles.statusDescription}>
            {messages.votesProgress(
              partialStartConsent.approvedVoterCount,
              partialStartConsent.requiredVoterCount ??
                partialStartConsent.requiredVoterIds.length
            )}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onOpenPartialConsent}
            className={styles.statusAction}
            testID="quest-open-partial-start-sheet"
          >
            <Text className={styles.statusActionText}>
              {messages.voteStatus}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );
}

function ConfirmationSheet({
  locale,
  messages,
  quest,
  onCancel,
  onConfirm,
  busy = false,
}: {
  locale: "en" | "th";
  messages: QuestBoardMessages;
  quest: QuestBoardQuest;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const firstCome = quest.candidateMode === "NO_CANDIDATE";
  const title = firstCome
    ? messages.confirmParticipationTitle
    : messages.confirmApplicationTitle;
  const description = firstCome
    ? messages.confirmParticipationDescription
    : messages.confirmApplicationDescription;
  const confirmLabel = firstCome
    ? messages.confirmParticipation
    : messages.confirmApplication;

  return (
    <Modal
      animationType="slide"
      onDismiss={() => announce(messages.details)}
      onRequestClose={onCancel}
      onShow={() => announce(title)}
      transparent
      visible
    >
      <Pressable onPress={onCancel} className={styles.modalBackdrop}>
        <Pressable
          accessibilityViewIsModal
          onPress={() => undefined}
          className={styles.confirmSheet}
          style={{
            paddingBottom: Math.max(spacing.md, insets.bottom + spacing.sm),
          }}
        >
          <View className={styles.confirmHeader}>
            <Text accessibilityRole="header" className={styles.confirmTitle}>
              {title}
            </Text>
            <Pressable
              accessibilityLabel={messages.notYet}
              accessibilityRole="button"
              onPress={onCancel}
              className={styles.sheetCloseButton}
            >
              <X color={colors.textStrong} size={24} />
            </Pressable>
          </View>
          <Text className={styles.confirmDescription}>{description}</Text>
          <View className={styles.confirmSummary}>
            <Text className={styles.confirmSummaryText}>{quest.title}</Text>
            <Text
              className={styles.confirmSummaryText}
            >{`${formatSatang(getQuestRewardSatang(quest), locale)} ${messages.perPerson}`}</Text>
            <Text
              className={styles.confirmSummaryText}
            >{`${messages.schedule}: ${formatDeadline(quest.startDate, locale)}${quest.timeRange ? ` · ${quest.timeRange}` : ""}`}</Text>
            <Text
              className={styles.confirmSummaryText}
            >{`${messages.deadline}: ${formatDeadline(quest.deadline, locale)}`}</Text>
            <Text
              className={styles.confirmSummaryText}
            >{`${messages.location}: ${quest.location}`}</Text>
          </View>
          <View className={styles.confirmActions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              className={styles.cancelAction}
            >
              <Text className={styles.cancelActionText}>{messages.notYet}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={onConfirm}
              className={cn(
                styles.confirmAction,
                busy && styles.primaryActionDisabled
              )}
              testID="confirm-quest-application"
            >
              <Text className={styles.confirmActionText}>
                {busy ? messages.loading : confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function QuestDetailScreen({
  previewState,
  questId,
  studentId,
  mode,
  joinStatus,
}: QuestDetailScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const handleBack = React.useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)");
  }, [router]);
  useFocusEffect(
    React.useCallback(() => {
      // Native Modal surfaces consume Android Back through onRequestClose before this focused-screen listener.
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          handleBack();
          return true;
        }
      );
      return () => subscription.remove();
    }, [handleBack])
  );
  const params = useLocalSearchParams<{
    id?: string | string[];
    intent?: string | string[];
    preview?: string | string[];
    mode?: string | string[];
    joinStatus?: string | string[];
    studentId?: string | string[];
  }>();
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];
  const resolvedQuestId = parseQuestRouteId(questId ?? params.id);
  const resolvedIntent = parseQuestIntent(params.intent);
  const resolvedMode = mode ?? parseQuestDetailMode(params.mode);
  const resolvedJoinStatus =
    joinStatus ?? parseQuestJoinStatus(params.joinStatus);
  const routeStudentId = parseStudentId(params.studentId);
  const explicitStudentId = studentId ?? routeStudentId;
  const resolvedPreview =
    previewState ?? parseBoardPreviewState(params.preview);
  const explicitPreview = resolvedPreview !== undefined;
  const [sessionStudentId, setSessionStudentId] = useState<
    string | undefined
  >();
  const [liveQuest, setLiveQuest] = useState<QuestBoardQuest | null>(null);
  const [liveSnapshot, setLiveSnapshot] = useState<LiveQuestSnapshot | null>(
    null
  );
  const [liveError, setLiveError] = useState<Error | null>(null);
  const [loadedQuestId, setLoadedQuestId] = useState<string | undefined>();
  const applicationStudentId = explicitStudentId ?? sessionStudentId ?? "";
  const isJoinView = resolvedMode === "join";
  const isPostView = resolvedMode === "post";
  const prototypeViewerId = applicationStudentId;
  const loadingQuest = explicitPreview
    ? resolvedPreview === "loading"
    : Boolean(resolvedQuestId && loadedQuestId !== resolvedQuestId);

  useEffect(() => {
    if (explicitStudentId) return undefined;
    let active = true;
    void authService
      .getSession()
      .then((session) => {
        if (!active) return;
        const id = parseStudentId(session?.user.id);
        if (id) setSessionStudentId(id);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [explicitStudentId]);

  const latestQuestIdRef = React.useRef(resolvedQuestId);
  const loadedQuestIdRef = React.useRef(loadedQuestId);
  useEffect(() => {
    latestQuestIdRef.current = resolvedQuestId;
    return () => {
      latestQuestIdRef.current = undefined;
    };
  }, [resolvedQuestId]);
  useEffect(() => {
    loadedQuestIdRef.current = loadedQuestId;
  }, [loadedQuestId]);

  const loadQuest = React.useCallback(async (): Promise<QuestBoardQuest> => {
    const id = resolvedQuestId;
    if (!id) throw new Error("Quest ID is required");
    if (explicitPreview) {
      const fixture = getQuestDetailFixture(id, resolvedPreview);
      if (!fixture) throw new Error("Quest not found");
      setLoadedQuestId(id);
      return fixture;
    }
    if (
      typeof liveQuestService.getLiveSnapshot !== "function" ||
      !applicationStudentId
    ) {
      if (typeof liveQuestService.getQuestDetail === "function") {
        const quest = await liveQuestService.getQuestDetail(id);
        if (latestQuestIdRef.current === id) {
          setLiveQuest(quest);
          setLoadedQuestId(id);
        }
        return quest;
      }
      throw new Error("Member session is required");
    }
    setLiveError(null);
    try {
      const snapshot = await liveQuestService.getLiveSnapshot(
        id,
        applicationStudentId
      );
      if (latestQuestIdRef.current === id) {
        setLiveSnapshot(snapshot);
        setLiveQuest(toQuestBoardQuest(snapshot));
        setLoadedQuestId(id);
      }
      return toQuestBoardQuest(snapshot);
    } catch (error) {
      if (latestQuestIdRef.current === id) {
        setLiveError(error instanceof Error ? error : new Error("Load failed"));
        setLoadedQuestId(id);
      }
      throw error;
    }
  }, [applicationStudentId, explicitPreview, resolvedPreview, resolvedQuestId]);

  const { refreshing, refresh, refreshOnFocus } = useCalmRefresh(loadQuest);
  useFocusEffect(
    React.useCallback(() => {
      if (
        !resolvedQuestId ||
        explicitPreview ||
        (!applicationStudentId &&
          typeof liveQuestService.getQuestDetail !== "function")
      )
        return;
      if (loadedQuestIdRef.current !== resolvedQuestId) {
        void refresh(true).catch(() => undefined);
        return;
      }
      refreshOnFocus();
    }, [
      applicationStudentId,
      explicitPreview,
      refresh,
      refreshOnFocus,
      resolvedQuestId,
    ])
  );
  useEffect(() => {
    if (!resolvedQuestId || explicitPreview) return;
    if (loadedQuestIdRef.current !== resolvedQuestId) {
      void refresh(true).catch(() => undefined);
    }
  }, [explicitPreview, refresh, resolvedQuestId]);

  const [, setPrototypeState] = useState<QuestDetailState | null>(null);
  const activePrototypeState =
    explicitPreview && resolvedQuestId
      ? questWorkflow.getQuestDetailState(resolvedQuestId, prototypeViewerId)
      : null;
  const liveQuestForRoute =
    liveQuest?.id === resolvedQuestId ? liveQuest : null;
  const detailProjection =
    explicitPreview && resolvedQuestId
      ? questWorkflow.getQuestDetailProjection(
          resolvedQuestId,
          prototypeViewerId
        )
      : null;
  const [liveAction, setLiveAction] = useState<string | null>(null);
  const runLiveAction = React.useCallback(
    async <T,>(
      actionName: string,
      action: () => Promise<T>,
      fallbackError: string
    ): Promise<T | undefined> => {
      if (liveAction) return undefined;
      setLiveAction(actionName);
      setLiveError(null);
      try {
        const result = await action();
        await refresh(true).catch(() => undefined);
        return result;
      } catch (error) {
        await refresh(true).catch(() => undefined);
        const message = getLiveActionError(error, fallbackError);
        Alert.alert(messages.details, message);
        return undefined;
      } finally {
        setLiveAction(null);
      }
    },
    [liveAction, messages.details, refresh]
  );
  const quest = explicitPreview
    ? (getQuestDetailFixture(resolvedQuestId, resolvedPreview) ?? null)
    : liveQuestForRoute;
  const applicationState = activePrototypeState;
  const applicationProjection = detailProjection;
  const applicationStatusHydrated = explicitPreview || liveSnapshot !== null;
  const applicationStatus = explicitPreview
    ? (applicationProjection?.applicationStatus ?? "none")
    : getLiveApplicationStatus(liveSnapshot);
  const previewApplicationStatus: DisplayApplicationStatus =
    resolvedPreview === "application-pending"
      ? "pending"
      : resolvedPreview === "application-accepted"
        ? "accepted"
        : applicationStatus;
  const availability =
    resolvedPreview === "full"
      ? "full"
      : resolvedPreview === "closed"
        ? "closed"
        : quest
          ? quest.status === QuestStatus.QUEST_OPEN
            ? "available"
            : "closed"
          : undefined;
  const imageUris = quest?.imageUris?.slice(0, MAX_QUEST_IMAGES) ?? [];
  const [localJoinedStatus, setJoinedStatus] = useState<
    QuestJoinStatus | undefined
  >();
  const joinedStatus: QuestJoinStatus | undefined =
    localJoinedStatus ??
    (isJoinView && applicationStatusHydrated
      ? explicitPreview
        ? (resolvedJoinStatus ??
          (applicationStatus === "pending" || applicationStatus === "accepted"
            ? applicationStatus
            : "accepted"))
        : getLiveJoinStatus(liveSnapshot)
      : undefined);
  const firstCome = quest?.candidateMode === "NO_CANDIDATE";
  const candidateGroup = Boolean(
    quest && !firstCome && quest.participationMode === "team"
  );
  const canonicalOpen = quest?.status === QuestStatus.QUEST_OPEN;
  const partialStartPending = explicitPreview
    ? (detailProjection?.partialStartPending ?? false)
    : liveSnapshot?.nextAction === "CONSENT_UNDERFILLED";
  const liveCanApply = Boolean(
    liveSnapshot?.nextAction === "APPLY" && liveSnapshot.capabilities.canApply
  );
  const liveCanJoin = Boolean(
    liveSnapshot?.nextAction === "JOIN" && liveSnapshot.capabilities.canJoin
  );
  const legacyCanApply = Boolean(
    applicationState?.capabilities.availableActions.includes(
      firstCome ? "DIRECT_JOIN" : "APPLY"
    )
  );
  const serverCanJoin = explicitPreview
    ? Boolean(
        firstCome &&
        applicationStudentId &&
        quest &&
        quest.hasJoined === false &&
        quest.acceptedParticipants < quest.headcount
      )
    : liveCanJoin;
  const canApply =
    !isJoinView &&
    !isPostView &&
    availability === "available" &&
    canonicalOpen &&
    !partialStartPending &&
    previewApplicationStatus === "none" &&
    !candidateGroup &&
    applicationStatusHydrated &&
    (firstCome
      ? serverCanJoin
      : explicitPreview
        ? legacyCanApply
        : liveCanApply);
  const canWithdrawApplication =
    applicationStatusHydrated &&
    !isPostView &&
    Boolean(
      explicitPreview
        ? applicationStatus === "pending"
        : liveSnapshot?.capabilities.canWithdrawApplication
    );
  const [manualConfirmationOpen, setManualConfirmationOpen] = useState(false);
  const [leftQuest, setLeftQuest] = useState(false);
  const canShowWithdraw =
    !isPostView &&
    !leftQuest &&
    canWithdrawApplication &&
    (isJoinView ? joinedStatus === "pending" : applicationStatus === "pending");
  const routeIntentKey = `${resolvedQuestId ?? ""}:${resolvedIntent ?? ""}`;
  const [dismissedIntent, setDismissedIntent] = useState<string | undefined>();
  const confirmationOpen =
    manualConfirmationOpen ||
    (resolvedIntent === "apply" &&
      dismissedIntent !== routeIntentKey &&
      canApply);
  const canMessageOwner = Boolean(
    quest &&
    !isPostView &&
    quest.ownerStudentId !== applicationStudentId &&
    (explicitPreview
      ? detailProjection?.conversationCapability.conversationId &&
        detailProjection.conversationCapability.canRead
      : liveSnapshot?.state === "QUEST_OPEN" &&
        liveSnapshot.actor !== "HIRER" &&
        liveSnapshot.assignment === null)
  );
  const canReportQuest = Boolean(
    isJoinView &&
    !leftQuest &&
    (joinedStatus === "accepted" || joinedStatus === "history") &&
    (explicitPreview
      ? applicationProjection?.isAssigned
      : liveSnapshot?.assignment !== null)
  );
  const statusTitle = isPostView
    ? messages.postOwnerView
    : isJoinView
      ? leftQuest
        ? messages.leftQuest
        : joinedStatus === "history"
          ? messages.historyQuest
          : joinedStatus === "accepted"
            ? messages.participationConfirmed
            : joinedStatus === "pending"
              ? messages.applicationPending
              : ""
      : previewApplicationStatus === "accepted"
        ? firstCome
          ? messages.participationConfirmed
          : messages.applicationAccepted
        : previewApplicationStatus === "pending"
          ? messages.applicationPending
          : availability === "full"
            ? messages.questFull
            : availability === "closed"
              ? messages.applicationsClosed
              : "";
  const statusIsUnavailable =
    !isJoinView &&
    !isPostView &&
    availability !== "available" &&
    previewApplicationStatus === "none";
  const statusDescription = isPostView
    ? messages.postOwnerViewDescription
    : isJoinView
      ? leftQuest
        ? messages.leftQuestDescription
        : joinedStatus === "history"
          ? messages.historyQuestDescription
          : joinedStatus === "accepted"
            ? messages.applicationAcceptedDescription
            : messages.applicationPendingDescription
      : previewApplicationStatus === "accepted"
        ? messages.applicationAcceptedDescription
        : previewApplicationStatus === "pending"
          ? messages.applicationPendingDescription
          : messages.unavailableApplication;
  const StatusIcon = statusIsUnavailable
    ? CircleAlert
    : isPostView
      ? BriefcaseBusiness
      : leftQuest
        ? LogOut
        : Check;
  const statusIconColor = statusIsUnavailable
    ? colors.textMuted
    : leftQuest
      ? colors.dangerDark
      : colors.primary;
  const groupMessages = groupQuestMessages[locale];
  const isHirerView = explicitPreview
    ? (detailProjection?.isOwner ?? false)
    : liveSnapshot?.actor === "HIRER";
  const [teamSheetOpen, setTeamSheetOpen] = useState(false);
  const [candidateReviewSheetOpen, setCandidateReviewSheetOpen] =
    useState(false);
  const [partialStartSheetDismissed, setPartialStartSheetDismissed] =
    useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [teamSelectedMemberIds, setTeamSelectedMemberIds] = useState<string[]>(
    []
  );
  const [teamReviewing, setTeamReviewing] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(
    null
  );

  const teamSheetTeam = (() => {
    if (!activePrototypeState || !candidateGroup || isHirerView)
      return undefined;
    const ownTeam = activePrototypeState.teams.find(
      (team) =>
        team.members.some(
          (member) => member.workerId === applicationStudentId
        ) || team.leaderId === applicationStudentId
    );
    if (ownTeam) return ownTeam;
    const invitation = activePrototypeState.invitations.find(
      (item) =>
        item.invitedWorkerId === applicationStudentId &&
        item.status === QuestInvitationStatus.INVITATION_PENDING
    );
    return invitation
      ? activePrototypeState.teams.find((team) => team.id === invitation.teamId)
      : undefined;
  })();
  const teamDirectory: TeamDirectoryMember[] =
    !resolvedQuestId ||
    !activePrototypeState ||
    !candidateGroup ||
    isHirerView ||
    teamSheetTeam?.leaderId !== applicationStudentId ||
    teamSheetTeam.status !== QuestTeamStatus.TEAM_FORMING
      ? []
      : questWorkflow.searchMembers(
          resolvedQuestId,
          teamSearchQuery,
          applicationStudentId
        );
  const consent = activePrototypeState?.partialStartConsent;
  const partialVoters: PartialGroupStartVoter[] =
    !activePrototypeState || !consent
      ? []
      : consent.requiredVoterIds.map((id) => ({
          id,
          displayName:
            id === activePrototypeState.quest.hirerId
              ? (quest?.creator.name ?? id)
              : id,
          role: id === activePrototypeState.quest.hirerId ? "HIRER" : "WORKER",
        }));
  const liveCandidateGroup =
    !explicitPreview &&
    liveSnapshot?.participation === "GROUP" &&
    liveSnapshot.mode === "CANDIDATE" &&
    !isHirerView;
  const liveTeamSheetTeam = liveCandidateGroup
    ? (liveSnapshot?.team ??
      liveSnapshot?.teams.find(
        (team) =>
          team.state === "TEAM_FORMING" && team.members.length < team.headcount
      ) ??
      null)
    : null;
  const liveTeamSurface = Boolean(
    liveCandidateGroup &&
    liveSnapshot &&
    (liveSnapshot.team ||
      liveSnapshot.capabilities.canCreateTeam ||
      liveSnapshot.capabilities.canJoinTeam)
  );
  const livePartialVoters: PartialGroupStartVoter[] =
    !liveSnapshot?.underfilled || !liveSnapshot.underfilled.responses
      ? []
      : liveSnapshot.underfilled.responses.map((response) => ({
          id: response.workerId,
          displayName: response.workerId,
          role: "WORKER",
        }));
  const partialStartSheetOpen =
    Boolean(activePrototypeState?.partialStartConsent) &&
    activePrototypeState?.partialStartConsent?.status !==
      QuestPartialStartConsentStatus.PARTIAL_START_APPROVED &&
    !partialStartSheetDismissed;
  const confirmApplication = async () => {
    if (!quest || !canApply) return;
    if (firstCome && !explicitPreview) {
      const result = await runLiveAction(
        "join",
        () => liveQuestService.joinQuest(quest.id),
        "Failed to join quest"
      );
      if (!result) return;
      setJoinedStatus("accepted");
      setManualConfirmationOpen(false);
      router.push("/my-quests");
      Alert.alert(
        messages.confirmParticipationTitle,
        messages.participationConfirmed
      );
      return;
    }

    if (!explicitPreview && liveSnapshot?.capabilities.canApply) {
      const result = await runLiveAction(
        "apply",
        () =>
          liveQuestService.applyQuest(quest.id, createQuestIdempotencyKey()),
        "Failed to apply"
      );
      if (!result) return;
      setManualConfirmationOpen(false);
      setDismissedIntent(routeIntentKey);
      return;
    }

    const result: QuestActionResult = questWorkflow.dispatch({
      type: firstCome ? "DIRECT_JOIN" : "APPLY",
      questId: quest.id,
      workerId: applicationStudentId,
    });
    const fixtureError = getQuestFixtureError(result);
    if (fixtureError) {
      Alert.alert(messages.details, fixtureError.message);
      return;
    }
    if (result.state) setPrototypeState(result.state);
    setManualConfirmationOpen(false);
    setDismissedIntent(routeIntentKey);
  };

  const handleLeaveQuest = () => {
    if (
      !quest ||
      (isJoinView
        ? joinedStatus !== "pending"
        : applicationStatus !== "pending")
    )
      return;
    const label = messages.withdrawApplication;
    const description = messages.withdrawApplicationDescription;
    Alert.alert(label, description, [
      { text: messages.cancel, style: "cancel" },
      {
        text: label,
        style: "destructive",
        onPress: () => {
          void (async () => {
            if (
              !explicitPreview &&
              liveSnapshot?.capabilities.canWithdrawApplication &&
              liveSnapshot.application
            ) {
              const result = await runLiveAction(
                "withdraw",
                () =>
                  liveQuestService.withdrawApplication(
                    quest.id,
                    liveSnapshot.application!.id,
                    createQuestIdempotencyKey()
                  ),
                "Failed to withdraw application"
              );
              if (!result) return;
            } else {
              const result = questWorkflow.dispatch({
                type: "WITHDRAW_APPLICATION",
                questId: quest.id,
                workerId: applicationStudentId,
              });
              const fixtureError = getQuestFixtureError(result);
              if (fixtureError) {
                Alert.alert(messages.details, fixtureError.message);
                return;
              }
              setPrototypeState(result.state);
            }
            setLeftQuest(true);
            announce(messages.leftQuest);
          })();
        },
      },
    ]);
  };

  const handleEditPost = () => {
    if (!quest) return;
    router.push({ pathname: "/create", params: { editQuestId: quest.id } });
  };
  const handleOpenWorkHub = () => {
    router.push("/my-quests");
  };

  const handleMessageOwner = () => {
    if (!quest || !canMessageOwner) return;
    if (explicitPreview) {
      const capability = detailProjection?.conversationCapability;
      if (!capability?.conversationId || !capability.canRead) return;
      router.push({
        pathname: "/chat/[id]",
        params: getChatRouteParams({
          conversationId: capability.conversationId,
          questId: quest.id,
          viewerId: applicationStudentId,
          ownerName: quest.creator.name,
          questTitle: quest.title,
        }),
      });
      return;
    }
    void liveQuestService
      .createCandidateInquiry(quest.id)
      .then((inquiry) => {
        router.push(`./inquiry/${inquiry.id}`);
      })
      .catch((error) => {
        Alert.alert(
          messages.details,
          error instanceof Error ? error.message : messages.messageOwnerError
        );
      });
  };

  const handleReportQuest = () => {
    if (!quest || !canReportQuest) return;
    router.push({
      pathname: "/report",
      params: {
        source: "quest",
        questId: quest.id,
        questTitle: quest.title,
        viewerId: applicationStudentId,
        reportedMemberId: quest.ownerStudentId,
      },
    });
  };

  const applyPrototypeResult = (result: QuestActionResult) => {
    const fixtureError = getQuestFixtureError(result);
    if (fixtureError) {
      Alert.alert(messages.details, fixtureError.message);
      return;
    }
    if (result.state) setPrototypeState(result.state);
  };
  const handleCreateTeam = () => {
    if (resolvedQuestId)
      applyPrototypeResult(
        questWorkflow.dispatch({
          type: "CREATE_TEAM",
          questId: resolvedQuestId,
          leaderId: applicationStudentId,
        })
      );
  };
  const handleInviteMembers = (memberIds: string[]) => {
    memberIds.forEach((memberId) => {
      if (resolvedQuestId)
        applyPrototypeResult(
          questWorkflow.dispatch({
            type: "INVITE_WORKER",
            questId: resolvedQuestId,
            workerId: memberId,
            leaderId: applicationStudentId,
          })
        );
    });
  };
  const handleSubmitTeam = (teamId: string) => {
    if (resolvedQuestId && teamSheetTeam?.id === teamId)
      applyPrototypeResult(
        questWorkflow.dispatch({
          type: "SUBMIT_TEAM",
          questId: resolvedQuestId,
          leaderId: applicationStudentId,
        })
      );
  };
  const handleInvitation = (invitationId: string, accept: boolean) => {
    if (resolvedQuestId)
      applyPrototypeResult(
        questWorkflow.dispatch({
          type: "RESPOND_INVITATION",
          questId: resolvedQuestId,
          invitationId,
          workerId: applicationStudentId,
          accept,
        })
      );
  };
  const handlePartialStartVote = (approve: boolean) => {
    if (!resolvedQuestId) return;
    if (!explicitPreview && liveSnapshot?.capabilities.canConsentUnderfilled) {
      void runLiveAction(
        "underfilled-consent",
        () =>
          liveQuestService.respondUnderfilledConsent(
            resolvedQuestId,
            approve ? "ACCEPT" : "DECLINE",
            createQuestIdempotencyKey()
          ),
        "Failed to respond to underfilled consent"
      );
      return;
    }
    applyPrototypeResult(
      questWorkflow.dispatch({
        type: "VOTE_PARTIAL_START_CONSENT",
        questId: resolvedQuestId,
        voterId: prototypeViewerId,
        approve,
      })
    );
  };
  const handleSelectCandidate = (proposalId: string) => {
    if (!resolvedQuestId) return;
    if (!explicitPreview && liveSnapshot) {
      const operation =
        liveSnapshot.participation === "GROUP"
          ? () =>
              liveQuestService.selectCandidateTeam(
                resolvedQuestId,
                proposalId,
                createQuestIdempotencyKey()
              )
          : () =>
              liveQuestService.selectApplication(
                resolvedQuestId,
                proposalId,
                createQuestIdempotencyKey()
              );
      void runLiveAction(
        "select-candidate",
        operation,
        "Failed to select candidate proposal"
      ).then((result) => {
        if (!result) return;
        setCandidateReviewSheetOpen(false);
        router.push("/my-quests");
      });
      return;
    }
    applyPrototypeResult(
      questWorkflow.dispatch({
        type: "SELECT_CANDIDATE",
        questId: resolvedQuestId,
        applicationId: proposalId,
        hirerId: prototypeViewerId,
      })
    );
  };
  const handleRejectCandidate = (proposalId: string) => {
    if (!resolvedQuestId || !quest) return;
    const isGroup =
      !explicitPreview && liveSnapshot
        ? liveSnapshot.participation === "GROUP"
        : candidateGroup;
    const proposalType = isGroup
      ? groupMessages.teamProposal
      : groupMessages.individualProposal;
    Alert.alert(groupMessages.reject, `${quest.title}\n${proposalType}`, [
      { text: groupMessages.cancel, style: "cancel" },
      {
        text: groupMessages.reject,
        style: "destructive",
        onPress: () => {
          if (!explicitPreview && liveSnapshot) {
            const operation =
              liveSnapshot.participation === "GROUP"
                ? () =>
                    liveQuestService.rejectCandidateTeam(
                      resolvedQuestId,
                      proposalId,
                      createQuestIdempotencyKey()
                    )
                : () =>
                    liveQuestService.rejectApplication(
                      resolvedQuestId,
                      proposalId,
                      createQuestIdempotencyKey()
                    );
            void runLiveAction<unknown>(
              "reject-candidate",
              operation,
              "Failed to reject candidate proposal"
            ).then((result) => {
              if (!result) return;
              setSelectedProposalId(null);
            });
            return;
          }
          const result = candidateGroup
            ? questWorkflow.dispatch({
                type: "REJECT_TEAM",
                questId: resolvedQuestId,
                teamId: proposalId,
                hirerId: prototypeViewerId,
              })
            : questWorkflow.dispatch({
                type: "REJECT_CANDIDATE",
                questId: resolvedQuestId,
                applicationId: proposalId,
                hirerId: prototypeViewerId,
              });
          applyPrototypeResult(result);
        },
      },
    ]);
  };
  const handleOpenLiveUnderfilled = () => {
    setPartialStartSheetDismissed(false);
    if (!resolvedQuestId || explicitPreview || liveSnapshot?.underfilled)
      return;
    void runLiveAction(
      "underfilled-load",
      () => liveQuestService.getUnderfilled(resolvedQuestId),
      "Failed to load underfilled Quest status"
    );
  };
  const handleLiveUnderfilledDecision = (decision: "PROCEED" | "CANCEL") => {
    if (
      !resolvedQuestId ||
      explicitPreview ||
      !liveSnapshot?.capabilities.canDecideUnderfilled
    )
      return;
    void runLiveAction(
      "underfilled-decision",
      () =>
        liveQuestService.decideUnderfilled(
          resolvedQuestId,
          decision,
          createQuestIdempotencyKey()
        ),
      "Failed to update underfilled Quest decision"
    );
  };
  const handleLiveUnderfilledConsent = (decision: "ACCEPT" | "DECLINE") => {
    if (
      !resolvedQuestId ||
      explicitPreview ||
      !liveSnapshot?.capabilities.canConsentUnderfilled
    )
      return;
    void runLiveAction(
      "underfilled-consent",
      () =>
        liveQuestService.respondUnderfilledConsent(
          resolvedQuestId,
          decision,
          createQuestIdempotencyKey()
        ),
      "Failed to respond to underfilled consent"
    );
  };
  const handleLiveCreateTeam = () => {
    if (
      !resolvedQuestId ||
      !liveCandidateGroup ||
      !liveSnapshot?.capabilities.canCreateTeam
    )
      return;
    void runLiveAction(
      "create-team",
      () =>
        liveQuestService.createCandidateTeam(
          resolvedQuestId,
          {
            name: `${quest?.title ?? "Quest"} Team`,
            headcount: quest?.headcount ?? 2,
          },
          createQuestIdempotencyKey()
        ),
      "Failed to create Quest Team"
    );
  };
  const handleLiveJoinTeam = (joinCode: string) => {
    if (
      !resolvedQuestId ||
      !liveCandidateGroup ||
      !liveTeamSheetTeam ||
      !liveSnapshot?.capabilities.canJoinTeam
    )
      return;
    void runLiveAction(
      "join-team",
      () =>
        liveQuestService.joinCandidateTeam(
          resolvedQuestId,
          liveTeamSheetTeam.id,
          joinCode,
          createQuestIdempotencyKey()
        ),
      "Failed to join Quest Team"
    );
  };
  const handleLiveLeaveTeam = (teamId: string) => {
    if (
      !resolvedQuestId ||
      !liveCandidateGroup ||
      !liveSnapshot?.capabilities.canLeaveTeam
    )
      return;
    void runLiveAction(
      "leave-team",
      () =>
        liveQuestService.leaveCandidateTeam(
          resolvedQuestId,
          teamId,
          createQuestIdempotencyKey()
        ),
      "Failed to leave Quest Team"
    );
  };
  const handleLiveRemoveTeamMember = (teamId: string, memberId: string) => {
    if (
      !resolvedQuestId ||
      !liveCandidateGroup ||
      !liveSnapshot?.capabilities.canRemoveTeamMember
    )
      return;
    void runLiveAction(
      "remove-team-member",
      () =>
        liveQuestService.removeCandidateTeamMember(
          resolvedQuestId,
          teamId,
          memberId,
          createQuestIdempotencyKey()
        ),
      "Failed to remove team member"
    );
  };
  const handleLiveRegenerateTeamCode = (teamId: string) => {
    if (
      !resolvedQuestId ||
      !liveCandidateGroup ||
      !liveSnapshot?.capabilities.canRegenerateTeamCode
    )
      return;
    void runLiveAction(
      "regenerate-team-code",
      () =>
        liveQuestService.regenerateCandidateTeamJoinCode(
          resolvedQuestId,
          teamId,
          createQuestIdempotencyKey()
        ),
      "Failed to regenerate team join code"
    );
  };
  const handleLiveUpdateTeamName = (teamId: string, name: string) => {
    if (
      !resolvedQuestId ||
      !liveCandidateGroup ||
      !liveSnapshot?.capabilities.canUpdateTeam
    )
      return;
    const trimmedName = name.trim();
    if (!trimmedName) return;
    void runLiveAction(
      "update-team",
      () =>
        liveQuestService.updateCandidateTeam(
          resolvedQuestId,
          teamId,
          { name: trimmedName },
          createQuestIdempotencyKey()
        ),
      "Failed to update Quest Team name"
    );
  };
  const handleLiveSubmitTeam = (
    teamId: string,
    payload?: { text?: string; fileIds?: string[] }
  ) => {
    if (!resolvedQuestId || !liveCandidateGroup) return;
    void runLiveAction(
      "submit-team",
      async () => {
        const result = await liveQuestService.submitCandidateTeam(
          resolvedQuestId,
          teamId,
          payload ?? {},
          createQuestIdempotencyKey()
        );
        setTeamSheetOpen(false);
        setTeamReviewing(false);
        return result;
      },
      "Failed to submit Quest Team"
    );
  };
  const handleLiveUploadTeamFile = React.useCallback(
    async (asset: UploadAsset) => {
      if (!resolvedQuestId || !liveTeamSheetTeam) {
        throw new Error("No active team");
      }
      const uploaded = await liveQuestService.uploadCandidateTeamFile(
        resolvedQuestId,
        liveTeamSheetTeam.id,
        asset,
        createQuestIdempotencyKey()
      );
      return {
        id: uploaded.fileId,
        name: uploaded.fileName,
        sizeBytes: uploaded.sizeBytes,
      };
    },
    [liveTeamSheetTeam, resolvedQuestId]
  );
  const canonicalStatus =
    liveSnapshot?.state ?? activePrototypeState?.quest.status;
  const questPending = loadingQuest || resolvedPreview === "loading";
  if (questPending) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        className={styles.safeArea}
      >
        <TopBar
          backLabel={messages.back}
          onBackPress={handleBack}
          title={messages.details}
          variant="detail"
        />
        <QuestDetailSkeleton loadingLabel={messages.loading} />
      </SafeAreaView>
    );
  }

  if (liveError || resolvedPreview === "error" || !quest) {
    const errorState = Boolean(liveError) || resolvedPreview === "error";
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        className={styles.safeArea}
      >
        <TopBar
          backLabel={messages.back}
          onBackPress={handleBack}
          title={messages.details}
          variant="detail"
        />
        <NotFoundState
          title={errorState ? messages.errorTitle : messages.questNotFound}
          description={
            errorState
              ? messages.errorDescription
              : messages.questNotFoundDescription
          }
          actionLabel={errorState ? messages.retry : messages.back}
          onAction={
            errorState
              ? () => {
                  setLiveError(null);
                  setLoadedQuestId(undefined);
                  void refresh(true).catch(() => undefined);
                }
              : handleBack
          }
          error={errorState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} className={styles.safeArea}>
      <TopBar
        backLabel={messages.back}
        onBackPress={handleBack}

        title={messages.details}
        variant="detail"
      />
      <ScrollView
        contentContainerClassName={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void refresh(true).catch(() => undefined);
            }}
          />
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
              <CircleUserRound
                color={colors.primary}
                size={17}
                strokeWidth={2}
              />
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
                <Text className={styles.heroLabel}>
                  {messages.participation}
                </Text>
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
                <Text className={styles.heroLabel}>
                  {messages.candidateMode}
                </Text>
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
        {statusTitle ? (
          <View
            accessibilityRole="alert"
            className={cn(
              styles.statusCard,
              statusIsUnavailable && styles.statusCardBlocked,
              isPostView && styles.statusCardOwner,
              (leftQuest || joinedStatus === "history") &&
                styles.statusCardMuted
            )}
          >
            <StatusIcon color={statusIconColor} size={25} strokeWidth={2.2} />
            <Text className={styles.statusTitle}>{statusTitle}</Text>
            <Text className={styles.statusDescription}>
              {statusDescription}
            </Text>
            {!statusIsUnavailable && !isPostView && !leftQuest ? (
              <Pressable
                accessibilityRole="button"
                onPress={handleOpenWorkHub}
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
        {activePrototypeState ? (
          <GroupQuestEntrySurfaces
            state={activePrototypeState}
            viewerId={prototypeViewerId}
            isHirer={isHirerView}
            messages={groupMessages}
            onOpenTeam={() => setTeamSheetOpen(true)}
            onOpenCandidateReview={() => {
              setSelectedProposalId(null);
              setCandidateReviewSheetOpen(true);
            }}
            onOpenPartialConsent={() => setPartialStartSheetDismissed(false)}
          />
        ) : null}
        {!explicitPreview && liveSnapshot ? (
          <LiveEntrySurface
            snapshot={liveSnapshot}
            messages={messages}
            groupMessages={groupMessages}
            busy={Boolean(liveAction)}
            onOpenTeam={() => setTeamSheetOpen(true)}
            onOpenCandidateReview={() => {
              setSelectedProposalId(null);
              setCandidateReviewSheetOpen(true);
            }}
            onOpenPartialConsent={handleOpenLiveUnderfilled}
          />
        ) : null}
        {canReportQuest ? (
          <View className={styles.reportCard} testID="quest-report-card">
            <View className={styles.reportHeader}>
              <View className={styles.reportIcon}>
                <CircleAlert
                  color={colors.danger}
                  size={21}
                  strokeWidth={2.2}
                />
              </View>
              <View className={styles.reportCopy}>
                <Text className={styles.reportTitle}>
                  {messages.reportQuest}
                </Text>
                <Text className={styles.reportDescription}>
                  {messages.reportQuestDescription}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityLabel={messages.reportQuest}
              accessibilityRole="button"
              className={styles.reportAction}
              onPress={handleReportQuest}
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
      {activePrototypeState && candidateGroup && !isHirerView ? (
        <TeamAssembleSheet
          bottomInset={insets.bottom}
          eligibleMembers={teamDirectory}
          invitations={activePrototypeState.invitations}
          locale={locale}
          onClose={() => {
            setTeamSheetOpen(false);
            setTeamReviewing(false);
            setTeamSelectedMemberIds([]);
            setTeamSearchQuery("");
          }}
          onCreateTeam={
            activePrototypeState.capabilities.availableActions.includes(
              "CREATE_TEAM"
            )
              ? handleCreateTeam
              : undefined
          }
          onInviteMembers={
            activePrototypeState.capabilities.availableActions.includes(
              "INVITE_WORKER"
            )
              ? handleInviteMembers
              : undefined
          }
          onRespondInvitation={
            activePrototypeState.capabilities.availableActions.includes(
              "RESPOND_INVITATION"
            )
              ? handleInvitation
              : undefined
          }
          onSearchQueryChange={setTeamSearchQuery}
          onSelectedMemberIdsChange={setTeamSelectedMemberIds}
          onReviewChange={setTeamReviewing}
          onSubmit={
            activePrototypeState.capabilities.availableActions.includes(
              "SUBMIT_TEAM"
            )
              ? handleSubmitTeam
              : undefined
          }
          requestedHeadcount={activePrototypeState.quest.headcount}
          reviewing={teamReviewing}
          searchQuery={teamSearchQuery}
          selectedMemberIds={teamSelectedMemberIds}
          team={teamSheetTeam}
          viewerId={applicationStudentId}
          visible={teamSheetOpen}
        />
      ) : null}
      {liveTeamSurface ? (
        <TeamAssembleSheet
          bottomInset={insets.bottom}
          canLeaveTeam={liveSnapshot?.capabilities.canLeaveTeam}
          canRemoveMember={liveSnapshot?.capabilities.canRemoveTeamMember}
          canRegenerateJoinCode={
            liveSnapshot?.capabilities.canRegenerateTeamCode
          }
          canUpdateTeam={liveSnapshot?.capabilities.canUpdateTeam}
          eligibleMembers={[]}
          joinCode={liveTeamSheetTeam?.joinCode}
          joinCodeExpiresAt={liveTeamSheetTeam?.joinCodeExpiresAt}
          teamName={liveTeamSheetTeam?.name}
          onClose={() => {
            setTeamSheetOpen(false);
            setTeamReviewing(false);
            setTeamSelectedMemberIds([]);
            setTeamSearchQuery("");
          }}
          onCreateTeam={
            liveSnapshot?.capabilities.canCreateTeam
              ? handleLiveCreateTeam
              : undefined
          }
          onJoinTeam={
            liveSnapshot?.capabilities.canJoinTeam
              ? handleLiveJoinTeam
              : undefined
          }
          onLeaveTeam={handleLiveLeaveTeam}
          onRemoveMember={handleLiveRemoveTeamMember}
          onRegenerateJoinCode={handleLiveRegenerateTeamCode}
          onUpdateTeamName={handleLiveUpdateTeamName}
          onReviewChange={setTeamReviewing}
          onSubmitTeam={handleLiveSubmitTeam}
          onUploadProposalFile={handleLiveUploadTeamFile}
          requestedHeadcount={liveSnapshot?.quest.headcount}
          reviewing={teamReviewing}
          searchQuery={teamSearchQuery}
          submitting={liveAction === "submit-team"}
          team={liveTeamSheetTeam}
          viewerId={applicationStudentId}
          visible={teamSheetOpen}
        />
      ) : null}
      {activePrototypeState &&
      isHirerView &&
      quest.candidateMode === QuestCandidateMode.CANDIDATE ? (
        <CandidateReviewSheet
          actualHeadcount={activePrototypeState.actualHeadcount}
          applications={activePrototypeState.applications}
          bottomInset={insets.bottom}
          locale={locale}
          mode={candidateGroup ? "team" : "individual"}
          onAcceptProposal={
            activePrototypeState.capabilities.availableActions.includes(
              "SELECT_CANDIDATE"
            )
              ? handleSelectCandidate
              : undefined
          }
          onClose={() => {
            setCandidateReviewSheetOpen(false);
            setSelectedProposalId(null);
          }}
          onRejectProposal={
            activePrototypeState.capabilities.availableActions.includes(
              candidateGroup ? "REJECT_TEAM" : "REJECT_CANDIDATE"
            )
              ? handleRejectCandidate
              : undefined
          }
          onSelectProposal={setSelectedProposalId}
          questTitle={quest.title}
          requestedHeadcount={activePrototypeState.quest.headcount}
          rewardSatangPerWorker={activePrototypeState.quest.reward.rewardSatang}
          selectedProposalId={selectedProposalId}
          settlement={detailProjection?.settlement ?? undefined}
          teams={
            candidateGroup
              ? activePrototypeState.teams.filter(
                  (team) => team.status !== QuestTeamStatus.TEAM_FORMING
                )
              : []
          }
          visible={candidateReviewSheetOpen}
          fullScreen
        />
      ) : null}
      {!explicitPreview &&
      liveSnapshot &&
      liveSnapshot.actor === "HIRER" &&
      liveSnapshot.mode === "CANDIDATE" &&
      (liveSnapshot.capabilities.canSelectCandidate ||
        liveSnapshot.capabilities.canSelectTeam ||
        liveSnapshot.capabilities.canRejectCandidate ||
        liveSnapshot.capabilities.canRejectTeam) ? (
        <CandidateReviewSheet
          actualHeadcount={liveSnapshot.assignments.length}
          applications={liveSnapshot.applications}
          bottomInset={insets.bottom}
          fullScreen
          loading={
            liveAction === "select-candidate" ||
            liveAction === "reject-candidate"
          }
          locale={locale}
          mode={liveSnapshot.participation === "GROUP" ? "team" : "individual"}
          onAcceptProposal={liveAction ? undefined : handleSelectCandidate}
          onRejectProposal={liveAction ? undefined : handleRejectCandidate}
          onClose={() => {
            setCandidateReviewSheetOpen(false);
            setSelectedProposalId(null);
          }}
          onSelectProposal={setSelectedProposalId}
          rewardSatangPerWorker={getQuestRewardSatang(quest)}
          requestedHeadcount={liveSnapshot.quest.headcount}
          selectedProposalId={selectedProposalId}
          teams={
            liveSnapshot.participation === "GROUP" ? liveSnapshot.teams : []
          }
          visible={candidateReviewSheetOpen}
        />
      ) : null}
      {activePrototypeState &&
      activePrototypeState.quest.participation === QuestParticipation.GROUP &&
      activePrototypeState.quest.candidateMode ===
        QuestCandidateMode.NO_CANDIDATE &&
      activePrototypeState.partialStartConsent ? (
        <PartialGroupStartConsentSheet
          actualHeadcount={activePrototypeState.actualHeadcount}
          bottomInset={insets.bottom}
          canRespond={activePrototypeState.capabilities.availableActions.includes(
            "VOTE_PARTIAL_GROUP_START_CONSENT"
          )}
          consent={activePrototypeState.partialStartConsent}
          hirerId={activePrototypeState.quest.hirerId}
          locale={locale}
          onClose={() => setPartialStartSheetDismissed(true)}
          onVote={handlePartialStartVote}
          questTitle={quest.title}
          requestedHeadcount={activePrototypeState.quest.headcount}
          voters={partialVoters}
          viewerId={prototypeViewerId}
          visible={partialStartSheetOpen}
        />
      ) : null}
      {!explicitPreview &&
      liveSnapshot?.participation === "GROUP" &&
      liveSnapshot.mode === "FIRST_COME_FIRST_SERVED" &&
      liveSnapshot.underfilled ? (
        <PartialGroupStartConsentSheet
          actualHeadcount={liveSnapshot.underfilled.activeWorkerCount}
          bottomInset={insets.bottom}
          canConsent={liveSnapshot.capabilities.canConsentUnderfilled}
          canDecide={liveSnapshot.capabilities.canDecideUnderfilled}
          canRespond={
            liveSnapshot.capabilities.canConsentUnderfilled ||
            liveSnapshot.capabilities.canDecideUnderfilled
          }
          error={undefined}
          loading={
            liveAction === "underfilled-decision" ||
            liveAction === "underfilled-consent"
          }
          locale={locale}
          onClose={() => setPartialStartSheetDismissed(true)}
          onHirerDecision={handleLiveUnderfilledDecision}
          onWorkerConsent={handleLiveUnderfilledConsent}
          questTitle={quest.title}
          requestedHeadcount={liveSnapshot.underfilled.headcount}
          underfilled={liveSnapshot.underfilled}
          viewerId={applicationStudentId}
          visible={
            !partialStartSheetDismissed &&
            (liveSnapshot.nextAction === "DECIDE_UNDERFILLED" ||
              liveSnapshot.nextAction === "CONSENT_UNDERFILLED")
          }
          voters={livePartialVoters}
        />
      ) : null}
      {isPostView ? (
        <View
          className={styles.actionBar}
          style={{ paddingBottom: getActionBarPaddingBottom(insets.bottom) }}
        >
          <Pressable
            accessibilityRole="button"
            onPress={handleEditPost}
            className={styles.primaryAction}
            testID="quest-edit-post-button"
          >
            <Pencil color={colors.white} size={19} strokeWidth={2.2} />
            <Text className={styles.primaryActionText}>
              {messages.editPost}
            </Text>
          </Pressable>
        </View>
      ) : canMessageOwner || canShowWithdraw || canApply ? (
        <View
          className={styles.actionBar}
          style={{ paddingBottom: getActionBarPaddingBottom(insets.bottom) }}
          testID="quest-action-bar"
        >
          <View className={styles.actionRow}>
            {canMessageOwner ? (
              <Pressable
                accessibilityLabel={messages.messageOwner}
                accessibilityRole="button"
                className={styles.messageOwnerAction}
                onPress={handleMessageOwner}
                testID="quest-message-owner-button"
              >
                <MessageCircle
                  color={colors.primary}
                  size={18}
                  strokeWidth={2.2}
                />
                <Text className={styles.prototypeActionText} numberOfLines={1}>
                  {messages.messageOwnerShort}
                </Text>
              </Pressable>
            ) : null}
            {canShowWithdraw ? (
              <Pressable
                accessibilityRole="button"
                disabled={Boolean(liveAction)}
                onPress={handleLeaveQuest}
                className={cn(
                  styles.leaveAction,
                  liveAction && styles.leaveActionDisabled
                )}
                testID="quest-leave-button"
              >
                <LogOut color={colors.dangerDark} size={19} strokeWidth={2.2} />
                <Text className={styles.leaveActionText}>
                  {messages.withdrawApplication}
                </Text>
              </Pressable>
            ) : canApply ? (
              <Pressable
                accessibilityLabel={
                  firstCome ? messages.joinNow : messages.applyNow
                }
                accessibilityRole="button"
                disabled={Boolean(liveAction)}
                onPress={() => setManualConfirmationOpen(true)}
                className={cn(
                  styles.primaryAction,
                  liveAction && styles.primaryActionDisabled
                )}
                testID="quest-apply-button"
              >
                <Plus color={colors.white} size={19} strokeWidth={2.2} />
                <Text className={styles.primaryActionText}>
                  {firstCome ? messages.joinNow : messages.applyNow}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
      {confirmationOpen ? (
        <ConfirmationSheet
          locale={locale}
          messages={messages}
          onCancel={() => {
            setManualConfirmationOpen(false);
            setDismissedIntent(routeIntentKey);
          }}
          onConfirm={confirmApplication}
          busy={Boolean(liveAction)}
          quest={quest}
        />
      ) : null}
    </SafeAreaView>
  );
}
