import {
  createQuestIdempotencyKey,
  type QuestV2ProofReviewPayload,
} from "@/api/QuestApi";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import {
  useLiveQuestSnapshotQuery,
  useProofFileLinksQuery,
  useReviewProofMutation,
} from "@/features/questBoard/api/questBoardQueries";

import { QuestProofStatus } from "../domain/types";

export function useHirerProofReviewFeature(questId?: string) {
  const viewerId = useSessionQuery().data?.user.id || null;
  const snapshotQuery = useLiveQuestSnapshotQuery(questId ?? null, viewerId);
  const reviewProofMutation = useReviewProofMutation();
  const snapshot = snapshotQuery.data;
  const pendingProof = snapshot?.capabilities.canReviewProof
    ? snapshot.proofs.find(
        (proof) => proof.status === QuestProofStatus.PROOF_PENDING
      )
    : undefined;
  const proofFileLinksQuery = useProofFileLinksQuery(
    questId ?? null,
    viewerId,
    pendingProof
  );
  const proofForReview =
    pendingProof && proofFileLinksQuery.isSuccess
      ? {
          ...pendingProof,
          files: pendingProof.files.map((file) => ({
            ...file,
            url:
              proofFileLinksQuery.data.find(
                (fileLink) => fileLink.fileId === file.fileId
              )?.url ?? null,
          })),
        }
      : undefined;

  const review = async (payload: QuestV2ProofReviewPayload) => {
    if (!questId || !pendingProof) return false;
    try {
      await reviewProofMutation.mutateAsync({
        questId,
        proofSubmissionId: pendingProof.id,
        payload,
        viewerId: viewerId ?? undefined,
        idempotencyKey: createQuestIdempotencyKey(),
      });
      return true;
    } catch (caught) {
      // A conflict means the Server state moved; reload before the retry.
      await snapshotQuery.refetch();
      throw caught;
    }
  };

  return {
    pendingProof,
    proofFileLinksQuery,
    proofForReview,
    review,
    snapshot,
    snapshotQuery,
  };
}
