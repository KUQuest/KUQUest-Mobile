import type { ChatRouteParams } from './chatTypes';

export type {
  ChatAttachment,
  ChatConversation,
  ChatMessage,
  ChatRouteParams,
  LocalizedText,
} from './chatTypes';

/**
 * Keep only stable identifiers on the chat route. Conversation membership and
 * write capability are re-derived by Quest Workflow for the explicit viewer.
 */
export function getChatRouteParams({
  conversationId,
  questId,
  viewerId,
  ownerName,
  questTitle,
}: {
  conversationId: string;
  questId?: string;
  viewerId: string;
  ownerName?: string;
  questTitle?: string;
}): ChatRouteParams {
  return {
    id: conversationId,
    conversationId,
    ...(questId ? { questId } : {}),
    viewerId,
    ...(ownerName ? { ownerName } : {}),
    ...(questTitle ? { questTitle } : {}),
  };
}
