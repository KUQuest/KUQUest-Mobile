import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/api/ApiClient";
import { createQuestIdempotencyKey } from "@/api/QuestApi";
import type { UploadAsset } from "@/api/fileUpload";
import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";
import { liveQuestService } from "@/features/questBoard/live/liveQuestService";
import { myQuestsKeys } from "@/features/myQuests/api/myQuestsQueries";
import { workerHomeKeys } from "@/features/workerHome/api/workerHomeKeys";
import type { ProofSendPlan } from "../proofDraftPlan";
import { QuestProofFileStatus } from "@/features/questBoard/domain/types";

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

// Staging also returns this for images above an undocumented resolution limit.
const PROOF_FILE_REJECTED_CODE = "PROOF_FILE_TYPE_NOT_SUPPORTED";

/**
 * A draft that still holds a failed file cannot be submitted.
 * `rejected` means the server refused a file's content, not a transient
 * upload failure. `draft` is the server draft when one exists.
 */
export class ProofFileUploadError extends Error {
  constructor(
    readonly failedCount: number,
    readonly rejected = false,
    readonly draft: QuestV2ProofSubmission | null = null
  ) {
    super(`${failedCount} proof file(s) failed to upload`);
    this.name = "ProofFileUploadError";
  }
}

function toUploadAsset({ uri, name, type }: UploadAsset): UploadAsset {
  return { uri, name, type };
}

function asRejectedUpload(fileCount: number) {
  return (error: unknown): never => {
    throw error instanceof ApiError && error.code === PROOF_FILE_REJECTED_CODE
      ? new ProofFileUploadError(fileCount, true)
      : error;
  };
}

async function uploadProofDraft(
  questId: string,
  plan: ProofSendPlan<UploadAsset & { key: string }>,
  description: string | undefined
): Promise<QuestV2ProofSubmission> {
  if (plan.kind === "create") {
    if (plan.replaceDraftId) {
      await liveQuestService.deleteProofDraft(
        questId,
        plan.replaceDraftId,
        createQuestIdempotencyKey()
      );
    }
    return liveQuestService
      .createProofDraft(
        questId,
        { assets: plan.files.map(toUploadAsset), description },
        createQuestIdempotencyKey()
      )
      .catch(asRejectedUpload(plan.files.length));
  }
  let draft: QuestV2ProofSubmission | null = null;
  for (const { position, file } of plan.retries) {
    draft = await liveQuestService
      .updateProofDraft(
        questId,
        plan.draftId,
        {
          assets: [toUploadAsset(file)],
          retryPosition: position,
          description,
        },
        createQuestIdempotencyKey()
      )
      .catch(asRejectedUpload(1));
  }
  if (!draft) throw new Error("Proof retry requires at least one file");
  return draft;
}

export function useSubmitProofMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      questId,
      plan,
      description,
    }: WorkerMutationInput & {
      plan: ProofSendPlan<UploadAsset & { key: string }>;
      description?: string;
    }) => {
      const proofDraft = await uploadProofDraft(questId, plan, description);
      const failedFiles = proofDraft.files.filter(
        (file) => file.uploadStatus === QuestProofFileStatus.PROOF_FILE_FAILED
      );
      if (failedFiles.length > 0) {
        throw new ProofFileUploadError(
          failedFiles.length,
          failedFiles.some(
            (file) => file.failureCode === PROOF_FILE_REJECTED_CODE
          ),
          proofDraft
        );
      }
      const readyFileCount = proofDraft.files.filter(
        (file) =>
          file.uploadStatus === QuestProofFileStatus.PROOF_FILE_READY &&
          file.fileId !== null
      ).length;
      if (readyFileCount === 0) {
        throw new Error("At least one proof file must be ready before sending");
      }
      return liveQuestService.submitProofDraft(
        questId,
        proofDraft.id,
        createQuestIdempotencyKey()
      );
    },
    onSettled: (_data, _error, variables) => {
      invalidateWorkerState(queryClient, variables);
    },
  });
}
