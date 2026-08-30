import type { SupportedLocale } from '../../locales/LocaleProvider';
import type { QuestStatus, WorkConversationCapability } from '../questBoard/types';

export type LocalizedText = Record<SupportedLocale, string>;

export interface ChatAttachment {
  name: string;
  meta: string;
  kind: 'pdf' | 'image';
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'other';
  text?: LocalizedText;
  time: string;
  attachment?: ChatAttachment;
}

export interface ChatConversation {
  /** Conversation id returned by Quest authority; clients must not derive one for new conversations. */
  id: string;
  questId?: string;
  status?: QuestStatus;
  capability?: WorkConversationCapability;
  questTitle: LocalizedText;
  participantName: string;
  participantRole: 'owner' | 'member';
  initials: string;
  avatarColor: string;
  latestMessage: LocalizedText;
  latestTime: string;
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
