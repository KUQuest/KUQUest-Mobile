import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";

import type { UploadAsset } from "@/api/fileUpload";
import { disputeApi, type DisputeReason } from "@/api/DisputeApi";
import type {
  QuestV2CreateEditRequestPayload,
  QuestV2ProofCreatePayload,
  QuestV2ProofFileUploadPayload,
  QuestV2ProofReviewPayload,
  QuestV2ProofRetryPayload,
  QuestV2ProofUpdatePayload,
  QuestV2ReviewPayload,
} from "@/api/QuestApi";
import {
  liveQuestService,
  type LiveQuestSnapshot,
  type LiveQuestSnapshotOptions,
} from "../liveQuestService";

export const questBoardKeys = {
  all: ["questBoard"] as const,
  board: () => [...questBoardKeys.all, "board"] as const,
  detail: (questId: string) =>
    [...questBoardKeys.all, "detail", questId] as const,
  myHirer: () => [...questBoardKeys.all, "my-hirer"] as const,
  liveSnapshot: (questId: string, viewerId: string, editRequestId?: string) =>
    [
      ...questBoardKeys.all,
      "live-snapshot",
      questId,
      viewerId,
      editRequestId ?? null,
    ] as const,
};

export function useQuestBoardQuery(enabled = true) {
  return useQuery({
    enabled,
    queryKey: questBoardKeys.board(),
    queryFn: ({ signal }) => liveQuestService.listBoardQuests({ signal }),
  });
}

export function useMyHirerQuestBoardQuery(enabled = true) {
  return useQuery({
    enabled,
    queryKey: questBoardKeys.myHirer(),
    queryFn: ({ signal }) => liveQuestService.listMyHirerQuests({ signal }),
  });
}

export function useQuestDetailQuery(questId: string | null, enabled = true) {
  return useQuery({
    enabled: Boolean(questId) && enabled,
    queryKey: questBoardKeys.detail(questId ?? ""),
    queryFn: ({ signal }) => {
      if (!questId) throw new Error("A quest ID is required");
      return liveQuestService.getQuestDetail(questId, { signal });
    },
  });
}

export function useLiveQuestSnapshotQuery(
  questId: string | null,
  viewerId: string | null,
  options: Omit<LiveQuestSnapshotOptions, "signal"> = {},
  enabled = true,
  // This optional interval replaces the screens' former manual polling.
  refetchIntervalMs?:
    | number
    | false
    | ((snapshot: LiveQuestSnapshot | undefined) => number | false)
) {
  return useQuery<LiveQuestSnapshot>({
    enabled: Boolean(questId && viewerId) && enabled,
    refetchInterval:
      typeof refetchIntervalMs === "function"
        ? (query) =>
            refetchIntervalMs(query.state.data as LiveQuestSnapshot | undefined)
        : refetchIntervalMs,
    queryKey: questBoardKeys.liveSnapshot(
      questId ?? "",
      viewerId ?? "",
      options.editRequestId
    ),
    queryFn: ({ signal }) => {
      if (!questId || !viewerId) {
        throw new Error("A quest ID and viewer ID are required");
      }
      return liveQuestService.getLiveSnapshot(questId, viewerId, {
        ...options,
        signal,
      });
    },
  });
}

function invalidateQuestReads(
  queryClient: QueryClient,
  questId: string,
  viewerId?: string
) {
  void queryClient.invalidateQueries({
    queryKey: questBoardKeys.detail(questId),
  });
  void queryClient.invalidateQueries({
    queryKey: questBoardKeys.board(),
  });
  if (viewerId) {
    void queryClient.invalidateQueries({
      queryKey: questBoardKeys.liveSnapshot(questId, viewerId),
    });
  }
}

export function useJoinQuestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questId }: { questId: string; viewerId?: string }) =>
      liveQuestService.joinQuest(questId),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId, variables.viewerId),
  });
}

export function useApplyQuestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      idempotencyKey,
    }: {
      questId: string;
      viewerId?: string;
      idempotencyKey?: string;
    }) => liveQuestService.applyQuest(questId, idempotencyKey),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId, variables.viewerId),
  });
}

export function useWithdrawApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      applicationId,
      idempotencyKey,
    }: {
      questId: string;
      applicationId: string;
      viewerId?: string;
      idempotencyKey?: string;
    }) =>
      liveQuestService.withdrawApplication(
        questId,
        applicationId,
        idempotencyKey
      ),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId, variables.viewerId),
  });
}

export function useCreateCandidateInquiryMutation() {
  return useMutation({
    mutationFn: (questId: string) =>
      liveQuestService.createCandidateInquiry(questId),
  });
}

export function useSelectApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      applicationId,
      idempotencyKey,
    }: {
      questId: string;
      applicationId: string;
      viewerId?: string;
      idempotencyKey?: string;
    }) =>
      liveQuestService.selectApplication(
        questId,
        applicationId,
        idempotencyKey
      ),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId, variables.viewerId),
  });
}

export function useRejectApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      applicationId,
      idempotencyKey,
    }: {
      questId: string;
      applicationId: string;
      viewerId?: string;
      idempotencyKey?: string;
    }) =>
      liveQuestService.rejectApplication(
        questId,
        applicationId,
        idempotencyKey
      ),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId, variables.viewerId),
  });
}

export function useCreateCandidateTeamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      payload,
      idempotencyKey,
    }: {
      questId: string;
      payload: { name: string; headcount: number };
      viewerId?: string;
      idempotencyKey?: string;
    }) =>
      liveQuestService.createCandidateTeam(questId, payload, idempotencyKey),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId, variables.viewerId),
  });
}

export function useJoinCandidateTeamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      teamId,
      joinCode,
      idempotencyKey,
    }: {
      questId: string;
      teamId: string;
      joinCode: string;
      viewerId?: string;
      idempotencyKey?: string;
    }) =>
      liveQuestService.joinCandidateTeam(
        questId,
        teamId,
        joinCode,
        idempotencyKey
      ),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId, variables.viewerId),
  });
}

export function useSelectCandidateTeamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      teamId,
      idempotencyKey,
    }: {
      questId: string;
      teamId: string;
      viewerId?: string;
      idempotencyKey?: string;
    }) => liveQuestService.selectCandidateTeam(questId, teamId, idempotencyKey),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId, variables.viewerId),
  });
}

export function useRejectCandidateTeamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      teamId,
      idempotencyKey,
    }: {
      questId: string;
      teamId: string;
      viewerId?: string;
      idempotencyKey?: string;
    }) => liveQuestService.rejectCandidateTeam(questId, teamId, idempotencyKey),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId, variables.viewerId),
  });
}

export function useLeaveCandidateTeamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      teamId,
      idempotencyKey,
    }: {
      questId: string;
      teamId: string;
      viewerId?: string;
      idempotencyKey?: string;
    }) => liveQuestService.leaveCandidateTeam(questId, teamId, idempotencyKey),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId, variables.viewerId),
  });
}

export function useRemoveCandidateTeamMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      teamId,
      memberId,
      idempotencyKey,
    }: {
      questId: string;
      teamId: string;
      memberId: string;
      viewerId?: string;
      idempotencyKey?: string;
    }) =>
      liveQuestService.removeCandidateTeamMember(
        questId,
        teamId,
        memberId,
        idempotencyKey
      ),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId, variables.viewerId),
  });
}

export function useRegenerateCandidateTeamCodeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      teamId,
      idempotencyKey,
    }: {
      questId: string;
      teamId: string;
      viewerId?: string;
      idempotencyKey?: string;
    }) =>
      liveQuestService.regenerateCandidateTeamJoinCode(
        questId,
        teamId,
        idempotencyKey
      ),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId, variables.viewerId),
  });
}

export function useUpdateCandidateTeamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      teamId,
      payload,
      idempotencyKey,
    }: {
      questId: string;
      teamId: string;
      payload: { name: string };
      viewerId?: string;
      idempotencyKey?: string;
    }) =>
      liveQuestService.updateCandidateTeam(
        questId,
        teamId,
        payload,
        idempotencyKey
      ),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId, variables.viewerId),
  });
}

export function useSubmitCandidateTeamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      teamId,
      payload,
      idempotencyKey,
    }: {
      questId: string;
      teamId: string;
      payload?: { text?: string; fileIds?: string[] };
      viewerId?: string;
      idempotencyKey?: string;
    }) =>
      liveQuestService.submitCandidateTeam(
        questId,
        teamId,
        payload ?? {},
        idempotencyKey
      ),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId, variables.viewerId),
  });
}

export function useUploadCandidateTeamFileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      teamId,
      asset,
      idempotencyKey,
    }: {
      questId: string;
      teamId: string;
      asset: UploadAsset;
      viewerId?: string;
      idempotencyKey?: string;
    }) =>
      liveQuestService.uploadCandidateTeamFile(
        questId,
        teamId,
        asset,
        idempotencyKey
      ),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId, variables.viewerId),
  });
}

export function useDecideUnderfilledMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      decision,
      idempotencyKey,
    }: {
      questId: string;
      decision: "PROCEED" | "CANCEL";
      viewerId?: string;
      idempotencyKey?: string;
    }) => liveQuestService.decideUnderfilled(questId, decision, idempotencyKey),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId, variables.viewerId),
  });
}

export function useRespondUnderfilledConsentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      decision,
      idempotencyKey,
    }: {
      questId: string;
      decision: "ACCEPT" | "DECLINE";
      viewerId?: string;
      idempotencyKey?: string;
    }) =>
      liveQuestService.respondUnderfilledConsent(
        questId,
        decision,
        idempotencyKey
      ),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId, variables.viewerId),
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
      idempotencyKey?: string;
    }) => liveQuestService.publishQuest(questId, idempotencyKey),
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
      idempotencyKey?: string;
    }) => liveQuestService.cancelQuest(questId, idempotencyKey),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId),
  });
}

export function useFileDisputeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      reason,
      statement,
    }: {
      questId: string;
      viewerId: string;
      reason: DisputeReason;
      statement: string;
    }) => disputeApi.fileDispute(questId, { reason, statement }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: questBoardKeys.liveSnapshot(
          variables.questId,
          variables.viewerId
        ),
      });
      void queryClient.invalidateQueries({
        queryKey: questBoardKeys.detail(variables.questId),
      });
    },
  });
}

export function useProofDraftMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      proofSubmissionId,
      payload,
      idempotencyKey,
    }: {
      questId: string;
      proofSubmissionId: string;
      payload:
        | QuestV2ProofUpdatePayload
        | QuestV2ProofRetryPayload
        | QuestV2ProofFileUploadPayload;
      viewerId?: string;
      idempotencyKey?: string;
    }) =>
      liveQuestService.updateProofDraft(
        questId,
        proofSubmissionId,
        payload,
        idempotencyKey
      ),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId, variables.viewerId),
  });
}

export function useCreateProofDraftMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      payload,
      idempotencyKey,
    }: {
      questId: string;
      payload:
        | QuestV2ProofCreatePayload
        | { assets: { uri: string }[]; description?: string };
      viewerId?: string;
      idempotencyKey?: string;
    }) => liveQuestService.createProofDraft(questId, payload, idempotencyKey),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId, variables.viewerId),
  });
}

export function useSubmitProofDraftMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      proofSubmissionId,
      idempotencyKey,
    }: {
      questId: string;
      proofSubmissionId: string;
      viewerId?: string;
      idempotencyKey?: string;
    }) =>
      liveQuestService.submitProofDraft(
        questId,
        proofSubmissionId,
        idempotencyKey
      ),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId, variables.viewerId),
  });
}

export function useReviewProofMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      proofSubmissionId,
      payload,
      idempotencyKey,
    }: {
      questId: string;
      proofSubmissionId: string;
      payload: QuestV2ProofReviewPayload;
      viewerId?: string;
      idempotencyKey?: string;
    }) =>
      liveQuestService.reviewProof(
        questId,
        proofSubmissionId,
        payload,
        idempotencyKey
      ),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId, variables.viewerId),
  });
}

export function useCreateReviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      input,
      idempotencyKey,
    }: {
      questId: string;
      input: QuestV2ReviewPayload;
      viewerId?: string;
      idempotencyKey?: string;
    }) => liveQuestService.createReview(questId, input, idempotencyKey),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId, variables.viewerId),
  });
}

export function useCreateEditRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      payload,
      idempotencyKey,
    }: {
      questId: string;
      payload: QuestV2CreateEditRequestPayload;
      viewerId?: string;
      idempotencyKey?: string;
    }) => liveQuestService.createEditRequest(questId, payload, idempotencyKey),
    onSuccess: (_, variables) =>
      invalidateQuestReads(queryClient, variables.questId, variables.viewerId),
  });
}
