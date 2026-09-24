import { useEffect } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient, QueryKey } from "@tanstack/react-query";

import type { UploadAsset } from "@/api/fileUpload";
import { disputeApi, type DisputeReason } from "@/api/DisputeApi";
import type {
  QuestV2CreateEditRequestPayload,
  QuestV2ProofReviewPayload,
  QuestV2ReviewPayload,
} from "@/api/QuestApi";
import {
  questV2ProofFileStatusSchema,
  type QuestV2ProofSubmission,
} from "@/api/questV2Contracts";
import { homeKeys } from "@/features/home/api/homeQueries";
import { myQuestsKeys } from "@/features/myQuests/api/myQuestsQueries";
import { workerHomeKeys } from "@/features/workerHome/api/workerHomeKeys";
import {
  subscribeToCandidateRosterEvents,
  subscribeToQuestEvents,
} from "../live/questEvents";
import {
  liveQuestService,
  type LiveQuestSnapshot,
  type LiveQuestSnapshotOptions,
} from "../live/liveQuestService";

export const questBoardKeys = {
  all: ["questBoard"] as const,
  board: () => [...questBoardKeys.all, "board"] as const,
  detail: (questId: string) =>
    [...questBoardKeys.all, "detail", questId] as const,
  liveSnapshotScope: (questId: string, viewerId: string) =>
    [...questBoardKeys.all, "live-snapshot", questId, viewerId] as const,
  liveSnapshot: (questId: string, viewerId: string, editRequestId?: string) =>
    [
      ...questBoardKeys.liveSnapshotScope(questId, viewerId),
      editRequestId ?? null,
    ] as const,
  assignments: (questId: string, viewerId: string) =>
    [...questBoardKeys.all, "assignments", questId, viewerId] as const,
};

export function useProofFileLinksQuery(
  questId: string | null,
  viewerId: string | null,
  proof: QuestV2ProofSubmission | undefined
) {
  const fileIds =
    proof?.files.flatMap((file) =>
      file.fileId !== null &&
      file.uploadStatus === questV2ProofFileStatusSchema.enum.PROOF_FILE_READY
        ? [file.fileId]
        : []
    ) ?? [];

  return useQuery({
    enabled: Boolean(questId && viewerId && proof),
    queryKey: [
      ...questBoardKeys.all,
      "proof-file-links",
      questId ?? "",
      viewerId ?? "",
      proof?.id ?? "",
      fileIds,
    ],
    queryFn: async ({ signal }) => {
      if (!questId || !proof) {
        throw new Error("A quest and proof submission are required");
      }
      const fileLinks = await Promise.all(
        fileIds.map((fileId) =>
          liveQuestService.getProofFileLink(questId, proof.id, fileId, {
            signal,
          })
        )
      );
      if (
        fileLinks.some((fileLink, index) => fileLink.fileId !== fileIds[index])
      ) {
        throw new Error("Proof file endpoint returned a mismatched file");
      }
      return fileLinks;
    },
    staleTime: 0,
  });
}

export function useQuestBoardQuery(enabled = true) {
  return useQuery({
    enabled,
    queryKey: questBoardKeys.board(),
    queryFn: ({ signal }) => liveQuestService.listBoardQuests({ signal }),
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

/** Assignments the viewer may read; a Hirer receives every Worker's. */
export function useQuestAssignmentsQuery(
  questId: string | null,
  viewerId: string | null
) {
  return useQuery({
    enabled: Boolean(questId && viewerId),
    queryKey: questBoardKeys.assignments(questId ?? "", viewerId ?? ""),
    queryFn: ({ signal }) => {
      if (!questId) throw new Error("A quest ID is required");
      return liveQuestService.listQuestAssignments(questId, { signal });
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
  const queryClient = useQueryClient();
  const query = useQuery<LiveQuestSnapshot>({
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
  const canReadQuest = query.data !== undefined;
  useEffect(() => {
    if (!enabled || !questId || !viewerId || !canReadQuest) return;
    return subscribeToQuestEvents(questId, () => {
      void queryClient.invalidateQueries({
        queryKey: questBoardKeys.liveSnapshotScope(questId, viewerId),
      });
    });
  }, [canReadQuest, enabled, queryClient, questId, viewerId]);
  return query;
}

export function useCandidateRosterEvents(
  snapshot: LiveQuestSnapshot | undefined
): void {
  const queryClient = useQueryClient();
  const questId = snapshot?.quest.id;
  const viewerId = snapshot?.viewerId;
  const canSelectRoster =
    snapshot?.mode === "CANDIDATE" &&
    Boolean(
      snapshot.capabilities.canSelectCandidate ||
      snapshot.capabilities.canSelectTeam
    );

  useEffect(() => {
    if (!questId || !viewerId || !canSelectRoster) return;
    return subscribeToCandidateRosterEvents(questId, () => {
      void queryClient.invalidateQueries({
        queryKey: questBoardKeys.liveSnapshotScope(questId, viewerId),
      });
    });
  }, [canSelectRoster, queryClient, questId, viewerId]);
}

type QuestReadProjection = "hirer" | "worker";

async function invalidateQuestReads(
  queryClient: QueryClient,
  questId: string,
  viewerId?: string,
  projection?: QuestReadProjection
): Promise<void> {
  const queryKeys: QueryKey[] = [
    questBoardKeys.detail(questId),
    questBoardKeys.board(),
  ];
  if (viewerId) {
    queryKeys.push(questBoardKeys.liveSnapshotScope(questId, viewerId));
  }
  if (projection === "hirer") {
    queryKeys.push(homeKeys.hirer(), myQuestsKeys.hirer());
  }
  if (projection === "worker" && viewerId) {
    queryKeys.push(
      workerHomeKeys.assignments("active"),
      workerHomeKeys.assignments("all"),
      workerHomeKeys.participationDetail(questId),
      workerHomeKeys.liveSnapshot(questId, viewerId),
      myQuestsKeys.worker(viewerId)
    );
  }
  await Promise.all(
    queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))
  );
}

export function useJoinQuestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questId }: { questId: string; viewerId?: string }) =>
      liveQuestService.joinQuest(questId),
    onSuccess: (_, variables) =>
      invalidateQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId,
        "worker"
      ),
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
      invalidateQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId,
        "worker"
      ),
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
      invalidateQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId,
        "worker"
      ),
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
      invalidateQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId,
        "hirer"
      ),
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
      invalidateQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId,
        "hirer"
      ),
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
      invalidateQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId,
        "worker"
      ),
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
      invalidateQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId,
        "worker"
      ),
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
      invalidateQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId,
        "hirer"
      ),
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
      invalidateQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId,
        "hirer"
      ),
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
      invalidateQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId,
        "worker"
      ),
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
      invalidateQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId,
        "worker"
      ),
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
      invalidateQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId,
        "worker"
      ),
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
      invalidateQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId,
        "worker"
      ),
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
      invalidateQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId,
        "worker"
      ),
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
      invalidateQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId,
        "worker"
      ),
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
      invalidateQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId,
        "hirer"
      ),
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
      invalidateQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId,
        "worker"
      ),
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
      viewerId?: string;
      idempotencyKey?: string;
    }) => liveQuestService.cancelQuest(questId, idempotencyKey),
    onSuccess: (_, variables) =>
      invalidateQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId,
        "hirer"
      ),
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
      invalidateQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId,
        "hirer"
      ),
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
      Promise.all([
        invalidateQuestReads(
          queryClient,
          variables.questId,
          variables.viewerId,
          "hirer"
        ),
        invalidateQuestReads(
          queryClient,
          variables.questId,
          variables.viewerId,
          "worker"
        ),
      ]),
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
      invalidateQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId,
        "hirer"
      ),
  });
}
