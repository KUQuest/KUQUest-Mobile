import React, { useEffect, useMemo, useState } from 'react';
import { Check, CircleAlert, CircleX, Clock3, UsersRound } from 'lucide-react-native';

import { ActivityIndicator, Pressable, ScrollView, Text, View } from '@/tw';
import { useLocale, type SupportedLocale } from '@/locales/LocaleProvider';
import { groupQuestMessages } from '@/locales/groupQuestMessages';
import { colors } from '@/theme/colors';
import { QuestPartialStartConsentStatus, QuestPartialStartVoteStatus, type QuestPartialStartConsent } from '../types';
import styles from './groupQuestStyles';
import { QuestBottomSheet } from './QuestBottomSheet';
import { questWorkflow } from '../questWorkflow';

export interface PartialGroupStartVoter {
  id: string;
  displayName: string;
  role: 'HIRER' | 'WORKER';
}

export type PartialGroupStartSurfaceState = 'ready' | 'loading' | 'error' | 'empty';

export interface PartialGroupStartConsentSheetProps {
  visible: boolean;
  consent?: QuestPartialStartConsent | null;
  voters?: readonly PartialGroupStartVoter[];
  hirerId?: string;
  questTitle?: string;
  requestedHeadcount?: number;
  actualHeadcount?: number;
  viewerId?: string;
  canRespond?: boolean;
  now?: Date;
  surfaceState?: PartialGroupStartSurfaceState;
  loading?: boolean;
  error?: string;
  onVote?: (approve: boolean) => void;
  onApprove?: () => void;
  onReject?: () => void;
  onRetry?: () => void;
  onClose: () => void;
  bottomInset?: number;
  locale?: SupportedLocale;
}

function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function initialsFor(value: string): string {
  const words = value.replace(/[-_]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase() ?? '').join('');
}

function getMessages(locale: SupportedLocale) {
  return groupQuestMessages[locale];
}

function LoadingState({ label }: { label: string }) {
  return (
    <View accessibilityLabel={label} accessibilityRole="progressbar" className={styles.emptyState} testID="partial-group-start-loading">
      <ActivityIndicator color={colors.primary} size="large" />
      <Text className={styles.emptyTitle}>{label}</Text>
    </View>
  );
}

function ErrorState({ message, retryLabel, onRetry }: { message: string; retryLabel: string; onRetry?: () => void }) {
  return (
    <View accessibilityRole="alert" className={`${styles.notice} ${styles.noticeDanger}`} testID="partial-group-start-error">
      <View className={`${styles.noticeIcon} ${styles.noticeIconDanger}`}><CircleAlert color={colors.dangerDark} size={18} strokeWidth={2.1} /></View>
      <View className={styles.noticeCopy}>
        <Text className={styles.noticeTitle}>{message}</Text>
        {onRetry ? <Pressable accessibilityLabel={retryLabel} accessibilityRole="button" className={styles.retryButton} onPress={onRetry} testID="partial-group-start-retry"><Text className={styles.retryButtonText}>{retryLabel}</Text></Pressable> : null}
      </View>
    </View>
  );
}

export function PartialGroupStartConsentSheet({
  visible,
  consent = null,
  voters = [],
  hirerId,
  questTitle,
  requestedHeadcount,
  actualHeadcount,
  viewerId,
  canRespond = true,
  now,
  surfaceState = 'ready',
  loading = false,
  error,
  onVote,
  onApprove,
  onReject,
  onRetry,
  onClose,
  bottomInset,
  locale: localeProp,
}: PartialGroupStartConsentSheetProps) {
  const contextLocale = useLocale().locale;
  const locale = localeProp ?? contextLocale;
  const messages = getMessages(locale);
  const [workflowRevision, setWorkflowRevision] = useState(0);
  useEffect(() => {
    if (!visible || consent?.status !== QuestPartialStartConsentStatus.PARTIAL_START_PENDING) return undefined;
    return questWorkflow.subscribe(() => setWorkflowRevision((revision) => revision + 1));
  }, [consent?.id, consent?.status, visible]);
  void workflowRevision;
  const clock = questWorkflow.getNow(now).getTime();

  const voterMap = useMemo(() => new Map(voters.map((voter) => [voter.id, voter])), [voters]);
  const requiredVoters = useMemo(() => {
    if (!consent) return [];
    return consent.requiredVoterIds.map((id) => {
      const provided = voterMap.get(id);
      const role = provided?.role ?? (id === hirerId ? 'HIRER' : consent.frozenWorkerIds.includes(id) ? 'WORKER' : id === consent.requiredVoterIds[0] ? 'HIRER' : 'WORKER');
      return { id, displayName: provided?.displayName ?? id, role };
    });
  }, [consent, hirerId, voterMap]);
  const responseMap = useMemo(() => new Map((consent?.responses ?? []).map((response) => [response.voterId, response])), [consent?.responses]);
  const deadline = consent ? new Date(consent.responseDeadlineAt).getTime() : Number.NaN;
  const remaining = Number.isFinite(deadline) ? Math.max(0, deadline - clock) : 0;
  const duration = consent ? Math.max(1, new Date(consent.responseDeadlineAt).getTime() - new Date(consent.requestedAt).getTime()) : 1;
  const progress = consent ? Math.max(0, Math.min(100, (remaining / duration) * 100)) : 0;
  const derivedApproved = requiredVoters.filter((voter) => responseMap.get(voter.id)?.status === QuestPartialStartVoteStatus.PARTIAL_START_VOTE_APPROVED).length;
  const approvedCount = Math.max(consent?.approvedVoterCount ?? 0, derivedApproved);
  const requiredCount = consent?.requiredVoterCount ?? requiredVoters.length;
  const frozenCount = consent?.frozenWorkerIds.length ?? 0;
  const requested = requestedHeadcount ?? frozenCount;
  const actual = actualHeadcount ?? frozenCount;
  const currentResponse = viewerId ? responseMap.get(viewerId) : undefined;
  const canVote = Boolean(
    consent
      && consent.status === QuestPartialStartConsentStatus.PARTIAL_START_PENDING
      && remaining > 0
      && canRespond
      && (!viewerId || consent.requiredVoterIds.includes(viewerId))
      && !currentResponse,
  );

  const vote = (approve: boolean) => {
    if (!canVote) return;
    if (onVote) onVote(approve);
    else if (approve) onApprove?.();
    else onReject?.();
  };

  const terminal = consent?.status === QuestPartialStartConsentStatus.PARTIAL_START_APPROVED
    ? 'approved'
    : consent?.status === QuestPartialStartConsentStatus.PARTIAL_START_REJECTED || consent?.status === QuestPartialStartConsentStatus.PARTIAL_START_TIMED_OUT
      ? 'cancelled'
      : 'pending';
  const terminalDescription = consent?.status === QuestPartialStartConsentStatus.PARTIAL_START_TIMED_OUT
    ? messages.timedOutDescription
    : messages.cancelledDescription;

  const content = loading || surfaceState === 'loading' ? (
    <LoadingState label={messages.loading} />
  ) : surfaceState === 'error' || error ? (
    <ErrorState message={error ?? messages.errorTitle} onRetry={onRetry} retryLabel={messages.retry} />
  ) : !consent || surfaceState === 'empty' ? (
    <View className={styles.emptyState} testID="partial-group-start-empty">
      <View className={styles.emptyIcon}><Clock3 color={colors.primary} size={26} strokeWidth={1.9} /></View>
      <Text className={styles.emptyTitle}>{messages.noConsent}</Text>
    </View>
  ) : (
    <ScrollView className={styles.sheetScroll} contentContainerClassName={styles.sheetContent} showsVerticalScrollIndicator={false} testID="partial-group-start-scroll">
      {terminal !== 'pending' ? (
        <View className={`${styles.consentStatusCard} ${terminal === 'approved' ? styles.consentStatusCardApproved : styles.consentStatusCardCancelled}`} testID={`partial-group-start-${terminal}`}>
          <View className={styles.consentStatusHeader}>
            <View className={`${styles.consentStatusIcon} ${terminal === 'cancelled' ? styles.consentStatusIconCancelled : ''}`}>
              {terminal === 'approved' ? <Check color={colors.success} size={20} strokeWidth={2.6} /> : <CircleX color={colors.dangerDark} size={20} strokeWidth={2.2} />}
            </View>
            <View className={styles.consentStatusCopy}>
              <Text accessibilityRole="header" className={styles.consentStatusTitle}>{terminal === 'approved' ? messages.approvedTitle : messages.cancelledTitle}</Text>
              <Text className={styles.consentStatusDescription}>{terminal === 'approved' ? messages.approvedDescription(actual) : terminalDescription}</Text>
            </View>
          </View>
        </View>
      ) : null}

      <View accessibilityLabel={`${messages.requestedHeadcount}: ${requested}. ${messages.actualHeadcount}: ${actual}`} className={styles.proposalSummary} testID="partial-group-start-summary">
        <View className={styles.reviewHeader}>
          <View className={styles.reviewIcon}><UsersRound color={colors.primary} size={20} strokeWidth={2.1} /></View>
          <View className={styles.reviewHeaderCopy}>
            <Text className={styles.proposalSummaryTitle}>{questTitle ?? messages.partialConsentTitle}</Text>
            <Text className={styles.reviewCopy}>{messages.partialConsentSubtitle}</Text>
          </View>
        </View>
        <View className={styles.reviewRows}>
          <View className={styles.reviewRow}><Text className={styles.reviewLabel}>{messages.requestedHeadcount}</Text><Text className={styles.reviewValue}>{requested}</Text></View>
          <View className={styles.reviewRow}><Text className={styles.reviewLabel}>{messages.actualHeadcount}</Text><Text className={styles.reviewValue}>{actual}</Text></View>
        </View>
      </View>

      <View className={styles.countdownCard} testID="partial-group-start-countdown">
        <Text className={styles.countdownLabel}>{messages.timeRemaining}</Text>
        <Text accessibilityLiveRegion="polite" accessibilityLabel={`${messages.timeRemaining}: ${formatCountdown(remaining)}`} className={styles.countdownValue}>{formatCountdown(remaining)}</Text>
      </View>
      {terminal === 'pending' ? <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: progress }} className={styles.progressTrack}><View className={styles.progressFill} style={{ width: `${progress}%` }} /></View> : null}

      <View className={styles.voterSection} testID="partial-group-start-roster">
        <View className={styles.sectionHeader}><Text accessibilityRole="header" className={styles.sectionTitle}>{messages.frozenRoster}</Text><Text className={styles.sectionMeta}>{messages.votesProgress(approvedCount, requiredCount)}</Text></View>
        <View className={styles.voterList}>
          {consent.frozenWorkerIds.map((workerId) => {
            const voter = requiredVoters.find((candidate) => candidate.id === workerId);
            return voter ? <VoterRow key={workerId} labels={messages} response={responseMap.get(workerId)} voter={voter} /> : null;
          })}
        </View>
      </View>

      <View className={styles.voterSection} testID="partial-group-start-votes">
        <View className={styles.sectionHeader}><Text accessibilityRole="header" className={styles.sectionTitle}>{messages.voteStatus}</Text><Text className={styles.sectionMeta}>{messages.votesProgress(approvedCount, requiredCount)}</Text></View>
        <View className={styles.voterList}>
          {requiredVoters.map((voter) => <VoterRow key={voter.id} labels={messages} response={responseMap.get(voter.id)} voter={voter} />)}
        </View>
      </View>

      {terminal === 'pending' ? <View className={styles.chatHint}><Clock3 color={colors.primary} size={17} strokeWidth={2} /><Text className={styles.chatHintText}>{messages.chatWritableHint}</Text></View> : null}
      {canVote ? (
        <View className={styles.consentActions}>
          <Pressable accessibilityLabel={messages.approveStart} accessibilityRole="button" className={`${styles.consentAction} ${styles.consentActionApprove}`} onPress={() => vote(true)} testID="partial-group-start-approve"><Check color={colors.white} size={17} strokeWidth={2.7} /><Text className={`${styles.consentActionText} ${styles.consentActionTextApprove}`}>{messages.approveStart}</Text></Pressable>
          <Pressable accessibilityLabel={messages.rejectStart} accessibilityRole="button" className={`${styles.consentAction} ${styles.consentActionReject}`} onPress={() => vote(false)} testID="partial-group-start-reject"><CircleX color={colors.dangerDark} size={17} strokeWidth={2.2} /><Text className={`${styles.consentActionText} ${styles.consentActionTextReject}`}>{messages.rejectStart}</Text></Pressable>
        </View>
      ) : null}
    </ScrollView>
  );

  return (
    <QuestBottomSheet
      bottomInset={bottomInset}
      closeLabel={messages.close}
      onClose={onClose}
      subtitle={messages.partialConsentSubtitle}
      testID="partial-group-start-consent-sheet"
      title={messages.partialConsentTitle}
      visible={visible}
    >
      {content}
    </QuestBottomSheet>
  );
}

function VoterRow({
  voter,
  response,
  labels,
}: {
  voter: PartialGroupStartVoter;
  response?: QuestPartialStartConsent['responses'][number];
  labels: ReturnType<typeof getMessages>;
}) {
  const approved = response?.status === QuestPartialStartVoteStatus.PARTIAL_START_VOTE_APPROVED;
  const rejected = response?.status === QuestPartialStartVoteStatus.PARTIAL_START_VOTE_REJECTED;
  const statusLabel = approved ? labels.approvedVote : rejected ? labels.rejectedVote : labels.pendingVote;
  return (
    <View accessibilityLabel={`${voter.displayName}. ${voter.role === 'HIRER' ? labels.hirer : labels.worker}. ${statusLabel}`} className={styles.voterRow} testID={`partial-group-start-voter-${voter.id}`}>
      <View className={styles.voterAvatar}><Text className={styles.voterAvatarText}>{initialsFor(voter.displayName)}</Text></View>
      <View className={styles.voterCopy}><Text className={styles.voterName} numberOfLines={1}>{voter.displayName}</Text><Text className={styles.voterRole}>{voter.role === 'HIRER' ? labels.hirer : labels.worker}</Text></View>
      <Text className={`${styles.voterStatus} ${approved ? styles.voterStatusApproved : rejected ? styles.voterStatusRejected : styles.voterStatusPending}`}>{statusLabel}</Text>
    </View>
  );
}

PartialGroupStartConsentSheet.displayName = 'PartialGroupStartConsentSheet';

export default PartialGroupStartConsentSheet;
