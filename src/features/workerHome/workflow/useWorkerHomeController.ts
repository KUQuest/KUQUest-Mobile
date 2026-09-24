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
import { QuestAssignmentStatus } from "@/features/questBoard/domain/types";

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
} from "../workerHomeMessages";

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
  handleClearSearch: () => void;
  handleOpenCurrentWork: () => void;
  handleOpenFilter: () => void;
  handleQuestPress: (quest: QuestV2BoardCard) => void;
  handleRefresh: () => void;
  handleSearchChange: (text: string) => void;
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  handleSelectTag: (tagId: string | null) => void;
  isRefreshing: boolean;
  messages: WorkerHomeMessages;
  availableQuests: QuestV2BoardCard[];
  scrollBottomPadding: number;
  searchQuery: string;
  selectedTagId: string | null;
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
  const [searchQuery, setSearchQuery] = useState("");
  const assignmentsQuery = useWorkerAssignmentsQuery("active");
  const boardQuery = useWorkerBoardQuery({
    q: searchQuery,
    tagId: selectedTagId,
  });
  const tagsQuery = useWorkerTagsQuery();
  const activeAssignments = useMemo(
    () => assignmentsQuery.data ?? [],
    [assignmentsQuery.data]
  );
  const availableQuests = boardQuery.data?.items ?? [];
  const tags = tagsQuery.data ?? [];
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

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);
  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);
  const handleSelectTag = useCallback((tagId: string | null) => {
    setSelectedTagId(tagId);
  }, []);
  const handleOpenFilter = useCallback(() => {
    // Open filter or toggle search options
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
      handleClearSearch,
      handleOpenCurrentWork,
      handleOpenFilter,
      handleQuestPress,
      handleRefresh,
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
      tags,
      themeColors,
    },
  };
}
