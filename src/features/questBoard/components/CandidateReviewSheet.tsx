import React, { useMemo } from 'react';
import { Check, CircleAlert, CircleX, Clock3, UserRound, UsersRound } from 'lucide-react-native';

import { ActivityIndicator, Pressable, ScrollView, Text, View } from '@/tw';
import { useLocale, type SupportedLocale } from '@/locales/LocaleProvider';
import { groupQuestMessages } from '@/locales/groupQuestMessages';
import { colors } from '@/theme/colors';
import { formatSatang, QuestApplicationStatus, QuestTeamStatus, type QuestApplication, type QuestSettlementSummary, type QuestTeam, type QuestTeamMember } from '../types';
import styles from './groupQuestStyles';
import { QuestBottomSheet } from './QuestBottomSheet';

export interface CandidateReviewIdentity {
  id: string;
  displayName: string;
  detail?: string;
}

export interface CandidateReviewProposal {
  id: string;
  type?: 'individual' | 'team';
  kind?: 'individual' | 'team';
  status?: string;
  applicantId?: string;
  applicantName?: string;
  detail?: string;
  submittedAt?: string;
  teamId?: string;
  leaderId?: string;
  leaderName?: string;
  members?: readonly QuestTeamMember[];
}

export type CandidateReviewSurfaceState = 'ready' | 'loading' | 'error' | 'empty';

type NormalizedProposal = {
  id: string;
  type: 'individual' | 'team';
  status: string;
  displayName: string;
  detail: string;
  submittedAt?: string;
  members: readonly QuestTeamMember[];
};

export interface CandidateReviewSheetProps {
  visible: boolean;
  applications?: readonly QuestApplication[];
  teams?: readonly QuestTeam[];
  /** Optional display-ready records for callers that already have a proposal projection. */
  proposals?: readonly CandidateReviewProposal[];
  mode?: 'individual' | 'team';
  questTitle?: string;
  applicantDirectory?: readonly CandidateReviewIdentity[];
  teamMemberDirectory?: readonly CandidateReviewIdentity[];
  requestedHeadcount?: number;
  actualHeadcount?: number;
  rewardSatangPerWorker?: number;
  settlement?: QuestSettlementSummary;
  selectedProposalId?: string | null;
  surfaceState?: CandidateReviewSurfaceState;
  loading?: boolean;
  error?: string;
  onSelectProposal?: (proposalId: string) => void;
  onAcceptProposal?: (proposalId: string) => void;
  onRejectProposal?: (proposalId: string) => void;
  onAccept?: (proposalId: string) => void;
  onReject?: (proposalId: string) => void;
  onRetry?: () => void;
  onClose: () => void;
  bottomInset?: number;
  locale?: SupportedLocale;
}

function formatSubmittedAt(value: string | undefined, locale: SupportedLocale): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function StatusPill({ status, selected, rejected, labels }: { status: string; selected: boolean; rejected: boolean; labels: ReturnType<typeof getMessages> }) {
  const text = selected ? labels.selected : rejected ? labels.rejected : labels.submittedLabel;
  const foreground = selected ? colors.white : rejected ? colors.dangerDark : colors.primary;
  const background = selected ? colors.primary : rejected ? colors.surfaceDanger : colors.surfaceSuccess;
  const borderColor = selected ? colors.primary : rejected ? colors.borderDanger : colors.borderSuccess;
  return (
    <View className={styles.proposalRowStatus} style={{ backgroundColor: background, borderColor }} testID="candidate-review-proposal-status">
      {selected ? <Check color={foreground} size={13} strokeWidth={2.8} /> : rejected ? <CircleX color={foreground} size={13} strokeWidth={2.2} /> : <Clock3 color={foreground} size={13} strokeWidth={2.2} />}
      <Text className={styles.proposalRowStatusText} style={{ color: foreground }}>{text}</Text>
    </View>
  );
}

function getMessages(locale: SupportedLocale) {
  return groupQuestMessages[locale];
}

function proposalFromRecord(
  proposal: CandidateReviewProposal,
  identities: Map<string, CandidateReviewIdentity>,
  memberIdentities: Map<string, CandidateReviewIdentity>,
  labels: ReturnType<typeof getMessages>,
): NormalizedProposal {
  const type = proposal.type ?? proposal.kind ?? (proposal.teamId || proposal.members ? 'team' : 'individual');
  const memberList = proposal.members ?? [];
  if (type === 'team') {
    const leaderId = proposal.leaderId ?? memberList.find((member) => member.role === 'LEADER')?.workerId ?? proposal.teamId ?? proposal.id;
    const leaderName = proposal.leaderName ?? memberIdentities.get(leaderId)?.displayName ?? leaderId;
    return {
      id: proposal.id,
      type,
      status: proposal.status ?? QuestTeamStatus.TEAM_SUBMITTED,
      displayName: leaderName,
      detail: proposal.detail ?? `${labels.teamProposal} · ${labels.memberCount(memberList.length)}`,
      submittedAt: proposal.submittedAt,
      members: memberList,
    };
  }
  const applicantId = proposal.applicantId ?? proposal.id;
  return {
    id: proposal.id,
    type,
    status: proposal.status ?? QuestApplicationStatus.APPLICATION_APPLIED,
    displayName: proposal.applicantName ?? identities.get(applicantId)?.displayName ?? applicantId,
    detail: proposal.detail ?? identities.get(applicantId)?.detail ?? labels.individualProposal,
    submittedAt: proposal.submittedAt,
    members: [],
  };
}

function normalizeProposals({
  applications,
  teams,
  proposals,
  mode,
  applicantDirectory,
  teamMemberDirectory,
  messages,
}: Pick<CandidateReviewSheetProps, 'applications' | 'teams' | 'proposals' | 'mode' | 'applicantDirectory' | 'teamMemberDirectory'> & { messages: ReturnType<typeof getMessages> }): NormalizedProposal[] {
  const identities = new Map((applicantDirectory ?? []).map((identity) => [identity.id, identity]));
  const memberIdentities = new Map((teamMemberDirectory ?? applicantDirectory ?? []).map((identity) => [identity.id, identity]));
  if (proposals) return proposals
    .filter((proposal) => proposal.type !== 'team' && proposal.kind !== 'team' || proposal.status !== QuestTeamStatus.TEAM_FORMING)
    .map((proposal) => proposalFromRecord(proposal, identities, memberIdentities, messages));

  const applicationList = applications ?? [];
  const teamList = teams ?? [];
  const teamMode = mode === 'team' || teamList.length > 0 || applicationList.some((application) => Boolean(application.teamId));
  if (teamMode) {
    const teamApplications = new Map(applicationList.filter((application) => application.teamId).map((application) => [application.teamId as string, application]));
    const submittedTeams = teamList.filter((team) => team.status !== QuestTeamStatus.TEAM_FORMING);
    const submittedProposals: NormalizedProposal[] = submittedTeams.map<NormalizedProposal>((team) => {
      const application = teamApplications.get(team.id);
      const leaderName = team.members.find((member) => member.workerId === team.leaderId)?.displayName
        ?? memberIdentities.get(team.leaderId)?.displayName
        ?? team.leaderId;
      return {
        id: application?.id ?? team.proposalId ?? team.id,
        type: 'team',
        status: team.status,
        displayName: leaderName,
        detail: `${messages.teamProposal} · ${messages.memberCount(team.members.length)}`,
        submittedAt: application?.submittedAt ?? team.createdAt,
        members: team.members,
      };
    });
    if (teamList.length > 0) return submittedProposals;
    return submittedProposals.concat(applicationList.filter((application) => Boolean(application.teamId)).map<NormalizedProposal>((application) => ({
      id: application.id,
      type: 'team',
      status: application.status,
      displayName: application.teamId ?? application.id,
      detail: messages.teamProposal,
      submittedAt: application.submittedAt,
      members: [],
    })));

  }

  return applicationList.map((application) => ({
    id: application.id,
    type: 'individual' as const,
    status: application.status,
    displayName: application.applicantId ? identities.get(application.applicantId)?.displayName ?? application.applicantId : application.id,
    detail: application.applicantId ? identities.get(application.applicantId)?.detail ?? messages.individualProposal : messages.individualProposal,
    submittedAt: application.submittedAt,
    members: [],
  }));
}

function LoadingState({ label }: { label: string }) {
  return (
    <View accessibilityLabel={label} accessibilityRole="progressbar" className={styles.emptyState} testID="candidate-review-loading">
      <ActivityIndicator color={colors.primary} size="large" />
      <Text className={styles.emptyTitle}>{label}</Text>
    </View>
  );
}

function ErrorState({ message, retryLabel, onRetry }: { message: string; retryLabel: string; onRetry?: () => void }) {
  return (
    <View accessibilityRole="alert" className={`${styles.notice} ${styles.noticeDanger}`} testID="candidate-review-error">
      <View className={`${styles.noticeIcon} ${styles.noticeIconDanger}`}><CircleAlert color={colors.dangerDark} size={18} strokeWidth={2.1} /></View>
      <View className={styles.noticeCopy}>
        <Text className={styles.noticeTitle}>{message}</Text>
        {onRetry ? <Pressable accessibilityLabel={retryLabel} accessibilityRole="button" className={styles.retryButton} onPress={onRetry} testID="candidate-review-retry"><Text className={styles.retryButtonText}>{retryLabel}</Text></Pressable> : null}
      </View>
    </View>
  );
}

function ProposalRow({
  proposal,
  labels,
  locale,
  selected,
  onSelect,
  onAccept,
  onReject,
  memberIdentities,
}: {
  proposal: NormalizedProposal;
  labels: ReturnType<typeof getMessages>;
  locale: SupportedLocale;
  selected: boolean;
  onSelect?: (proposalId: string) => void;
  onAccept?: (proposalId: string) => void;
  onReject?: (proposalId: string) => void;
  memberIdentities: Map<string, CandidateReviewIdentity>;
}) {
  const rejected = proposal.status === QuestTeamStatus.TEAM_REJECTED || proposal.status === QuestApplicationStatus.APPLICATION_REJECTED;
  const statusSelected = proposal.status === QuestTeamStatus.TEAM_SELECTED || proposal.status === QuestApplicationStatus.APPLICATION_SELECTED;
  const canDecide = !rejected && !statusSelected && (proposal.type === 'team' ? proposal.status === QuestTeamStatus.TEAM_SUBMITTED : proposal.status === QuestApplicationStatus.APPLICATION_APPLIED);
  const name = proposal.displayName;
  const submitted = formatSubmittedAt(proposal.submittedAt, locale);
  return (
    <View className={`${styles.proposalRow} ${selected || statusSelected ? styles.proposalRowSelected : ''} ${rejected ? styles.proposalRowRejected : ''}`} testID={`candidate-review-proposal-${proposal.id}`}>
      <View className={styles.proposalHeaderRow}>
        <Pressable
          accessibilityLabel={`${labels.selectProposal}: ${name}`}
          accessibilityRole="radio"
          accessibilityState={{ selected: selected || statusSelected }}
          className={styles.proposalSelect}
          disabled={!canDecide}
          onPress={() => onSelect?.(proposal.id)}
          testID={`candidate-review-select-${proposal.id}`}
        >
          <View className={`${styles.proposalSelectionBox} ${selected || statusSelected ? styles.proposalSelectionBoxSelected : ''}`}>
            {selected || statusSelected ? <Check color={colors.white} size={15} strokeWidth={3} /> : null}
          </View>
          <View className={styles.proposalCopy}>
            <Text className={styles.proposalName} numberOfLines={1}>{name}</Text>
            <Text className={styles.proposalDetail}>{proposal.type === 'team' ? labels.teamProposal : labels.individualProposal} · {proposal.detail}</Text>
            {submitted ? <Text className={styles.proposalDetail}>{labels.submittedLabel}: {submitted}</Text> : null}
          </View>
        </Pressable>
        <StatusPill labels={labels} rejected={rejected} selected={statusSelected} status={proposal.status} />
      </View>
      {proposal.type === 'team' && proposal.members.length > 0 ? (
        <View accessibilityLabel={`${labels.teamProposal}: ${labels.memberCount(proposal.members.length)}`} className={styles.proposalMembers}>
          {proposal.members.map((member) => <Text className={styles.proposalMember} key={member.workerId}>• {member.displayName ?? memberIdentities.get(member.workerId)?.displayName ?? member.workerId}</Text>)}
        </View>
      ) : null}
      {canDecide && (onAccept || onReject) ? (
        <View className={styles.proposalActions}>
          {onAccept ? <Pressable accessibilityLabel={`${labels.accept}: ${name}`} accessibilityRole="button" className={`${styles.proposalAction} ${styles.proposalActionAccept}`} onPress={() => onAccept(proposal.id)} testID={`candidate-review-accept-${proposal.id}`}><Check color={colors.white} size={16} strokeWidth={2.7} /><Text className={`${styles.proposalActionText} ${styles.proposalActionTextAccept}`}>{labels.accept}</Text></Pressable> : null}
          {onReject ? <Pressable accessibilityLabel={`${labels.reject}: ${name}`} accessibilityRole="button" className={`${styles.proposalAction} ${styles.proposalActionReject}`} onPress={() => onReject(proposal.id)} testID={`candidate-review-reject-${proposal.id}`}><CircleX color={colors.dangerDark} size={16} strokeWidth={2.2} /><Text className={`${styles.proposalActionText} ${styles.proposalActionTextReject}`}>{labels.reject}</Text></Pressable> : null}
        </View>
      ) : null}
    </View>
  );
}

export function CandidateReviewSheet({
  visible,
  applications = [],
  teams = [],
  proposals,
  mode,
  questTitle,
  applicantDirectory = [],
  teamMemberDirectory,
  requestedHeadcount,
  actualHeadcount,
  rewardSatangPerWorker = 0,
  settlement,
  selectedProposalId,
  surfaceState = 'ready',
  loading = false,
  error,
  onSelectProposal,
  onAcceptProposal,
  onRejectProposal,
  onAccept,
  onReject,
  onRetry,
  onClose,
  bottomInset,
  locale: localeProp,
}: CandidateReviewSheetProps) {
  const contextLocale = useLocale().locale;
  const locale = localeProp ?? contextLocale;
  const messages = getMessages(locale);
  const normalizedProposals = useMemo(() => normalizeProposals({ applications, teams, proposals, mode, applicantDirectory, teamMemberDirectory, messages }), [applicantDirectory, applications, messages, mode, proposals, teamMemberDirectory, teams]);
  const isTeamMode = normalizedProposals.some((proposal) => proposal.type === 'team') || mode === 'team';
  const selected = normalizedProposals.find((proposal) => proposal.id === selectedProposalId || proposal.status === QuestTeamStatus.TEAM_SELECTED || proposal.status === QuestApplicationStatus.APPLICATION_SELECTED);
  const requested = settlement?.requestedHeadcount ?? requestedHeadcount ?? teams.find((team) => team.status !== QuestTeamStatus.TEAM_FORMING)?.requiredHeadcount ?? 1;
  const selectedActual = selected ? selected.type === 'team' ? selected.members.length : 1 : 0;
  const actual = settlement?.actualHeadcount ?? actualHeadcount ?? selectedActual;
  const reserved = settlement?.reservedRewardSatang ?? rewardSatangPerWorker * Math.max(0, requested);
  const settled = settlement?.settledRewardSatang ?? rewardSatangPerWorker * Math.max(0, actual);
  const refund = settlement?.refundSatang ?? Math.max(0, reserved - settled);
  const memberIdentities = useMemo(() => new Map((teamMemberDirectory ?? applicantDirectory).map((identity) => [identity.id, identity])), [applicantDirectory, teamMemberDirectory]);
  const accept = onAcceptProposal ?? onAccept;
  const reject = onRejectProposal ?? onReject;
  const content = loading || surfaceState === 'loading' ? (
    <LoadingState label={messages.loading} />
  ) : surfaceState === 'error' || error ? (
    <ErrorState message={error ?? messages.errorTitle} onRetry={onRetry} retryLabel={messages.retry} />
  ) : (
    <ScrollView className={styles.sheetScroll} contentContainerClassName={styles.sheetContent} showsVerticalScrollIndicator={false} testID="candidate-review-scroll">
      <View className={styles.proposalSummary} testID="candidate-review-summary">
        <View className={styles.proposalSummaryHeader}>
          <View className={styles.reviewHeader}>
            <View className={styles.reviewIcon}>{isTeamMode ? <UsersRound color={colors.primary} size={20} strokeWidth={2.1} /> : <UserRound color={colors.primary} size={20} strokeWidth={2.1} />}</View>
            <View className={styles.reviewHeaderCopy}><Text className={styles.proposalSummaryTitle}>{isTeamMode ? messages.teamProposal : messages.individualProposal}</Text><Text className={styles.reviewCopy} numberOfLines={1}>{questTitle ?? messages.candidateReviewSubtitle}</Text></View>
          </View>
          <Text className={styles.proposalSummaryCount}>{messages.proposalCount(normalizedProposals.length)}</Text>
        </View>
        <View accessibilityLabel={`${messages.requestedHeadcount}: ${requested}. ${messages.actualHeadcount}: ${actual}`} className={styles.reviewRows}>
          <View className={styles.reviewRow}><Text className={styles.reviewLabel}>{messages.requestedHeadcount}</Text><Text className={styles.reviewValue}>{requested}</Text></View>
          <View className={styles.reviewRow}><Text className={styles.reviewLabel}>{messages.actualHeadcount}</Text><Text className={styles.reviewValue}>{actual}</Text></View>
        </View>
      </View>

      <View accessibilityLabel={messages.refund} className={styles.settlement} testID="candidate-review-settlement">
        <View className={styles.settlementHeader}><Text className={styles.settlementTitle}>{messages.refund}</Text><Text className={styles.settlementValue}>{formatSatang(refund, locale)}</Text></View>
        <View className={styles.settlementRows}>
          <View className={styles.settlementRow}><Text className={styles.settlementLabel}>{messages.rewardPerWorker}</Text><Text className={styles.settlementValue}>{formatSatang(settlement?.rewardSatangPerWorker ?? rewardSatangPerWorker, locale)}</Text></View>
          <View className={styles.settlementRow}><Text className={styles.settlementLabel}>{messages.reservedReward}</Text><Text className={styles.settlementValue}>{formatSatang(reserved, locale)}</Text></View>
          <View className={styles.settlementRow}><Text className={styles.settlementLabel}>{messages.settledReward}</Text><Text className={styles.settlementValue}>{formatSatang(settled, locale)}</Text></View>
          <View className={styles.settlementRow}><Text className={styles.settlementLabel}>{messages.refund}</Text><Text className={`${styles.settlementValue} ${styles.settlementRefund}`}>{formatSatang(refund, locale)}{refund === 0 ? ` · ${messages.noRefund}` : ''}</Text></View>
        </View>
      </View>

      {normalizedProposals.length === 0 ? (
        <View className={styles.emptyState} testID="candidate-review-empty">
          <View className={styles.emptyIcon}><UsersRound color={colors.primary} size={26} strokeWidth={1.9} /></View>
          <Text className={styles.emptyTitle}>{messages.noProposals}</Text>
        </View>
      ) : (
        <View className={styles.proposalList}>
          {normalizedProposals.map((proposal) => <ProposalRow key={proposal.id} labels={messages} locale={locale} memberIdentities={memberIdentities} onAccept={accept} onReject={reject} onSelect={onSelectProposal} proposal={proposal} selected={selectedProposalId === proposal.id} />)}
        </View>
      )}
    </ScrollView>
  );

  return (
    <QuestBottomSheet
      bottomInset={bottomInset}
      closeLabel={messages.close}
      onClose={onClose}
      subtitle={messages.candidateReviewSubtitle}
      testID="candidate-review-sheet"
      title={messages.candidateReviewTitle}
      visible={visible}
    >
      {content}
    </QuestBottomSheet>
  );
}

CandidateReviewSheet.displayName = 'CandidateReviewSheet';

export default CandidateReviewSheet;
