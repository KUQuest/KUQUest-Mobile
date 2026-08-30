import React, { useMemo, useState } from 'react';
import { AccessibilityInfo, Alert, PanResponder, type GestureResponderEvent, type PanResponderGestureState, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleHelp,
  CircleUserRound,
  CircleX,
  Clock3,
  MapPin,
  MessageSquare,
  Pencil,
  Plus,
  UsersRound,
  type LucideIcon,
} from 'lucide-react-native';

import { cn } from '@/tw/cn';
import { useNavigationVisibility } from '@/components/navigation/NavigationVisibilityContext';
import { PrototypeMenu } from '@/components/ui/PrototypeMenu';
import { QuestFundingSummary } from '@/components/ui/QuestFundingSummary';
import { usePrototypeMenuState } from '@/components/ui/prototypeMenuState';
import { PROTOTYPE_PERSONAS, type PrototypePersonaId, type PrototypeScenarioRoute } from '@/components/ui/prototypeMenuData';
import { Pressable, SafeAreaView, ScrollView, Text, View } from '@/tw';
import { useLocale, type SupportedLocale } from '@/locales/LocaleProvider';
import { colors } from '@/theme/colors';
import { getAppChromeMetrics } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import styles from './myQuestStyles';
import { getLocalizedQuest } from '@/features/questBoard/questTranslations';
import { CandidateReviewSheet } from '@/features/questBoard/components';
import { getQuestRewardSatang, questWorkflow } from '@/features/questBoard/questWorkflow';
import { QuestParticipation, QuestStatus, QuestTeamStatus, formatSatang, type QuestDetailState, type WorkConversationCapability } from '@/features/questBoard/types';
import { groupQuestMessages } from '@/locales/groupQuestMessages';
import { questBoardMessages } from '@/locales/questBoardMessages';
import { getChatRouteParams } from '@/features/chat/chatData';

type Role = 'worker' | 'hirer';
type WorkerTab = 'pending' | 'accepted' | 'history';
type HirerTab = 'active' | 'draft' | 'completed';
type QuestDetailMode = 'join' | 'post';
type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';
type CategoryTone = 'green' | 'blue' | 'purple';
type CandidateDecision = 'accept' | 'reject';

type QuestSummary = {
  id: string;
  title: string;
  tag: string;
  categoryTone: CategoryTone;
  date: string;
  location: string;
  description: string;
  detail: string;
  teamSize: string;
  status: string;
  statusTone: StatusTone;
  action: string;
  actionType?: 'edit' | 'applicants' | 'detail';
  secondaryAction?: string;
  groupChatId?: string;
  groupChatCapability?: WorkConversationCapability;
  groupChatViewerId?: string;
  host?: string;
  appliedOn?: string;
  reason?: string;
};

type SummaryMetric = {
  icon: 'applications' | 'accepted' | 'history';
  label: string;
  value: string;
  detail: string;
};

type RoleOptionCopy = {
  label: string;
  description: string;
};

type RoleCopy<T extends string> = {
  title: string;
  subtitle: string;
  tabs: Record<T, string>;
  emptyTitle: string;
  emptyDescription: string;
  tipTitle: string;
  tipDescription: string;
  summary?: SummaryMetric[];
};

type LocaleContent = {
  roleViewLabel: string;
  questNavLabel: string;
  roleSelectorLabel: string;
  statusSelectorLabel: string;
  statusSwipeLabel: string;
  statusSwipeHint: string;
  statusPreviousLabel: string;
  statusNextLabel: string;
  roleLabels: Record<Role, string>;
  roleOptions: Record<Role, RoleOptionCopy>;
  back: string;
  help: string;
  teamSize: string;
  groupChat: string;
  messageHost: string;
  appliedOn: string;
  reason: string;
  host: string;
  worker: RoleCopy<WorkerTab>;
  hirer: RoleCopy<HirerTab>;
};

const content: Record<SupportedLocale, LocaleContent> = {
  th: {
    roleViewLabel: 'มุมมองเควสต์',
    questNavLabel: 'MyQuest',
    roleSelectorLabel: 'เลือกมุมมองเควสต์',
    statusSelectorLabel: 'เลือกสถานะเควสต์',
    statusSwipeLabel: 'ปัดซ้าย-ขวา',
    statusSwipeHint: 'ปัดซ้ายหรือขวาเพื่อดูสถานะอื่น',
    statusPreviousLabel: 'สถานะก่อนหน้า',
    statusNextLabel: 'สถานะถัดไป',
    roleLabels: { worker: 'เควสต์ที่ฉันเข้าร่วม', hirer: 'เควสต์ที่ฉันโพสต์' },
    roleOptions: {
      worker: { label: 'เข้าร่วมเควสต์', description: 'ดูเควสต์ที่คุณเข้าร่วม' },
      hirer: { label: 'โพสต์เควสต์', description: 'จัดการเควสต์ที่คุณโพสต์' },
    },
    back: 'ย้อนกลับ',
    help: 'ช่วยเหลือ',
    teamSize: 'ทีม',
    groupChat: 'แชตกลุ่ม',
    messageHost: 'ข้อความ',
    appliedOn: 'สมัครเมื่อ',
    reason: 'เหตุผล',
    host: 'ผู้โพสต์',
    worker: {
      title: 'เควสต์ที่ฉันสมัคร',
      subtitle: 'ติดตามเควสต์ที่คุณสมัครไว้',
      tabs: { pending: 'รอตรวจสอบ', accepted: 'ตอบรับแล้ว', history: 'ประวัติ' },
      emptyTitle: 'ยังไม่มีเควสต์ฉบับร่าง',
      emptyDescription: 'เมื่อคุณสมัครเควสต์ใหม่ รายการจะปรากฏที่นี่',
      tipTitle: 'คุณกำลังสร้างความเปลี่ยนแปลง',
      tipDescription: 'สมัครเควสต์ต่อไปเพื่อช่วยเหลือคนในมหาวิทยาลัย',
      summary: [
        { icon: 'applications', label: 'ใบสมัคร', value: '2', detail: 'รอตรวจสอบ' },
        { icon: 'accepted', label: 'ตอบรับแล้ว', value: '2', detail: 'คุณเข้าร่วมแล้ว' },
        { icon: 'history', label: 'เควสต์ทั้งหมด', value: '4', detail: 'ตลอดเวลา' },
      ],
    },
    hirer: {
      title: 'เควสต์ของฉัน',
      subtitle: 'จัดการเควสต์ที่คุณสร้างและเข้าร่วม',
      tabs: { active: 'กำลังดำเนินการ', draft: 'ฉบับร่าง', completed: 'เสร็จแล้ว' },
      emptyTitle: 'ยังไม่มีเควสต์ฉบับร่าง',
      emptyDescription: 'เควสต์ที่คุณบันทึกไว้ก่อนเผยแพร่จะแสดงที่นี่',
      tipTitle: 'สร้างเควสต์ใหม่และชวนคนมาช่วยกัน',
      tipDescription: 'เปลี่ยนไอเดียเล็ก ๆ ให้เกิดประโยชน์กับชุมชน',
    },
  },
  en: {
    roleViewLabel: 'Quest view',
    questNavLabel: 'MyQuest',
    roleSelectorLabel: 'Choose a Quest view',
    statusSelectorLabel: 'Quest status',
    statusSwipeLabel: 'Swipe',
    statusSwipeHint: 'Swipe left or right to see more statuses',
    statusPreviousLabel: 'Previous status',
    statusNextLabel: 'Next status',
    roleLabels: { worker: 'Quests I joined', hirer: 'Quests I posted' },
    roleOptions: {
      worker: { label: 'Join Quest', description: 'View Quests you joined' },
      hirer: { label: 'Post Quest', description: 'Manage Quests you posted' },
    },
    back: 'Go back',
    help: 'Help',
    teamSize: 'Team size',
    groupChat: 'Group chat',
    messageHost: 'Message',
    appliedOn: 'Applied on',
    reason: 'Reason',
    host: 'Quest host',
    worker: {
      title: 'My Apply Quest',
      subtitle: 'Track Quests you have applied for',
      tabs: { pending: 'Pending', accepted: 'Accepted', history: 'History' },
      emptyTitle: 'No Quest applications yet',
      emptyDescription: 'Quests you apply for will appear here',
      tipTitle: 'You are making a difference',
      tipDescription: 'Keep applying for Quests that help the campus community',
      summary: [
        { icon: 'applications', label: 'Applications', value: '2', detail: 'Pending' },
        { icon: 'accepted', label: 'Accepted', value: '2', detail: "You're in!" },
        { icon: 'history', label: 'Total Quests', value: '4', detail: 'All time' },
      ],
    },
    hirer: {
      title: 'MyQuest',
      subtitle: 'Manage your created and joined missions',
      tabs: { active: 'Active', draft: 'Draft', completed: 'Completed' },
      emptyTitle: 'No Quest drafts yet',
      emptyDescription: 'Quests saved before publishing will appear here',
      tipTitle: 'Create new Quests and inspire volunteers',
      tipDescription: 'Turn a small idea into a useful campus mission',
    },
  },
};

const HIRER_PERSONA_ID = PROTOTYPE_PERSONAS[0].id;

const actionLabels: Record<SupportedLocale, { detail: string; applicants: string; edit: string; message: string; start: string }> = {
  th: { detail: 'ดูรายละเอียด', applicants: 'ดูผู้สมัคร', edit: 'แก้ไข', message: 'ข้อความ', start: 'รอเริ่มงาน' },
  en: { detail: 'View Detail', applicants: 'View Applicants', edit: 'Edit', message: 'Message', start: 'Awaiting start' },
};

function formatQuestDate(value: string, locale: SupportedLocale): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`));
}

function getCategoryTone(tag: string): CategoryTone {
  if (tag.toLocaleLowerCase().includes('print') || tag.includes('ถ่าย')) return 'blue';
  if (tag.toLocaleLowerCase().includes('design') || tag.includes('ออกแบบ')) return 'purple';
  return 'green';
}

function findCandidateProposal(state: QuestDetailState, proposalId: string) {
  const application = state.applications.find((item) => item.id === proposalId || item.proposalId === proposalId || item.teamId === proposalId);
  if (!application) return null;
  if (state.quest.participation === QuestParticipation.GROUP) {
    const team = state.teams.find((item) => item.id === application.teamId || item.proposalId === proposalId || item.id === proposalId);
    return team?.status === QuestTeamStatus.TEAM_SUBMITTED ? { application, team } : null;
  }
  return application.applicantId && !application.teamId ? { application } : null;
}

function prototypeStatusTone(status: QuestDetailState['quest']['status']): StatusTone {
  if (status === QuestStatus.QUEST_COMPLETED) return 'success';
  if (status === QuestStatus.QUEST_CANCELLED || status === QuestStatus.QUEST_DISPUTED) return 'danger';
  if (status === QuestStatus.QUEST_AWAITING_CONSENT || status === QuestStatus.QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT || status === QuestStatus.QUEST_AWAITING_EDIT_CONSENT || status === QuestStatus.QUEST_REWORK || status === QuestStatus.QUEST_SUBMITTED) return 'warning';
  if (status === QuestStatus.QUEST_DRAFT) return 'neutral';
  return 'success';
}

function prototypeStateSummary(state: QuestDetailState, role: Role, locale: SupportedLocale, viewerId: string): QuestSummary | null {
  const boardQuestState = questWorkflow.getQuestBoardQuest(state.quest.id, viewerId);
  if (!boardQuestState) return null;
  const boardQuest = getLocalizedQuest(boardQuestState, locale);
  const status = state.quest.status;
  const hasAssignment = state.assignments.some((item) => item.workerId === viewerId);
  const isTerminal = status === QuestStatus.QUEST_COMPLETED || status === QuestStatus.QUEST_CANCELLED;
  const hasApplication = state.applications.some((item) => item.applicantId === viewerId && item.status === 'APPLICATION_APPLIED');
  if (role === 'worker' && !hasAssignment && !hasApplication) return null;
  if (role === 'hirer' && state.quest.hirerId !== viewerId) return null;
  const date = `${formatQuestDate(boardQuest.startDate, locale)}${boardQuest.timeRange ? ` · ${boardQuest.timeRange}` : ''}`;
  const statusLabel = questBoardMessages[locale].statusLabel(status);
  const acceptedCount = state.team?.members.length ?? boardQuest.acceptedParticipants;
  const labels = actionLabels[locale];
  const workerPending = role === 'worker' && !hasAssignment && hasApplication;
  const workerHistory = role === 'worker' && hasAssignment && isTerminal;
  const candidateQuest = role === 'hirer' && state.quest.candidateMode === 'CANDIDATE';
  const groupChatId = state.conversation.canRead ? state.conversation.conversationId ?? undefined : undefined;
  const groupChatCapability = groupChatId ? state.conversation : undefined;
  return {
    id: boardQuest.id,
    title: boardQuest.title,
    tag: boardQuest.tags[0] ?? 'Quest',
    categoryTone: getCategoryTone(boardQuest.tags[0] ?? ''),
    date,
    location: boardQuest.location,
    description: boardQuest.description,
    detail: workerHistory ? `${statusLabel} · ${formatSatang(getQuestRewardSatang(boardQuest), locale)}` : statusLabel,
    teamSize: `${acceptedCount} / ${boardQuest.headcount}`,
    status: statusLabel,
    statusTone: prototypeStatusTone(status),
    action: role === 'hirer' && status === QuestStatus.QUEST_DRAFT ? labels.edit : candidateQuest ? labels.applicants : role === 'worker' && !workerPending && groupChatId ? labels.message : labels.detail,
    actionType: role === 'hirer' && status === QuestStatus.QUEST_DRAFT ? 'edit' : candidateQuest ? 'applicants' : 'detail',
    secondaryAction: role === 'hirer' && status !== QuestStatus.QUEST_DRAFT && !isTerminal ? labels.edit : undefined,
    groupChatId,
    groupChatCapability,
    groupChatViewerId: viewerId,
    host: state.quest.hirerId,
    appliedOn: workerPending ? statusLabel : undefined,
  };
}

/**
 * My Quests currently reads the canonical Quest projection through Quest Workflow. There is
 * no asynchronous loader on either the demo or non-demo route, so an empty
 * workflow result must remain an empty state rather than a fabricated skeleton.
 */
function getWorkflowItems(role: Role, tab: WorkerTab | HirerTab, locale: SupportedLocale, viewerId: string): QuestSummary[] {
  return questWorkflow.getMyQuestsModel(viewerId).flatMap((state) => {
    const summary = prototypeStateSummary(state, role, locale, viewerId);
    if (!summary) return [];
    if (role === 'worker') {
      const hasAssignment = state.assignments.some((item) => item.workerId === viewerId);
      const isTerminal = state.quest.status === QuestStatus.QUEST_COMPLETED || state.quest.status === QuestStatus.QUEST_CANCELLED;
      const isPending = state.applications.some((item) => item.applicantId === viewerId && item.status === 'APPLICATION_APPLIED') && !hasAssignment;
      const expectedTab: WorkerTab = isPending ? 'pending' : isTerminal ? 'history' : 'accepted';
      return tab === expectedTab ? [summary] : [];
    }
    const expectedTab: HirerTab = state.quest.status === QuestStatus.QUEST_DRAFT ? 'draft' : state.quest.status === QuestStatus.QUEST_COMPLETED || state.quest.status === QuestStatus.QUEST_CANCELLED ? 'completed' : 'active';
    return tab === expectedTab ? [summary] : [];
  });
}

const workerTabs: WorkerTab[] = ['pending', 'accepted', 'history'];
const hirerTabs: HirerTab[] = ['active', 'draft', 'completed'];

const statusPalette: Record<StatusTone, { backgroundColor: string; borderColor: string; foreground: string }> = {
  success: { backgroundColor: colors.surfaceSuccess, borderColor: colors.borderSuccess, foreground: colors.success },
  warning: { backgroundColor: '#FFF4D9', borderColor: '#F2D18A', foreground: '#B86B00' },
  danger: { backgroundColor: colors.surfaceDanger, borderColor: colors.borderDanger, foreground: colors.dangerDark },
  neutral: { backgroundColor: colors.surfaceMuted, borderColor: colors.border, foreground: colors.textSecondary },
};

const categoryPalette: Record<CategoryTone, { backgroundColor: string; foreground: string }> = {
  green: { backgroundColor: colors.surfaceSuccess, foreground: colors.primary },
  blue: { backgroundColor: '#EAF2FC', foreground: '#1557A6' },
  purple: { backgroundColor: '#F3E8F8', foreground: '#7A3FA1' },
};

function renderActionIcon(label: string, size: number) {
  if (/edit|แก้ไข/i.test(label)) return <Pencil color={colors.primary} size={size} strokeWidth={2.1} />;
  if (/applicant|ผู้สมัคร/i.test(label)) return <UsersRound color={colors.primary} size={size} strokeWidth={2.1} />;
  if (/message|chat|แชต|ข้อความ/i.test(label)) return <MessageSquare color={colors.primary} size={size} strokeWidth={2.1} />;
  return <ChevronRight color={colors.primary} size={size} strokeWidth={2.1} />;
}

function CategoryTag({ quest }: { quest: QuestSummary }) {
  const palette = categoryPalette[quest.categoryTone];
  return (
    <View className={styles.categoryTag} style={{ backgroundColor: palette.backgroundColor }}>
      <BriefcaseBusiness color={palette.foreground} size={13} strokeWidth={2} />
      <Text className={styles.categoryTagText} style={{ color: palette.foreground }}>{quest.tag}</Text>
    </View>
  );
}

function StatusPill({ status, tone, stretch = false }: { status: string; tone: StatusTone; stretch?: boolean }) {
  const palette = statusPalette[tone];
  const Icon = tone === 'success' ? Check : tone === 'danger' ? CircleX : Clock3;
  return (
    <View accessibilityLabel={status} className={cn(styles.statusPill, stretch && styles.statusPillStretch)} style={{ backgroundColor: palette.backgroundColor, borderColor: palette.borderColor }}>
      <Icon color={palette.foreground} size={14} strokeWidth={2.2} />
      <Text className={styles.statusText} style={{ color: palette.foreground }}>{status}</Text>
    </View>
  );
}

function QuestMeta({ quest }: { quest: QuestSummary }) {
  return (
    <View className={styles.metaRow}>
      <CalendarDays color={colors.textSecondary} size={14} strokeWidth={1.9} />
      <Text className={styles.metaText} numberOfLines={1}>{quest.date}</Text>
      <View className={styles.metaDivider} />
      <MapPin color={colors.textSecondary} size={14} strokeWidth={1.9} />
      <Text className={styles.metaText} numberOfLines={1}>{quest.location}</Text>
    </View>
  );
}

function TeamRow({ quest, copy }: { quest: QuestSummary; copy: LocaleContent }) {
  const palette = statusPalette[quest.statusTone];
  return (
    <View accessibilityLabel={`${copy.teamSize} ${quest.teamSize}`} className={styles.teamRow}>
      <View className={styles.teamMetric}>
        <Text className={styles.metricLabel}>{copy.teamSize}</Text>
        <UsersRound color={palette.foreground} size={16} strokeWidth={2} />
        <Text className={styles.metricValue} style={{ color: palette.foreground }}>{quest.teamSize}</Text>
      </View>
    </View>
  );
}

function ActionButton({ label, onPress, testID, compact = false, full = false, highlighted = false, accessibilityLabel }: { label: string; onPress: () => void; testID: string; compact?: boolean; full?: boolean; highlighted?: boolean; accessibilityLabel?: string }) {
  return (
    <Pressable accessibilityLabel={accessibilityLabel ?? label} accessibilityRole="button" className={cn(styles.actionButton, compact && styles.actionButtonCompact, full && styles.actionButtonFull, highlighted && styles.actionButtonHighlighted)} onPress={onPress} testID={testID}>
      {renderActionIcon(label, compact ? 14 : 17)}
      <Text className={cn(styles.actionText, compact && styles.actionTextCompact)}>{label}</Text>
    </Pressable>
  );
}

function CreatedQuestCard({ quest, copy, onPress, onPrimaryAction, onGroupChat }: { quest: QuestSummary; copy: LocaleContent; onPress: () => void; onPrimaryAction: () => void; onGroupChat: () => void }) {
  return (
    <View className={styles.card}>
      <View className={styles.cardHeadingRow}>
        <View className={styles.cardHeadingCopy}>
          <CategoryTag quest={quest} />
          <Text className={styles.cardTitle} numberOfLines={2}>{quest.title}</Text>
        </View>
        <StatusPill status={quest.status} tone={quest.statusTone} />
      </View>
      <QuestMeta quest={quest} />
      <Text className={styles.cardDescription} numberOfLines={2}>{quest.description}</Text>
      <TeamRow copy={copy} quest={quest} />
      <View className={styles.actionsRow}>
        {quest.secondaryAction ? <ActionButton label={quest.secondaryAction} onPress={onPress} testID={`my-quest-action-${quest.id}-secondary`} /> : null}
        <ActionButton full={!quest.secondaryAction} label={quest.action} onPress={onPrimaryAction} testID={`my-quest-action-${quest.id}`} />
      </View>
      {quest.groupChatId ? <View className={styles.groupChatRow}><ActionButton highlighted full label={copy.groupChat} onPress={onGroupChat} testID={`my-quest-group-chat-${quest.id}`} /></View> : null}
    </View>
  );
}

function ApplicationQuestCard({ quest, copy, onPress, onGroupChat }: { quest: QuestSummary; copy: LocaleContent; onPress: () => void; onGroupChat: () => void }) {
  const sideDetailLabel = quest.reason ? copy.reason : copy.appliedOn;
  const sideDetail = quest.reason ?? quest.appliedOn;
  const questAccessibilityLabel = [quest.title, quest.status, quest.date, quest.location, quest.detail].join('. ');
  return (
    <View className={styles.applicationCard}>
      <Pressable
        accessibilityLabel={questAccessibilityLabel}
        accessibilityRole="button"
        className={styles.applicationCardBody}
        onPress={onPress}
        testID={`my-quest-card-${quest.id}`}
      >
        <View className={styles.cardHeadingRow}>
          <View className={styles.cardHeadingCopy}>
            <CategoryTag quest={quest} />
            <Text className={styles.applicationTitle} numberOfLines={2}>{quest.title}</Text>
          </View>
          <StatusPill status={quest.status} tone={quest.statusTone} />
        </View>
        <QuestMeta quest={quest} />
        <Text className={styles.applicationDescription} numberOfLines={2}>{quest.description}</Text>
        <View className={styles.hostRow}>
          <View className={styles.hostIcon}><CircleUserRound color={colors.primary} size={15} strokeWidth={2} /></View>
          <Text className={styles.hostText} numberOfLines={1}>{quest.host ?? quest.detail}</Text>
        </View>
        <View className={styles.applicationFacts}>
          <View className={styles.applicationFact}>
            <Text className={styles.sideLabel}>{sideDetailLabel}</Text>
            <Text className={styles.sideValue} numberOfLines={2}>{sideDetail ?? quest.detail}</Text>
          </View>
          {!quest.reason ? <View className={styles.applicationFact}><Text className={styles.sideLabel}>{copy.teamSize}</Text><View className={styles.sideTeam}><UsersRound color={colors.primary} size={14} strokeWidth={2} /><Text className={styles.sideValue} numberOfLines={1}>{quest.teamSize}</Text></View></View> : null}
        </View>
      </Pressable>
      {quest.groupChatId ? <View className={styles.groupChatRow}><ActionButton accessibilityLabel={`${copy.messageHost}: ${quest.host ?? quest.title}`} highlighted full label={copy.messageHost} onPress={onGroupChat} testID={`my-quest-message-${quest.id}`} /></View> : null}
    </View>
  );
}

function EmptyState({ copy }: { copy: RoleCopy<WorkerTab> | RoleCopy<HirerTab> }) {
  return (
    <View accessibilityLabel={copy.emptyTitle} className={styles.emptyState}>
      <View className={styles.emptyIcon}><Plus color={colors.primary} size={24} strokeWidth={2.1} /></View>
      <Text className={styles.emptyTitle}>{copy.emptyTitle}</Text>
      <Text className={styles.emptyDescription}>{copy.emptyDescription}</Text>
    </View>
  );
}

function RoleMenu({ copy, role, onSelect }: { copy: LocaleContent; role: Role; onSelect: (nextRole: Role) => void }) {
  return (
    <View accessibilityLabel={copy.roleSelectorLabel} accessibilityRole="menu" className={styles.roleMenu}>
      <Text className={styles.roleMenuTitle}>{copy.roleSelectorLabel}</Text>
      {(['worker', 'hirer'] as const).map((option) => {
        const selected = role === option;
        const RoleIcon = option === 'worker' ? UsersRound : BriefcaseBusiness;
        const optionCopy = copy.roleOptions[option];
        return <Pressable accessibilityLabel={`${optionCopy.label}. ${optionCopy.description}`} accessibilityRole="menuitem" accessibilityState={{ selected }} className={cn(styles.roleMenuOption, selected && styles.roleMenuOptionActive)} key={option} onPress={() => onSelect(option)} testID={`my-quests-role-${option}`}><View className={styles.roleMenuIcon}><RoleIcon color={colors.primary} size={20} strokeWidth={2.1} /></View><View className={styles.roleMenuCopy}><Text className={cn(styles.roleMenuOptionText, selected && styles.roleMenuOptionTextActive)}>{optionCopy.label}</Text><Text className={styles.roleMenuOptionDescription}>{optionCopy.description}</Text></View>{selected ? <View className={styles.roleMenuCheck}><Check color={colors.white} size={14} strokeWidth={3} /></View> : null}</Pressable>;
      })}
    </View>
  );
}

function SummaryStrip({ metrics }: { metrics: SummaryMetric[] }) {
  const icons: Record<SummaryMetric['icon'], LucideIcon> = { applications: BriefcaseBusiness, accepted: UsersRound, history: Clock3 };
  return (
    <View accessibilityLabel={metrics.map((metric) => `${metric.label} ${metric.value} ${metric.detail}`).join('. ')} className={styles.summaryStrip}>
      <View className={styles.summaryMetrics}>
        {metrics.map((metric, index) => {
          const Icon = icons[metric.icon];
          return <React.Fragment key={metric.label}>
            {index > 0 ? <View className={styles.summaryDivider} /> : null}
            <View className={styles.summaryMetric}>
              <View className={styles.summaryIcon}><Icon color={colors.primary} size={20} strokeWidth={1.9} /></View>
              <View className={styles.summaryCopy}><Text className={styles.summaryLabel}>{metric.label}</Text><Text className={styles.summaryValue}>{metric.value}</Text><Text className={styles.summaryDetail}>{metric.detail}</Text></View>
            </View>
          </React.Fragment>;
        })}
      </View>
    </View>
  );
}

function TipCard({ title, description }: { title: string; description: string }) {
  return <View className={styles.tipCard}><View className={styles.tipIcon}><CircleHelp color={colors.primary} size={22} strokeWidth={1.9} /></View><View className={styles.tipCopy}><Text className={styles.tipTitle}>{title}</Text><Text className={styles.tipDescription}>{description}</Text></View></View>;
}

export default function MyQuestsScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const chromeMetrics = getAppChromeMetrics(width, fontScale);
  const { handleScroll } = useNavigationVisibility();
  const copy = content[locale];
  const { activePersonaId, onPersonaChange, onReset } = usePrototypeMenuState();
  const [roleSelection, setRoleSelection] = useState<{ personaId: PrototypePersonaId; role: Role } | null>(null);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [workerTab, setWorkerTab] = useState<WorkerTab>('pending');
  const [hirerTab, setHirerTab] = useState<HirerTab>('active');
  const [candidateReviewQuestId, setCandidateReviewQuestId] = useState<string | null>(null);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [workflowRevision, setWorkflowRevision] = useState(0);
  React.useEffect(() => questWorkflow.subscribe(() => setWorkflowRevision((revision) => revision + 1)), []);
  const role = roleSelection?.personaId === activePersonaId
    ? roleSelection.role
    : activePersonaId === HIRER_PERSONA_ID
      ? 'hirer'
      : 'worker';
  const roleCopy = role === 'worker' ? copy.worker : copy.hirer;
  const selectedTab = role === 'worker' ? workerTab : hirerTab;
  // The role selector remains an explicit view lens for existing My Quests
  // behavior; a selected prototype persona is always used for the worker view.
  const viewerId = role === 'hirer' && activePersonaId !== HIRER_PERSONA_ID ? HIRER_PERSONA_ID : activePersonaId;
  const candidateReviewState = candidateReviewQuestId
    ? questWorkflow.getQuestDetailState(candidateReviewQuestId, viewerId)
    : null;
  const canRejectCandidate = candidateReviewState
    ? candidateReviewState.capabilities.availableActions.includes(candidateReviewState.quest.participation === QuestParticipation.GROUP ? 'REJECT_TEAM' : 'REJECT_CANDIDATE')
    : false;
  const items = useMemo(() => {
    void workflowRevision;
    return getWorkflowItems(role, selectedTab, locale, viewerId);
  }, [workflowRevision, locale, role, selectedTab, viewerId]);
  const summary = useMemo(() => {
    void workflowRevision;
    if (role !== 'worker' || !copy.worker.summary) return null;
    const counts = workerTabs.map((tab) => getWorkflowItems('worker', tab, locale, activePersonaId).length);
    return copy.worker.summary.map((metric, index) => ({
      ...metric,
      value: String(index === 0 ? counts[0] : index === 1 ? counts[1] : counts.reduce((total, count) => total + count, 0)),
      detail: index === 0 ? copy.worker.tabs.pending : index === 1 ? copy.worker.tabs.accepted : copy.worker.tabs.history,
    }));
  }, [activePersonaId, workflowRevision, copy, locale, role]);
  const tabOptions: readonly (WorkerTab | HirerTab)[] = role === 'worker' ? workerTabs : hirerTabs;
  const bottomPadding = (chromeMetrics.isTablet ? spacing.lg : chromeMetrics.navHeight + insets.bottom) + spacing.lg;

  const selectRole = (nextRole: Role) => {
    setRoleSelection({ personaId: activePersonaId, role: nextRole });
    setRoleMenuOpen(false);
    AccessibilityInfo.announceForAccessibility(copy.roleLabels[nextRole]);
  };

  const handlePersonaChange = (personaId: Parameters<typeof onPersonaChange>[0]) => {
    onPersonaChange(personaId);
    setRoleSelection(null);
    setRoleMenuOpen(false);
    setCandidateReviewQuestId(null);
    setSelectedProposalId(null);
  };

  const handlePrototypeReset = (scope: Parameters<typeof onReset>[0]) => {
    onReset(scope);
    setRoleMenuOpen(false);
    setCandidateReviewQuestId(null);
    setSelectedProposalId(null);
  };

  const openPrototypeScenario = (route: PrototypeScenarioRoute) => {
    router.push(route);
  };

  const prototypeMenu = (
    <PrototypeMenu
      activePersonaId={activePersonaId}
      compact
      onPersonaChange={handlePersonaChange}
      onReset={handlePrototypeReset}
      onScenarioPress={openPrototypeScenario}
      testID="my-quests-prototype-menu"
    />
  );

  const selectTab = (nextTab: WorkerTab | HirerTab) => {
    const wasSelected = selectedTab === nextTab;
    if (role === 'worker') {
      setWorkerTab(nextTab as WorkerTab);
    } else {
      setHirerTab(nextTab as HirerTab);
    }
    if (!wasSelected) {
      AccessibilityInfo.announceForAccessibility(role === 'worker' ? copy.worker.tabs[nextTab as WorkerTab] : copy.hirer.tabs[nextTab as HirerTab]);
    }
  };

  const moveStatus = (direction: -1 | 1) => {
    const currentIndex = tabOptions.indexOf(selectedTab);
    const nextIndex = (currentIndex + direction + tabOptions.length) % tabOptions.length;
    const nextTab = tabOptions[nextIndex];
    if (nextTab) selectTab(nextTab);
  };

  const handleStatusSwipe = (_event: GestureResponderEvent, gestureState: PanResponderGestureState) => {
    if (Math.abs(gestureState.dx) < 32 || Math.abs(gestureState.dx) <= Math.abs(gestureState.dy)) return;
    moveStatus(gestureState.dx < 0 ? 1 : -1);
  };

  const statusSwipeResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gestureState) => Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
    onPanResponderRelease: handleStatusSwipe,
  });

  const openQuest = (questId: string, mode?: QuestDetailMode, joinStatus?: WorkerTab) => {
    router.push({ pathname: '/quest/[id]', params: { id: questId, ...(mode ? { mode } : {}), ...(mode === 'join' && joinStatus ? { joinStatus } : {}) } });
  };

  const openGroupChat = (chatId: string, questId?: string, capability?: WorkConversationCapability, viewerId?: string) => {
    if (!questId || !viewerId || !capability?.conversationId || !capability.canRead || capability.conversationId !== chatId) return;
    router.push({ pathname: '/chat/[id]', params: getChatRouteParams({ conversationId: capability.conversationId, questId, viewerId, capability }) });
  };

  const openPrimaryQuestAction = (quest: QuestSummary) => {
    if (quest.actionType === 'edit') {
      router.push({ pathname: '/create', params: { editQuestId: quest.id } });
      return;
    }
    if (quest.actionType === 'applicants') {
      setSelectedProposalId(null);
      setCandidateReviewQuestId(quest.id);
      return;
    }
    openQuest(quest.id, 'post');
  };

  const closeCandidateReview = () => {
    setCandidateReviewQuestId(null);
    setSelectedProposalId(null);
  };

  const applyCandidateDecision = (proposalId: string, decision: CandidateDecision) => {
    if (!candidateReviewQuestId) return;
    const state = questWorkflow.getQuestDetailState(candidateReviewQuestId, viewerId);
    if (!state) return;
    const proposal = findCandidateProposal(state, proposalId);
    if (!proposal) return;
    const team = 'team' in proposal ? proposal.team : undefined;
    const result = state.quest.participation === QuestParticipation.GROUP && team
      ? decision === 'reject'
        ? questWorkflow.rejectTeam(candidateReviewQuestId, team.id, viewerId)
        : questWorkflow.selectTeam(candidateReviewQuestId, team.id, viewerId)
      : decision === 'reject'
        ? questWorkflow.rejectCandidate(candidateReviewQuestId, proposal.application.id, viewerId)
        : questWorkflow.selectCandidate(candidateReviewQuestId, proposal.application.id, viewerId);
    if (!result.ok) Alert.alert(questBoardMessages[locale].details, result.error.message);
  };

  const confirmCandidateDecision = (proposalId: string, decision: CandidateDecision) => {
    const state = candidateReviewState;
    if (!state) return;
    const proposal = findCandidateProposal(state, proposalId);
    if (!proposal) return;
    setSelectedProposalId(proposalId);
    const messages = groupQuestMessages[locale];
    const action = decision === 'accept' ? messages.accept : messages.reject;
    const proposalType = state.quest.participation === QuestParticipation.GROUP ? messages.teamProposal : messages.individualProposal;
    Alert.alert(action, `${state.quest.title}\n${proposalType}`, [
      { text: messages.cancel, style: 'cancel' },
      { text: action, style: decision === 'reject' ? 'destructive' : 'default', onPress: () => applyCandidateDecision(proposalId, decision) },
    ]);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className={styles.safeArea}>
      <View className={cn(styles.hero, roleMenuOpen && styles.heroMenuOpen)}>
        <View className={styles.headerRow}>
          <Pressable accessibilityLabel={copy.back} accessibilityRole="button" className={styles.heroIconButton} onPress={() => router.back()} testID="my-quests-back-button"><ArrowLeft color={colors.primary} size={24} strokeWidth={2.2} /></Pressable>
          <Pressable accessibilityLabel={`${copy.roleViewLabel}: ${copy.questNavLabel}`} accessibilityRole="button" accessibilityState={{ expanded: roleMenuOpen }} className={cn(styles.roleNavButton, roleMenuOpen && styles.roleNavButtonOpen)} onPress={() => setRoleMenuOpen((isOpen) => !isOpen)} testID="my-quests-role-trigger"><Text className={styles.roleNavText}>{copy.questNavLabel}</Text>{roleMenuOpen ? <ChevronUp color={colors.primary} size={18} strokeWidth={2.4} /> : <ChevronDown color={colors.primary} size={18} strokeWidth={2.4} />}</Pressable>
          {prototypeMenu}
        </View>
        {roleMenuOpen ? <RoleMenu copy={copy} onSelect={selectRole} role={role} /> : null}
        <Text className={styles.heroSubtitle}>{roleCopy.subtitle}</Text>
        <View className={styles.selectorSectionStatus}>
          <View className={styles.selectorLabelRow}>
            <Text className={styles.selectorLabel}>{copy.statusSelectorLabel}</Text>
            <View className={styles.selectorSwipeHint}>
              <ChevronLeft color={colors.textMuted} size={12} strokeWidth={2.4} />
              <Text className={styles.selectorSwipeHintText}>{copy.statusSwipeLabel}</Text>
              <ChevronRight color={colors.textMuted} size={12} strokeWidth={2.4} />
            </View>
          </View>
          <View
            accessibilityHint={copy.statusSwipeHint}
            accessibilityLabel={`${roleCopy.title} status selector`}
            accessibilityRole="tablist"
            className={styles.statusTabsFrame}
            {...statusSwipeResponder.panHandlers}
            testID="my-quests-status-carousel"
          >
            <Pressable accessibilityLabel={copy.statusPreviousLabel} accessibilityRole="button" className={styles.statusArrow} onPress={() => moveStatus(-1)} testID="my-quests-status-previous"><ChevronLeft color={colors.primary} size={20} strokeWidth={2.4} /></Pressable>
            <View accessibilityLabel={`${role === 'worker' ? copy.worker.tabs[workerTab] : copy.hirer.tabs[hirerTab]} (${items.length})`} accessibilityRole="tab" accessibilityState={{ selected: true }} className={styles.statusCurrent}>
              <Text className={styles.statusCurrentText}>{role === 'worker' ? copy.worker.tabs[workerTab] : copy.hirer.tabs[hirerTab]}</Text>
              <View className={cn(styles.statusCount, styles.statusCountActive)}><Text className={cn(styles.statusCountText, styles.statusCountTextActive)}>{items.length}</Text></View>
            </View>
            <Pressable accessibilityLabel={copy.statusNextLabel} accessibilityRole="button" className={styles.statusArrow} onPress={() => moveStatus(1)} testID="my-quests-status-next"><ChevronRight color={colors.primary} size={20} strokeWidth={2.4} /></Pressable>
          </View>
        </View>
      </View>

      <ScrollView onScroll={handleScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPadding }}>
        <View className={styles.surface}>
          {role === 'hirer' ? <QuestFundingSummary locale={locale} /> : null}
          <View accessibilityLabel={`${role === 'worker' ? copy.worker.tabs[workerTab] : copy.hirer.tabs[hirerTab]} Quest list`} className={styles.list}>
            {items.length > 0 ? items.map((quest: QuestSummary) => role === 'worker'
              ? <ApplicationQuestCard key={quest.id} copy={copy} onGroupChat={() => quest.groupChatId ? openGroupChat(quest.groupChatId, quest.id, quest.groupChatCapability, quest.groupChatViewerId) : undefined} onPress={() => openQuest(quest.id, 'join', workerTab)} quest={quest} />
              : <CreatedQuestCard key={quest.id} copy={copy} onGroupChat={() => quest.groupChatId ? openGroupChat(quest.groupChatId, quest.id, quest.groupChatCapability, quest.groupChatViewerId) : undefined} onPrimaryAction={() => openPrimaryQuestAction(quest)} onPress={() => openQuest(quest.id, 'post')} quest={quest} />) : <EmptyState copy={roleCopy} />}
          </View>
          {role === 'worker' && summary ? <SummaryStrip metrics={summary} /> : null}
          <TipCard description={roleCopy.tipDescription} title={roleCopy.tipTitle} />
        </View>
      </ScrollView>
      {candidateReviewQuestId ? <CandidateReviewSheet
        actualHeadcount={candidateReviewState?.actualHeadcount}
        applications={candidateReviewState?.applications ?? []}
        bottomInset={insets.bottom}
        locale={locale}
        mode={candidateReviewState?.quest.participation === QuestParticipation.GROUP ? 'team' : 'individual'}
        onAcceptProposal={candidateReviewState?.capabilities.availableActions.includes('SELECT_CANDIDATE') ? (proposalId) => confirmCandidateDecision(proposalId, 'accept') : undefined}
        onClose={closeCandidateReview}
        onRejectProposal={canRejectCandidate ? (proposalId) => confirmCandidateDecision(proposalId, 'reject') : undefined}
        onSelectProposal={setSelectedProposalId}
        questTitle={candidateReviewState?.quest.title}
        requestedHeadcount={candidateReviewState?.quest.requestedHeadcount ?? candidateReviewState?.quest.headcount}
        rewardSatangPerWorker={candidateReviewState?.quest.reward.rewardSatang}
        selectedProposalId={selectedProposalId}
        settlement={candidateReviewState?.settlement}
        teams={candidateReviewState?.quest.participation === QuestParticipation.GROUP ? candidateReviewState.teams.filter((team) => team.status !== QuestTeamStatus.TEAM_FORMING) : []}
        visible={Boolean(candidateReviewState)}
      /> : null}
    </SafeAreaView>
  );
}
