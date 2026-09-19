import type { SupportedLocale } from "@/locales/locale";
import type {
  QuestStatus,
  WorkConversationCapability,
} from "../questBoard/types";

export type LocalizedText = Record<SupportedLocale, string>;

export interface ChatAttachment {
  name: string;
  meta: string;
  kind: "pdf" | "image" | "file";
}

export interface ChatMessage {
  id: string;
  sender: "me" | "other";
  text?: LocalizedText;
  createdAt: string;
  attachment?: ChatAttachment;
}

export interface ChatConversation {
  /** Conversation id returned by Quest authority; clients must not derive one for new conversations. */
  id: string;
  questId?: string;
  status?: QuestStatus;
  capability?: WorkConversationCapability;
  questTitle: LocalizedText;
  participantId?: string;
  participantName: string;
  participantRole: "owner" | "member";
  participantAvatarUrl?: string;
  participantAvatarFileId?: string;
  initials: string;
  avatarColor: string;
  latestMessage: LocalizedText;
  latestAt: string;
  unreadCount: number;
  messages: ChatMessage[];
}

export type ChatRouteParams = {
  id: string;
  conversationId: string;
  questId?: string;
  viewerId: string;
  ownerName?: string;
  questTitle?: string;
};
