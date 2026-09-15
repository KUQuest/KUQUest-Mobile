import { z } from "zod";
import { ApiClient } from "./ApiClient";
import type {
  ChatConversation,
  ChatMessage,
  LocalizedText,
} from "@/features/chat/chatTypes";
import type { QuestStatus } from "@/features/questBoard/types";

export const chatAttachmentSchema = z.object({
  id: z.string().min(1),
  fileName: z.string(),
  mediaType: z.string(),
  sizeBytes: z.number().int().positive(),
  createdAt: z.string(),
});

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

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch {
    return "";
  }
}

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
    time: formatTime(msg.createdAt),
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
    latestTime: conv.latestMessage
      ? formatTime(conv.latestMessage.createdAt)
      : "",
    unreadCount: conv.unreadCount,
    messages: [],
  };
}

export class ChatApi {
  constructor(private readonly client: ApiClient = new ApiClient()) {}

  async listConversations(
    params: {
      limit?: number;
      cursor?: string;
    } = {}
  ): Promise<{ items: ServerChatConversation[]; nextCursor: string | null }> {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", String(params.limit));
    if (params.cursor) query.set("cursor", params.cursor);

    const queryString = query.toString();
    const endpoint = `/api/v1/chat/conversations${queryString ? `?${queryString}` : ""}`;
    const body = await this.client.request<unknown>(endpoint);
    return chatConversationListResponseSchema.parse(body).data;
  }

  async getMessages(
    conversationId: string,
    params: { limit?: number; before?: string; after?: string } = {}
  ): Promise<{
    items: ServerChatMessage[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", String(params.limit));
    if (params.before) query.set("before", params.before);
    if (params.after) query.set("after", params.after);

    const queryString = query.toString();
    const endpoint = `/api/v1/chat/conversations/${conversationId}/messages${queryString ? `?${queryString}` : ""}`;
    const body = await this.client.request<unknown>(endpoint);
    return chatMessageListResponseSchema.parse(body).data;
  }

  async sendMessage(
    conversationId: string,
    text: string,
    clientMessageId: string = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  ): Promise<ServerChatMessage> {
    const body = await this.client.requestJson<unknown>(
      `/api/v1/chat/conversations/${conversationId}/messages`,
      { clientMessageId, text },
      { method: "POST" }
    );
    return chatSendMessageResponseSchema.parse(body).data.message;
  }

  async markRead(conversationId: string, messageId: string): Promise<void> {
    await this.client.requestJson<unknown>(
      `/api/v1/chat/conversations/${conversationId}/read`,
      { messageId },
      { method: "POST" }
    );
  }
}

export const chatApi = new ChatApi();
