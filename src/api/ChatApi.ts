import { z } from "zod";
import { ApiClient } from "./ApiClient";
import type { RequestOptions } from "./WalletApi";
import { appendUploadFile, type UploadAsset } from "./fileUpload";
import type {
  ChatConversation,
  ChatMessage,
  LocalizedText,
} from "@/features/chat/chatTypes";
import type { QuestStatus } from "@/domain/questLifecycle";
export const chatAttachmentSchema = z.object({
  id: z.string().min(1),
  fileName: z.string(),
  mediaType: z.string(),
  sizeBytes: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  createdAt: z.string(),
});
export type ServerChatAttachment = z.infer<typeof chatAttachmentSchema>;
export const chatMessageSchema = z.object({
  id: z.string().min(1),
  conversationId: z.string().min(1),
  sequence: z.number().int().positive(),
  kind: z.enum(["USER", "SYSTEM"]),
  sender: z
    .object({
      id: z.string().nullable(),
      displayName: z.string(),
    })
    .nullable(),
  text: z.string().nullable(),
  attachments: z.array(chatAttachmentSchema).default([]),
  systemType: z.string().nullable().optional(),
  systemPayload: z.record(z.string(), z.unknown()).nullable().optional(),
  eventId: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type ServerChatMessage = z.infer<typeof chatMessageSchema>;

export const chatConversationSchema = z.object({
  id: z.string().min(1),
  type: z.literal("CONVERSATION_WORK"),
  quest: z.object({
    id: z.string().min(1),
    title: z.string(),
    status: z.string(),
  }),
  latestMessage: z
    .object({
      id: z.string().min(1),
      kind: z.enum(["USER", "SYSTEM"]),
      preview: z.string(),
      createdAt: z.string(),
    })
    .nullable(),
  lastActivityAt: z.string().nullable(),
  archived: z.boolean(),
  readOnly: z.boolean(),
  unreadCount: z.number().int().nonnegative(),
});
export type ServerChatConversation = z.infer<typeof chatConversationSchema>;

export const chatConversationListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(chatConversationSchema),
    nextCursor: z.string().nullable(),
  }),
});

export const chatMessageListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(chatMessageSchema),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});

export const chatSendMessageResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    message: chatMessageSchema,
  }),
});
export interface ServerChatConversationPage {
  items: ServerChatConversation[];
  nextCursor: string | null;
}

export interface ServerChatMessagePage {
  items: ServerChatMessage[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ChatConversationSnapshot {
  conversation: ServerChatConversation | null;
  messages: ServerChatMessagePage | null;
}
export const chatAttachmentLinkSchema = z.object({
  attachmentId: z.string().min(1),
  url: z.string(),
  expiresAt: z.string(),
});
export type ServerChatAttachmentLink = z.infer<typeof chatAttachmentLinkSchema>;

export const chatParticipantSchema = z.object({
  id: z.string().nullable(),
  role: z.enum(["HIRER", "WORKER"]),
  displayName: z.string(),
});
export type ServerChatParticipant = z.infer<typeof chatParticipantSchema>;

export const chatParticipantsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ participants: z.array(chatParticipantSchema) }),
});
export const chatAttachmentResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ attachment: chatAttachmentSchema }),
});
export const chatAttachmentLinkResponseSchema = z.object({
  success: z.literal(true),
  data: chatAttachmentLinkSchema,
});
export const chatAttachmentDeleteResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ attachmentId: z.string().min(1) }),
});
export const chatReadResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    conversationId: z.string().min(1),
    messageId: z.string().min(1),
  }),
});
export type ServerChatReadCursor = z.infer<
  typeof chatReadResponseSchema
>["data"];

export const candidateInquiryParticipantSchema = z.object({
  id: z.string().nullable(),
  role: z.enum(["HIRER", "PROSPECTIVE_WORKER"]),
  displayName: z.string(),
});
export type CandidateInquiryParticipant = z.infer<
  typeof candidateInquiryParticipantSchema
>;
const candidateInquirySummarySchema = z.object({
  id: z.string().min(1),
  type: z.literal("CONVERSATION_CANDIDATE_INQUIRY"),
  state: z.literal("INQUIRY_OPEN"),
  quest: z.object({
    id: z.string().min(1),
    title: z.string(),
    status: z.string(),
  }),
  participants: z.array(candidateInquiryParticipantSchema),
  latestMessage: z
    .object({
      id: z.string().min(1),
      kind: z.literal("USER"),
      preview: z.string(),
      createdAt: z.string(),
    })
    .nullable(),
  lastActivityAt: z.string().nullable(),
  unreadCount: z.number().int().nonnegative(),
});
export type ServerCandidateInquiry = z.infer<
  typeof candidateInquirySummarySchema
>;
export interface ServerCandidateInquiryPage {
  items: ServerCandidateInquiry[];
  nextCursor: string | null;
}
export const candidateInquiryResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ inquiry: candidateInquirySummarySchema }),
});
export const candidateInquiryListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(candidateInquirySummarySchema),
    nextCursor: z.string().nullable(),
  }),
});
export const candidateInquiryParticipantsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ participants: z.array(candidateInquiryParticipantSchema) }),
});
export function serverMessageToChatMessage(
  msg: ServerChatMessage,
  currentUserId?: string
): ChatMessage {
  const isMe = currentUserId ? msg.sender?.id === currentUserId : false;
  const text = msg.text || "";
  const localizedText: LocalizedText = { en: text, th: text };

  return {
    id: msg.id,
    sender: isMe ? "me" : "other",
    text: localizedText,
    createdAt: msg.createdAt,
  };
}

export function serverConversationToChatConversation(
  conv: ServerChatConversation,
  currentUserId?: string
): ChatConversation {
  const preview = conv.latestMessage?.preview || "";
  const localizedPreview: LocalizedText = { en: preview, th: preview };
  const localizedTitle: LocalizedText = {
    en: conv.quest.title,
    th: conv.quest.title,
  };

  return {
    id: conv.id,
    questId: conv.quest.id,
    status: conv.quest.status as QuestStatus,
    capability: {
      conversationId: conv.id,
      canRead: true,
      canWrite: !conv.readOnly,
      readOnly: conv.readOnly,
    },
    questTitle: localizedTitle,
    participantName: conv.quest.title,
    participantRole: "member",
    initials: conv.quest.title.slice(0, 2).toUpperCase(),
    avatarColor: "#208AEF",
    latestMessage: localizedPreview,
    latestAt: conv.latestMessage?.createdAt ?? "",
    unreadCount: conv.unreadCount,
    messages: [],
  };
}

export interface CachedChatAttachmentLink {
  attachmentId: string;
  url: string;
  expiresAt: string;
  expiresAtTimestamp: number;
}

export class ChatApi {
  private readonly attachmentLinkCache = new Map<
    string,
    CachedChatAttachmentLink
  >();

  constructor(private readonly client: ApiClient = new ApiClient()) {}

  private parseExpiresAt(expiresAt: string): number {
    const parsed = Date.parse(expiresAt);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
    const numeric = Number(expiresAt);
    return Number.isNaN(numeric) ? 0 : numeric;
  }

  getCachedAttachmentLink(
    attachmentId: string
  ): ServerChatAttachmentLink | null {
    const cached = this.attachmentLinkCache.get(attachmentId);
    if (!cached) {
      return null;
    }
    // 60-second safety window before expiry
    if (Date.now() >= cached.expiresAtTimestamp - 60_000) {
      this.attachmentLinkCache.delete(attachmentId);
      return null;
    }
    return {
      attachmentId: cached.attachmentId,
      url: cached.url,
      expiresAt: cached.expiresAt,
    };
  }

  cacheAttachmentLink(
    attachmentId: string,
    link: ServerChatAttachmentLink
  ): void {
    const expiresAtTimestamp = this.parseExpiresAt(link.expiresAt);
    this.attachmentLinkCache.set(attachmentId, {
      attachmentId: link.attachmentId,
      url: link.url,
      expiresAt: link.expiresAt,
      expiresAtTimestamp,
    });
  }

  clearAttachmentLinkCache(): void {
    this.attachmentLinkCache.clear();
  }
  async listConversations(
    params: {
      limit?: number;
      cursor?: string;
    } = {},
    options?: RequestOptions
  ): Promise<ServerChatConversationPage> {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", String(params.limit));
    if (params.cursor) query.set("cursor", params.cursor);

    const queryString = query.toString();
    const endpoint = `/api/v1/chat/conversations${queryString ? `?${queryString}` : ""}`;
    const body = await this.client.request<unknown>(endpoint, {
      signal: options?.signal,
    });
    return chatConversationListResponseSchema.parse(body).data;
  }

  async getMessages(
    conversationId: string,
    params: { limit?: number; before?: string; after?: string } = {},
    options?: RequestOptions
  ): Promise<ServerChatMessagePage> {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", String(params.limit));
    if (params.before) query.set("before", params.before);
    if (params.after) query.set("after", params.after);

    const queryString = query.toString();
    const endpoint = `/api/v1/chat/conversations/${conversationId}/messages${queryString ? `?${queryString}` : ""}`;
    const body = await this.client.request<unknown>(endpoint, {
      signal: options?.signal,
    });
    return chatMessageListResponseSchema.parse(body).data;
  }

  async loadConversation(
    conversationId: string,
    options?: RequestOptions
  ): Promise<ChatConversationSnapshot> {
    const [conversationResult, messageResult] = await Promise.allSettled([
      this.listConversations({ limit: 20 }, options),
      this.getMessages(conversationId, { limit: 50 }, options),
    ]);
    if (conversationResult.status === "rejected") {
      throw conversationResult.reason;
    }

    const conversation =
      conversationResult.value.items.find(
        (item) => item.id === conversationId
      ) ?? null;
    if (!conversation) {
      return { conversation: null, messages: null };
    }
    if (messageResult.status === "rejected") {
      throw messageResult.reason;
    }

    return { conversation, messages: messageResult.value };
  }

  async sendMessage(
    conversationId: string,
    text?: string,
    clientMessageId: string = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    attachmentIds?: string[]
  ): Promise<ServerChatMessage> {
    const body = await this.client.requestJson<unknown>(
      `/api/v1/chat/conversations/${conversationId}/messages`,
      {
        clientMessageId,
        ...(text?.trim() ? { text } : {}),
        ...(attachmentIds ? { attachmentIds } : {}),
      },
      { method: "POST" }
    );
    return chatSendMessageResponseSchema.parse(body).data.message;
  }

  async listParticipants(
    conversationId: string,
    options?: RequestOptions
  ): Promise<ServerChatParticipant[]> {
    const body = await this.client.request<unknown>(
      `/api/v1/chat/conversations/${conversationId}/participants`,
      { signal: options?.signal }
    );
    return chatParticipantsResponseSchema.parse(body).data.participants;
  }

  async uploadAttachment(
    conversationId: string,
    asset: UploadAsset
  ): Promise<ServerChatAttachment> {
    const formData = new FormData();
    appendUploadFile(formData, "file", asset, "chat-attachment");
    const body = await this.client.requestForm<unknown>(
      `/api/v1/chat/conversations/${conversationId}/attachments`,
      formData,
      { method: "POST" }
    );
    return chatAttachmentResponseSchema.parse(body).data.attachment;
  }

  async getAttachmentLink(
    conversationId: string,
    attachmentId: string,
    options?: RequestOptions & { skipCache?: boolean }
  ): Promise<ServerChatAttachmentLink> {
    if (!options?.skipCache) {
      const cached = this.getCachedAttachmentLink(attachmentId);
      if (cached) {
        return cached;
      }
    }
    const body = await this.client.request<unknown>(
      `/api/v1/chat/conversations/${conversationId}/attachments/${attachmentId}/link`,
      { signal: options?.signal }
    );
    const link = chatAttachmentLinkResponseSchema.parse(body).data;
    this.cacheAttachmentLink(attachmentId, link);
    return link;
  }

  async deleteAttachment(
    conversationId: string,
    attachmentId: string
  ): Promise<{ attachmentId: string }> {
    this.attachmentLinkCache.delete(attachmentId);
    const body = await this.client.request<unknown>(
      `/api/v1/chat/conversations/${conversationId}/attachments/${attachmentId}`,
      { method: "DELETE" }
    );
    return chatAttachmentDeleteResponseSchema.parse(body).data;
  }

  async markRead(
    conversationId: string,
    messageId: string
  ): Promise<ServerChatReadCursor> {
    const body = await this.client.requestJson<unknown>(
      `/api/v1/chat/conversations/${conversationId}/read`,
      { messageId },
      { method: "POST" }
    );
    return chatReadResponseSchema.parse(body).data;
  }

  getWorkConversationEventsPath(conversationId: string): string {
    return `/api/v1/chat/conversations/${conversationId}/events`;
  }

  async createCandidateInquiry(
    questId: string
  ): Promise<ServerCandidateInquiry> {
    const body = await this.client.requestJson<unknown>(
      "/api/v1/chat/candidate-inquiries",
      { questId },
      { method: "POST" }
    );
    return candidateInquiryResponseSchema.parse(body).data.inquiry;
  }

  async listCandidateInquiries(
    params: { limit?: number; cursor?: string } = {},
    options?: RequestOptions
  ): Promise<ServerCandidateInquiryPage> {
    const query = new URLSearchParams();
    if (params.limit !== undefined) query.set("limit", String(params.limit));
    if (params.cursor) query.set("cursor", params.cursor);
    const queryString = query.toString();
    const endpoint = `/api/v1/chat/candidate-inquiries${queryString ? `?${queryString}` : ""}`;
    const body = await this.client.request<unknown>(endpoint, {
      signal: options?.signal,
    });
    return candidateInquiryListResponseSchema.parse(body).data;
  }
  async getCandidateInquiry(
    conversationId: string,
    options?: RequestOptions
  ): Promise<ServerCandidateInquiry> {
    const body = await this.client.request<unknown>(
      `/api/v1/chat/candidate-inquiries/${conversationId}`,
      { signal: options?.signal }
    );
    return candidateInquiryResponseSchema.parse(body).data.inquiry;
  }
  async listCandidateInquiryParticipants(
    conversationId: string,
    options?: RequestOptions
  ): Promise<CandidateInquiryParticipant[]> {
    const body = await this.client.request<unknown>(
      `/api/v1/chat/candidate-inquiries/${conversationId}/participants`,
      { signal: options?.signal }
    );
    return candidateInquiryParticipantsResponseSchema.parse(body).data
      .participants;
  }
  async getCandidateInquiryMessages(
    conversationId: string,
    params: { limit?: number; before?: string; after?: string } = {},
    options?: RequestOptions
  ): Promise<ServerChatMessagePage> {
    const query = new URLSearchParams();
    if (params.limit !== undefined) query.set("limit", String(params.limit));
    if (params.before) query.set("before", params.before);
    if (params.after) query.set("after", params.after);
    const queryString = query.toString();
    const endpoint = `/api/v1/chat/candidate-inquiries/${conversationId}/messages${queryString ? `?${queryString}` : ""}`;
    const body = await this.client.request<unknown>(endpoint, {
      signal: options?.signal,
    });
    return chatMessageListResponseSchema.parse(body).data;
  }

  async sendCandidateInquiryMessage(
    conversationId: string,
    text?: string,
    clientMessageId: string = `inquiry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    attachmentIds?: string[]
  ): Promise<ServerChatMessage> {
    const body = await this.client.requestJson<unknown>(
      `/api/v1/chat/candidate-inquiries/${conversationId}/messages`,
      {
        clientMessageId,
        ...(text?.trim() ? { text } : {}),
        ...(attachmentIds ? { attachmentIds } : {}),
      },
      { method: "POST" }
    );
    return chatSendMessageResponseSchema.parse(body).data.message;
  }

  async markCandidateInquiryRead(
    conversationId: string,
    messageId: string
  ): Promise<ServerChatReadCursor> {
    const body = await this.client.requestJson<unknown>(
      `/api/v1/chat/candidate-inquiries/${conversationId}/read`,
      { messageId },
      { method: "POST" }
    );
    return chatReadResponseSchema.parse(body).data;
  }

  async uploadCandidateInquiryAttachment(
    conversationId: string,
    asset: UploadAsset
  ): Promise<ServerChatAttachment> {
    const formData = new FormData();
    appendUploadFile(formData, "file", asset, "inquiry-attachment");
    const body = await this.client.requestForm<unknown>(
      `/api/v1/chat/candidate-inquiries/${conversationId}/attachments`,
      formData,
      { method: "POST" }
    );
    return chatAttachmentResponseSchema.parse(body).data.attachment;
  }

  async getCandidateInquiryAttachmentLink(
    conversationId: string,
    attachmentId: string,
    options?: RequestOptions & { skipCache?: boolean }
  ): Promise<ServerChatAttachmentLink> {
    if (!options?.skipCache) {
      const cached = this.getCachedAttachmentLink(attachmentId);
      if (cached) {
        return cached;
      }
    }
    const body = await this.client.request<unknown>(
      `/api/v1/chat/candidate-inquiries/${conversationId}/attachments/${attachmentId}/link`,
      { signal: options?.signal }
    );
    const link = chatAttachmentLinkResponseSchema.parse(body).data;
    this.cacheAttachmentLink(attachmentId, link);
    return link;
  }

  async deleteCandidateInquiryAttachment(
    conversationId: string,
    attachmentId: string
  ): Promise<{ attachmentId: string }> {
    this.attachmentLinkCache.delete(attachmentId);
    const body = await this.client.request<unknown>(
      `/api/v1/chat/candidate-inquiries/${conversationId}/attachments/${attachmentId}`,
      { method: "DELETE" }
    );
    return chatAttachmentDeleteResponseSchema.parse(body).data;
  }

  getCandidateInquiryEventsPath(conversationId: string): string {
    return `/api/v1/chat/candidate-inquiries/${conversationId}/events`;
  }
}

export const chatApi = new ChatApi();
