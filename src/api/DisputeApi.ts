import { z } from "zod";
import { ApiClient } from "./ApiClient";
import type { RequestOptions } from "./WalletApi";

export const disputeReasonSchema = z.enum([
  "PROOF_REJECTED_UNFAIRLY",
  "CONDITIONS_BREACHED",
  "COMMUNICATION_BREAKDOWN",
  "OTHER",
]);
export type DisputeReason = z.infer<typeof disputeReasonSchema>;

export const disputeCaseSchema = z.object({
  id: z.string(),
  questId: z.string(),
  filerId: z.string(),
  filerRole: z.enum(["HIRER", "WORKER"]),
  status: z.string(),
  reason: disputeReasonSchema,
  statement: z.string(),
  heldSatang: z.number().int().nonnegative().optional(),
  filingDeadline: z.string().optional(),
  holdExpiresAt: z.string().optional(),
  createdAt: z.string(),
});
export type DisputeCase = z.infer<typeof disputeCaseSchema>;

export const disputeCaseResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    dispute: disputeCaseSchema,
  }),
});
export type DisputeCaseResponse = z.infer<typeof disputeCaseResponseSchema>;

export const disputeQueryResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    dispute: disputeCaseSchema.nullable(),
  }),
});
export type DisputeQueryResponse = z.infer<typeof disputeQueryResponseSchema>;

export interface FileDisputePayload {
  reason: DisputeReason;
  statement: string;
  evidenceFileIds?: string[];
}

export class DisputeApi {
  constructor(private readonly client: ApiClient = new ApiClient()) {}

  async fileDispute(
    questId: string,
    payload: {
      reason: DisputeReason;
      statement: string;
      evidenceFileIds?: string[];
    },
    idempotencyKey?: string
  ): Promise<DisputeCase> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["idempotency-key"] = idempotencyKey;
    }
    const body = await this.client.requestJson<unknown>(
      `/api/v1/quests/${questId}/disputes`,
      payload,
      {
        method: "POST",
        headers,
      }
    );
    return disputeCaseResponseSchema.parse(body).data.dispute;
  }

  async getDispute(
    questId: string,
    options?: RequestOptions
  ): Promise<DisputeCase | null> {
    const body = await this.client.request<unknown>(
      `/api/v1/quests/${questId}/disputes`,
      {
        method: "GET",
        signal: options?.signal,
      }
    );
    return disputeQueryResponseSchema.parse(body).data.dispute;
  }
}

export const disputeApi = new DisputeApi();
