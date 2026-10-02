import { isValidSatang } from "@/domain/satang";
import { isTerminalStatus } from "@/domain/questLifecycle";
import {
  DEFAULT_PLATFORM_FEE_BASIS_POINTS,
  PARTIAL_GROUP_START_CONSENT_WINDOW_MS,
} from "./constants";
import { addMilliseconds, blankCapabilities, clone } from "./questStateUtils";
import {
  QuestApplicationStatus,
  QuestAssignmentStatus,
  QuestCandidateMode,
  QuestEditRequestStatus,
  QuestInvitationStatus,
  QuestPartialStartConsentStatus,
  QuestParticipation,
  QuestProofStatus,
  QuestStatus,
  QuestTeamStatus,
  type QuestAction,
  type QuestApplication,
  type QuestAssignment,
  type QuestContract,
  type QuestDetailState,
  type QuestEditConsent,
  type QuestEscrowSummary,
  type QuestPartialStartConsent,
  type QuestPublishCheck,
  type QuestSettlementSummary,
  type QuestStatus as QuestStatusValue,
  type QuestTeam,
  type WorkConversationCapability,
} from "./types";
// Pure Quest lifecycle rules and selectors live here.
function normalizeStateShape(value: QuestDetailState): QuestDetailState {
  const state = value;
  if (!Array.isArray(state.teams)) state.teams = state.team ? [state.team] : [];
  if (!Array.isArray(state.invitations)) state.invitations = [];
  if (!Array.isArray(state.applications)) state.applications = [];
  if (!Array.isArray(state.assignments)) state.assignments = [];
  if (!Array.isArray(state.proofs)) state.proofs = [];
  if (!Array.isArray(state.conversationMemberIds))
    state.conversationMemberIds = [];
  if (state.actualHeadcount === undefined)
    state.actualHeadcount = countAdmitted(state);
  if (!state.capabilities) state.capabilities = blankCapabilities();
  if (!state.conversation)
    state.conversation = {
      conversationId: null,
      canRead: false,
      canWrite: false,
      readOnly: true,
      readOnlyReason: "NOT_STARTED",
    };
  return state;
}

function countAdmitted(state: QuestDetailState): number {
  return state.assignments.filter(
    (item) => item.status !== QuestAssignmentStatus.ASSIGNMENT_CANCELLED
  ).length;
}

function activeAssignments(state: QuestDetailState): QuestAssignment[] {
  return state.assignments.filter(
    (item) => item.status === QuestAssignmentStatus.ASSIGNMENT_ACTIVE
  );
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function setActualHeadcount(
  state: QuestDetailState,
  count = countAdmitted(state)
): void {
  state.actualHeadcount = Math.max(0, count);
}

function settlementFor(
  state: QuestDetailState,
  actualHeadcount: number,
  fullRefund = false
): QuestSettlementSummary {
  const requestedHeadcount = state.quest.headcount;
  const rewardSatangPerWorker = state.quest.reward.rewardSatang;
  const reservedRewardSatang =
    rewardSatangPerWorker * Math.max(0, requestedHeadcount);
  const settledRewardSatang = fullRefund
    ? 0
    : rewardSatangPerWorker * Math.max(0, actualHeadcount);
  const refundSatang = fullRefund
    ? reservedRewardSatang
    : rewardSatangPerWorker * Math.max(0, requestedHeadcount - actualHeadcount);
  return {
    requestedHeadcount,
    actualHeadcount: Math.max(0, actualHeadcount),
    rewardSatangPerWorker,
    reservedRewardSatang,
    settledRewardSatang,
    refundSatang,
    fullRefund,
  };
}

function makeReadOnly(state: QuestDetailState): void {
  if (!state.conversation.conversationId) return;
  state.conversation = {
    ...state.conversation,
    canRead: true,
    canWrite: false,
    readOnly: true,
    readOnlyReason: "TERMINAL",
  };
}

function cancelBeforeStart(
  state: QuestDetailState,
  removeAssignments = true
): void {
  state.quest.status = QuestStatus.QUEST_CANCELLED;
  if (removeAssignments) state.assignments = [];
  else
    state.assignments.forEach((item) => {
      if (item.status === QuestAssignmentStatus.ASSIGNMENT_ACTIVE)
        item.status = QuestAssignmentStatus.ASSIGNMENT_CANCELLED;
    });
  setActualHeadcount(state, 0);
  state.settlement = settlementFor(state, 0, true);
  if (
    state.partialStartConsent?.status ===
    QuestPartialStartConsentStatus.PARTIAL_START_PENDING
  ) {
    state.partialStartConsent.status =
      QuestPartialStartConsentStatus.PARTIAL_START_TIMED_OUT;
  }
  makeReadOnly(state);
}

function transitionToInProgress(state: QuestDetailState): void {
  if (countAdmitted(state) === 0) {
    cancelBeforeStart(state);
    return;
  }
  state.quest.status = QuestStatus.QUEST_IN_PROGRESS;
  setActualHeadcount(state);
  state.settlement = settlementFor(
    state,
    state.actualHeadcount ?? countAdmitted(state)
  );
  activeAssignments(state).forEach((item) => {
    item.startedAt = item.startedAt ?? state.quest.startAt;
  });
}

function normalizeInvitationStatuses(state: QuestDetailState, now: Date): void {
  const nowMs = now.getTime();
  state.invitations.forEach((invitation) => {
    if (invitation.status !== QuestInvitationStatus.INVITATION_PENDING) return;
    const expiry = new Date(invitation.expiresAt).getTime();
    if (Number.isFinite(expiry) && nowMs >= expiry)
      invitation.status = QuestInvitationStatus.INVITATION_EXPIRED;
  });
}

function openPartialStartConsent(
  state: QuestDetailState,
  requestedAt = state.quest.startAt
): void {
  const frozenWorkerIds = unique(
    state.assignments
      .filter(
        (item) => item.status !== QuestAssignmentStatus.ASSIGNMENT_CANCELLED
      )
      .map((item) => item.workerId)
  );
  if (
    frozenWorkerIds.length === 0 ||
    frozenWorkerIds.length >= state.quest.headcount
  ) {
    if (frozenWorkerIds.length === 0) cancelBeforeStart(state);
    else transitionToInProgress(state);
    return;
  }
  state.actualHeadcount = frozenWorkerIds.length;
  state.quest.status = QuestStatus.QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT;
  state.partialStartConsent = {
    id: `fixture-partial-start-consent-${state.quest.id}`,
    questId: state.quest.id,
    status: QuestPartialStartConsentStatus.PARTIAL_START_PENDING,
    requestedAt,
    responseDeadlineAt: addMilliseconds(
      requestedAt,
      PARTIAL_GROUP_START_CONSENT_WINDOW_MS
    ),
    requiredVoterIds: [state.quest.hirerId, ...frozenWorkerIds],
    frozenWorkerIds,
    approvedVoterCount: 0,
    responses: [],
  };
}

function cancelPartialStart(
  state: QuestDetailState,
  status: QuestPartialStartConsentStatus
): void {
  if (state.partialStartConsent) state.partialStartConsent.status = status;
  state.assignments = [];
  state.quest.status = QuestStatus.QUEST_CANCELLED;
  setActualHeadcount(state, 0);
  state.settlement = settlementFor(state, 0, true);
  makeReadOnly(state);
}

function applyEditChanges(
  state: QuestDetailState,
  changes: QuestEditConsent["requestedChanges"]
): void {
  if (changes.description !== undefined)
    state.quest.description = changes.description;
  if (changes.completionCriteria !== undefined)
    state.quest.completionCriteria = changes.completionCriteria;
  if (changes.startAt !== undefined) state.quest.startAt = changes.startAt;
  if (changes.endAt !== undefined) state.quest.endAt = changes.endAt;
  if (changes.deadlineAt !== undefined)
    state.quest.deadlineAt = changes.deadlineAt;
  if (changes.location !== undefined) state.quest.location = changes.location;
  if (changes.imageUris !== undefined)
    state.quest.imageUris = [...changes.imageUris].slice(0, 3);
}

/**
 * Apply clock-driven effects to a clone. The stored fixture is never changed by
 * a read at another clock value.
 */
function projectLifecycle(state: QuestDetailState, now: Date): void {
  normalizeInvitationStatuses(state, now);

  // Older fixture data used one umbrella status. Keep it readable, but project
  // edit requests into their canonical state before applying clock effects.
  if (state.quest.status === QuestStatus.QUEST_AWAITING_CONSENT) {
    state.quest.status =
      state.editConsent?.status === QuestEditRequestStatus.EDIT_REQUEST_PENDING
        ? QuestStatus.QUEST_AWAITING_EDIT_CONSENT
        : QuestStatus.QUEST_OPEN;
  }

  const editConsent = state.editConsent;
  const editDeadline = editConsent
    ? new Date(editConsent.responseDeadlineAt).getTime()
    : Number.NaN;
  if (
    editConsent?.status === QuestEditRequestStatus.EDIT_REQUEST_PENDING &&
    Number.isFinite(editDeadline) &&
    now.getTime() >= editDeadline
  ) {
    editConsent.status = QuestEditRequestStatus.EDIT_REQUEST_REJECTED;
    state.quest.status = editConsent.previousStatus;
  }

  const partialConsent = state.partialStartConsent;
  const partialDeadline = partialConsent
    ? new Date(partialConsent.responseDeadlineAt).getTime()
    : Number.NaN;
  if (
    state.quest.status ===
      QuestStatus.QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT &&
    partialConsent?.status ===
      QuestPartialStartConsentStatus.PARTIAL_START_PENDING
  ) {
    if (Number.isFinite(partialDeadline) && now.getTime() >= partialDeadline) {
      cancelPartialStart(
        state,
        QuestPartialStartConsentStatus.PARTIAL_START_TIMED_OUT
      );
    }
    return;
  }

  const startAt = new Date(state.quest.startAt).getTime();
  if (!Number.isFinite(startAt) || now.getTime() < startAt) return;

  if (state.quest.status === QuestStatus.QUEST_ASSIGNED) {
    transitionToInProgress(state);
    return;
  }

  if (state.quest.status !== QuestStatus.QUEST_OPEN) return;

  const admitted = countAdmitted(state);
  if (
    state.quest.participation === QuestParticipation.GROUP &&
    state.quest.candidateMode === QuestCandidateMode.NO_CANDIDATE
  ) {
    if (admitted === 0) cancelBeforeStart(state);
    else if (admitted >= state.quest.headcount) transitionToInProgress(state);
    else {
      openPartialStartConsent(state);
      const openedConsent = state.partialStartConsent;
      if (
        openedConsent?.status ===
          QuestPartialStartConsentStatus.PARTIAL_START_PENDING &&
        now.getTime() >= new Date(openedConsent.responseDeadlineAt).getTime()
      ) {
        cancelPartialStart(
          state,
          QuestPartialStartConsentStatus.PARTIAL_START_TIMED_OUT
        );
      }
    }
    return;
  }

  // An unselected Candidate (individual or team) cannot silently start.
  if (admitted === 0) cancelBeforeStart(state);
  else transitionToInProgress(state);
}

function projectedState(state: QuestDetailState, now: Date): QuestDetailState {
  const result = normalizeStateShape(clone(state));
  projectLifecycle(result, now);
  return result;
}

function teamForId(
  state: QuestDetailState,
  teamId: string | undefined
): QuestTeam | undefined {
  return teamId ? state.teams.find((item) => item.id === teamId) : undefined;
}

function teamForViewer(
  state: QuestDetailState,
  viewerId: string
): QuestTeam | undefined {
  return (
    state.teams.find(
      (teamItem) => teamItem.status === QuestTeamStatus.TEAM_SELECTED
    ) ??
    state.teams.find((teamItem) =>
      teamItem.members.some((member) => member.workerId === viewerId)
    )
  );
}

function syncLegacyTeamProjection(
  state: QuestDetailState,
  viewerId: string
): void {
  const selected = state.teams.find(
    (teamItem) => teamItem.status === QuestTeamStatus.TEAM_SELECTED
  );
  const own = state.teams.find((teamItem) =>
    teamItem.members.some((member) => member.workerId === viewerId)
  );
  const first = state.teams[0];
  state.team = selected ?? own ?? first;
}

function hasActiveAssignment(
  state: QuestDetailState,
  workerId: string
): boolean {
  return state.assignments.some(
    (item) =>
      item.workerId === workerId &&
      item.status === QuestAssignmentStatus.ASSIGNMENT_ACTIVE
  );
}

function hasAssignment(state: QuestDetailState, workerId: string): boolean {
  return state.assignments.some(
    (item) =>
      item.workerId === workerId &&
      item.status !== QuestAssignmentStatus.ASSIGNMENT_CANCELLED
  );
}

function isTeamMember(state: QuestDetailState, workerId: string): boolean {
  return state.teams.some((teamItem) =>
    teamItem.members.some((member) => member.workerId === workerId)
  );
}

function isPendingInvitation(
  state: QuestDetailState,
  workerId: string
): boolean {
  return state.invitations.some(
    (item) =>
      item.invitedWorkerId === workerId &&
      item.status === QuestInvitationStatus.INVITATION_PENDING
  );
}

function isTeamParticipant(state: QuestDetailState, workerId: string): boolean {
  return isTeamMember(state, workerId) || isPendingInvitation(state, workerId);
}

const isTerminal = isTerminalStatus;

function conversationFor(
  state: QuestDetailState,
  viewerId: string
): WorkConversationCapability {
  const conversationId = state.conversation.conversationId;
  const isMember = Boolean(
    conversationId &&
    (state.conversationMemberIds
      ? state.conversationMemberIds.includes(viewerId)
      : state.conversation.canRead)
  );
  if (!conversationId || !isMember) {
    return {
      conversationId: conversationId ?? null,
      canRead: false,
      canWrite: false,
      readOnly: true,
      readOnlyReason: "NOT_A_MEMBER",
    };
  }
  if (
    state.conversation.readOnly &&
    state.conversation.canRead &&
    !state.conversation.canWrite
  ) {
    return { ...state.conversation, conversationId };
  }
  if (isTerminalStatus(state.quest.status)) {
    return {
      conversationId,
      canRead: true,
      canWrite: false,
      readOnly: true,
      readOnlyReason: "TERMINAL",
    };
  }
  return { conversationId, canRead: true, canWrite: true, readOnly: false };
}

function eligibleCandidateApplications(
  state: QuestDetailState
): QuestApplication[] {
  return state.applications.filter((item) => {
    if (item.status !== QuestApplicationStatus.APPLICATION_APPLIED)
      return false;
    if (state.quest.participation === QuestParticipation.SINGLE)
      return Boolean(item.applicantId) && !item.teamId;
    const candidateTeam = teamForId(state, item.teamId);
    return Boolean(
      item.teamId && candidateTeam?.status === QuestTeamStatus.TEAM_SUBMITTED
    );
  });
}

function actionForViewer(
  state: QuestDetailState,
  viewerId: string
): QuestAction[] {
  const actions: QuestAction[] = [];
  const quest = state.quest;
  const isHirer = viewerId === quest.hirerId;
  const active = hasActiveAssignment(state, viewerId);
  const ownTeam = teamForViewer(state, viewerId);
  const selectedTeam = state.teams.find(
    (teamItem) =>
      teamItem.status === QuestTeamStatus.TEAM_SELECTED &&
      teamItem.members.some((member) => member.workerId === viewerId)
  );
  const hasActiveTeamAssignment = selectedTeam
    ? state.assignments.some(
        (assignmentItem) =>
          assignmentItem.teamId === selectedTeam.id &&
          assignmentItem.status === QuestAssignmentStatus.ASSIGNMENT_ACTIVE
      )
    : false;
  const canSubmitWork = selectedTeam
    ? selectedTeam.leaderId === viewerId && hasActiveTeamAssignment
    : active;
  const proofOwnerId = selectedTeam?.id ?? viewerId;
  const hasSubmittedProof = state.proofs.some(
    (proofItem) =>
      proofItem.ownerId === proofOwnerId && Boolean(proofItem.submittedAt)
  );
  const pendingInvitation = isPendingInvitation(state, viewerId);
  const full = countAdmitted(state) >= quest.headcount;
  const ownPendingApplication = state.applications.some(
    (item) =>
      item.applicantId === viewerId &&
      item.status === QuestApplicationStatus.APPLICATION_APPLIED
  );
  const ownRejectedApplication = state.applications.some(
    (item) =>
      item.applicantId === viewerId &&
      item.status === QuestApplicationStatus.APPLICATION_REJECTED
  );

  if (quest.status === QuestStatus.QUEST_DRAFT && isHirer)
    actions.push("PUBLISH");
  if (quest.status === QuestStatus.QUEST_OPEN && !isHirer) {
    if (
      quest.candidateMode === QuestCandidateMode.NO_CANDIDATE &&
      !full &&
      !hasAssignment(state, viewerId)
    )
      actions.push("DIRECT_JOIN");
    if (
      quest.candidateMode === QuestCandidateMode.CANDIDATE &&
      quest.participation === QuestParticipation.SINGLE &&
      !ownPendingApplication &&
      !ownRejectedApplication &&
      !hasAssignment(state, viewerId)
    )
      actions.push("APPLY");
    if (
      quest.candidateMode === QuestCandidateMode.CANDIDATE &&
      quest.participation === QuestParticipation.GROUP &&
      !isTeamParticipant(state, viewerId)
    )
      actions.push("CREATE_TEAM");
  }
  if (
    ownTeam?.leaderId === viewerId &&
    ownTeam.status === QuestTeamStatus.TEAM_FORMING
  ) {
    actions.push("INVITE_WORKER");
    if (ownTeam.members.length > 0) actions.push("SUBMIT_TEAM");
  }
  if (pendingInvitation) actions.push("RESPOND_INVITATION");
  const eligibleProposals = eligibleCandidateApplications(state);
  if (isHirer && eligibleProposals.length > 0) {
    actions.push("SELECT_CANDIDATE");
    if (quest.status === QuestStatus.QUEST_OPEN) {
      actions.push(
        quest.participation === QuestParticipation.GROUP
          ? "REJECT_TEAM"
          : "REJECT_CANDIDATE"
      );
    }
  }
  if (
    isHirer &&
    (
      [
        QuestStatus.QUEST_ASSIGNED,
        QuestStatus.QUEST_IN_PROGRESS,
      ] as QuestStatusValue[]
    ).includes(quest.status) &&
    activeAssignments(state).length > 0
  )
    actions.push("REQUEST_EDIT");

  const editConsent = state.editConsent;
  if (
    active &&
    quest.status === QuestStatus.QUEST_AWAITING_EDIT_CONSENT &&
    editConsent?.status === QuestEditRequestStatus.EDIT_REQUEST_PENDING &&
    !editConsent.responses.some((response) => response.workerId === viewerId)
  )
    actions.push("VOTE_EDIT_CONSENT");

  const partialConsent = state.partialStartConsent;
  if (
    partialConsent?.status ===
      QuestPartialStartConsentStatus.PARTIAL_START_PENDING &&
    partialConsent.requiredVoterIds.includes(viewerId) &&
    !partialConsent.responses.some((response) => response.voterId === viewerId)
  )
    actions.push("VOTE_PARTIAL_GROUP_START_CONSENT");

  if (
    canSubmitWork &&
    !hasSubmittedProof &&
    quest.status === QuestStatus.QUEST_IN_PROGRESS &&
    quest.proofRequired !== "none"
  )
    actions.push("SUBMIT_PROOF");
  if (
    canSubmitWork &&
    quest.status === QuestStatus.QUEST_IN_PROGRESS &&
    quest.proofRequired === "none"
  )
    actions.push("CONFIRM_COMPLETION");
  if (active && quest.status === QuestStatus.QUEST_REWORK)
    actions.push("REWORK_PROOF");
  if (
    isHirer &&
    (
      [
        QuestStatus.QUEST_IN_PROGRESS,
        QuestStatus.QUEST_SUBMITTED,
      ] as QuestStatusValue[]
    ).includes(quest.status) &&
    state.proofs.some((item) => item.status === QuestProofStatus.PROOF_PENDING)
  )
    actions.push("REVIEW_PROOF");
  if (
    !isTerminalStatus(quest.status) &&
    (active || (isHirer && activeAssignments(state).length > 0))
  )
    actions.push("OPEN_DISPUTE");
  if (
    quest.status === QuestStatus.QUEST_DISPUTED &&
    (isHirer || viewerId === "admin-demo")
  )
    actions.push("RESOLVE_DISPUTE");
  if (isHirer && quest.status === QuestStatus.QUEST_APPROVED)
    actions.push("COMPLETE");
  if (
    isHirer &&
    (
      [
        QuestStatus.QUEST_OPEN,
        QuestStatus.QUEST_ASSIGNED,
        QuestStatus.QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT,
        QuestStatus.QUEST_AWAITING_EDIT_CONSENT,
        QuestStatus.QUEST_IN_PROGRESS,
      ] as QuestStatusValue[]
    ).includes(quest.status)
  )
    actions.push("CANCEL");

  const conversation = conversationFor(state, viewerId);
  state.conversation = conversation;
  state.capabilities = {
    availableActions: [...new Set(actions)],
    canReadConversation: conversation.canRead,
    canWriteConversation: conversation.canWrite,
  };
  return state.capabilities.availableActions;
}

function stateForViewer(
  state: QuestDetailState,
  viewerId: string,
  now: Date
): QuestDetailState {
  const result = projectedState(state, now);
  if (
    viewerId === result.quest.hirerId &&
    result.quest.participation === QuestParticipation.GROUP &&
    result.quest.candidateMode === QuestCandidateMode.CANDIDATE
  ) {
    // A forming team is still available to its members, but is not a Hirer-selectable proposal.
    result.applications = result.applications.filter((item) => {
      if (!item.teamId) return false;
      const candidateTeam = teamForId(result, item.teamId);
      return (
        candidateTeam?.status === QuestTeamStatus.TEAM_SUBMITTED ||
        candidateTeam?.status === QuestTeamStatus.TEAM_SELECTED ||
        candidateTeam?.status === QuestTeamStatus.TEAM_REJECTED
      );
    });
  }
  syncLegacyTeamProjection(result, viewerId);
  actionForViewer(result, viewerId);
  if (result.quest.status === QuestStatus.QUEST_DRAFT)
    result.publishCheck = calculatePublishCheck(
      result.quest,
      DEFAULT_PLATFORM_FEE_BASIS_POINTS
    );
  return result;
}

export function calculateEscrow(
  rewardSatang: number,
  headcount: number,
  feeRateBasisPoints = DEFAULT_PLATFORM_FEE_BASIS_POINTS
): QuestEscrowSummary {
  const validReward = isValidSatang(rewardSatang) ? rewardSatang : 0;
  const validHeadcount =
    Number.isSafeInteger(headcount) && headcount > 0 ? headcount : 0;
  const perWorkerFee = Math.ceil((validReward * feeRateBasisPoints) / 10000);
  const rewardPool = validReward * validHeadcount;
  const platformFee = perWorkerFee * validHeadcount;
  return {
    rewardPoolSatang: rewardPool,
    platformFeeSatang: platformFee,
    totalRequiredSatang: rewardPool + platformFee,
    headcount: validHeadcount,
    rewardSatangPerWorker: validReward,
    platformFeeSatangPerWorker: perWorkerFee,
    feeRateBasisPoints,
  };
}

export function calculatePublishCheck(
  quest: QuestContract,
  feeRateBasisPoints: number
): QuestPublishCheck {
  const blockers: string[] = [];
  const warnings: string[] = [];
  if (!quest.title.trim()) blockers.push("TITLE_REQUIRED");
  if (!quest.description.trim()) blockers.push("DESCRIPTION_REQUIRED");
  if (!quest.completionCriteria.trim())
    blockers.push("COMPLETION_CRITERIA_REQUIRED");
  if (!quest.startAt) blockers.push("START_REQUIRED");
  if (!quest.deadlineAt) blockers.push("DEADLINE_REQUIRED");
  if (!isValidSatang(quest.reward.rewardSatang))
    blockers.push("REWARD_INVALID");
  if (
    quest.participation === QuestParticipation.SINGLE &&
    quest.headcount !== 1
  )
    blockers.push("SINGLE_HEADCOUNT_MUST_BE_ONE");
  if (
    quest.participation === QuestParticipation.GROUP &&
    (!Number.isSafeInteger(quest.headcount) || quest.headcount < 1)
  )
    blockers.push("HEADCOUNT_INVALID");
  if (quest.imageUris.length === 0) warnings.push("NO_IMAGES");
  return {
    canPublish: blockers.length === 0,
    blockers,
    warnings,
    escrow: calculateEscrow(
      quest.reward.rewardSatang,
      quest.headcount,
      feeRateBasisPoints
    ),
  };
}

export function getConsentRemainingMs(
  consent: QuestEditConsent | QuestPartialStartConsent | undefined,
  now: Date
): number | null {
  if (!consent) return null;
  const pending =
    "status" in consent
      ? consent.status === QuestEditRequestStatus.EDIT_REQUEST_PENDING ||
        consent.status === QuestPartialStartConsentStatus.PARTIAL_START_PENDING
      : false;
  if (!pending) return null;
  return Math.max(
    0,
    new Date(consent.responseDeadlineAt).getTime() - now.getTime()
  );
}

export function formatConsentCountdown(
  consent: QuestEditConsent | QuestPartialStartConsent | undefined,
  now: Date
): string | null {
  const remaining = getConsentRemainingMs(consent, now);
  if (remaining === null) return null;
  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export {
  actionForViewer,
  activeAssignments,
  applyEditChanges,
  cancelBeforeStart,
  cancelPartialStart,
  conversationFor,
  countAdmitted,
  eligibleCandidateApplications,
  hasActiveAssignment,
  hasAssignment,
  isPendingInvitation,
  isTeamMember,
  isTeamParticipant,
  isTerminal,
  makeReadOnly,
  normalizeStateShape,
  openPartialStartConsent,
  projectLifecycle,
  projectedState,
  setActualHeadcount,
  settlementFor,
  stateForViewer,
  syncLegacyTeamProjection,
  teamForId,
  teamForViewer,
  transitionToInProgress,
  unique,
};
