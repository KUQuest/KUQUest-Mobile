import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";

import {
  createQuestIdempotencyKey,
  questApi,
  type QuestV2AssignmentMineStatus,
} from "@/api/QuestApi";
import type { UploadAsset } from "@/api/fileUpload";
import { liveQuestService } from "@/features/questBoard/liveQuestService";
import { myQuestsKeys } from "@/features/myQuests/api/myQuestsQueries";

type WorkerBoardQueryParams = {
  q?: string;
  tagId?: string | null;
};

export const workerHomeKeys = {
  all: ["workerHome"] as const,
  assignments: (status: QuestV2AssignmentMineStatus) =>
    [...workerHomeKeys.all, "assignments", status] as const,
  board: (q: string, tagId: string | null) =>
    [...workerHomeKeys.all, "board", q, tagId] as const,
  tags: () => [...workerHomeKeys.all, "tags"] as const,
  participationDetail: (questId: string) =>
    [...workerHomeKeys.all, "participation-detail", questId] as const,
  assignmentTitles: (questIds: readonly string[]) =>
    [...workerHomeKeys.all, "assignment-titles", questIds] as const,
  liveSnapshot: (questId: string, viewerId: string) =>
    [...workerHomeKeys.all, "live-snapshot", questId, viewerId] as const,
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
  return useQuery({
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

export function useWorkerAssignmentTitlesQuery(questIds: readonly string[]) {
  const normalizedQuestIds = [...new Set(questIds)].sort();
  return useQuery({
    enabled: normalizedQuestIds.length > 0,
    queryKey: workerHomeKeys.assignmentTitles(normalizedQuestIds),
    queryFn: async ({ signal }) => {
      const results = await Promise.all(
        normalizedQuestIds.map(async (questId) => {
          try {
            const detail = await questApi.getParticipationDetail(questId, {
              signal,
            });
            return [questId, detail.title] as const;
          } catch {
            return [questId, ""] as const;
          }
        })
      );
      return Object.fromEntries(
        results.filter(([, title]) => title.length > 0)
      ) as Record<string, string>;
    },
  });
}

export function useWorkerLiveSnapshotQuery(
  questId: string | null,
  viewerId: string | null
) {
  return useQuery({
    enabled: Boolean(questId && viewerId),
    queryKey: workerHomeKeys.liveSnapshot(questId ?? "", viewerId ?? ""),
    queryFn: ({ signal }) => {
      if (!questId || !viewerId) {
        throw new Error("A quest ID and viewer ID are required");
      }
      return liveQuestService.getLiveSnapshot(questId, viewerId, { signal });
    },
  });
}

type WorkerMutationInput = {
  questId: string;
  viewerId: string;
};

function invalidateWorkerState(
  queryClient: QueryClient,
  { questId, viewerId }: WorkerMutationInput
) {
  void queryClient.invalidateQueries({
    queryKey: workerHomeKeys.assignments("active"),
  });
  void queryClient.invalidateQueries({
    queryKey: workerHomeKeys.assignments("all"),
  });
  void queryClient.invalidateQueries({
    queryKey: workerHomeKeys.liveSnapshot(questId, viewerId),
  });
  void queryClient.invalidateQueries({
    queryKey: myQuestsKeys.worker(viewerId),
  });
}

export function useConfirmCompletionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questId }: WorkerMutationInput) =>
      liveQuestService.confirmCompletion(questId, createQuestIdempotencyKey()),
    onSuccess: (_, variables) => {
      invalidateWorkerState(queryClient, variables);
    },
  });
}

export function useSubmitProofMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      questId,
      viewerId: _viewerId,
      asset,
      description,
    }: WorkerMutationInput & {
      asset: UploadAsset;
      description?: string;
    }) => {
      const proofDraft = await liveQuestService.createProofDraft(
        questId,
        {
          assets: [asset],
          description,
        },
        createQuestIdempotencyKey()
      );
      return liveQuestService.submitProofDraft(
        questId,
        proofDraft.id,
        createQuestIdempotencyKey()
      );
    },
    onSuccess: (_, variables) => {
      invalidateWorkerState(queryClient, variables);
    },
  });
}
