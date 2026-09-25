import {
  createQuestIdempotencyKey,
  questApi,
  type CreateQuestV2Payload,
  type QuestV2AssignmentMineStatus,
  type QuestV2CreateEditRequestPayload,
  type QuestV2EditRequestResponsePayload,
  type QuestV2ProofCreatePayload,
  type QuestV2ProofFileUploadPayload,
  type QuestV2ProofReviewPayload,
  type QuestV2ProofRetryPayload,
  type QuestV2ProofUpdatePayload,
  type QuestV2ReviewPayload,
} from "@/api/QuestApi";
import { ApiError, type RequestOptions } from "@/api/ApiClient";
import { authService } from "../../auth/AuthService";
import { chatApi } from "@/api/ChatApi";
import type {
  CandidateInquiryParticipant,
  ServerCandidateInquiry,
  ServerCandidateInquiryPage,
  ServerChatAttachment,
  ServerChatAttachmentLink,
  ServerChatConversation,
  ServerChatMessage,
  ServerChatMessagePage,
  ServerChatReadCursor,
} from "@/api/ChatApi";
import type { UploadAsset } from "@/api/fileUpload";
import { isTerminalStatus } from "@/domain/questLifecycle";
import type {
  QuestV2Application,
  QuestV2ApplicationSelection,
  QuestV2Assignment,
  QuestV2BoardCard,
  QuestV2CanonicalQuest,
  QuestV2CancellationOutcome,
  QuestV2Completion,
  QuestV2Detail,
  QuestV2EditRequest,
  QuestV2Image,
  QuestV2Mode,
  QuestV2Participation,
  QuestV2ParticipationDetail,
  QuestV2ProofFileLink,
  QuestV2ProofReview,
  QuestV2ProofSubmission,
  QuestV2PublicDetail,
  QuestV2PublicImage,
  QuestV2PublishCheck,
  QuestV2Review,
  QuestV2Team,
  QuestV2TeamFile,
  QuestV2TeamSelection,
  QuestV2StartWork,
  QuestV2Underfilled,
} from "@/api/questV2Contracts";
import {
  QuestMode,
  QuestParticipation,
  type QuestBoardQuest,
  type QuestStatus,
  type QuestUnderfilledConsentDecision,
  type QuestUnderfilledDecision,
} from "../domain/types";
import type {
  LiveQuestActor,
  LiveQuestNextAction,
  LiveQuestCapabilities,
  LiveQuestAssignment,
  LiveQuestParticipant,
  LiveQuestSnapshot,
  LiveQuestSnapshotOptions,
} from "./liveQuestTypes";
export type {
  LiveQuestActor,
  LiveQuestNextAction,
  LiveQuestCapabilities,
  LiveQuestAssignment,
  LiveQuestParticipant,
  LiveQuestSnapshot,
  LiveQuestSnapshotOptions,
} from "./liveQuestTypes";

function timePart(value: string): string | null {
  const match = value.match(/T(\d{2}:\d{2})/);
  return match?.[1] ?? null;
}

function timeRange(startTime: string, dueAt: string): string | undefined {
  const start = timePart(startTime);
  const end = timePart(dueAt);
  return start && end ? `${start}–${end}` : undefined;
}

export function cardToQuestBoardQuest(card: QuestV2BoardCard): QuestBoardQuest {
  const startDate = card.startTime.slice(0, 10);
  const deadline = card.dueAt ? card.dueAt.slice(0, 10) : startDate;
  const rewardSatang = Math.round(card.questReward * 100);
  return {
    id: card.id,
    title: card.title,

    tags: card.tag ? [card.tag.name] : [],
    description: "",
    completionCriteria: "",
    proofRequired: "none",
    rewardPerPerson: card.questReward,
    rewardSatang,
    headcount: card.headcount,
    acceptedParticipants: card.activeWorkerCount,
    startDate,
    deadline,
    timeRange: card.dueAt ? timeRange(card.startTime, card.dueAt) : undefined,
    postedAt: card.startTime,
    location: card.location ?? "Online",
    locationDetails: { label: card.location },
    locationMode: card.location === null ? "online" : "on-campus",
    participationMode: card.participation === "GROUP" ? "team" : "single",
    candidateMode: card.mode === "CANDIDATE" ? "CANDIDATE" : "NO_CANDIDATE",
    creator: { name: card.hirerName },
    hirerName: card.hirerName,
    studentInterestMatch: false,
    ownerStudentId: "",
    status: "QUEST_OPEN",
  };
}
export function canonicalToQuestBoardQuest(
  q: QuestV2CanonicalQuest | QuestV2Detail,
  creatorName = "Me"
): QuestBoardQuest {
  const startDate = q.startTime.slice(0, 10);
  const deadline = q.dueAt ? q.dueAt.slice(0, 10) : startDate;
  const rewardSatang = Math.round(q.questFundingTotal * 100);

  return {
    id: q.id,
    title: q.title,
    tags: q.tag ? [q.tag.name] : [],
    description: q.description || "",
    completionCriteria: q.condition.items
      .map(
        (item: QuestV2CanonicalQuest["condition"]["items"][number]) => item.text
      )
      .join("\n"),
    proofRequired: q.proofRequired ? "required" : "none",
    rewardPerPerson: q.questFundingTotal,
    rewardSatang,
    headcount: q.headcount,
    acceptedParticipants: 0,
    startDate,
    deadline,
    timeRange: q.dueAt ? timeRange(q.startTime, q.dueAt) : undefined,
    postedAt: q.createdAt || q.startTime,
    location: q.locations[0]?.label ?? "Online",
    locationDetails: { label: q.locations[0]?.label ?? null },
    locationMode: q.locations.length > 0 ? "on-campus" : "online",
    participationMode: q.participation === "GROUP" ? "team" : "single",
    candidateMode: q.mode === "CANDIDATE" ? "CANDIDATE" : "NO_CANDIDATE",
    creator: { name: creatorName },
    imageUris:
      "images" in q ? q.images.map((img: QuestV2Image) => img.url) : [],
    studentInterestMatch: false,
    ownerStudentId: "",
    status: q.state as QuestStatus,
  };
}

export function publicDetailToQuestBoardQuest(
  d: QuestV2PublicDetail | QuestV2ParticipationDetail
): QuestBoardQuest {
  const startDate = d.startTime.slice(0, 10);
  const deadline = d.dueAt ? d.dueAt.slice(0, 10) : startDate;
  const rewardSatang = Math.round(d.questReward * 100);

  return {
    id: d.id,
    title: d.title,
    tags: d.tag ? [d.tag.name] : [],
    description: d.description || "",
    completionCriteria: d.condition.items
      .map(
        (item: QuestV2PublicDetail["condition"]["items"][number]) => item.text
      )
      .join("\n"),
    proofRequired: d.proofRequired ? "required" : "none",
    rewardPerPerson: d.questReward,
    rewardSatang,
    headcount: d.headcount,
    acceptedParticipants: d.activeWorkerCount,
    startDate,
    deadline,
    timeRange: d.dueAt ? timeRange(d.startTime, d.dueAt) : undefined,
    postedAt: d.startTime,
    location: d.locations[0]?.label ?? "Online",
    locationDetails: { label: d.locations[0]?.label ?? null },
    locationMode: d.locations.length > 0 ? "on-campus" : "online",
    participationMode: d.participation === "GROUP" ? "team" : "single",
    candidateMode: d.mode === "CANDIDATE" ? "CANDIDATE" : "NO_CANDIDATE",
    creator: { name: d.hirerName },
    hirerName: d.hirerName,
    imageUris: d.images?.map((img: QuestV2PublicImage) => img.url) ?? [],
    studentInterestMatch: false,
    ownerStudentId: "",
    status: d.state as QuestStatus,
    hasJoined: d.hasJoined,
    assignmentId: d.assignmentId,
    assignmentStatus: d.assignmentStatus,
  };
}

function isOptionalResourceError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 403 ||
      error.status === 404 ||
      (error.status === 409 && error.code === "QUEST_NOT_UNDERFILLED"))
  );
}

async function optionalResource<T>(
  load: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await load();
  } catch (error) {
    if (isOptionalResourceError(error)) return fallback;
    throw error;
  }
}

function activeAssignment(
  assignments: QuestV2Assignment[],
  viewerId: string
): LiveQuestAssignment | null {
  return (
    assignments.find(
      (assignment) =>
        assignment.workerId === viewerId &&
        assignment.state === "ASSIGNMENT_ACTIVE"
    ) ??
    assignments.find((assignment) => assignment.workerId === viewerId) ??
    null
  );
}

function embeddedAssignment(
  quest: QuestV2Detail | QuestV2PublicDetail | QuestV2ParticipationDetail,
  viewerId: string
): LiveQuestAssignment | null {
  const assignmentId = "assignmentId" in quest ? quest.assignmentId : undefined;
  const participationAssignment =
    "assignment" in quest ? quest.assignment : undefined;
  const state =
    ("assignmentStatus" in quest ? quest.assignmentStatus : undefined) ??
    (participationAssignment?.status as QuestV2Assignment["state"] | undefined);
  if (
    state !== "ASSIGNMENT_ACTIVE" &&
    state !== "ASSIGNMENT_COMPLETED" &&
    state !== "ASSIGNMENT_INCOMPLETE" &&
    state !== "ASSIGNMENT_CANCELLED"
  ) {
    return null;
  }
  return {
    ...(assignmentId ? { id: assignmentId } : {}),
    questId: quest.id,
    workerId: viewerId,
    state,
    questState: quest.state,
    startedAt: participationAssignment?.startedAt ?? null,
    ...(assignmentId ? { createdAt: quest.startTime } : {}),
  };
}

function ownApplication(
  applications: QuestV2Application[],
  viewerId: string
): QuestV2Application | null {
  return (
    applications.find((application) => application.memberId === viewerId) ??
    null
  );
}

function ownTeam(teams: QuestV2Team[], viewerId: string): QuestV2Team | null {
  return (
    teams.find((team) =>
      team.members.some((member) => member.memberId === viewerId)
    ) ?? null
  );
}

/**
 * Candidate Team reads return `joinCode: null`; plaintext arrives only in the
 * create and regenerate responses. Keep the last issued code per Team so the
 * Team Leader can still share it after the post-command refetch.
 */
const issuedJoinCodes = new Map<
  string,
  { joinCode: string; expiresAt: string | null }
>();

function rememberJoinCode(team: QuestV2Team): QuestV2Team {
  if (team.joinCode) {
    issuedJoinCodes.set(team.id, {
      joinCode: team.joinCode,
      expiresAt: team.joinCodeExpiresAt,
    });
  }
  return team;
}

function withIssuedJoinCode(team: QuestV2Team): QuestV2Team {
  const issued = issuedJoinCodes.get(team.id);
  const sameCode =
    issued !== undefined &&
    issued.expiresAt !== null &&
    team.joinCodeExpiresAt !== null &&
    Date.parse(issued.expiresAt) === Date.parse(team.joinCodeExpiresAt);
  return team.joinCode === null && sameCode
    ? { ...team, joinCode: issued.joinCode }
    : team;
}

function deriveActor(
  routeActor: LiveQuestActor,
  assignment: LiveQuestAssignment | null,
  application: QuestV2Application | null,
  team: QuestV2Team | null
): LiveQuestActor {
  if (routeActor === "HIRER") return routeActor;
  if (assignment) return "WORKER";
  if (application) return "CANDIDATE";
  if (team) return "PROSPECTIVE_WORKER";
  return routeActor;
}

function deriveCapabilities(input: {
  viewerId: string;
  actor: LiveQuestActor;
  state: QuestV2Detail["state"];
  mode: QuestV2Mode;
  participation: QuestV2Participation;
  startTime: string;
  proofRequired: boolean;
  headcount: number;
  assignments: LiveQuestAssignment[];
  assignment: LiveQuestAssignment | null;
  application: QuestV2Application | null;
  team: QuestV2Team | null;
  underfilled: QuestV2Underfilled | null;
  editRequest: QuestV2EditRequest | null;
  proofs: QuestV2ProofSubmission[];
  workConversation: ServerChatConversation | null;
}): LiveQuestCapabilities {
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
    underfilled,
    editRequest,
    proofs,
    workConversation,
    startTime,
  } = input;
  const isHirer = actor === "HIRER";
  const isWorker = actor === "WORKER";
  const isCandidate = actor === "CANDIDATE";
  const isProspectiveWorker = isCandidate || actor === "PROSPECTIVE_WORKER";
  const activeWorker = assignment?.state === "ASSIGNMENT_ACTIVE";
  const open = state === "QUEST_OPEN";
  const beforeStartTime = Date.now() < Date.parse(startTime);
  const assigned = state === "QUEST_ASSIGNED";
  const inProgress = state === "QUEST_IN_PROGRESS";
  const reviewableProofState = inProgress || state === "QUEST_FAILED";
  const terminal = isTerminalStatus(state);
  const ownPendingApplication = application?.state === "APPLICATION_APPLIED";
  const ownFormingTeam = team?.state === "TEAM_FORMING";
  const teamAtCapacity = team !== null && team.members.length >= team.headcount;
  const isTeamLeader =
    mode === "CANDIDATE" &&
    participation === "GROUP" &&
    team?.leaderId === viewerId;
  const ownProof = proofs.find(
    (proof) =>
      proof.submittedByUserId === viewerId ||
      proof.workerId === viewerId ||
      (team?.id !== undefined && proof.teamId === team.id)
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
  const pendingEdit =
    editRequest?.status === "EDIT_REQUEST_PENDING" &&
    editRequest.ownResponse === null;
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
      (participation !== "GROUP" || mode !== "CANDIDATE" || isTeamLeader) &&
      !hasLockedProof,
    canStartWork:
      isWorker &&
      activeWorker === true &&
      assigned &&
      !assignment?.startedAt &&
      (participation === QuestParticipation.SINGLE ||
        mode === QuestMode.FIRST_COME_FIRST_SERVED ||
        isTeamLeader),
    canConfirmCompletion:
      isWorker &&
      activeWorker === true &&
      inProgress &&
      !proofRequired &&
      (participation !== "GROUP" || mode !== "CANDIDATE" || isTeamLeader),
    canCancel: isHirer && !terminal,
    canReviewProof: isHirer && reviewableProofState && pendingProof,
    canCreateReview: (isHirer || isWorker) && terminal,
    canUpdateReview: false,
  };
}

function deriveNextAction(
  state: LiveQuestSnapshot["state"],
  actor: LiveQuestActor,
  mode: QuestV2Mode,
  participation: QuestV2Participation,
  capabilities: LiveQuestCapabilities,
  application: QuestV2Application | null,
  applications: QuestV2Application[],
  team: QuestV2Team | null,
  teams: QuestV2Team[],
  underfilled: QuestV2Underfilled | null,
  editRequest: QuestV2EditRequest | null
): LiveQuestNextAction {
  if (capabilities.canRespondToEdit) return "RESPOND_TO_EDIT";
  if (capabilities.canDecideUnderfilled) return "DECIDE_UNDERFILLED";
  if (capabilities.canConsentUnderfilled) return "CONSENT_UNDERFILLED";
  if (state === "QUEST_OPEN") {
    if (capabilities.canJoin) return "JOIN";
    if (
      capabilities.canSelectCandidate &&
      applications.some(
        (candidate) => candidate.state === "APPLICATION_APPLIED"
      )
    )
      return "SELECT_CANDIDATE";
    if (
      capabilities.canSelectTeam &&
      teams.some((candidate) => candidate.state === "TEAM_SUBMITTED")
    )
      return "SELECT_TEAM";
    if (capabilities.canWithdrawApplication) return "WITHDRAW_APPLICATION";
    if (capabilities.canApply) return "APPLY";
    if (capabilities.canSubmitTeam) return "SUBMIT_TEAM";
    if (capabilities.canCreateTeam) return "CREATE_TEAM";
    if (capabilities.canJoinTeam && team === null) return "JOIN_TEAM";
  }
  if (state === "QUEST_ASSIGNED" && actor === "WORKER")
    return editRequest?.status === "EDIT_REQUEST_PENDING"
      ? "RESPOND_TO_EDIT"
      : "WAIT_FOR_START";
  if (
    (state === "QUEST_IN_PROGRESS" || state === "QUEST_FAILED") &&
    capabilities.canReviewProof
  )
    return "REVIEW_PROOF";
  if (state === "QUEST_IN_PROGRESS") {
    if (capabilities.canSubmitProof) return "SUBMIT_PROOF";
    if (capabilities.canConfirmCompletion) return "CONFIRM_COMPLETION";
  }
  if (capabilities.canCreateReview) return "CREATE_REVIEW";
  if (capabilities.canCancel) return "CANCEL";
  if (application?.state === "APPLICATION_SELECTED") return "WAIT_FOR_START";
  if (mode === "CANDIDATE" && participation === "GROUP" && team) {
    return "NONE";
  }
  if (underfilled) return "NONE";
  return "NONE";
}

export class LiveQuestService {
  private hirerCache = new Map<string, { id: string; displayName: string }>();
  private participantCache = new Map<string, LiveQuestParticipant>();
  private participantRequests = new Map<
    string,
    Promise<LiveQuestParticipant>
  >();

  private async getParticipantProfile(
    participantId: string
  ): Promise<LiveQuestParticipant> {
    const cached = this.participantCache.get(participantId);
    if (cached) return cached;

    const pending = this.participantRequests.get(participantId);
    if (pending) return pending;

    const request = (async () => {
      try {
        const api = await authService.getStudentApi();
        const profile = await api.getPublicProfile(participantId);
        const displayName =
          `${profile.firstName} ${profile.lastName}`.trim() || participantId;
        const result: LiveQuestParticipant = {
          id: participantId,
          displayName,
          ...(profile.avatar?.url ? { avatarUrl: profile.avatar.url } : {}),
          ...(profile.avatar?.fileId
            ? { avatarFileId: profile.avatar.fileId }
            : {}),
        };
        this.participantCache.set(participantId, result);
        return result;
      } catch {
        return { id: participantId, displayName: participantId };
      } finally {
        this.participantRequests.delete(participantId);
      }
    })();

    this.participantRequests.set(participantId, request);
    return request;
  }

  private async loadParticipantProfiles(
    assignments: readonly LiveQuestAssignment[]
  ): Promise<LiveQuestParticipant[]> {
    const participantIds = [
      ...new Set(
        assignments
          .filter((assignment) => assignment.state !== "ASSIGNMENT_CANCELLED")
          .map((assignment) => assignment.workerId)
      ),
    ];
    return Promise.all(
      participantIds.map((participantId) =>
        this.getParticipantProfile(participantId)
      )
    );
  }
  async getHirerParticipant(
    questId: string
  ): Promise<{ id: string; displayName: string } | null> {
    if (this.hirerCache.has(questId)) {
      return this.hirerCache.get(questId)!;
    }
    try {
      const inquiry = await chatApi.createCandidateInquiry(questId);
      const hirer = inquiry.participants.find(
        (participant) => participant.role === "HIRER"
      );
      if (hirer?.id) {
        const result = { id: hirer.id, displayName: hirer.displayName };
        this.hirerCache.set(questId, result);
        return result;
      }
    } catch {
      // Profile navigation may still render without an inquiry participant.
    }
    return null;
  }

  async createCandidateInquiry(
    questId: string
  ): Promise<ServerCandidateInquiry> {
    return chatApi.createCandidateInquiry(questId);
  }

  async listCandidateInquiries(
    params: { limit?: number; cursor?: string } = {}
  ): Promise<ServerCandidateInquiryPage> {
    return chatApi.listCandidateInquiries(params);
  }

  async getCandidateInquiry(
    conversationId: string,
    options?: RequestOptions
  ): Promise<ServerCandidateInquiry> {
    return chatApi.getCandidateInquiry(conversationId, options);
  }

  async listCandidateInquiryParticipants(
    conversationId: string,
    options?: RequestOptions
  ): Promise<CandidateInquiryParticipant[]> {
    return chatApi.listCandidateInquiryParticipants(conversationId, options);
  }

  async getCandidateInquiryMessages(
    conversationId: string,
    params: { limit?: number; before?: string; after?: string } = {},
    options?: RequestOptions
  ): Promise<ServerChatMessagePage> {
    return chatApi.getCandidateInquiryMessages(conversationId, params, options);
  }

  async sendCandidateInquiryMessage(
    conversationId: string,
    text: string,
    clientMessageId?: string,
    attachmentIds?: string[]
  ): Promise<ServerChatMessage> {
    return chatApi.sendCandidateInquiryMessage(
      conversationId,
      text,
      clientMessageId,
      attachmentIds
    );
  }

  async markCandidateInquiryRead(
    conversationId: string,
    messageId: string
  ): Promise<ServerChatReadCursor> {
    return chatApi.markCandidateInquiryRead(conversationId, messageId);
  }

  async uploadCandidateInquiryAttachment(
    conversationId: string,
    asset: UploadAsset
  ): Promise<ServerChatAttachment> {
    return chatApi.uploadCandidateInquiryAttachment(conversationId, asset);
  }

  async getCandidateInquiryAttachmentLink(
    conversationId: string,
    attachmentId: string
  ): Promise<ServerChatAttachmentLink> {
    return chatApi.getCandidateInquiryAttachmentLink(
      conversationId,
      attachmentId
    );
  }

  async deleteCandidateInquiryAttachment(
    conversationId: string,
    attachmentId: string
  ): Promise<{ attachmentId: string }> {
    return chatApi.deleteCandidateInquiryAttachment(
      conversationId,
      attachmentId
    );
  }

  async listBoardQuests(options?: RequestOptions): Promise<QuestBoardQuest[]> {
    const items: QuestBoardQuest[] = [];
    const seenCursors = new Set<string>();
    let cursor: string | undefined;

    do {
      const result = await questApi.listBoard(
        cursor ? { cursor, limit: 50 } : { limit: 50 },
        options
      );
      items.push(...result.items.map(cardToQuestBoardQuest));
      if (!result.nextCursor || seenCursors.has(result.nextCursor)) break;
      seenCursors.add(result.nextCursor);
      cursor = result.nextCursor;
    } while (cursor);

    return items;
  }

  async listMyHirerQuests(
    options?: RequestOptions
  ): Promise<QuestBoardQuest[]> {
    const result = await questApi.listMine({}, options);
    return result.items.map((q) => canonicalToQuestBoardQuest(q, "Me"));
  }
  async listMyWorkerAssignments(
    status?: QuestV2AssignmentMineStatus,
    options?: RequestOptions
  ): Promise<QuestV2Assignment[]> {
    return options
      ? questApi.listMyAssignments(status, options)
      : questApi.listMyAssignments(status);
  }
  async listQuestAssignments(
    questId: string,
    options?: RequestOptions
  ): Promise<QuestV2Assignment[]> {
    return questApi.listQuestAssignments(questId, options);
  }

  async getQuestDetail(
    questId: string,
    options?: RequestOptions
  ): Promise<QuestBoardQuest> {
    const requestOptions = options?.signal ? options : undefined;
    try {
      const detail = requestOptions
        ? await questApi.getDetail(questId, requestOptions)
        : await questApi.getDetail(questId);
      return canonicalToQuestBoardQuest(detail);
    } catch {
      try {
        const publicDetail = requestOptions
          ? await questApi.getPublicDetail(questId, requestOptions)
          : await questApi.getPublicDetail(questId);
        return publicDetailToQuestBoardQuest(publicDetail);
      } catch {
        const participationDetail = requestOptions
          ? await questApi.getParticipationDetail(questId, requestOptions)
          : await questApi.getParticipationDetail(questId);
        return publicDetailToQuestBoardQuest(participationDetail);
      }
    }
  }
  async getLiveSnapshot(
    questId: string,
    viewerId: string,
    options: LiveQuestSnapshotOptions = {}
  ): Promise<LiveQuestSnapshot> {
    let quest: QuestV2Detail | QuestV2PublicDetail | QuestV2ParticipationDetail;
    let routeActor: LiveQuestActor = "PROSPECTIVE_WORKER";
    try {
      quest = await questApi.getDetail(questId, options);
      routeActor = "HIRER";
    } catch {
      try {
        quest = await questApi.getPublicDetail(questId, options);
      } catch {
        quest = await questApi.getParticipationDetail(questId, options);
      }
    }

    const [
      assignments,
      applications,
      teams,
      underfilled,
      proofs,
      conversations,
      editRequest,
    ] = await Promise.all([
      optionalResource(
        () => this.listQuestAssignments(questId, options),
        [] as QuestV2Assignment[]
      ),
      optionalResource(
        () => questApi.listApplications(questId, options),
        [] as QuestV2Application[]
      ),
      optionalResource(
        () => questApi.listCandidateTeams(questId, options),
        [] as QuestV2Team[]
      ),
      optionalResource(
        () => questApi.getUnderfilled(questId, options),
        null as QuestV2Underfilled | null
      ),
      optionalResource(
        () => questApi.listProofSubmissions(questId, options),
        [] as QuestV2ProofSubmission[]
      ),
      optionalResource(
        async () => {
          const page = await chatApi.listConversations({ limit: 20 }, options);
          return (
            page.items.find(
              (conversation) => conversation.quest.id === questId
            ) ?? null
          );
        },
        null as ServerChatConversation | null
      ),
      options.editRequestId
        ? optionalResource(
            () => questApi.getEditRequest(options.editRequestId!, options),
            null as QuestV2EditRequest | null
          )
        : Promise.resolve(null as QuestV2EditRequest | null),
    ]);

    const listedAssignment = activeAssignment(assignments, viewerId);
    const participationAssignment = embeddedAssignment(quest, viewerId);
    const assignment = listedAssignment ?? participationAssignment;
    const resolvedAssignments =
      listedAssignment || !participationAssignment
        ? assignments
        : [...assignments, participationAssignment];
    const participants =
      quest.participation === "GROUP"
        ? await this.loadParticipantProfiles(resolvedAssignments)
        : [];
    const application = ownApplication(applications, viewerId);
    const listedTeam = ownTeam(teams, viewerId);
    const team = listedTeam && withIssuedJoinCode(listedTeam);
    const actor = deriveActor(routeActor, assignment, application, team);
    const capabilities = deriveCapabilities({
      viewerId,
      actor,
      state: quest.state,
      startTime: quest.startTime,
      mode: quest.mode,
      participation: quest.participation,
      proofRequired: quest.proofRequired,
      headcount: quest.headcount,
      assignments: resolvedAssignments,
      assignment,
      application,
      team,
      underfilled,
      editRequest,
      proofs,
      workConversation: conversations,
    });
    const nextAction = deriveNextAction(
      quest.state,
      actor,
      quest.mode,
      quest.participation,
      capabilities,
      application,
      applications,
      team,
      teams,
      underfilled,
      editRequest
    );

    return {
      viewerId,
      actor,
      quest,
      state: quest.state,
      participants,
      mode: quest.mode,
      participation: quest.participation,
      assignment,
      assignments: resolvedAssignments,
      application,
      applications,
      team,
      teams,
      underfilled,
      editRequest,
      proofs,
      workConversation: conversations,
      proofRequired: quest.proofRequired,
      dueAt: quest.dueAt ?? null,
      nextAction,
      capabilities,
    };
  }

  async getLiveQuestSnapshot(
    questId: string,
    viewerId: string,
    options?: LiveQuestSnapshotOptions
  ): Promise<LiveQuestSnapshot> {
    return this.getLiveSnapshot(questId, viewerId, options);
  }
  /**
   * Re-reads all live resources after a command. No local mutation is kept in
   * this service; callers use this method after a successful or ambiguous
   * command to render the server result.
   */
  async refreshLiveSnapshot(
    questId: string,
    viewerId: string,
    options?: LiveQuestSnapshotOptions
  ): Promise<LiveQuestSnapshot> {
    return this.getLiveSnapshot(questId, viewerId, options);
  }

  async uploadImages(
    questId: string,
    imageUris: string[]
  ): Promise<QuestV2Image[]> {
    const assets = imageUris.map((uri) => ({ uri }));
    return questApi.uploadQuestImages(
      questId,
      assets,
      createQuestIdempotencyKey()
    );
  }

  async getPublishCheck(questId: string): Promise<QuestV2PublishCheck> {
    return questApi.getPublishCheck(questId);
  }

  async editQuest(
    questId: string,
    version: number,
    payload: Partial<CreateQuestV2Payload>,
    idempotencyKey?: string
  ): Promise<QuestV2CanonicalQuest> {
    return questApi.editQuest(questId, version, payload, idempotencyKey);
  }
  async createQuest(
    payload: CreateQuestV2Payload,
    idempotencyKey?: string
  ): Promise<QuestV2CanonicalQuest> {
    return questApi.createQuest(payload, idempotencyKey);
  }

  async publishQuest(
    questId: string,
    idempotencyKey?: string
  ): Promise<QuestV2CanonicalQuest> {
    return questApi.publishQuest(questId, idempotencyKey);
  }

  async createAndPublishQuest(
    payload: CreateQuestV2Payload,
    idempotencyKey?: string
  ): Promise<QuestV2CanonicalQuest> {
    const created = await this.createQuest(
      payload,
      createQuestIdempotencyKey()
    );
    return this.publishQuest(created.id, idempotencyKey);
  }

  async joinQuest(questId: string): Promise<QuestV2Assignment> {
    return questApi.joinQuest(questId, createQuestIdempotencyKey());
  }

  async applyQuest(
    questId: string,
    idempotencyKey?: string
  ): Promise<QuestV2Application> {
    return questApi.applyQuest(questId, idempotencyKey);
  }

  async listApplications(questId: string): Promise<QuestV2Application[]> {
    return questApi.listApplications(questId);
  }

  async getApplication(
    questId: string,
    applicationId: string
  ): Promise<QuestV2Application> {
    return questApi.getApplication(questId, applicationId);
  }

  async withdrawApplication(
    questId: string,
    applicationId: string,
    idempotencyKey?: string
  ): Promise<QuestV2Application> {
    return questApi.withdrawApplication(questId, applicationId, idempotencyKey);
  }
  async selectApplication(
    questId: string,
    applicationId: string,
    idempotencyKey?: string
  ): Promise<QuestV2ApplicationSelection> {
    return questApi.selectApplication(questId, applicationId, idempotencyKey);
  }

  async rejectApplication(
    questId: string,
    applicationId: string,
    idempotencyKey?: string
  ): Promise<QuestV2Application> {
    return questApi.rejectCandidateApplication(
      questId,
      applicationId,
      idempotencyKey
    );
  }

  async createCandidateTeam(
    questId: string,
    payload: { name: string; headcount: number },
    idempotencyKey?: string
  ): Promise<QuestV2Team> {
    return rememberJoinCode(
      await questApi.createCandidateTeam(questId, payload, idempotencyKey)
    );
  }

  async listCandidateTeams(questId: string): Promise<QuestV2Team[]> {
    return questApi.listCandidateTeams(questId);
  }

  async getCandidateTeam(
    questId: string,
    teamId: string
  ): Promise<QuestV2Team> {
    return questApi.getCandidateTeam(questId, teamId);
  }

  async updateCandidateTeam(
    questId: string,
    teamId: string,
    payload: { name: string },
    idempotencyKey?: string
  ): Promise<QuestV2Team> {
    return questApi.updateCandidateTeam(
      questId,
      teamId,
      payload,
      idempotencyKey
    );
  }

  async joinCandidateTeam(
    questId: string,
    teamId: string,
    joinCode: string,
    idempotencyKey?: string
  ): Promise<QuestV2Team> {
    return questApi.joinCandidateTeam(
      questId,
      teamId,
      joinCode,
      idempotencyKey
    );
  }

  async leaveCandidateTeam(
    questId: string,
    teamId: string,
    idempotencyKey?: string
  ): Promise<QuestV2Team> {
    return questApi.leaveCandidateTeam(questId, teamId, idempotencyKey);
  }

  async removeCandidateTeamMember(
    questId: string,
    teamId: string,
    memberId: string,
    idempotencyKey?: string
  ): Promise<QuestV2Team> {
    return questApi.removeCandidateTeamMember(
      questId,
      teamId,
      memberId,
      idempotencyKey
    );
  }

  async regenerateCandidateTeamJoinCode(
    questId: string,
    teamId: string,
    idempotencyKey?: string
  ): Promise<QuestV2Team> {
    return rememberJoinCode(
      await questApi.regenerateCandidateTeamJoinCode(
        questId,
        teamId,
        idempotencyKey
      )
    );
  }
  async uploadCandidateTeamFile(
    questId: string,
    teamId: string,
    asset: UploadAsset,
    idempotencyKey?: string
  ): Promise<QuestV2TeamFile> {
    return questApi.uploadCandidateTeamFile(
      questId,
      teamId,
      asset,
      idempotencyKey
    );
  }

  async submitCandidateTeam(
    questId: string,
    teamId: string,
    payload: { text?: string; fileIds?: string[] },
    idempotencyKey?: string
  ): Promise<QuestV2Team> {
    return questApi.submitCandidateTeam(
      questId,
      teamId,
      {
        text: payload.text ?? "",
        fileIds: payload.fileIds ?? [],
      },
      idempotencyKey
    );
  }

  async selectCandidateTeam(
    questId: string,
    teamId: string,
    idempotencyKey?: string
  ): Promise<QuestV2TeamSelection> {
    return questApi.selectCandidateTeam(questId, teamId, idempotencyKey);
  }

  async rejectCandidateTeam(
    questId: string,
    teamId: string,
    idempotencyKey?: string
  ): Promise<QuestV2Team> {
    return questApi.rejectCandidateTeam(questId, teamId, idempotencyKey);
  }

  async getUnderfilled(
    questId: string,
    options?: RequestOptions
  ): Promise<QuestV2Underfilled> {
    return questApi.getUnderfilled(questId, options);
  }

  async decideUnderfilled(
    questId: string,
    decision: QuestUnderfilledDecision,
    idempotencyKey?: string
  ): Promise<QuestV2Underfilled> {
    return questApi.decideUnderfilled(questId, decision, idempotencyKey);
  }

  async respondUnderfilledConsent(
    questId: string,
    decision: QuestUnderfilledConsentDecision,
    idempotencyKey?: string
  ): Promise<QuestV2Underfilled> {
    return questApi.respondUnderfilledConsent(
      questId,
      decision,
      idempotencyKey
    );
  }

  async createEditRequest(
    questId: string,
    payload: QuestV2CreateEditRequestPayload,
    idempotencyKey?: string
  ): Promise<QuestV2EditRequest> {
    return questApi.createEditRequest(questId, payload, idempotencyKey);
  }

  async getEditRequest(
    requestId: string,
    options?: RequestOptions
  ): Promise<QuestV2EditRequest> {
    return questApi.getEditRequest(requestId, options);
  }

  async respondToEditRequest(
    requestId: string,
    payload: QuestV2EditRequestResponsePayload,
    idempotencyKey?: string
  ): Promise<QuestV2EditRequest> {
    return questApi.respondToEditRequest(requestId, payload, idempotencyKey);
  }

  async createProofDraft(
    questId: string,
    payload:
      | QuestV2ProofCreatePayload
      | { assets: { uri: string }[]; description?: string },
    idempotencyKey?: string
  ): Promise<QuestV2ProofSubmission> {
    return questApi.createProofDraft(questId, payload, idempotencyKey);
  }

  async updateProofDraft(
    questId: string,
    proofSubmissionId: string,
    payload:
      | QuestV2ProofUpdatePayload
      | QuestV2ProofRetryPayload
      | QuestV2ProofFileUploadPayload,
    idempotencyKey?: string
  ): Promise<QuestV2ProofSubmission> {
    return questApi.updateProofDraft(
      questId,
      proofSubmissionId,
      payload,
      idempotencyKey
    );
  }

  async deleteProofDraft(
    questId: string,
    proofSubmissionId: string,
    idempotencyKey?: string
  ): Promise<{ proofSubmissionId: string; deleted: true }> {
    return questApi.deleteProofDraft(
      questId,
      proofSubmissionId,
      idempotencyKey
    );
  }

  async submitProofDraft(
    questId: string,
    proofSubmissionId: string,
    idempotencyKey?: string
  ): Promise<QuestV2ProofSubmission> {
    return questApi.submitProofDraft(
      questId,
      proofSubmissionId,
      idempotencyKey
    );
  }

  async listProofSubmissions(
    questId: string
  ): Promise<QuestV2ProofSubmission[]> {
    return questApi.listProofSubmissions(questId);
  }

  async getProofFileLink(
    questId: string,
    proofSubmissionId: string,
    fileId: string,
    options?: RequestOptions
  ): Promise<QuestV2ProofFileLink> {
    return questApi.getProofFileLink(
      questId,
      proofSubmissionId,
      fileId,
      options
    );
  }

  async reviewProof(
    questId: string,
    proofSubmissionId: string,
    payload: QuestV2ProofReviewPayload,
    idempotencyKey?: string
  ): Promise<QuestV2ProofReview> {
    return questApi.reviewProof(
      questId,
      proofSubmissionId,
      payload,
      idempotencyKey
    );
  }

  async cancelQuest(
    questId: string,
    idempotencyKey?: string
  ): Promise<QuestV2CancellationOutcome> {
    return questApi.cancelQuest(questId, idempotencyKey);
  }

  async confirmCompletion(
    questId: string,
    idempotencyKey?: string
  ): Promise<QuestV2Completion> {
    return questApi.confirmCompletion(questId, idempotencyKey);
  }

  async startWork(
    questId: string,
    idempotencyKey: string
  ): Promise<QuestV2StartWork> {
    return questApi.startWork(questId, idempotencyKey);
  }

  async createReview(
    questId: string,
    input: QuestV2ReviewPayload,
    idempotencyKey?: string
  ): Promise<QuestV2Review> {
    return questApi.createReview(questId, input, idempotencyKey);
  }

  async updateReview(
    questId: string,
    reviewId: string,
    input: { rating: number; comment?: string },
    idempotencyKey?: string
  ): Promise<QuestV2Review> {
    return questApi.updateReview(questId, reviewId, input, idempotencyKey);
  }
}

export const liveQuestService = new LiveQuestService();
