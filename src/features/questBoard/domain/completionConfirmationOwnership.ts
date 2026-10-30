import type { QuestV2CompletionConfirmation } from "@/api/questV2Contracts";
import type { LiveQuestSnapshot } from "../live/liveQuestTypes";

/** Returns the role-filtered confirmation for the Worker's Assignment or Team. */
export function ownCompletionConfirmation(
  snapshot: LiveQuestSnapshot,
  viewerId = snapshot.viewerId
): QuestV2CompletionConfirmation | null {
  return (
    snapshot.completionConfirmations?.find(
      (confirmation) =>
        confirmation.confirmedByUserId === viewerId ||
        (snapshot.assignment &&
          confirmation.workerId === snapshot.assignment.workerId) ||
        (snapshot.team && confirmation.teamId === snapshot.team.id)
    ) ?? null
  );
}
