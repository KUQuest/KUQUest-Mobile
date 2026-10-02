import { formatTimestampDate, formatTimeInBangkok } from "@/domain/datetime";
import { underfilledCancellationDescription } from "@/locales/groupQuestMessages";
import {
  formatCountdown,
  useServerCountdown,
} from "@/features/questBoard/shared/useServerCountdown";
import { CircleUserRound, Clock3, UsersRound } from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import type { GroupQuestMessages } from "@/locales/groupQuestMessages";
import type { LiveQuestSnapshot } from "../../live/liveQuestService";
import {
  isHirerActor,
  QuestCandidateMode,
  QuestInvitationStatus,
  QuestNextAction,
  QuestPartialStartConsentStatus,
  QuestParticipation,
  QuestTeamStatus,
  QuestUnderfilledConsentDecision,
  QuestUnderfilledState,
  type QuestDetailState,
} from "../../domain/types";
import styles from "../../styles/questDetailStyles";

export function LiveEntrySurface({
  snapshot,
  locale,
  groupMessages,
  busy = false,
  onOpenTeam,
  onOpenCandidateReview,
  onOpenPartialConsent,
}: {
  snapshot: LiveQuestSnapshot;
  groupMessages: GroupQuestMessages;
  locale: "en" | "th";
  busy?: boolean;
  onOpenTeam: () => void;
  onOpenCandidateReview: () => void;
  onOpenPartialConsent: () => void;
}) {
  const { colors } = useAppTheme();
  const underfilledDeadline =
    snapshot.underfilled?.state ===
    QuestUnderfilledState.UNDERFILLED_DECISION_PENDING
      ? snapshot.underfilled.decision.expiresAt
      : snapshot.underfilled?.consent.expiresAt;
  const underfilledRemaining = useServerCountdown(underfilledDeadline);
  const isGroupCandidate =
    snapshot.participation === QuestParticipation.GROUP &&
    snapshot.mode === QuestCandidateMode.CANDIDATE;
  const isHirer = isHirerActor(snapshot.actor);
  const cancelled =
    snapshot.underfilled?.state === QuestUnderfilledState.UNDERFILLED_CANCELLED;
  const isUnderfilled =
    cancelled ||
    snapshot.nextAction === QuestNextAction.DECIDE_UNDERFILLED ||
    snapshot.nextAction === QuestNextAction.CONSENT_UNDERFILLED;
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

  const title = cancelled
    ? groupMessages.cancelledTitle
    : isUnderfilled
      ? snapshot.nextAction === QuestNextAction.DECIDE_UNDERFILLED
        ? groupMessages.hirerDecisionPending
        : groupMessages.workerResponseRequired
      : isHirer
        ? groupMessages.candidateReviewTitle
        : groupMessages.noTeamTitle;
  const description = cancelled
    ? underfilledCancellationDescription(
        groupMessages,
        snapshot.underfilled?.cancellationReason,
        snapshot.underfilled?.ownResponse?.decision ===
          QuestUnderfilledConsentDecision.DECLINE,
        isHirer
      )
    : isUnderfilled
      ? snapshot.nextAction === QuestNextAction.DECIDE_UNDERFILLED
        ? groupMessages.proceedConsequence
        : groupMessages.acceptingWaitsForEveryone
      : "";
  const cancellationDate =
    cancelled && snapshot.underfilled?.cancelledAt
      ? formatTimestampDate(snapshot.underfilled.cancelledAt, locale)
      : undefined;
  const cancellationTime =
    cancelled && snapshot.underfilled?.cancelledAt
      ? formatTimeInBangkok(snapshot.underfilled.cancelledAt)
      : "";
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
    ? groupMessages.reviewPartialStart
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
      {description ? (
        <Text className={styles.statusDescription}>{description}</Text>
      ) : null}
      {cancelled && cancellationDate && cancellationTime ? (
        <Text className={styles.statusDescription}>
          {groupMessages.cancelledAt(cancellationDate, cancellationTime)}
        </Text>
      ) : null}
      {isUnderfilled && snapshot.underfilled ? (
        <Text className={styles.statusDescription}>
          {groupMessages.workerHeadcountJoined(
            snapshot.underfilled.activeWorkerCount,
            snapshot.underfilled.headcount
          )}
        </Text>
      ) : null}
      {isUnderfilled && underfilledRemaining !== null ? (
        <Text
          accessibilityLabel={`${snapshot.nextAction === QuestNextAction.DECIDE_UNDERFILLED ? groupMessages.timeRemaining : groupMessages.respondWithin}: ${formatCountdown(underfilledRemaining)}`}
          accessibilityLiveRegion={
            underfilledRemaining === 0 ||
            Math.floor(underfilledRemaining / 60_000) !==
              Math.floor((underfilledRemaining + 1_000) / 60_000)
              ? "polite"
              : "none"
          }
          className={styles.statusDescription}
          testID={`${testID}-countdown`}
        >
          {`${snapshot.nextAction === QuestNextAction.DECIDE_UNDERFILLED ? groupMessages.timeRemaining : groupMessages.respondWithin}: ${formatCountdown(underfilledRemaining)}`}
        </Text>
      ) : null}
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

export function GroupQuestEntrySurfaces({
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
  const { colors } = useAppTheme();
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
      : underfilledCancellationDescription(messages, null, false, isHirer);

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
          {team && teamStatus !== QuestTeamStatus.TEAM_FORMING ? (
            <Text className={styles.statusDescription}>
              {messages.lockedDescription}
            </Text>
          ) : null}
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
            testID="quest-open-partial-start"
          >
            <Text className={styles.statusActionText}>
              {messages.reviewPartialStart}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );
}
