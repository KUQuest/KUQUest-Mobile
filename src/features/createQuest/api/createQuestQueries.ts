import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { questApi, type CreateQuestV2Payload } from "@/api/QuestApi";
import type { UploadAsset } from "@/api/fileUpload";
import { myQuestsKeys } from "@/features/myQuests/api/myQuestsQueries";
import { liveQuestService } from "@/features/questBoard/live/liveQuestService";
import { questBoardKeys } from "@/features/questBoard/api/questBoardQueries";
import { workerHomeKeys } from "@/features/workerHome/api/workerHomeQueries";

export const createQuestKeys = {
  all: ["createQuest"] as const,
  /**
   * The edit flow reads the raw `QuestV2Detail` payload, while the Quest board's
   * detail key holds the mapped `QuestBoardQuest`. They must not share a key:
   * one shape would be served where the other is expected.
   */
  editSource: (questId: string) =>
    [...createQuestKeys.all, "edit-source", questId] as const,
  publishCheck: (questId: string) =>
    [...createQuestKeys.all, "publish-check", questId] as const,
};

export function useQuestDetailQuery(
  questId: string | undefined,
  enabled = true
) {
  return useQuery({
    enabled: Boolean(questId) && enabled,
    queryKey: createQuestKeys.editSource(questId ?? ""),
    queryFn: ({ signal }) => {
      if (!questId) throw new Error("A Quest ID is required");
      return questApi.getDetail(questId, { signal });
    },
  });
}

export function useQuestPublishCheckQuery(
  questId: string | null,
  enabled = true
) {
  return useQuery({
    enabled: Boolean(questId) && enabled,
    queryKey: createQuestKeys.publishCheck(questId ?? ""),
    queryFn: ({ signal }) => {
      if (!questId) throw new Error("A Quest ID is required");
      return questApi.getPublishCheck(questId, { signal });
    },
  });
}

function invalidateQuestReads(queryClient: QueryClient, questId: string) {
  void queryClient.invalidateQueries({
    queryKey: questBoardKeys.detail(questId),
  });
  void queryClient.invalidateQueries({
    queryKey: createQuestKeys.editSource(questId),
  });
  void queryClient.invalidateQueries({ queryKey: myQuestsKeys.hirer() });
  void queryClient.invalidateQueries({ queryKey: workerHomeKeys.all });
}

export function useDeleteQuestImageMutation() {
  return useMutation({
    mutationFn: ({
      questId,
      imageId,
      idempotencyKey,
    }: {
      questId: string;
      imageId: string;
      idempotencyKey: string;
    }) => questApi.deleteQuestImage(questId, imageId, idempotencyKey),
  });
}

export function useUploadQuestImagesMutation() {
  return useMutation({
    mutationFn: ({
      questId,
      assets,
      idempotencyKey,
    }: {
      questId: string;
      assets: UploadAsset[];
      idempotencyKey: string;
    }) => questApi.uploadQuestImages(questId, assets, idempotencyKey),
  });
}

export function useEditQuestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      version,
      payload,
      idempotencyKey,
    }: {
      questId: string;
      version: number;
      payload: Partial<CreateQuestV2Payload>;
      idempotencyKey: string;
    }) => questApi.editQuest(questId, version, payload, idempotencyKey),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId),
  });
}

export function useCancelQuestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      idempotencyKey,
    }: {
      questId: string;
      idempotencyKey: string;
    }) => questApi.cancelQuest(questId, idempotencyKey),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId),
  });
}

export function useCreateQuestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      payload,
      idempotencyKey,
    }: {
      payload: CreateQuestV2Payload;
      idempotencyKey: string;
    }) => liveQuestService.createQuest(payload, idempotencyKey),
    onSuccess: (created) => invalidateQuestReads(queryClient, created.id),
  });
}

export function usePublishQuestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      idempotencyKey,
    }: {
      questId: string;
      idempotencyKey: string;
    }) => liveQuestService.publishQuest(questId, idempotencyKey),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId),
  });
}

export function usePublishEditQuestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      version,
      payload,
      idempotencyKey,
    }: {
      questId: string;
      version: number;
      payload: Partial<CreateQuestV2Payload>;
      idempotencyKey: string;
    }) => liveQuestService.editQuest(questId, version, payload, idempotencyKey),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId),
  });
}

export function usePublishImageUploadMutation() {
  return useMutation({
    mutationFn: ({
      questId,
      imageUris,
    }: {
      questId: string;
      imageUris: string[];
    }) => liveQuestService.uploadImages(questId, imageUris),
  });
}
