import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type {
  QuestV2Assignment,
  QuestV2BoardCard,
  QuestV2ParticipationDetail,
} from "@/api/questV2Contracts";
import type { TagItem } from "@/api/QuestApi";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import type { ThemeColors } from "@/theme/colors";
import { QuestStatus } from "@/domain/questLifecycle";
import {
  emptyQuestBoardFilter,
  QuestAssignmentStatus,
  type QuestBoardFilter,
} from "@/features/questBoard/domain/types";
import { questBoardMessages } from "@/locales/questBoardMessages";

import { handleNavigationScroll } from "@/features/navigation/navigationUiStore";
import { useLocale } from "@/features/preferences/localeStore";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { getAppChromeMetrics, getBottomNavigationInset } from "@/theme/layout";
import { spacing } from "@/theme/spacing";
import {
  useWorkerAssignmentsQuery,
  useWorkerBoardQuery,
  useWorkerParticipationDetailQuery,
  useWorkerTagsQuery,
} from "../api/workerHomeQueries";
import {
  workerHomeMessages,
  type WorkerHomeMessages,
} from "@/locales/workerHomeMessages";

function isOngoingWorkerAssignment(assignment: QuestV2Assignment): boolean {
  return (
    assignment.state === QuestAssignmentStatus.ASSIGNMENT_ACTIVE &&
    (assignment.questState === QuestStatus.QUEST_ASSIGNED ||
      assignment.questState === QuestStatus.QUEST_IN_PROGRESS)
  );
}

export interface WorkerHomeFrameProps {
  edges: ("top" | "left" | "right")[];
  className: string;
}

export interface WorkerHomeContentProps {
  activeOngoingAssignment: QuestV2Assignment | null;
  activeQuestDetail: QuestV2ParticipationDetail | null;
  assignmentsError: boolean;
  boardError: boolean;
  boardPending: boolean;
  bottomNavInset: number;
  filterOpen: boolean;
  filterDraft: QuestBoardFilter;
  filterMessages: (typeof questBoardMessages)[keyof typeof questBoardMessages];
  handleApplyFilters: () => void;
  handleChangeFilter: (filter: QuestBoardFilter) => void;
  handleCloseFilter: () => void;
  handleClearSearch: () => void;
  handleOpenCurrentWork: () => void;
  handleOpenFilter: () => void;
  handleQuestPress: (quest: QuestV2BoardCard) => void;
  handleRefresh: () => void;
  handleRetryAssignments: () => void;
  handleRetryBoard: () => void;
  handleRetryTags: () => void;
  handleSearchChange: (text: string) => void;
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  handleSelectTag: (tagId: string | null) => void;
  isRefreshing: boolean;
  messages: WorkerHomeMessages;
  availableQuests: QuestV2BoardCard[];
  scrollBottomPadding: number;
  searchQuery: string;
  selectedTagId: string | null;
  tagsError: boolean;
  tags: TagItem[];
  themeColors: ThemeColors;
}

export interface WorkerHomeControllerProps {
  frame: WorkerHomeFrameProps;
  content: WorkerHomeContentProps;
}

export function useWorkerHomeController(): WorkerHomeControllerProps {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const { colors: themeColors } = useAppTheme();
  const metrics = getAppChromeMetrics(width, fontScale);
  const { locale } = useLocale();
  const messages = workerHomeMessages[locale];

  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<QuestBoardFilter>(
    emptyQuestBoardFilter
  );
  const [filterDraft, setFilterDraft] = useState<QuestBoardFilter>(
    emptyQuestBoardFilter
  );
  const [searchQuery, setSearchQuery] = useState("");
  const assignmentsQuery = useWorkerAssignmentsQuery("active");
  const { refetch: refetchAssignments } = assignmentsQuery;
  const boardQuery = useWorkerBoardQuery({
    q: searchQuery,
    tagId: selectedTagId,
  });
  const { refetch: refetchBoard } = boardQuery;
  const tagsQuery = useWorkerTagsQuery();
  const { refetch: refetchTags } = tagsQuery;
  const activeAssignments = useMemo(
    () => assignmentsQuery.data ?? [],
    [assignmentsQuery.data]
  );
  const tags = useMemo(() => tagsQuery.data ?? [], [tagsQuery.data]);
  const availableQuests = (boardQuery.data?.items ?? []).filter(
    (quest) =>
      (filters.rewardMin === null || quest.questReward >= filters.rewardMin) &&
      (filters.rewardMax === null || quest.questReward <= filters.rewardMax)
  );
  const activeOngoingAssignment = useMemo(
    () => activeAssignments.find(isOngoingWorkerAssignment) ?? null,
    [activeAssignments]
  );
  const activeQuestDetailQuery = useWorkerParticipationDetailQuery(
    activeOngoingAssignment?.questId ?? null
  );
  const activeQuestDetail = activeQuestDetailQuery.data ?? null;

  const handleRefresh = useCallback(() => {
    void Promise.all([
      assignmentsQuery.refetch(),
      boardQuery.refetch(),
      tagsQuery.refetch(),
      activeOngoingAssignment
        ? activeQuestDetailQuery.refetch()
        : Promise.resolve(),
    ]);
  }, [
    activeOngoingAssignment,
    activeQuestDetailQuery,
    assignmentsQuery,
    boardQuery,
    tagsQuery,
  ]);
  const handleRetryAssignments = useCallback(() => {
    void refetchAssignments();
  }, [refetchAssignments]);
  const handleRetryBoard = useCallback(() => {
    void refetchBoard();
  }, [refetchBoard]);
  const handleRetryTags = useCallback(() => {
    void refetchTags();
  }, [refetchTags]);
  const handleChangeFilter = useCallback((filter: QuestBoardFilter) => {
    setFilterDraft(filter);
  }, []);
  const handleApplyFilters = useCallback(() => {
    const selectedTag = filterDraft.tags.at(-1);
    setFilters({
      ...filterDraft,
      tags: selectedTag ? [selectedTag] : [],
    });
    setSelectedTagId(tags.find((tag) => tag.name === selectedTag)?.id ?? null);
    setSearchQuery(filterDraft.query);
    setFilterOpen(false);
  }, [filterDraft, tags]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);
  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);
  const handleSelectTag = useCallback(
    (tagId: string | null) => {
      setSelectedTagId(tagId);
      const selectedName = tags.find((tag) => tag.id === tagId)?.name;
      setFilters((current) => ({
        ...current,
        tags: selectedName ? [selectedName] : [],
      }));
    },
    [tags]
  );
  const handleOpenFilter = useCallback(() => {
    const selectedName = tags.find((tag) => tag.id === selectedTagId)?.name;
    setFilterDraft({
      ...filters,
      tags: selectedName ? [selectedName] : [],
      query: searchQuery,
    });
    setFilterOpen(true);
  }, [filters, searchQuery, selectedTagId, tags]);
  const handleCloseFilter = useCallback(() => {
    setFilterOpen(false);
  }, []);
  const handleQuestPress = useCallback(
    (quest: QuestV2BoardCard) => {
      router.push({ pathname: "/quest/[id]", params: { id: quest.id } });
    },
    [router]
  );
  const ongoingAssignmentCount = activeAssignments.filter(
    isOngoingWorkerAssignment
  ).length;
  const handleOpenCurrentWork = useCallback(() => {
    // With a single ongoing Assignment, skip the list and open its Work Hub.
    if (ongoingAssignmentCount === 1 && activeOngoingAssignment) {
      router.push({
        pathname: "/quest/[id]/work",
        params: { id: activeOngoingAssignment.questId },
      });
      return;
    }
    router.push("/my-quests");
  }, [activeOngoingAssignment, ongoingAssignmentCount, router]);
  const bottomNavInset = getBottomNavigationInset(metrics, insets.bottom);
  // Reserve room for the floating quick access bar and bottom navigation.
  const scrollBottomPadding =
    bottomNavInset +
    (activeOngoingAssignment ? spacing.px76 : spacing.md) +
    spacing.xl;

  return {
    frame: {
      edges: ["top", "left", "right"],
      className: "bg-ku-background",
    },
    content: {
      activeOngoingAssignment,
      activeQuestDetail,
      assignmentsError: assignmentsQuery.isError,
      boardError: boardQuery.isError,
      boardPending: boardQuery.isPending,
      bottomNavInset,
      filterOpen,
      filterDraft,
      filterMessages: questBoardMessages[locale],
      handleApplyFilters,
      handleChangeFilter,
      handleCloseFilter,
      handleClearSearch,
      handleOpenCurrentWork,
      handleOpenFilter,
      handleQuestPress,
      handleRefresh,
      handleRetryAssignments,
      handleRetryBoard,
      handleRetryTags,
      handleSearchChange,
      handleScroll: handleNavigationScroll,
      handleSelectTag,
      isRefreshing:
        assignmentsQuery.isRefetching ||
        boardQuery.isRefetching ||
        tagsQuery.isRefetching ||
        activeQuestDetailQuery.isRefetching,
      messages,
      availableQuests,
      scrollBottomPadding,
      searchQuery,
      selectedTagId,
      tagsError: tagsQuery.isError,
      tags,
      themeColors,
    },
  };
}
