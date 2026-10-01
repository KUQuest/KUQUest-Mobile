import { useEffect, useMemo, useRef } from "react";
import {
  Check,
  CircleAlert,
  CircleX,
  Clock3,
  UsersRound,
} from "lucide-react-native";
import {
  formatCountdown,
  useServerCountdown,
} from "@/features/questBoard/shared/useServerCountdown";

import { ActivityIndicator, Pressable, ScrollView, Text, View } from "@/tw";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { useLocale } from "@/features/preferences/localeStore";
import type { SupportedLocale } from "@/locales/locale";
import {
  groupQuestMessages,
  underfilledCancellationDescription,
} from "@/locales/groupQuestMessages";
import { formatTimestampDate, formatTimeInBangkok } from "@/domain/datetime";
import { formatSatang } from "@/domain/satang";
import {
  QuestActor,
  QuestPartialStartConsentStatus,
  QuestPartialStartVoteStatus,
  QuestUnderfilledConsentDecision,
  QuestUnderfilledDecision,
  QuestUnderfilledState,
  type QuestPartialStartConsent,
} from "../../domain/types";
import type { QuestV2Underfilled } from "@/api/questV2Contracts";
import type { PartialGroupStartVoter } from "../types";
import styles from "../groupQuestStyles";

export type PartialGroupStartSurfaceState =
  "ready" | "loading" | "error" | "empty";

export interface PartialGroupStartConsentContentProps {
  consent?: QuestPartialStartConsent | null;
  /** Canonical v2 underfilled projection. Legacy consent remains supported for fixtures. */
  underfilled?: QuestV2Underfilled | null;
  voters?: readonly PartialGroupStartVoter[];
  hirerId?: string;
  questTitle?: string;
  requestedHeadcount?: number;
  actualHeadcount?: number;
  viewerId?: string;
  canRespond?: boolean;
  canDecide?: boolean;
  canConsent?: boolean;
  onHirerDecision?: (decision: QuestUnderfilledDecision) => void;
  onWorkerConsent?: (decision: QuestUnderfilledConsentDecision) => void;
  splitRewardSatang?: number;
  originalRewardSatang?: number;
  originalDueAt?: string | null;
  surfaceState?: PartialGroupStartSurfaceState;
  loading?: boolean;
  error?: string;
  onVote?: (approve: boolean) => void;
  onApprove?: () => void;
  onReject?: () => void;
  onRetry?: () => void;
  onExpire?: () => void;
  onOpenWorkHub?: () => void;
  onBrowseQuests?: () => void;
  onOpenQuest?: () => void;
  locale?: SupportedLocale;
}

const EMPTY_VOTER_IDS: readonly string[] = [];

function initialsFor(value: string): string {
  const words = value
    .replace(/[-_]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function getMessages(locale: SupportedLocale) {
  return groupQuestMessages[locale];
}

function LoadingState({ label }: { label: string }) {
  const { colors } = useAppTheme();
  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      className={styles.emptyState}
      testID="partial-group-start-loading"
    >
      <ActivityIndicator color={colors.primary} size="large" />
      <Text className={styles.emptyTitle}>{label}</Text>
    </View>
  );
}

function ErrorState({
  message,
  retryLabel,
  onRetry,
}: {
  message: string;
  retryLabel: string;
  onRetry?: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      accessibilityRole="alert"
      className={`${styles.notice} ${styles.noticeDanger}`}
      testID="partial-group-start-error"
    >
      <View className={`${styles.noticeIcon} ${styles.noticeIconDanger}`}>
        <CircleAlert color={colors.dangerDark} size={18} strokeWidth={2.1} />
      </View>
      <View className={styles.noticeCopy}>
        <Text className={styles.noticeTitle}>{message}</Text>
        {onRetry ? (
          <Pressable
            accessibilityLabel={retryLabel}
            accessibilityRole="button"
            className={styles.retryButton}
            onPress={onRetry}
            testID="partial-group-start-retry"
          >
            <Text className={styles.retryButtonText}>{retryLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function PartialGroupStartConsentContent({
  consent = null,
  underfilled = null,
  voters = [],
  hirerId,
  requestedHeadcount,
  actualHeadcount,
  viewerId,
  canRespond = true,
  canDecide = false,
  canConsent = false,
  onHirerDecision,
  onWorkerConsent,
  splitRewardSatang,
  originalRewardSatang,
  originalDueAt,
  surfaceState = "ready",
  loading = false,
  error,
  onVote,
  onApprove,
  onReject,
  onRetry,
  onExpire,
  onOpenWorkHub,
  onBrowseQuests,
  onOpenQuest,
  locale: localeProp,
}: PartialGroupStartConsentContentProps) {
  const { colors } = useAppTheme();
  const contextLocale = useLocale().locale;
  const locale = localeProp ?? contextLocale;
  const messages = getMessages(locale);
  const expiredDeadline = useRef<string | null>(null);

  const voterMap = useMemo(
    () => new Map(voters.map((voter) => [voter.id, voter])),
    [voters]
  );
  const underfilledResponses = underfilled?.responses;
  const hasUnderfilled = Boolean(underfilled);
  const consentFrozenWorkerIds = consent?.frozenWorkerIds;
  const consentRequiredVoterIds = consent?.requiredVoterIds;
  const ownResponse = underfilled?.ownResponse;
  const ownResponseBelongsToViewer = Boolean(
    viewerId &&
    ownResponse &&
    (!ownResponse.workerId || ownResponse.workerId === viewerId)
  );
  const frozenWorkerIds = useMemo(() => {
    const ids = underfilledResponses
      ? underfilledResponses.map((response) => response.workerId)
      : [...(consentFrozenWorkerIds ?? EMPTY_VOTER_IDS)];
    return ownResponseBelongsToViewer && viewerId && !ids.includes(viewerId)
      ? [...ids, viewerId]
      : ids;
  }, [
    consentFrozenWorkerIds,
    ownResponseBelongsToViewer,
    underfilledResponses,
    viewerId,
  ]);
  const requiredVoterIds = useMemo(
    () =>
      hasUnderfilled
        ? frozenWorkerIds
        : (consentRequiredVoterIds ?? EMPTY_VOTER_IDS),
    [consentRequiredVoterIds, frozenWorkerIds, hasUnderfilled]
  );
  const requiredVoters = useMemo(
    () =>
      requiredVoterIds.map((id) => {
        const provided = voterMap.get(id);
        const role = provided?.role ?? (id === hirerId ? "HIRER" : "WORKER");
        return { id, displayName: provided?.displayName ?? id, role };
      }),
    [hirerId, requiredVoterIds, voterMap]
  );
  const responseMap = useMemo(() => {
    if (underfilled) {
      const responses = new Map(
        (underfilled.responses ?? []).map((response) => [
          response.workerId,
          response.decision === QuestUnderfilledConsentDecision.ACCEPT
            ? QuestPartialStartVoteStatus.PARTIAL_START_VOTE_APPROVED
            : response.decision === QuestUnderfilledConsentDecision.DECLINE
              ? QuestPartialStartVoteStatus.PARTIAL_START_VOTE_REJECTED
              : undefined,
        ])
      );
      if (ownResponseBelongsToViewer && viewerId && ownResponse) {
        responses.set(
          ownResponse.workerId ?? viewerId,
          ownResponse.decision === QuestUnderfilledConsentDecision.ACCEPT
            ? QuestPartialStartVoteStatus.PARTIAL_START_VOTE_APPROVED
            : ownResponse.decision === QuestUnderfilledConsentDecision.DECLINE
              ? QuestPartialStartVoteStatus.PARTIAL_START_VOTE_REJECTED
              : undefined
        );
      }
      return responses;
    }
    return new Map(
      (consent?.responses ?? []).map((response) => [
        response.voterId,
        response.status,
      ])
    );
  }, [
    consent?.responses,
    ownResponse,
    ownResponseBelongsToViewer,
    underfilled,
    viewerId,
  ]);
  const decisionPending =
    underfilled?.state === QuestUnderfilledState.UNDERFILLED_DECISION_PENDING;
  const consentPending =
    underfilled?.state === QuestUnderfilledState.UNDERFILLED_CONSENT_PENDING;
  const deadlineAt = underfilled
    ? decisionPending
      ? underfilled.decision.expiresAt
      : underfilled.consent.expiresAt
    : consent?.responseDeadlineAt;
  const countdown = useServerCountdown(deadlineAt);
  const remaining = countdown ?? 0;
  const expired = countdown === 0 && Boolean(deadlineAt);
  useEffect(() => {
    if (!expired || !deadlineAt || expiredDeadline.current === deadlineAt)
      return;
    expiredDeadline.current = deadlineAt;
    onExpire?.();
  }, [deadlineAt, expired, onExpire]);
  const requested =
    underfilled?.headcount ??
    requestedHeadcount ??
    consent?.frozenWorkerIds.length ??
    0;
  const actual =
    underfilled?.activeWorkerCount ??
    actualHeadcount ??
    consent?.frozenWorkerIds.length ??
    0;
  const newRewardSatang =
    splitRewardSatang ??
    (underfilled?.questReward !== null && underfilled?.questReward !== undefined
      ? Math.round(underfilled.questReward * 100)
      : undefined);
  const duration = underfilled
    ? 10 * 60 * 1000
    : consent
      ? Math.max(
          1,
          new Date(consent.responseDeadlineAt).getTime() -
            new Date(consent.requestedAt).getTime()
        )
      : 1;
  const progress = Math.max(0, Math.min(100, (remaining / duration) * 100));
  const derivedApproved = underfilled
    ? underfilled.consent.acceptedCount
    : requiredVoters.filter(
        (voter) =>
          responseMap.get(voter.id) ===
          QuestPartialStartVoteStatus.PARTIAL_START_VOTE_APPROVED
      ).length;
  const approvedCount = Math.max(
    underfilled?.consent.acceptedCount ?? consent?.approvedVoterCount ?? 0,
    derivedApproved
  );
  const requiredCount =
    underfilled?.consent.totalCount ??
    consent?.requiredVoterCount ??
    requiredVoters.length;
  const currentResponse = viewerId ? responseMap.get(viewerId) : undefined;
  const canVote =
    Boolean(
      consent &&
      consent.status === QuestPartialStartConsentStatus.PARTIAL_START_PENDING &&
      remaining > 0 &&
      canRespond &&
      (!viewerId || consent.requiredVoterIds.includes(viewerId)) &&
      !currentResponse
    ) ||
    Boolean(
      underfilled &&
      consentPending &&
      remaining > 0 &&
      canConsent &&
      viewerId &&
      frozenWorkerIds.includes(viewerId) &&
      !currentResponse
    );

  const vote = (approve: boolean) => {
    if (!canVote) return;
    if (underfilled && onWorkerConsent)
      onWorkerConsent(
        approve
          ? QuestUnderfilledConsentDecision.ACCEPT
          : QuestUnderfilledConsentDecision.DECLINE
      );
    else if (onVote) onVote(approve);
    else if (approve) onApprove?.();
    else onReject?.();
  };
  const decide = (decision: QuestUnderfilledDecision) => {
    if (underfilled && decisionPending && canDecide && remaining > 0)
      onHirerDecision?.(decision);
  };

  const terminal = underfilled
    ? underfilled.state === QuestUnderfilledState.UNDERFILLED_COMPLETED
      ? "approved"
      : underfilled.state === QuestUnderfilledState.UNDERFILLED_CANCELLED
        ? "cancelled"
        : "pending"
    : consent?.status === QuestPartialStartConsentStatus.PARTIAL_START_APPROVED
      ? "approved"
      : consent?.status ===
            QuestPartialStartConsentStatus.PARTIAL_START_REJECTED ||
          consent?.status ===
            QuestPartialStartConsentStatus.PARTIAL_START_TIMED_OUT
        ? "cancelled"
        : "pending";
  const terminalDescription = underfilled
    ? underfilledCancellationDescription(
        messages,
        underfilled.cancellationReason,
        ownResponse?.decision === QuestUnderfilledConsentDecision.DECLINE,
        Boolean(viewerId && hirerId && viewerId === hirerId)
      )
    : consent?.status === QuestPartialStartConsentStatus.PARTIAL_START_TIMED_OUT
      ? messages.timedOutDescription
      : messages.genericCancellation;
  const cancellationDate = underfilled?.cancelledAt
    ? formatTimestampDate(underfilled.cancelledAt, locale)
    : undefined;
  const cancellationTime = underfilled?.cancelledAt
    ? formatTimeInBangkok(underfilled.cancelledAt)
    : "";
  const content =
    loading || surfaceState === "loading" ? (
      <LoadingState label={messages.loading} />
    ) : surfaceState === "error" || error ? (
      <ErrorState
        message={error ?? messages.errorTitle}
        onRetry={onRetry}
        retryLabel={messages.retry}
      />
    ) : (!consent && !underfilled) ||
      surfaceState === "empty" ||
      Boolean(
        underfilled &&
        underfilled.activeWorkerCount >= underfilled.headcount &&
        terminal === "pending"
      ) ? (
      <View className={styles.emptyState} testID="partial-group-start-empty">
        <View className={styles.emptyIcon}>
          <Clock3 color={colors.primary} size={26} strokeWidth={1.9} />
        </View>
        <Text accessibilityRole="header" className={styles.emptyTitle}>
          {messages.nothingToRespond}
        </Text>
        {onOpenQuest ? (
          <Pressable
            accessibilityRole="button"
            className={`${styles.consentAction} ${styles.consentActionApprove}`}
            onPress={onOpenQuest}
          >
            <Text
              className={`${styles.consentActionText} ${styles.consentActionTextApprove}`}
            >
              {messages.backToQuest}
            </Text>
          </Pressable>
        ) : null}
      </View>
    ) : (
      <ScrollView
        className={styles.sheetScroll}
        contentContainerClassName={styles.sheetContent}
        showsVerticalScrollIndicator={false}
        testID="partial-group-start-scroll"
      >
        {terminal !== "pending" ? (
          <>
            <View
              className={`${styles.consentStatusCard} ${terminal === "approved" ? styles.consentStatusCardApproved : styles.consentStatusCardCancelled}`}
              testID={`partial-group-start-${terminal}`}
            >
              <View className={styles.consentStatusHeader}>
                <View
                  className={`${styles.consentStatusIcon} ${terminal === "cancelled" ? styles.consentStatusIconCancelled : ""}`}
                >
                  {terminal === "approved" ? (
                    <Check color={colors.success} size={20} strokeWidth={2.6} />
                  ) : (
                    <CircleX
                      color={colors.dangerDark}
                      size={20}
                      strokeWidth={2.2}
                    />
                  )}
                </View>
                <View className={styles.consentStatusCopy}>
                  <Text
                    accessibilityRole="header"
                    className={styles.consentStatusTitle}
                  >
                    {terminal === "approved"
                      ? messages.questAssignedNext
                      : messages.cancelledTitle}
                  </Text>
                  <Text className={styles.consentStatusDescription}>
                    {terminal === "approved"
                      ? messages.approvedDescription(actual)
                      : terminalDescription}
                  </Text>
                  {terminal === "cancelled" &&
                  cancellationDate &&
                  cancellationTime ? (
                    <Text className={styles.consentStatusDescription}>
                      {messages.cancelledAt(cancellationDate, cancellationTime)}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
            {terminal === "approved" && onOpenWorkHub ? (
              <Pressable
                accessibilityRole="button"
                className={`${styles.consentAction} ${styles.consentActionApprove}`}
                onPress={onOpenWorkHub}
              >
                <Text
                  className={`${styles.consentActionText} ${styles.consentActionTextApprove}`}
                >
                  {messages.assignedOpenWorkHub}
                </Text>
              </Pressable>
            ) : terminal === "cancelled" && onBrowseQuests ? (
              <Pressable
                accessibilityRole="button"
                className={`${styles.consentAction} ${styles.consentActionApprove}`}
                onPress={onBrowseQuests}
              >
                <Text
                  className={`${styles.consentActionText} ${styles.consentActionTextApprove}`}
                >
                  {messages.browseOtherQuests}
                </Text>
              </Pressable>
            ) : null}
          </>
        ) : null}

        <View
          accessibilityLabel={`${messages.requestedHeadcount}: ${requested}. ${messages.actualHeadcount}: ${actual}`}
          className={styles.proposalSummary}
          testID="partial-group-start-summary"
        >
          <View className={styles.reviewHeader}>
            <View className={styles.reviewIcon}>
              <UsersRound color={colors.primary} size={20} strokeWidth={2.1} />
            </View>
            <View className={styles.reviewHeaderCopy}>
              <Text
                accessibilityRole="header"
                className={styles.proposalSummaryTitle}
              >
                {messages.partialDetailsChanged}
              </Text>
              <Text className={styles.reviewCopy}>
                {decisionPending
                  ? messages.hirerDecisionPending
                  : messages.workerResponseRequired}
              </Text>
              <Text className={styles.reviewCopy}>
                {messages.workerHeadcountJoined(actual, requested)}
              </Text>
            </View>
          </View>
          <View className={styles.reviewRows}>
            <View className={styles.reviewRow}>
              <Text className={styles.reviewLabel}>
                {messages.requestedHeadcount}
              </Text>
              <Text className={styles.reviewValue}>{requested}</Text>
            </View>
            <View className={styles.reviewRow}>
              <Text className={styles.reviewLabel}>
                {messages.actualHeadcount}
              </Text>
              <Text className={styles.reviewValue}>{actual}</Text>
            </View>
          </View>
          {underfilled ? (
            <>
              {newRewardSatang !== undefined ? (
                <View className={styles.reviewRow}>
                  <Text className={styles.reviewLabel}>
                    {messages.newRewardPerWorker}
                  </Text>
                  <Text selectable className={styles.reviewValue}>
                    {originalRewardSatang !== undefined
                      ? `${formatSatang(originalRewardSatang, locale)} → `
                      : ""}
                    {formatSatang(newRewardSatang, locale)}
                  </Text>
                </View>
              ) : null}
              {underfilled.dueAt ? (
                <View className={styles.reviewRow}>
                  <Text className={styles.reviewLabel}>{messages.dueDate}</Text>
                  <Text selectable className={styles.reviewValue}>
                    {originalDueAt
                      ? `${formatTimestampDate(originalDueAt, locale)} ${formatTimeInBangkok(originalDueAt)} → `
                      : ""}
                    {formatTimestampDate(underfilled.dueAt, locale)}{" "}
                    {formatTimeInBangkok(underfilled.dueAt)}
                  </Text>
                </View>
              ) : null}
            </>
          ) : null}
        </View>

        <View
          accessibilityRole={
            expired && terminal === "pending" ? "alert" : undefined
          }
          className={styles.countdownCard}
          testID="partial-group-start-countdown"
        >
          <Text className={styles.countdownLabel}>
            {decisionPending ? messages.timeRemaining : messages.respondWithin}
          </Text>
          {expired && terminal === "pending" ? (
            <Text className={styles.countdownValue}>
              {messages.timeUpChecking}
            </Text>
          ) : (
            <Text
              accessibilityLiveRegion={
                expired ||
                (countdown !== null &&
                  Math.floor(countdown / 60_000) !==
                    Math.floor((countdown + 1_000) / 60_000))
                  ? "polite"
                  : "none"
              }
              accessibilityLabel={`${decisionPending ? messages.timeRemaining : messages.respondWithin}: ${formatCountdown(remaining)}`}
              className={styles.countdownValue}
            >
              {formatCountdown(remaining)}
            </Text>
          )}
        </View>
        {decisionPending ? (
          <>
            <Text className={styles.reviewCopy}>
              {messages.proceedConsequence}
            </Text>
            <Text className={styles.reviewCopy}>
              {messages.cancelConsequence}
            </Text>
          </>
        ) : underfilled ? (
          <>
            <Text className={styles.reviewCopy}>
              {messages.acceptingWaitsForEveryone}
            </Text>
            <Text className={styles.reviewCopy}>
              {messages.decliningCancelsForEveryone}
            </Text>
            {currentResponse ===
            QuestPartialStartVoteStatus.PARTIAL_START_VOTE_APPROVED ? (
              <Text accessibilityRole="alert" className={styles.reviewCopy}>
                {messages.acceptedWaiting(underfilled.consent.pendingCount)}
              </Text>
            ) : null}
          </>
        ) : null}
        {terminal === "pending" ? (
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: progress }}
            className={styles.progressTrack}
          >
            <View
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </View>
        ) : null}

        <View
          className={styles.voterSection}
          testID="partial-group-start-roster"
        >
          <View className={styles.sectionHeader}>
            <Text accessibilityRole="header" className={styles.sectionTitle}>
              {messages.frozenRoster}
            </Text>
            <Text className={styles.sectionMeta}>
              {decisionPending
                ? messages.workerHeadcountJoined(actual, requested)
                : underfilled
                  ? messages.workersAcceptedProgress(
                      approvedCount,
                      requiredCount
                    )
                  : messages.votesProgress(approvedCount, requiredCount)}
            </Text>
          </View>
          <View className={styles.voterList}>
            {frozenWorkerIds.map((workerId) => {
              const voter = requiredVoters.find(
                (candidate) => candidate.id === workerId
              );
              return voter ? (
                <VoterRow
                  key={workerId}
                  labels={messages}
                  response={responseMap.get(workerId)}
                  voter={voter}
                />
              ) : null;
            })}
          </View>
        </View>

        {!decisionPending ? (
          <View
            className={styles.voterSection}
            testID="partial-group-start-votes"
          >
            <View className={styles.sectionHeader}>
              <Text accessibilityRole="header" className={styles.sectionTitle}>
                {messages.voteStatus}
              </Text>
              <Text className={styles.sectionMeta}>
                {underfilled
                  ? messages.workersAcceptedProgress(
                      approvedCount,
                      requiredCount
                    )
                  : messages.votesProgress(approvedCount, requiredCount)}
              </Text>
            </View>
            <View className={styles.voterList}>
              {requiredVoters.map((voter) => (
                <VoterRow
                  key={voter.id}
                  labels={messages}
                  response={responseMap.get(voter.id)}
                  voter={voter}
                />
              ))}
            </View>
          </View>
        ) : null}

        {terminal === "pending" ? (
          <View className={styles.chatHint}>
            <Clock3 color={colors.primary} size={17} strokeWidth={2} />
            <Text className={styles.chatHintText}>
              {messages.chatWritableHint}
            </Text>
          </View>
        ) : null}
        {decisionPending && canDecide && onHirerDecision && !expired ? (
          <View
            className={styles.consentActions}
            testID="partial-group-start-hirer-decision"
          >
            <Pressable
              accessibilityLabel={messages.proceedLabel}
              accessibilityRole="button"
              className={`${styles.consentAction} ${styles.consentActionApprove}`}
              onPress={() => decide(QuestUnderfilledDecision.PROCEED)}
              testID="partial-group-start-proceed"
            >
              <Check color={colors.onPrimary} size={17} strokeWidth={2.7} />
              <Text
                className={`${styles.consentActionText} ${styles.consentActionTextApprove}`}
              >
                {messages.proceed}
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel={messages.cancelQuest}
              accessibilityRole="button"
              className={`${styles.consentAction} ${styles.consentActionReject}`}
              onPress={() => decide(QuestUnderfilledDecision.CANCEL)}
              testID="partial-group-start-cancel"
            >
              <CircleX color={colors.dangerDark} size={17} strokeWidth={2.2} />
              <Text
                className={`${styles.consentActionText} ${styles.consentActionTextReject}`}
              >
                {messages.cancel}
              </Text>
            </Pressable>
          </View>
        ) : canVote ? (
          <View
            className={styles.consentActions}
            testID="partial-group-start-worker-consent"
          >
            <Pressable
              accessibilityLabel={messages.accept}
              accessibilityRole="button"
              className={`${styles.consentAction} ${styles.consentActionApprove}`}
              onPress={() => vote(true)}
              testID="partial-group-start-approve"
            >
              <Check color={colors.onPrimary} size={17} strokeWidth={2.7} />
              <Text
                className={`${styles.consentActionText} ${styles.consentActionTextApprove}`}
              >
                {messages.accept}
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel={messages.decline}
              accessibilityRole="button"
              className={`${styles.consentAction} ${styles.consentActionReject}`}
              onPress={() => vote(false)}
              testID="partial-group-start-reject"
            >
              <CircleX color={colors.dangerDark} size={17} strokeWidth={2.2} />
              <Text
                className={`${styles.consentActionText} ${styles.consentActionTextReject}`}
              >
                {messages.decline}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    );

  return content;
}

function VoterRow({
  voter,
  response,
  labels,
}: {
  voter: PartialGroupStartVoter;
  response?:
    QuestPartialStartConsent["responses"][number] | QuestPartialStartVoteStatus;
  labels: ReturnType<typeof getMessages>;
}) {
  const responseStatus =
    typeof response === "string" ? response : response?.status;
  const approved =
    responseStatus === QuestPartialStartVoteStatus.PARTIAL_START_VOTE_APPROVED;
  const rejected =
    responseStatus === QuestPartialStartVoteStatus.PARTIAL_START_VOTE_REJECTED;
  const statusLabel = approved
    ? labels.approvedVote
    : rejected
      ? labels.rejectedVote
      : labels.pendingVote;
  return (
    <View
      accessibilityLabel={`${voter.displayName}. ${voter.role === QuestActor.HIRER ? labels.hirer : labels.worker}. ${statusLabel}`}
      className={styles.voterRow}
      testID={`partial-group-start-voter-${voter.id}`}
    >
      <View className={styles.voterAvatar}>
        <Text className={styles.voterAvatarText}>
          {initialsFor(voter.displayName)}
        </Text>
      </View>
      <View className={styles.voterCopy}>
        <Text className={styles.voterName} numberOfLines={1}>
          {voter.displayName}
        </Text>
        <Text className={styles.voterRole}>
          {voter.role === QuestActor.HIRER ? labels.hirer : labels.worker}
        </Text>
      </View>
      <Text
        className={`${styles.voterStatus} ${approved ? styles.voterStatusApproved : rejected ? styles.voterStatusRejected : styles.voterStatusPending}`}
      >
        {statusLabel}
      </Text>
    </View>
  );
}

PartialGroupStartConsentContent.displayName = "PartialGroupStartConsentContent";
