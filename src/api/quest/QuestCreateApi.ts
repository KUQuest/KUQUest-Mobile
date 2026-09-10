import { z } from "zod";

import { ApiClient } from "../ApiClient";
import type { QuestDraftPayload } from "@/features/createQuest/createQuestModel";

const successResponseSchema = z.object({
  success: z.literal(true),
  data: z.record(z.string(), z.unknown()),
});

export type QuestMutationData = z.infer<typeof successResponseSchema>["data"];

export interface QuestPublishCheckData {
  blockingReasons: string[];
  warnings: string[];
}

/** Reads only the publish-check fields explicitly defined by the v2 handoff. */
export function parseQuestPublishCheckData(
  data: QuestMutationData,
): QuestPublishCheckData | null {
  const blockingReasons = data.blockingReasons;
  const warnings = data.warnings;
  if (
    !Array.isArray(blockingReasons) ||
    blockingReasons.some((reason) => typeof reason !== "string")
  ) {
    return null;
  }
  return {
    blockingReasons,
    warnings:
      Array.isArray(warnings) && warnings.every((warning) => typeof warning === "string")
        ? warnings
        : [],
  };
}

export interface QuestDraftMutationOptions {
  idempotencyKey: string;
  ifMatch?: string;
}

function mutationHeaders(options: QuestDraftMutationOptions): Record<string, string> {
  return {
    "Idempotency-Key": options.idempotencyKey,
    ...(options.ifMatch ? { "If-Match": options.ifMatch } : {}),
  };
}

/** Authenticated v2 Hirer Draft-to-Open transport boundary. */
export class QuestCreateApi {
  constructor(private readonly client: ApiClient = new ApiClient()) {}

  async createDraft(
    payload: QuestDraftPayload,
    options: QuestDraftMutationOptions,
  ): Promise<QuestMutationData> {
    const body = await this.client.requestJson<unknown>(
      "/api/v2/quests",
      payload,
      { method: "POST", headers: mutationHeaders(options) },
    );
    return successResponseSchema.parse(body).data;
  }

  async updateDraft(
    questId: string,
    payload: Partial<QuestDraftPayload>,
    options: QuestDraftMutationOptions & { ifMatch: string },
  ): Promise<QuestMutationData> {
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${encodeURIComponent(questId)}`,
      payload,
      { method: "PATCH", headers: mutationHeaders(options) },
    );
    return successResponseSchema.parse(body).data;
  }

  async getPublishCheck(questId: string): Promise<QuestMutationData> {
    const body = await this.client.request<unknown>(
      `/api/v2/quests/${encodeURIComponent(questId)}/publish-check`,
    );
    return successResponseSchema.parse(body).data;
  }

  async publishQuest(
    questId: string,
    options: QuestDraftMutationOptions,
  ): Promise<QuestMutationData> {
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${encodeURIComponent(questId)}/publish`,
      {},
      { method: "POST", headers: mutationHeaders(options) },
    );
    return successResponseSchema.parse(body).data;
  }
}

export const questCreateApi = new QuestCreateApi();
