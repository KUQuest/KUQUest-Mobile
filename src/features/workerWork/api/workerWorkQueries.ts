import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";

import { createQuestIdempotencyKey } from "@/api/QuestApi";
import type { UploadAsset } from "@/api/fileUpload";
import { liveQuestService } from "@/features/questBoard/live/liveQuestService";
import { myQuestsKeys } from "@/features/myQuests/api/myQuestsQueries";
import { workerHomeKeys } from "@/features/workerHome/api/workerHomeKeys";

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

/** A sent draft that still holds a failed file cannot be submitted. */
export class ProofFileUploadError extends Error {
  constructor(readonly failedCount: number) {
    super(`${failedCount} proof file(s) failed to upload`);
    this.name = "ProofFileUploadError";
  }
}

export function useSubmitProofMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      questId,
      assets,
      description,
    }: WorkerMutationInput & {
      assets: UploadAsset[];
      description?: string;
    }) => {
      if (assets.length === 0) {
        throw new Error("At least one proof file is required");
      }
      const proofDraft = await liveQuestService.createProofDraft(
        questId,
        { assets, description },
        createQuestIdempotencyKey()
      );
      const failedCount = proofDraft.files.filter(
        (file) => file.uploadStatus === "PROOF_FILE_FAILED"
      ).length;
      const readyFileCount = proofDraft.files.filter(
        (file) =>
          file.uploadStatus === "PROOF_FILE_READY" && file.fileId !== null
      ).length;
      if (failedCount > 0) {
        throw new ProofFileUploadError(failedCount);
      }
      if (readyFileCount === 0) {
        throw new Error("At least one proof file must be ready before sending");
      }
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
