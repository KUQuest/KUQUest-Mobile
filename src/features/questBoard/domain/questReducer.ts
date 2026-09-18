import {
  assignment,
  createDraftState,
  makeTeam,
  proof,
} from "../fixtures/questSeeds";
import {
  DEFAULT_PLATFORM_FEE_BASIS_POINTS,
  DEFAULT_PROTOTYPE_VIEWER_ID,
  EDIT_CONSENT_WINDOW_MS,
  INVITATION_WINDOW_MS,
  PROTOTYPE_NOW,
} from "./constants";
import {
  addMilliseconds,
  buildCreatedQuestState,
  clone,
  createPayloadBlockers,
  safeDate,
} from "./questValidation";
import {
  activeAssignments,
  applyEditChanges,
  calculatePublishCheck,
  cancelPartialStart,
  countAdmitted,
  ensureConversation,
  hasActiveAssignment,
  hasAssignment,
  isPendingInvitation,
  isTerminal,
  isTeamMember,
  isTeamParticipant,
  normalizeStateShape,
  projectedState,
  setActualHeadcount,
  settlementFor,
  stateForViewer,
  teamForId,
  transitionToInProgress,
  eligibleCandidateApplications,
  makeReadOnly,
} from "./questSelectors";
import {
  QuestApplicationStatus,
  QuestAssignmentStatus,
  QuestCandidateMode,
  QuestEditRequestStatus,
  QuestEditResponseStatus,
  QuestInvitationStatus,
  QuestPartialStartConsentStatus,
  QuestPartialStartVoteStatus,
  QuestParticipation,
  QuestProofStatus,
  QuestStatus,
  QuestTeamStatus,
  MAX_PROOF_ATTACHMENTS,
  MAX_PROOF_NOTE_LENGTH,
  type CanonicalQuestCandidateMode,
  type QuestApplication,
  type QuestContract,
  type QuestDetailState,
  type QuestEditConsent,
  type QuestEditConsentResponse,
  type QuestLocation,
  type QuestPartialStartConsentResponse,
  type QuestProof,
  type QuestStatus as QuestStatusValue,
  type QuestTeam,
  type QuestTeamMember,
} from "../types";

export type QuestFixtureErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "INVALID_STATUS"
  | "INVALID_MODE"
  | "CAPACITY_REACHED"
  | "DUPLICATE_ACTION"
  | "TEAM_REQUIRED"
  | "TEAM_NOT_FOUND"
  | "TEAM_NOT_READY"
  | "INVITATION_NOT_FOUND"
  | "INVITATION_EXPIRED"
  | "IMMUTABLE_TEAM"
  | "APPLICATION_NOT_FOUND"
  | "PROOF_NOT_FOUND"
  | "PROOF_NOT_READY"
  | "EDIT_NOT_ALLOWED"
  | "PUBLISH_BLOCKED"
  | "INVALID_MESSAGE";
export interface QuestFixtureError {
  code: QuestFixtureErrorCode;
  message: string;
}
export type QuestFixtureResult =
  | { ok: true; state: QuestDetailState }
  | { ok: false; state: QuestDetailState; error: QuestFixtureError };
export interface QuestFixtureCreateInput {
  title: string;
  tag: string;
  description: string;
  conditions: string;
  proofRequired: QuestContract["proofRequired"];
  startDate: string;
  deadline: string;
  startTime: string;
  endTime: string;
  location: QuestLocation;
  candidateMode: CanonicalQuestCandidateMode;
  participation: "SOLO" | "SINGLE" | "GROUP";
  headcount: number;
  rewardSatang: number;
  imageUris: string[];
}
export type QuestReducerAction =
  | {
      type: "CREATE_AND_PUBLISH";
      payload: QuestFixtureCreateInput;
      hirerId?: string;
    }
  | { type: "DIRECT_JOIN"; questId: string; workerId?: string }
  | { type: "APPLY"; questId: string; workerId?: string }
  | {
      type: "WITHDRAW_APPLICATION";
      questId: string;
      applicationId?: string;
      workerId?: string;
      applicantId?: string;
    }
  | { type: "CREATE_TEAM"; questId: string; leaderId?: string; name?: string }
  | {
      type: "INVITE_WORKER";
      questId: string;
      workerId: string;
      leaderId?: string;
    }
  | {
      type: "REVOKE_INVITATION";
      questId: string;
      invitationId: string;
      leaderId?: string;
    }
  | {
      type: "RESPOND_INVITATION";
      questId: string;
      invitationId: string;
      workerId: string;
      accept: boolean;
    }
  | { type: "SUBMIT_TEAM"; questId: string; leaderId?: string }
  | {
      type: "SELECT_CANDIDATE";
      questId: string;
      applicationId: string;
      hirerId?: string;
    }
  | {
      type: "REJECT_CANDIDATE";
      questId: string;
      applicationId: string;
      hirerId?: string;
    }
  | { type: "REJECT_TEAM"; questId: string; teamId: string; hirerId?: string }
  | { type: "SELECT_TEAM"; questId: string; teamId: string; hirerId?: string }
  | {
      type: "REQUEST_EDIT";
      questId: string;
      changes: QuestEditConsent["requestedChanges"];
      hirerId?: string;
    }
  | {
      type: "VOTE_EDIT_CONSENT";
      questId: string;
      workerId: string;
      approve: boolean;
    }
  | {
      type: "VOTE_PARTIAL_GROUP_START_CONSENT";
      questId: string;
      voterId: string;
      approve: boolean;
    }
  | {
      type: "VOTE_PARTIAL_START_CONSENT";
      questId: string;
      voterId: string;
      approve: boolean;
    }
  | {
      type: "SUBMIT_PROOF";
      questId: string;
      ownerId?: string;
      imageUris?: string[];
      note?: string;
    }
  | {
      type: "REVIEW_PROOF";
      questId: string;
      proofId: string;
      approve: boolean;
      reason?: string;
      hirerId?: string;
    }
  | {
      type: "REWORK_PROOF";
      questId: string;
      proofId: string;
      ownerId?: string;
      imageUris?: string[];
      note?: string;
    }
  | { type: "CONFIRM_COMPLETION"; questId: string; workerId?: string }
  | { type: "COMPLETE"; questId: string; hirerId?: string }
  | { type: "OPEN_DISPUTE"; questId: string; actorId?: string }
  | { type: "RESOLVE_DISPUTE"; questId: string; actorId?: string }
  | { type: "CANCEL"; questId: string; actorId?: string }
  | { type: "PUBLISH"; questId: string; hirerId?: string };
export type QuestReducerResult =
  | { ok: true; state: QuestDetailState; nextState: QuestDetailState }
  | {
      ok: false;
      state: QuestDetailState;
      nextState: QuestDetailState;
      error: QuestFixtureError;
    };

function failure(
  state: QuestDetailState,
  code: QuestFixtureErrorCode,
  message: string,
  viewerId: string,
  now: Date
): QuestFixtureResult {
  return {
    ok: false,
    state: stateForViewer(state, viewerId, now),
    error: { code, message },
  };
}
function success(
  state: QuestDetailState,
  viewerId: string,
  now: Date
): QuestFixtureResult {
  return { ok: true, state: stateForViewer(state, viewerId, now) };
}
function currentWithProjection(
  state: QuestDetailState,
  now: Date
): QuestDetailState {
  return projectedState(state, now);
}
function resolveDateAndString(
  value: string | Date | undefined,
  fallback: Date
): { value?: string; now: Date } {
  if (value instanceof Date) return { now: safeDate(value, fallback) };
  return { value, now: new Date(fallback.getTime()) };
}
function nextApplicationId(
  state: QuestDetailState,
  applicantId: string
): string {
  const prefix = `fixture-application-${state.quest.id}-${applicantId}`;
  const used = new Set(state.applications.map((item) => item.id));
  if (!used.has(prefix)) return prefix;
  let index = 2;
  while (used.has(`${prefix}-${index}`)) index += 1;
  return `${prefix}-${index}`;
}
function makeApplicationForApplicant(
  state: QuestDetailState,
  applicantId: string,
  now: Date
): QuestApplication {
  return {
    id: nextApplicationId(state, applicantId),
    questId: state.quest.id,
    applicantId,
    status: QuestApplicationStatus.APPLICATION_APPLIED,
    submittedAt: now.toISOString(),
  };
}
function makeTeamApplication(
  state: QuestDetailState,
  teamId: string,
  now: Date
): QuestApplication {
  return {
    id: `fixture-application-${state.quest.id}-${teamId}`,
    questId: state.quest.id,
    teamId,
    status: QuestApplicationStatus.APPLICATION_APPLIED,
    submittedAt: now.toISOString(),
  };
}
function applicationForSelection(
  state: QuestDetailState,
  id: string
): QuestApplication | undefined {
  return (
    state.applications.find(
      (item) =>
        item.id === id &&
        item.status === QuestApplicationStatus.APPLICATION_APPLIED
    ) ??
    state.applications.find(
      (item) =>
        item.teamId === id &&
        item.status === QuestApplicationStatus.APPLICATION_APPLIED
    )
  );
}
function notFound(): QuestFixtureResult {
  return {
    ok: false,
    state: createDraftState(),
    error: { code: "NOT_FOUND", message: "Quest not found." },
  };
}

interface PureHandlers {
  createAndPublishQuest(
    payload: QuestFixtureCreateInput,
    hirerId: string | undefined,
    now: Date
  ): QuestFixtureResult;
  joinDirect(
    questId: string,
    workerId: string | undefined,
    now: Date
  ): QuestFixtureResult;
  applyCandidate(
    questId: string,
    workerId: string | undefined,
    now: Date
  ): QuestFixtureResult;
  withdrawApplication(
    questId: string,
    applicationId: string | undefined,
    workerIdOrNow: string | Date | undefined,
    now: Date
  ): QuestFixtureResult;
  createTeam(
    questId: string,
    leaderId: string | undefined,
    nameOrNow: string | Date | undefined,
    now: Date
  ): QuestFixtureResult;
  inviteWorker(
    questId: string,
    workerId: string,
    leaderId: string | undefined,
    now: Date
  ): QuestFixtureResult;
  revokeInvitation(
    questId: string,
    invitationId: string,
    leaderId: string | undefined,
    now: Date
  ): QuestFixtureResult;
  respondToInvitation(
    questId: string,
    invitationId: string,
    workerId: string,
    accept: boolean,
    now: Date
  ): QuestFixtureResult;
  submitTeam(
    questId: string,
    leaderId: string | undefined,
    now: Date
  ): QuestFixtureResult;
  rejectCandidate(
    questId: string,
    applicationId: string,
    hirerId: string | undefined,
    now: Date
  ): QuestFixtureResult;
  rejectTeam(
    questId: string,
    teamId: string,
    hirerId: string | undefined,
    now: Date
  ): QuestFixtureResult;
  selectCandidate(
    questId: string,
    applicationId: string,
    hirerId: string | undefined,
    now: Date
  ): QuestFixtureResult;
  requestEdit(
    questId: string,
    changes: QuestEditConsent["requestedChanges"],
    hirerId: string | undefined,
    now: Date
  ): QuestFixtureResult;
  voteEditConsent(
    questId: string,
    workerId: string,
    approve: boolean,
    now: Date
  ): QuestFixtureResult;
  votePartialGroupStartConsent(
    questId: string,
    voterId: string,
    approve: boolean,
    now: Date
  ): QuestFixtureResult;
  submitProof(
    questId: string,
    ownerId: string | undefined,
    imageUris: string[] | undefined,
    note: string | undefined,
    now: Date
  ): QuestFixtureResult;
  reviewProof(
    questId: string,
    proofId: string,
    approve: boolean,
    reason: string | undefined,
    hirerId: string | undefined,
    now: Date
  ): QuestFixtureResult;
  submitRework(
    questId: string,
    proofId: string,
    ownerId: string | undefined,
    imageUris: string[] | undefined,
    note: string | undefined,
    now: Date
  ): QuestFixtureResult;
  confirmCompletion(
    questId: string,
    workerId: string | undefined,
    now: Date
  ): QuestFixtureResult;
  completeQuest(
    questId: string,
    hirerId: string | undefined,
    now: Date
  ): QuestFixtureResult;
  openDispute(
    questId: string,
    actorId: string | undefined,
    now: Date
  ): QuestFixtureResult;
  resolveDispute(
    questId: string,
    actorId: string | undefined,
    now: Date
  ): QuestFixtureResult;
  cancelQuest(
    questId: string,
    actorId: string | undefined,
    now: Date
  ): QuestFixtureResult;
  publishQuest(
    questId: string,
    hirerId: string | undefined,
    now: Date
  ): QuestFixtureResult;
}

export function reduceQuestAction(
  initialState: QuestDetailState | null,
  action: QuestReducerAction,
  now: Date,
  options: { feeRateBasisPoints?: number; createdQuestId?: string } = {}
): QuestReducerResult {
  const baseNow = safeDate(now, new Date(PROTOTYPE_NOW));
  const feeRateBasisPoints =
    options.feeRateBasisPoints ?? DEFAULT_PLATFORM_FEE_BASIS_POINTS;
  const createdQuestId = options.createdQuestId ?? "created-quest";
  let committedState = initialState ?? createDraftState();
  const getInternal = (questId: string): QuestDetailState | null =>
    committedState.quest.id === questId ? committedState : null;
  const viewer = (viewerId: string | undefined): string =>
    viewerId?.trim() || DEFAULT_PROTOTYPE_VIEWER_ID;
  const at = (value: Date | undefined): Date => safeDate(value, baseNow);
  const commit = (state: QuestDetailState): void => {
    committedState = normalizeStateShape(state);
  };

  const handlers: PureHandlers = {
    createAndPublishQuest: (payload, hirerId = "demo-hirer", now = baseNow) => {
      const currentTime = at(now);
      const ownerId = viewer(hirerId);
      const blockers = createPayloadBlockers(payload);
      if (blockers.length > 0) {
        return failure(
          createDraftState(),
          "PUBLISH_BLOCKED",
          `Publish is blocked: ${blockers.join(", ")}.`,
          ownerId,
          currentTime
        );
      }
      const created = buildCreatedQuestState(
        payload,
        createdQuestId,
        ownerId,
        currentTime
      );
      if ("blockers" in created) {
        return failure(
          createDraftState(),
          "PUBLISH_BLOCKED",
          `Publish is blocked: ${created.blockers.join(", ")}.`,
          ownerId,
          currentTime
        );
      }
      const check = calculatePublishCheck(
        created.state.quest,
        feeRateBasisPoints
      );
      if (!check.canPublish) {
        return failure(
          created.state,
          "PUBLISH_BLOCKED",
          `Publish is blocked: ${check.blockers.join(", ")}.`,
          ownerId,
          currentTime
        );
      }
      created.state.quest.status = QuestStatus.QUEST_OPEN;
      created.state.quest.postedAt = currentTime.toISOString();
      created.state.publishCheck = check;
      commit(created.state);
      return success(created.state, ownerId, currentTime);
    },
    joinDirect: (
      questId,
      workerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (projected.quest.status !== QuestStatus.QUEST_OPEN)
        return failure(
          projected,
          "INVALID_STATUS",
          "This Quest is not open for direct joins.",
          workerId,
          currentTime
        );
      if (projected.quest.candidateMode !== QuestCandidateMode.NO_CANDIDATE)
        return failure(
          projected,
          "INVALID_MODE",
          "This Quest accepts Candidates instead of direct joins.",
          workerId,
          currentTime
        );
      if (projected.quest.hirerId === workerId)
        return failure(
          projected,
          "FORBIDDEN",
          "The Hirer cannot join their own Quest.",
          workerId,
          currentTime
        );
      if (hasAssignment(projected, workerId))
        return failure(
          projected,
          "DUPLICATE_ACTION",
          "You already have a relationship with this Quest.",
          workerId,
          currentTime
        );
      if (countAdmitted(projected) >= projected.quest.headcount)
        return failure(
          projected,
          "CAPACITY_REACHED",
          "This Quest has no remaining capacity.",
          workerId,
          currentTime
        );
      if (
        projected.quest.participation === QuestParticipation.SINGLE &&
        projected.quest.headcount !== 1
      )
        return failure(
          projected,
          "INVALID_MODE",
          "A SINGLE Quest must request exactly one Worker place.",
          workerId,
          currentTime
        );
      if (
        projected.quest.participation === QuestParticipation.GROUP &&
        (isTeamMember(projected, workerId) ||
          isPendingInvitation(projected, workerId))
      )
        return failure(
          projected,
          "DUPLICATE_ACTION",
          "You already have a relationship with this Quest.",
          workerId,
          currentTime
        );
      const next = clone(projected);
      next.assignments.push(
        assignment(
          next.quest,
          workerId,
          "DIRECT_JOIN",
          QuestAssignmentStatus.ASSIGNMENT_ACTIVE,
          `${workerId}-${next.assignments.length + 1}`
        )
      );
      setActualHeadcount(next);
      if (
        next.quest.participation === QuestParticipation.SINGLE ||
        countAdmitted(next) >= next.quest.headcount
      ) {
        next.quest.status = QuestStatus.QUEST_ASSIGNED;
        next.settlement = settlementFor(next, countAdmitted(next));
      }
      ensureConversation(next, [next.quest.hirerId, workerId]);
      commit(next);
      return success(next, workerId, currentTime);
    },
    applyCandidate: (
      questId,
      workerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (projected.quest.status !== QuestStatus.QUEST_OPEN)
        return failure(
          projected,
          "INVALID_STATUS",
          "This Quest is not accepting applications.",
          workerId,
          currentTime
        );
      if (
        projected.quest.candidateMode !== QuestCandidateMode.CANDIDATE ||
        projected.quest.participation !== QuestParticipation.SINGLE
      )
        return failure(
          projected,
          "INVALID_MODE",
          "Only SINGLE Candidate Quests accept individual applications.",
          workerId,
          currentTime
        );
      if (projected.quest.hirerId === workerId)
        return failure(
          projected,
          "FORBIDDEN",
          "The Hirer cannot apply to their own Quest.",
          workerId,
          currentTime
        );
      if (
        projected.applications.some(
          (item) =>
            item.applicantId === workerId &&
            item.status === QuestApplicationStatus.APPLICATION_APPLIED
        )
      )
        return failure(
          projected,
          "DUPLICATE_ACTION",
          "You already applied to this Quest.",
          workerId,
          currentTime
        );
      if (
        projected.applications.some(
          (item) =>
            item.applicantId === workerId &&
            item.status === QuestApplicationStatus.APPLICATION_REJECTED
        )
      )
        return failure(
          projected,
          "DUPLICATE_ACTION",
          "A rejected Candidate Proposal cannot be resubmitted.",
          workerId,
          currentTime
        );
      if (hasAssignment(projected, workerId))
        return failure(
          projected,
          "DUPLICATE_ACTION",
          "You already have a relationship with this Quest.",
          workerId,
          currentTime
        );
      const next = clone(projected);
      next.applications.push(
        makeApplicationForApplicant(next, workerId, currentTime)
      );
      commit(next);
      return success(next, workerId, currentTime);
    },
    withdrawApplication: (questId, applicationId, workerIdOrNow, now) => {
      const parsed = resolveDateAndString(workerIdOrNow, baseNow);
      const currentTime = at(now ?? parsed.now);
      const actorId = parsed.value ?? DEFAULT_PROTOTYPE_VIEWER_ID;
      const current = getInternal(questId);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (projected.quest.status !== QuestStatus.QUEST_OPEN)
        return failure(
          projected,
          "INVALID_STATUS",
          "An application can only be withdrawn before Candidate Selection.",
          actorId,
          currentTime
        );
      const target = projected.applications.find(
        (item) =>
          (applicationId
            ? item.id === applicationId
            : item.applicantId === actorId) &&
          item.applicantId === actorId &&
          item.status === QuestApplicationStatus.APPLICATION_APPLIED
      );
      if (!target)
        return failure(
          projected,
          "APPLICATION_NOT_FOUND",
          "Pending application not found for this Applicant.",
          actorId,
          currentTime
        );
      const next = clone(projected);
      const nextTarget = next.applications.find(
        (item) => item.id === target.id
      );
      if (!nextTarget)
        return failure(
          projected,
          "APPLICATION_NOT_FOUND",
          "Application not found.",
          actorId,
          currentTime
        );
      nextTarget.status = QuestApplicationStatus.APPLICATION_WITHDRAWN;
      nextTarget.decidedAt = currentTime.toISOString();
      commit(next);
      return success(next, actorId, currentTime);
    },
    createTeam: (
      questId,
      leaderId = DEFAULT_PROTOTYPE_VIEWER_ID,
      nameOrNow,
      now
    ) => {
      const parsed = resolveDateAndString(nameOrNow, baseNow);
      const currentTime = at(now ?? parsed.now);
      const current = getInternal(questId);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (
        projected.quest.status !== QuestStatus.QUEST_OPEN ||
        projected.quest.candidateMode !== QuestCandidateMode.CANDIDATE ||
        projected.quest.participation !== QuestParticipation.GROUP
      )
        return failure(
          projected,
          "INVALID_MODE",
          "Teams are only available for open GROUP Candidate Quests.",
          leaderId,
          currentTime
        );
      if (projected.quest.hirerId === leaderId)
        return failure(
          projected,
          "FORBIDDEN",
          "The Hirer cannot form a team for their own Quest.",
          leaderId,
          currentTime
        );
      if (
        isTeamParticipant(projected, leaderId) ||
        hasAssignment(projected, leaderId)
      )
        return failure(
          projected,
          "DUPLICATE_ACTION",
          "You already belong to a team for this Quest.",
          leaderId,
          currentTime
        );
      const next = clone(projected);
      next.teams.push(
        makeTeam(next.quest, leaderId, [{ workerId: leaderId, role: "LEADER" }])
      );
      commit(next);
      return success(next, leaderId, currentTime);
    },
    inviteWorker: (
      questId,
      workerId,
      leaderId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      const leaderTeam = projected.teams.find(
        (teamItem) => teamItem.leaderId === leaderId
      );
      if (!leaderTeam)
        return failure(
          projected,
          "TEAM_NOT_FOUND",
          "Create a Quest Team before inviting Workers.",
          leaderId,
          currentTime
        );
      if (
        projected.quest.status !== QuestStatus.QUEST_OPEN ||
        projected.quest.candidateMode !== QuestCandidateMode.CANDIDATE ||
        projected.quest.participation !== QuestParticipation.GROUP
      )
        return failure(
          projected,
          "INVALID_MODE",
          "Invitations are only available for an open GROUP Candidate Quest.",
          leaderId,
          currentTime
        );
      if (leaderTeam.status !== QuestTeamStatus.TEAM_FORMING)
        return failure(
          projected,
          "IMMUTABLE_TEAM",
          "This submitted Team cannot be changed.",
          leaderId,
          currentTime
        );
      if (projected.quest.hirerId === workerId || workerId === leaderId)
        return failure(
          projected,
          "FORBIDDEN",
          "The Hirer and Team Leader cannot be invited.",
          leaderId,
          currentTime
        );
      if (isTeamMember(projected, workerId))
        return failure(
          projected,
          "DUPLICATE_ACTION",
          "That Worker already belongs to a Quest Team.",
          leaderId,
          currentTime
        );
      if (isPendingInvitation(projected, workerId))
        return failure(
          projected,
          "DUPLICATE_ACTION",
          "That Worker already has a pending invitation.",
          leaderId,
          currentTime
        );
      if (leaderTeam.members.length >= projected.quest.headcount)
        return failure(
          projected,
          "CAPACITY_REACHED",
          "The Team has reached the requested headcount.",
          leaderId,
          currentTime
        );
      const next = clone(projected);
      const nextLeaderTeam = next.teams.find(
        (teamItem) => teamItem.id === leaderTeam.id
      );
      if (!nextLeaderTeam)
        return failure(
          projected,
          "TEAM_NOT_FOUND",
          "Team not found.",
          leaderId,
          currentTime
        );
      const createdAt = currentTime.toISOString();
      next.invitations.push({
        id: `fixture-invitation-${next.quest.id}-${nextLeaderTeam.id}-${workerId}`,
        questId: next.quest.id,
        teamId: nextLeaderTeam.id,
        invitedWorkerId: workerId,
        status: QuestInvitationStatus.INVITATION_PENDING,
        createdAt,
        expiresAt: addMilliseconds(createdAt, INVITATION_WINDOW_MS),
      });
      commit(next);
      return success(next, leaderId, currentTime);
    },
    revokeInvitation: (
      questId,
      invitationId,
      leaderId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      const invitation = projected.invitations.find(
        (item) => item.id === invitationId
      );
      const leaderTeam = invitation
        ? teamForId(projected, invitation.teamId)
        : undefined;
      if (!invitation || !leaderTeam)
        return failure(
          projected,
          "INVITATION_NOT_FOUND",
          "Invitation not found.",
          leaderId,
          currentTime
        );
      if (leaderTeam.leaderId !== leaderId)
        return failure(
          projected,
          "FORBIDDEN",
          "Only the Team Leader can revoke invitations.",
          leaderId,
          currentTime
        );
      if (invitation.status !== QuestInvitationStatus.INVITATION_PENDING)
        return failure(
          projected,
          "INVALID_STATUS",
          "This invitation is no longer pending.",
          leaderId,
          currentTime
        );
      const next = clone(projected);
      const nextInvitation = next.invitations.find(
        (item) => item.id === invitationId
      );
      if (nextInvitation)
        nextInvitation.status = QuestInvitationStatus.INVITATION_REVOKED;
      commit(next);
      return success(next, leaderId, currentTime);
    },
    respondToInvitation: (
      questId,
      invitationId,
      workerId,
      accept,
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      const invitation = projected.invitations.find(
        (item) => item.id === invitationId
      );
      if (!invitation || invitation.invitedWorkerId !== workerId)
        return failure(
          projected,
          "INVITATION_NOT_FOUND",
          "Invitation not found for this Worker.",
          workerId,
          currentTime
        );
      if (invitation.status === QuestInvitationStatus.INVITATION_EXPIRED)
        return failure(
          projected,
          "INVITATION_EXPIRED",
          "This invitation has expired. Refresh to see the server status.",
          workerId,
          currentTime
        );
      if (invitation.status !== QuestInvitationStatus.INVITATION_PENDING)
        return failure(
          projected,
          "INVALID_STATUS",
          "This invitation is no longer pending.",
          workerId,
          currentTime
        );
      if (projected.quest.status !== QuestStatus.QUEST_OPEN)
        return failure(
          projected,
          "INVALID_STATUS",
          "This Quest is no longer forming teams.",
          workerId,
          currentTime
        );
      const invitationTeam = teamForId(projected, invitation.teamId);
      if (
        !invitationTeam ||
        invitationTeam.status !== QuestTeamStatus.TEAM_FORMING
      )
        return failure(
          projected,
          "IMMUTABLE_TEAM",
          "This Team can no longer change.",
          workerId,
          currentTime
        );
      if (
        accept &&
        (isTeamMember(projected, workerId) ||
          projected.teams.some(
            (teamItem) =>
              teamItem.id !== invitation.teamId &&
              teamItem.members.some((member) => member.workerId === workerId)
          ))
      )
        return failure(
          projected,
          "DUPLICATE_ACTION",
          "That Worker already belongs to a Quest Team.",
          workerId,
          currentTime
        );
      if (accept && invitationTeam.members.length >= projected.quest.headcount)
        return failure(
          projected,
          "CAPACITY_REACHED",
          "The Team has reached the requested headcount.",
          workerId,
          currentTime
        );
      const next = clone(projected);
      const nextInvitation = next.invitations.find(
        (item) => item.id === invitationId
      );
      const nextTeam = next.teams.find(
        (teamItem) => teamItem.id === invitation.teamId
      );
      if (!nextInvitation || !nextTeam)
        return failure(
          projected,
          "TEAM_NOT_FOUND",
          "Team not found.",
          workerId,
          currentTime
        );
      nextInvitation.status = accept
        ? QuestInvitationStatus.INVITATION_ACCEPTED
        : QuestInvitationStatus.INVITATION_DECLINED;
      if (accept) nextTeam.members.push({ workerId, role: "MEMBER" });
      commit(next);
      return success(next, workerId, currentTime);
    },
    submitTeam: (
      questId,
      leaderId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      const leaderTeam = projected.teams.find(
        (teamItem) => teamItem.leaderId === leaderId
      );
      if (!leaderTeam)
        return failure(
          projected,
          "TEAM_NOT_FOUND",
          "Create a Quest Team before submitting.",
          leaderId,
          currentTime
        );
      if (
        projected.quest.status !== QuestStatus.QUEST_OPEN ||
        projected.quest.candidateMode !== QuestCandidateMode.CANDIDATE ||
        projected.quest.participation !== QuestParticipation.GROUP
      )
        return failure(
          projected,
          "INVALID_MODE",
          "Only an open GROUP Candidate Quest accepts Team Proposals.",
          leaderId,
          currentTime
        );
      if (leaderTeam.status !== QuestTeamStatus.TEAM_FORMING)
        return failure(
          projected,
          "IMMUTABLE_TEAM",
          "This Team is already submitted and cannot be changed.",
          leaderId,
          currentTime
        );
      if (leaderTeam.members.length === 0)
        return failure(
          projected,
          "TEAM_NOT_READY",
          "A Team Proposal must contain at least one accepted member.",
          leaderId,
          currentTime
        );
      if (leaderTeam.members.length > projected.quest.headcount)
        return failure(
          projected,
          "CAPACITY_REACHED",
          "The Team exceeds the requested headcount.",
          leaderId,
          currentTime
        );
      const next = clone(projected);
      const nextTeam = next.teams.find(
        (teamItem) => teamItem.id === leaderTeam.id
      );
      if (!nextTeam)
        return failure(
          projected,
          "TEAM_NOT_FOUND",
          "Team not found.",
          leaderId,
          currentTime
        );
      nextTeam.status = QuestTeamStatus.TEAM_SUBMITTED;
      if (!next.applications.some((item) => item.teamId === nextTeam.id))
        next.applications.push(
          makeTeamApplication(next, nextTeam.id, currentTime)
        );
      commit(next);
      return success(next, leaderId, currentTime);
    },
    rejectCandidate: (
      questId,
      applicationId,
      hirerId = "demo-hirer",
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (projected.quest.hirerId !== hirerId)
        return failure(
          projected,
          "FORBIDDEN",
          "Only the Hirer can reject a Candidate.",
          hirerId,
          currentTime
        );
      if (projected.quest.status !== QuestStatus.QUEST_OPEN)
        return failure(
          projected,
          "INVALID_STATUS",
          "This Quest is not accepting Candidate rejection.",
          hirerId,
          currentTime
        );
      if (
        projected.quest.candidateMode !== QuestCandidateMode.CANDIDATE ||
        projected.quest.participation !== QuestParticipation.SINGLE
      )
        return failure(
          projected,
          "INVALID_MODE",
          "Only SINGLE Candidate Quests accept individual applications.",
          hirerId,
          currentTime
        );
      const target = projected.applications.find(
        (item) =>
          (item.id === applicationId || item.proposalId === applicationId) &&
          Boolean(item.applicantId) &&
          !item.teamId &&
          item.status === QuestApplicationStatus.APPLICATION_APPLIED
      );
      if (!target)
        return failure(
          projected,
          "APPLICATION_NOT_FOUND",
          "Pending Candidate Proposal not found.",
          hirerId,
          currentTime
        );
      const next = clone(projected);
      const nextTarget = next.applications.find(
        (item) => item.id === target.id
      );
      if (!nextTarget)
        return failure(
          projected,
          "APPLICATION_NOT_FOUND",
          "Candidate Proposal not found.",
          hirerId,
          currentTime
        );
      nextTarget.status = QuestApplicationStatus.APPLICATION_REJECTED;
      nextTarget.decidedAt = currentTime.toISOString();
      commit(next);
      return success(next, hirerId, currentTime);
    },
    rejectTeam: (questId, teamId, hirerId = "demo-hirer", now = baseNow) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (projected.quest.hirerId !== hirerId)
        return failure(
          projected,
          "FORBIDDEN",
          "Only the Hirer can reject a Team Proposal.",
          hirerId,
          currentTime
        );
      if (projected.quest.status !== QuestStatus.QUEST_OPEN)
        return failure(
          projected,
          "INVALID_STATUS",
          "This Quest is not accepting Team Proposal rejection.",
          hirerId,
          currentTime
        );
      if (
        projected.quest.candidateMode !== QuestCandidateMode.CANDIDATE ||
        projected.quest.participation !== QuestParticipation.GROUP
      )
        return failure(
          projected,
          "INVALID_MODE",
          "Only GROUP Candidate Quests accept Team Proposals.",
          hirerId,
          currentTime
        );
      const target = projected.applications.find(
        (item) =>
          item.status === QuestApplicationStatus.APPLICATION_APPLIED &&
          Boolean(item.teamId) &&
          (item.teamId === teamId ||
            item.id === teamId ||
            item.proposalId === teamId)
      );
      if (!target || !target.teamId)
        return failure(
          projected,
          "APPLICATION_NOT_FOUND",
          "Submitted Team Proposal not found.",
          hirerId,
          currentTime
        );
      const team = teamForId(projected, target.teamId);
      if (!team || team.status !== QuestTeamStatus.TEAM_SUBMITTED)
        return failure(
          projected,
          "TEAM_NOT_READY",
          "Only a submitted Team Proposal can be rejected.",
          hirerId,
          currentTime
        );
      const next = clone(projected);
      const nextTarget = next.applications.find(
        (item) => item.id === target.id
      );
      const nextTeam = teamForId(next, team.id);
      if (!nextTarget || !nextTeam)
        return failure(
          projected,
          "APPLICATION_NOT_FOUND",
          "Team Proposal not found.",
          hirerId,
          currentTime
        );
      nextTarget.status = QuestApplicationStatus.APPLICATION_REJECTED;
      nextTarget.decidedAt = currentTime.toISOString();
      nextTeam.status = QuestTeamStatus.TEAM_REJECTED;
      commit(next);
      return success(next, hirerId, currentTime);
    },
    selectCandidate: (
      questId,
      applicationId,
      hirerId = "demo-hirer",
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (projected.quest.hirerId !== hirerId)
        return failure(
          projected,
          "FORBIDDEN",
          "Only the Hirer can select a Candidate.",
          hirerId,
          currentTime
        );
      if (projected.quest.status !== QuestStatus.QUEST_OPEN)
        return failure(
          projected,
          "INVALID_STATUS",
          "This Quest is not accepting Candidate selection.",
          hirerId,
          currentTime
        );
      const selected = applicationForSelection(projected, applicationId);
      if (
        !selected ||
        !eligibleCandidateApplications(projected).some(
          (item) => item.id === selected.id
        )
      )
        return failure(
          projected,
          "APPLICATION_NOT_FOUND",
          "Candidate Proposal not found or not selectable.",
          hirerId,
          currentTime
        );

      let selectedMembers: QuestTeamMember[] = [];
      let selectedTeam: QuestTeam | undefined;
      if (projected.quest.participation === QuestParticipation.SINGLE) {
        if (
          !selected.applicantId ||
          selected.teamId ||
          projected.quest.headcount !== 1
        )
          return failure(
            projected,
            "INVALID_MODE",
            "Only one individual Applicant can be selected for a SINGLE Quest.",
            hirerId,
            currentTime
          );
        selectedMembers = [{ workerId: selected.applicantId, role: "MEMBER" }];
      } else {
        selectedTeam = teamForId(projected, selected.teamId);
        if (
          !selectedTeam ||
          selectedTeam.status !== QuestTeamStatus.TEAM_SUBMITTED
        )
          return failure(
            projected,
            "TEAM_NOT_READY",
            "Only a submitted Quest Team can be selected.",
            hirerId,
            currentTime
          );
        if (
          selectedTeam.members.length === 0 ||
          selectedTeam.members.length > projected.quest.headcount
        )
          return failure(
            projected,
            "TEAM_NOT_READY",
            "The selected Team must be non-empty and fit the requested headcount.",
            hirerId,
            currentTime
          );
        selectedMembers = selectedTeam.members;
      }

      const next = clone(projected);
      const selectedNext = next.applications.find(
        (item) => item.id === selected.id
      );
      if (!selectedNext)
        return failure(
          projected,
          "APPLICATION_NOT_FOUND",
          "Candidate Proposal not found.",
          hirerId,
          currentTime
        );
      selectedNext.status = QuestApplicationStatus.APPLICATION_SELECTED;
      selectedNext.decidedAt = currentTime.toISOString();
      const competing = next.applications.filter(
        (item) =>
          item.id !== selected.id &&
          item.status === QuestApplicationStatus.APPLICATION_APPLIED &&
          (projected.quest.participation === QuestParticipation.SINGLE
            ? !item.teamId
            : Boolean(
                item.teamId &&
                teamForId(projected, item.teamId)?.status ===
                  QuestTeamStatus.TEAM_SUBMITTED
              ))
      );
      competing.forEach((item) => {
        item.status = QuestApplicationStatus.APPLICATION_REJECTED;
        item.decidedAt = currentTime.toISOString();
        const rejectedTeam = teamForId(next, item.teamId);
        if (rejectedTeam?.status === QuestTeamStatus.TEAM_SUBMITTED)
          rejectedTeam.status = QuestTeamStatus.TEAM_REJECTED;
      });
      if (selectedTeam) {
        const selectedTeamNext = teamForId(next, selectedTeam.id);
        if (selectedTeamNext)
          selectedTeamNext.status = QuestTeamStatus.TEAM_SELECTED;
      }
      next.assignments.push(
        ...selectedMembers.map((member, index) =>
          assignment(
            next.quest,
            member.workerId,
            selectedTeam ? "TEAM" : "APPLICATION",
            QuestAssignmentStatus.ASSIGNMENT_ACTIVE,
            `${member.workerId}-${index + 1}`,
            selected.id,
            selectedTeam?.id
          )
        )
      );
      setActualHeadcount(next, selectedMembers.length);
      next.settlement = settlementFor(next, selectedMembers.length);
      next.quest.status = QuestStatus.QUEST_ASSIGNED;
      ensureConversation(next, [
        next.quest.hirerId,
        ...selectedMembers.map((member) => member.workerId),
      ]);
      commit(next);
      return success(next, hirerId, currentTime);
    },
    requestEdit: (questId, changes, hirerId = "demo-hirer", now = baseNow) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (projected.quest.hirerId !== hirerId)
        return failure(
          projected,
          "FORBIDDEN",
          "Only the Hirer can request an edit.",
          hirerId,
          currentTime
        );
      if (
        !(
          [
            QuestStatus.QUEST_ASSIGNED,
            QuestStatus.QUEST_IN_PROGRESS,
          ] as QuestStatusValue[]
        ).includes(projected.quest.status)
      )
        return failure(
          projected,
          "INVALID_STATUS",
          "Edits require an active Assignment.",
          hirerId,
          currentTime
        );
      if (
        projected.editConsent?.status ===
        QuestEditRequestStatus.EDIT_REQUEST_PENDING
      )
        return failure(
          projected,
          "DUPLICATE_ACTION",
          "An edit request is already waiting for responses.",
          hirerId,
          currentTime
        );
      if (
        projected.partialStartConsent?.status ===
        QuestPartialStartConsentStatus.PARTIAL_START_PENDING
      )
        return failure(
          projected,
          "INVALID_STATUS",
          "Partial-start consent must finish before an edit can be requested.",
          hirerId,
          currentTime
        );
      const allowedChanges = new Set([
        "description",
        "completionCriteria",
        "startAt",
        "endAt",
        "deadlineAt",
        "location",
        "imageUris",
      ]);
      if (Object.keys(changes).some((key) => !allowedChanges.has(key)))
        return failure(
          projected,
          "EDIT_NOT_ALLOWED",
          "Core Quest commitments cannot be changed after Assignment.",
          hirerId,
          currentTime
        );
      const workers = activeAssignments(projected);
      if (workers.length === 0)
        return failure(
          projected,
          "INVALID_STATUS",
          "There are no active Workers to consent.",
          hirerId,
          currentTime
        );
      const next = clone(projected);
      const previousStatus = next.quest.status;
      next.quest.status = QuestStatus.QUEST_AWAITING_EDIT_CONSENT;
      next.editConsent = {
        id: `fixture-edit-consent-${next.quest.id}`,
        questId: next.quest.id,
        previousStatus,
        status: QuestEditRequestStatus.EDIT_REQUEST_PENDING,
        requestedChanges: clone(changes),
        requestedAt: currentTime.toISOString(),
        responseDeadlineAt: addMilliseconds(
          currentTime.toISOString(),
          EDIT_CONSENT_WINDOW_MS
        ),
        requiredWorkerCount: workers.length,
        approvedWorkerCount: 0,
        responses: [],
      };
      commit(next);
      return success(next, hirerId, currentTime);
    },
    voteEditConsent: (questId, workerId, approve, now = baseNow) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (
        projected.quest.status !== QuestStatus.QUEST_AWAITING_EDIT_CONSENT ||
        !projected.editConsent ||
        projected.editConsent.status !==
          QuestEditRequestStatus.EDIT_REQUEST_PENDING
      )
        return failure(
          projected,
          "INVALID_STATUS",
          "There is no pending edit consent request.",
          workerId,
          currentTime
        );
      if (!hasActiveAssignment(projected, workerId))
        return failure(
          projected,
          "FORBIDDEN",
          "Only active Workers can vote on this edit.",
          workerId,
          currentTime
        );
      if (
        currentTime.getTime() >=
        new Date(projected.editConsent.responseDeadlineAt).getTime()
      )
        return failure(
          projected,
          "INVALID_STATUS",
          "This edit consent request has timed out. Refresh for the server state.",
          workerId,
          currentTime
        );
      if (
        projected.editConsent.responses.some(
          (item) => item.workerId === workerId
        )
      )
        return failure(
          projected,
          "DUPLICATE_ACTION",
          "You have already responded to this edit request.",
          workerId,
          currentTime
        );
      const next = clone(projected);
      const response: QuestEditConsentResponse = {
        workerId,
        status: approve
          ? QuestEditResponseStatus.EDIT_RESPONSE_APPROVED
          : QuestEditResponseStatus.EDIT_RESPONSE_REJECTED,
        respondedAt: currentTime.toISOString(),
      };
      next.editConsent?.responses.push(response);
      if (!next.editConsent)
        return failure(
          projected,
          "INVALID_STATUS",
          "There is no pending edit consent request.",
          workerId,
          currentTime
        );
      next.editConsent.approvedWorkerCount = next.editConsent.responses.filter(
        (item) => item.status === QuestEditResponseStatus.EDIT_RESPONSE_APPROVED
      ).length;
      if (!approve) {
        next.editConsent.status = QuestEditRequestStatus.EDIT_REQUEST_REJECTED;
        next.quest.status = next.editConsent.previousStatus;
      } else if (
        next.editConsent.approvedWorkerCount >=
        next.editConsent.requiredWorkerCount
      ) {
        next.editConsent.status = QuestEditRequestStatus.EDIT_REQUEST_APPROVED;
        applyEditChanges(next, next.editConsent.requestedChanges);
        next.quest.status = next.editConsent.previousStatus;
      }
      commit(next);
      return success(next, workerId, currentTime);
    },
    votePartialGroupStartConsent: (
      questId,
      voterId,
      approve,
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      const consent = projected.partialStartConsent;
      if (
        projected.quest.status !==
          QuestStatus.QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT ||
        !consent ||
        consent.status !== QuestPartialStartConsentStatus.PARTIAL_START_PENDING
      )
        return failure(
          projected,
          "INVALID_STATUS",
          "There is no pending partial Group start consent.",
          voterId,
          currentTime
        );
      if (!consent.requiredVoterIds.includes(voterId))
        return failure(
          projected,
          "FORBIDDEN",
          "Only the Hirer and frozen Workers can vote on this start.",
          voterId,
          currentTime
        );
      if (
        currentTime.getTime() >= new Date(consent.responseDeadlineAt).getTime()
      )
        return failure(
          projected,
          "INVALID_STATUS",
          "This partial-start consent request has timed out. Refresh for the server state.",
          voterId,
          currentTime
        );
      if (consent.responses.some((item) => item.voterId === voterId))
        return failure(
          projected,
          "DUPLICATE_ACTION",
          "You have already responded to this start request.",
          voterId,
          currentTime
        );
      const next = clone(projected);
      const response: QuestPartialStartConsentResponse = {
        voterId,
        role: voterId === next.quest.hirerId ? "HIRER" : "WORKER",
        status: approve
          ? QuestPartialStartVoteStatus.PARTIAL_START_VOTE_APPROVED
          : QuestPartialStartVoteStatus.PARTIAL_START_VOTE_REJECTED,
        respondedAt: currentTime.toISOString(),
      };
      next.partialStartConsent?.responses.push(response);
      if (!next.partialStartConsent)
        return failure(
          projected,
          "INVALID_STATUS",
          "There is no pending partial Group start consent.",
          voterId,
          currentTime
        );
      next.partialStartConsent.approvedVoterCount =
        next.partialStartConsent.responses.filter(
          (item) =>
            item.status ===
            QuestPartialStartVoteStatus.PARTIAL_START_VOTE_APPROVED
        ).length;
      if (!approve) {
        cancelPartialStart(
          next,
          QuestPartialStartConsentStatus.PARTIAL_START_REJECTED
        );
      } else if (
        next.partialStartConsent.approvedVoterCount >=
        next.partialStartConsent.requiredVoterIds.length
      ) {
        next.partialStartConsent.status =
          QuestPartialStartConsentStatus.PARTIAL_START_APPROVED;
        transitionToInProgress(next);
      }
      commit(next);
      return success(next, voterId, currentTime);
    },
    submitProof: (
      questId,
      ownerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      imageUris = [],
      note = "",
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (projected.quest.status !== QuestStatus.QUEST_IN_PROGRESS)
        return failure(
          projected,
          "INVALID_STATUS",
          "Proof can only be submitted while the Quest is in progress.",
          ownerId,
          currentTime
        );
      if (projected.quest.proofRequired === "none")
        return failure(
          projected,
          "INVALID_MODE",
          "This Quest does not require proof.",
          ownerId,
          currentTime
        );
      if (note.length > MAX_PROOF_NOTE_LENGTH)
        return failure(
          projected,
          "PROOF_NOT_READY",
          `A proof description can contain at most ${MAX_PROOF_NOTE_LENGTH} characters.`,
          ownerId,
          currentTime
        );
      if (imageUris.length > MAX_PROOF_ATTACHMENTS)
        return failure(
          projected,
          "PROOF_NOT_READY",
          `A proof can contain at most ${MAX_PROOF_ATTACHMENTS} images.`,
          ownerId,
          currentTime
        );
      if (!note.trim() && imageUris.length === 0)
        return failure(
          projected,
          "PROOF_NOT_READY",
          "A proof needs a description or at least one image.",
          ownerId,
          currentTime
        );
      const selectedTeam = projected.teams.find(
        (teamItem) =>
          teamItem.status === QuestTeamStatus.TEAM_SELECTED &&
          teamItem.members.some((member) => member.workerId === ownerId)
      );
      if (selectedTeam && selectedTeam.leaderId !== ownerId)
        return failure(
          projected,
          "FORBIDDEN",
          "Only the Team Leader can submit the Team proof.",
          ownerId,
          currentTime
        );
      if (!selectedTeam && !hasActiveAssignment(projected, ownerId))
        return failure(
          projected,
          "FORBIDDEN",
          "Only an active Worker can submit proof.",
          ownerId,
          currentTime
        );
      const proofOwnerId = selectedTeam?.id ?? ownerId;
      const next = clone(projected);
      const existing = next.proofs.find(
        (item) => item.ownerId === proofOwnerId
      );
      if (existing?.submittedAt)
        return failure(
          projected,
          "DUPLICATE_ACTION",
          "This proof has already been sent and cannot be edited.",
          ownerId,
          currentTime
        );
      const nextProof: QuestProof =
        existing ??
        proof(
          next.quest,
          proofOwnerId,
          QuestProofStatus.PROOF_PENDING,
          0,
          undefined,
          selectedTeam?.id
        );
      nextProof.teamId = selectedTeam?.id;
      nextProof.status = QuestProofStatus.PROOF_PENDING;
      nextProof.imageUris = [...imageUris].slice(0, MAX_PROOF_ATTACHMENTS);
      nextProof.note = note;
      nextProof.submittedAt = currentTime.toISOString();
      nextProof.reviewedAt = undefined;
      nextProof.reviewReason = undefined;
      if (!existing) next.proofs.push(nextProof);
      next.quest.status = QuestStatus.QUEST_IN_PROGRESS;
      commit(next);
      return success(next, ownerId, currentTime);
    },
    reviewProof: (
      questId,
      proofId,
      approve,
      reason = "",
      hirerId = "demo-hirer",
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (projected.quest.hirerId !== hirerId)
        return failure(
          projected,
          "FORBIDDEN",
          "Only the Hirer can review proof.",
          hirerId,
          currentTime
        );
      if (
        !(
          [
            QuestStatus.QUEST_IN_PROGRESS,
            QuestStatus.QUEST_SUBMITTED,
          ] as QuestStatusValue[]
        ).includes(projected.quest.status)
      )
        return failure(
          projected,
          "INVALID_STATUS",
          "This Quest is not waiting for proof review.",
          hirerId,
          currentTime
        );
      const target = projected.proofs.find(
        (item) =>
          item.id === proofId && item.status === QuestProofStatus.PROOF_PENDING
      );
      if (!target)
        return failure(
          projected,
          "PROOF_NOT_FOUND",
          "Pending proof not found.",
          hirerId,
          currentTime
        );
      const next = clone(projected);
      const nextProof = next.proofs.find((item) => item.id === proofId);
      if (!nextProof)
        return failure(
          projected,
          "PROOF_NOT_FOUND",
          "Proof not found.",
          hirerId,
          currentTime
        );
      const completionItems = next.assignments.filter((assignmentItem) =>
        nextProof.teamId
          ? assignmentItem.teamId === nextProof.teamId
          : assignmentItem.workerId === nextProof.ownerId
      );
      nextProof.reviewedAt = currentTime.toISOString();
      nextProof.reviewReason = reason || undefined;
      if (approve) {
        nextProof.status = QuestProofStatus.PROOF_APPROVED;
        completionItems.forEach((item) => {
          item.status = QuestAssignmentStatus.ASSIGNMENT_COMPLETED;
          item.completedAt = currentTime.toISOString();
        });
        const allCompleted = next.assignments
          .filter(
            (assignmentItem) =>
              assignmentItem.status !==
              QuestAssignmentStatus.ASSIGNMENT_CANCELLED
          )
          .every(
            (assignmentItem) =>
              assignmentItem.status ===
              QuestAssignmentStatus.ASSIGNMENT_COMPLETED
          );
        if (allCompleted) next.quest.status = QuestStatus.QUEST_COMPLETED;
      } else {
        nextProof.status = QuestProofStatus.PROOF_REJECTED;
        completionItems.forEach((item) => {
          item.status = QuestAssignmentStatus.ASSIGNMENT_INCOMPLETE;
          item.completedAt = undefined;
        });
        next.quest.status = QuestStatus.QUEST_FAILED;
      }
      commit(next);
      return success(next, hirerId, currentTime);
    },
    submitRework: (
      questId,
      proofId,
      ownerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      imageUris = [],
      note = "",
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (projected.quest.status !== QuestStatus.QUEST_REWORK)
        return failure(
          projected,
          "INVALID_STATUS",
          "This Quest is not waiting for rework.",
          ownerId,
          currentTime
        );
      const target = projected.proofs.find(
        (item) =>
          item.id === proofId && item.status === QuestProofStatus.PROOF_REJECTED
      );
      if (!target)
        return failure(
          projected,
          "PROOF_NOT_FOUND",
          "A rejected proof for this Worker was not found.",
          ownerId,
          currentTime
        );
      const targetTeam = target.teamId
        ? teamForId(projected, target.teamId)
        : undefined;
      const canRework = targetTeam
        ? targetTeam.members.some((member) => member.workerId === ownerId) &&
          hasActiveAssignment(projected, ownerId)
        : target.ownerId === ownerId && hasActiveAssignment(projected, ownerId);
      if (!canRework)
        return failure(
          projected,
          "FORBIDDEN",
          "Only the rejected proof owner can submit rework.",
          ownerId,
          currentTime
        );
      if (target.reworkCount >= target.reworkLimit)
        return failure(
          projected,
          "PROOF_NOT_READY",
          "The rework quota is exhausted; this Quest requires dispute resolution.",
          ownerId,
          currentTime
        );
      const next = clone(projected);
      const nextProof = next.proofs.find((item) => item.id === proofId);
      if (!nextProof)
        return failure(
          projected,
          "PROOF_NOT_FOUND",
          "Proof not found.",
          ownerId,
          currentTime
        );
      nextProof.reworkCount += 1;
      nextProof.status = QuestProofStatus.PROOF_PENDING;
      nextProof.imageUris = [...imageUris].slice(0, 3);
      nextProof.note = note;
      nextProof.submittedAt = currentTime.toISOString();
      nextProof.reviewedAt = undefined;
      nextProof.reviewReason = undefined;
      const requiredOwners = next.teams.some(
        (teamItem) => teamItem.status === QuestTeamStatus.TEAM_SELECTED
      )
        ? [
            next.teams.find(
              (teamItem) => teamItem.status === QuestTeamStatus.TEAM_SELECTED
            )?.id,
          ].filter((id): id is string => Boolean(id))
        : activeAssignments(next).map((item) => item.workerId);
      const submittedOwners = new Set(
        next.proofs
          .filter((item) =>
            (
              [
                QuestProofStatus.PROOF_PENDING,
                QuestProofStatus.PROOF_APPROVED,
                QuestProofStatus.PROOF_AUTO_APPROVED,
              ] as QuestProof["status"][]
            ).includes(item.status)
          )
          .map((item) => item.ownerId)
      );
      if (
        requiredOwners.length > 0 &&
        requiredOwners.every((requiredOwner) =>
          submittedOwners.has(requiredOwner)
        )
      )
        next.quest.status = QuestStatus.QUEST_SUBMITTED;
      else next.quest.status = QuestStatus.QUEST_IN_PROGRESS;
      commit(next);
      return success(next, ownerId, currentTime);
    },
    confirmCompletion: (
      questId,
      workerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (
        projected.quest.status !== QuestStatus.QUEST_IN_PROGRESS ||
        projected.quest.proofRequired !== "none"
      )
        return failure(
          projected,
          "INVALID_STATUS",
          "This Quest is not ready for proof-free completion.",
          workerId,
          currentTime
        );
      const selectedTeam = projected.teams.find(
        (teamItem) =>
          teamItem.status === QuestTeamStatus.TEAM_SELECTED &&
          teamItem.members.some((member) => member.workerId === workerId)
      );
      if (selectedTeam && selectedTeam.leaderId !== workerId)
        return failure(
          projected,
          "FORBIDDEN",
          "Only the Team Leader can confirm the Team's completion.",
          workerId,
          currentTime
        );
      const next = clone(projected);
      const completionItems = selectedTeam
        ? next.assignments.filter(
            (assignmentItem) =>
              assignmentItem.teamId === selectedTeam.id &&
              assignmentItem.status === QuestAssignmentStatus.ASSIGNMENT_ACTIVE
          )
        : next.assignments.filter(
            (assignmentItem) =>
              assignmentItem.workerId === workerId &&
              assignmentItem.status === QuestAssignmentStatus.ASSIGNMENT_ACTIVE
          );
      if (completionItems.length === 0)
        return failure(
          projected,
          "FORBIDDEN",
          "Only an active Worker can confirm completion.",
          workerId,
          currentTime
        );
      completionItems.forEach((item) => {
        item.status = QuestAssignmentStatus.ASSIGNMENT_COMPLETED;
        item.completedAt = currentTime.toISOString();
      });
      if (
        next.assignments
          .filter(
            (assignmentItem) =>
              assignmentItem.status !==
              QuestAssignmentStatus.ASSIGNMENT_CANCELLED
          )
          .every(
            (assignmentItem) =>
              assignmentItem.status ===
              QuestAssignmentStatus.ASSIGNMENT_COMPLETED
          )
      )
        next.quest.status = QuestStatus.QUEST_COMPLETED;
      commit(next);
      return success(next, workerId, currentTime);
    },
    completeQuest: (questId, hirerId = "demo-hirer", now = baseNow) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (projected.quest.hirerId !== hirerId)
        return failure(
          projected,
          "FORBIDDEN",
          "Only the Hirer can complete this Quest.",
          hirerId,
          currentTime
        );
      if (projected.quest.status !== QuestStatus.QUEST_APPROVED)
        return failure(
          projected,
          "INVALID_STATUS",
          "The Quest is not approved for completion.",
          hirerId,
          currentTime
        );
      const next = clone(projected);
      next.quest.status = QuestStatus.QUEST_COMPLETED;
      next.assignments.forEach((item) => {
        if (item.status === QuestAssignmentStatus.ASSIGNMENT_ACTIVE)
          item.status = QuestAssignmentStatus.ASSIGNMENT_COMPLETED;
      });
      commit(next);
      return success(next, hirerId, currentTime);
    },
    openDispute: (
      questId,
      actorId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (
        (actorId !== projected.quest.hirerId &&
          !hasAssignment(projected, actorId)) ||
        (actorId === projected.quest.hirerId &&
          !activeAssignments(projected).length)
      )
        return failure(
          projected,
          "FORBIDDEN",
          "Only the Hirer or an assigned Worker can open a dispute.",
          actorId,
          currentTime
        );
      if (isTerminal(projected.quest.status))
        return failure(
          projected,
          "INVALID_STATUS",
          "A terminal Quest cannot be disputed.",
          actorId,
          currentTime
        );
      const next = clone(projected);
      next.quest.status = QuestStatus.QUEST_DISPUTED;
      ensureConversation(next, [
        next.quest.hirerId,
        ...next.assignments.map((item) => item.workerId),
      ]);
      commit(next);
      return success(next, actorId, currentTime);
    },
    resolveDispute: (questId, actorId = "admin-demo", now = baseNow) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (actorId !== "admin-demo" && actorId !== projected.quest.hirerId)
        return failure(
          projected,
          "FORBIDDEN",
          "Only an authorized resolver can resolve a dispute.",
          actorId,
          currentTime
        );
      if (projected.quest.status !== QuestStatus.QUEST_DISPUTED)
        return failure(
          projected,
          "INVALID_STATUS",
          "This Quest is not disputed.",
          actorId,
          currentTime
        );
      const next = clone(projected);
      next.quest.status = QuestStatus.QUEST_COMPLETED;
      next.assignments.forEach((item) => {
        if (item.status === QuestAssignmentStatus.ASSIGNMENT_ACTIVE)
          item.status = QuestAssignmentStatus.ASSIGNMENT_COMPLETED;
      });
      commit(next);
      return success(next, actorId, currentTime);
    },
    cancelQuest: (questId, actorId = "demo-hirer", now = baseNow) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (actorId !== projected.quest.hirerId && actorId !== "admin-demo")
        return failure(
          projected,
          "FORBIDDEN",
          "Only the Hirer or Admin can cancel this Quest.",
          actorId,
          currentTime
        );
      if (isTerminal(projected.quest.status))
        return failure(
          projected,
          "INVALID_STATUS",
          "A terminal Quest cannot be reopened or cancelled.",
          actorId,
          currentTime
        );
      const next = clone(projected);
      const preStart = (
        [
          QuestStatus.QUEST_OPEN,
          QuestStatus.QUEST_ASSIGNED,
          QuestStatus.QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT,
          QuestStatus.QUEST_AWAITING_EDIT_CONSENT,
        ] as QuestStatusValue[]
      ).includes(next.quest.status);
      if (
        next.quest.status ===
        QuestStatus.QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT
      )
        cancelPartialStart(
          next,
          QuestPartialStartConsentStatus.PARTIAL_START_REJECTED
        );
      else {
        next.quest.status = QuestStatus.QUEST_CANCELLED;
        if (preStart) next.assignments = [];
        else
          next.assignments.forEach((item) => {
            if (item.status === QuestAssignmentStatus.ASSIGNMENT_ACTIVE)
              item.status = QuestAssignmentStatus.ASSIGNMENT_CANCELLED;
          });
        setActualHeadcount(next, 0);
        if (preStart) next.settlement = settlementFor(next, 0, true);
        makeReadOnly(next);
      }
      commit(next);
      return success(next, actorId, currentTime);
    },
    publishQuest: (questId, hirerId = "demo-hirer", now = baseNow) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (projected.quest.hirerId !== hirerId)
        return failure(
          projected,
          "FORBIDDEN",
          "Only the Hirer can publish this Quest.",
          hirerId,
          currentTime
        );
      if (projected.quest.status !== QuestStatus.QUEST_DRAFT)
        return failure(
          projected,
          "INVALID_STATUS",
          "Only Draft Quests can be published.",
          hirerId,
          currentTime
        );
      const check = calculatePublishCheck(projected.quest, feeRateBasisPoints);
      if (!check.canPublish)
        return failure(
          projected,
          "PUBLISH_BLOCKED",
          `Publish is blocked: ${check.blockers.join(", ")}.`,
          hirerId,
          currentTime
        );
      const next = clone(projected);
      next.quest.status = QuestStatus.QUEST_OPEN;
      next.quest.postedAt = currentTime.toISOString();
      next.publishCheck = check;
      commit(next);
      return success(next, hirerId, currentTime);
    },
  };
  const dispatch = (): QuestFixtureResult => {
    switch (action.type) {
      case "CREATE_AND_PUBLISH":
        return handlers.createAndPublishQuest(
          action.payload,
          action.hirerId,
          baseNow
        );
      case "DIRECT_JOIN":
        return handlers.joinDirect(action.questId, action.workerId, baseNow);
      case "APPLY":
        return handlers.applyCandidate(
          action.questId,
          action.workerId,
          baseNow
        );
      case "WITHDRAW_APPLICATION":
        return handlers.withdrawApplication(
          action.questId,
          action.applicationId,
          action.workerId ?? action.applicantId,
          baseNow
        );
      case "CREATE_TEAM":
        return handlers.createTeam(
          action.questId,
          action.leaderId,
          action.name,
          baseNow
        );
      case "INVITE_WORKER":
        return handlers.inviteWorker(
          action.questId,
          action.workerId,
          action.leaderId,
          baseNow
        );
      case "REVOKE_INVITATION":
        return handlers.revokeInvitation(
          action.questId,
          action.invitationId,
          action.leaderId,
          baseNow
        );
      case "RESPOND_INVITATION":
        return handlers.respondToInvitation(
          action.questId,
          action.invitationId,
          action.workerId,
          action.accept,
          baseNow
        );
      case "SUBMIT_TEAM":
        return handlers.submitTeam(action.questId, action.leaderId, baseNow);
      case "SELECT_CANDIDATE":
        return handlers.selectCandidate(
          action.questId,
          action.applicationId,
          action.hirerId,
          baseNow
        );
      case "REJECT_CANDIDATE":
        return handlers.rejectCandidate(
          action.questId,
          action.applicationId,
          action.hirerId,
          baseNow
        );
      case "REJECT_TEAM":
        return handlers.rejectTeam(
          action.questId,
          action.teamId,
          action.hirerId,
          baseNow
        );
      case "SELECT_TEAM": {
        const current = getInternal(action.questId);
        const proposal = current?.applications.find(
          (item) =>
            item.teamId === action.teamId &&
            item.status === QuestApplicationStatus.APPLICATION_APPLIED
        );
        return handlers.selectCandidate(
          action.questId,
          proposal?.id ?? action.teamId,
          action.hirerId,
          baseNow
        );
      }
      case "REQUEST_EDIT":
        return handlers.requestEdit(
          action.questId,
          action.changes,
          action.hirerId,
          baseNow
        );
      case "VOTE_EDIT_CONSENT":
        return handlers.voteEditConsent(
          action.questId,
          action.workerId,
          action.approve,
          baseNow
        );
      case "VOTE_PARTIAL_GROUP_START_CONSENT":
        return handlers.votePartialGroupStartConsent(
          action.questId,
          action.voterId,
          action.approve,
          baseNow
        );
      case "VOTE_PARTIAL_START_CONSENT":
        return handlers.votePartialGroupStartConsent(
          action.questId,
          action.voterId,
          action.approve,
          baseNow
        );
      case "SUBMIT_PROOF":
        return handlers.submitProof(
          action.questId,
          action.ownerId,
          action.imageUris,
          action.note,
          baseNow
        );
      case "REVIEW_PROOF":
        return handlers.reviewProof(
          action.questId,
          action.proofId,
          action.approve,
          action.reason,
          action.hirerId,
          baseNow
        );
      case "REWORK_PROOF":
        return handlers.submitRework(
          action.questId,
          action.proofId,
          action.ownerId,
          action.imageUris,
          action.note,
          baseNow
        );
      case "CONFIRM_COMPLETION":
        return handlers.confirmCompletion(
          action.questId,
          action.workerId,
          baseNow
        );
      case "COMPLETE":
        return handlers.completeQuest(action.questId, action.hirerId, baseNow);
      case "OPEN_DISPUTE":
        return handlers.openDispute(action.questId, action.actorId, baseNow);
      case "RESOLVE_DISPUTE":
        return handlers.resolveDispute(action.questId, action.actorId, baseNow);
      case "CANCEL":
        return handlers.cancelQuest(action.questId, action.actorId, baseNow);
      case "PUBLISH":
        return handlers.publishQuest(action.questId, action.hirerId, baseNow);
    }
  };
  const result = dispatch();
  return result.ok
    ? { ok: true, state: result.state, nextState: committedState }
    : {
        ok: false,
        state: result.state,
        nextState: committedState,
        error: result.error,
      };
}

export const questReducer = reduceQuestAction;
