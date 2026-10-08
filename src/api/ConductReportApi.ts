import { z } from "zod";
import { ApiClient } from "./ApiClient";
import { createQuestIdempotencyKey } from "./QuestApi";

export const conductReportReasonSchema = z.enum([
  "CONDUCT_ABANDONED",
  "CONDUCT_OUT_OF_SCOPE",
  "CONDUCT_NO_SHOW",
]);
export type ConductReportReason = z.infer<typeof conductReportReasonSchema>;

/** Fields the mobile app reads from `createQuestConductReportV2` (docs/api/api.yaml). */
export const conductReportSchema = z.object({
  id: z.string(),
  displayId: z.string(),
  questId: z.string(),
  reportedMemberId: z.string(),
  reason: conductReportReasonSchema,
  detail: z.string().nullable(),
  status: z.enum([
    "CONDUCT_REPORT_PENDING",
    "CONDUCT_REPORT_UPHELD",
    "CONDUCT_REPORT_DISMISSED",
  ]),
  createdAt: z.string(),
});
export type ConductReport = z.infer<typeof conductReportSchema>;

/** `getQuestConductReportsV2`: what the viewer can file now and what they filed. */
export const conductReportViewSchema = z.object({
  windowEndsAt: z.string().nullable(),
  reportable: z.array(
    z.object({ memberId: z.string(), reason: conductReportReasonSchema })
  ),
  items: z.array(conductReportSchema),
});
export type ConductReportView = z.infer<typeof conductReportViewSchema>;

export interface ConductReportInput {
  reportedMemberId: string;
  reason: ConductReportReason;
  detail?: string;
}

export class ConductReportApi {
  constructor(private readonly client: ApiClient = new ApiClient()) {}

  async getConductReports(
    questId: string,
    signal?: AbortSignal
  ): Promise<ConductReportView> {
    return this.client.get(
      `/api/v2/quests/${questId}/conduct-reports`,
      conductReportViewSchema,
      { signal }
    );
  }

  /**
   * Files one Conduct Report for Admin review. The Server decides eligibility
   * (`reportable`), the filing window, and one report per Member per Quest.
   */
  async fileConductReport(
    questId: string,
    input: ConductReportInput,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<ConductReport> {
    return this.client.send(
      "POST",
      `/api/v2/quests/${questId}/conduct-reports`,
      conductReportSchema,
      { json: input, idempotencyKey }
    );
  }
}

export const conductReportApi = new ConductReportApi();
