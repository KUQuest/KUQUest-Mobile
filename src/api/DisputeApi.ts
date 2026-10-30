import { z } from "zod";
import { ApiClient } from "./ApiClient";

/** Fields the mobile app reads from `fileQuestDispute` (docs/api/api.yaml). */
export const disputeCaseSchema = z.object({
  id: z.string(),
  displayId: z.string(),
  questId: z.string(),
  status: z.enum([
    "DISPUTE_CASE_PENDING",
    "DISPUTE_CASE_DISMISSED",
    "DISPUTE_CASE_RESOLVED",
  ]),
  createdAt: z.string(),
  /** Set when an Admin resolves the case: the paid Worker and amount. */
  resolvedWorkerId: z.string().nullable().optional(),
  resolvedAmountSatang: z.coerce.number().int().nullable().optional(),
  resolvedAt: z.string().nullable().optional(),
});
export type DisputeCase = z.infer<typeof disputeCaseSchema>;
export const myDisputeCaseResponseSchema = z.object({
  case: disputeCaseSchema.nullable(),
});

/**
 * `teamSplit` of a won Candidate Team Dispute Case (PR 825, ADR 0036).
 * Money is integer Satang; amounts come from the server, never the client.
 */
export const teamSplitSchema = z.object({
  disputeCaseId: z.string(),
  status: z.enum(["AWAITING_SPLIT", "SPLIT_CONFIRMED", "PAID"]),
  splitSource: z.enum(["LEADER", "AUTO_EQUAL"]).nullable(),
  approvedAmountSatang: z.number().int().nonnegative(),
  deadlineAt: z.string(),
  confirmedAt: z.string().nullable(),
  paidAt: z.string().nullable(),
  paymentPending: z.boolean(),
  viewerIsLeader: z.boolean(),
  canSubmitSplit: z.boolean(),
  members: z.array(
    z.object({
      memberId: z.string(),
      displayName: z.string(),
      isLeader: z.boolean(),
      percentageBasisPoints: z.number().int().min(0).max(10000).nullable(),
      amountSatang: z.number().int().nonnegative().nullable(),
      paidAt: z.string().nullable(),
    })
  ),
});
export type TeamSplit = z.infer<typeof teamSplitSchema>;

export type TeamSplitShare = {
  memberId: string;
  percentageBasisPoints: number;
};

export const TeamSplitErrorCode = {
  INVALID: "DISPUTE_TEAM_SPLIT_INVALID",
  NOT_AUTHORIZED: "DISPUTE_TEAM_SPLIT_NOT_AUTHORIZED",
  NOT_FOUND: "DISPUTE_TEAM_SPLIT_NOT_FOUND",
  EXPIRED: "DISPUTE_TEAM_SPLIT_EXPIRED",
  NOT_READY: "DISPUTE_TEAM_SPLIT_NOT_READY",
} as const;

export type DisputeInput = {
  category: "PROOF_REVIEW" | "QUEST_CONDITION" | "PARTIAL_WORK" | "OTHER";
  submittedDetail: string;
};

export class DisputeApi {
  constructor(private readonly client: ApiClient = new ApiClient()) {}

  async getMyDisputeCase(
    questId: string,
    signal?: AbortSignal
  ): Promise<z.infer<typeof myDisputeCaseResponseSchema>> {
    return this.client.get(
      `/api/v1/quests/${questId}/disputes/mine`,
      myDisputeCaseResponseSchema,
      { signal }
    );
  }

  /**
   * Files the viewer's one Dispute Case on a `QUEST_FAILED` Quest. The Server
   * enforces the 1-day self-file window and the one-case-per-filer rule.
   */
  async fileDispute(
    questId: string,
    input: DisputeInput
  ): Promise<DisputeCase> {
    return this.client.send(
      "POST",
      `/api/v1/quests/${questId}/disputes`,
      disputeCaseSchema,
      { json: input }
    );
  }

  /**
   * Confirms the Team Leader's split of an approved team amount. Reuse
   * `idempotencyKey` when retrying the same shares after a 503.
   */
  async submitTeamSplit(
    questId: string,
    shares: TeamSplitShare[],
    idempotencyKey: string
  ): Promise<TeamSplit> {
    return this.client.send(
      "POST",
      `/api/v1/quests/${questId}/disputes/team-split`,
      teamSplitSchema,
      { json: { shares }, idempotencyKey }
    );
  }
}

export const disputeApi = new DisputeApi();
