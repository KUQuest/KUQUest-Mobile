import { useEffect } from "react";

import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { ApiError } from "@/api/ApiClient";
import { questApi } from "@/api/QuestApi";
import type { UploadAsset } from "@/api/fileUpload";
import {
  conductReportApi,
  type ConductReportInput,
} from "@/api/ConductReportApi";
import { disputeApi } from "@/api/DisputeApi";
import type {
  QuestV2CreateEditRequestPayload,
  QuestV2ProofReviewPayload,
  QuestV2ReviewPayload,
} from "@/api/QuestApi";
import {
  questV2ProofFileStatusSchema,
  type QuestV2ProofSubmission,
  type QuestV2TeamFileLink,
} from "@/api/questV2Contracts";
import { homeKeys } from "@/features/home/api/homeQueries";
import { myQuestsKeys } from "@/features/myQuests/api/myQuestsQueries";
import { profileKeys } from "@/features/profile/api/profileQueries";
import { invalidateWalletQueries } from "@/features/wallet/api/walletQueries";
import { workerHomeKeys } from "@/features/workerHome/api/workerHomeKeys";
import {
  subscribeToCandidateRosterEvents,
  subscribeToQuestBoardEvents,
  subscribeToQuestEvents,
} from "../live/questEvents";
import {
  liveQuestService,
  type LiveQuestSnapshot,
  type LiveQuestSnapshotOptions,
} from "../live/liveQuestService";
import {
  QuestActor,
  QuestEditRequestStatus,
  QuestEditResponseDecision,
  QuestMode,
  QuestUnderfilledConsentDecision,
  QuestUnderfilledDecision,
} from "../domain/types";

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
  myDisputeCase: (questId: string, viewerId: string) =>
    [...questBoardKeys.all, "my-dispute-case", questId, viewerId] as const,
  disputeFiling: () => [...questBoardKeys.all, "dispute-filing"] as const,
  conductReports: (questId: string, viewerId: string) =>
    [...questBoardKeys.all, "conduct-reports", questId, viewerId] as const,
  editRequestId: (questId: string) =>
    [...questBoardKeys.all, "edit-request-id", questId] as const,
  reviewsScope: (questId: string) =>
    [...questBoardKeys.all, "reviews", questId] as const,
  reviews: (questId: string, viewerId: string) =>
    [...questBoardKeys.reviewsScope(questId), viewerId] as const,
  candidateTeamFileLinks: (
    questId: string,
    viewerId: string,
    teamId: string,
    fileIds: readonly string[]
  ) =>
    [
      ...questBoardKeys.all,
      "candidate-team-file-links",
      questId,
      viewerId,
      teamId,
      fileIds,
    ] as const,
};

export function setQuestEditRequestId(
  queryClient: QueryClient,
  questId: string,
  requestId: string | null
): void {
  queryClient.setQueryData(questBoardKeys.editRequestId(questId), requestId);
}

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
export function useCandidateTeamFileLinksQuery(
  questId: string | null,
  viewerId: string | null,
  teamId: string | null,
  fileIds: readonly string[],
  enabled: boolean
) {
  return useQuery({
    enabled: Boolean(
      enabled && questId && viewerId && teamId && fileIds.length > 0
    ),
    queryKey: questBoardKeys.candidateTeamFileLinks(
      questId ?? "",
      viewerId ?? "",
      teamId ?? "",
      fileIds
    ),
    queryFn: async ({ signal }): Promise<QuestV2TeamFileLink[]> => {
      if (!questId || !viewerId || !teamId) {
        throw new Error("A quest, viewer, and Candidate Team are required");
      }
      const fileLinks = await Promise.all(
        fileIds.map((fileId) =>
          liveQuestService.getCandidateTeamFileLink(questId, teamId, fileId, {
            signal,
          })
        )
      );
      if (
        fileLinks.some((fileLink, index) => fileLink.fileId !== fileIds[index])
      ) {
        throw new Error(
          "Candidate Team file endpoint returned a mismatched file"
        );
      }
      return fileLinks.sort((left, right) => left.position - right.position);
    },
    staleTime: 0,
  });
}

export function useQuestBoardQuery(enabled = true) {
  const queryClient = useQueryClient();
  const query = useQuery({
    enabled,
    queryKey: questBoardKeys.board(),
    queryFn: ({ signal }) => liveQuestService.listBoardQuests({ signal }),
  });
  const hasBoardSnapshot = query.data !== undefined;
  useEffect(() => {
    if (!enabled || !hasBoardSnapshot) return;
    const invalidateBoard = () => {
      void queryClient.invalidateQueries({
        queryKey: questBoardKeys.board(),
      });
    };
    return subscribeToQuestBoardEvents(invalidateBoard, invalidateBoard);
  }, [enabled, hasBoardSnapshot, queryClient]);
  return query;
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

  const cachedEditRequestId =
    useQuery<string | null>({
      queryKey: questBoardKeys.editRequestId(questId ?? ""),
      queryFn: skipToken,
      staleTime: Infinity,
      gcTime: 600_000,
    }).data ?? undefined;
  const editRequestId = options.editRequestId ?? cachedEditRequestId;
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
      editRequestId
    ),
    queryFn: ({ signal }) => {
      if (!questId || !viewerId) {
        throw new Error("A quest ID and viewer ID are required");
      }
      return liveQuestService.getLiveSnapshot(questId, viewerId, {
        ...options,
        editRequestId,
        signal,
      });
    },
  });
  useEffect(() => {
    if (
      !enabled ||
      !questId ||
      !viewerId ||
      options.editRequestId !== undefined ||
      !cachedEditRequestId ||
      !query.isSuccess ||
      query.isPlaceholderData ||
      query.isFetching
    ) {
      return;
    }
    const editRequest = query.data.editRequest;
    if (
      editRequest === null ||
      editRequest.status === QuestEditRequestStatus.EDIT_REQUEST_APPLIED ||
      editRequest.status === QuestEditRequestStatus.EDIT_REQUEST_FAILED
    ) {
      if (
        queryClient.getQueryData(questBoardKeys.editRequestId(questId)) ===
        cachedEditRequestId
      ) {
        setQuestEditRequestId(queryClient, questId, null);
      }
    }
  }, [
    cachedEditRequestId,
    enabled,
    options.editRequestId,
    query.data,
    query.isFetching,
    query.isPlaceholderData,
    query.isSuccess,
    queryClient,
    questId,
    viewerId,
  ]);
  // No WebSocket replay; cold-start recovery needs a backend field.
  useEffect(() => {
    if (!enabled || !questId || !viewerId) return;
    const invalidateSnapshot = () => {
      void queryClient.invalidateQueries({
        queryKey: questBoardKeys.liveSnapshotScope(questId, viewerId),
      });
    };
    return subscribeToQuestEvents(
      questId,
      (event) => {
        if (event.changeType === "QUEST_EDIT_UPDATED" && event.editRequestId) {
          setQuestEditRequestId(queryClient, questId, event.editRequestId);
        }
        invalidateSnapshot();
      },
      invalidateSnapshot
    );
  }, [enabled, queryClient, questId, viewerId]);
  const canReadCandidateRoster = Boolean(
    query.data?.mode === QuestMode.CANDIDATE &&
    (query.data.team != null ||
      (query.data.actor === QuestActor.HIRER &&
        (query.data.capabilities.canSelectCandidate ||
          query.data.capabilities.canSelectTeam)))
  );
  useEffect(() => {
    if (!enabled || !questId || !viewerId || !canReadCandidateRoster) {
      return;
    }
    const invalidateSnapshot = () => {
      void queryClient.invalidateQueries({
        queryKey: questBoardKeys.liveSnapshotScope(questId, viewerId),
      });
    };
    return subscribeToCandidateRosterEvents(
      questId,
      invalidateSnapshot,
      invalidateSnapshot
    );
  }, [canReadCandidateRoster, enabled, queryClient, questId, viewerId]);
  return query;
}

export type QuestReadProjection = "hirer" | "worker";

export async function invalidateWorkerQuestReads(
  queryClient: QueryClient,
  questId: string,
  viewerId: string
): Promise<void> {
  await Promise.all(
    [
      questBoardKeys.detail(questId),
      questBoardKeys.board(),
      questBoardKeys.liveSnapshotScope(questId, viewerId),
      workerHomeKeys.assignments("active"),
      workerHomeKeys.assignments("all"),
      workerHomeKeys.participationDetail(questId),
      workerHomeKeys.liveSnapshot(questId, viewerId),
      myQuestsKeys.worker(viewerId),
    ].map((queryKey) => queryClient.invalidateQueries({ queryKey }))
  );
}

export async function invalidateQuestReads(
  queryClient: QueryClient,
  questId: string,
  viewerId?: string,
  projection?: QuestReadProjection
): Promise<void> {
  if (projection === "worker" && viewerId) {
    return invalidateWorkerQuestReads(queryClient, questId, viewerId);
  }
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
      teamId?: string;
      joinCode: string;
      viewerId?: string;
      idempotencyKey?: string;
    }) =>
      teamId
        ? liveQuestService.joinCandidateTeam(
            questId,
            teamId,
            joinCode,
            idempotencyKey
          )
        : liveQuestService.joinCandidateTeamByCode(
            questId,
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
      decision: QuestUnderfilledDecision;
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
      decision: QuestUnderfilledConsentDecision;
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
      previewVersion,
    }: {
      questId: string;
      viewerId?: string;
      idempotencyKey?: string;
      previewVersion?: string;
    }) => liveQuestService.cancelQuest(questId, idempotencyKey, previewVersion),
    onSuccess: async (_, variables) => {
      await Promise.all([
        invalidateQuestReads(
          queryClient,
          variables.questId,
          variables.viewerId,
          "hirer"
        ),
        variables.viewerId
          ? invalidateQuestReads(
              queryClient,
              variables.questId,
              variables.viewerId,
              "worker"
            )
          : Promise.resolve(),
        invalidateWalletQueries(queryClient),
      ]);
    },
  });
}
export function useMyDisputeCaseQuery(
  questId: string | null,
  viewerId: string | null,
  enabled = true
) {
  return useQuery({
    enabled: Boolean(questId && viewerId) && enabled,
    queryKey: questBoardKeys.myDisputeCase(questId ?? "", viewerId ?? ""),
    queryFn: ({ signal }) => {
      if (!questId) throw new Error("Quest ID is required");
      return disputeApi.getMyDisputeCase(questId, signal);
    },
  });
}

export function useFileDisputeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: questBoardKeys.disputeFiling(),
    mutationFn: ({ questId }: { questId: string; viewerId: string }) =>
      disputeApi.fileDispute(questId),
    onSuccess: async (filedCase, variables) => {
      queryClient.setQueryData(
        questBoardKeys.myDisputeCase(variables.questId, variables.viewerId),
        { case: filedCase }
      );
      await invalidateQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId
      );
    },
    onError: async (error, variables) => {
      if (error instanceof ApiError && error.status === 409) {
        await queryClient.invalidateQueries({
          queryKey: questBoardKeys.myDisputeCase(
            variables.questId,
            variables.viewerId
          ),
        });
      }
    },
  });
}

export function useConductReportsQuery(
  questId: string | null,
  viewerId: string | null,
  enabled = true
) {
  return useQuery({
    enabled: Boolean(questId && viewerId) && enabled,
    queryKey: questBoardKeys.conductReports(questId ?? "", viewerId ?? ""),
    queryFn: ({ signal }) => {
      if (!questId) throw new Error("Quest ID is required");
      return conductReportApi.getConductReports(questId, signal);
    },
  });
}

export function useFileConductReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      input,
      idempotencyKey,
    }: {
      questId: string;
      viewerId: string;
      input: ConductReportInput;
      idempotencyKey: string;
    }) => conductReportApi.fileConductReport(questId, input, idempotencyKey),
    onSettled: (_report, _error, variables) =>
      queryClient.invalidateQueries({
        queryKey: questBoardKeys.conductReports(
          variables.questId,
          variables.viewerId
        ),
      }),
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
    onSuccess: async (_, variables) => {
      await invalidateQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId,
        "hirer"
      );
      await invalidateWalletQueries(queryClient);
    },
  });
}

function invalidateReviewReads(
  queryClient: QueryClient,
  questId: string,
  viewerId: string | undefined,
  revieweeId: string | undefined
): Promise<unknown[]> {
  const tasks = [
    queryClient.invalidateQueries({
      queryKey: questBoardKeys.reviewsScope(questId),
    }),
    invalidateQuestReads(queryClient, questId, viewerId, "hirer"),
  ];
  if (viewerId) {
    tasks.push(invalidateWorkerQuestReads(queryClient, questId, viewerId));
  }
  if (revieweeId) {
    tasks.push(
      queryClient.invalidateQueries({
        queryKey: profileKeys.public(revieweeId),
      }),
      queryClient.invalidateQueries({
        queryKey: profileKeys.publicReviews(revieweeId),
      })
    );
  } else {
    tasks.push(
      queryClient.invalidateQueries({
        queryKey: [...profileKeys.all, "public"],
      }),
      queryClient.invalidateQueries({
        queryKey: [...profileKeys.all, "public-reviews"],
      })
    );
  }
  return Promise.all(tasks);
}

export function useQuestReviewsQuery(
  questId: string | null,
  viewerId: string | null
) {
  return useQuery({
    queryKey: questBoardKeys.reviews(questId ?? "", viewerId ?? ""),
    queryFn: () => {
      if (!questId || !viewerId) {
        throw new Error("A quest and viewer are required");
      }
      return liveQuestService.listQuestReviews(questId, viewerId);
    },
    enabled: Boolean(questId && viewerId),
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
      invalidateReviewReads(
        queryClient,
        variables.questId,
        variables.viewerId,
        variables.input.revieweeId
      ),
  });
}

export function useUpdateReviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      reviewId,
      input,
      idempotencyKey,
    }: {
      questId: string;
      viewerId: string;
      reviewId: string;
      revieweeId?: string;
      input: { rating: number; comment?: string };
      idempotencyKey?: string;
    }) =>
      liveQuestService.updateReview(questId, reviewId, input, idempotencyKey),
    onSuccess: (_, variables) =>
      invalidateReviewReads(
        queryClient,
        variables.questId,
        variables.viewerId,
        variables.revieweeId
      ),
  });
}

export function useStartWorkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      idempotencyKey,
    }: {
      questId: string;
      viewerId: string;
      idempotencyKey: string;
    }) => liveQuestService.startWork(questId, idempotencyKey),
    onSuccess: (_, variables) =>
      invalidateWorkerQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId
      ),
  });
}

export function useRespondToEditMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      decision,
      idempotencyKey,
    }: {
      questId: string;
      viewerId: string;
      requestId: string;
      decision: QuestEditResponseDecision;
      idempotencyKey?: string;
    }) =>
      liveQuestService.respondToEditRequest(
        requestId,
        { decision },
        idempotencyKey
      ),
    onSuccess: (_, variables) =>
      invalidateWorkerQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId
      ),
  });
}

export function useConfirmCompletionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      idempotencyKey,
    }: {
      questId: string;
      viewerId: string;
      idempotencyKey?: string;
    }) => liveQuestService.confirmCompletion(questId, idempotencyKey),
    onSuccess: async (_, variables) => {
      await invalidateWorkerQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId
      );
      await invalidateWalletQueries(queryClient);
    },
  });
}
export function useSubmitTeamRewardAllocationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      teammateShares,
      idempotencyKey,
    }: {
      questId: string;
      viewerId: string;
      teammateShares: {
        memberId: string;
        percentageBasisPoints: number;
      }[];
      idempotencyKey: string;
    }) =>
      questApi.submitTeamRewardAllocation(
        questId,
        teammateShares,
        idempotencyKey
      ),
    onSuccess: async (_, variables) => {
      await invalidateWorkerQuestReads(
        queryClient,
        variables.questId,
        variables.viewerId
      );
      await invalidateWalletQueries(queryClient);
    },
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
