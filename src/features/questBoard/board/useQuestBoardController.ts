import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { useRouter } from "expo-router";

import { showErrorAlert } from "@/components/ui/SweetAlert";

import { useSessionQuery } from "@/features/auth/sessionQueries";
import { useLocale } from "@/features/preferences/localeStore";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { getLocalizedQuest } from "../fixtures/questFixtureLocalization";
import type { BoardPreviewState } from "../fixtures/questBoardHarness";
import { useQuestBoardQuery } from "../api/questBoardQueries";
import {
  emptyQuestBoardFilter,
  type QuestBoardFilter,
  type QuestBoardQuest,
  type QuestBoardSort,
  type QuestLocationMode,
  type StartTimeBucket,
} from "../domain/types";
import { liveQuestService } from "../live/liveQuestService";
import {
  applyQuestBoardFilters,
  getQuestBoardTags,
  getQuestRewardSatang,
  getVisibleQuests,
  sortQuests,
} from "../presentation/questBoardViewData";
import { questWorkflow } from "../workflow/questWorkflow";
import { getActiveFilterCount, sortOptions } from "./questBoardOptions";

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

export function useQuestBoardController(
  currentStudentId: string | undefined,
  initialPreviewState: BoardPreviewState
) {
  const router = useRouter();
  const { locale } = useLocale();
  const sessionQuery = useSessionQuery();
  const sessionUserId = sessionQuery.data?.user.id ?? null;
  const resolvedStudentId = currentStudentId?.trim() || sessionUserId || "";
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
  const liveQuests = boardQuery.data ?? null;
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
  const openOwnerProfile = useCallback(
    async (
      quest: QuestBoardQuest,
      event?: { stopPropagation?: () => void }
    ) => {
      event?.stopPropagation?.();
      if (quest.ownerStudentId) {
        router.push(`/profile/${quest.ownerStudentId}`);
        return;
      }
      try {
        const hirer = await liveQuestService.getHirerParticipant(quest.id);
        if (hirer?.id) router.push(`/profile/${hirer.id}`);
        else showErrorAlert("Profile", "Profile unavailable for this quest.");
      } catch {
        showErrorAlert("Profile", "Profile unavailable for this quest.");
      }
    },
    [router]
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

  return {
    locale,
    messages,
    query,
    setQuery,
    filters,
    draftFilters,
    setDraftFilters,
    sort,
    setSort,
    previewState,
    filterOpen,
    setFilterOpen,
    sortOpen,
    setSortOpen,
    retryAttempt,
    boardModel,
    visibleQuests,
    availableTags,
    refreshing,
    refreshBoard,
    openFilters,
    applyFilters,
    clearNoMatch,
    openQuest,
    openOwnerProfile,
    retryBoard,
    activeFilterCount,
    hasActiveFilters,
    sortLabel,
    noMatch,
    noMatchActionLabel,
    noMatchAction,
    removeTag,
    removeLocation,
    removeStartTimeBucket,
    removeRewardBounds,
    removeDeadline,
    rewardSatang: getQuestRewardSatang,
  };
}
