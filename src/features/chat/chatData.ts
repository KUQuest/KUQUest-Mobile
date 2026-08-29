import type { WorkConversationCapability } from '../questBoard/types';
import type { ChatRouteParams } from './chatTypes';

export type {
  ChatAttachment,
  ChatConversation,
  ChatMessage,
  ChatRouteParams,
  LocalizedText,
} from './chatTypes';

function deniedConversationCapability(conversationId: string): WorkConversationCapability {
  return { conversationId, canRead: false, canWrite: false, readOnly: true, readOnlyReason: 'NOT_A_MEMBER' };
}

function routeCapabilityFor(conversationId: string, capability: WorkConversationCapability | undefined): WorkConversationCapability {
  if (!capability || capability.conversationId !== conversationId || !capability.canRead) return deniedConversationCapability(conversationId);
  const readOnly = capability.readOnly || !capability.canWrite || Boolean(capability.readOnlyReason);
  return {
    ...capability,
    conversationId,
    canRead: true,
    canWrite: !readOnly,
    readOnly,
  };
}

/**
 * Keep the server conversation id and its viewer capability together when a
 * chat route is opened. Route params are strings because Expo Router serializes
 * them into the URL; missing capabilities are explicitly denied.
 */
export function getChatRouteParams({
  conversationId,
  questId,
  viewerId,
  capability,
  ownerName,
  questTitle,
}: {
  conversationId: string;
  questId?: string;
  viewerId: string;
  capability?: WorkConversationCapability;
  ownerName?: string;
  questTitle?: string;
}): ChatRouteParams {
  const routeCapability = routeCapabilityFor(conversationId, capability);
  return {
    id: conversationId,
    conversationId,
    ...(questId ? { questId } : {}),
    viewerId,
    canRead: routeCapability.canRead ? 'true' : 'false',
    canWrite: routeCapability.canWrite ? 'true' : 'false',
    readOnly: routeCapability.readOnly ? 'true' : 'false',
    ...(routeCapability.readOnlyReason ? { readOnlyReason: routeCapability.readOnlyReason } : {}),
    ...(ownerName ? { ownerName } : {}),
    ...(questTitle ? { questTitle } : {}),
  };
}
