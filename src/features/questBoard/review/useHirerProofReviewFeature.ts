import { useMemo, useState } from "react";

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

import { isTerminalStatus } from "@/domain/questLifecycle";
import { QuestProofStatus } from "../domain/types";
import { projectProofReviewRows } from "./proofReviewRows";

export function useHirerProofReviewFeature(questId?: string) {
  const viewerId = useSessionQuery().data?.user.id || null;
  const snapshotQuery = useLiveQuestSnapshotQuery(questId ?? null, viewerId);
  const reviewProofMutation = useReviewProofMutation();
  const snapshot = snapshotQuery.data;
  const [selectedProofId, setSelectedProofId] = useState<string | null>(null);
  const [decided, setDecided] = useState(false);

  const rows = useMemo(
    () => (snapshot ? projectProofReviewRows(snapshot) : []),
    [snapshot]
  );
  const pendingCount = rows.filter(
    (row) => row.proof?.status === QuestProofStatus.PROOF_PENDING
  ).length;
  const canReview = Boolean(snapshot?.capabilities.canReviewProof);
  const selectedProof = canReview
    ? snapshot?.proofs.find((proof) => proof.id === selectedProofId)
    : undefined;
  const proofFileLinksQuery = useProofFileLinksQuery(
    questId ?? null,
    viewerId,
    selectedProof
  );
  const proofForReview =
    selectedProof && proofFileLinksQuery.isSuccess
      ? {
          ...selectedProof,
          files: selectedProof.files.map((file) => ({
            ...file,
            url:
              proofFileLinksQuery.data.find(
                (fileLink) => fileLink.fileId === file.fileId
              )?.url ?? null,
          })),
        }
      : undefined;

  const review = async (payload: QuestV2ProofReviewPayload) => {
    if (!questId || !selectedProof) return false;
    try {
      await reviewProofMutation.mutateAsync({
        questId,
        proofSubmissionId: selectedProof.id,
        payload,
        viewerId: viewerId ?? undefined,
        idempotencyKey: createQuestIdempotencyKey(),
      });
      setDecided(true);
      return true;
    } catch (caught) {
      // Another device may have decided first; show the Server's current state.
      await snapshotQuery.refetch();
      throw caught;
    }
  };

  return {
    canReview,
    closeProof: () => setSelectedProofId(null),
    // A decision can end the Quest; once it is Terminal, offer the Rating
    // Review (rating-review-contract.md). GROUP Quests wait for every decision.
    ratingReviewQuestId:
      decided &&
      !proofForReview &&
      isTerminalStatus(snapshot?.state) &&
      snapshot?.capabilities.canCreateReview
        ? (questId ?? null)
        : null,
    closeRatingReview: () => setDecided(false),
    openProof: setSelectedProofId,
    pendingCount,
    proofFileLinksQuery,
    proofForReview,
    review,
    rows,
    selectedProof,
    snapshot,
    snapshotQuery,
  };
}
