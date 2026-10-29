import type { ServerChatConversation } from "@/api/ChatApi";
import type {
  QuestV2Application,
  QuestV2Assignment,
  QuestV2Detail,
  QuestV2EditRequest,
  QuestV2Mode,
  QuestV2Participation,
  QuestV2ProofSubmission,
  QuestV2Team,
  QuestV2Underfilled,
} from "@/api/questV2Contracts";
import { isTerminalStatus } from "@/domain/questLifecycle";
import {
  QuestActor,
  QuestNextAction,
  QuestTeamRole,
  type QuestPermissionFlags,
} from "./types";
import { isOwnProofSubmission } from "./proofOwnership";

/*
 * Pure Quest permission matrix. ADR 0012: `now` is an explicit parameter and
 * this module performs no I/O, storage, navigation, or clock reads.
 */

export type QuestCapabilityAssignment = Pick<
  QuestV2Assignment,
  "state" | "startedAt"
>;

export interface QuestCapabilityInput {
  viewerId: string;
  actor: QuestActor;
  state: QuestV2Detail["state"];
  mode: QuestV2Mode;
  participation: QuestV2Participation;
  startTime: string;
  dueAt: string | null;
  proofRequired: boolean;
  headcount: number;
  assignments: QuestCapabilityAssignment[];
  assignment: QuestCapabilityAssignment | null;
  application: QuestV2Application | null;
  team: QuestV2Team | null;
  teamRole: QuestTeamRole | null;
  underfilled: QuestV2Underfilled | null;
  editRequest: QuestV2EditRequest | null;
  proofs: QuestV2ProofSubmission[];
  workConversation: ServerChatConversation | null;
  /** Server-clock epoch milliseconds, supplied by the caller (`serverNow()`). */
  now: number;
}

export function deriveQuestCapabilities(
  input: QuestCapabilityInput
): QuestPermissionFlags {
  const {
    viewerId,
    actor,
    state,
    mode,
    participation,
    proofRequired,
    headcount,
    assignments,
    assignment,
    application,
    team,
    teamRole,
    underfilled,
    editRequest,
    proofs,
    workConversation,
    startTime,
    dueAt,
    now,
  } = input;
  const isHirer = actor === QuestActor.HIRER;
  const isWorker = actor === QuestActor.WORKER;
  const isCandidate = actor === QuestActor.CANDIDATE;
  const isProspectiveWorker =
    isCandidate || actor === QuestActor.PROSPECTIVE_WORKER;
  const activeWorker = assignment?.state === "ASSIGNMENT_ACTIVE";
  const open = state === "QUEST_OPEN";
  const startAt = Date.parse(startTime);
  const dueAtMs = Date.parse(dueAt ?? "");
  const beforeStartTime = Number.isFinite(startAt) && now < startAt;
  const withinWorkWindow =
    Number.isFinite(startAt) &&
    Number.isFinite(dueAtMs) &&
    now >= startAt &&
    now < dueAtMs;
  const assigned = state === "QUEST_ASSIGNED";
  const inProgress = state === "QUEST_IN_PROGRESS";
  const reviewableProofState = inProgress || state === "QUEST_FAILED";
  const terminal = isTerminalStatus(state);
  const ownPendingApplication = application?.state === "APPLICATION_APPLIED";
  const ownFormingTeam = team?.state === "TEAM_FORMING";
  const teamAtCapacity = team !== null && team.members.length >= team.headcount;
  // Leader-only actions stay open unless a readable Team names someone else; the
  // server enforces Team Leader ONLY (START_WORK_NOT_REQUIRED).
  const mayActAsTeamLeader = teamRole !== QuestTeamRole.MEMBER;
  const ownProof = proofs.find((proof) =>
    isOwnProofSubmission(proof, { viewerId, mode, participation, team })
  );
  const hasEditableProofDraft =
    ownProof !== undefined &&
    ownProof.status === null &&
    ownProof.submittedAt === null;
  const hasLockedProof = ownProof !== undefined && !hasEditableProofDraft;
  const hasCapacity =
    assignments.filter(
      (candidate) => candidate.state !== "ASSIGNMENT_CANCELLED"
    ).length < headcount;
  // The Server returns a responding Worker's ownResponse with a null decision
  // until they answer, not a null ownResponse.
  const pendingEdit =
    editRequest?.status === "EDIT_REQUEST_PENDING" &&
    (editRequest.ownResponse?.decision ?? null) === null;
  const pendingProof = proofs.some((proof) => proof.status === "PROOF_PENDING");
  const canWorkChat =
    Boolean(workConversation) && (isHirer || assignment !== null);
  return {
    canJoin:
      isProspectiveWorker &&
      mode === "FIRST_COME_FIRST_SERVED" &&
      open &&
      assignment === null &&
      hasCapacity,
    canApply:
      isProspectiveWorker &&
      mode === "CANDIDATE" &&
      participation === "SINGLE" &&
      open &&
      application === null,
    canWithdrawApplication:
      isCandidate && open && ownPendingApplication === true,
    canCreateTeam:
      isProspectiveWorker &&
      mode === "CANDIDATE" &&
      participation === "GROUP" &&
      open &&
      beforeStartTime &&
      team === null,
    // Non-members cannot list other Teams; the Join Code invite carries the
    // Team id, so joining does not depend on a listed joinable Team.
    canJoinTeam:
      isProspectiveWorker &&
      mode === "CANDIDATE" &&
      participation === "GROUP" &&
      open &&
      beforeStartTime &&
      team === null,
    canUpdateTeam:
      isProspectiveWorker &&
      team?.leaderId === viewerId &&
      ownFormingTeam === true,
    canLeaveTeam: isProspectiveWorker && ownFormingTeam === true,
    canRemoveTeamMember:
      isProspectiveWorker &&
      team?.leaderId === viewerId &&
      ownFormingTeam === true,
    canRegenerateTeamCode:
      isProspectiveWorker &&
      team?.leaderId === viewerId &&
      ownFormingTeam === true,
    canSubmitTeam:
      isProspectiveWorker &&
      team?.leaderId === viewerId &&
      ownFormingTeam === true &&
      teamAtCapacity === true,
    canSelectCandidate:
      isHirer && mode === "CANDIDATE" && participation === "SINGLE" && open,
    canSelectTeam:
      isHirer && mode === "CANDIDATE" && participation === "GROUP" && open,
    canDecideUnderfilled:
      isHirer && underfilled?.state === "UNDERFILLED_DECISION_PENDING",
    canRejectCandidate:
      isHirer && mode === "CANDIDATE" && participation === "SINGLE" && open,
    canRejectTeam:
      isHirer && mode === "CANDIDATE" && participation === "GROUP" && open,
    canConsentUnderfilled:
      isWorker &&
      activeWorker === true &&
      underfilled?.state === "UNDERFILLED_CONSENT_PENDING",
    canRequestEdit: isHirer && assigned,
    canRespondToEdit: isWorker && activeWorker === true && pendingEdit,
    canReadWorkChat: canWorkChat,
    canWriteWorkChat:
      canWorkChat && !terminal && (isHirer || activeWorker === true),
    canSubmitProof:
      isWorker &&
      activeWorker === true &&
      inProgress &&
      proofRequired &&
      mayActAsTeamLeader &&
      !hasLockedProof,
    canStartWork:
      isWorker &&
      activeWorker === true &&
      assigned &&
      withinWorkWindow &&
      !assignment?.startedAt &&
      mayActAsTeamLeader,
    canConfirmCompletion:
      isWorker &&
      activeWorker === true &&
      inProgress &&
      !proofRequired &&
      mayActAsTeamLeader,
    canCancel: isHirer && !terminal,
    canReviewProof: isHirer && reviewableProofState && pendingProof,
    canCreateReview: (isHirer || isWorker) && terminal,
  };
}

export interface QuestNextActionInput {
  state: QuestV2Detail["state"];
  actor: QuestActor;
  mode: QuestV2Mode;
  participation: QuestV2Participation;
  capabilities: QuestPermissionFlags;
  application: QuestV2Application | null;
  applications: QuestV2Application[];
  team: QuestV2Team | null;
  teams: QuestV2Team[];
  underfilled: QuestV2Underfilled | null;
  editRequest: QuestV2EditRequest | null;
}

export function deriveQuestNextAction(
  input: QuestNextActionInput
): QuestNextAction {
  const {
    state,
    actor,
    mode,
    participation,
    capabilities,
    application,
    applications,
    team,
    teams,
    underfilled,
    editRequest,
  } = input;
  if (capabilities.canRespondToEdit) return QuestNextAction.RESPOND_TO_EDIT;
  if (capabilities.canDecideUnderfilled)
    return QuestNextAction.DECIDE_UNDERFILLED;
  if (capabilities.canConsentUnderfilled)
    return QuestNextAction.CONSENT_UNDERFILLED;
  if (state === "QUEST_OPEN") {
    if (capabilities.canJoin) return QuestNextAction.JOIN;
    if (
      capabilities.canSelectCandidate &&
      applications.some(
        (candidate) => candidate.state === "APPLICATION_APPLIED"
      )
    )
      return QuestNextAction.SELECT_CANDIDATE;
    if (
      capabilities.canSelectTeam &&
      teams.some((candidate) => candidate.state === "TEAM_SUBMITTED")
    )
      return QuestNextAction.SELECT_TEAM;
    if (capabilities.canWithdrawApplication)
      return QuestNextAction.WITHDRAW_APPLICATION;
    if (capabilities.canApply) return QuestNextAction.APPLY;
    if (capabilities.canSubmitTeam) return QuestNextAction.SUBMIT_TEAM;
    if (capabilities.canCreateTeam) return QuestNextAction.CREATE_TEAM;
    if (capabilities.canJoinTeam && team === null)
      return QuestNextAction.JOIN_TEAM;
  }
  if (state === "QUEST_ASSIGNED" && actor === QuestActor.WORKER)
    return editRequest?.status === "EDIT_REQUEST_PENDING"
      ? QuestNextAction.RESPOND_TO_EDIT
      : QuestNextAction.WAIT_FOR_START;
  if (
    (state === "QUEST_IN_PROGRESS" || state === "QUEST_FAILED") &&
    capabilities.canReviewProof
  )
    return QuestNextAction.REVIEW_PROOF;
  if (state === "QUEST_IN_PROGRESS") {
    if (capabilities.canSubmitProof) return QuestNextAction.SUBMIT_PROOF;
    if (capabilities.canConfirmCompletion)
      return QuestNextAction.CONFIRM_COMPLETION;
  }
  if (capabilities.canCreateReview) return QuestNextAction.CREATE_REVIEW;
  if (capabilities.canCancel) return QuestNextAction.CANCEL;
  if (application?.state === "APPLICATION_SELECTED")
    return QuestNextAction.WAIT_FOR_START;
  if (mode === "CANDIDATE" && participation === "GROUP" && team) {
    return QuestNextAction.NONE;
  }
  if (underfilled) return QuestNextAction.NONE;
  return QuestNextAction.NONE;
}
