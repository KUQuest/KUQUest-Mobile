import { z } from "zod";
import type { RequestOptions } from "./ApiClient";
import { ApiClient } from "./ApiClient";
import {
  questV2ApplicationListDataSchema,
  questV2AssignmentSchema,
  questV2ApplicationSchema,
  questV2ApplicationSelectionSchema,
  questV2BoardPageSchema,
  questV2CanonicalQuestSchema,
  questV2CompletionSchema,
  questV2StartWorkSchema,
  questV2CreatePayloadSchema,
  questV2DetailSchema,
  questV2EditPayloadSchema,
  questV2EditRequestCreatePayloadSchema,
  questV2EditRequestRespondPayloadSchema,
  questV2EditRequestSchema,
  questV2ImagesDataSchema,
  questV2AssignmentsDataSchema,
  questV2MineDataSchema,
  questV2ProofCreatePayloadSchema,
  questV2ProofDeleteSchema,
  questV2ProofListDataSchema,
  questV2ProofSubmissionSchema,
  questV2ProofReviewPayloadSchema,
  questV2ProofReviewSchema,
  questV2ProofRetryPayloadSchema,
  questV2ProofUpdatePayloadSchema,
  questV2PublishCheckSchema,
  questV2PublishDataSchema,
  questV2CancellationOutcomeSchema,
  questV2PublicDetailSchema,
  questV2ParticipationDetailSchema,
  questV2ReviewCreatePayloadSchema,
  questV2ReviewSchema,
  questV2ReviewUpdatePayloadSchema,
  questV2TeamCreatePayloadSchema,
  questV2TeamJoinPayloadSchema,
  questV2TeamSubmitPayloadSchema,
  questV2TeamUpdatePayloadSchema,
  questV2TeamListDataSchema,
  questV2TeamSchema,
  questV2TeamFileSchema,
  questV2TeamSelectionSchema,
  questV2ProofFileLinkSchema,
  type QuestV2ProofFileLink,
  questV2UnderfilledSchema,
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
  type QuestV2StartWork,
  type QuestV2Team,
  type QuestV2TeamFile,
  type QuestV2TeamSelection,
  type QuestV2Underfilled,
} from "./questV2Contracts";
import { appendUploadFile, type UploadAsset } from "./fileUpload";
import { createIdempotencyKey } from "@/utils/idempotency";

export function createQuestIdempotencyKey(): string {
  return createIdempotencyKey("mobile");
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

export const tagListDataSchema = z.union([
  z.array(tagItemSchema),
  z
    .object({
      items: z.array(tagItemSchema),
      nextCursor: z.string().nullable().optional(),
    })
    .transform((val) => val.items),
]);

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
export interface QuestV2ProofFileUploadPayload {
  assets: UploadAsset[];
  description?: string;
  retryPosition?: number;
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
    } = {},
    options?: RequestOptions
  ): Promise<{ items: QuestV2BoardCard[]; nextCursor: string | null }> {
    return this.client.get("/api/v2/quests", questV2BoardPageSchema, {
      ...options,
      query: params,
    });
  }

  async listTags(options?: RequestOptions): Promise<TagItem[]> {
    return this.client.get("/api/v1/tags", tagListDataSchema, options);
  }

  async getPublicDetail(
    questId: string,
    options?: RequestOptions
  ): Promise<QuestV2PublicDetail> {
    return this.client.get(
      `/api/v2/quests/${questId}/public`,
      questV2PublicDetailSchema,
      options
    );
  }

  async getParticipationDetail(
    questId: string,
    options?: RequestOptions
  ): Promise<QuestV2ParticipationDetail> {
    return this.client.get(
      `/api/v2/quests/${questId}/participation`,
      questV2ParticipationDetailSchema,
      options
    );
  }

  async getDetail(
    questId: string,
    options?: RequestOptions
  ): Promise<QuestV2Detail> {
    return this.client.get(
      `/api/v2/quests/${questId}`,
      questV2DetailSchema,
      options
    );
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
    return this.client
      .send(
        "POST",
        `/api/v2/quests/${questId}/images`,
        questV2ImagesDataSchema,
        {
          form: formData,
          idempotencyKey,
        }
      )
      .then((data) => data.images);
  }

  async listMine(
    params: {
      cursor?: string;
      limit?: number;
    } = {},
    options?: RequestOptions
  ): Promise<{ items: QuestV2CanonicalQuest[]; nextCursor: string | null }> {
    return this.client.get("/api/v2/quests/mine", questV2MineDataSchema, {
      ...options,
      query: params,
    });
  }
  async listMyAssignments(
    status?: QuestV2AssignmentMineStatus,
    options?: RequestOptions
  ): Promise<QuestV2Assignment[]> {
    const data = await this.client.get(
      "/api/v2/assignments/mine",
      questV2AssignmentsDataSchema,
      { ...options, query: { status } }
    );
    return data.items;
  }

  async listQuestAssignments(
    questId: string,
    options?: RequestOptions
  ): Promise<QuestV2Assignment[]> {
    const data = await this.client.get(
      `/api/v2/quests/${questId}/assignments`,
      questV2AssignmentsDataSchema,
      options
    );
    return data.items;
  }

  async createQuest(
    payload: CreateQuestV2Payload,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2CanonicalQuest> {
    const validatedPayload = questV2CreatePayloadSchema.parse(payload);
    return this.client.send(
      "POST",
      "/api/v2/quests",
      questV2CanonicalQuestSchema,
      {
        json: validatedPayload,
        idempotencyKey,
      }
    );
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
    return this.client.send(
      "PATCH",
      `/api/v2/quests/${questId}`,
      questV2CanonicalQuestSchema,
      {
        json: validatedPayload,
        idempotencyKey: options.idempotencyKey ?? createQuestIdempotencyKey(),
        headers: { "If-Match": String(options.version) },
      }
    );
  }

  async getPublishCheck(
    questId: string,
    options?: RequestOptions
  ): Promise<QuestV2PublishCheck> {
    return this.client.get(
      `/api/v2/quests/${questId}/publish-check`,
      questV2PublishCheckSchema,
      options
    );
  }

  async publishQuest(
    questId: string,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2CanonicalQuest> {
    const data = await this.client.send(
      "POST",
      `/api/v2/quests/${questId}/publish`,
      questV2PublishDataSchema,
      { json: {}, idempotencyKey }
    );
    return data.quest;
  }

  async cancelQuest(
    questId: string,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2CancellationOutcome> {
    return this.client.send(
      "POST",
      `/api/v2/quests/${questId}/cancel`,
      questV2CancellationOutcomeSchema,
      { json: {}, idempotencyKey }
    );
  }

  async joinQuest(
    questId: string,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2Assignment> {
    return this.client.send(
      "POST",
      `/api/v2/quests/${questId}/join`,
      questV2AssignmentSchema,
      { json: {}, idempotencyKey }
    );
  }

  async confirmCompletion(
    questId: string,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2Completion> {
    return this.client.send(
      "POST",
      `/api/v2/quests/${questId}/completion-confirmation`,
      questV2CompletionSchema,
      { json: {}, idempotencyKey }
    );
  }

  /** Records Start Work for the viewer's Active Assignment; no request body. */
  async startWork(
    questId: string,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2StartWork> {
    return this.client.send(
      "POST",
      `/api/v2/quests/${questId}/start-work`,
      questV2StartWorkSchema,
      { idempotencyKey }
    );
  }

  async deleteQuestImage(
    questId: string,
    imageId: string,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2Image[]> {
    const data = await this.client.send(
      "DELETE",
      `/api/v2/quests/${questId}/images/${imageId}`,
      questV2ImagesDataSchema,
      { idempotencyKey }
    );
    return data.images;
  }

  async applyQuest(
    questId: string,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2Application> {
    return this.client.send(
      "POST",
      `/api/v2/quests/${questId}/applications`,
      questV2ApplicationSchema,
      { json: {}, idempotencyKey }
    );
  }

  async listApplications(
    questId: string,
    options?: RequestOptions
  ): Promise<QuestV2Application[]> {
    const data = await this.client.get(
      `/api/v2/quests/${questId}/applications`,
      questV2ApplicationListDataSchema,
      options
    );
    return data.items;
  }

  async getApplication(
    questId: string,
    applicationId: string,
    options?: RequestOptions
  ): Promise<QuestV2Application> {
    return this.client.get(
      `/api/v2/quests/${questId}/applications/${applicationId}`,
      questV2ApplicationSchema,
      options
    );
  }

  async withdrawApplication(
    questId: string,
    applicationId: string,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2Application> {
    return this.client.send(
      "POST",
      `/api/v2/quests/${questId}/applications/${applicationId}/withdraw`,
      questV2ApplicationSchema,
      { json: {}, idempotencyKey }
    );
  }

  async selectApplication(
    questId: string,
    applicationId: string,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2ApplicationSelection> {
    return this.client.send(
      "POST",
      `/api/v2/quests/${questId}/applications/${applicationId}/select`,
      questV2ApplicationSelectionSchema,
      { json: {}, idempotencyKey }
    );
  }

  async rejectCandidateApplication(
    questId: string,
    applicationId: string,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2Application> {
    return this.client.send(
      "POST",
      `/api/v2/quests/${questId}/applications/${applicationId}/reject`,
      questV2ApplicationSchema,
      { json: {}, idempotencyKey }
    );
  }

  async createCandidateTeam(
    questId: string,
    payload: { name: string; headcount: number },
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2Team> {
    const validatedPayload = questV2TeamCreatePayloadSchema.parse(payload);
    return this.client.send(
      "POST",
      `/api/v2/quests/${questId}/teams`,
      questV2TeamSchema,
      { json: validatedPayload, idempotencyKey }
    );
  }

  async listCandidateTeams(
    questId: string,
    options?: RequestOptions
  ): Promise<QuestV2Team[]> {
    const data = await this.client.get(
      `/api/v2/quests/${questId}/teams`,
      questV2TeamListDataSchema,
      options
    );
    return data.items;
  }

  async getCandidateTeam(
    questId: string,
    teamId: string,
    options?: RequestOptions
  ): Promise<QuestV2Team> {
    return this.client.get(
      `/api/v2/quests/${questId}/teams/${teamId}`,
      questV2TeamSchema,
      options
    );
  }

  async updateCandidateTeam(
    questId: string,
    teamId: string,
    payload: { name: string },
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2Team> {
    const validatedPayload = questV2TeamUpdatePayloadSchema.parse(payload);
    return this.client.send(
      "PATCH",
      `/api/v2/quests/${questId}/teams/${teamId}`,
      questV2TeamSchema,
      { json: validatedPayload, idempotencyKey }
    );
  }

  async joinCandidateTeam(
    questId: string,
    teamId: string,
    joinCode: string,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2Team> {
    const validatedPayload = questV2TeamJoinPayloadSchema.parse({
      joinCode: joinCode.toUpperCase(),
    });
    return this.client.send(
      "POST",
      `/api/v2/quests/${questId}/teams/${teamId}/join`,
      questV2TeamSchema,
      { json: validatedPayload, idempotencyKey }
    );
  }

  async leaveCandidateTeam(
    questId: string,
    teamId: string,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2Team> {
    return this.client.send(
      "POST",
      `/api/v2/quests/${questId}/teams/${teamId}/leave`,
      questV2TeamSchema,
      { idempotencyKey }
    );
  }

  async removeCandidateTeamMember(
    questId: string,
    teamId: string,
    memberId: string,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2Team> {
    return this.client.send(
      "DELETE",
      `/api/v2/quests/${questId}/teams/${teamId}/members/${memberId}`,
      questV2TeamSchema,
      { idempotencyKey }
    );
  }

  async regenerateCandidateTeamJoinCode(
    questId: string,
    teamId: string,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2Team> {
    return this.client.send(
      "POST",
      `/api/v2/quests/${questId}/teams/${teamId}/join-code`,
      questV2TeamSchema,
      { idempotencyKey }
    );
  }

  async uploadCandidateTeamFile(
    questId: string,
    teamId: string,
    asset: UploadAsset,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2TeamFile> {
    const formData = new FormData();
    appendUploadFile(formData, "file", asset, `team-${teamId}`);
    return this.client.send(
      "POST",
      `/api/v2/quests/${questId}/teams/${teamId}/files`,
      questV2TeamFileSchema,
      { form: formData, idempotencyKey }
    );
  }

  async submitCandidateTeam(
    questId: string,
    teamId: string,
    payload: { text?: string; fileIds?: string[] },
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2Team> {
    const validatedPayload = questV2TeamSubmitPayloadSchema.parse({
      text: payload.text ?? "",
      fileIds: payload.fileIds ?? [],
    });
    return this.client.send(
      "POST",
      `/api/v2/quests/${questId}/teams/${teamId}/submit`,
      questV2TeamSchema,
      { json: validatedPayload, idempotencyKey }
    );
  }

  async selectCandidateTeam(
    questId: string,
    teamId: string,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2TeamSelection> {
    return this.client.send(
      "POST",
      `/api/v2/quests/${questId}/teams/${teamId}/select`,
      questV2TeamSelectionSchema,
      { idempotencyKey }
    );
  }

  async rejectCandidateTeam(
    questId: string,
    teamId: string,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2Team> {
    return this.client.send(
      "POST",
      `/api/v2/quests/${questId}/teams/${teamId}/reject`,
      questV2TeamSchema,
      { idempotencyKey }
    );
  }

  async getUnderfilled(
    questId: string,
    options?: RequestOptions
  ): Promise<QuestV2Underfilled> {
    return this.client.get(
      `/api/v2/quests/${questId}/underfilled`,
      questV2UnderfilledSchema,
      options
    );
  }

  async decideUnderfilled(
    questId: string,
    decision: "PROCEED" | "CANCEL",
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2Underfilled> {
    const validatedPayload = questV2UnderfilledDecisionPayloadSchema.parse({
      decision,
    });
    return this.client.send(
      "POST",
      `/api/v2/quests/${questId}/underfilled/decision`,
      questV2UnderfilledSchema,
      { json: validatedPayload, idempotencyKey }
    );
  }

  async respondUnderfilledConsent(
    questId: string,
    decision: "ACCEPT" | "DECLINE",
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2Underfilled> {
    const validatedPayload = questV2UnderfilledConsentPayloadSchema.parse({
      decision,
    });
    return this.client.send(
      "POST",
      `/api/v2/quests/${questId}/underfilled/consent`,
      questV2UnderfilledSchema,
      { json: validatedPayload, idempotencyKey }
    );
  }

  async createEditRequest(
    questId: string,
    payload: QuestV2CreateEditRequestPayload,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2EditRequest> {
    const validatedPayload =
      questV2EditRequestCreatePayloadSchema.parse(payload);
    return this.client.send(
      "POST",
      `/api/v2/quests/${questId}/edit-requests`,
      questV2EditRequestSchema,
      { json: validatedPayload, idempotencyKey }
    );
  }

  async getEditRequest(
    requestId: string,
    options?: RequestOptions
  ): Promise<QuestV2EditRequest> {
    return this.client.get(
      `/api/v2/quests/edit-requests/${requestId}`,
      questV2EditRequestSchema,
      options
    );
  }

  async respondToEditRequest(
    requestId: string,
    payload: QuestV2EditRequestResponsePayload,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2EditRequest> {
    const validatedPayload =
      questV2EditRequestRespondPayloadSchema.parse(payload);
    return this.client.send(
      "POST",
      `/api/v2/quests/edit-requests/${requestId}/respond`,
      questV2EditRequestSchema,
      { json: validatedPayload, idempotencyKey }
    );
  }

  async createProofDraft(
    questId: string,
    payload:
      | QuestV2ProofCreatePayload
      | { assets: UploadAsset[]; description?: string },
    idempotencyKey = createQuestIdempotencyKey()
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
      return this.client.send(
        "POST",
        `/api/v2/quests/${questId}/proof-submissions`,
        questV2ProofSubmissionSchema,
        { form: formData, idempotencyKey }
      );
    }
    const validatedPayload = questV2ProofCreatePayloadSchema.parse(payload);
    return this.client.send(
      "POST",
      `/api/v2/quests/${questId}/proof-submissions`,
      questV2ProofSubmissionSchema,
      { json: validatedPayload, idempotencyKey }
    );
  }

  async updateProofDraft(
    questId: string,
    proofSubmissionId: string,
    payload:
      | QuestV2ProofUpdatePayload
      | QuestV2ProofRetryPayload
      | QuestV2ProofFileUploadPayload,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2ProofSubmission> {
    if ("assets" in payload) {
      if (payload.assets.length < 1 || payload.assets.length > 5) {
        throw new Error("Proof submissions allow one to five files");
      }
      if (
        payload.description !== undefined &&
        payload.description.length > 1000
      ) {
        throw new Error("Proof descriptions must be at most 1000 characters");
      }
      if (payload.retryPosition !== undefined && payload.assets.length !== 1) {
        throw new Error("Proof retries require exactly one file");
      }
      if (payload.retryPosition !== undefined) {
        questV2ProofRetryPayloadSchema.parse({
          description: payload.description,
          retryPosition: payload.retryPosition,
        });
      }
      const formData = new FormData();
      if (payload.description !== undefined) {
        formData.append("description", payload.description);
      }
      if (payload.retryPosition !== undefined) {
        formData.append("retryPosition", String(payload.retryPosition));
      }
      payload.assets.forEach((asset, index) =>
        appendUploadFile(formData, "files", asset, `proof-${index}`)
      );
      return this.client.send(
        "PATCH",
        `/api/v2/quests/${questId}/proof-submissions/${proofSubmissionId}`,
        questV2ProofSubmissionSchema,
        { form: formData, idempotencyKey }
      );
    }
    const validatedPayload = questV2ProofUpdatePayloadSchema.parse(payload);
    return this.client.send(
      "PATCH",
      `/api/v2/quests/${questId}/proof-submissions/${proofSubmissionId}`,
      questV2ProofSubmissionSchema,
      { json: validatedPayload, idempotencyKey }
    );
  }

  async deleteProofDraft(
    questId: string,
    proofSubmissionId: string,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2ProofDelete> {
    return this.client.send(
      "DELETE",
      `/api/v2/quests/${questId}/proof-submissions/${proofSubmissionId}`,
      questV2ProofDeleteSchema,
      { idempotencyKey }
    );
  }

  async submitProofDraft(
    questId: string,
    proofSubmissionId: string,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2ProofSubmission> {
    return this.client.send(
      "POST",
      `/api/v2/quests/${questId}/proof-submissions/${proofSubmissionId}/submit`,
      questV2ProofSubmissionSchema,
      { json: {}, idempotencyKey }
    );
  }

  async listProofSubmissions(
    questId: string,
    options?: RequestOptions
  ): Promise<QuestV2ProofSubmission[]> {
    const data = await this.client.get(
      `/api/v2/quests/${questId}/proof-submissions`,
      questV2ProofListDataSchema,
      options
    );
    return data.items;
  }

  async getProofFileLink(
    questId: string,
    proofSubmissionId: string,
    fileId: string,
    options?: RequestOptions
  ): Promise<QuestV2ProofFileLink> {
    return this.client.get(
      `/api/v2/quests/${questId}/proof-submissions/${proofSubmissionId}/files/${fileId}`,
      questV2ProofFileLinkSchema,
      options
    );
  }

  async reviewProof(
    questId: string,
    proofSubmissionId: string,
    payload: QuestV2ProofReviewPayload,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2ProofReview> {
    const validatedPayload = questV2ProofReviewPayloadSchema.parse(payload);
    return this.client.send(
      "POST",
      `/api/v2/quests/${questId}/proof-submissions/${proofSubmissionId}/review`,
      questV2ProofReviewSchema,
      { json: validatedPayload, idempotencyKey }
    );
  }

  async createReview(
    questId: string,
    input: QuestV2ReviewPayload,
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2Review> {
    const validatedPayload = questV2ReviewCreatePayloadSchema.parse(input);
    return this.client.send(
      "POST",
      `/api/v2/quests/${questId}/reviews`,
      questV2ReviewSchema,
      { json: validatedPayload, idempotencyKey }
    );
  }

  async updateReview(
    questId: string,
    reviewId: string,
    input: { rating?: number; comment?: string },
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2Review> {
    const validatedPayload = questV2ReviewUpdatePayloadSchema.parse(input);
    return this.client.send(
      "PATCH",
      `/api/v2/quests/${questId}/reviews/${reviewId}`,
      questV2ReviewSchema,
      { json: validatedPayload, idempotencyKey }
    );
  }
}

export const questApi = new QuestApi();
