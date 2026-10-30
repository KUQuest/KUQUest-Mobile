import { isTerminalStatus } from "@/domain/questLifecycle";
import { getQuestAvailability } from "../presentation/questBoardViewData";
import {
  canonicalToQuestBoardQuest,
  publicDetailToQuestBoardQuest,
} from "../live/liveQuestService";
import type {
  LiveQuestCapabilities,
  LiveQuestSnapshot,
} from "../live/liveQuestTypes";
import {
  isHirerActor,
  QuestApplicationStatus,
  QuestAssignmentStatus,
  QuestNextAction,
  QuestStatus,
  type QuestBoardQuest,
} from "../domain/types";
import type {
  QuestDetailApplicationStatus,
  QuestDetailProjectionCapabilities,
  QuestDetailProjection,
} from "./questDetailTypes";
export type {
  QuestDetailApplicationStatus,
  QuestDetailJoinStatus,
  QuestDetailProjectionCapabilities,
  QuestDetailProjection,
} from "./questDetailTypes";

function liveQuest(
  snapshot: LiveQuestSnapshot,
  acceptedParticipants: number
): QuestBoardQuest {
  return "version" in snapshot.quest
    ? canonicalToQuestBoardQuest(snapshot.quest, { acceptedParticipants })
    : publicDetailToQuestBoardQuest(snapshot.quest, { acceptedParticipants });
}

function liveCapabilities(
  snapshot: LiveQuestSnapshot,
  isOwner: boolean,
  isAssigned: boolean
): QuestDetailProjectionCapabilities {
  const capabilities: LiveQuestCapabilities = snapshot.capabilities;
  const canMessageOwner =
    snapshot.state === QuestStatus.QUEST_OPEN && !isOwner && !isAssigned;
  return {
    canApply: capabilities.canApply,
    canJoin: capabilities.canJoin,
    canWithdrawApplication: capabilities.canWithdrawApplication,
    canCreateTeam: capabilities.canCreateTeam,
    canJoinTeam: capabilities.canJoinTeam,
    canUpdateTeam: capabilities.canUpdateTeam,
    canLeaveTeam: capabilities.canLeaveTeam,
    canRemoveTeamMember: capabilities.canRemoveTeamMember,
    canRegenerateTeamCode: capabilities.canRegenerateTeamCode,
    canSubmitTeam: capabilities.canSubmitTeam,
    canSelectCandidate: capabilities.canSelectCandidate,
    canSelectTeam: capabilities.canSelectTeam,
    canRejectCandidate: capabilities.canRejectCandidate,
    canRejectTeam: capabilities.canRejectTeam,
    canDecideUnderfilled: capabilities.canDecideUnderfilled,
    canConsentUnderfilled: capabilities.canConsentUnderfilled,
    canRespondToEdit: capabilities.canRespondToEdit,
    canMessageOwner,
  };
}

export function getQuestDetailProjection(
  source: LiveQuestSnapshot,
  now = new Date()
): QuestDetailProjection {
  const isOwner = isHirerActor(source.actor);
  const isAssigned = source.assignment?.state !== undefined;
  const hasPendingApplication =
    source.application?.state === QuestApplicationStatus.APPLICATION_APPLIED;
  const applicationStatus: QuestDetailApplicationStatus =
    source.assignment?.state === QuestAssignmentStatus.ASSIGNMENT_ACTIVE
      ? "accepted"
      : hasPendingApplication
        ? "pending"
        : "none";
  const joinStatus =
    source.assignment?.state === QuestAssignmentStatus.ASSIGNMENT_COMPLETED ||
    source.assignment?.state === QuestAssignmentStatus.ASSIGNMENT_INCOMPLETE ||
    source.assignment?.state === QuestAssignmentStatus.ASSIGNMENT_CANCELLED
      ? ("history" as const)
      : source.assignment?.state === QuestAssignmentStatus.ASSIGNMENT_ACTIVE
        ? ("accepted" as const)
        : hasPendingApplication
          ? ("pending" as const)
          : undefined;
  const participants =
    source.participants ??
    source.assignments
      .filter(
        (assignment) =>
          assignment.state !== QuestAssignmentStatus.ASSIGNMENT_CANCELLED
      )
      .map((assignment) => ({
        id: assignment.workerId,
        displayName: assignment.workerId,
      }));
  // activeWorkerCount drops to 0 once settlement ends every Assignment, so a
  // terminal Quest counts the roster of Workers who worked it instead.
  const participantCount = isTerminalStatus(source.state)
    ? participants.length
    : "activeWorkerCount" in source.quest
      ? source.quest.activeWorkerCount
      : source.assignments.filter(
          (assignment) =>
            assignment.state !== QuestAssignmentStatus.ASSIGNMENT_CANCELLED
        ).length;
  const quest = liveQuest(source, participantCount);
  return {
    quest,
    lifecycleState: source.state,
    availability: getQuestAvailability(
      {
        acceptedParticipants: participantCount,
        headcount: quest.headcount,
        deadline: quest.deadline,
      },
      now
    ),
    applicationStatus,
    joinStatus,
    isOwner,
    isAssigned,
    hasPendingApplication,
    partialStartPending:
      source.nextAction === QuestNextAction.CONSENT_UNDERFILLED,
    conversationCapability: {
      conversationId: source.workConversation?.id ?? null,
      canRead: source.capabilities.canReadWorkChat,
      canWrite: source.capabilities.canWriteWorkChat,
      readOnly:
        source.capabilities.canReadWorkChat &&
        !source.capabilities.canWriteWorkChat,
      ...(source.capabilities.canReadWorkChat &&
      !source.capabilities.canWriteWorkChat
        ? { readOnlyReason: "NOT_STARTED" as const }
        : {}),
    },
    participants,
    participantCount,
    capabilities: liveCapabilities(source, isOwner, isAssigned),
  };
}
