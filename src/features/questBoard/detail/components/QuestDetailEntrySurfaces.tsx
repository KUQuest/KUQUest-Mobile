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
  QuestMode,
  QuestNextAction,
  QuestParticipation,
  QuestUnderfilledConsentDecision,
  QuestUnderfilledState,
} from "../../domain/types";
import styles from "../../styles/questDetailStyles";

export function LiveEntrySurface({
  snapshot,
  locale,
  groupMessages,
  busy = false,
  hideTeamEntry = false,
  onOpenTeam,
  onOpenCandidateReview,
  onOpenPartialConsent,
}: {
  snapshot: LiveQuestSnapshot;
  groupMessages: GroupQuestMessages;
  locale: "en" | "th";
  busy?: boolean;
  hideTeamEntry?: boolean;
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
    snapshot.mode === QuestMode.CANDIDATE;
  const isHirer = isHirerActor(snapshot.actor);
  const cancelled =
    snapshot.underfilled?.state === QuestUnderfilledState.UNDERFILLED_CANCELLED;
  const isUnderfilled =
    cancelled ||
    snapshot.nextAction === QuestNextAction.DECIDE_UNDERFILLED ||
    snapshot.nextAction === QuestNextAction.CONSENT_UNDERFILLED;
  const shouldRender =
    isUnderfilled ||
    (!hideTeamEntry &&
      isGroupCandidate &&
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
        : snapshot.team
          ? groupMessages.roster
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
