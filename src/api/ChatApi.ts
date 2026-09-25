import { z } from "zod";
import { ApiClient, type RequestOptions } from "./ApiClient";
import { appendUploadFile, type UploadAsset } from "./fileUpload";
import type {
  ChatConversation,
  ChatMessage,
  LocalizedText,
} from "@/features/chat/chatTypes";
import type { QuestStatus } from "@/domain/questLifecycle";
const positiveWireIntegerSchema = z.union([
  z.number().int().positive(),
  z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()),
]);

export const chatAttachmentSchema = z.object({
  id: z.string().min(1),
  fileName: z.string(),
  mediaType: z.string(),
  sizeBytes: positiveWireIntegerSchema,
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  createdAt: z.string(),
});
export type ServerChatAttachment = z.infer<typeof chatAttachmentSchema>;
export const chatMessageSchema = z.object({
  id: z.string().min(1),
  conversationId: z.string().min(1),
  sequence: positiveWireIntegerSchema,
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

export const chatConversationPageDataSchema = z.object({
  items: z.array(chatConversationSchema),
  nextCursor: z.string().nullable(),
});

export const chatMessagePageDataSchema = z.object({
  items: z.array(chatMessageSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export const chatSendMessageDataSchema = z.object({
  message: chatMessageSchema,
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

export const chatParticipantsDataSchema = z.object({
  participants: z.array(chatParticipantSchema),
});
export const chatAttachmentDataSchema = z.object({
  attachment: chatAttachmentSchema,
});
export const chatAttachmentDeleteDataSchema = z.object({
  attachmentId: z.string().min(1),
});
export const chatReadCursorSchema = z.object({
  conversationId: z.string().min(1),
  messageId: z.string().min(1),
});
export type ServerChatReadCursor = z.infer<typeof chatReadCursorSchema>;

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
export const candidateInquiryDataSchema = z.object({
  inquiry: candidateInquirySummarySchema,
});
export const candidateInquiryPageDataSchema = z.object({
  items: z.array(candidateInquirySummarySchema),
  nextCursor: z.string().nullable(),
});
export const candidateInquiryParticipantsDataSchema = z.object({
  participants: z.array(candidateInquiryParticipantSchema),
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
    return this.client.get(
      "/api/v1/chat/conversations",
      chatConversationPageDataSchema,
      {
        ...options,
        query: { limit: params.limit, cursor: params.cursor },
      }
    );
  }

  async getMessages(
    conversationId: string,
    params: { limit?: number; before?: string; after?: string } = {},
    options?: RequestOptions
  ): Promise<ServerChatMessagePage> {
    return this.client.get(
      `/api/v1/chat/conversations/${conversationId}/messages`,
      chatMessagePageDataSchema,
      {
        ...options,
        query: {
          limit: params.limit,
          before: params.before,
          after: params.after,
        },
      }
    );
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
    const result = await this.client.send(
      "POST",
      `/api/v1/chat/conversations/${conversationId}/messages`,
      chatSendMessageDataSchema,
      {
        json: {
          clientMessageId,
          ...(text?.trim() ? { text } : {}),
          ...(attachmentIds ? { attachmentIds } : {}),
        },
      }
    );
    return result.message;
  }

  async listParticipants(
    conversationId: string,
    options?: RequestOptions
  ): Promise<ServerChatParticipant[]> {
    const result = await this.client.get(
      `/api/v1/chat/conversations/${conversationId}/participants`,
      chatParticipantsDataSchema,
      options
    );
    return result.participants;
  }

  async uploadAttachment(
    conversationId: string,
    asset: UploadAsset
  ): Promise<ServerChatAttachment> {
    const formData = new FormData();
    appendUploadFile(formData, "file", asset, "chat-attachment");
    const result = await this.client.send(
      "POST",
      `/api/v1/chat/conversations/${conversationId}/attachments`,
      chatAttachmentDataSchema,
      { form: formData }
    );
    return result.attachment;
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
    const link = await this.client.get(
      `/api/v1/chat/conversations/${conversationId}/attachments/${attachmentId}/link`,
      chatAttachmentLinkSchema,
      { signal: options?.signal }
    );
    this.cacheAttachmentLink(attachmentId, link);
    return link;
  }

  async deleteAttachment(
    conversationId: string,
    attachmentId: string
  ): Promise<{ attachmentId: string }> {
    this.attachmentLinkCache.delete(attachmentId);
    return this.client.send(
      "DELETE",
      `/api/v1/chat/conversations/${conversationId}/attachments/${attachmentId}`,
      chatAttachmentDeleteDataSchema
    );
  }

  async markRead(
    conversationId: string,
    messageId: string
  ): Promise<ServerChatReadCursor> {
    const result = await this.client.send(
      "POST",
      `/api/v1/chat/conversations/${conversationId}/read`,
      chatReadCursorSchema,
      { json: { messageId } }
    );
    return result;
  }

  getWorkConversationEventsPath(conversationId: string): string {
    return `/api/v1/chat/conversations/${encodeURIComponent(conversationId)}/events`;
  }

  async createCandidateInquiry(
    questId: string
  ): Promise<ServerCandidateInquiry> {
    const result = await this.client.send(
      "POST",
      "/api/v1/chat/candidate-inquiries",
      candidateInquiryDataSchema,
      { json: { questId } }
    );
    return result.inquiry;
  }

  async listCandidateInquiries(
    params: { limit?: number; cursor?: string } = {},
    options?: RequestOptions
  ): Promise<ServerCandidateInquiryPage> {
    return this.client.get(
      "/api/v1/chat/candidate-inquiries",
      candidateInquiryPageDataSchema,
      {
        ...options,
        query: { limit: params.limit, cursor: params.cursor },
      }
    );
  }
  async getCandidateInquiry(
    conversationId: string,
    options?: RequestOptions
  ): Promise<ServerCandidateInquiry> {
    const result = await this.client.get(
      `/api/v1/chat/candidate-inquiries/${conversationId}`,
      candidateInquiryDataSchema,
      options
    );
    return result.inquiry;
  }
  async listCandidateInquiryParticipants(
    conversationId: string,
    options?: RequestOptions
  ): Promise<CandidateInquiryParticipant[]> {
    const result = await this.client.get(
      `/api/v1/chat/candidate-inquiries/${conversationId}/participants`,
      candidateInquiryParticipantsDataSchema,
      options
    );
    return result.participants;
  }
  async getCandidateInquiryMessages(
    conversationId: string,
    params: { limit?: number; before?: string; after?: string } = {},
    options?: RequestOptions
  ): Promise<ServerChatMessagePage> {
    return this.client.get(
      `/api/v1/chat/candidate-inquiries/${conversationId}/messages`,
      chatMessagePageDataSchema,
      {
        ...options,
        query: {
          limit: params.limit,
          before: params.before,
          after: params.after,
        },
      }
    );
  }

  async sendCandidateInquiryMessage(
    conversationId: string,
    text?: string,
    clientMessageId: string = `inquiry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    attachmentIds?: string[]
  ): Promise<ServerChatMessage> {
    const result = await this.client.send(
      "POST",
      `/api/v1/chat/candidate-inquiries/${conversationId}/messages`,
      chatSendMessageDataSchema,
      {
        json: {
          clientMessageId,
          ...(text?.trim() ? { text } : {}),
          ...(attachmentIds ? { attachmentIds } : {}),
        },
      }
    );
    return result.message;
  }

  async markCandidateInquiryRead(
    conversationId: string,
    messageId: string
  ): Promise<ServerChatReadCursor> {
    return this.client.send(
      "POST",
      `/api/v1/chat/candidate-inquiries/${conversationId}/read`,
      chatReadCursorSchema,
      { json: { messageId } }
    );
  }

  async uploadCandidateInquiryAttachment(
    conversationId: string,
    asset: UploadAsset
  ): Promise<ServerChatAttachment> {
    const formData = new FormData();
    appendUploadFile(formData, "file", asset, "inquiry-attachment");
    const result = await this.client.send(
      "POST",
      `/api/v1/chat/candidate-inquiries/${conversationId}/attachments`,
      chatAttachmentDataSchema,
      { form: formData }
    );
    return result.attachment;
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
    const link = await this.client.get(
      `/api/v1/chat/candidate-inquiries/${conversationId}/attachments/${attachmentId}/link`,
      chatAttachmentLinkSchema,
      { signal: options?.signal }
    );
    this.cacheAttachmentLink(attachmentId, link);
    return link;
  }

  async deleteCandidateInquiryAttachment(
    conversationId: string,
    attachmentId: string
  ): Promise<{ attachmentId: string }> {
    this.attachmentLinkCache.delete(attachmentId);
    return this.client.send(
      "DELETE",
      `/api/v1/chat/candidate-inquiries/${conversationId}/attachments/${attachmentId}`,
      chatAttachmentDeleteDataSchema
    );
  }

  getCandidateInquiryEventsPath(conversationId: string): string {
    return `/api/v1/chat/candidate-inquiries/${encodeURIComponent(conversationId)}/events`;
  }
}

export const chatApi = new ChatApi();
