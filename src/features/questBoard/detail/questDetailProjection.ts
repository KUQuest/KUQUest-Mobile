import {
  getQuestAvailability,
  toBoardQuest,
} from "../presentation/questBoardViewData";
import { questFixtures } from "../fixtures/questFixtures";
import {
  canonicalToQuestBoardQuest,
  publicDetailToQuestBoardQuest,
} from "../live/liveQuestService";
import type {
  LiveQuestCapabilities,
  LiveQuestSnapshot,
} from "../live/liveQuestTypes";
import {
  QuestApplicationStatus,
  QuestAssignmentStatus,
  QuestPartialStartConsentStatus,
  type QuestAction,
  type QuestBoardQuest,
  type QuestDetailState,
} from "../domain/types";
import type {
  QuestDetailProjectionSource,
  QuestDetailApplicationStatus,
  QuestDetailProjectionCapabilities,
  QuestDetailProjection,
} from "./questDetailTypes";
export type {
  QuestDetailProjectionSource,
  QuestDetailApplicationStatus,
  QuestDetailJoinStatus,
  QuestDetailProjectionCapabilities,
  QuestDetailProjection,
} from "./questDetailTypes";

function isLiveSnapshot(
  source: QuestDetailProjectionSource
): source is LiveQuestSnapshot {
  return "viewerId" in source;
}

function fixtureQuest(state: QuestDetailState): QuestBoardQuest {
  const base = toBoardQuest(state);
  const fixture = questFixtures.find((item) => item.id === base.id);
  return fixture ? { ...base, creator: fixture.creator } : base;
}

function liveQuest(snapshot: LiveQuestSnapshot): QuestBoardQuest {
  return "questFundingTotal" in snapshot.quest
    ? canonicalToQuestBoardQuest(snapshot.quest)
    : publicDetailToQuestBoardQuest(snapshot.quest);
}

function hasAction(
  actions: readonly QuestAction[],
  action: QuestAction
): boolean {
  return actions.includes(action);
}

function fixtureCapabilities(
  state: QuestDetailState,
  isOwner: boolean,
  isAssigned: boolean
): QuestDetailProjectionCapabilities {
  const availableActions = state.capabilities.availableActions;
  const canRespondPartialStart = hasAction(
    availableActions,
    "VOTE_PARTIAL_GROUP_START_CONSENT"
  );
  return {
    canApply: hasAction(availableActions, "APPLY"),
    canJoin: hasAction(availableActions, "DIRECT_JOIN"),
    canWithdrawApplication: hasAction(availableActions, "WITHDRAW_APPLICATION"),
    canCreateTeam: hasAction(availableActions, "CREATE_TEAM"),
    canInviteWorker: hasAction(availableActions, "INVITE_WORKER"),
    canRespondInvitation: hasAction(availableActions, "RESPOND_INVITATION"),
    canJoinTeam: false,
    canUpdateTeam: false,
    canLeaveTeam: false,
    canRemoveTeamMember: false,
    canRegenerateTeamCode: false,
    canSubmitTeam: hasAction(availableActions, "SUBMIT_TEAM"),
    canSelectCandidate: hasAction(availableActions, "SELECT_CANDIDATE"),
    canSelectTeam: false,
    canRejectCandidate: hasAction(availableActions, "REJECT_CANDIDATE"),
    canRejectTeam: hasAction(availableActions, "REJECT_TEAM"),
    canDecideUnderfilled: false,
    canConsentUnderfilled: canRespondPartialStart,
    canRespondPartialStart,
    canMessageOwner:
      !isOwner &&
      Boolean(state.conversation.conversationId && state.conversation.canRead),
    canReportQuest: isAssigned,
  };
}

function liveCapabilities(
  snapshot: LiveQuestSnapshot,
  isOwner: boolean,
  isAssigned: boolean
): QuestDetailProjectionCapabilities {
  const capabilities: LiveQuestCapabilities = snapshot.capabilities;
  const canMessageOwner =
    snapshot.state === "QUEST_OPEN" && !isOwner && !isAssigned;
  return {
    canApply: capabilities.canApply,
    canJoin: capabilities.canJoin,
    canWithdrawApplication: capabilities.canWithdrawApplication,
    canCreateTeam: capabilities.canCreateTeam,
    canInviteWorker: false,
    canRespondInvitation: capabilities.canJoinTeam,
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
    canRespondPartialStart: capabilities.canConsentUnderfilled,
    canMessageOwner,
    canReportQuest: isAssigned,
  };
}

export function getQuestDetailProjection(
  source: QuestDetailProjectionSource,
  viewerId: string,
  now = new Date()
): QuestDetailProjection {
  if (isLiveSnapshot(source)) {
    const quest = liveQuest(source);
    const isOwner = source.actor === "HIRER";
    const isAssigned = source.assignment?.state !== undefined;
    const hasPendingApplication =
      source.application?.state === "APPLICATION_APPLIED";
    const applicationStatus: QuestDetailApplicationStatus =
      source.assignment?.state === "ASSIGNMENT_ACTIVE"
        ? "accepted"
        : hasPendingApplication
          ? "pending"
          : "none";
    const joinStatus =
      source.assignment?.state === "ASSIGNMENT_COMPLETED" ||
      source.assignment?.state === "ASSIGNMENT_INCOMPLETE" ||
      source.assignment?.state === "ASSIGNMENT_CANCELLED"
        ? ("history" as const)
        : source.assignment?.state === "ASSIGNMENT_ACTIVE"
          ? ("accepted" as const)
          : hasPendingApplication
            ? ("pending" as const)
            : undefined;
    const participants =
      source.participants ??
      source.assignments
        .filter((assignment) => assignment.state !== "ASSIGNMENT_CANCELLED")
        .map((assignment) => ({
          id: assignment.workerId,
          displayName: assignment.workerId,
        }));
    const participantCount =
      "activeWorkerCount" in source.quest
        ? source.quest.activeWorkerCount
        : source.assignments.filter(
            (assignment) => assignment.state !== "ASSIGNMENT_CANCELLED"
          ).length;
    return {
      state: null,
      quest,
      lifecycleState: source.state,
      availability: getQuestAvailability(quest, now),
      applicationStatus,
      joinStatus,
      isOwner,
      isAssigned,
      hasPendingApplication,
      partialStartPending: source.nextAction === "CONSENT_UNDERFILLED",
      settlement: null,
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

  const quest = fixtureQuest(source);
  const isOwner = source.quest.hirerId === viewerId;
  const isAssigned = source.assignments.some(
    (assignment) =>
      assignment.workerId === viewerId &&
      assignment.status !== QuestAssignmentStatus.ASSIGNMENT_CANCELLED
  );
  const hasPendingApplication = source.applications.some(
    (application) =>
      application.applicantId === viewerId &&
      application.status === QuestApplicationStatus.APPLICATION_APPLIED
  );
  const applicationStatus: QuestDetailApplicationStatus = isAssigned
    ? "accepted"
    : hasPendingApplication
      ? "pending"
      : "none";
  const joinStatus = isAssigned
    ? ("accepted" as const)
    : hasPendingApplication
      ? ("pending" as const)
      : undefined;
  const partialStartPending =
    source.partialStartConsent?.status ===
    QuestPartialStartConsentStatus.PARTIAL_START_PENDING;
  const participants = source.assignments
    .filter(
      (assignment) =>
        assignment.status !== QuestAssignmentStatus.ASSIGNMENT_CANCELLED
    )
    .map((assignment) => ({
      id: assignment.workerId,
      displayName: assignment.workerId,
    }));
  return {
    state: source,
    quest,
    lifecycleState: source.quest.status,
    availability: getQuestAvailability(quest, now),
    applicationStatus,
    joinStatus,
    isOwner,
    isAssigned,
    hasPendingApplication,
    partialStartPending,
    settlement: source.settlement ?? null,
    conversationCapability: source.conversation,
    participants,
    participantCount: source.actualHeadcount ?? participants.length,
    capabilities: fixtureCapabilities(source, isOwner, isAssigned),
  };
}
