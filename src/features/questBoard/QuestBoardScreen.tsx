import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/tw/cn';
import { FlatList, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from '@/tw';
import { AlertCircle, ArrowDownUp, BriefcaseBusiness, Check, ChevronRight, CircleUserRound, ClipboardCheck, Clock3, MapPin, Search, SlidersHorizontal, X } from 'lucide-react-native';
import { AccessibilityInfo, Modal, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useNavigationVisibility } from '@/components/navigation/NavigationVisibilityContext';
import { PrototypeMenu } from '@/components/ui/PrototypeMenu';
import { usePrototypeMenuState } from '@/components/ui/prototypeMenuState';
import { LoadingSkeleton, SkeletonBlock } from '@/components/ui/LoadingSkeleton';
import { useLocale } from '@/locales/LocaleProvider';
import { questBoardMessages, type QuestBoardMessages } from '@/locales/questBoardMessages';
import { colors } from '@/theme/colors';
import { getAppChromeMetrics } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import styles from './questBoardStyles';
import { getLocalizedQuest } from './questTranslations';
import {
  applyQuestBoardFilters,
  getQuestBoardTags,
  getVisibleQuests,
  sortQuests,
} from './questBoardViewData';
import type { BoardPreviewState } from './questBoardHarness';
import { getQuestRewardSatang, questWorkflow } from './questWorkflow';
import type { PrototypeScenarioRoute } from '@/components/ui/prototypeMenuData';

import { formatSatang } from './types';
import {
  emptyQuestBoardFilter,
  type DeadlineFilter,
  type QuestBoardFilter,
  type QuestBoardQuest,
  type QuestBoardSort,
  type QuestLocationMode,
  type StartTimeBucket,
} from './types';


export type { BoardPreviewState } from './questBoardHarness';

export interface QuestBoardScreenProps {
  currentStudentId?: string;
  initialPreviewState?: BoardPreviewState;
}


const deadlineOptions: { value: DeadlineFilter; labelKey: 'today' | 'within3Days' | 'within7Days' }[] = [
  { value: 'today', labelKey: 'today' },
  { value: 'within-3-days', labelKey: 'within3Days' },
  { value: 'within-7-days', labelKey: 'within7Days' },
];

const startTimeOptions: { value: StartTimeBucket; labelKey: 'morning' | 'afternoon' | 'evening' }[] = [
  { value: 'morning', labelKey: 'morning' },
  { value: 'afternoon', labelKey: 'afternoon' },
  { value: 'evening', labelKey: 'evening' },
];

const sortOptions: { value: QuestBoardSort; labelKey: 'newest' | 'deadlineSoonest' | 'rewardHighest' }[] = [
  { value: 'newest', labelKey: 'newest' },
  { value: 'deadline-soonest', labelKey: 'deadlineSoonest' },
  { value: 'reward-highest', labelKey: 'rewardHighest' },
];

function announce(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

function formatDeadline(value: string, locale: 'en' | 'th'): string {
  if (locale === 'th') {
    return new Intl.DateTimeFormat('th-TH-u-ca-buddhist', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(`${value}T12:00:00`));
  }
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`));
}

function participationLabel(quest: QuestBoardQuest, messages: QuestBoardMessages): string {
  const participation = quest.participationMode === 'team' ? messages.team : messages.singlePerson;
  const mode = quest.candidateMode === 'CANDIDATE' ? messages.applyForReview : messages.firstCome;
  return `${participation} · ${mode}`;
}

function questCardAccessibilityLabel(quest: QuestBoardQuest, locale: 'en' | 'th'): string {
  const messages = questBoardMessages[locale];
  return [
    quest.title,
    `${messages.reward}: ${formatSatang(getQuestRewardSatang(quest), locale)} ${messages.perPerson}`,
    participationLabel(quest, messages),
    messages.participantsSummary(quest.acceptedParticipants, quest.headcount),
    `${messages.schedule}: ${quest.timeRange ? `${quest.timeRange} · ` : ''}${formatDeadline(quest.startDate, locale)}`,
    `${messages.location}: ${quest.location}`,
    messages.viewDetails,
  ].filter(Boolean).join('. ');
}

function InfoIcon({ children, className }: { children: React.ReactNode; className?: string }) {
  return <View className={cn(styles.infoIcon, className)}>{children}</View>;
}

function QuestCard({ quest, locale, onDetail }: { quest: QuestBoardQuest; locale: 'en' | 'th'; onDetail: () => void }) {
  const messages = questBoardMessages[locale];
  const tags = [...new Set(quest.tags)].slice(0, 1);
  const spotsRemaining = quest.headcount - quest.acceptedParticipants;
  const scheduleLabel = quest.timeRange
    ? `${quest.timeRange} · ${formatDeadline(quest.startDate, locale)}`
    : formatDeadline(quest.startDate, locale);

  return (
    <Pressable accessibilityLabel={questCardAccessibilityLabel(quest, locale)} accessibilityRole="button" onPress={onDetail} className={styles.card} testID={`quest-detail-${quest.id}`}>
      <View accessible={false} className={styles.cardBody} testID={`quest-card-${quest.id}`}>
        <View className={styles.cardTopRow}>
          <View className={styles.cardTitleColumn}>
            <Text className={styles.cardTitle} testID={`quest-card-title-${quest.id}`}>{quest.title}</Text>
            {tags.map((tag) => <View key={tag} className={styles.cardCategory} testID={`quest-card-tags-${quest.id}`}><BriefcaseBusiness color={colors.primary} size={16} strokeWidth={2.1} /><Text className={styles.cardCategoryText}>{tag}</Text></View>)}
          </View>
          <View className={styles.rewardBlock}>
            <Text className={styles.rewardAmount}>{formatSatang(getQuestRewardSatang(quest), locale)}</Text>
            <Text className={styles.rewardUnit}>{messages.perPerson}</Text>
          </View>
        </View>
        {quest.description ? <Text className={styles.cardDescription} numberOfLines={2} testID={`quest-card-description-${quest.id}`}>{quest.description}</Text> : null}
        <View className={styles.cardDivider} />
        <View className={styles.infoList}>
          <View className={styles.infoRow} testID={`quest-card-participation-${quest.id}`}>
            <InfoIcon className={styles.infoIconMuted}><CircleUserRound color={colors.textSubtle} size={20} strokeWidth={1.9} /></InfoIcon>
            <Text className={cn(styles.infoText, styles.infoTextPrimary, styles.infoTextFlexible)} numberOfLines={2}>{participationLabel(quest, messages)}</Text>
          </View>
          <View className={styles.infoRow} testID={`quest-card-participants-${quest.id}`}>
            <InfoIcon className={styles.infoIconMuted}><ClipboardCheck color={colors.textSubtle} size={20} strokeWidth={1.9} /></InfoIcon>
            <Text className={styles.infoText}>{messages.participants}</Text>
            <View className={styles.participantCount}>
              <Text className={styles.participantCountText}>{`${quest.acceptedParticipants}/${quest.headcount}`}</Text>
            </View>
            <Text className={styles.spotsLeftText} numberOfLines={1}>{messages.spotsSummary(spotsRemaining, quest.headcount)}</Text>
          </View>
          <View className={styles.infoRow} testID={`quest-card-schedule-${quest.id}`}>
            <InfoIcon className={styles.infoIconMuted}><Clock3 color={colors.textSubtle} size={20} strokeWidth={1.9} /></InfoIcon>
            <Text className={cn(styles.infoText, styles.infoTextFlexible)} numberOfLines={1}>{scheduleLabel}</Text>
          </View>
          <View className={styles.infoRow} testID={`quest-card-location-${quest.id}`}>
            <InfoIcon className={styles.infoIconMuted}><MapPin color={colors.textSubtle} size={20} strokeWidth={1.9} /></InfoIcon>
            <View className={styles.locationContent}>
              <Text className={styles.locationText} numberOfLines={2}>{quest.location}</Text>
            </View>
          </View>
        </View>
        <View className={styles.cardFooter}>
          <ChevronRight color={colors.primaryDeep} size={20} strokeWidth={2.2} />
        </View>
        <Text className={styles.cardAccessibilityMeta} testID={`quest-card-spots-${quest.id}`}>{messages.spotsSummary(spotsRemaining, quest.headcount)}</Text>
      </View>
    </Pressable>
  );
}

function getActiveFilterCount(filter: QuestBoardFilter): number {
  return Number(filter.tags.length > 0)
    + Number(filter.rewardMin !== null || filter.rewardMax !== null)
    + Number(filter.deadline !== null)
    + Number(filter.startTimeBuckets.length > 0)
    + Number(filter.locationModes.length > 0);
}

function cloneFilter(filter: QuestBoardFilter): QuestBoardFilter {
  return {
    ...filter,
    tags: [...filter.tags],
    startTimeBuckets: [...filter.startTimeBuckets],
    locationModes: [...filter.locationModes],
  };
}

function formatBound(value: number | null): string {
  return value === null ? '' : String(value);
}

function parseRewardBound(value: string): number | null | undefined {
  if (value === '') return null;
  if (!/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

function Option({ label, selected, onPress, testID, accessibilityRole = 'checkbox' }: { label: string; selected: boolean; onPress: () => void; testID: string; accessibilityRole?: 'checkbox' | 'radio' }) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole={accessibilityRole} accessibilityState={accessibilityRole === 'radio' ? { selected } : { checked: selected }} onPress={onPress} className={cn(styles.option, selected && styles.optionSelected)} testID={testID}>
      <Text className={cn(styles.optionText, selected && styles.optionTextSelected)}>{label}</Text>
      {selected ? <Check color={colors.primary} size={15} strokeWidth={2.5} /> : null}
    </Pressable>
  );
}

function StateView({ title, description, actionLabel, onAction, error = false }: { title: string; description: string; actionLabel?: string; onAction?: () => void; error?: boolean }) {
  return (
    <View accessibilityRole={error ? 'alert' : undefined} accessibilityLiveRegion={error ? 'assertive' : 'polite'} className={styles.state}>
      <View className={cn(styles.stateIcon, error && styles.alertIcon)}><AlertCircle color={error ? colors.dangerDark : colors.textMuted} size={34} strokeWidth={1.8} /></View>
      <Text className={styles.stateTitle}>{title}</Text>
      <Text className={styles.stateDescription}>{description}</Text>
      {actionLabel && onAction ? <Pressable accessibilityRole="button" onPress={onAction} className={styles.stateAction}><Text className={styles.stateActionText}>{actionLabel}</Text></Pressable> : null}
    </View>
  );
}

function QuestBoardSkeleton({ loadingLabel }: { loadingLabel: string }) {
  return (
    <LoadingSkeleton loadingLabel={loadingLabel} style={{ width: '100%' }} contentStyle={{ gap: spacing.sm }} testID="quest-board-loading-skeleton">
      {[1, 2, 3].map((item) => (
        <View key={item} className={styles.skeletonCard} testID={`quest-skeleton-${item}`}>
          <View style={{ flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' }}>
            <View style={{ flex: 1, gap: spacing.sm }}>
              <SkeletonBlock height={20} width="78%" borderRadius={5} />
              <SkeletonBlock height={28} width="38%" borderRadius={16} />
            </View>
            <SkeletonBlock height={58} width={88} borderRadius={14} />
          </View>
          <SkeletonBlock height={34} width="94%" borderRadius={5} style={{ marginTop: spacing.md }} />
          <SkeletonBlock height={1} borderRadius={0} style={{ marginBottom: spacing.sm, marginTop: spacing.md }} />
          {[1, 2, 3, 4].map((row) => (
            <View key={row} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginTop: row === 1 ? 0 : spacing.xs, minHeight: 36 }}>
              <SkeletonBlock height={36} width={36} borderRadius={11} />
              <SkeletonBlock height={16} width={row === 2 ? '64%' : row === 4 ? '78%' : '52%'} borderRadius={4} style={{ flex: row === 2 ? 0 : 1 }} />
              {row === 2 ? <SkeletonBlock height={30} width={48} borderRadius={12} /> : null}
            </View>
          ))}
          <SkeletonBlock height={1} borderRadius={0} style={{ marginTop: spacing.sm }} />
          <View style={{ alignItems: 'flex-end', marginTop: spacing.sm }}><SkeletonBlock height={20} width={20} borderRadius={10} /></View>
        </View>
      ))}
    </LoadingSkeleton>
  );
}

function QuestBoardFilterSheet({ filter, messages, availableTags, onChange, onApply, onClose }: { filter: QuestBoardFilter; messages: QuestBoardMessages; availableTags: string[]; onChange: (next: QuestBoardFilter) => void; onApply: () => void; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [minimumText, setMinimumText] = useState(formatBound(filter.rewardMin));
  const [maximumText, setMaximumText] = useState(formatBound(filter.rewardMax));
  const [tagQuery, setTagQuery] = useState('');
  const minimum = parseRewardBound(minimumText);
  const maximum = parseRewardBound(maximumText);
  const rewardBoundsValid = minimum !== undefined && maximum !== undefined && (minimum === null || maximum === null || minimum <= maximum);
  const activeFilterCount = getActiveFilterCount(filter);
  const displayedTags = [...new Set([...availableTags, ...filter.tags])].sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }));
  const normalizedTagQuery = tagQuery.trim().toLocaleLowerCase();
  const tagSuggestions = normalizedTagQuery
    ? displayedTags.filter((tag) => !filter.tags.includes(tag) && tag.toLocaleLowerCase().includes(normalizedTagQuery))
    : [];

  const updateRewardBounds = (nextMinimumText: string, nextMaximumText: string) => {
    const nextMinimum = parseRewardBound(nextMinimumText);
    const nextMaximum = parseRewardBound(nextMaximumText);
    if (nextMinimum !== undefined && nextMaximum !== undefined) {
      onChange({ ...filter, rewardMin: nextMinimum, rewardMax: nextMaximum });
    }
  };

  const addTag = (tag: string) => {
    onChange({ ...filter, tags: [...filter.tags, tag] });
    setTagQuery('');
  };
  const removeTag = (tag: string) => onChange({ ...filter, tags: filter.tags.filter((value) => value !== tag) });
  const toggleStartTime = (bucket: StartTimeBucket) => onChange({ ...filter, startTimeBuckets: filter.startTimeBuckets.includes(bucket) ? filter.startTimeBuckets.filter((value) => value !== bucket) : [...filter.startTimeBuckets, bucket] });
  const toggleLocation = (location: QuestLocationMode) => onChange({ ...filter, locationModes: filter.locationModes.includes(location) ? filter.locationModes.filter((value) => value !== location) : [...filter.locationModes, location] });
  const clearDraft = () => {
    setMinimumText('');
    setMaximumText('');
    onChange({ ...emptyQuestBoardFilter, query: filter.query });
  };

  return (
    <Modal animationType="slide" onDismiss={() => announce(messages.resultsLabel)} onRequestClose={onClose} onShow={() => announce(messages.filtersTitle)} transparent visible>
      <Pressable onPress={onClose} className={styles.modalBackdrop} testID="quest-filter-backdrop">
        <Pressable accessibilityViewIsModal onPress={(event) => event.stopPropagation()} className={styles.sheet} style={{ height: '88%', paddingBottom: Math.max(spacing.md, insets.bottom + spacing.sm) }} testID="quest-filter-sheet">
          <View className={styles.sheetHandle} />
          <View className={styles.sheetHeader}>
            <View className={styles.sheetHeaderCopy}>
              <Text accessibilityRole="header" className={styles.sheetTitle}>{messages.filtersTitle}</Text>
              <Text className={styles.sheetSummary}>{messages.selectedFilters(activeFilterCount)}</Text>
            </View>
            <Pressable accessibilityLabel={messages.cancel} accessibilityRole="button" onPress={onClose} className={styles.sheetCloseButton} testID="close-quest-filters">
              <X color={colors.textStrong} size={22} />
            </Pressable>
          </View>
          <ScrollView className={styles.sheetScroll} contentContainerClassName={styles.sheetScrollContent} showsVerticalScrollIndicator={false}>
            <View className={styles.sheetSection}>
              <Text className={styles.sheetSectionTitle}>{messages.tags}</Text>
              {filter.tags.length > 0 ? <View className={styles.selectedTags}>{filter.tags.map((tag) => <Pressable accessibilityLabel={messages.removeSelectedTag(tag)} accessibilityRole="button" key={tag} onPress={() => removeTag(tag)} className={styles.selectedTag} testID={`quest-filter-selected-tag-${tag}`}><Text className={styles.selectedTagText}>{tag}</Text><X color={colors.primary} size={13} strokeWidth={2.5} /></Pressable>)}</View> : null}
              <View className={styles.tagSearchField}>
                <Search color={colors.textMuted} size={20} strokeWidth={2} />
                <TextInput accessibilityLabel={messages.searchTags} accessibilityRole="search" autoCapitalize="none" onChangeText={setTagQuery} placeholder={messages.searchTags} placeholderTextColor={colors.textFaint} value={tagQuery} className={styles.tagSearchInput} testID="quest-filter-tag-search" />
                {tagQuery ? <Pressable accessibilityLabel={messages.clearTagSearch} accessibilityRole="button" onPress={() => setTagQuery('')} className={styles.iconButton} testID="clear-quest-filter-tag-search"><X color={colors.textMuted} size={20} /></Pressable> : null}
              </View>
              {normalizedTagQuery ? tagSuggestions.length > 0 ? <View className={styles.tagSuggestions}>{tagSuggestions.map((tag) => <Option key={tag} label={tag} onPress={() => addTag(tag)} selected={false} testID={`quest-filter-tag-${tag}`} />)}</View> : <Text accessibilityLiveRegion="polite" className={styles.noTagResults}>{messages.noMatchingTags}</Text> : null}
            </View>
            <View className={styles.sheetSection}>
              <Text className={styles.sheetSectionTitle}>{messages.reward}</Text>
              <View className={styles.rewardInputs}>
                <View className={styles.rewardField}><Text className={styles.rewardFieldLabel}>{messages.rewardMin}</Text><TextInput accessibilityLabel={messages.rewardMin} keyboardType="number-pad" onChangeText={(value) => { setMinimumText(value); updateRewardBounds(value, maximumText); }} placeholder="0" placeholderTextColor={colors.textFaint} value={minimumText} className={styles.rewardInput} testID="quest-filter-reward-min" /></View>
                <View className={styles.rewardField}><Text className={styles.rewardFieldLabel}>{messages.rewardMax}</Text><TextInput accessibilityLabel={messages.rewardMax} keyboardType="number-pad" onChangeText={(value) => { setMaximumText(value); updateRewardBounds(minimumText, value); }} placeholder={messages.noLimit} placeholderTextColor={colors.textFaint} value={maximumText} className={styles.rewardInput} testID="quest-filter-reward-max" /></View>
              </View>
              {!rewardBoundsValid ? <Text className={styles.rewardError} testID="quest-filter-reward-error">{messages.rewardInvalid}</Text> : null}
            </View>
            <View className={styles.sheetSection}><Text className={styles.sheetSectionTitle}>{messages.deadline}</Text><View className={styles.optionList}>{deadlineOptions.map((option) => <Option key={option.value} label={messages[option.labelKey]} onPress={() => onChange({ ...filter, deadline: filter.deadline === option.value ? null : option.value })} selected={filter.deadline === option.value} testID={`quest-filter-deadline-${option.value}`} />)}</View></View>
            <View className={styles.sheetSection}><Text className={styles.sheetSectionTitle}>{messages.startTime}</Text><View className={styles.optionList}>{startTimeOptions.map((option) => <Option key={option.value} label={messages[option.labelKey]} onPress={() => toggleStartTime(option.value)} selected={filter.startTimeBuckets.includes(option.value)} testID={`quest-filter-start-time-${option.value}`} />)}</View></View>
            <View className={styles.sheetSection}><Text className={styles.sheetSectionTitle}>{messages.location}</Text><View className={styles.optionList}><Option label={messages.online} onPress={() => toggleLocation('online')} selected={filter.locationModes.includes('online')} testID="quest-filter-location-online" /><Option label={messages.onCampus} onPress={() => toggleLocation('on-campus')} selected={filter.locationModes.includes('on-campus')} testID="quest-filter-location-on-campus" /></View></View>
          </ScrollView>
          <View className={styles.sheetActions}><Pressable accessibilityRole="button" onPress={onClose} className={styles.cancelAction}><Text className={styles.cancelActionText}>{messages.cancel}</Text></Pressable><Pressable accessibilityRole="button" onPress={clearDraft} className={styles.secondaryAction}><Text className={styles.secondaryActionText}>{messages.clearAll}</Text></Pressable><Pressable accessibilityRole="button" disabled={!rewardBoundsValid} accessibilityState={{ disabled: !rewardBoundsValid }} onPress={() => { if (rewardBoundsValid) onApply(); }} className={cn(styles.primaryAction, !rewardBoundsValid && styles.primaryActionDisabled)} testID="apply-quest-filters"><Text className={styles.primaryActionText}>{messages.applyFilters}</Text></Pressable></View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function QuestBoardSortSheet({ sort, messages, onSelect, onClose }: { sort: QuestBoardSort; messages: QuestBoardMessages; onSelect: (value: QuestBoardSort) => void; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal animationType="slide" onDismiss={() => announce(messages.resultsLabel)} onRequestClose={onClose} onShow={() => announce(messages.sortTitle)} transparent visible>
      <Pressable onPress={onClose} className={styles.modalBackdrop}>
        <Pressable accessibilityViewIsModal onPress={() => undefined} className={styles.sheet} style={{ paddingBottom: Math.max(spacing.md, insets.bottom + spacing.sm) }}>
          <View className={styles.sheetHeader}><Text accessibilityRole="header" className={styles.sheetTitle}>{messages.sortTitle}</Text><Pressable accessibilityLabel={messages.close} accessibilityRole="button" onPress={onClose} className={styles.sheetCloseButton} testID="close-quest-sort"><X color={colors.textStrong} size={24} /></Pressable></View>
          <View className={styles.optionList}>{sortOptions.map((option) => <Option key={option.value} accessibilityRole="radio" label={messages[option.labelKey]} onPress={() => onSelect(option.value)} selected={sort === option.value} testID={`quest-sort-${option.value}`} />)}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function QuestBoardScreen({ currentStudentId, initialPreviewState = 'populated' }: QuestBoardScreenProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const { activePersonaId, onPersonaChange, onReset } = usePrototypeMenuState();
  const resolvedStudentId = currentStudentId?.trim() || activePersonaId;
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const chromeMetrics = getAppChromeMetrics(width, fontScale);
  const { handleScroll } = useNavigationVisibility();
  const messages = questBoardMessages[locale];
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<QuestBoardFilter>(emptyQuestBoardFilter);
  const [draftFilters, setDraftFilters] = useState<QuestBoardFilter>(emptyQuestBoardFilter);
  const [sort, setSort] = useState<QuestBoardSort>('newest');
  const [previewState, setPreviewState] = useState<BoardPreviewState>(initialPreviewState);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [, setWorkflowRevision] = useState(0);
  const workflowNow = questWorkflow.getNow();

  useEffect(() => questWorkflow.subscribe(() => setWorkflowRevision((revision) => revision + 1)), []);

  useEffect(() => {
    if (!retrying || previewState !== 'loading') return undefined;
    const timeout = setTimeout(() => {
      setPreviewState('populated');
      setRetrying(false);
    }, 250);
    return () => clearTimeout(timeout);
  }, [previewState, retrying]);

  const boardModel = questWorkflow.getQuestBoardSurfaceModel(resolvedStudentId, previewState);
  const localizedQuests = useMemo(() => boardModel.kind === 'ready'
    ? boardModel.quests.map((quest) => getLocalizedQuest(quest, locale))
    : [], [boardModel, locale]);
  const availableTags = useMemo(() => getQuestBoardTags(getVisibleQuests(localizedQuests, { currentStudentId: resolvedStudentId, now: workflowNow })), [resolvedStudentId, localizedQuests, workflowNow]);
  const visibleQuests = useMemo(() => boardModel.kind === 'ready'
    ? sortQuests(applyQuestBoardFilters(localizedQuests, { ...filters, query }, { currentStudentId: resolvedStudentId, now: workflowNow }), sort)
    : [], [boardModel.kind, filters, localizedQuests, query, resolvedStudentId, sort, workflowNow]);
  const openFilters = () => {
    setDraftFilters(cloneFilter(filters));
    setFilterOpen(true);
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setDraftFilters((current) => ({ ...emptyQuestBoardFilter, query: current.query }));
    setFilters((current) => ({ ...emptyQuestBoardFilter, query: current.query }));
  };

  const clearNoMatch = () => {
    setQuery('');
    setDraftFilters(emptyQuestBoardFilter);
    setFilters(emptyQuestBoardFilter);
  };

  const openQuest = useCallback((quest: QuestBoardQuest, preview?: BoardPreviewState) => {
    const applicationPreview = preview ?? (previewState === 'application-pending' || previewState === 'application-accepted' ? previewState : undefined);
    router.push({ pathname: '/quest/[id]', params: { id: quest.id, ...(applicationPreview ? { preview: applicationPreview } : {}) } });
  }, [previewState, router]);

  const retryBoard = () => {
    setRetryAttempt((attempt) => attempt + 1);
    setRetrying(true);
    setPreviewState('loading');
  };

  const hasActiveFilters = getActiveFilterCount(filters) > 0;
  const activeFilterCount = getActiveFilterCount(filters);
  const sortLabelKey = sortOptions.find((option) => option.value === sort)?.labelKey ?? 'newest';
  const sortLabel = messages[sortLabelKey];
  const noMatch = previewState === 'populated' || previewState === 'application-pending' || previewState === 'application-accepted';
  const noMatchActionLabel = hasActiveFilters && query
    ? messages.clearSearchAndFilters
    : hasActiveFilters
      ? messages.clearFilters
      : query
        ? messages.clearSearch
        : undefined;
  const noMatchAction = hasActiveFilters && !query ? clearFilters : clearNoMatch;
  const removeTag = (tag: string) => setFilters((current) => ({ ...current, tags: current.tags.filter((value) => value !== tag) }));
  const removeLocation = (location: QuestLocationMode) => setFilters((current) => ({ ...current, locationModes: current.locationModes.filter((value) => value !== location) }));
  const removeStartTimeBucket = (bucket: StartTimeBucket) => setFilters((current) => ({ ...current, startTimeBuckets: current.startTimeBuckets.filter((value) => value !== bucket) }));
  const removeRewardBounds = () => setFilters((current) => ({ ...current, rewardMin: null, rewardMax: null }));
  const removeDeadline = () => setFilters((current) => ({ ...current, deadline: null }));
  const previousBoardKind = useRef<string | undefined>(undefined);

  useEffect(() => {
    const previousKind = previousBoardKind.current;
    if (boardModel.kind === 'loading') announce(messages.loading);
    if (boardModel.kind === 'error') announce(`${messages.errorTitle}. ${messages.retry}`);
    if (boardModel.kind === 'empty') announce(`${messages.noQuests}. ${messages.subtitle}`);
    if (boardModel.kind === 'ready' && previousKind === 'loading') announce(messages.retrySuccess);
    previousBoardKind.current = boardModel.kind;
  }, [boardModel.kind, messages]);

  useEffect(() => {
    if (boardModel.kind === 'ready' && (query.trim() || hasActiveFilters) && visibleQuests.length === 0) {
      announce(messages.noMatches);
    }
  }, [boardModel.kind, hasActiveFilters, messages, query, visibleQuests.length]);

  const renderQuest = useCallback(({ item }: { item: QuestBoardQuest }) => (
    <QuestCard locale={locale} onDetail={() => openQuest(item)} quest={item} />
  ), [locale, openQuest]);

  const openPrototypeScenario = (route: PrototypeScenarioRoute) => {
    router.push(route);
  };

  const listHeader = (
    <>
      <View className={styles.boardIntro}>
        <View className={styles.boardIntroRow}>
          <View className={styles.boardIntroCopy}>
            <Text accessibilityRole="header" className={styles.boardTitle}>{messages.title}</Text>
            <Text className={styles.boardSubtitle}>{messages.subtitle}</Text>
          </View>
          <PrototypeMenu
            activePersonaId={activePersonaId}
            compact
            onPersonaChange={onPersonaChange}
            onReset={onReset}
            onScenarioPress={openPrototypeScenario}
            testID="quest-board-prototype-menu"
          />
        </View>
      </View>
      <View className={styles.searchField}><Search color={colors.textMuted} size={23} strokeWidth={2} /><TextInput accessibilityLabel={messages.searchPlaceholder} accessibilityRole="search" autoCapitalize="none" onChangeText={setQuery} placeholder={messages.searchPlaceholder} placeholderTextColor={colors.textMuted} className={styles.searchInput} testID="quest-board-search" value={query} />{query ? <Pressable accessibilityLabel={messages.clearSearch} accessibilityRole="button" onPress={() => setQuery('')} className={styles.iconButton} testID="clear-quest-search"><X color={colors.textMuted} size={20} /></Pressable> : null}</View>
      <View className={styles.toolbar}><Pressable accessibilityLabel={`${messages.filter}${hasActiveFilters ? `, ${messages.selectedFilters(activeFilterCount)}` : ''}`} accessibilityRole="button" accessibilityState={{ expanded: filterOpen }} onPress={openFilters} className={cn(styles.toolbarButton, hasActiveFilters && styles.toolbarButtonActive)} testID="open-quest-filters"><SlidersHorizontal color={hasActiveFilters ? colors.white : colors.textStrong} size={22} strokeWidth={2.3} /><Text className={cn(styles.toolbarText, hasActiveFilters && styles.toolbarTextActive)}>{messages.filter}</Text>{activeFilterCount > 0 ? <View className={styles.filterCount}><Text className={styles.filterCountText}>{activeFilterCount}</Text></View> : null}</Pressable><Pressable accessibilityLabel={`${messages.sort}: ${sortLabel}`} accessibilityRole="button" accessibilityState={{ expanded: sortOpen }} onPress={() => setSortOpen(true)} className={cn(styles.toolbarButton, styles.toolbarButtonRight)} testID="open-quest-sort"><ArrowDownUp color={colors.textStrong} size={22} strokeWidth={2.3} /><Text className={styles.toolbarText}>{messages.sort}: {sortLabel}</Text></Pressable></View>
      {hasActiveFilters ? <View accessibilityLabel={messages.activeFiltersLabel} className={styles.activeFilters}>{filters.tags.map((tag) => <Pressable accessibilityLabel={messages.removeFilter(tag)} accessibilityRole="button" key={tag} onPress={() => removeTag(tag)} className={styles.filterChip} testID={`active-quest-filter-tag-${tag}`}><Text className={styles.filterChipText}>{tag}</Text><X color={colors.primary} size={13} strokeWidth={2.5} /></Pressable>)}{filters.locationModes.map((location) => <Pressable accessibilityLabel={messages.removeFilter(location === 'online' ? messages.online : messages.onCampus)} accessibilityRole="button" key={location} onPress={() => removeLocation(location)} className={styles.filterChip} testID={`active-quest-filter-${location}`}><Text className={styles.filterChipText}>{location === 'online' ? messages.online : messages.onCampus}</Text><X color={colors.primary} size={13} strokeWidth={2.5} /></Pressable>)}{filters.rewardMin !== null || filters.rewardMax !== null ? <Pressable accessibilityLabel={messages.removeFilter(messages.rewardSummary(filters.rewardMin, filters.rewardMax))} accessibilityRole="button" onPress={removeRewardBounds} className={styles.filterChip} testID="active-quest-filter-reward"><Text className={styles.filterChipText}>{messages.rewardSummary(filters.rewardMin, filters.rewardMax)}</Text><X color={colors.primary} size={13} strokeWidth={2.5} /></Pressable> : null}{filters.deadline ? <Pressable accessibilityLabel={messages.removeFilter(messages[deadlineOptions.find((option) => option.value === filters.deadline)?.labelKey ?? 'within7Days'])} accessibilityRole="button" onPress={removeDeadline} className={styles.filterChip} testID="active-quest-filter-deadline"><Text className={styles.filterChipText}>{messages[deadlineOptions.find((option) => option.value === filters.deadline)?.labelKey ?? 'within7Days']}</Text><X color={colors.primary} size={13} strokeWidth={2.5} /></Pressable> : null}{filters.startTimeBuckets.map((bucket) => <Pressable accessibilityLabel={messages.removeFilter(messages[startTimeOptions.find((option) => option.value === bucket)?.labelKey ?? 'morning'])} accessibilityRole="button" onPress={() => removeStartTimeBucket(bucket)} className={styles.filterChip} key={bucket} testID={`active-quest-filter-start-time-${bucket}`}><Text className={styles.filterChipText}>{messages[startTimeOptions.find((option) => option.value === bucket)?.labelKey ?? 'morning']}</Text><X color={colors.primary} size={13} strokeWidth={2.5} /></Pressable>)}</View> : null}
      {boardModel.kind === 'ready' && retryAttempt > 0 ? <Text accessibilityLabel={messages.retrySuccess} accessibilityLiveRegion="polite" className={styles.retryStatus}>{messages.retrySuccess}</Text> : null}
    </>
  );

  const emptyState = boardModel.kind === 'loading'
    ? <QuestBoardSkeleton loadingLabel={messages.loading} />
    : boardModel.kind === 'error'
      ? <StateView error title={messages.errorTitle} description={messages.errorDescription} actionLabel={messages.retry} onAction={retryBoard} />
      : boardModel.kind === 'empty'
        ? <StateView title={messages.noQuests} description={messages.subtitle} />
        : boardModel.kind === 'unavailable'
          ? <StateView title={boardModel.availability === 'full' ? messages.stateFull : messages.stateClosed} description={messages.noMatches} actionLabel={messages.title} onAction={() => openQuest(boardModel.quest, boardModel.availability)} />
          : noMatch
            ? <StateView title={messages.noMatches} description={hasActiveFilters || query ? messages.subtitle : messages.noQuests} actionLabel={noMatchActionLabel} onAction={hasActiveFilters || query ? noMatchAction : undefined} />
            : null;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className={styles.safeArea}>
      <FlatList
        accessibilityLabel={messages.resultsLabel}
        contentContainerClassName={styles.scrollContent}
        contentContainerStyle={{ paddingBottom: chromeMetrics.navHeight + insets.bottom + spacing.xl + spacing.xl + spacing.lg, paddingHorizontal: spacing.md }}
        data={boardModel.kind === 'ready' ? visibleQuests : []}
        keyExtractor={(quest) => quest.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={emptyState}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={() => <View className={styles.cardSeparator} />}
        renderItem={renderQuest}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      />
      {filterOpen ? <QuestBoardFilterSheet availableTags={availableTags} filter={draftFilters} messages={messages} onApply={applyFilters} onChange={setDraftFilters} onClose={() => setFilterOpen(false)} /> : null}
      {sortOpen ? <QuestBoardSortSheet messages={messages} onClose={() => setSortOpen(false)} onSelect={(value) => { setSort(value); setSortOpen(false); }} sort={sort} /> : null}
    </SafeAreaView>
  );
}
