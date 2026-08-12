import React, { useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { AlertCircle, ArrowDownUp, Check, Clock3, Info, MapPin, Search, SlidersHorizontal, Users, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  type RewardRange,
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

const rewardOptions: { value: RewardRange; labelKey: 'under500' | 'between500And1000' | 'over1000' }[] = [
  { value: 'under-500', labelKey: 'under500' },
  { value: '500-1000', labelKey: 'between500And1000' },
  { value: 'over-1000', labelKey: 'over1000' },
];

const deadlineOptions: { value: DeadlineFilter; labelKey: 'today' | 'within3Days' | 'within7Days' }[] = [
  { value: 'today', labelKey: 'today' },
  { value: 'within-3-days', labelKey: 'within3Days' },
  { value: 'within-7-days', labelKey: 'within7Days' },
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
    <View style={styles.card} testID={`quest-card-${quest.id}`}>
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text numberOfLines={2} style={styles.cardTitle} testID={`quest-card-title-${quest.id}`}>{quest.title}</Text>
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.reward}>{formatReward(quest.rewardPerPerson)}<Text style={styles.rewardUnit}>{messages.perPerson}</Text></Text>
        </View>
        <View style={styles.categoryRow} testID={`quest-card-category-${quest.id}`}>
          <View style={styles.categoryTag}><Text numberOfLines={1} style={styles.categoryTagText}>{categoryLabel(quest, messages)}</Text></View>
        </View>
        <View accessibilityLabel={`${messages.postedBy} ${quest.creator.name}`} style={styles.creatorRow} testID={`quest-card-creator-${quest.id}`}>
          {quest.creator.avatarUri ? <Image accessibilityLabel={`${quest.creator.name} avatar`} contentFit="cover" source={{ uri: quest.creator.avatarUri }} style={styles.creatorAvatar} /> : <View style={styles.creatorAvatarFallback}><Text style={styles.creatorAvatarText}>{creatorInitials(quest.creator.name)}</Text></View>}
          <Text numberOfLines={1} style={styles.creatorText}><Text style={styles.creatorLabel}>{messages.postedBy} </Text>{quest.creator.name}{quest.creator.faculty ? ` · ${quest.creator.faculty}` : ''}</Text>
        </View>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}><Info color={colors.textMuted} size={15} strokeWidth={2} /><Text numberOfLines={2} style={styles.metaText}>{quest.description}</Text></View>
          <View style={styles.metaItem} testID={`quest-card-participation-${quest.id}`}><Users color={colors.textMuted} size={15} strokeWidth={2} /><Text style={styles.metaInlineText}><Text style={styles.metaLabel}>{messages.modeLabel} · </Text><Text style={styles.metaValue}>{participationLabel(quest, messages)}</Text></Text></View>
          <View style={styles.metaItem} testID={`quest-card-selection-${quest.id}`}><Check color={colors.textMuted} size={15} strokeWidth={2} /><Text style={styles.metaInlineText}><Text style={styles.metaLabel}>{messages.selectionLabel} · </Text><Text style={styles.metaValue}>{candidateModeLabel(quest, messages)}</Text></Text></View>
          <View style={styles.metaItem}><Clock3 color={endingSoon ? colors.dangerDark : colors.textMuted} size={15} strokeWidth={2} /><Text style={styles.metaInlineText}><Text style={styles.metaLabel}>{messages.schedule} · </Text><Text style={[styles.metaValue, endingSoon && styles.endingSoon]}>{quest.timeRange ? `${quest.timeRange} · ` : ''}{formatDeadline(quest.deadline, locale)}</Text></Text></View>
          <View style={styles.metaItem}><MapPin color={colors.textMuted} size={15} strokeWidth={2} /><Text style={styles.metaInlineText}><Text style={styles.metaLabel}>{messages.location} · </Text><Text style={styles.metaValue}>{quest.location}</Text></Text></View>
        </View>
      </View>
      <View style={styles.actionRow}>
        <Pressable accessibilityLabel={`${messages.detailAction}: ${quest.title}`} accessibilityRole="button" onPress={onDetail} style={({ pressed }) => [styles.detailAction, pressed && styles.detailActionPressed]} testID={`quest-detail-${quest.id}`}><Text numberOfLines={1} style={styles.detailActionText}>{messages.detailAction}</Text></Pressable>
        <Pressable accessibilityLabel={`${messages.takeQuest}: ${quest.title}`} accessibilityRole="button" onPress={onTakeQuest} style={({ pressed }) => [styles.takeAction, pressed && styles.takeActionPressed]} testID={`quest-take-${quest.id}`}><Text numberOfLines={1} style={styles.takeActionText}>{messages.takeQuest}</Text></Pressable>
      </View>
    </View>
  );
}

function getActiveFilterCount(filter: QuestBoardFilter): number {
  return filter.categories.length
    + filter.locationModes.length
    + (filter.rewardRange ? 1 : 0)
    + (filter.deadline ? 1 : 0);
}

function Option({ label, selected, onPress, testID }: { label: string; selected: boolean; onPress: () => void; testID: string }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={onPress} style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.optionPressed]} testID={testID}>
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
      {selected ? <Check color={colors.primary} size={15} strokeWidth={2.5} /> : null}
    </Pressable>
  );
}

function StateView({ title, description, actionLabel, onAction, error = false }: { title: string; description: string; actionLabel?: string; onAction?: () => void; error?: boolean }) {
  return (
    <View accessibilityRole={error ? 'alert' : undefined} style={styles.state}>
      <View style={[styles.stateIcon, error && styles.alertIcon]}><AlertCircle color={error ? colors.dangerDark : colors.textMuted} size={34} strokeWidth={1.8} /></View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateDescription}>{description}</Text>
      {actionLabel && onAction ? <Pressable accessibilityRole="button" onPress={onAction} style={styles.stateAction}><Text style={styles.stateActionText}>{actionLabel}</Text></Pressable> : null}
    </View>
  );
}

function QuestBoardFilterSheet({ filter, messages, onChange, onApply, onClear, onClose }: { filter: QuestBoardFilter; messages: QuestBoardMessages; onChange: (next: QuestBoardFilter) => void; onApply: () => void; onClear: () => void; onClose: () => void }) {
  const toggleCategory = (category: QuestCategory) => onChange({ ...filter, categories: filter.categories.includes(category) ? filter.categories.filter((value) => value !== category) : [...filter.categories, category] });
  const toggleLocation = (location: QuestLocationMode) => onChange({ ...filter, locationModes: filter.locationModes.includes(location) ? filter.locationModes.filter((value) => value !== location) : [...filter.locationModes, location] });
  const activeFilterCount = getActiveFilterCount(filter);

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible>
      <Pressable onPress={onClose} style={styles.modalBackdrop}>
        <Pressable onPress={() => undefined} style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderCopy}>
              <Text style={styles.sheetTitle}>{messages.filtersTitle}</Text>
              <Text style={styles.sheetSummary}>{messages.selectedFilters(activeFilterCount)}</Text>
            </View>
            <Pressable accessibilityLabel={messages.close} accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.sheetCloseButton, pressed && styles.sheetCloseButtonPressed]} testID="close-quest-filters">
              <X color={colors.textStrong} size={22} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetScrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.sheetSection}><Text style={styles.sheetSectionTitle}>{messages.categories}</Text><View style={styles.optionList}>{categoryOptions.map((option) => <Option key={option.value} label={messages[option.labelKey]} onPress={() => toggleCategory(option.value)} selected={filter.categories.includes(option.value)} testID={`quest-filter-category-${option.value}`} />)}</View></View>
            <View style={styles.sheetSection}><Text style={styles.sheetSectionTitle}>{messages.reward}</Text><View style={styles.optionList}>{rewardOptions.map((option) => <Option key={option.value} label={messages[option.labelKey]} onPress={() => onChange({ ...filter, rewardRange: filter.rewardRange === option.value ? null : option.value })} selected={filter.rewardRange === option.value} testID={`quest-filter-reward-${option.value}`} />)}</View></View>
            <View style={styles.sheetSection}><Text style={styles.sheetSectionTitle}>{messages.deadline}</Text><View style={styles.optionList}>{deadlineOptions.map((option) => <Option key={option.value} label={messages[option.labelKey]} onPress={() => onChange({ ...filter, deadline: filter.deadline === option.value ? null : option.value })} selected={filter.deadline === option.value} testID={`quest-filter-deadline-${option.value}`} />)}</View></View>
            <View style={styles.sheetSection}><Text style={styles.sheetSectionTitle}>{messages.location}</Text><View style={styles.optionList}><Option label={messages.online} onPress={() => toggleLocation('online')} selected={filter.locationModes.includes('online')} testID="quest-filter-location-online" /><Option label={messages.onCampus} onPress={() => toggleLocation('on-campus')} selected={filter.locationModes.includes('on-campus')} testID="quest-filter-location-on-campus" /></View></View>
          </ScrollView>
          <View style={styles.sheetActions}><Pressable accessibilityRole="button" onPress={onClear} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{messages.clearAll}</Text></Pressable><Pressable accessibilityRole="button" onPress={onApply} style={styles.primaryAction} testID="apply-quest-filters"><Text style={styles.primaryActionText}>{messages.applyFilters}</Text></Pressable></View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function QuestBoardSortSheet({ sort, messages, onSelect, onClose }: { sort: QuestBoardSort; messages: QuestBoardMessages; onSelect: (value: QuestBoardSort) => void; onClose: () => void }) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible>
      <Pressable onPress={onClose} style={styles.modalBackdrop}>
        <Pressable onPress={() => undefined} style={styles.sheet}>
          <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{messages.sortTitle}</Text><Pressable accessibilityLabel={messages.close} accessibilityRole="button" onPress={onClose} testID="close-quest-sort"><X color={colors.textStrong} size={24} /></Pressable></View>
          <View style={styles.optionList}>{sortOptions.map((option) => <Option key={option.value} label={messages[option.labelKey]} onPress={() => onSelect(option.value)} selected={sort === option.value} testID={`quest-sort-${option.value}`} />)}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function PreviewStateSheet({ messages, state, onSelect, onClose }: { messages: QuestBoardMessages; state: BoardPreviewState; onSelect: (value: BoardPreviewState) => void; onClose: () => void }) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible>
      <Pressable onPress={onClose} style={styles.modalBackdrop}>
        <Pressable onPress={() => undefined} style={styles.sheet}>
          <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{messages.previewStateTitle}</Text><Pressable accessibilityLabel={messages.close} accessibilityRole="button" onPress={onClose}><X color={colors.textStrong} size={24} /></Pressable></View>
          <View style={styles.optionList}>{previewOptions.map((option) => <Option key={option.value} label={messages[option.labelKey]} onPress={() => onSelect(option.value)} selected={state === option.value} testID={`quest-preview-${option.value}`} />)}</View>
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
  const visibleQuests = useMemo(() => boardModel.kind === 'ready'
    ? sortQuests(applyQuestBoardFilters(boardModel.quests, { ...filters, query }, { currentStudentId, now }), sort)
    : [], [boardModel, currentStudentId, filters, now, query, sort]);
  const stateLabel = previewOptions.find((option) => option.value === previewState)?.labelKey;

  const openFilters = () => {
    setDraftFilters({ ...filters, categories: [...filters.categories], locationModes: [...filters.locationModes] });
    setFilterOpen(true);
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setDraftFilters(emptyQuestBoardFilter);
    setFilters(emptyQuestBoardFilter);
  };

  const openQuest = (quest: QuestBoardQuest, preview?: BoardPreviewState) => {
    const applicationPreview = preview ?? (previewState === 'application-pending' || previewState === 'application-accepted' ? previewState : undefined);
    router.push({ pathname: '/quest/[id]', params: { id: quest.id, ...(applicationPreview ? { preview: applicationPreview } : {}) } });
  };

  const applyToQuest = (quest: QuestBoardQuest) => {
    router.push({ pathname: '/quest/[id]', params: { id: quest.id, intent: 'apply' } });
  };

  const hasActiveFilters = filters.categories.length > 0 || filters.locationModes.length > 0 || Boolean(filters.rewardRange) || Boolean(filters.deadline);
  const activeFilterCount = getActiveFilterCount(filters);
  const noMatch = previewState === 'populated' || previewState === 'application-pending' || previewState === 'application-accepted';
  const removeCategory = (category: QuestCategory) => setFilters((current) => ({ ...current, categories: current.categories.filter((value) => value !== category) }));
  const removeLocation = (location: QuestLocationMode) => setFilters((current) => ({ ...current, locationModes: current.locationModes.filter((value) => value !== location) }));

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <TopBar variant="board" />
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: chromeMetrics.navHeight + insets.bottom + spacing.xl + spacing.xl + spacing.lg }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.searchField}><Search color={colors.textMuted} size={23} strokeWidth={2} /><TextInput accessibilityLabel={messages.searchPlaceholder} accessibilityRole="search" autoCapitalize="none" onChangeText={setQuery} placeholder={messages.searchPlaceholder} placeholderTextColor={colors.textMuted} style={styles.searchInput} testID="quest-board-search" value={query} />{query ? <Pressable accessibilityLabel={messages.clearSearch} accessibilityRole="button" onPress={() => setQuery('')} style={styles.iconButton} testID="clear-quest-search"><X color={colors.textMuted} size={20} /></Pressable> : null}</View>
        <View style={styles.toolbar}><Pressable accessibilityLabel={`${messages.filter}${hasActiveFilters ? `, ${messages.selectedFilters(activeFilterCount)}` : ''}`} accessibilityRole="button" accessibilityState={{ expanded: filterOpen }} onPress={openFilters} style={({ pressed }) => [styles.toolbarButton, hasActiveFilters && styles.toolbarButtonActive, pressed && styles.toolbarButtonPressed]} testID="open-quest-filters"><SlidersHorizontal color={hasActiveFilters ? colors.primary : colors.textStrong} size={22} strokeWidth={2.3} /><Text style={[styles.toolbarText, hasActiveFilters && styles.toolbarTextActive]}>{messages.filter}</Text>{activeFilterCount > 0 ? <View style={styles.filterCount}><Text style={styles.filterCountText}>{activeFilterCount}</Text></View> : null}</Pressable><Pressable accessibilityRole="button" accessibilityState={{ expanded: sortOpen }} onPress={() => setSortOpen(true)} style={({ pressed }) => [styles.toolbarButton, styles.toolbarButtonRight, pressed && styles.toolbarButtonPressed]} testID="open-quest-sort"><ArrowDownUp color={colors.textStrong} size={22} strokeWidth={2.3} /><Text style={styles.toolbarText}>{messages.sort}</Text></Pressable></View>
        {hasActiveFilters ? <View accessibilityLabel="Active Quest Board filters" style={styles.activeFilters}>{filters.categories.map((category) => <Pressable accessibilityLabel={`Remove ${messages[categoryOptions.find((option) => option.value === category)?.labelKey ?? 'technology']} filter`} accessibilityRole="button" key={category} onPress={() => removeCategory(category)} style={styles.filterChip} testID={`active-quest-filter-${category}`}><Text style={styles.filterChipText}>{messages[categoryOptions.find((option) => option.value === category)?.labelKey ?? 'technology']}</Text><X color={colors.primary} size={13} strokeWidth={2.5} /></Pressable>)}{filters.locationModes.map((location) => <Pressable accessibilityLabel={`Remove ${location === 'online' ? messages.online : messages.onCampus} filter`} accessibilityRole="button" key={location} onPress={() => removeLocation(location)} style={styles.filterChip}><Text style={styles.filterChipText}>{location === 'online' ? messages.online : messages.onCampus}</Text><X color={colors.primary} size={13} strokeWidth={2.5} /></Pressable>)}{filters.rewardRange ? <Pressable accessibilityRole="button" onPress={() => setFilters((current) => ({ ...current, rewardRange: null }))} style={styles.filterChip}><Text style={styles.filterChipText}>{messages[rewardOptions.find((option) => option.value === filters.rewardRange)?.labelKey ?? 'under500']}</Text><X color={colors.primary} size={13} strokeWidth={2.5} /></Pressable> : null}{filters.deadline ? <Pressable accessibilityRole="button" onPress={() => setFilters((current) => ({ ...current, deadline: null }))} style={styles.filterChip}><Text style={styles.filterChipText}>{messages[deadlineOptions.find((option) => option.value === filters.deadline)?.labelKey ?? 'within7Days']}</Text><X color={colors.primary} size={13} strokeWidth={2.5} /></Pressable> : null}</View> : null}
        {SHOW_PREVIEW_CONTROLS ? <Pressable accessibilityRole="button" onPress={() => setPreviewOpen(true)} style={styles.previewButton} testID="open-quest-preview"><Text style={styles.previewButtonText}>{messages.previewState}{stateLabel ? `: ${messages[stateLabel]}` : ''}</Text></Pressable> : null}

        {boardModel.kind === 'loading' ? <View accessibilityLabel={messages.loading} style={styles.cards}>{[1, 2, 3].map((item) => <View key={item} testID={`quest-skeleton-${item}`} style={styles.skeleton} />)}</View> : null}
        {boardModel.kind === 'error' ? <StateView error title={messages.errorTitle} description={messages.errorDescription} actionLabel={messages.retry} onAction={() => setRetryAttempt((attempt) => attempt + 1)} /> : null}
        {boardModel.kind === 'error' && retryAttempt > 0 ? <Text accessibilityLabel="Quest Board retry completed" style={styles.retryStatus}>Retry {retryAttempt}</Text> : null}
        {boardModel.kind === 'empty' ? <StateView title={messages.noQuests} description={messages.subtitle} /> : null}
        {boardModel.kind === 'unavailable' ? <StateView title={boardModel.availability === 'full' ? messages.stateFull : messages.stateClosed} description={messages.noMatches} actionLabel={messages.title} onAction={() => openQuest(boardModel.quest, boardModel.availability)} /> : null}
        {boardModel.kind === 'ready' ? visibleQuests.length > 0 ? <View accessibilityLabel="Quest Board results" style={styles.cards}>{visibleQuests.map((quest) => <QuestCard key={quest.id} locale={locale} now={now} onDetail={() => openQuest(quest)} onTakeQuest={() => applyToQuest(quest)} quest={quest} />)}</View> : noMatch ? <StateView title={messages.noMatches} description={hasActiveFilters || query ? messages.subtitle : messages.noQuests} actionLabel={hasActiveFilters ? messages.clearFilters : undefined} onAction={hasActiveFilters ? clearFilters : undefined} /> : null : null}
      </ScrollView>
      {filterOpen ? <QuestBoardFilterSheet filter={draftFilters} messages={messages} onApply={applyFilters} onChange={setDraftFilters} onClear={() => setDraftFilters(emptyQuestBoardFilter)} onClose={() => setFilterOpen(false)} /> : null}
      {sortOpen ? <QuestBoardSortSheet messages={messages} onClose={() => setSortOpen(false)} onSelect={(value) => { setSort(value); setSortOpen(false); }} sort={sort} /> : null}
      {previewOpen ? <PreviewStateSheet messages={messages} onClose={() => setPreviewOpen(false)} onSelect={(value) => { setPreviewState(value); setPreviewOpen(false); }} state={previewState} /> : null}
    </SafeAreaView>
  );
}
