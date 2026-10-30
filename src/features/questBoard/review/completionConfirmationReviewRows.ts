import type { QuestV2CompletionConfirmation } from "@/api/questV2Contracts";
import type { LiveQuestSnapshot } from "../live/liveQuestTypes";
import { QuestCompletionConfirmationStatus } from "../domain/types";

export interface CompletionConfirmationReviewRow {
  confirmation: QuestV2CompletionConfirmation;
  key: string;
  kind: "team" | "worker";
  name?: string;
}

export function projectCompletionConfirmationReviewRows(
  snapshot: LiveQuestSnapshot
): CompletionConfirmationReviewRow[] {
  const participantNames = new Map(
    (snapshot.participants ?? []).map((participant) => [
      participant.id,
      participant.displayName,
    ])
  );
  return (snapshot.completionConfirmations ?? [])
    .map((confirmation) => ({
      confirmation,
      key: confirmation.id,
      kind: confirmation.teamId ? ("team" as const) : ("worker" as const),
      name: confirmation.teamId
        ? snapshot.teams.find((team) => team.id === confirmation.teamId)?.name
        : confirmation.workerId
          ? participantNames.get(confirmation.workerId)
          : undefined,
    }))
    .sort((left, right) => {
      const leftPending =
        left.confirmation.reviewStatus ===
        QuestCompletionConfirmationStatus.COMPLETION_CONFIRMATION_PENDING;
      const rightPending =
        right.confirmation.reviewStatus ===
        QuestCompletionConfirmationStatus.COMPLETION_CONFIRMATION_PENDING;
      if (leftPending !== rightPending) return leftPending ? -1 : 1;
      return right.confirmation.confirmedAt.localeCompare(
        left.confirmation.confirmedAt
      );
    });
}
