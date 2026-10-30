import { z } from "zod";
import { ApiClient } from "./ApiClient";
import {
  questV2DisputeTeamSplitSchema,
  type QuestV2DisputeTeamSplit,
} from "./questV2Contracts";

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
});
export type DisputeCase = z.infer<typeof disputeCaseSchema>;
export const myDisputeCaseResponseSchema = z.object({
  case: disputeCaseSchema.nullable(),
});

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

  /** The Team Leader confirms every member's share; shares total 10,000 basis points. */
  async submitTeamSplit(
    questId: string,
    shares: { memberId: string; percentageBasisPoints: number }[],
    idempotencyKey: string
  ): Promise<QuestV2DisputeTeamSplit> {
    return this.client.send(
      "POST",
      `/api/v1/quests/${questId}/disputes/team-split`,
      questV2DisputeTeamSplitSchema,
      { json: { shares }, idempotencyKey }
    );
  }
}

export const disputeApi = new DisputeApi();
