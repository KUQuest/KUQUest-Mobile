import { useEffect } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { questApi, type QuestV2AssignmentMineStatus } from "@/api/QuestApi";
import { subscribeToQuestBoardEvents } from "@/features/questBoard/live/questEvents";
import { workerHomeKeys } from "./workerHomeKeys";

export { workerHomeKeys } from "./workerHomeKeys";

type WorkerBoardQueryParams = {
  q?: string;
  tagId?: string | null;
};

export function useWorkerAssignmentsQuery(status: QuestV2AssignmentMineStatus) {
  return useQuery({
    queryKey: workerHomeKeys.assignments(status),
    queryFn: ({ signal }) => questApi.listMyAssignments(status, { signal }),
  });
}

export function useWorkerBoardQuery({ q, tagId }: WorkerBoardQueryParams) {
  const normalizedQuery = q ?? "";
  const normalizedTagId = tagId ?? null;
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: workerHomeKeys.board(normalizedQuery, normalizedTagId),
    queryFn: ({ signal }) =>
      questApi.listBoard(
        {
          q: normalizedQuery || undefined,
          tagId: normalizedTagId ?? undefined,
          limit: 20,
        },
        { signal }
      ),
    placeholderData: (previousData) => previousData,
  });
  const hasBoardSnapshot = query.data !== undefined;
  useEffect(() => {
    if (!hasBoardSnapshot) return;
    const invalidateBoard = () => {
      void queryClient.invalidateQueries({
        queryKey: [...workerHomeKeys.all, "board"],
      });
    };
    return subscribeToQuestBoardEvents(invalidateBoard, invalidateBoard);
  }, [hasBoardSnapshot, queryClient]);
  return query;
}

export function useWorkerTagsQuery() {
  return useQuery({
    queryKey: workerHomeKeys.tags(),
    queryFn: ({ signal }) => questApi.listTags({ signal }),
  });
}

export function useWorkerParticipationDetailQuery(questId: string | null) {
  return useQuery({
    enabled: Boolean(questId),
    queryKey: workerHomeKeys.participationDetail(questId ?? ""),
    queryFn: ({ signal }) => {
      if (!questId) {
        throw new Error("A quest ID is required");
      }
      return questApi.getParticipationDetail(questId, { signal });
    },
  });
}
