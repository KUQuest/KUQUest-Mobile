import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RefreshControl, View } from "react-native";
import { AccessibilityInfo, useWindowDimensions } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { QuestList } from "@/components/ui/QuestList";
import { useNavigationVisibility } from "@/components/navigation/NavigationVisibilityContext";
import { authService } from "@/features/auth/AuthService";
import { useLocale } from "@/locales/LocaleProvider";
import { useCalmRefresh } from "@/hooks/useCalmRefresh";
import { spacing } from "@/theme/spacing";
import { getAppChromeMetrics } from "@/theme/layout";
import { questBoardMessages } from "@/locales/questBoardMessages";
import styles from "./questBoardStyles";
import { getActiveFilterCount, sortOptions } from "./questBoardOptions";
import {
  applyQuestBoardFilters,
  getQuestBoardTags,
  getVisibleQuests,
  sortQuests,
} from "./questBoardViewData";
import { liveQuestService } from "./liveQuestService";
import {
  emptyQuestBoardFilter,
  type QuestBoardFilter,
  type QuestBoardQuest,
  type QuestBoardSort,
  type QuestLocationMode,
  type StartTimeBucket,
} from "./types";
import { QuestCard } from "./components/QuestCard";
import {
  QuestBoardFilterSheet,
  QuestBoardSortSheet,
} from "./components/QuestBoardFilters";
import { QuestBoardListHeader } from "./components/QuestBoardListHeader";
import { QuestBoardSkeleton, StateView } from "./components/QuestBoardStates";

export interface QuestBoardScreenProps {
  currentStudentId?: string;
}

function announce(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

function cloneFilter(filter: QuestBoardFilter): QuestBoardFilter {
  return {
    ...filter,
    tags: [...filter.tags],
    startTimeBuckets: [...filter.startTimeBuckets],
    locationModes: [...filter.locationModes],
  };
}

export default function QuestBoardScreen({
  currentStudentId,
}: QuestBoardScreenProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void authService
      .getSession()
      .then((session) => {
        if (active && session?.user?.id) setSessionUserId(session.user.id);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const resolvedStudentId = currentStudentId?.trim() || sessionUserId || "";
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const chromeMetrics = getAppChromeMetrics(width, fontScale);
  const { handleScroll } = useNavigationVisibility();
  const messages = questBoardMessages[locale];
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<QuestBoardFilter>(
    emptyQuestBoardFilter
  );
  const [draftFilters, setDraftFilters] = useState<QuestBoardFilter>(
    emptyQuestBoardFilter
  );
  const [sort, setSort] = useState<QuestBoardSort>("newest");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [liveQuests, setLiveQuests] = useState<QuestBoardQuest[] | null>(null);
  const [liveError, setLiveError] = useState<Error | null>(null);
  const hasSuccessfulBoardDataRef = useRef(false);
  const loadBoard = useCallback(async (): Promise<QuestBoardQuest[]> => {
    try {
      const items = await liveQuestService.listBoardQuests();
      hasSuccessfulBoardDataRef.current = true;
      setLiveQuests(items);
      setLiveError(null);
      return items;
    } catch (error: unknown) {
      const normalizedError =
        error instanceof Error
          ? error
          : new Error("Quest Board request failed");
      if (!hasSuccessfulBoardDataRef.current) {
        setLiveError(normalizedError);
      }
      throw normalizedError;
    }
  }, []);
  const { refreshing, refresh, refreshOnFocus } = useCalmRefresh(loadBoard);
  const refreshBoard = useCallback(() => {
    void refresh(true).catch(() => undefined);
  }, [refresh]);
  const workflowNow = useMemo(() => new Date(), []);
  useEffect(() => {
    void refresh().catch(() => undefined);
  }, [refresh]);
  useFocusEffect(
    useCallback(() => {
      refreshOnFocus();
      return undefined;
    }, [refreshOnFocus])
  );

  const boardModel = useMemo(() => {
    if (liveError) return { kind: "error" as const };
    if (liveQuests !== null) {
      const quests = getVisibleQuests(liveQuests, {
        currentStudentId: resolvedStudentId,
        now: new Date(),
      });
      return quests.length > 0
        ? { kind: "ready" as const, quests }
        : { kind: "empty" as const };
    }
    return { kind: "loading" as const };
  }, [liveError, liveQuests, resolvedStudentId]);
  const localizedQuests = useMemo(
    () => (boardModel.kind === "ready" ? boardModel.quests : []),
    [boardModel]
  );
  const availableTags = useMemo(
    () =>
      getQuestBoardTags(
        getVisibleQuests(localizedQuests, {
          currentStudentId: resolvedStudentId,
          now: workflowNow,
        })
      ),
    [resolvedStudentId, localizedQuests, workflowNow]
  );
  const visibleQuests = useMemo(
    () =>
      boardModel.kind === "ready"
        ? sortQuests(
            applyQuestBoardFilters(
              localizedQuests,
              { ...filters, query },
              { currentStudentId: resolvedStudentId, now: workflowNow }
            ),
            sort
          )
        : [],
    [
      boardModel.kind,
      filters,
      localizedQuests,
      query,
      resolvedStudentId,
      sort,
      workflowNow,
    ]
  );
  const openFilters = () => {
    setDraftFilters(cloneFilter(filters));
    setFilterOpen(true);
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setDraftFilters((current) => ({
      ...emptyQuestBoardFilter,
      query: current.query,
    }));
    setFilters((current) => ({
      ...emptyQuestBoardFilter,
      query: current.query,
    }));
  };

  const clearNoMatch = () => {
    setQuery("");
    setDraftFilters(emptyQuestBoardFilter);
    setFilters(emptyQuestBoardFilter);
  };

  const openQuest = useCallback(
    (quest: QuestBoardQuest) => {
      router.push({
        pathname: "/quest/[id]",
        params: { id: quest.id },
      });
    },
    [router]
  );

  const retryBoard = () => {
    hasSuccessfulBoardDataRef.current = false;
    setLiveQuests(null);
    setLiveError(null);
    void refresh(true).catch(() => undefined);
  };

  const activeFilterCount = getActiveFilterCount(filters);
  const hasActiveFilters = activeFilterCount > 0;
  const sortLabelKey =
    sortOptions.find((option) => option.value === sort)?.labelKey ?? "newest";
  const sortLabel = messages[sortLabelKey];
  const noMatch = boardModel.kind === "ready";
  const noMatchActionLabel =
    hasActiveFilters && query
      ? messages.clearSearchAndFilters
      : hasActiveFilters
        ? messages.clearFilters
        : query
          ? messages.clearSearch
          : undefined;
  const noMatchAction =
    hasActiveFilters && !query ? clearFilters : clearNoMatch;
  const removeTag = (tag: string) =>
    setFilters((current) => ({
      ...current,
      tags: current.tags.filter((value) => value !== tag),
    }));
  const removeLocation = (location: QuestLocationMode) =>
    setFilters((current) => ({
      ...current,
      locationModes: current.locationModes.filter(
        (value) => value !== location
      ),
    }));
  const removeStartTimeBucket = (bucket: StartTimeBucket) =>
    setFilters((current) => ({
      ...current,
      startTimeBuckets: current.startTimeBuckets.filter(
        (value) => value !== bucket
      ),
    }));
  const removeRewardBounds = () =>
    setFilters((current) => ({ ...current, rewardMin: null, rewardMax: null }));
  const removeDeadline = () =>
    setFilters((current) => ({ ...current, deadline: null }));
  const previousBoardKind = useRef<string | undefined>(undefined);

  useEffect(() => {
    const previousKind = previousBoardKind.current;
    if (boardModel.kind === "loading") announce(messages.loading);
    if (boardModel.kind === "error")
      announce(`${messages.errorTitle}. ${messages.retry}`);
    if (boardModel.kind === "empty")
      announce(`${messages.noQuests}. ${messages.subtitle}`);
    if (boardModel.kind === "ready" && previousKind === "loading")
      announce(messages.retrySuccess);
    previousBoardKind.current = boardModel.kind;
  }, [boardModel.kind, messages]);

  useEffect(() => {
    if (
      boardModel.kind === "ready" &&
      (query.trim() || hasActiveFilters) &&
      visibleQuests.length === 0
    ) {
      announce(messages.noMatches);
    }
  }, [
    boardModel.kind,
    hasActiveFilters,
    messages,
    query,
    visibleQuests.length,
  ]);

  const renderQuest = useCallback(
    ({ item }: { item: QuestBoardQuest }) => (
      <QuestCard
        locale={locale}
        onDetail={() => openQuest(item)}
        quest={item}
      />
    ),
    [locale, openQuest]
  );

  const listHeader = (
    <QuestBoardListHeader
      locale={locale}
      messages={messages}
      query={query}
      onQueryChange={setQuery}
      onClearQuery={() => setQuery("")}
      hasActiveFilters={hasActiveFilters}
      activeFilterCount={activeFilterCount}
      filterOpen={filterOpen}
      onOpenFilters={openFilters}
      sortOpen={sortOpen}
      onOpenSort={() => setSortOpen(true)}
      sortLabel={sortLabel}
      filters={filters}
      onRemoveTag={removeTag}
      onRemoveLocation={removeLocation}
      onRemoveRewardBounds={removeRewardBounds}
      onRemoveDeadline={removeDeadline}
      onRemoveStartTimeBucket={removeStartTimeBucket}
      showRetryStatus={false}
    />
  );

  const emptyState =
    boardModel.kind === "loading" ? (
      <QuestBoardSkeleton loadingLabel={messages.loading} />
    ) : boardModel.kind === "error" ? (
      <StateView
        error
        title={messages.errorTitle}
        description={messages.errorDescription}
        actionLabel={messages.retry}
        onAction={retryBoard}
      />
    ) : boardModel.kind === "empty" ? (
      <StateView title={messages.noQuests} description={messages.subtitle} />
    ) : noMatch ? (
      <StateView
        title={messages.noMatches}
        description={
          hasActiveFilters || query ? messages.subtitle : messages.noQuests
        }
        actionLabel={noMatchActionLabel}
        onAction={hasActiveFilters || query ? noMatchAction : undefined}
      />
    ) : null;

  return (
    <ScreenLayout edges={["top", "left", "right"]} className={styles.safeArea}>
      <QuestList
        accessibilityLabel={messages.resultsLabel}
        refreshControl={
          <RefreshControl
            onRefresh={refreshBoard}
            refreshing={refreshing}
            testID="quest-board-refresh-control"
          />
        }
        contentContainerClassName={styles.scrollContent}
        contentContainerStyle={{
          paddingBottom:
            chromeMetrics.navHeight +
            insets.bottom +
            spacing.xl +
            spacing.xl +
            spacing.lg,
          paddingHorizontal: spacing.md,
        }}
        data={boardModel.kind === "ready" ? visibleQuests : []}
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
      {filterOpen ? (
        <QuestBoardFilterSheet
          availableTags={availableTags}
          filter={draftFilters}
          messages={messages}
          onApply={applyFilters}
          onChange={setDraftFilters}
          onClose={() => setFilterOpen(false)}
        />
      ) : null}
      {sortOpen ? (
        <QuestBoardSortSheet
          messages={messages}
          onClose={() => setSortOpen(false)}
          onSelect={(value) => {
            setSort(value);
            setSortOpen(false);
          }}
          sort={sort}
        />
      ) : null}
    </ScreenLayout>
  );
}
