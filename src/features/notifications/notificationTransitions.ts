import type {
  QuestV2CandidateApplication,
  QuestV2MyAssignment,
  QuestV2UnderfilledCancellationReason,
} from "@/api/questV2Contracts";
import type { ChatConversation } from "@/features/chat/chatTypes";
import {
  QuestApplicationStatus,
  QuestAssignmentStatus,
  QuestStatus,
  QuestTeamStatus,
  QuestUnderfilledState,
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

export type WorkerQuestNoticeKind =
  "RESPONSE_REQUIRED" | "DECISION_PENDING" | "FULL_OR_ASSIGNED" | "CANCELLED";

export interface WorkerQuestNoticeTransition {
  questId: string;
  kind: WorkerQuestNoticeKind;
  cancellationReason: QuestV2UnderfilledCancellationReason | null;
  href: "/quest/[id]" | "/quest/[id]/partial-start";
}

export function getWorkerAssignmentNoticeKind(
  assignment: QuestV2MyAssignment
): WorkerQuestNoticeKind | null {
  const underfilled = assignment.underfilled;
  if (underfilled?.state === QuestUnderfilledState.UNDERFILLED_CANCELLED) {
    return "CANCELLED";
  }
  if (assignment.state !== QuestAssignmentStatus.ASSIGNMENT_ACTIVE) return null;
  if (
    underfilled?.state === QuestUnderfilledState.UNDERFILLED_CONSENT_PENDING
  ) {
    return "RESPONSE_REQUIRED";
  }
  if (
    underfilled?.state === QuestUnderfilledState.UNDERFILLED_DECISION_PENDING
  ) {
    return "DECISION_PENDING";
  }
  if (
    underfilled?.state === QuestUnderfilledState.UNDERFILLED_COMPLETED &&
    (assignment.questState === QuestStatus.QUEST_ASSIGNED ||
      assignment.questState === QuestStatus.QUEST_IN_PROGRESS)
  ) {
    return "FULL_OR_ASSIGNED";
  }
  return assignment.questState === QuestStatus.QUEST_ASSIGNED ||
    assignment.questState === QuestStatus.QUEST_IN_PROGRESS
    ? "FULL_OR_ASSIGNED"
    : null;
}

export function detectWorkerQuestTransitions(
  previous: ReadonlyMap<string, WorkerQuestNoticeKind | null> | null,
  assignments: readonly QuestV2MyAssignment[]
): WorkerQuestNoticeTransition[] {
  if (!previous) return [];
  const transitions: WorkerQuestNoticeTransition[] = [];
  for (const assignment of assignments) {
    const kind = getWorkerAssignmentNoticeKind(assignment);
    if (!kind || previous.get(assignment.questId) === kind) continue;
    transitions.push({
      questId: assignment.questId,
      kind,
      cancellationReason: assignment.underfilled?.cancellationReason ?? null,
      href:
        kind === "RESPONSE_REQUIRED"
          ? "/quest/[id]/partial-start"
          : "/quest/[id]",
    });
  }
  return transitions;
}

export function shouldSuppressWorkerQuestNotice(
  pathname: string,
  questId: string,
  href: WorkerQuestNoticeTransition["href"]
): boolean {
  const segments = pathname.split("/").filter(Boolean);
  return (
    segments[0] === "quest" &&
    segments[1] === questId &&
    (href === "/quest/[id]/partial-start"
      ? segments[2] === "partial-start"
      : segments.length === 2)
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
