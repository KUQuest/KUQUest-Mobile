import React, { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { authService } from '../auth/AuthService';
import { TopBar } from '@/components/ui/TopBar';
import { useLocale } from '@/locales/LocaleProvider';
import { questBoardMessages, type QuestBoardMessages } from '@/locales/questBoardMessages';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import styles from './questDetailStyles';
import {
  getQuestApplicationOutcome,
  getQuestApplicationStore,
  type QuestApplicationStatus,
} from './questApplication';
import { getQuestAvailability } from './questBoardViewData';
import { getQuestDetailFixture, parseBoardPreviewState, type BoardPreviewState } from './questBoardHarness';
import { parseQuestIntent, parseQuestRouteId, parseStudentId } from './questRoute';
import type { QuestBoardQuest } from './types';

export interface QuestDetailScreenProps {
  now?: Date;
  previewState?: BoardPreviewState;
  questId?: string;
  studentId?: string;
}

const FIXTURE_NOW = new Date('2026-08-12T09:00:00.000Z');
const DEFAULT_STUDENT_ID = 'anonymous-session';

function formatDeadline(value: string, locale: 'en' | 'th'): string {
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function categoryLabel(quest: QuestBoardQuest, messages: QuestBoardMessages): string {
  if (quest.category === 'technology') return messages.technology;
  if (quest.category === 'design') return messages.design;
  if (quest.category === 'tutoring') return messages.tutoring;
  return messages.campusLife;
}

function locationLabel(quest: QuestBoardQuest, messages: QuestBoardMessages): string {
  return quest.locationMode === 'online' ? messages.online : messages.onCampus;
}

function proofLabel(quest: QuestBoardQuest, messages: QuestBoardMessages): string {
  if (quest.proofRequired === 'required') return messages.required;
  if (quest.proofRequired === 'optional') return messages.optional;
  return messages.notNeeded;
}

function NotFoundState({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel: string; onAction: () => void }) {
  return <View accessibilityRole="alert" style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.body}>{description}</Text><Pressable accessibilityRole="button" onPress={onAction} style={styles.primaryAction}><Text style={styles.primaryActionText}>{actionLabel}</Text></Pressable></View>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.requirementRow}><Text style={styles.requirementLabel}>{label}</Text><Text style={styles.requirementValue}>{value}</Text></View>;
}

function ConfirmationSheet({ locale, messages, quest, onCancel, onConfirm }: { locale: 'en' | 'th'; messages: QuestBoardMessages; quest: QuestBoardQuest; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal animationType="slide" onRequestClose={onCancel} transparent visible>
      <Pressable onPress={onCancel} style={styles.modalBackdrop}>
        <Pressable onPress={() => undefined} style={styles.confirmSheet}>
          <View style={styles.confirmHeader}><Text style={styles.confirmTitle}>{messages.confirmApplicationTitle}</Text><Pressable accessibilityLabel={messages.notYet} accessibilityRole="button" onPress={onCancel}><X color={colors.textStrong} size={24} /></Pressable></View>
          <Text style={styles.confirmDescription}>{messages.confirmApplicationDescription}</Text>
          <View style={styles.confirmSummary}><Text style={styles.confirmSummaryText}>{quest.title}</Text><Text style={styles.confirmSummaryText}>{`฿${quest.rewardPerPerson.toLocaleString('en-US')} ${messages.perPerson}`}</Text><Text style={styles.confirmSummaryText}>{`${messages.deadline}: ${formatDeadline(quest.deadline, locale)}`}</Text></View>
          <View style={styles.confirmActions}><Pressable accessibilityRole="button" onPress={onCancel} style={styles.cancelAction}><Text style={styles.cancelActionText}>{messages.notYet}</Text></Pressable><Pressable accessibilityRole="button" onPress={onConfirm} style={styles.confirmAction} testID="confirm-quest-application"><Text style={styles.confirmActionText}>{messages.confirmApplication}</Text></Pressable></View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function QuestDetailScreen({ now = FIXTURE_NOW, previewState, questId, studentId }: QuestDetailScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string | string[]; intent?: string | string[]; preview?: string | string[] }>();
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];
  const resolvedQuestId = parseQuestRouteId(questId ?? params.id);
  const resolvedIntent = parseQuestIntent(params.intent);
  const [sessionStudentId, setSessionStudentId] = useState(studentId);

  React.useEffect(() => {
    if (studentId) return;
    void authService.getSession().then((session) => {
      const id = parseStudentId(session?.user.id);
      if (id) setSessionStudentId(id);
    }).catch(() => undefined);
  }, [studentId]);
  const resolvedPreview = previewState ?? parseBoardPreviewState(params.preview);
  const quest = useMemo(() => getQuestDetailFixture(resolvedQuestId, resolvedPreview), [resolvedPreview, resolvedQuestId]);
  const applicationStudentId = sessionStudentId ?? DEFAULT_STUDENT_ID;
  const applicationStore = useMemo(() => getQuestApplicationStore(applicationStudentId), [applicationStudentId]);
  const [applicationOverride, setApplicationOverride] = useState<{ questId: string; status: QuestApplicationStatus } | null>(null);
  const storedApplicationStatus = quest ? applicationStore.getStatus(quest.id) : 'none';
  const applicationStatus = applicationOverride && applicationOverride.questId === quest?.id
    ? applicationOverride.status
    : storedApplicationStatus;
  const previewApplicationStatus: QuestApplicationStatus = resolvedPreview === 'application-pending'
    ? 'pending'
    : resolvedPreview === 'application-accepted'
      ? 'accepted'
      : applicationStatus;
  const availability = quest ? getQuestAvailability(quest, now) : undefined;
  const canApply = availability === 'available' && previewApplicationStatus === 'none';
  const applicationOutcome = quest ? getQuestApplicationOutcome(quest, now) : undefined;
  const [manualConfirmationOpen, setManualConfirmationOpen] = useState(false);
  const routeIntentKey = `${resolvedQuestId ?? ''}:${resolvedIntent ?? ''}`;
  const [dismissedIntent, setDismissedIntent] = useState<string | undefined>();
  const confirmationOpen = manualConfirmationOpen || (resolvedIntent === 'apply' && dismissedIntent !== routeIntentKey && canApply);

  const statusTitle = previewApplicationStatus === 'accepted'
    ? messages.applicationAccepted
    : previewApplicationStatus === 'pending'
      ? messages.applicationPending
      : availability === 'full'
        ? messages.questFull
        : availability === 'closed'
          ? messages.applicationsClosed
          : '';

  const confirmApplication = () => {
    if (!quest || (applicationOutcome !== 'accepted' && applicationOutcome !== 'pending')) return;
    applicationStore.setStatus(quest.id, applicationOutcome);
    setApplicationOverride({ questId: quest.id, status: applicationOutcome });
    setManualConfirmationOpen(false);
    setDismissedIntent(routeIntentKey);
  };

  if (!quest) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <TopBar onBackPress={() => router.back()} variant="detail" />
        <NotFoundState title={messages.questNotFound} description={messages.questNotFoundDescription} actionLabel={messages.back} onAction={() => router.back()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <TopBar onBackPress={() => router.back()} variant="detail" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><Text style={styles.category}>{categoryLabel(quest, messages)}</Text><Text accessibilityRole="header" style={styles.title}>{quest.title}</Text><Text style={styles.creator}>{`${messages.creator} ${quest.creator.name}${quest.creator.faculty ? ` · ${quest.creator.faculty}` : ''}`}</Text></View>
        <View style={styles.heroCard}><View style={styles.heroPrimary}><Text style={styles.heroLabel}>{messages.reward}</Text><Text style={styles.heroValue}>{`฿${quest.rewardPerPerson.toLocaleString('en-US')} ${messages.perPerson}`}</Text></View><View style={styles.heroDetails}><View style={styles.heroItem}><Text style={styles.heroLabel}>{messages.deadline}</Text><Text style={styles.heroValue}>{formatDeadline(quest.deadline, locale)}</Text><Text style={styles.heroDetail}>{locationLabel(quest, messages)}</Text></View><View style={[styles.heroItem, styles.heroItemDivider]}><Text style={styles.heroLabel}>{messages.spots}</Text><Text style={styles.heroValue}>{`${quest.acceptedParticipants}/${quest.headcount}`}</Text><Text style={styles.heroDetail}>{quest.participationMode === 'team' ? messages.team : messages.singlePerson}</Text></View></View></View>
        <View style={styles.section}><Text style={styles.sectionTitle}>{messages.description}</Text><Text style={styles.body}>{quest.description}</Text></View>
        <View style={styles.section}><Text style={styles.sectionTitle}>{messages.requirements}</Text><View style={styles.requirementCard}><DetailRow label={messages.completionCriteria} value={quest.completionCriteria} /><DetailRow label={messages.proofRequired} value={proofLabel(quest, messages)} /><DetailRow label={messages.candidateMode} value={quest.candidateMode === 'NO_CANDIDATE' ? messages.firstCome : messages.reviewCandidates} /><DetailRow label={messages.participation} value={quest.participationMode === 'team' ? messages.team : messages.singlePerson} /><DetailRow label={messages.location} value={locationLabel(quest, messages)} /></View></View>
        {statusTitle ? <View accessibilityRole="alert" style={[styles.statusCard, availability !== 'available' && previewApplicationStatus === 'none' && styles.statusCardBlocked]}><Check color={availability === 'available' ? colors.primary : colors.textMuted} size={25} strokeWidth={2.4} /><Text style={styles.statusTitle}>{statusTitle}</Text><Text style={styles.statusDescription}>{previewApplicationStatus === 'accepted' || previewApplicationStatus === 'pending' ? messages.viewMyQuests : messages.unavailableApplication}</Text></View> : null}
      </ScrollView>
      {canApply ? <View style={[styles.actionBar, { paddingBottom: Math.max(spacing.md, insets.bottom + spacing.sm) }]}><Pressable accessibilityRole="button" onPress={() => setManualConfirmationOpen(true)} style={styles.primaryAction} testID="quest-apply-button"><Text style={styles.primaryActionText}>{messages.applyNow}</Text></Pressable></View> : null}
      {confirmationOpen ? <ConfirmationSheet locale={locale} messages={messages} onCancel={() => { setManualConfirmationOpen(false); setDismissedIntent(routeIntentKey); }} onConfirm={confirmApplication} quest={quest} /> : null}
    </SafeAreaView>
  );
}
