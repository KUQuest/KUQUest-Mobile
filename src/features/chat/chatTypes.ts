import type { SupportedLocale } from "@/locales/locale";
import type {
  QuestStatus,
  WorkConversationCapability,
} from "../questBoard/domain/types";

export const ConversationMode = {
  WORK: "WORK",
  CANDIDATE_INQUIRY: "CANDIDATE_INQUIRY",
} as const;

export type ConversationMode =
  (typeof ConversationMode)[keyof typeof ConversationMode];

export function isWorkConversation(
  mode: unknown
): mode is typeof ConversationMode.WORK {
  return mode === ConversationMode.WORK;
}

export function isCandidateInquiryConversation(
  mode: unknown
): mode is typeof ConversationMode.CANDIDATE_INQUIRY {
  return mode === ConversationMode.CANDIDATE_INQUIRY;
}
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
  kind?: "USER" | "SYSTEM";
  pending?: boolean;
  hidden?: boolean;
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
