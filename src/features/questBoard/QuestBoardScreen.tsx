import React, { useMemo, useState } from 'react';
import { cn } from '@/tw/cn';
import { Image, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from '@/tw';
import { AlertCircle, ArrowDownUp, Check, Clock3, Info, MapPin, Search, SlidersHorizontal, Users, X } from 'lucide-react-native';
import { Modal, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { TopBar } from '@/components/ui/TopBar';
import { useLocale } from '@/locales/LocaleProvider';
import { questBoardMessages, type QuestBoardMessages } from '@/locales/questBoardMessages';
import { colors } from '@/theme/colors';
import { getAppChromeMetrics } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import styles from './questBoardStyles';
import {
  applyQuestBoardFilters,
  getQuestBoardTags,
  getVisibleQuests,
  sortQuests,
} from './questBoardViewData';
import {
  createQuestBoardModel,
  previewOptions,
  type BoardPreviewState,
} from './questBoardHarness';

import {
  emptyQuestBoardFilter,
  type DeadlineFilter,
  type QuestBoardFilter,
  type QuestBoardQuest,
  type QuestBoardSort,
  type QuestCategory,
  type QuestLocationMode,
  type StartTimeBucket,
} from './types';

export type { BoardPreviewState } from './questBoardHarness';

export interface QuestBoardScreenProps {
  currentStudentId?: string;
  initialPreviewState?: BoardPreviewState;
  now?: Date;
}

const DEFAULT_STUDENT_ID = 'student-demo';
const FIXTURE_NOW = new Date('2026-08-12T09:00:00.000Z');
const SHOW_PREVIEW_CONTROLS = __DEV__ && process.env.EXPO_PUBLIC_SHOW_QUEST_PREVIEW === 'true';

const categoryOptions: { value: QuestCategory; labelKey: 'technology' | 'design' | 'tutoring' | 'campusLife' }[] = [
  { value: 'technology', labelKey: 'technology' },
  { value: 'design', labelKey: 'design' },
  { value: 'tutoring', labelKey: 'tutoring' },
  { value: 'campus-life', labelKey: 'campusLife' },
];

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

const sortOptions: { value: QuestBoardSort; labelKey: 'recommended' | 'newest' | 'deadlineSoonest' | 'rewardHighest' }[] = [
  { value: 'recommended', labelKey: 'recommended' },
  { value: 'newest', labelKey: 'newest' },
  { value: 'deadline-soonest', labelKey: 'deadlineSoonest' },
  { value: 'reward-highest', labelKey: 'rewardHighest' },
];

function formatReward(amount: number): string {
  return `฿${amount.toLocaleString('en-US')}`;
}

function formatDeadline(value: string, locale: 'en' | 'th'): string {
  if (locale === 'th') {
    return new Intl.DateTimeFormat('th-TH-u-ca-buddhist', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(`${value}T12:00:00`));
  }
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`));
}

function daysUntil(value: string, now: Date): number {
  const deadline = new Date(`${value}T12:00:00`).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.floor((deadline - today) / (24 * 60 * 60 * 1000));
}

function categoryLabel(quest: QuestBoardQuest, messages: QuestBoardMessages): string {
  return messages[categoryOptions.find((option) => option.value === quest.category)?.labelKey ?? 'technology'];
}

function participationLabel(quest: QuestBoardQuest, messages: QuestBoardMessages): string {
  return quest.participationMode === 'team' ? messages.team : messages.singlePerson;
}

function candidateModeLabel(quest: QuestBoardQuest, messages: QuestBoardMessages): string {
  return quest.candidateMode === 'NO_CANDIDATE' ? messages.firstCome : messages.reviewCandidates;
}

function creatorInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function QuestCard({ quest, locale, now, onDetail, onTakeQuest }: { quest: QuestBoardQuest; locale: 'en' | 'th'; now: Date; onDetail: () => void; onTakeQuest: () => void }) {
  const messages = questBoardMessages[locale];
  const endingSoon = daysUntil(quest.deadline, now) >= 0 && daysUntil(quest.deadline, now) <= 3;

  return (
    <View className={styles.card} testID={`quest-card-${quest.id}`}>
      <View className={styles.cardBody}>
        <View className={styles.cardTopRow}>
          <Text numberOfLines={2} className={styles.cardTitle} testID={`quest-card-title-${quest.id}`}>{quest.title}</Text>
          <Text adjustsFontSizeToFit numberOfLines={1} className={styles.reward}>{formatReward(quest.rewardPerPerson)}<Text className={styles.rewardUnit}>{messages.perPerson}</Text></Text>
        </View>
        <View className={styles.categoryRow} testID={`quest-card-category-${quest.id}`}>
          <View className={styles.categoryTag}><Text numberOfLines={1} className={styles.categoryTagText}>{categoryLabel(quest, messages)}</Text></View>
        </View>
        <View accessibilityLabel={`${messages.postedBy} ${quest.creator.name}`} className={styles.creatorRow} testID={`quest-card-creator-${quest.id}`}>
          {quest.creator.avatarUri ? <Image accessibilityLabel={`${quest.creator.name} avatar`} contentFit="cover" source={{ uri: quest.creator.avatarUri }} className={styles.creatorAvatar} /> : <View className={styles.creatorAvatarFallback}><Text className={styles.creatorAvatarText}>{creatorInitials(quest.creator.name)}</Text></View>}
          <Text numberOfLines={1} className={styles.creatorText}><Text className={styles.creatorLabel}>{messages.postedBy} </Text>{quest.creator.name}{quest.creator.faculty ? ` · ${quest.creator.faculty}` : ''}</Text>
        </View>
        <View className={styles.cardMeta}>
          <View className={styles.metaItem}><Info color={colors.textMuted} size={15} strokeWidth={2} /><Text numberOfLines={2} className={styles.metaText}>{quest.description}</Text></View>
          <View className={styles.metaItem} testID={`quest-card-participation-${quest.id}`}><Users color={colors.textMuted} size={15} strokeWidth={2} /><Text className={styles.metaInlineText}><Text className={styles.metaLabel}>{messages.modeLabel} · </Text><Text className={styles.metaValue}>{participationLabel(quest, messages)}</Text></Text></View>
          <View className={styles.metaItem} testID={`quest-card-selection-${quest.id}`}><Check color={colors.textMuted} size={15} strokeWidth={2} /><Text className={styles.metaInlineText}><Text className={styles.metaLabel}>{messages.selectionLabel} · </Text><Text className={styles.metaValue}>{candidateModeLabel(quest, messages)}</Text></Text></View>
          <View className={styles.metaItem}><Clock3 color={endingSoon ? colors.dangerDark : colors.textMuted} size={15} strokeWidth={2} /><Text className={styles.metaInlineText}><Text className={styles.metaLabel}>{messages.schedule} · </Text><Text className={cn(styles.metaValue, endingSoon && styles.endingSoon)}>{quest.timeRange ? `${quest.timeRange} · ` : ''}{formatDeadline(quest.deadline, locale)}</Text></Text></View>
          <View className={styles.metaItem}><MapPin color={colors.textMuted} size={15} strokeWidth={2} /><Text className={styles.metaInlineText}><Text className={styles.metaLabel}>{messages.location} · </Text><Text className={styles.metaValue}>{quest.location}</Text></Text></View>
        </View>
      </View>
      <View className={styles.actionRow}>
        <Pressable accessibilityLabel={`${messages.detailAction}: ${quest.title}`} accessibilityRole="button" onPress={onDetail} className={styles.detailAction} testID={`quest-detail-${quest.id}`}><Text numberOfLines={1} className={styles.detailActionText}>{messages.detailAction}</Text></Pressable>
        <Pressable accessibilityLabel={`${messages.takeQuest}: ${quest.title}`} accessibilityRole="button" onPress={onTakeQuest} className={styles.takeAction} testID={`quest-take-${quest.id}`}><Text numberOfLines={1} className={styles.takeActionText}>{messages.takeQuest}</Text></Pressable>
      </View>
    </View>
  );
}

function getActiveFilterCount(filter: QuestBoardFilter): number {
  return Number(filter.categories.length > 0)
    + Number(filter.tags.length > 0)
    + Number(filter.rewardMin !== null || filter.rewardMax !== null)
    + Number(filter.deadline !== null)
    + Number(filter.startTimeBuckets.length > 0)
    + Number(filter.locationModes.length > 0);
}

function cloneFilter(filter: QuestBoardFilter): QuestBoardFilter {
  return {
    ...filter,
    categories: [...filter.categories],
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

function Option({ label, selected, onPress, testID }: { label: string; selected: boolean; onPress: () => void; testID: string }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={onPress} className={cn(styles.option, selected && styles.optionSelected)} testID={testID}>
      <Text className={cn(styles.optionText, selected && styles.optionTextSelected)}>{label}</Text>
      {selected ? <Check color={colors.primary} size={15} strokeWidth={2.5} /> : null}
    </Pressable>
  );
}

function StateView({ title, description, actionLabel, onAction, error = false }: { title: string; description: string; actionLabel?: string; onAction?: () => void; error?: boolean }) {
  return (
    <View accessibilityRole={error ? 'alert' : undefined} className={styles.state}>
      <View className={cn(styles.stateIcon, error && styles.alertIcon)}><AlertCircle color={error ? colors.dangerDark : colors.textMuted} size={34} strokeWidth={1.8} /></View>
      <Text className={styles.stateTitle}>{title}</Text>
      <Text className={styles.stateDescription}>{description}</Text>
      {actionLabel && onAction ? <Pressable accessibilityRole="button" onPress={onAction} className={styles.stateAction}><Text className={styles.stateActionText}>{actionLabel}</Text></Pressable> : null}
    </View>
  );
}

function QuestBoardFilterSheet({ filter, messages, availableTags, onChange, onApply, onClose }: { filter: QuestBoardFilter; messages: QuestBoardMessages; availableTags: string[]; onChange: (next: QuestBoardFilter) => void; onApply: () => void; onClose: () => void }) {
  const [minimumText, setMinimumText] = useState(formatBound(filter.rewardMin));
  const [maximumText, setMaximumText] = useState(formatBound(filter.rewardMax));
  const minimum = parseRewardBound(minimumText);
  const maximum = parseRewardBound(maximumText);
  const rewardBoundsValid = minimum !== undefined && maximum !== undefined && (minimum === null || maximum === null || minimum <= maximum);
  const activeFilterCount = getActiveFilterCount(filter);
  const displayedTags = [...new Set([...availableTags, ...filter.tags])].sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }));

  const updateRewardBounds = (nextMinimumText: string, nextMaximumText: string) => {
    const nextMinimum = parseRewardBound(nextMinimumText);
    const nextMaximum = parseRewardBound(nextMaximumText);
    if (nextMinimum !== undefined && nextMaximum !== undefined) {
      onChange({ ...filter, rewardMin: nextMinimum, rewardMax: nextMaximum });
    }
  };

  const toggleCategory = (category: QuestCategory) => onChange({ ...filter, categories: filter.categories.includes(category) ? filter.categories.filter((value) => value !== category) : [...filter.categories, category] });
  const toggleTag = (tag: string) => onChange({ ...filter, tags: filter.tags.includes(tag) ? filter.tags.filter((value) => value !== tag) : [...filter.tags, tag] });
  const toggleStartTime = (bucket: StartTimeBucket) => onChange({ ...filter, startTimeBuckets: filter.startTimeBuckets.includes(bucket) ? filter.startTimeBuckets.filter((value) => value !== bucket) : [...filter.startTimeBuckets, bucket] });
  const toggleLocation = (location: QuestLocationMode) => onChange({ ...filter, locationModes: filter.locationModes.includes(location) ? filter.locationModes.filter((value) => value !== location) : [...filter.locationModes, location] });
  const clearDraft = () => {
    setMinimumText('');
    setMaximumText('');
    onChange({ ...emptyQuestBoardFilter, query: filter.query });
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible>
      <Pressable onPress={onClose} className={styles.modalBackdrop} testID="quest-filter-backdrop">
        <Pressable onPress={(event) => event.stopPropagation()} className={styles.sheet}>
          <View className={styles.sheetHandle} />
          <View className={styles.sheetHeader}>
            <View className={styles.sheetHeaderCopy}>
              <Text className={styles.sheetTitle}>{messages.filtersTitle}</Text>
              <Text className={styles.sheetSummary}>{messages.selectedFilters(activeFilterCount)}</Text>
            </View>
            <Pressable accessibilityLabel={messages.close} accessibilityRole="button" onPress={onClose} className={styles.sheetCloseButton} testID="close-quest-filters">
              <X color={colors.textStrong} size={22} />
            </Pressable>
          </View>
          <ScrollView className={styles.sheetScroll} contentContainerClassName={styles.sheetScrollContent} showsVerticalScrollIndicator={false}>
            <View className={styles.sheetSection}><Text className={styles.sheetSectionTitle}>{messages.categories}</Text><View className={styles.optionList}>{categoryOptions.map((option) => <Option key={option.value} label={messages[option.labelKey]} onPress={() => toggleCategory(option.value)} selected={filter.categories.includes(option.value)} testID={`quest-filter-category-${option.value}`} />)}</View></View>
            <View className={styles.sheetSection}><Text className={styles.sheetSectionTitle}>{messages.tags}</Text><View className={styles.optionList}>{displayedTags.map((tag) => <Option key={tag} label={tag} onPress={() => toggleTag(tag)} selected={filter.tags.includes(tag)} testID={`quest-filter-tag-${tag}`} />)}</View></View>
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
          <View className={styles.sheetActions}><Pressable accessibilityRole="button" onPress={clearDraft} className={styles.secondaryAction}><Text className={styles.secondaryActionText}>{messages.clearAll}</Text></Pressable><Pressable accessibilityRole="button" disabled={!rewardBoundsValid} accessibilityState={{ disabled: !rewardBoundsValid }} onPress={() => { if (rewardBoundsValid) onApply(); }} className={cn(styles.primaryAction, !rewardBoundsValid && styles.primaryActionDisabled)} testID="apply-quest-filters"><Text className={styles.primaryActionText}>{messages.applyFilters}</Text></Pressable></View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function QuestBoardSortSheet({ sort, messages, onSelect, onClose }: { sort: QuestBoardSort; messages: QuestBoardMessages; onSelect: (value: QuestBoardSort) => void; onClose: () => void }) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible>
      <Pressable onPress={onClose} className={styles.modalBackdrop}>
        <Pressable onPress={() => undefined} className={styles.sheet}>
          <View className={styles.sheetHeader}><Text className={styles.sheetTitle}>{messages.sortTitle}</Text><Pressable accessibilityLabel={messages.close} accessibilityRole="button" onPress={onClose} testID="close-quest-sort"><X color={colors.textStrong} size={24} /></Pressable></View>
          <View className={styles.optionList}>{sortOptions.map((option) => <Option key={option.value} label={messages[option.labelKey]} onPress={() => onSelect(option.value)} selected={sort === option.value} testID={`quest-sort-${option.value}`} />)}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function PreviewStateSheet({ messages, state, onSelect, onClose }: { messages: QuestBoardMessages; state: BoardPreviewState; onSelect: (value: BoardPreviewState) => void; onClose: () => void }) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible>
      <Pressable onPress={onClose} className={styles.modalBackdrop}>
        <Pressable onPress={() => undefined} className={styles.sheet}>
          <View className={styles.sheetHeader}><Text className={styles.sheetTitle}>{messages.previewStateTitle}</Text><Pressable accessibilityLabel={messages.close} accessibilityRole="button" onPress={onClose}><X color={colors.textStrong} size={24} /></Pressable></View>
          <View className={styles.optionList}>{previewOptions.map((option) => <Option key={option.value} label={messages[option.labelKey]} onPress={() => onSelect(option.value)} selected={state === option.value} testID={`quest-preview-${option.value}`} />)}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function QuestBoardScreen({ currentStudentId = DEFAULT_STUDENT_ID, initialPreviewState = 'populated', now = FIXTURE_NOW }: QuestBoardScreenProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const chromeMetrics = getAppChromeMetrics(width, fontScale);
  const messages = questBoardMessages[locale];
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<QuestBoardFilter>(emptyQuestBoardFilter);
  const [draftFilters, setDraftFilters] = useState<QuestBoardFilter>(emptyQuestBoardFilter);
  const [sort, setSort] = useState<QuestBoardSort>('recommended');
  const [previewState, setPreviewState] = useState<BoardPreviewState>(initialPreviewState);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  const boardModel = useMemo(() => createQuestBoardModel(previewState), [previewState]);
  const availableTags = useMemo(() => getQuestBoardTags(boardModel.kind === 'ready'
    ? getVisibleQuests(boardModel.quests, { currentStudentId, now })
    : []), [boardModel, currentStudentId, now]);
  const visibleQuests = useMemo(() => boardModel.kind === 'ready'
    ? sortQuests(applyQuestBoardFilters(boardModel.quests, { ...filters, query }, { currentStudentId, now }), sort)
    : [], [boardModel, currentStudentId, filters, now, query, sort]);
  const stateLabel = previewOptions.find((option) => option.value === previewState)?.labelKey;

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

  const openQuest = (quest: QuestBoardQuest, preview?: BoardPreviewState) => {
    const applicationPreview = preview ?? (previewState === 'application-pending' || previewState === 'application-accepted' ? previewState : undefined);
    router.push({ pathname: '/quest/[id]', params: { id: quest.id, ...(applicationPreview ? { preview: applicationPreview } : {}) } });
  };

  const applyToQuest = (quest: QuestBoardQuest) => {
    router.push({ pathname: '/quest/[id]', params: { id: quest.id, intent: 'apply' } });
  };

  const hasActiveFilters = getActiveFilterCount(filters) > 0;
  const activeFilterCount = getActiveFilterCount(filters);
  const noMatch = previewState === 'populated' || previewState === 'application-pending' || previewState === 'application-accepted';
  const removeCategory = (category: QuestCategory) => setFilters((current) => ({ ...current, categories: current.categories.filter((value) => value !== category) }));
  const removeTag = (tag: string) => setFilters((current) => ({ ...current, tags: current.tags.filter((value) => value !== tag) }));
  const removeLocation = (location: QuestLocationMode) => setFilters((current) => ({ ...current, locationModes: current.locationModes.filter((value) => value !== location) }));
  const removeStartTimeBucket = (bucket: StartTimeBucket) => setFilters((current) => ({ ...current, startTimeBuckets: current.startTimeBuckets.filter((value) => value !== bucket) }));
  const removeRewardBounds = () => setFilters((current) => ({ ...current, rewardMin: null, rewardMax: null }));

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className={styles.safeArea}>
      <TopBar variant="board" />
      <ScrollView contentContainerClassName={styles.scrollContent} contentContainerStyle={{ paddingBottom: chromeMetrics.navHeight + insets.bottom + spacing.xl + spacing.xl + spacing.lg }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className={styles.searchField}><Search color={colors.textMuted} size={23} strokeWidth={2} /><TextInput accessibilityLabel={messages.searchPlaceholder} accessibilityRole="search" autoCapitalize="none" onChangeText={setQuery} placeholder={messages.searchPlaceholder} placeholderTextColor={colors.textMuted} className={styles.searchInput} testID="quest-board-search" value={query} />{query ? <Pressable accessibilityLabel={messages.clearSearch} accessibilityRole="button" onPress={() => setQuery('')} className={styles.iconButton} testID="clear-quest-search"><X color={colors.textMuted} size={20} /></Pressable> : null}</View>
        <View className={styles.toolbar}><Pressable accessibilityLabel={`${messages.filter}${hasActiveFilters ? `, ${messages.selectedFilters(activeFilterCount)}` : ''}`} accessibilityRole="button" accessibilityState={{ expanded: filterOpen }} onPress={openFilters} className={cn(styles.toolbarButton, hasActiveFilters && styles.toolbarButtonActive)} testID="open-quest-filters"><SlidersHorizontal color={hasActiveFilters ? colors.primary : colors.textStrong} size={22} strokeWidth={2.3} /><Text className={cn(styles.toolbarText, hasActiveFilters && styles.toolbarTextActive)}>{messages.filter}</Text>{activeFilterCount > 0 ? <View className={styles.filterCount}><Text className={styles.filterCountText}>{activeFilterCount}</Text></View> : null}</Pressable><Pressable accessibilityRole="button" accessibilityState={{ expanded: sortOpen }} onPress={() => setSortOpen(true)} className={cn(styles.toolbarButton, styles.toolbarButtonRight)} testID="open-quest-sort"><ArrowDownUp color={colors.textStrong} size={22} strokeWidth={2.3} /><Text className={styles.toolbarText}>{messages.sort}</Text></Pressable></View>
        {hasActiveFilters ? <View accessibilityLabel="Active Quest Board filters" className={styles.activeFilters}>{filters.categories.map((category) => <Pressable accessibilityLabel={`Remove ${messages[categoryOptions.find((option) => option.value === category)?.labelKey ?? 'technology']} filter`} accessibilityRole="button" key={category} onPress={() => removeCategory(category)} className={styles.filterChip} testID={`active-quest-filter-${category}`}><Text className={styles.filterChipText}>{messages[categoryOptions.find((option) => option.value === category)?.labelKey ?? 'technology']}</Text><X color={colors.primary} size={13} strokeWidth={2.5} /></Pressable>)}{filters.tags.map((tag) => <Pressable accessibilityLabel={`Remove ${tag} filter`} accessibilityRole="button" key={tag} onPress={() => removeTag(tag)} className={styles.filterChip} testID={`active-quest-filter-tag-${tag}`}><Text className={styles.filterChipText}>{tag}</Text><X color={colors.primary} size={13} strokeWidth={2.5} /></Pressable>)}{filters.locationModes.map((location) => <Pressable accessibilityLabel={`Remove ${location === 'online' ? messages.online : messages.onCampus} filter`} accessibilityRole="button" key={location} onPress={() => removeLocation(location)} className={styles.filterChip} testID={`active-quest-filter-${location}`}><Text className={styles.filterChipText}>{location === 'online' ? messages.online : messages.onCampus}</Text><X color={colors.primary} size={13} strokeWidth={2.5} /></Pressable>)}{filters.rewardMin !== null || filters.rewardMax !== null ? <Pressable accessibilityRole="button" onPress={removeRewardBounds} className={styles.filterChip} testID="active-quest-filter-reward"><Text className={styles.filterChipText}>{messages.rewardSummary(filters.rewardMin, filters.rewardMax)}</Text><X color={colors.primary} size={13} strokeWidth={2.5} /></Pressable> : null}{filters.deadline ? <Pressable accessibilityRole="button" onPress={() => setFilters((current) => ({ ...current, deadline: null }))} className={styles.filterChip} testID="active-quest-filter-deadline"><Text className={styles.filterChipText}>{messages[deadlineOptions.find((option) => option.value === filters.deadline)?.labelKey ?? 'within7Days']}</Text><X color={colors.primary} size={13} strokeWidth={2.5} /></Pressable> : null}{filters.startTimeBuckets.map((bucket) => <Pressable accessibilityRole="button" onPress={() => removeStartTimeBucket(bucket)} className={styles.filterChip} key={bucket} testID={`active-quest-filter-start-time-${bucket}`}><Text className={styles.filterChipText}>{messages[startTimeOptions.find((option) => option.value === bucket)?.labelKey ?? 'morning']}</Text><X color={colors.primary} size={13} strokeWidth={2.5} /></Pressable>)}</View> : null}
        {SHOW_PREVIEW_CONTROLS ? <Pressable accessibilityRole="button" onPress={() => setPreviewOpen(true)} className={styles.previewButton} testID="open-quest-preview"><Text className={styles.previewButtonText}>{messages.previewState}{stateLabel ? `: ${messages[stateLabel]}` : ''}</Text></Pressable> : null}

        {boardModel.kind === 'loading' ? <View accessibilityLabel={messages.loading} className={styles.cards}>{[1, 2, 3].map((item) => <View key={item} testID={`quest-skeleton-${item}`} className={styles.skeleton} />)}</View> : null}
        {boardModel.kind === 'error' ? <StateView error title={messages.errorTitle} description={messages.errorDescription} actionLabel={messages.retry} onAction={() => setRetryAttempt((attempt) => attempt + 1)} /> : null}
        {boardModel.kind === 'error' && retryAttempt > 0 ? <Text accessibilityLabel="Quest Board retry completed" className={styles.retryStatus}>Retry {retryAttempt}</Text> : null}
        {boardModel.kind === 'empty' ? <StateView title={messages.noQuests} description={messages.subtitle} /> : null}
        {boardModel.kind === 'unavailable' ? <StateView title={boardModel.availability === 'full' ? messages.stateFull : messages.stateClosed} description={messages.noMatches} actionLabel={messages.title} onAction={() => openQuest(boardModel.quest, boardModel.availability)} /> : null}
        {boardModel.kind === 'ready' ? visibleQuests.length > 0 ? <View accessibilityLabel="Quest Board results" className={styles.cards}>{visibleQuests.map((quest) => <QuestCard key={quest.id} locale={locale} now={now} onDetail={() => openQuest(quest)} onTakeQuest={() => applyToQuest(quest)} quest={quest} />)}</View> : noMatch ? <StateView title={messages.noMatches} description={hasActiveFilters || query ? messages.subtitle : messages.noQuests} actionLabel={hasActiveFilters ? messages.clearFilters : undefined} onAction={hasActiveFilters ? clearFilters : undefined} /> : null : null}
      </ScrollView>
      {filterOpen ? <QuestBoardFilterSheet availableTags={availableTags} filter={draftFilters} messages={messages} onApply={applyFilters} onChange={setDraftFilters} onClose={() => setFilterOpen(false)} /> : null}
      {sortOpen ? <QuestBoardSortSheet messages={messages} onClose={() => setSortOpen(false)} onSelect={(value) => { setSort(value); setSortOpen(false); }} sort={sort} /> : null}
      {previewOpen ? <PreviewStateSheet messages={messages} onClose={() => setPreviewOpen(false)} onSelect={(value) => { setPreviewState(value); setPreviewOpen(false); }} state={previewState} /> : null}
    </SafeAreaView>
  );
}
