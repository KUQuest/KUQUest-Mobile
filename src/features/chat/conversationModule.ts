import {
  chatApi,
  serverConversationToChatConversation,
  serverMessageToChatMessage,
} from "@/api/ChatApi";
import type { ServerChatConversation, ServerChatMessage } from "@/api/ChatApi";
import type { ChatConversation, ChatMessage } from "./chatTypes";

/** The one chat data entry point for the chat screens; `chatApi` sits behind it. */
export interface ConversationTransport {
  listConversations(): Promise<{
    items: ServerChatConversation[];
    nextCursor: string | null;
  }>;
  getMessages(conversationId: string): Promise<{
    items: ServerChatMessage[];
    nextCursor: string | null;
    hasMore: boolean;
  }>;
  sendMessage(conversationId: string, body: string): Promise<ServerChatMessage>;
}

export interface LoadedConversation {
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  canPost: boolean;
}

export class ConversationModule {
  constructor(private readonly transport: ConversationTransport = chatApi) {}

  async listConversations(viewerId: string): Promise<ChatConversation[]> {
    const data = await this.transport.listConversations();
    return data.items.map((conversation) =>
      serverConversationToChatConversation(conversation, viewerId)
    );
  }

  async loadConversation(
    conversationId: string,
    viewerId: string
  ): Promise<LoadedConversation> {
    const conversationData = await this.transport.listConversations();
    const serverConversation = conversationData.items.find(
      (item) => item.id === conversationId
    );
    if (!serverConversation) {
      return { conversation: null, messages: [], canPost: false };
    }
    const messageData = await this.transport.getMessages(conversationId);
    const conversation = serverConversationToChatConversation(
      serverConversation,
      viewerId
    );
    return {
      conversation,
      messages: messageData.items.map((message) =>
        serverMessageToChatMessage(message, viewerId)
      ),
      canPost: Boolean(
        conversation.capability?.canRead &&
        conversation.capability.canWrite &&
        !conversation.capability.readOnly
      ),
    };
  }

  async sendMessage(
    conversationId: string,
    body: string,
    viewerId: string
  ): Promise<ChatMessage> {
    const sentMessage = await this.transport.sendMessage(conversationId, body);
    return serverMessageToChatMessage(sentMessage, viewerId);
  }
}

export const conversationModule = new ConversationModule();
