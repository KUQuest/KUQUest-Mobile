import React, { useMemo, useState } from 'react';
import { cn } from '@/tw/cn';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, CircleAlert, ImageOff, MapPin, X } from 'lucide-react-native';
import { AccessibilityInfo, Modal } from 'react-native';
import { Image, Pressable, SafeAreaView, ScrollView, Text, View } from '@/tw';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authService } from '../auth/AuthService';
import { TopBar } from '@/components/ui/TopBar';
import { useLocale } from '@/locales/LocaleProvider';
import { questBoardMessages, type QuestBoardMessages } from '@/locales/questBoardMessages';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import styles from './questDetailStyles';
import { getLocalizedQuest } from './questTranslations';
import {
  getQuestApplicationOutcome,
  getQuestApplicationStore,
  type QuestApplicationStatus,
} from './questApplication';
import { getQuestAvailability } from './questBoardViewData';
import { getQuestDetailFixture, parseBoardPreviewState, type BoardPreviewState } from './questBoardHarness';
import { parseQuestIntent, parseQuestRouteId, parseStudentId } from './questRoute';
import { MAX_QUEST_IMAGES, type QuestBoardQuest } from './types';

export interface QuestDetailScreenProps {
  now?: Date;
  previewState?: BoardPreviewState;
  questId?: string;
  studentId?: string;
}

const FIXTURE_NOW = new Date('2026-08-12T09:00:00.000Z');
const DEFAULT_STUDENT_ID = 'student-demo';

function announce(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

function formatDeadline(value: string, locale: 'en' | 'th'): string {
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function formatReward(amount: number, locale: 'en' | 'th'): string {
  return `฿${amount.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US')}`;
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

function DetailRow({ label, value, description }: { label: string; value: string; description?: string }) {
  return <View className={styles.requirementRow}><Text className={styles.requirementLabel}>{label}</Text><Text className={styles.requirementValue}>{value}</Text>{description ? <Text className={styles.requirementDescription}>{description}</Text> : null}</View>;
}

function QuestImage({ uri, index, messages }: { uri: string; index: number; messages: QuestBoardMessages }) {
  const [failed, setFailed] = useState(false);
  const label = messages.questImageLabel(index);

  if (failed) {
    return <View accessibilityLabel={`${label}. ${messages.imageUnavailable}`} className={styles.questImageFallback}><ImageOff color={colors.textMuted} size={24} strokeWidth={1.8} /><Text className={styles.questImageFallbackText}>{messages.imageUnavailable}</Text></View>;
  }

  return <Image accessibilityLabel={label} cachePolicy="memory-disk" contentFit="cover" onError={() => setFailed(true)} source={{ uri }} className={styles.questImage} />;
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
            <Text className={styles.confirmSummaryText}>{`${formatReward(quest.rewardPerPerson, locale)} ${messages.perPerson}`}</Text>
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
  const quest = useMemo(() => {
    const fixture = getQuestDetailFixture(resolvedQuestId, resolvedPreview);
    return fixture ? getLocalizedQuest(fixture, locale) : undefined;
  }, [locale, resolvedPreview, resolvedQuestId]);
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
  const imageUris = quest?.imageUris?.slice(0, MAX_QUEST_IMAGES) ?? [];
  const canApply = availability === 'available' && previewApplicationStatus === 'none';
  const applicationOutcome = quest ? getQuestApplicationOutcome(quest, now) : undefined;
  const [manualConfirmationOpen, setManualConfirmationOpen] = useState(false);
  const routeIntentKey = `${resolvedQuestId ?? ''}:${resolvedIntent ?? ''}`;
  const [dismissedIntent, setDismissedIntent] = useState<string | undefined>();
  const confirmationOpen = manualConfirmationOpen || (resolvedIntent === 'apply' && dismissedIntent !== routeIntentKey && canApply);

  const firstCome = quest?.candidateMode === 'NO_CANDIDATE';
  const statusTitle = previewApplicationStatus === 'accepted'
    ? firstCome ? messages.participationConfirmed : messages.applicationAccepted
    : previewApplicationStatus === 'pending'
      ? messages.applicationPending
      : availability === 'full'
        ? messages.questFull
        : availability === 'closed'
          ? messages.applicationsClosed
          : '';
  const statusIsUnavailable = availability !== 'available' && previewApplicationStatus === 'none';
  const statusDescription = previewApplicationStatus === 'accepted'
    ? messages.applicationAcceptedDescription
    : previewApplicationStatus === 'pending'
      ? messages.applicationPendingDescription
      : messages.unavailableApplication;

  const confirmApplication = () => {
    if (!quest || (applicationOutcome !== 'accepted' && applicationOutcome !== 'pending')) return;
    applicationStore.setStatus(quest.id, applicationOutcome);
    setApplicationOverride({ questId: quest.id, status: applicationOutcome });
    setManualConfirmationOpen(false);
    setDismissedIntent(routeIntentKey);
  };

  if (!quest) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className={styles.safeArea}>
        <TopBar backLabel={messages.back} onBackPress={() => router.back()} title={messages.details} variant="detail" />
        <NotFoundState title={messages.questNotFound} description={messages.questNotFoundDescription} actionLabel={messages.back} onAction={() => router.back()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className={styles.safeArea}>
      <TopBar backLabel={messages.back} onBackPress={() => router.back()} title={messages.details} variant="detail" />
      <ScrollView contentContainerClassName={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View className={styles.header}><View accessibilityLabel={messages.tags} className={styles.tagRow}>{quest.tags.map((tag) => <Text key={tag} className={styles.tag}>{tag}</Text>)}</View><Text accessibilityRole="header" className={styles.title}>{quest.title}</Text><Text className={styles.creator}>{`${messages.creator} ${quest.creator.name}${quest.creator.faculty ? ` · ${quest.creator.faculty}` : ''}`}</Text></View>
        {imageUris.length > 0 ? <View accessibilityLabel={messages.imageCount(imageUris.length)} className={styles.imageGallery}>{imageUris.map((uri, index) => <QuestImage key={`${uri}-${index}`} index={index + 1} messages={messages} uri={uri} />)}</View> : null}
        <View className={styles.heroCard}>
          <View className={styles.heroPrimary}><Text className={styles.heroLabel}>{messages.reward}</Text><Text className={styles.heroValue}>{`${formatReward(quest.rewardPerPerson, locale)} ${messages.perPerson}`}</Text></View>
          <View className={styles.heroDetails}>
            <View className={styles.heroItem}>
              <Text className={styles.heroLabel}>{messages.schedule}</Text>
              <Text className={styles.heroValue}>{formatDeadline(quest.startDate, locale)}</Text>
              {quest.timeRange ? <Text className={styles.heroDetail}>{quest.timeRange}</Text> : null}
              <Text className={styles.heroDetail}>{`${messages.deadline}: ${formatDeadline(quest.deadline, locale)}`}</Text>
            </View>
            <View className={cn(styles.heroItem, styles.heroItemDivider)}><Text className={styles.heroLabel}>{messages.spots}</Text><Text className={styles.heroValue}>{`${quest.acceptedParticipants}/${quest.headcount}`}</Text><Text className={styles.heroDetail}>{quest.participationMode === 'team' ? messages.team : messages.singlePerson}</Text></View>
          </View>
          <View className={styles.heroLocation}>
            <MapPin color={colors.primary} size={20} strokeWidth={2} />
            <View className={styles.heroLocationCopy}><Text className={styles.heroLabel}>{messages.location}</Text><Text className={styles.heroLocationValue}>{quest.location}</Text><Text className={styles.heroDetail}>{locationLabel(quest, messages)}</Text></View>
          </View>
        </View>
        <View className={styles.section}><Text className={styles.sectionTitle}>{messages.description}</Text><Text className={styles.body}>{quest.description}</Text></View>
        <View className={styles.section}><Text className={styles.sectionTitle}>{messages.requirements}</Text><View className={styles.requirementCard}><DetailRow label={messages.completionCriteria} value={quest.completionCriteria} /><DetailRow label={messages.proofRequired} value={proofLabel(quest, messages)} description={proofDescription(quest, messages)} /><DetailRow label={messages.candidateMode} value={quest.candidateMode === 'NO_CANDIDATE' ? messages.firstCome : messages.reviewCandidates} description={candidateDescription(quest, messages)} /><DetailRow label={messages.participation} value={quest.participationMode === 'team' ? messages.team : messages.singlePerson} /></View></View>
        {statusTitle ? <View accessibilityRole="alert" className={cn(styles.statusCard, statusIsUnavailable && styles.statusCardBlocked)}>{statusIsUnavailable ? <CircleAlert color={colors.textMuted} size={25} strokeWidth={2.2} /> : <Check color={colors.primary} size={25} strokeWidth={2.4} />}<Text className={styles.statusTitle}>{statusTitle}</Text><Text className={styles.statusDescription}>{statusDescription}</Text>{!statusIsUnavailable ? <Pressable accessibilityRole="button" onPress={() => router.push('/my-quests')} className={styles.statusAction} testID="view-my-quests"><Text className={styles.statusActionText}>{messages.viewMyQuests}</Text></Pressable> : null}</View> : null}
      </ScrollView>
      {canApply ? <View className={styles.actionBar} style={{ paddingBottom: Math.max(spacing.md, insets.bottom + spacing.sm) }}><Pressable accessibilityRole="button" onPress={() => setManualConfirmationOpen(true)} className={styles.primaryAction} testID="quest-apply-button"><Text className={styles.primaryActionText}>{firstCome ? messages.joinNow : messages.applyNow}</Text></Pressable></View> : null}
      {confirmationOpen ? <ConfirmationSheet locale={locale} messages={messages} onCancel={() => { setManualConfirmationOpen(false); setDismissedIntent(routeIntentKey); }} onConfirm={confirmApplication} quest={quest} /> : null}
    </SafeAreaView>
  );
}
