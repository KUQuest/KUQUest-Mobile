import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '@/tw/cn';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { BriefcaseBusiness, CalendarDays, Check, CircleAlert, CircleUserRound, ClipboardCheck, Clock3, ImageOff, LogOut, MapPin, MessageCircle, Pencil, UsersRound, X, type LucideIcon } from 'lucide-react-native';
import { AccessibilityInfo, Alert, BackHandler, Modal } from 'react-native';
import { Image, Pressable, SafeAreaView, ScrollView, Text, View } from '@/tw';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authService } from '../auth/AuthService';
import { isPrototypeDemoEnabled } from '../auth/demoMode';
import { PrototypeMenu } from '@/components/ui/PrototypeMenu';
import { usePrototypeMenuState } from '@/components/ui/prototypeMenuState';
import { PROTOTYPE_SCENARIOS, type PrototypeScenarioRoute } from '@/components/ui/prototypeMenuData';
import { TopBar } from '@/components/ui/TopBar';
import { LoadingSkeleton, SkeletonBlock } from '@/components/ui/LoadingSkeleton';
import { useLocale } from '@/locales/LocaleProvider';
import { groupQuestMessages, type GroupQuestMessages } from '@/locales/groupQuestMessages';
import { questBoardMessages, type QuestBoardMessages } from '@/locales/questBoardMessages';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import styles from './questDetailStyles';
import { getLocalizedQuest } from './questTranslations';
import { getQuestAvailability } from './questBoardViewData';
import { parseBoardPreviewState, type BoardPreviewState } from './questBoardHarness';
import { parseQuestDetailMode, parseQuestIntent, parseQuestJoinStatus, parseQuestRouteId, parseStudentId, type QuestDetailMode, type QuestJoinStatus } from './questRoute';
import { questFixtures } from './questFixtures';
import {
  formatSatang,
  MAX_QUEST_IMAGES,
  QuestApplicationStatus as CanonicalApplicationStatus,
  QuestAssignmentStatus,
  QuestCandidateMode,
  QuestInvitationStatus,
  QuestPartialStartConsentStatus,
  QuestParticipation,
  QuestProofStatus,
  QuestStatus,
  QuestTeamStatus,
  type QuestBoardQuest,
  type QuestDetailState,
} from './types';
import { getChatRouteParams } from '@/features/chat/chatData';
import { DEFAULT_PROTOTYPE_VIEWER_ID, formatConsentCountdown, getQuestRewardSatang, questWorkflow, toQuestBoardQuest, type QuestFixtureResult } from './questWorkflow';
import { CandidateReviewSheet, PartialGroupStartConsentSheet, TeamAssembleSheet, type PartialGroupStartVoter, type TeamDirectoryMember } from './components';

export interface QuestDetailScreenProps {
  now?: Date;
  previewState?: BoardPreviewState;
  questId?: string;
  studentId?: string;
  mode?: QuestDetailMode;
  joinStatus?: QuestJoinStatus;
}

type DisplayApplicationStatus = 'none' | 'pending' | 'accepted';
type ApplicationHydration = {
  key: string;
  state: QuestDetailState | null;
};


function getActionBarPaddingBottom(bottomInset: number): number {
  return Math.max(spacing.md, bottomInset + spacing.sm);
}

function getDisplayApplicationStatus(state: QuestDetailState | null, viewerId: string): DisplayApplicationStatus {
  if (!state) return 'none';
  if (state.assignments.some((item) => item.workerId === viewerId && item.status !== QuestAssignmentStatus.ASSIGNMENT_CANCELLED)) return 'accepted';
  if (state.applications.some((item) => item.applicantId === viewerId && item.status === CanonicalApplicationStatus.APPLICATION_APPLIED)) return 'pending';
  return 'none';
}

function toDisplayQuest(state: QuestDetailState, locale: 'en' | 'th', previewState?: BoardPreviewState): QuestBoardQuest {
  const canonicalQuest = toQuestBoardQuest(state);
  const localizedQuest = getLocalizedQuest(canonicalQuest, locale);
  const fixture = questFixtures.find((item) => item.id === canonicalQuest.id);
  const creator = fixture ? getLocalizedQuest(fixture, locale).creator : localizedQuest.creator;
  const displayQuest = { ...localizedQuest, creator };
  if (previewState === 'full' || previewState === 'application-accepted') return { ...displayQuest, acceptedParticipants: displayQuest.headcount };
  if (previewState === 'closed') return { ...displayQuest, deadline: '2026-08-11' };
  return displayQuest;
}

function announce(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

function formatDeadline(value: string, locale: 'en' | 'th'): string {
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function locationLabel(quest: QuestBoardQuest, messages: QuestBoardMessages): string {
  return quest.locationMode === 'online' ? messages.online : messages.onCampus;
}

function proofLabel(quest: QuestBoardQuest, messages: QuestBoardMessages): string {
  if (quest.proofRequired === 'required') return messages.required;
  if (quest.proofRequired === 'optional') return messages.optional;
  return messages.notNeeded;
}

function proofDescription(quest: QuestBoardQuest, messages: QuestBoardMessages): string {
  if (quest.proofRequired === 'required') return messages.proofRequiredDescription;
  if (quest.proofRequired === 'optional') return messages.proofOptionalDescription;
  return messages.proofNotNeededDescription;
}

function candidateDescription(quest: QuestBoardQuest, messages: QuestBoardMessages): string {
  return quest.candidateMode === 'NO_CANDIDATE'
    ? messages.firstComeDescription
    : messages.reviewCandidatesDescription;
}

function NotFoundState({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel: string; onAction: () => void }) {
  return <View accessibilityRole="alert" className={styles.section}><Text className={styles.sectionTitle}>{title}</Text><Text className={styles.body}>{description}</Text><Pressable accessibilityRole="button" onPress={onAction} className={styles.primaryAction}><Text className={styles.primaryActionText}>{actionLabel}</Text></Pressable></View>;
}

function QuestDetailSkeleton({ loadingLabel }: { loadingLabel: string }) {
  const insets = useSafeAreaInsets();
  return (
    <LoadingSkeleton loadingLabel={loadingLabel} style={{ flex: 1 }} contentStyle={{ flex: 1 }} testID="quest-detail-loading-skeleton">
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerClassName={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View className={styles.header} style={{ gap: spacing.xs }}>
          <SkeletonBlock height={34} width="86%" borderRadius={6} />
          <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs }}>
            <SkeletonBlock height={24} width={64} borderRadius={12} />
            <SkeletonBlock height={24} width={82} borderRadius={12} />
          </View>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
            <SkeletonBlock variant="image" height={32} width={32} borderRadius={16} />
            <View style={{ flex: 1, gap: spacing.xs }}><SkeletonBlock height={14} width="24%" borderRadius={4} /><SkeletonBlock height={17} width="58%" borderRadius={4} /></View>
          </View>
        </View>
        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <SkeletonBlock variant="image" height={196} borderRadius={16} testID="quest-detail-skeleton-featured-image" />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <SkeletonBlock variant="image" height={76} borderRadius={16} style={{ flex: 1 }} />
            <SkeletonBlock variant="image" height={76} borderRadius={16} style={{ flex: 1 }} />
          </View>
        </View>
        <View className={styles.heroCard} style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ gap: spacing.xs }}><SkeletonBlock height={14} width={54} borderRadius={4} /><SkeletonBlock height={28} width={126} borderRadius={5} /></View>
            <SkeletonBlock height={52} width={78} borderRadius={12} />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}><SkeletonBlock height={58} borderRadius={8} style={{ flex: 1 }} /><SkeletonBlock height={58} borderRadius={8} style={{ flex: 1 }} /></View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}><SkeletonBlock height={20} width={20} borderRadius={10} /><View style={{ flex: 1, gap: spacing.xs }}><SkeletonBlock height={14} width="24%" borderRadius={4} /><SkeletonBlock height={18} width="74%" borderRadius={4} /><SkeletonBlock height={14} width="38%" borderRadius={4} /></View></View>
        </View>
        <View className={styles.scheduleCard} style={{ gap: spacing.md }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}><SkeletonBlock height={36} width={36} borderRadius={18} /><View style={{ flex: 1, gap: spacing.xs }}><SkeletonBlock height={20} width="34%" borderRadius={5} /><SkeletonBlock height={14} width="58%" borderRadius={4} /></View></View>
          <View style={{ flexDirection: 'row', gap: spacing.md }}><SkeletonBlock height={132} width={12} borderRadius={6} /><View style={{ flex: 1, gap: spacing.sm }}><SkeletonBlock height={18} width="46%" borderRadius={4} /><SkeletonBlock height={22} width="64%" borderRadius={5} /><SkeletonBlock height={15} width="54%" borderRadius={4} /><SkeletonBlock height={18} width="42%" borderRadius={4} /><SkeletonBlock height={22} width="58%" borderRadius={5} /></View></View>
        </View>
          {[1, 2].map((section) => <View key={section} style={{ gap: spacing.sm, marginTop: spacing.lg }}><SkeletonBlock height={22} width={section === 1 ? 126 : 112} borderRadius={5} /><View className={styles.descriptionCard} style={{ gap: spacing.sm }}><SkeletonBlock height={16} width="94%" borderRadius={4} /><SkeletonBlock height={16} width="78%" borderRadius={4} /><SkeletonBlock height={16} width="58%" borderRadius={4} /></View></View>)}
        </ScrollView>
        <View className={styles.actionBar} style={{ paddingBottom: getActionBarPaddingBottom(insets.bottom) }} testID="quest-detail-loading-action-bar">
          <SkeletonBlock height={52} borderRadius={26} />
        </View>
      </View>
    </LoadingSkeleton>
  );
}

function DetailRow({ icon: Icon, label, value, description }: { icon: LucideIcon; label: string; value: string; description?: string }) {
  return <View className={styles.requirementRow}><View className={styles.requirementIcon}><Icon color={colors.primary} size={20} strokeWidth={2} /></View><View className={styles.requirementCopy}><Text className={styles.requirementLabel}>{label}</Text><Text className={styles.requirementValue}>{value}</Text>{description ? <Text className={styles.requirementDescription}>{description}</Text> : null}</View></View>;
}

function QuestImage({ uri, index, messages, featured = false }: { uri: string; index: number; messages: QuestBoardMessages; featured?: boolean }) {
  const [failed, setFailed] = useState(false);
  const label = messages.questImageLabel(index);
  const imageClassName = cn(styles.questImage, featured ? styles.questImageFeatured : styles.questImageThumbnail);

  if (failed) {
    return <View accessibilityLabel={`${label}. ${messages.imageUnavailable}`} className={cn(styles.questImageFallback, featured ? styles.questImageFallbackFeatured : styles.questImageFallbackThumbnail)}><ImageOff color={colors.textMuted} size={24} strokeWidth={1.8} /><Text className={styles.questImageFallbackText}>{messages.imageUnavailable}</Text></View>;
  }

  return <Image accessibilityLabel={label} cachePolicy="memory-disk" contentFit="cover" onError={() => setFailed(true)} source={{ uri }} className={imageClassName} />;
}

function ScheduleTimeline({ locale, messages, quest }: { locale: 'en' | 'th'; messages: QuestBoardMessages; quest: QuestBoardQuest }) {
  return (
    <View accessibilityLabel={messages.schedule} className={styles.scheduleCard} testID="quest-schedule-timeline">
      <View className={styles.scheduleHeader}>
        <View className={styles.scheduleHeaderIcon}><CalendarDays color={colors.primary} size={19} strokeWidth={2} /></View>
        <View className={styles.scheduleHeaderCopy}>
          <Text className={styles.scheduleTitle}>{messages.schedule}</Text>
          <Text className={styles.scheduleDescription}>{messages.scheduleDescription}</Text>
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
            <Text className={styles.timelineDate}>{formatDeadline(quest.startDate, locale)}</Text>
            <View className={styles.timelineTimeRow}>
              <Clock3 color={colors.primary} size={15} strokeWidth={2} />
              <Text className={styles.timelineTimeLabel}>{messages.workWindow}</Text>
              <Text className={styles.timelineTime}>{quest.timeRange ?? messages.timeNotSpecified}</Text>
            </View>
          </View>
          <View className={styles.timelineEvent}>
            <Text className={styles.timelineLabel}>{messages.finishBy}</Text>
            <Text className={styles.timelineDate}>{formatDeadline(quest.deadline, locale)}</Text>
            <Text className={styles.timelineDescription}>{messages.finishByDescription}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function PrototypeActionButton({ label, onPress, primary = false, danger = false, testID }: { label: string; onPress: () => void; primary?: boolean; danger?: boolean; testID: string }) {
  return <Pressable accessibilityRole="button" onPress={onPress} className={cn(styles.prototypeAction, primary && styles.prototypeActionPrimary, danger && styles.prototypeActionDanger)} testID={testID}><Text className={cn(styles.prototypeActionText, primary && styles.prototypeActionTextPrimary, danger && styles.prototypeActionTextDanger)}>{label}</Text></Pressable>;
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
  const { quest, teams, invitations, applications, partialStartConsent, capabilities } = state;
  const isCandidateGroup = quest.participation === QuestParticipation.GROUP && quest.candidateMode === QuestCandidateMode.CANDIDATE;
  const isCandidateQuest = quest.candidateMode === QuestCandidateMode.CANDIDATE;
  const ownTeam = teams.find((team) => team.members.some((member) => member.workerId === viewerId) || team.leaderId === viewerId);
  const ownInvitation = invitations.find((invitation) => invitation.invitedWorkerId === viewerId && invitation.status === QuestInvitationStatus.INVITATION_PENDING);
  const invitationTeam = ownInvitation ? teams.find((team) => team.id === ownInvitation.teamId) : undefined;
  const team = ownTeam ?? invitationTeam;
  const canCreateTeam = capabilities.availableActions.includes('CREATE_TEAM');
  const shouldShowTeamSurface = isCandidateGroup && !isHirer && (Boolean(team) || canCreateTeam);
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
  const teamActionLabel = !team || teamStatus === QuestTeamStatus.TEAM_FORMING ? messages.reviewRoster : messages.submittedTitle;
  const reviewableProposalCount = quest.participation === QuestParticipation.GROUP
    ? teams.filter((candidate) => candidate.status !== QuestTeamStatus.TEAM_FORMING).length
    : applications.filter((application) => !application.teamId).length;
  const partialPending = partialStartConsent?.status === QuestPartialStartConsentStatus.PARTIAL_START_PENDING;
  const partialApproved = partialStartConsent?.status === QuestPartialStartConsentStatus.PARTIAL_START_APPROVED;
  const partialDescription = partialPending
    ? messages.partialConsentSubtitle
    : partialApproved
      ? messages.approvedDescription(state.actualHeadcount ?? partialStartConsent?.frozenWorkerIds.length ?? 0)
      : partialStartConsent?.status === QuestPartialStartConsentStatus.PARTIAL_START_TIMED_OUT
        ? messages.timedOutDescription
        : messages.cancelledDescription;

  return (
    <>
      {shouldShowTeamSurface ? (
        <View accessibilityRole="alert" className={cn(styles.statusCard, teamStatus === QuestTeamStatus.TEAM_REJECTED && styles.statusCardBlocked, !team && styles.statusCardOwner)} testID="quest-team-entry-surface">
          <UsersRound color={teamStatus === QuestTeamStatus.TEAM_REJECTED ? colors.dangerDark : colors.primary} size={25} strokeWidth={2.2} />
          <Text className={styles.statusTitle}>{teamTitle}</Text>
          <Text className={styles.statusDescription}>{teamDescription}</Text>
          <Text className={styles.statusDescription}>{messages.rosterCount(team?.members.length ?? 0, quest.headcount)}</Text>
          <Pressable accessibilityRole="button" onPress={onOpenTeam} className={styles.statusAction} testID="quest-open-team-sheet">
            <Text className={styles.statusActionText}>{!team && canCreateTeam ? messages.createTeam : teamActionLabel}</Text>
          </Pressable>
        </View>
      ) : null}

      {isCandidateQuest && isHirer ? (
        <View accessibilityRole="alert" className={cn(styles.statusCard, styles.statusCardOwner)} testID="quest-candidate-review-entry">
          <CircleUserRound color={colors.primary} size={25} strokeWidth={2.2} />
          <Text className={styles.statusTitle}>{messages.candidateReviewTitle}</Text>
          <Text className={styles.statusDescription}>{messages.candidateReviewSubtitle}</Text>
          <Text className={styles.statusDescription}>{messages.proposalCount(reviewableProposalCount)}</Text>
          <Pressable accessibilityRole="button" onPress={onOpenCandidateReview} className={styles.statusAction} testID="quest-open-candidate-review-sheet">
            <Text className={styles.statusActionText}>{messages.selectProposal}</Text>
          </Pressable>
        </View>
      ) : null}

      {quest.participation === QuestParticipation.GROUP && quest.candidateMode === QuestCandidateMode.NO_CANDIDATE && partialStartConsent ? (
        <View accessibilityRole="alert" className={cn(styles.statusCard, partialPending ? styles.statusCardOwner : partialApproved ? styles.statusCard : styles.statusCardBlocked)} testID="quest-partial-start-entry">
          <Clock3 color={partialApproved ? colors.primary : partialPending ? colors.primary : colors.dangerDark} size={25} strokeWidth={2.2} />
          <Text className={styles.statusTitle}>{partialPending ? messages.partialConsentTitle : partialApproved ? messages.approvedTitle : messages.cancelledTitle}</Text>
          <Text className={styles.statusDescription}>{partialDescription}</Text>
          <Text className={styles.statusDescription}>{messages.votesProgress(partialStartConsent.approvedVoterCount, partialStartConsent.requiredVoterCount ?? partialStartConsent.requiredVoterIds.length)}</Text>
          <Pressable accessibilityRole="button" onPress={onOpenPartialConsent} className={styles.statusAction} testID="quest-open-partial-start-sheet">
            <Text className={styles.statusActionText}>{messages.voteStatus}</Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );
}

function PrototypeStatePanels({
  state,
  now,
  messages,
  onConsent,
  onSubmitProof,
  onConfirmCompletion,
  onSubmitRework,
  onReviewProof,
  onDispute,
  onResolve,
  onComplete,
  onCancel,
  onPublish,
}: {
  state: QuestDetailState;
  now: Date;
  messages: QuestBoardMessages;
  onConsent: (approve: boolean) => void;
  onSubmitProof: () => void;
  onConfirmCompletion: () => void;
  onSubmitRework: (proofId: string) => void;
  onReviewProof: (proofId: string, approve: boolean) => void;
  onDispute: () => void;
  onResolve: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onPublish: () => void;
}) {
  const { quest, assignments, proofs, editConsent, capabilities } = state;
  const status = quest.status;
  const publishCard = status === QuestStatus.QUEST_DRAFT ? (
    <View className={styles.prototypeCard} testID="quest-publish-check">
      <View className={styles.prototypeHeader}><ClipboardCheck color={colors.primary} size={21} strokeWidth={2.2} /><Text className={styles.prototypeTitle}>{messages.publishQuest}</Text></View>
      {state.publishCheck ? <>
        <Text className={styles.prototypeListItem}>{messages.escrowRewardPool}: {formatSatang(state.publishCheck.escrow.rewardPoolSatang)}</Text>
        <Text className={styles.prototypeListItem}>{messages.escrowPlatformFee}: {formatSatang(state.publishCheck.escrow.platformFeeSatang)}</Text>
        <Text className={styles.prototypeListItem}>{messages.escrowTotal}: {formatSatang(state.publishCheck.escrow.totalRequiredSatang)}</Text>
        {state.publishCheck.blockers.map((blocker) => <Text className={styles.prototypeCopy} key={blocker}>{blocker}</Text>)}
        {state.publishCheck.warnings.map((warning) => <Text className={styles.prototypeCopy} key={warning}>{warning}</Text>)}
      </> : null}
      {capabilities.availableActions.includes('PUBLISH') ? <View className={styles.prototypeActions}><PrototypeActionButton label={messages.publishQuest} onPress={onPublish} primary testID="quest-publish" /></View> : null}
    </View>
  ) : null;
  const statusCard = status !== QuestStatus.QUEST_OPEN && status !== QuestStatus.QUEST_DRAFT && status !== QuestStatus.QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT ? (
    <View accessibilityRole={status === QuestStatus.QUEST_DISPUTED ? 'alert' : undefined} className={cn(styles.prototypeCard, status === QuestStatus.QUEST_DISPUTED ? styles.prototypeCardDanger : status === QuestStatus.QUEST_COMPLETED || status === QuestStatus.QUEST_CANCELLED ? styles.prototypeCardSuccess : styles.prototypeCardWarning)} testID={`quest-status-banner-${status}`}>
      <View className={styles.prototypeHeader}><CircleAlert color={status === QuestStatus.QUEST_DISPUTED ? colors.dangerDark : colors.primary} size={21} strokeWidth={2.2} /><Text className={styles.prototypeTitle}>{messages.statusLabel(status)}</Text></View>
      {status === QuestStatus.QUEST_COMPLETED || status === QuestStatus.QUEST_CANCELLED ? <Text className={styles.prototypeCopy}>{messages.terminalBannerTitle}: {messages.terminalDescription}</Text> : null}
      {status === QuestStatus.QUEST_DISPUTED ? <Text className={styles.prototypeCopy}>{messages.disputeDescription}</Text> : null}
      {status === QuestStatus.QUEST_ASSIGNED ? <Text className={styles.prototypeCopy}>{assignments.length} {messages.participants} · {messages.statusLabel(status)}</Text> : null}
      {status === QuestStatus.QUEST_APPROVED && capabilities.availableActions.includes('COMPLETE') ? <View className={styles.prototypeActions}><PrototypeActionButton label={messages.completeQuest} onPress={onComplete} primary testID="quest-complete" /></View> : null}
      {capabilities.availableActions.includes('CANCEL') ? <View className={styles.prototypeActions}><PrototypeActionButton label={messages.cancelQuest} onPress={onCancel} danger testID="quest-cancel" /></View> : null}
    </View>
  ) : null;

  const consentCard = editConsent?.status === 'EDIT_REQUEST_PENDING' && status === QuestStatus.QUEST_AWAITING_EDIT_CONSENT ? (
    <View accessibilityRole="alert" className={cn(styles.prototypeCard, styles.prototypeCardWarning)} testID="quest-edit-consent-state">
      <View className={styles.prototypeHeader}><Clock3 color={colors.primary} size={21} strokeWidth={2.2} /><Text className={styles.prototypeTitle}>{messages.consentBannerTitle}</Text></View>
      <Text className={styles.prototypeCopy}>{messages.consentBannerDescription(editConsent.approvedWorkerCount, editConsent.requiredWorkerCount)}</Text>
      <Text className={styles.prototypeMeta}>{messages.consentCountdown}: {formatConsentCountdown(editConsent, now) ?? '00:00'}</Text>
      <View className={styles.prototypeProgress}><View className={styles.prototypeProgressFill} style={{ width: `${editConsent.requiredWorkerCount ? Math.min(100, (editConsent.approvedWorkerCount / editConsent.requiredWorkerCount) * 100) : 0}%` }} /></View>
      {capabilities.availableActions.includes('VOTE_EDIT_CONSENT') ? <View className={styles.prototypeActions}><PrototypeActionButton label={messages.approveEdit} onPress={() => onConsent(true)} primary testID="quest-approve-edit" /><PrototypeActionButton label={messages.rejectEdit} onPress={() => onConsent(false)} danger testID="quest-reject-edit" /></View> : null}
    </View>
  ) : null;

  const proofCard = proofs.length > 0 || ([QuestStatus.QUEST_IN_PROGRESS, QuestStatus.QUEST_SUBMITTED, QuestStatus.QUEST_REWORK] as QuestDetailState['quest']['status'][]).includes(status) ? (
    <View className={styles.prototypeCard} testID="quest-proof-state">
      <View className={styles.prototypeHeader}><ClipboardCheck color={colors.primary} size={21} strokeWidth={2.2} /><Text className={styles.prototypeTitle}>{messages.proofBannerTitle}</Text></View>
      {proofs.length === 0 ? <Text className={styles.prototypeCopy}>{quest.proofRequired === 'none' ? messages.proofNotNeededDescription : messages.proofRequiredDescription}</Text> : <View className={styles.prototypeList}>{proofs.map((item) => <View key={item.id}><Text className={styles.prototypeListItem}>• {item.ownerId} · {messages.statusLabel(item.status)}</Text>{item.status === QuestProofStatus.PROOF_PENDING ? <Text className={styles.prototypeCopy}>{messages.proofPending}</Text> : null}{item.status === QuestProofStatus.PROOF_REJECTED ? <Text className={styles.prototypeCopy}>{messages.proofRejected} · {messages.reworkRemaining(Math.max(0, item.reworkLimit - item.reworkCount), item.reworkLimit)}</Text> : null}{item.status === QuestProofStatus.PROOF_REJECTED && capabilities.availableActions.includes('REWORK_PROOF') ? <View className={styles.prototypeActions}><PrototypeActionButton label={messages.submitRework} onPress={() => onSubmitRework(item.id)} primary testID={`quest-submit-rework-${item.id}`} /></View> : null}{item.status === QuestProofStatus.PROOF_PENDING && capabilities.availableActions.includes('REVIEW_PROOF') ? <View className={styles.prototypeActions}><PrototypeActionButton label={messages.approveProof} onPress={() => onReviewProof(item.id, true)} primary testID={`quest-approve-proof-${item.id}`} /><PrototypeActionButton label={messages.rejectProof} onPress={() => onReviewProof(item.id, false)} danger testID={`quest-reject-proof-${item.id}`} /></View> : null}</View>)}</View>}
      {capabilities.availableActions.includes('SUBMIT_PROOF') ? <View className={styles.prototypeActions}><PrototypeActionButton label={messages.submitProof} onPress={onSubmitProof} primary testID="quest-submit-proof" /></View> : null}
      {capabilities.availableActions.includes('CONFIRM_COMPLETION') ? <View className={styles.prototypeActions}><PrototypeActionButton label={messages.confirmCompletion} onPress={onConfirmCompletion} primary testID="quest-confirm-completion" /></View> : null}
    </View>
  ) : null;

  const disputeCard = status === QuestStatus.QUEST_DISPUTED ? <View className={cn(styles.prototypeCard, styles.prototypeCardDanger)} testID="quest-dispute-state"><View className={styles.prototypeHeader}><CircleAlert color={colors.dangerDark} size={21} strokeWidth={2.2} /><Text className={styles.prototypeTitle}>{messages.disputeBannerTitle}</Text></View><Text className={styles.prototypeCopy}>{messages.disputeDescription}</Text>{capabilities.availableActions.includes('RESOLVE_DISPUTE') ? <View className={styles.prototypeActions}><PrototypeActionButton label={messages.resolveDispute} onPress={onResolve} primary testID="quest-resolve-dispute" /></View> : null}</View> : null;
  const openDisputeButton = capabilities.availableActions.includes('OPEN_DISPUTE') ? <View className={styles.prototypeActions}><PrototypeActionButton label={messages.openDispute} onPress={onDispute} danger testID="quest-open-dispute" /></View> : null;
  const openCancelButton = status === QuestStatus.QUEST_OPEN && capabilities.availableActions.includes('CANCEL') ? <View className={styles.prototypeActions}><PrototypeActionButton label={messages.cancelQuest} onPress={onCancel} danger testID="quest-cancel" /></View> : null;

  return <>{publishCard}{statusCard}{consentCard}{proofCard}{disputeCard}{openDisputeButton}{openCancelButton}</>;
}

function ConfirmationSheet({ locale, messages, quest, onCancel, onConfirm }: { locale: 'en' | 'th'; messages: QuestBoardMessages; quest: QuestBoardQuest; onCancel: () => void; onConfirm: () => void }) {
  const insets = useSafeAreaInsets();
  const firstCome = quest.candidateMode === 'NO_CANDIDATE';
  const title = firstCome ? messages.confirmParticipationTitle : messages.confirmApplicationTitle;
  const description = firstCome ? messages.confirmParticipationDescription : messages.confirmApplicationDescription;
  const confirmLabel = firstCome ? messages.confirmParticipation : messages.confirmApplication;

  return (
    <Modal animationType="slide" onDismiss={() => announce(messages.details)} onRequestClose={onCancel} onShow={() => announce(title)} transparent visible>
      <Pressable onPress={onCancel} className={styles.modalBackdrop}>
        <Pressable accessibilityViewIsModal onPress={() => undefined} className={styles.confirmSheet} style={{ paddingBottom: Math.max(spacing.md, insets.bottom + spacing.sm) }}>
          <View className={styles.confirmHeader}><Text accessibilityRole="header" className={styles.confirmTitle}>{title}</Text><Pressable accessibilityLabel={messages.notYet} accessibilityRole="button" onPress={onCancel} className={styles.sheetCloseButton}><X color={colors.textStrong} size={24} /></Pressable></View>
          <Text className={styles.confirmDescription}>{description}</Text>
          <View className={styles.confirmSummary}>
            <Text className={styles.confirmSummaryText}>{quest.title}</Text>
            <Text className={styles.confirmSummaryText}>{`${formatSatang(getQuestRewardSatang(quest), locale)} ${messages.perPerson}`}</Text>
            <Text className={styles.confirmSummaryText}>{`${messages.schedule}: ${formatDeadline(quest.startDate, locale)}${quest.timeRange ? ` · ${quest.timeRange}` : ''}`}</Text>
            <Text className={styles.confirmSummaryText}>{`${messages.deadline}: ${formatDeadline(quest.deadline, locale)}`}</Text>
            <Text className={styles.confirmSummaryText}>{`${messages.location}: ${quest.location}`}</Text>
          </View>
          <View className={styles.confirmActions}><Pressable accessibilityRole="button" onPress={onCancel} className={styles.cancelAction}><Text className={styles.cancelActionText}>{messages.notYet}</Text></Pressable><Pressable accessibilityRole="button" onPress={onConfirm} className={styles.confirmAction} testID="confirm-quest-application"><Text className={styles.confirmActionText}>{confirmLabel}</Text></Pressable></View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function QuestDetailScreen({ now, previewState, questId, studentId, mode, joinStatus }: QuestDetailScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const handleBack = React.useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)');
  }, [router]);
  useFocusEffect(
    React.useCallback(() => {
      // Native Modal surfaces consume Android Back through onRequestClose before this focused-screen listener.
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBack();
        return true;
      });
      return () => subscription.remove();
    }, [handleBack]),
  );
  const params = useLocalSearchParams<{ id?: string | string[]; intent?: string | string[]; preview?: string | string[]; mode?: string | string[]; joinStatus?: string | string[]; studentId?: string | string[] }>();
  const { locale } = useLocale();
  const { activePersonaId, onPersonaChange, onReset } = usePrototypeMenuState();
  const messages = questBoardMessages[locale];
  const effectiveNow = now ?? questWorkflow.getNow();
  const resolvedQuestId = parseQuestRouteId(questId ?? params.id);
  const resolvedIntent = parseQuestIntent(params.intent);
  const resolvedMode = mode ?? parseQuestDetailMode(params.mode);
  const resolvedJoinStatus = joinStatus ?? parseQuestJoinStatus(params.joinStatus);
  const routeStudentId = parseStudentId(params.studentId);
  const explicitStudentId = studentId ?? routeStudentId;
  const prototypeDemoEnabled = isPrototypeDemoEnabled();
  const [sessionStudentId, setSessionStudentId] = useState<string | undefined>();
  const [sessionHydrated, setSessionHydrated] = useState(Boolean(explicitStudentId || prototypeDemoEnabled));

  useEffect(() => {
    if (explicitStudentId || prototypeDemoEnabled) return undefined;
    let active = true;
    void authService.getSession().then((session) => {
      if (!active) return;
      const id = parseStudentId(session?.user.id);
      if (id) setSessionStudentId(id);
      setSessionHydrated(true);
    }).catch(() => {
      if (active) setSessionHydrated(true);
    });
    return () => {
      active = false;
    };
  }, [explicitStudentId, prototypeDemoEnabled]);
  const resolvedPreview = previewState ?? parseBoardPreviewState(params.preview);
  const applicationStudentId = explicitStudentId ?? (__DEV__ ? activePersonaId : sessionStudentId ?? DEFAULT_PROTOTYPE_VIEWER_ID);
  const applicationSessionHydrated = Boolean(explicitStudentId || sessionHydrated || prototypeDemoEnabled);
  const isJoinView = resolvedMode === 'join';
  const isPostView = resolvedMode === 'post';
  const basePrototypeState = useMemo(() => resolvedQuestId && resolvedPreview !== 'loading'
    ? questWorkflow.getQuestDetailState(resolvedQuestId, applicationStudentId, effectiveNow)
    : null, [applicationStudentId, effectiveNow, resolvedPreview, resolvedQuestId]);
  const prototypeViewerId = isPostView ? basePrototypeState?.quest.hirerId ?? applicationStudentId : applicationStudentId;
  const initialPrototypeState = useMemo(() => resolvedQuestId && resolvedPreview !== 'loading'
    ? questWorkflow.getQuestDetailState(resolvedQuestId, prototypeViewerId, effectiveNow)
    : null, [effectiveNow, prototypeViewerId, resolvedPreview, resolvedQuestId]);
  const [prototypeState, setPrototypeState] = useState<QuestDetailState | null>(() => initialPrototypeState);
  const applicationHydrationKey = resolvedQuestId ? `${resolvedQuestId}:${applicationStudentId}` : '';
  const [applicationHydration, setApplicationHydration] = useState<ApplicationHydration>(() => ({
    key: applicationHydrationKey,
    state: basePrototypeState,
  }));
  useEffect(() => {
    if (!resolvedQuestId || resolvedPreview === 'loading') return undefined;
    let active = true;
    const refresh = () => {
      const refreshNow = now ?? questWorkflow.getNow();
      const next = questWorkflow.getQuestDetailState(resolvedQuestId, prototypeViewerId, refreshNow);
      if (active) setPrototypeState(next);
    };
    refresh();
    const unsubscribe = questWorkflow.subscribe(refresh);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [now, prototypeViewerId, resolvedPreview, resolvedQuestId]);
  const activePrototypeState = resolvedPreview === 'loading' || prototypeState?.quest.id !== resolvedQuestId ? null : prototypeState;
  const quest = useMemo(() => activePrototypeState ? toDisplayQuest(activePrototypeState, locale, resolvedPreview) : undefined, [activePrototypeState, locale, resolvedPreview]);
  useEffect(() => {
    if (!resolvedQuestId || resolvedPreview === 'loading' || !applicationSessionHydrated) return undefined;
    let active = true;
    const hydrate = () => {
      const state = questWorkflow.getQuestDetailState(resolvedQuestId, applicationStudentId, now ?? questWorkflow.getNow());
      if (active) setApplicationHydration({ key: applicationHydrationKey, state });
    };
    hydrate();
    const unsubscribe = questWorkflow.subscribe(hydrate);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [applicationHydrationKey, applicationSessionHydrated, applicationStudentId, now, resolvedPreview, resolvedQuestId]);
  const applicationState = applicationHydration.key === applicationHydrationKey ? applicationHydration.state : null;
  const applicationStatusHydrated = Boolean(resolvedQuestId && resolvedPreview !== 'loading' && applicationSessionHydrated && applicationHydration.key === applicationHydrationKey && applicationState);
  const applicationStatus = getDisplayApplicationStatus(applicationState, applicationStudentId);
  const previewApplicationStatus: DisplayApplicationStatus = resolvedPreview === 'application-pending'
    ? 'pending'
    : resolvedPreview === 'application-accepted'
      ? 'accepted'
      : applicationStatus;
  const availability = quest ? getQuestAvailability(quest, effectiveNow) : undefined;
  const imageUris = quest?.imageUris?.slice(0, MAX_QUEST_IMAGES) ?? [];
  const joinedStatus: QuestJoinStatus | undefined = isJoinView && applicationStatusHydrated
    ? resolvedJoinStatus ?? (applicationStatus === 'pending' || applicationStatus === 'accepted' ? applicationStatus : 'accepted')
    : undefined;
  const firstCome = quest?.candidateMode === 'NO_CANDIDATE';
  const candidateGroup = Boolean(quest && !firstCome && quest.participationMode === 'team');
  const canonicalOpen = !activePrototypeState || activePrototypeState.quest.status === QuestStatus.QUEST_OPEN;
  const partialStartPending = activePrototypeState?.partialStartConsent?.status === QuestPartialStartConsentStatus.PARTIAL_START_PENDING;
  const applicationAction = firstCome ? 'DIRECT_JOIN' : 'APPLY';
  const canApply = !isJoinView && !isPostView && availability === 'available' && canonicalOpen && !partialStartPending && previewApplicationStatus === 'none' && !candidateGroup && applicationStatusHydrated && Boolean(applicationState?.capabilities.availableActions.includes(applicationAction));
  const [manualConfirmationOpen, setManualConfirmationOpen] = useState(false);
  const [leftQuest, setLeftQuest] = useState(false);
  const routeIntentKey = `${resolvedQuestId ?? ''}:${resolvedIntent ?? ''}`;
  const [dismissedIntent, setDismissedIntent] = useState<string | undefined>();
  const confirmationOpen = manualConfirmationOpen || (resolvedIntent === 'apply' && dismissedIntent !== routeIntentKey && canApply);
  const canMessageOwner = Boolean(quest && !isPostView && quest.ownerStudentId !== applicationStudentId && activePrototypeState?.conversation.conversationId && activePrototypeState.conversation.canRead);
  const statusTitle = isPostView
    ? messages.postOwnerView
    : isJoinView
      ? leftQuest
        ? messages.leftQuest
        : joinedStatus === 'history'
          ? messages.historyQuest
          : joinedStatus === 'accepted'
            ? messages.participationConfirmed
            : joinedStatus === 'pending'
              ? messages.applicationPending
              : ''
      : previewApplicationStatus === 'accepted'
        ? firstCome ? messages.participationConfirmed : messages.applicationAccepted
        : previewApplicationStatus === 'pending'
          ? messages.applicationPending
          : availability === 'full'
            ? messages.questFull
            : availability === 'closed'
              ? messages.applicationsClosed
              : '';
  const statusIsUnavailable = !isJoinView && !isPostView && availability !== 'available' && previewApplicationStatus === 'none';
  const statusDescription = isPostView
    ? messages.postOwnerViewDescription
    : isJoinView
      ? leftQuest
        ? messages.leftQuestDescription
        : joinedStatus === 'history'
          ? messages.historyQuestDescription
          : joinedStatus === 'accepted'
            ? messages.applicationAcceptedDescription
            : messages.applicationPendingDescription
      : previewApplicationStatus === 'accepted'
        ? messages.applicationAcceptedDescription
        : previewApplicationStatus === 'pending'
          ? messages.applicationPendingDescription
          : messages.unavailableApplication;
  const StatusIcon = statusIsUnavailable ? CircleAlert : isPostView ? BriefcaseBusiness : leftQuest ? LogOut : Check;
  const statusIconColor = statusIsUnavailable ? colors.textMuted : leftQuest ? colors.dangerDark : colors.primary;
  const groupMessages = groupQuestMessages[locale];
  const isHirerView = Boolean(activePrototypeState && activePrototypeState.quest.hirerId === prototypeViewerId);
  const [teamSheetOpen, setTeamSheetOpen] = useState(false);
  const [candidateReviewSheetOpen, setCandidateReviewSheetOpen] = useState(false);
  const [partialStartSheetDismissed, setPartialStartSheetDismissed] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [teamSelectedMemberIds, setTeamSelectedMemberIds] = useState<string[]>([]);
  const [teamReviewing, setTeamReviewing] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);

  const teamSheetTeam = useMemo(() => {
    if (!activePrototypeState || !candidateGroup || isHirerView) return undefined;
    const ownTeam = activePrototypeState.teams.find((team) => team.members.some((member) => member.workerId === applicationStudentId) || team.leaderId === applicationStudentId);
    if (ownTeam) return ownTeam;
    const invitation = activePrototypeState.invitations.find((item) => item.invitedWorkerId === applicationStudentId && item.status === QuestInvitationStatus.INVITATION_PENDING);
    return invitation ? activePrototypeState.teams.find((team) => team.id === invitation.teamId) : undefined;
  }, [activePrototypeState, applicationStudentId, candidateGroup, isHirerView]);
  const teamDirectory = useMemo<TeamDirectoryMember[]>(() => {
    if (!resolvedQuestId || !activePrototypeState || !candidateGroup || isHirerView || teamSheetTeam?.leaderId !== applicationStudentId || teamSheetTeam.status !== QuestTeamStatus.TEAM_FORMING) return [];
    return questWorkflow.searchMembers(resolvedQuestId, teamSearchQuery, applicationStudentId, effectiveNow);
  }, [activePrototypeState, applicationStudentId, candidateGroup, isHirerView, effectiveNow, resolvedQuestId, teamSearchQuery, teamSheetTeam]);
  const partialVoters = useMemo<PartialGroupStartVoter[]>(() => {
    const consent = activePrototypeState?.partialStartConsent;
    if (!activePrototypeState || !consent) return [];
    return consent.requiredVoterIds.map((id) => ({
      id,
      displayName: id === activePrototypeState.quest.hirerId ? quest?.creator.name ?? id : id,
      role: id === activePrototypeState.quest.hirerId ? 'HIRER' : 'WORKER',
    }));
  }, [activePrototypeState, quest?.creator.name]);
  const partialStartSheetOpen = Boolean(activePrototypeState?.partialStartConsent)
    && activePrototypeState?.partialStartConsent?.status !== QuestPartialStartConsentStatus.PARTIAL_START_APPROVED
    && !partialStartSheetDismissed;

  const confirmApplication = () => {
    if (!quest || !canApply) return;
    const result: QuestFixtureResult = firstCome
      ? questWorkflow.joinDirect(quest.id, applicationStudentId, effectiveNow)
      : questWorkflow.applyCandidate(quest.id, applicationStudentId, effectiveNow);
    if (!result.ok) {
      Alert.alert(messages.details, result.error.message);
      return;
    }
    setPrototypeState(result.state);
    setManualConfirmationOpen(false);
    setDismissedIntent(routeIntentKey);
  };

  const handleLeaveQuest = () => {
    if (!quest || (joinedStatus !== 'pending' && joinedStatus !== 'accepted')) return;
    const isPending = joinedStatus === 'pending';
    const label = isPending ? messages.withdrawApplication : messages.leaveQuest;
    const description = isPending ? messages.withdrawApplicationDescription : messages.leaveQuestDescription;
    Alert.alert(label, description, [
      { text: messages.cancel, style: 'cancel' },
      {
        text: label,
        style: 'destructive',
        onPress: () => {
          const result = isPending ? questWorkflow.withdrawApplication(quest.id, undefined, applicationStudentId, effectiveNow) : undefined;
          if (result && !result.ok) {
            Alert.alert(messages.details, result.error.message);
            return;
          }
          if (result?.ok) setPrototypeState(result.state);
          setLeftQuest(true);
          announce(messages.leftQuest);
        },
      },
    ]);
  };

  const handleEditPost = () => {
    if (!quest) return;
    router.push({ pathname: '/create', params: { editQuestId: quest.id } });
  };

  const handleMessageOwner = () => {
    if (!quest || !canMessageOwner) return;
    const capability = activePrototypeState?.conversation;
    if (!capability?.conversationId || !capability.canRead) return;
    router.push({ pathname: '/chat/[id]', params: getChatRouteParams({ conversationId: capability.conversationId, questId: quest.id, viewerId: applicationStudentId, capability, ownerName: quest.creator.name, questTitle: quest.title }) });
  };

  const applyPrototypeResult = (result: QuestFixtureResult) => {
    if (!result.ok) {
      Alert.alert(messages.details, result.error.message);
      return;
    }
    setPrototypeState(result.state);
  };
  const handlePrototypeConsent = (approve: boolean) => {
    if (resolvedQuestId) applyPrototypeResult(questWorkflow.voteEditConsent(resolvedQuestId, applicationStudentId, approve, effectiveNow));
  };
  const handleCreateTeam = () => {
    if (resolvedQuestId) applyPrototypeResult(questWorkflow.createTeam(resolvedQuestId, applicationStudentId, undefined, effectiveNow));
  };
  const handleInviteMembers = (memberIds: string[]) => {
    memberIds.forEach((memberId) => {
      if (resolvedQuestId) applyPrototypeResult(questWorkflow.inviteWorker(resolvedQuestId, memberId, applicationStudentId, effectiveNow));
    });
  };
  const handleSubmitTeam = (teamId: string) => {
    if (resolvedQuestId && teamSheetTeam?.id === teamId) applyPrototypeResult(questWorkflow.submitTeam(resolvedQuestId, applicationStudentId, effectiveNow));
  };
  const handleInvitation = (invitationId: string, accept: boolean) => {
    if (resolvedQuestId) applyPrototypeResult(questWorkflow.respondToInvitation(resolvedQuestId, invitationId, applicationStudentId, accept, effectiveNow));
  };
  const handlePartialStartVote = (approve: boolean) => {
    if (resolvedQuestId) applyPrototypeResult(questWorkflow.votePartialStartConsent(resolvedQuestId, prototypeViewerId, approve, effectiveNow));
  };
  const handlePrototypeSubmitProof = () => {
    if (resolvedQuestId) applyPrototypeResult(questWorkflow.submitProof(resolvedQuestId, applicationStudentId, ['fixture://proof-image'], 'Fixture proof submitted.', effectiveNow));
  };
  const handlePrototypeConfirmCompletion = () => {
    if (resolvedQuestId) applyPrototypeResult(questWorkflow.confirmCompletion(resolvedQuestId, applicationStudentId, effectiveNow));
  };
  const handlePrototypeSubmitRework = (proofId: string) => {
    if (resolvedQuestId) applyPrototypeResult(questWorkflow.submitRework(resolvedQuestId, proofId, applicationStudentId, [], '', effectiveNow));
  };
  const handlePrototypeReviewProof = (proofId: string, approve: boolean) => {
    if (resolvedQuestId) applyPrototypeResult(questWorkflow.reviewProof(resolvedQuestId, proofId, approve, '', prototypeViewerId, effectiveNow));
  };
  const handleSelectCandidate = (applicationId: string) => {
    if (resolvedQuestId) applyPrototypeResult(questWorkflow.selectCandidate(resolvedQuestId, applicationId, prototypeViewerId, effectiveNow));
  };
  const handleRejectCandidate = (proposalId: string) => {
    if (!resolvedQuestId || !quest) return;
    const proposalType = candidateGroup ? groupMessages.teamProposal : groupMessages.individualProposal;
    Alert.alert(groupMessages.reject, `${quest.title}\n${proposalType}`, [
      { text: groupMessages.cancel, style: 'cancel' },
      {
        text: groupMessages.reject,
        style: 'destructive',
        onPress: () => {
          const result = candidateGroup
            ? questWorkflow.rejectTeam(resolvedQuestId, proposalId, prototypeViewerId, effectiveNow)
            : questWorkflow.rejectCandidate(resolvedQuestId, proposalId, prototypeViewerId, effectiveNow);
          applyPrototypeResult(result);
        },
      },
    ]);
  };
  const handlePrototypeDispute = () => {
    if (resolvedQuestId) applyPrototypeResult(questWorkflow.openDispute(resolvedQuestId, applicationStudentId, effectiveNow));
  };
  const handlePrototypeResolve = () => {
    if (resolvedQuestId) applyPrototypeResult(questWorkflow.resolveDispute(resolvedQuestId, prototypeViewerId, effectiveNow));
  };
  const handlePrototypeComplete = () => {
    if (resolvedQuestId) applyPrototypeResult(questWorkflow.completeQuest(resolvedQuestId, prototypeViewerId, effectiveNow));
  };
  const handlePrototypeCancel = () => {
    if (resolvedQuestId) applyPrototypeResult(questWorkflow.cancelQuest(resolvedQuestId, prototypeViewerId, effectiveNow));
  };
  const handlePrototypePublish = () => {
    if (resolvedQuestId) applyPrototypeResult(questWorkflow.publishQuest(resolvedQuestId, prototypeViewerId, effectiveNow));
  };
  const openPrototypeScenario = (route: PrototypeScenarioRoute) => {
    router.push(route);
  };
  const handlePrototypePersonaChange = (personaId: Parameters<typeof onPersonaChange>[0]) => {
    onPersonaChange(personaId);
    setTeamSheetOpen(false);
    setCandidateReviewSheetOpen(false);
    setPartialStartSheetDismissed(false);
    setTeamReviewing(false);
    setTeamSelectedMemberIds([]);
    setTeamSearchQuery('');
    setSelectedProposalId(null);
  };
  const handlePrototypeReset = (scope: Parameters<typeof onReset>[0]) => {
    onReset(scope);
    setTeamSheetOpen(false);
    setCandidateReviewSheetOpen(false);
    setPartialStartSheetDismissed(false);
    setTeamReviewing(false);
    setTeamSelectedMemberIds([]);
    setTeamSearchQuery('');
    setSelectedProposalId(null);
  };
  const currentScenario = PROTOTYPE_SCENARIOS.find((scenario) => scenario.id === resolvedQuestId)?.route;
  const prototypeMenu = (
    <PrototypeMenu
      activePersonaId={activePersonaId}
      compact
      currentScenario={currentScenario}
      onPersonaChange={handlePrototypePersonaChange}
      onReset={handlePrototypeReset}
      onScenarioPress={openPrototypeScenario}
      testID="quest-detail-prototype-menu"
    />
  );
  const applicationStatusPending = Boolean(quest) && !applicationStatusHydrated;
  const questPending = resolvedPreview === 'loading' || applicationStatusPending;

  if (questPending) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className={styles.safeArea}>
        <TopBar backLabel={messages.back} onBackPress={handleBack} rightAction={prototypeMenu} title={messages.details} variant="detail" />
        <QuestDetailSkeleton loadingLabel={messages.loading} />
      </SafeAreaView>
    );
  }

  if (!quest) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className={styles.safeArea}>
        <TopBar backLabel={messages.back} onBackPress={handleBack} rightAction={prototypeMenu} title={messages.details} variant="detail" />
        <NotFoundState title={messages.questNotFound} description={messages.questNotFoundDescription} actionLabel={messages.back} onAction={handleBack} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className={styles.safeArea}>
      <TopBar backLabel={messages.back} onBackPress={handleBack} rightAction={prototypeMenu} title={messages.details} variant="detail" />
      <ScrollView contentContainerClassName={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View className={styles.header}><Text accessibilityRole="header" className={styles.title}>{quest.title}</Text>{activePrototypeState ? <Text accessibilityLabel={activePrototypeState.quest.status === QuestStatus.QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT ? groupMessages.partialConsentTitle : messages.statusLabel(activePrototypeState.quest.status)} className={styles.canonicalStatus} testID="quest-canonical-status">{activePrototypeState.quest.status === QuestStatus.QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT ? groupMessages.partialConsentTitle : messages.statusLabel(activePrototypeState.quest.status)}</Text> : null}<View className={styles.creatorRow}><View className={styles.creatorAvatar}><CircleUserRound color={colors.primary} size={17} strokeWidth={2} /></View><View className={styles.creatorCopy}><Text className={styles.creatorLabel}>{messages.creator}</Text><Text className={styles.creatorValue} numberOfLines={1}>{`${quest.creator.name}${quest.creator.faculty ? ` · ${quest.creator.faculty}` : ''}`}</Text></View></View><View accessibilityLabel={messages.tags} className={styles.tagRow}>{quest.tags.map((tag) => <Text key={tag} className={styles.tag}>{tag}</Text>)}</View></View>
        {imageUris.length > 0 ? <View accessibilityLabel={messages.imageCount(imageUris.length)} className={styles.imageGallery}><QuestImage featured index={1} messages={messages} uri={imageUris[0]} />{imageUris.length > 1 ? <View className={styles.imageThumbnailRow}>{imageUris.slice(1).map((uri, index) => <QuestImage key={`${uri}-${index + 1}`} index={index + 2} messages={messages} uri={uri} />)}</View> : null}</View> : null}
        <View className={styles.heroCard}>
          <View className={styles.heroPrimary}><View><Text className={styles.heroLabel}>{messages.reward}</Text><Text className={styles.heroRewardValue}>{`${formatSatang(getQuestRewardSatang(quest), locale)} ${messages.perPerson}`}</Text></View><View className={styles.heroSpots}><Text className={styles.heroSpotsLabel}>{messages.spots}</Text><Text className={styles.heroSpotsValue}>{`${quest.acceptedParticipants}/${quest.headcount}`}</Text></View></View>
          <View className={styles.heroDetails}>
            <View className={styles.heroItem}><View className={styles.heroItemIcon}><UsersRound color={colors.primary} size={17} strokeWidth={2} /></View><View className={styles.heroItemCopy}><Text className={styles.heroLabel}>{messages.participation}</Text><Text className={styles.heroValue}>{quest.participationMode === 'team' ? messages.team : messages.singlePerson}</Text></View></View>
            <View className={cn(styles.heroItem, styles.heroItemDivider)}><View className={styles.heroItemIcon}><CircleUserRound color={colors.primary} size={17} strokeWidth={2} /></View><View className={styles.heroItemCopy}><Text className={styles.heroLabel}>{messages.candidateMode}</Text><Text className={styles.heroValue}>{quest.candidateMode === 'NO_CANDIDATE' ? messages.firstCome : messages.reviewCandidates}</Text></View></View>
          </View>
          <View className={styles.heroLocation}>
            <MapPin color={colors.primary} size={20} strokeWidth={2} />
            <View className={styles.heroLocationCopy}><Text className={styles.heroLabel}>{messages.location}</Text><Text className={styles.heroLocationValue}>{quest.location}</Text><Text className={styles.heroDetail}>{locationLabel(quest, messages)}</Text></View>
          </View>
        </View>
        <ScheduleTimeline locale={locale} messages={messages} quest={quest} />
        <View className={styles.section}><Text className={styles.sectionTitle}>{messages.description}</Text><View className={styles.descriptionCard}><Text className={styles.body}>{quest.description}</Text></View></View>
        <View className={styles.section}><Text className={styles.sectionTitle}>{messages.requirements}</Text><View className={styles.requirementCard}><DetailRow icon={ClipboardCheck} label={messages.completionCriteria} value={quest.completionCriteria} /><DetailRow icon={Check} label={messages.proofRequired} value={proofLabel(quest, messages)} description={proofDescription(quest, messages)} /><DetailRow icon={UsersRound} label={messages.candidateMode} value={quest.candidateMode === 'NO_CANDIDATE' ? messages.firstCome : messages.reviewCandidates} description={candidateDescription(quest, messages)} /><DetailRow icon={BriefcaseBusiness} label={messages.participation} value={quest.participationMode === 'team' ? messages.team : messages.singlePerson} /></View></View>
        {statusTitle ? <View accessibilityRole="alert" className={cn(styles.statusCard, statusIsUnavailable && styles.statusCardBlocked, isPostView && styles.statusCardOwner, (leftQuest || joinedStatus === 'history') && styles.statusCardMuted)}><StatusIcon color={statusIconColor} size={25} strokeWidth={2.2} /><Text className={styles.statusTitle}>{statusTitle}</Text><Text className={styles.statusDescription}>{statusDescription}</Text>{!statusIsUnavailable && !isPostView && !leftQuest ? <Pressable accessibilityRole="button" onPress={() => router.push('/my-quests')} className={styles.statusAction} testID="view-my-quests"><Text className={styles.statusActionText}>{messages.viewMyQuests}</Text></Pressable> : null}</View> : null}
        {activePrototypeState ? <GroupQuestEntrySurfaces state={activePrototypeState} viewerId={prototypeViewerId} isHirer={isHirerView} messages={groupMessages} onOpenTeam={() => setTeamSheetOpen(true)} onOpenCandidateReview={() => { setSelectedProposalId(null); setCandidateReviewSheetOpen(true); }} onOpenPartialConsent={() => setPartialStartSheetDismissed(false)} /> : null}
        {activePrototypeState ? <PrototypeStatePanels state={activePrototypeState} now={effectiveNow} messages={messages} onConsent={handlePrototypeConsent} onSubmitProof={handlePrototypeSubmitProof} onConfirmCompletion={handlePrototypeConfirmCompletion} onSubmitRework={handlePrototypeSubmitRework} onReviewProof={handlePrototypeReviewProof} onDispute={handlePrototypeDispute} onResolve={handlePrototypeResolve} onComplete={handlePrototypeComplete} onCancel={handlePrototypeCancel} onPublish={handlePrototypePublish} /> : null}
      </ScrollView>
      {activePrototypeState && candidateGroup && !isHirerView ? <TeamAssembleSheet
        bottomInset={insets.bottom}
        eligibleMembers={teamDirectory}
        invitations={activePrototypeState.invitations}
        locale={locale}
        onClose={() => { setTeamSheetOpen(false); setTeamReviewing(false); setTeamSelectedMemberIds([]); setTeamSearchQuery(''); }}
        onCreateTeam={activePrototypeState.capabilities.availableActions.includes('CREATE_TEAM') ? handleCreateTeam : undefined}
        onInviteMembers={activePrototypeState.capabilities.availableActions.includes('INVITE_WORKER') ? handleInviteMembers : undefined}
        onRespondInvitation={activePrototypeState.capabilities.availableActions.includes('RESPOND_INVITATION') ? handleInvitation : undefined}
        onSearchQueryChange={setTeamSearchQuery}
        onSelectedMemberIdsChange={setTeamSelectedMemberIds}
        onReviewChange={setTeamReviewing}
        onSubmit={activePrototypeState.capabilities.availableActions.includes('SUBMIT_TEAM') ? handleSubmitTeam : undefined}
        requestedHeadcount={activePrototypeState.quest.headcount}
        reviewing={teamReviewing}
        searchQuery={teamSearchQuery}
        selectedMemberIds={teamSelectedMemberIds}
        team={teamSheetTeam}
        viewerId={applicationStudentId}
        visible={teamSheetOpen}
      /> : null}
      {activePrototypeState && isHirerView && quest.candidateMode === QuestCandidateMode.CANDIDATE ? <CandidateReviewSheet
        actualHeadcount={activePrototypeState.actualHeadcount}
        applications={activePrototypeState.applications}
        bottomInset={insets.bottom}
        locale={locale}
        mode={candidateGroup ? 'team' : 'individual'}
        onAcceptProposal={activePrototypeState.capabilities.availableActions.includes('SELECT_CANDIDATE') ? handleSelectCandidate : undefined}
        onClose={() => { setCandidateReviewSheetOpen(false); setSelectedProposalId(null); }}
        onRejectProposal={activePrototypeState.capabilities.availableActions.includes(candidateGroup ? 'REJECT_TEAM' : 'REJECT_CANDIDATE') ? handleRejectCandidate : undefined}
        onSelectProposal={setSelectedProposalId}
        questTitle={quest.title}
        requestedHeadcount={activePrototypeState.quest.headcount}
        rewardSatangPerWorker={activePrototypeState.quest.reward.rewardSatang}
        selectedProposalId={selectedProposalId}
        settlement={activePrototypeState.settlement}
        teams={candidateGroup ? activePrototypeState.teams.filter((team) => team.status !== QuestTeamStatus.TEAM_FORMING) : []}
        visible={candidateReviewSheetOpen}
      /> : null}
      {activePrototypeState
        && activePrototypeState.quest.participation === QuestParticipation.GROUP
        && activePrototypeState.quest.candidateMode === QuestCandidateMode.NO_CANDIDATE
        && activePrototypeState.partialStartConsent ? <PartialGroupStartConsentSheet
        actualHeadcount={activePrototypeState.actualHeadcount}
        bottomInset={insets.bottom}
        canRespond={activePrototypeState.capabilities.availableActions.includes('VOTE_PARTIAL_GROUP_START_CONSENT')}
        consent={activePrototypeState.partialStartConsent}
        hirerId={activePrototypeState.quest.hirerId}
        locale={locale}
        now={effectiveNow}
        onClose={() => setPartialStartSheetDismissed(true)}
        onVote={handlePartialStartVote}
        questTitle={quest.title}
        requestedHeadcount={activePrototypeState.quest.headcount}
        voters={partialVoters}
        viewerId={prototypeViewerId}
        visible={partialStartSheetOpen}
      /> : null}
      {isPostView ? <View className={styles.actionBar} style={{ paddingBottom: getActionBarPaddingBottom(insets.bottom) }}><Pressable accessibilityRole="button" onPress={handleEditPost} className={styles.primaryAction} testID="quest-edit-post-button"><Pencil color={colors.white} size={19} strokeWidth={2.2} /><Text className={styles.primaryActionText}>{messages.editPost}</Text></Pressable></View> : canMessageOwner || (isJoinView && !leftQuest && joinedStatus !== 'history') || canApply ? <View className={styles.actionBar} style={{ paddingBottom: getActionBarPaddingBottom(insets.bottom) }} testID="quest-action-bar"><View className={styles.actionRow}>{canMessageOwner ? <Pressable accessibilityLabel={messages.messageOwner} accessibilityRole="button" className={styles.messageOwnerAction} onPress={handleMessageOwner} testID="quest-message-owner-button"><MessageCircle color={colors.primary} size={18} strokeWidth={2.2} /><Text className={styles.messageOwnerActionText} numberOfLines={1}>{messages.messageOwnerShort}</Text></Pressable> : null}{isJoinView && !leftQuest && joinedStatus !== 'history' ? <Pressable accessibilityRole="button" onPress={handleLeaveQuest} className={styles.leaveAction} testID="quest-leave-button"><LogOut color={colors.dangerDark} size={19} strokeWidth={2.2} /><Text className={styles.leaveActionText}>{joinedStatus === 'pending' ? messages.withdrawApplication : messages.leaveQuest}</Text></Pressable> : canApply ? <Pressable accessibilityRole="button" onPress={() => setManualConfirmationOpen(true)} className={styles.primaryAction} testID="quest-apply-button"><Text className={styles.primaryActionText}>{firstCome ? messages.joinNow : messages.applyNow}</Text></Pressable> : null}</View></View> : null}
      {confirmationOpen ? <ConfirmationSheet locale={locale} messages={messages} onCancel={() => { setManualConfirmationOpen(false); setDismissedIntent(routeIntentKey); }} onConfirm={confirmApplication} quest={quest} /> : null}
    </SafeAreaView>
  );
}
