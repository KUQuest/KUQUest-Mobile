import { CircleUserRound, Clock3, UsersRound } from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import type { GroupQuestMessages } from "@/locales/groupQuestMessages";
import type { QuestBoardMessages } from "@/locales/questBoardMessages";
import type {
  LiveQuestNextAction,
  LiveQuestSnapshot,
} from "../../live/liveQuestService";
import {
  isHirerActor,
  QuestCandidateMode,
  QuestInvitationStatus,
  QuestNextAction,
  QuestPartialStartConsentStatus,
  QuestParticipation,
  QuestTeamStatus,
  type QuestDetailState,
} from "../../domain/types";
import styles from "../../styles/questDetailStyles";

function getNextActionLabel(
  action: LiveQuestNextAction,
  messages: QuestBoardMessages
): string {
  switch (action) {
    case QuestNextAction.JOIN:
      return messages.joinNow;
    case QuestNextAction.APPLY:
      return messages.applyNow;
    case QuestNextAction.WITHDRAW_APPLICATION:
      return messages.withdrawApplication;
    case QuestNextAction.CREATE_TEAM:
    case QuestNextAction.JOIN_TEAM:
    case QuestNextAction.SUBMIT_TEAM:
    case QuestNextAction.SELECT_CANDIDATE:
    case QuestNextAction.SELECT_TEAM:
      return messages.viewMyQuests;
    default:
      return messages.viewMyQuests;
  }
}

export function LiveEntrySurface({
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
  const { colors } = useAppTheme();
  const isGroupCandidate =
    snapshot.participation === QuestParticipation.GROUP &&
    snapshot.mode === QuestCandidateMode.CANDIDATE;
  const isHirer = isHirerActor(snapshot.actor);
  const isUnderfilled =
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
