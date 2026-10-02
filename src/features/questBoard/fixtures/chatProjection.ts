import type { ChatConversation, ChatMessage } from "@/features/chat/chatTypes";
import type {
  QuestDetailState,
  WorkConversationCapability,
} from "../domain/types";
import { clone } from "../domain/questStateUtils";
import { unique } from "../domain/questSelectors";
import {
  chatSentAt,
  questConversationId,
  type FixtureChatConversation,
  type FixtureChatMessage,
  type FixtureChatSeed,
} from "./chatSeeds";
function ensureConversation(
  state: QuestDetailState,
  memberIds: string[]
): void {
  // IDs come from the fixture's server-shaped conversation seed. The
  // deterministic fallback is used only by custom adapter states that provide
  // no conversation id of their own.
  const conversationId =
    state.conversation.conversationId ?? questConversationId(state.quest.id);
  state.conversation = {
    conversationId,
    canRead: true,
    canWrite: true,
    readOnly: false,
  };
  state.conversationMemberIds = unique([
    ...(state.conversationMemberIds ?? []),
    ...memberIds,
  ]);
}
function hydrateChatSeed(seed: FixtureChatSeed): FixtureChatConversation {
  return {
    id: seed.id,
    questId: seed.questId,
    memberIds: unique(seed.memberIds),
    questTitle: clone(seed.questTitle),
    participantName: seed.participantName,
    participantRole: seed.participantRole,
    initials: seed.initials,
    avatarColor: seed.avatarColor,
    messages: seed.messages.map((message) => ({
      ...message,
      sentAt: message.sentAt ?? chatSentAt(message.minutesAgo),
    })),
    readAt: { ...(seed.readAt ?? {}) },
  };
}
function projectChatMessage(
  message: FixtureChatMessage,
  viewerId: string
): ChatMessage {
  return {
    id: message.id,
    sender: message.senderId === viewerId ? "me" : "other",
    createdAt: message.sentAt,
    ...(message.text ? { text: clone(message.text) } : {}),
    ...(message.attachment ? { attachment: clone(message.attachment) } : {}),
  };
}
function latestChatMessage(
  conversation: FixtureChatConversation
): FixtureChatMessage | undefined {
  return conversation.messages.reduce<FixtureChatMessage | undefined>(
    (latest, message) => {
      if (!latest) return message;
      return new Date(message.sentAt).getTime() >=
        new Date(latest.sentAt).getTime()
        ? message
        : latest;
    },
    undefined
  );
}
function chatUnreadCount(
  conversation: FixtureChatConversation,
  viewerId: string
): number {
  const readAt = conversation.readAt[viewerId];
  const readAtMs = readAt
    ? new Date(readAt).getTime()
    : Number.NEGATIVE_INFINITY;
  return conversation.messages.filter(
    (message) =>
      message.senderId !== viewerId &&
      Number.isFinite(new Date(message.sentAt).getTime()) &&
      new Date(message.sentAt).getTime() > readAtMs
  ).length;
}
function projectChatConversation(
  conversation: FixtureChatConversation,
  viewerId: string,
  capability: WorkConversationCapability,
  state?: QuestDetailState
): ChatConversation {
  const latest = latestChatMessage(conversation);
  const latestMessage = latest?.text
    ? clone(latest.text)
    : {
        en: latest?.attachment?.name ?? "",
        th: latest?.attachment?.name ?? "",
      };
  return {
    id: conversation.id,
    ...(conversation.questId ? { questId: conversation.questId } : {}),
    ...(state ? { status: state.quest.status } : {}),
    capability: clone(capability),
    questTitle: clone(conversation.questTitle),
    participantName: conversation.participantName,
    participantRole: conversation.participantRole,
    initials: conversation.initials,
    avatarColor: conversation.avatarColor,
    latestMessage,
    latestAt: latest?.sentAt ?? "",
    unreadCount: chatUnreadCount(conversation, viewerId),
    messages: conversation.messages
      .slice()
      .sort(
        (left, right) =>
          new Date(left.sentAt).getTime() - new Date(right.sentAt).getTime()
      )
      .map((message) => projectChatMessage(message, viewerId)),
  };
}
export {
  chatUnreadCount,
  ensureConversation,
  hydrateChatSeed,
  latestChatMessage,
  projectChatConversation,
  projectChatMessage,
};
