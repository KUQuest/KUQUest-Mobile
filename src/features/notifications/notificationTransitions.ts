import type { QuestV2CandidateApplication } from "@/api/questV2Contracts";
import type { ChatConversation } from "@/features/chat/chatTypes";
import {
  QuestApplicationStatus,
  QuestTeamStatus,
} from "@/features/questBoard/domain/types";

// The owning Hirer alone creates and publishes a Quest
// (docs/rulebook/quest/quest-work-chat-rulebook.md:56-57); the event has no actor.
const HIRER_INITIATED_CHANGE_TYPES: Record<string, true> = {
  QUEST_CREATED: true,
  QUEST_PUBLISHED: true,
};

export function shouldSuppressHirerQuestNotice(
  pathname: string,
  questId: string,
  changeType: string
): boolean {
  const segments = pathname.split("/").filter(Boolean);
  return (
    (segments[0] === "quest" && segments[1] === questId) ||
    HIRER_INITIATED_CHANGE_TYPES[changeType] === true
  );
}

export function getOpenConversationId(
  pathname: string,
  conversations: readonly ChatConversation[]
): string | undefined {
  const segments = pathname.split("/").filter(Boolean);
  return conversations.find((conversation) =>
    segments.includes(conversation.id)
  )?.id;
}

export function detectUnreadIncreases(
  previous: ReadonlyMap<string, number> | null,
  conversations: readonly ChatConversation[],
  openConversationId?: string
): ChatConversation[] {
  if (!previous) return [];
  return conversations.filter((conversation) => {
    const oldCount = previous.get(conversation.id);
    return (
      conversation.id !== openConversationId &&
      (oldCount === undefined
        ? conversation.unreadCount > 0
        : conversation.unreadCount > oldCount)
    );
  });
}

export function detectApplicationDecisions(
  previous: ReadonlyMap<string, string> | null,
  applications: readonly QuestV2CandidateApplication[]
): QuestV2CandidateApplication[] {
  if (!previous) return [];
  return applications.filter((application) => {
    const oldState = previous.get(application.id);
    const isDecision =
      application.state === QuestApplicationStatus.APPLICATION_SELECTED ||
      application.state === QuestTeamStatus.TEAM_SELECTED ||
      application.state === QuestApplicationStatus.APPLICATION_REJECTED ||
      application.state === QuestTeamStatus.TEAM_REJECTED;
    return (
      isDecision && (oldState === undefined || oldState !== application.state)
    );
  });
}
