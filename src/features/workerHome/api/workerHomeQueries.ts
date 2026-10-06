import { useEffect } from "react";

import {
  type QueryClient,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { questApi, type QuestV2AssignmentMineStatus } from "@/api/QuestApi";
import { openServerSocket, type ServerSocket } from "@/api/ServerSocket";
import { subscribeToQuestBoardEvents } from "@/features/questBoard/live/questEvents";
import { workerHomeKeys } from "./workerHomeKeys";

export { workerHomeKeys } from "./workerHomeKeys";

type WorkerBoardQueryParams = {
  q?: string;
  tagId?: string | null;
};

const workerAssignmentSockets = new WeakMap<
  QueryClient,
  { consumers: number; socket: ServerSocket }
>();

export function useWorkerAssignmentsQuery(
  status: QuestV2AssignmentMineStatus,
  enabled = true
) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    const invalidateAssignments = () => {
      void queryClient.invalidateQueries({
        queryKey: [...workerHomeKeys.all, "assignments"],
      });
    };
    const existing = workerAssignmentSockets.get(queryClient);
    if (existing) {
      existing.consumers += 1;
      return () => {
        existing.consumers -= 1;
        if (existing.consumers === 0) {
          workerAssignmentSockets.delete(queryClient);
          existing.socket.close();
        }
      };
    }
    const socket = openServerSocket("/api/v2/me/worker-assignments/events", {
      onFrame: invalidateAssignments,
    });
    const subscription = { consumers: 1, socket };
    workerAssignmentSockets.set(queryClient, subscription);
    return () => {
      subscription.consumers -= 1;
      if (subscription.consumers === 0) {
        workerAssignmentSockets.delete(queryClient);
        socket.close();
      }
    };
  }, [enabled, queryClient]);
  return useQuery({
    enabled,
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
