import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshControl, View } from "react-native";
import { AccessibilityInfo, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { QuestList } from "@/components/ui/QuestList";
import { handleNavigationScroll } from "@/features/navigation/navigationUiStore";
import { authService } from "@/features/auth/AuthService";
import { useLocale } from "@/features/preferences/localeStore";
import { spacing } from "@/theme/spacing";
import { getAppChromeMetrics } from "@/theme/layout";
import { questBoardMessages } from "@/locales/questBoardMessages";
import styles from "./questBoardStyles";
import { getLocalizedQuest } from "./questFixtures";
import { getActiveFilterCount, sortOptions } from "./questBoardOptions";
import {
  applyQuestBoardFilters,
  getQuestBoardTags,
  getVisibleQuests,
  sortQuests,
} from "./questBoardViewData";
import type { BoardPreviewState } from "./questBoardHarness";
import { questWorkflow } from "./questWorkflow";
import { useQuestBoardQuery } from "./api/questBoardQueries";
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

export type { BoardPreviewState } from "./questBoardHarness";

export interface QuestBoardScreenProps {
  currentStudentId?: string;
  initialPreviewState?: BoardPreviewState;
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
  initialPreviewState = "populated",
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
  const handleScroll = handleNavigationScroll;
  const messages = questBoardMessages[locale];
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<QuestBoardFilter>(
    emptyQuestBoardFilter
  );
  const [draftFilters, setDraftFilters] = useState<QuestBoardFilter>(
    emptyQuestBoardFilter
  );
  const [sort, setSort] = useState<QuestBoardSort>("newest");
  const [previewState, setPreviewState] =
    useState<BoardPreviewState>(initialPreviewState);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!retrying || previewState !== "loading") return undefined;
    const timeout = setTimeout(() => {
      setPreviewState("populated");
      setRetrying(false);
    }, 250);
    return () => clearTimeout(timeout);
  }, [previewState, retrying]);

  const boardQuery = useQuestBoardQuery(previewState === "populated");
  const liveQuests = useMemo(() => boardQuery.data ?? null, [boardQuery.data]);
  const refreshing = boardQuery.isRefetching;
  const refreshBoard = useCallback(() => {
    if (previewState !== "populated") return;
    void boardQuery.refetch({ cancelRefetch: false }).catch(() => undefined);
  }, [boardQuery, previewState]);
  const workflowNow = useMemo(() => new Date(), []);

  const boardModel = useMemo(() => {
    if (previewState !== "populated") {
      return questWorkflow.getQuestBoardSurfaceModel(
        resolvedStudentId,
        previewState
      );
    }
    if (boardQuery.isError) return { kind: "error" as const };
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
  }, [boardQuery.isError, liveQuests, previewState, resolvedStudentId]);
  const localizedQuests = useMemo(
    () =>
      boardModel.kind === "ready"
        ? boardModel.quests.map((quest) =>
            previewState === "populated"
              ? quest
              : getLocalizedQuest(quest, locale)
          )
        : [],
    [boardModel, locale, previewState]
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
    (quest: QuestBoardQuest, preview?: BoardPreviewState) => {
      const applicationPreview =
        preview ??
        (previewState === "application-pending" ||
        previewState === "application-accepted"
          ? previewState
          : undefined);
      router.push({
        pathname: "/quest/[id]",
        params: {
          id: quest.id,
          ...(applicationPreview ? { preview: applicationPreview } : {}),
        },
      });
    },
    [previewState, router]
  );

  const retryBoard = () => {
    setRetryAttempt((attempt) => attempt + 1);
    setRetrying(true);
    setPreviewState("loading");
  };

  const activeFilterCount = getActiveFilterCount(filters);
  const hasActiveFilters = activeFilterCount > 0;
  const sortLabelKey =
    sortOptions.find((option) => option.value === sort)?.labelKey ?? "newest";
  const sortLabel = messages[sortLabelKey];
  const noMatch =
    previewState === "populated" ||
    previewState === "application-pending" ||
    previewState === "application-accepted";
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
      showRetryStatus={boardModel.kind === "ready" && retryAttempt > 0}
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
    ) : boardModel.kind === "unavailable" ? (
      <StateView
        title={
          boardModel.availability === "full"
            ? messages.stateFull
            : messages.stateClosed
        }
        description={messages.noMatches}
        actionLabel={messages.title}
        onAction={() => openQuest(boardModel.quest, boardModel.availability)}
      />
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
