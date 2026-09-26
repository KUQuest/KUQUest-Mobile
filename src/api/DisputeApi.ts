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
});
export type DisputeCase = z.infer<typeof disputeCaseSchema>;

export class DisputeApi {
  constructor(private readonly client: ApiClient = new ApiClient()) {}

  /**
   * Files the viewer's one Dispute Case on a `QUEST_FAILED` Quest. The Server
   * enforces the 1-day self-file window and the one-case-per-filer rule.
   */
  async fileDispute(questId: string): Promise<DisputeCase> {
    return this.client.send(
      "POST",
      `/api/v1/quests/${questId}/disputes`,
      disputeCaseSchema
    );
  }
}

export const disputeApi = new DisputeApi();
