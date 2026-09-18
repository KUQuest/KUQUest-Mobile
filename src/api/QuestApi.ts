import { z } from "zod";
import { ApiClient } from "./ApiClient";
import {
  questV2ApplicationListResponseSchema,
  questV2AssignmentResponseSchema,
  questV2ApplicationResponseSchema,
  questV2ApplicationSelectionResponseSchema,
  questV2BoardResponseSchema,
  questV2CanonicalQuestResponseSchema,
  questV2CompletionResponseSchema,
  questV2CreatePayloadSchema,
  questV2DetailResponseSchema,
  questV2EditPayloadSchema,
  questV2EditRequestCreatePayloadSchema,
  questV2EditRequestRespondPayloadSchema,
  questV2EditRequestResponseSchema,
  questV2ImagesResponseSchema,
  questV2AssignmentsMineResponseSchema,
  questV2AssignmentsResponseSchema,
  questV2MineResponseSchema,
  questV2ProofCreatePayloadSchema,
  questV2ProofDeleteResponseSchema,
  questV2ProofListResponseSchema,
  questV2ProofResponseSchema,
  questV2ProofReviewPayloadSchema,
  questV2ProofReviewResponseSchema,
  questV2ProofRetryPayloadSchema,
  questV2ProofUpdatePayloadSchema,
  questV2PublishCheckResponseSchema,
  questV2PublishResponseSchema,
  questV2CancellationResponseSchema,
  questV2PublicDetailResponseSchema,
  questV2ParticipationDetailResponseSchema,
  questV2ReviewCreatePayloadSchema,
  questV2ReviewResponseSchema,
  questV2ReviewUpdatePayloadSchema,
  questV2TeamCreatePayloadSchema,
  questV2TeamJoinPayloadSchema,
  questV2TeamSubmitPayloadSchema,
  questV2TeamUpdatePayloadSchema,
  questV2TeamListResponseSchema,
  questV2TeamResponseSchema,
  questV2TeamFileResponseSchema,
  questV2TeamSelectionResponseSchema,
  questV2UnderfilledResponseSchema,
  questV2UnderfilledDecisionPayloadSchema,
  questV2UnderfilledConsentPayloadSchema,
  type QuestV2ApplicationSelection,
  type QuestV2Application,
  type QuestV2Assignment,
  type QuestV2BoardCard,
  type QuestV2CanonicalQuest,
  type QuestV2Completion,
  type QuestV2Detail,
  type QuestV2EditRequest,
  type QuestV2Image,
  type QuestV2Mode,
  type QuestV2Participation,
  type QuestV2ParticipationDetail,
  type QuestV2ProofDelete,
  type QuestV2ProofReview,
  type QuestV2CancellationOutcome,
  type QuestV2ProofSubmission,
  type QuestV2PublicDetail,
  type QuestV2PublishCheck,
  type QuestV2Review,
  type QuestV2Team,
  type QuestV2TeamFile,
  type QuestV2TeamSelection,
  type QuestV2Underfilled,
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
  createdAt: z.string().optional(),
});

export const tagListResponseSchema = z.object({
  success: z.literal(true),
  data: z.union([
    z.array(tagItemSchema),
    z
      .object({
        items: z.array(tagItemSchema),
        nextCursor: z.string().nullable().optional(),
      })
      .transform((val) => val.items),
  ]),
});

export type TagItem = z.infer<typeof tagItemSchema>;

export interface QuestV2EditQuestOptions {
  version: number;
  idempotencyKey?: string;
}

export interface QuestV2CreateEditRequestPayload {
  condition: { items: string[] };
}
export type QuestV2AssignmentMineStatus = "active" | "completed" | "all";

export interface QuestV2EditRequestResponsePayload {
  decision: "EDIT_RESPONSE_ACCEPTED" | "EDIT_RESPONSE_DECLINED";
  reason?: string;
}

export interface QuestV2ProofCreatePayload {
  description?: string;
  fileIds?: string[];
}

export interface QuestV2ProofUpdatePayload {
  description?: string;
  fileIds?: string[];
}
export interface QuestV2ProofRetryPayload {
  assets: [UploadAsset];
  retryPosition: number;
  description?: string;
}

export interface QuestV2ProofReviewPayload {
  decision: "PROOF_APPROVED" | "PROOF_NOT_APPROVED";
  reason?: string;
}

export interface QuestV2ReviewPayload {
  revieweeId?: string;
  rating: number;
  comment?: string;
}

function requiredIdempotencyKey(value?: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("Quest v2 mutations require a non-blank idempotency key");
  }
  if (value.length > 200) {
    throw new Error("Quest v2 idempotency keys must be at most 200 characters");
  }
  return value;
}

function mutationHeaders(
  idempotencyKey?: string,
  additional: Record<string, string> = {}
): Record<string, string> {
  const key = requiredIdempotencyKey(idempotencyKey);
  return {
    "idempotency-key": key,
    "Idempotency-Key": key,
    ...additional,
  };
}
export class QuestApi {
  constructor(readonly client: ApiClient = new ApiClient()) {}
  async listBoard(
    params: {
      q?: string;
      tagId?: string;
      mode?: QuestV2Mode;
      participation?: QuestV2Participation;
      minQuestReward?: number;
      maxQuestReward?: number;
      maxDurationMinutes?: number;
      startFrom?: string;
      startTo?: string;
      limit?: number;
      cursor?: string;
    } = {}
  ): Promise<{ items: QuestV2BoardCard[]; nextCursor: string | null }> {
    const query = new URLSearchParams();
    if (params.tagId) query.set("tagId", params.tagId);
    if (params.q) query.set("q", params.q);
    if (params.mode) query.set("mode", params.mode);
    if (params.participation) query.set("participation", params.participation);
    if (params.minQuestReward !== undefined)
      query.set("minQuestReward", String(params.minQuestReward));
    if (params.maxQuestReward !== undefined)
      query.set("maxQuestReward", String(params.maxQuestReward));
    if (params.maxDurationMinutes !== undefined)
      query.set("maxDurationMinutes", String(params.maxDurationMinutes));
    if (params.startFrom) query.set("startFrom", params.startFrom);
    if (params.startTo) query.set("startTo", params.startTo);
    if (params.limit !== undefined) query.set("limit", String(params.limit));
    if (params.cursor) query.set("cursor", params.cursor);

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
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2Image[]> {
    if (assets.length < 1 || assets.length > 3) {
      throw new Error("Quest image uploads require one to three files");
    }
    const allowedTypes: Record<string, true> = {
      "image/jpeg": true,
      "image/png": true,
      "image/webp": true,
    };
    if (
      assets.some(
        (asset) =>
          asset.type !== undefined &&
          allowedTypes[asset.type.toLowerCase()] !== true
      )
    ) {
      throw new Error("Quest images must be JPEG, PNG, or WebP");
    }
    const formData = new FormData();
    assets.forEach((asset, index) => {
      appendUploadFile(formData, "images", asset, `quest-${index}`);
    });
    const body = await this.client.requestForm<unknown>(
      `/api/v2/quests/${questId}/images`,
      formData,
      { method: "POST", headers: mutationHeaders(idempotencyKey) }
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

  async listMyAssignments(
    status?: QuestV2AssignmentMineStatus
  ): Promise<QuestV2Assignment[]> {
    const query = status ? `?status=${status}` : "";
    const body = await this.client.request<unknown>(
      `/api/v2/assignments/mine${query}`
    );
    return questV2AssignmentsMineResponseSchema.parse(body).data.items;
  }

  async listQuestAssignments(questId: string): Promise<QuestV2Assignment[]> {
    const body = await this.client.request<unknown>(
      `/api/v2/quests/${questId}/assignments`
    );
    return questV2AssignmentsResponseSchema.parse(body).data.items;
  }

  async createQuest(
    payload: CreateQuestV2Payload,
    idempotencyKey?: string
  ): Promise<QuestV2CanonicalQuest> {
    const validatedPayload = questV2CreatePayloadSchema.parse(payload);
    const body = await this.client.requestJson<unknown>(
      "/api/v2/quests",
      validatedPayload,
      {
        method: "POST",
        headers: mutationHeaders(idempotencyKey),
      }
    );
    return questV2CanonicalQuestResponseSchema.parse(body).data;
  }

  async editQuest(
    questId: string,
    version: number,
    payload: Partial<CreateQuestV2Payload>,
    idempotencyKey?: string
  ): Promise<QuestV2CanonicalQuest>;
  async editQuest(
    questId: string,
    payload: Partial<CreateQuestV2Payload>,
    options: QuestV2EditQuestOptions
  ): Promise<QuestV2CanonicalQuest>;
  async editQuest(
    questId: string,
    arg2: number | Partial<CreateQuestV2Payload>,
    arg3?: Partial<CreateQuestV2Payload> | QuestV2EditQuestOptions,
    arg4?: string
  ): Promise<QuestV2CanonicalQuest> {
    const isVersionFirst = typeof arg2 === "number";
    const options: QuestV2EditQuestOptions = isVersionFirst
      ? { version: arg2, idempotencyKey: arg4 ?? createQuestIdempotencyKey() }
      : ((arg3 as QuestV2EditQuestOptions) ?? { version: 0 });
    const payload = (
      isVersionFirst ? arg3 : arg2
    ) as Partial<CreateQuestV2Payload>;
    return this.internalEditQuest(questId, payload, options);
  }

  private async internalEditQuest(
    questId: string,
    payload: Partial<CreateQuestV2Payload>,
    options: QuestV2EditQuestOptions
  ): Promise<QuestV2CanonicalQuest> {
    if (!Number.isInteger(options.version) || options.version < 1) {
      throw new Error("Quest edits require a positive current version");
    }
    const validatedPayload = questV2EditPayloadSchema.parse(payload);
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}`,
      validatedPayload,
      {
        method: "PATCH",
        headers: mutationHeaders(options.idempotencyKey, {
          "If-Match": String(options.version),
        }),
      }
    );
    return questV2CanonicalQuestResponseSchema.parse(body).data;
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
  ): Promise<QuestV2CanonicalQuest> {
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/publish`,
      {},
      {
        method: "POST",
        headers: mutationHeaders(idempotencyKey),
      }
    );
    return questV2PublishResponseSchema.parse(body).data.quest;
  }

  async cancelQuest(
    questId: string,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2CancellationOutcome> {
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/cancel`,
      {},
      { method: "POST", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2CancellationResponseSchema.parse(body).data;
  }

  async joinQuest(
    questId: string,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2Assignment> {
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/join`,
      {},
      { method: "POST", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2AssignmentResponseSchema.parse(body).data;
  }

  async confirmCompletion(
    questId: string,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2Completion> {
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/completion-confirmation`,
      {},
      { method: "POST", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2CompletionResponseSchema.parse(body).data;
  }

  async deleteQuestImage(
    questId: string,
    imageId: string,
    idempotencyKey?: string
  ): Promise<QuestV2Image[]> {
    const body = await this.client.request<unknown>(
      `/api/v2/quests/${questId}/images/${imageId}`,
      { method: "DELETE", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2ImagesResponseSchema.parse(body).data.images;
  }

  async applyQuest(
    questId: string,
    idempotencyKey?: string
  ): Promise<QuestV2Application> {
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/applications`,
      {},
      { method: "POST", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2ApplicationResponseSchema.parse(body).data;
  }

  async listApplications(questId: string): Promise<QuestV2Application[]> {
    const body = await this.client.request<unknown>(
      `/api/v2/quests/${questId}/applications`
    );
    return questV2ApplicationListResponseSchema.parse(body).data.items;
  }

  async getApplication(
    questId: string,
    applicationId: string
  ): Promise<QuestV2Application> {
    const body = await this.client.request<unknown>(
      `/api/v2/quests/${questId}/applications/${applicationId}`
    );
    return questV2ApplicationResponseSchema.parse(body).data;
  }

  async withdrawApplication(
    questId: string,
    applicationId: string,
    idempotencyKey?: string
  ): Promise<QuestV2Application> {
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/applications/${applicationId}/withdraw`,
      {},
      { method: "POST", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2ApplicationResponseSchema.parse(body).data;
  }

  async selectApplication(
    questId: string,
    applicationId: string,
    idempotencyKey?: string
  ): Promise<QuestV2ApplicationSelection> {
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/applications/${applicationId}/select`,
      {},
      { method: "POST", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2ApplicationSelectionResponseSchema.parse(body).data;
  }
  async rejectCandidateApplication(
    questId: string,
    applicationId: string,
    idempotencyKey?: string
  ): Promise<QuestV2Application> {
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/applications/${applicationId}/reject`,
      {},
      { method: "POST", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2ApplicationResponseSchema.parse(body).data;
  }

  async createCandidateTeam(
    questId: string,
    payload: { name: string; headcount: number },
    idempotencyKey?: string
  ): Promise<QuestV2Team> {
    const validatedPayload = questV2TeamCreatePayloadSchema.parse(payload);
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/teams`,
      validatedPayload,
      { method: "POST", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2TeamResponseSchema.parse(body).data;
  }

  async listCandidateTeams(questId: string): Promise<QuestV2Team[]> {
    const body = await this.client.request<unknown>(
      `/api/v2/quests/${questId}/teams`
    );
    return questV2TeamListResponseSchema.parse(body).data.items;
  }

  async getCandidateTeam(
    questId: string,
    teamId: string
  ): Promise<QuestV2Team> {
    const body = await this.client.request<unknown>(
      `/api/v2/quests/${questId}/teams/${teamId}`
    );
    return questV2TeamResponseSchema.parse(body).data;
  }
  async updateCandidateTeam(
    questId: string,
    teamId: string,
    payload: { name: string },
    idempotencyKey?: string
  ): Promise<QuestV2Team> {
    const validatedPayload = questV2TeamUpdatePayloadSchema.parse(payload);
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/teams/${teamId}`,
      validatedPayload,
      { method: "PATCH", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2TeamResponseSchema.parse(body).data;
  }

  async joinCandidateTeam(
    questId: string,
    teamId: string,
    joinCode: string,
    idempotencyKey?: string
  ): Promise<QuestV2Team> {
    const validatedPayload = questV2TeamJoinPayloadSchema.parse({ joinCode });
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/teams/${teamId}/join`,
      validatedPayload,
      { method: "POST", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2TeamResponseSchema.parse(body).data;
  }

  async leaveCandidateTeam(
    questId: string,
    teamId: string,
    idempotencyKey?: string
  ): Promise<QuestV2Team> {
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/teams/${teamId}/leave`,
      {},
      { method: "POST", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2TeamResponseSchema.parse(body).data;
  }

  async removeCandidateTeamMember(
    questId: string,
    teamId: string,
    memberId: string,
    idempotencyKey?: string
  ): Promise<QuestV2Team> {
    const body = await this.client.request<unknown>(
      `/api/v2/quests/${questId}/teams/${teamId}/members/${memberId}`,
      { method: "DELETE", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2TeamResponseSchema.parse(body).data;
  }

  async regenerateCandidateTeamJoinCode(
    questId: string,
    teamId: string,
    idempotencyKey?: string
  ): Promise<QuestV2Team> {
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/teams/${teamId}/join-code`,
      {},
      { method: "POST", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2TeamResponseSchema.parse(body).data;
  }
  async uploadCandidateTeamFile(
    questId: string,
    teamId: string,
    asset: UploadAsset,
    idempotencyKey?: string
  ): Promise<QuestV2TeamFile> {
    const formData = new FormData();
    appendUploadFile(formData, "file", asset, `team-${teamId}`);
    const body = await this.client.requestForm<unknown>(
      `/api/v2/quests/${questId}/teams/${teamId}/files`,
      formData,
      { method: "POST", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2TeamFileResponseSchema.parse(body).data;
  }

  async submitCandidateTeam(
    questId: string,
    teamId: string,
    payload: { text?: string; fileIds?: string[] },
    idempotencyKey?: string
  ): Promise<QuestV2Team> {
    const validatedPayload = questV2TeamSubmitPayloadSchema.parse({
      text: payload.text ?? "",
      fileIds: payload.fileIds ?? [],
    });
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/teams/${teamId}/submit`,
      validatedPayload,
      { method: "POST", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2TeamResponseSchema.parse(body).data;
  }

  async selectCandidateTeam(
    questId: string,
    teamId: string,
    idempotencyKey?: string
  ): Promise<QuestV2TeamSelection> {
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/teams/${teamId}/select`,
      {},
      { method: "POST", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2TeamSelectionResponseSchema.parse(body).data;
  }
  async rejectCandidateTeam(
    questId: string,
    teamId: string,
    idempotencyKey?: string
  ): Promise<QuestV2Team> {
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/teams/${teamId}/reject`,
      {},
      { method: "POST", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2TeamResponseSchema.parse(body).data;
  }

  async getUnderfilled(questId: string): Promise<QuestV2Underfilled> {
    const body = await this.client.request<unknown>(
      `/api/v2/quests/${questId}/underfilled`
    );
    return questV2UnderfilledResponseSchema.parse(body).data;
  }

  async decideUnderfilled(
    questId: string,
    decision: "PROCEED" | "CANCEL",
    idempotencyKey?: string
  ): Promise<QuestV2Underfilled> {
    const validatedPayload = questV2UnderfilledDecisionPayloadSchema.parse({
      decision,
    });
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/underfilled/decision`,
      validatedPayload,
      { method: "POST", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2UnderfilledResponseSchema.parse(body).data;
  }

  async respondUnderfilledConsent(
    questId: string,
    decision: "ACCEPT" | "DECLINE",
    idempotencyKey?: string
  ): Promise<QuestV2Underfilled> {
    const validatedPayload = questV2UnderfilledConsentPayloadSchema.parse({
      decision,
    });
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/underfilled/consent`,
      validatedPayload,
      { method: "POST", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2UnderfilledResponseSchema.parse(body).data;
  }

  async createEditRequest(
    questId: string,
    payload: QuestV2CreateEditRequestPayload,
    idempotencyKey?: string
  ): Promise<QuestV2EditRequest> {
    const validatedPayload =
      questV2EditRequestCreatePayloadSchema.parse(payload);
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/edit-requests`,
      validatedPayload,
      { method: "POST", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2EditRequestResponseSchema.parse(body).data;
  }

  async getEditRequest(requestId: string): Promise<QuestV2EditRequest> {
    const body = await this.client.request<unknown>(
      `/api/v2/quests/edit-requests/${requestId}`
    );
    return questV2EditRequestResponseSchema.parse(body).data;
  }

  async respondToEditRequest(
    requestId: string,
    payload: QuestV2EditRequestResponsePayload,
    idempotencyKey?: string
  ): Promise<QuestV2EditRequest> {
    const validatedPayload =
      questV2EditRequestRespondPayloadSchema.parse(payload);
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/edit-requests/${requestId}/respond`,
      validatedPayload,
      { method: "POST", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2EditRequestResponseSchema.parse(body).data;
  }

  async createProofDraft(
    questId: string,
    payload:
      | QuestV2ProofCreatePayload
      | { assets: UploadAsset[]; description?: string },
    idempotencyKey?: string
  ): Promise<QuestV2ProofSubmission> {
    if ("assets" in payload) {
      if (payload.assets.length > 5) {
        throw new Error("Proof submissions allow at most five files");
      }
      if (
        payload.assets.length === 0 &&
        (payload.description === undefined ||
          payload.description.trim().length === 0)
      ) {
        throw new Error("Description or at least one file is required");
      }
      if (
        payload.description !== undefined &&
        payload.description.length > 1000
      ) {
        throw new Error("Proof descriptions must be at most 1000 characters");
      }
      const formData = new FormData();
      if (payload.description !== undefined)
        formData.append("description", payload.description);
      payload.assets.forEach((asset, index) =>
        appendUploadFile(formData, "files", asset, `proof-${index}`)
      );
      const body = await this.client.requestForm<unknown>(
        `/api/v2/quests/${questId}/proof-submissions`,
        formData,
        { method: "POST", headers: mutationHeaders(idempotencyKey) }
      );
      return questV2ProofResponseSchema.parse(body).data;
    }
    const validatedPayload = questV2ProofCreatePayloadSchema.parse(payload);
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/proof-submissions`,
      validatedPayload,
      { method: "POST", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2ProofResponseSchema.parse(body).data;
  }
  async updateProofDraft(
    questId: string,
    proofSubmissionId: string,
    payload: QuestV2ProofUpdatePayload | QuestV2ProofRetryPayload,
    idempotencyKey?: string
  ): Promise<QuestV2ProofSubmission> {
    if ("assets" in payload) {
      if (payload.assets.length !== 1) {
        throw new Error("Proof retries require exactly one file");
      }
      const validatedPayload = questV2ProofRetryPayloadSchema.parse({
        description: payload.description,
        retryPosition: payload.retryPosition,
      });
      const formData = new FormData();
      if (validatedPayload.description !== undefined)
        formData.append("description", validatedPayload.description);
      formData.append("retryPosition", String(validatedPayload.retryPosition));
      appendUploadFile(formData, "files", payload.assets[0], "proof-retry");
      const body = await this.client.requestForm<unknown>(
        `/api/v2/quests/${questId}/proof-submissions/${proofSubmissionId}`,
        formData,
        { method: "PATCH", headers: mutationHeaders(idempotencyKey) }
      );
      return questV2ProofResponseSchema.parse(body).data;
    }
    const validatedPayload = questV2ProofUpdatePayloadSchema.parse(payload);
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/proof-submissions/${proofSubmissionId}`,
      validatedPayload,
      { method: "PATCH", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2ProofResponseSchema.parse(body).data;
  }

  async deleteProofDraft(
    questId: string,
    proofSubmissionId: string,
    idempotencyKey?: string
  ): Promise<QuestV2ProofDelete> {
    const body = await this.client.request<unknown>(
      `/api/v2/quests/${questId}/proof-submissions/${proofSubmissionId}`,
      { method: "DELETE", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2ProofDeleteResponseSchema.parse(body).data;
  }

  async submitProofDraft(
    questId: string,
    proofSubmissionId: string,
    idempotencyKey?: string
  ): Promise<QuestV2ProofSubmission> {
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/proof-submissions/${proofSubmissionId}/submit`,
      {},
      { method: "POST", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2ProofResponseSchema.parse(body).data;
  }

  async listProofSubmissions(
    questId: string
  ): Promise<QuestV2ProofSubmission[]> {
    const body = await this.client.request<unknown>(
      `/api/v2/quests/${questId}/proof-submissions`
    );
    return questV2ProofListResponseSchema.parse(body).data.items;
  }

  async reviewProof(
    questId: string,
    proofSubmissionId: string,
    payload: QuestV2ProofReviewPayload,
    idempotencyKey?: string
  ): Promise<QuestV2ProofReview> {
    const validatedPayload = questV2ProofReviewPayloadSchema.parse(payload);
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/proof-submissions/${proofSubmissionId}/review`,
      validatedPayload,
      { method: "POST", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2ProofReviewResponseSchema.parse(body).data;
  }

  async createReview(
    questId: string,
    input: QuestV2ReviewPayload,
    idempotencyKey?: string
  ): Promise<QuestV2Review> {
    const validatedPayload = questV2ReviewCreatePayloadSchema.parse(input);
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/reviews`,
      validatedPayload,
      { method: "POST", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2ReviewResponseSchema.parse(body).data;
  }

  async updateReview(
    questId: string,
    reviewId: string,
    input: { rating?: number; comment?: string },
    idempotencyKey?: string
  ): Promise<QuestV2Review> {
    const validatedPayload = questV2ReviewUpdatePayloadSchema.parse(input);
    const body = await this.client.requestJson<unknown>(
      `/api/v2/quests/${questId}/reviews/${reviewId}`,
      validatedPayload,
      { method: "PATCH", headers: mutationHeaders(idempotencyKey) }
    );
    return questV2ReviewResponseSchema.parse(body).data;
  }
}

export const questApi = new QuestApi();
