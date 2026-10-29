import type {
  QuestV2Mode,
  QuestV2Participation,
  QuestV2ProofSubmission,
  QuestV2Team,
} from "@/api/questV2Contracts";

export interface ProofOwnershipScope {
  viewerId: string;
  mode: QuestV2Mode;
  participation: QuestV2Participation;
  team: Pick<QuestV2Team, "id"> | null;
}

/**
 * Whether a Proof Submission belongs to the viewer's Assignment.
 *
 * - SINGLE and GROUP + FIRST_COME_FIRST_SERVED: the submitting Worker owns the
 *   proof (`workerId` or `submittedByUserId`). No Candidate Team exists.
 * - GROUP + CANDIDATE: the Team Leader submits one proof for the whole Team
 *   (`teamId`), so every Team member's Assignment matches by Team id.
 *
 * Team ids are only compared for CANDIDATE + GROUP, which is the only mode
 * where the server issues a Candidate Team (quest-mode-matrix Quadrant 4).
 *
 * Pure: the caller supplies the snapshot's mode, participation, and Team.
 */
export function isOwnProofSubmission(
  proof: QuestV2ProofSubmission,
  scope: ProofOwnershipScope
): boolean {
  const teamId =
    scope.mode === "CANDIDATE" && scope.participation === "GROUP"
      ? scope.team?.id
      : undefined;
  return (
    proof.submittedByUserId === scope.viewerId ||
    proof.workerId === scope.viewerId ||
    (teamId !== undefined && proof.teamId === teamId)
  );
}
