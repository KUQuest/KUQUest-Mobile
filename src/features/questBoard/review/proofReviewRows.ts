import {
  questV2AssignmentStateSchema,
  questV2ModeSchema,
  questV2ParticipationSchema,
  questV2ProofStatusSchema,
  questV2TeamStateSchema,
  type QuestV2ProofSubmission,
  type QuestV2Team,
} from "@/api/questV2Contracts";

import type { LiveQuestSnapshot } from "../live/liveQuestTypes";

/** One reviewable unit: a Worker's Assignment, or the selected Candidate Team. */
export type ProofReviewRow =
  | {
      kind: "worker";
      key: string;
      /** Undefined when the snapshot carries no participant profile (SINGLE). */
      name: string | undefined;
      proof: QuestV2ProofSubmission | null;
    }
  | {
      kind: "team";
      key: string;
      name: string | undefined;
      /** The Team Leader who submits the Team's Proof. */
      leaderName: string | undefined;
      proof: QuestV2ProofSubmission | null;
    };

type ProofReviewSource = Pick<
  LiveQuestSnapshot,
  "mode" | "participation" | "assignments" | "participants" | "teams" | "proofs"
>;

function rank(row: ProofReviewRow): number {
  if (row.proof?.status === questV2ProofStatusSchema.enum.PROOF_PENDING)
    return 0;
  return row.proof ? 2 : 1;
}

/**
 * Hirer review list grouped by Assignment with `PROOF_PENDING` first
 * (proof-submission-contract.md). `GROUP + CANDIDATE` yields the Team's single
 * submission; every other mode yields one row per Active Worker, including
 * Workers who have not sent a Proof Submission yet.
 */
export function projectProofReviewRows(
  source: ProofReviewSource
): ProofReviewRow[] {
  const names = new Map(
    (source.participants ?? []).map((participant) => [
      participant.id,
      participant.displayName,
    ])
  );
  // Drafts have no status and are visible only to their submitter.
  const sent = source.proofs.filter((proof) => proof.status !== null);

  let rows: ProofReviewRow[];
  if (
    source.participation === questV2ParticipationSchema.enum.GROUP &&
    source.mode === questV2ModeSchema.enum.CANDIDATE
  ) {
    const selectedTeam = source.teams.find(
      (team) => team.state === questV2TeamStateSchema.enum.TEAM_SELECTED
    );
    const teamRow = (
      team: QuestV2Team | undefined,
      proof: QuestV2ProofSubmission | null
    ): ProofReviewRow => {
      const leaderId = proof?.submittedByUserId ?? team?.leaderId;
      return {
        kind: "team",
        key: proof?.id ?? team?.id ?? "team",
        name: team?.name,
        leaderName: leaderId ? names.get(leaderId) : undefined,
        proof,
      };
    };
    rows =
      sent.length > 0
        ? sent.map((proof) =>
            teamRow(
              source.teams.find((team) => team.id === proof.teamId) ??
                selectedTeam,
              proof
            )
          )
        : selectedTeam
          ? [teamRow(selectedTeam, null)]
          : [];
  } else {
    const workerIds = new Set(
      source.assignments
        .filter(
          (assignment) =>
            assignment.state !==
            questV2AssignmentStateSchema.enum.ASSIGNMENT_CANCELLED
        )
        .map((assignment) => assignment.workerId)
    );
    // Keep a sent Proof visible even if its Assignment is missing from the list.
    for (const proof of sent) if (proof.workerId) workerIds.add(proof.workerId);
    rows = [...workerIds].map((workerId) => ({
      kind: "worker",
      key: workerId,
      name: names.get(workerId),
      proof: sent.find((proof) => proof.workerId === workerId) ?? null,
    }));
  }

  return rows.sort((a, b) => rank(a) - rank(b));
}
