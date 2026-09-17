import { z } from "zod";
import { ApiClient } from "./ApiClient";
import {
  questV2BoardResponseSchema,
  questV2DetailResponseSchema,
  questV2PublicDetailResponseSchema,
  questV2ParticipationDetailResponseSchema,
  questV2ImagesResponseSchema,
  questV2MineResponseSchema,
  questV2AssignmentsMineResponseSchema,
  questV2PublishCheckResponseSchema,
  questV2PublishResponseSchema,
  questV2CancellationResponseSchema,
  type QuestV2BoardCard,
  type QuestV2Detail,
  type QuestV2PublicDetail,
  type QuestV2ParticipationDetail,
  type QuestV2Image,
  type QuestV2CanonicalQuest,
  type QuestV2Assignment,
  type QuestV2PublishCheck,
  type QuestV2CancellationOutcome,
  type QuestV2Mode,
  type QuestV2Participation,
} from "./questV2Contracts";
import { appendUploadFile, type UploadAsset } from "./fileUpload";

export function createQuestIdempotencyKey(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

export interface CreateQuestV2Payload {
  title: string;
  description?: string | null;
  condition: { items: string[] };
  mode: QuestV2Mode;
  participation: QuestV2Participation;
  questFundingTotal: number;
  headcount: number;
  startTime: string;
  dueAt?: string | null;
  tagId?: string | null;
  proofRequired?: boolean;
  locations?: { label: string }[];
}

export const tagItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export const tagListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(tagItemSchema),
});

export type TagItem = z.infer<typeof tagItemSchema>;

export class QuestApi {
  constructor(private readonly client: ApiClient = new ApiClient()) {}

  async listBoard(
    params: {
      tagId?: string;
      q?: string;
      cursor?: string;
      limit?: number;
    } = {}
  ): Promise<{ items: QuestV2BoardCard[]; nextCursor: string | null }> {
    const query = new URLSearchParams();
    if (params.tagId) query.set("tagId", params.tagId);
    if (params.q) query.set("q", params.q);
    if (params.cursor) query.set("cursor", params.cursor);
    if (params.limit) query.set("limit", String(params.limit));

    const queryString = query.toString();
    const endpoint = `/api/v2/quests${queryString ? `?${queryString}` : ""}`;
    const body = await this.client.request<unknown>(endpoint);
    return questV2BoardResponseSchema.parse(body).data;
  }

  async listTags(): Promise<TagItem[]> {
    const body = await this.client.request<unknown>("/api/v1/tags");
    return tagListResponseSchema.parse(body).data;
  }

  async getPublicDetail(questId: string): Promise<QuestV2PublicDetail> {
    const body = await this.client.request<unknown>(
      `/api/v2/quests/${questId}/public`
    );
    return questV2PublicDetailResponseSchema.parse(body).data;
  }

  async getParticipationDetail(
    questId: string
  ): Promise<QuestV2ParticipationDetail> {
    const body = await this.client.request<unknown>(
      `/api/v2/quests/${questId}/participation`
    );
    return questV2ParticipationDetailResponseSchema.parse(body).data;
  }

  async getDetail(questId: string): Promise<QuestV2Detail> {
    const body = await this.client.request<unknown>(
      `/api/v2/quests/${questId}`
    );
    return questV2DetailResponseSchema.parse(body).data;
  }

  async uploadQuestImages(
    questId: string,
    assets: UploadAsset[],
    idempotencyKey?: string
  ): Promise<QuestV2Image[]> {
    if (assets.length === 0) return [];
    const formData = new FormData();
    assets.forEach((asset, index) => {
      appendUploadFile(formData, "images", asset, `quest-${index}`);
    });
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["idempotency-key"] = idempotencyKey;
    }
    const body = await this.client.requestForm<unknown>(
      `/api/v2/quests/${questId}/images`,
      formData,
      { method: "POST", headers }
    );
    return questV2ImagesResponseSchema.parse(body).data.images;
  }

  async listMine(
    params: {
      cursor?: string;
      limit?: number;
    } = {}
  ): Promise<{ items: QuestV2CanonicalQuest[]; nextCursor: string | null }> {
    const query = new URLSearchParams();
    if (params.cursor) query.set("cursor", params.cursor);
    if (params.limit) query.set("limit", String(params.limit));

    const queryString = query.toString();
    const endpoint = `/api/v2/quests/mine${queryString ? `?${queryString}` : ""}`;
    const body = await this.client.request<unknown>(endpoint);
    return questV2MineResponseSchema.parse(body).data;
  }

  async listMyAssignments(): Promise<QuestV2Assignment[]> {
    const body = await this.client.request<unknown>("/api/v2/assignments/mine");
    return questV2AssignmentsMineResponseSchema.parse(body).data.items;
  }

  async createQuest(
    payload: CreateQuestV2Payload,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2CanonicalQuest> {
    const body = await this.client.requestJson<unknown>(
      "/api/v2/quests",
      payload,
      {
        method: "POST",
        headers: { "idempotency-key": idempotencyKey },
      }
    );
    return questV2DetailResponseSchema.parse(body).data;
  }

  async editQuest(
    questId: string,
    payload: Partial<CreateQuestV2Payload>
  ): Promise<QuestV2CanonicalQuest> {
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}`,
      payload,
      {
        method: "PATCH",
      }
    );
    return questV2DetailResponseSchema.parse(body).data;
  }

  async getPublishCheck(questId: string): Promise<QuestV2PublishCheck> {
    const body = await this.client.request<unknown>(
      `/api/v2/quests/${questId}/publish-check`
    );
    return questV2PublishCheckResponseSchema.parse(body).data;
  }

  async publishQuest(
    questId: string,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2Detail> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers["idempotency-key"] = idempotencyKey;

    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/publish`,
      {},
      {
        method: "POST",
        headers,
      }
    );
    return questV2PublishResponseSchema.parse(body).data.quest;
  }

  async cancelQuest(
    questId: string,
    idempotencyKey?: string
  ): Promise<QuestV2CancellationOutcome> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers["idempotency-key"] = idempotencyKey;

    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/cancel`,
      {},
      {
        method: "POST",
        headers,
      }
    );
    return questV2CancellationResponseSchema.parse(body).data;
  }

  async joinQuest(
    questId: string,
    idempotencyKey?: string
  ): Promise<QuestV2Assignment> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers["idempotency-key"] = idempotencyKey;

    const body = await this.client.requestJson<{
      success: true;
      data: QuestV2Assignment;
    }>(
      `/api/v2/quests/${questId}/join`,
      {},
      {
        method: "POST",
        headers,
      }
    );
    return body.data;
  }

  async confirmCompletion(
    questId: string,
    idempotencyKey?: string
  ): Promise<{ completedAt: string }> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers["idempotency-key"] = idempotencyKey;

    const body = await this.client.requestJson<{
      success: true;
      data: { completedAt: string };
    }>(
      `/api/v2/quests/${questId}/completion-confirmation`,
      {},
      {
        method: "POST",
        headers,
      }
    );
    return body.data;
  }

  async createReview(
    questId: string,
    input: {
      revieweeId: string;
      score: number;
      comment?: string;
    }
  ): Promise<{ id: string }> {
    const body = await this.client.requestJson<{
      success: true;
      data: { id: string };
    }>(`/api/v2/quests/${questId}/reviews`, input, { method: "POST" });
    return body.data;
  }
}

export const questApi = new QuestApi();
