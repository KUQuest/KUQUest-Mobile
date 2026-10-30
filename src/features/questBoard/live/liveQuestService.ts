import { serverNow } from "@/api/serverClock";
import {
  createQuestIdempotencyKey,
  questApi,
  type CreateQuestV2Payload,
  type QuestV2AssignmentMineStatus,
} from "@/api/QuestApi";
import { ApiError, type RequestOptions } from "@/api/ApiClient";
import { authService } from "../../auth/AuthService";
import { chatApi } from "@/api/ChatApi";
import type {
  ServerCandidateInquiryPage,
  ServerChatConversation,
  ServerChatMessagePage,
} from "@/api/ChatApi";
import type {
  QuestV2Application,
  QuestV2Assignment,
  QuestV2BoardCard,
  QuestV2CanonicalQuest,
  QuestV2CompletionConfirmation,
  QuestV2Detail,
  QuestV2EditRequest,
  QuestV2Image,
  QuestV2Mode,
  QuestV2Participation,
  QuestV2ParticipationDetail,
  QuestV2ProofSubmission,
  QuestV2PublicDetail,
  QuestV2PublicImage,
  QuestV2Review,
  QuestV2Team,
  QuestV2Underfilled,
} from "@/api/questV2Contracts";
import {
  QuestActor,
  QuestMode,
  QuestParticipation,
  QuestTeamRole,
  type QuestBoardCard,
  type QuestBoardQuest,
  type QuestStatus,
} from "../domain/types";
import {
  deriveQuestCapabilities,
  deriveQuestNextAction,
} from "../domain/questCapabilities";
import type {
  LiveQuestActor,
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

export function cardToQuestBoardCard(card: QuestV2BoardCard): QuestBoardCard {
  const startDate = card.startTime.slice(0, 10);
  const deadline = card.dueAt ? card.dueAt.slice(0, 10) : startDate;
  const rewardSatang = Math.round(card.questReward * 100);
  return {
    id: card.id,
    title: card.title,

    ...(card.tag
      ? { tagId: card.tag.id, tags: [card.tag.name] }
      : { tags: [] }),
    rewardPerPerson: card.questReward,
    rewardSatang,
    questFundingTotalSatang:
      typeof card.questFundingTotal === "number"
        ? Math.round(card.questFundingTotal * 100)
        : null,
    headcount: card.headcount,
    acceptedParticipants: card.activeWorkerCount,
    startDate,
    deadline,
    timeRange: card.dueAt ? timeRange(card.startTime, card.dueAt) : undefined,
    postedAt: card.startTime,
    location: card.location ?? "Online",
    locationDetails: { label: card.location },
    locationMode: card.location === null ? "online" : "on-campus",
    participation: card.participation,
    mode: card.mode,
    creator: { name: card.hirerName },
    hirerName: card.hirerName,
    ...(card.hirerProfile ? { ownerStudentId: card.hirerProfile.id } : {}),
  };
}
export function canonicalToQuestBoardQuest(
  q: QuestV2CanonicalQuest | QuestV2Detail,
  options: { creatorName?: string; acceptedParticipants?: number } = {}
): QuestBoardQuest {
  const { creatorName = "Me", acceptedParticipants } = options;
  const rewardSatang = Math.round((q.questReward ?? 0) * 100);
  const startDate = q.startTime.slice(0, 10);
  const deadline = q.dueAt ? q.dueAt.slice(0, 10) : startDate;
  return {
    id: q.id,
    title: q.title,
    ...(q.tag ? { tagId: q.tag.id, tags: [q.tag.name] } : { tags: [] }),
    description: q.description || "",
    completionCriteria: q.condition.items
      .map(
        (item: QuestV2CanonicalQuest["condition"]["items"][number]) => item.text
      )
      .join("\n"),
    proofRequired: q.proofRequired ? "required" : "none",
    rewardPerPerson: q.questReward ?? 0,
    rewardSatang,
    questFundingTotalSatang:
      typeof q.questFundingTotal === "number"
        ? Math.round(q.questFundingTotal * 100)
        : null,
    headcount: q.headcount,
    ...(acceptedParticipants === undefined ? {} : { acceptedParticipants }),
    startDate,
    deadline,
    timeRange: q.dueAt ? timeRange(q.startTime, q.dueAt) : undefined,
    postedAt: q.createdAt || q.startTime,
    location: q.locations[0]?.label ?? "Online",
    locationDetails: { label: q.locations[0]?.label ?? null },
    locationMode: q.locations.length > 0 ? "on-campus" : "online",
    participation: q.participation,
    mode: q.mode,
    creator: { name: creatorName },
    imageUris:
      "images" in q ? q.images.map((img: QuestV2Image) => img.url) : [],
    status: q.state as QuestStatus,
  };
}

export function publicDetailToQuestBoardQuest(
  d: QuestV2PublicDetail | QuestV2ParticipationDetail,
  options: { acceptedParticipants?: number } = {}
): QuestBoardQuest {
  const startDate = d.startTime.slice(0, 10);
  const deadline = d.dueAt ? d.dueAt.slice(0, 10) : startDate;
  const rewardSatang = Math.round(d.questReward * 100);

  return {
    id: d.id,
    title: d.title,
    ...(d.tag ? { tagId: d.tag.id, tags: [d.tag.name] } : { tags: [] }),
    description: d.description || "",
    completionCriteria: d.condition.items
      .map(
        (item: QuestV2PublicDetail["condition"]["items"][number]) => item.text
      )
      .join("\n"),
    proofRequired: d.proofRequired ? "required" : "none",
    rewardPerPerson: d.questReward,
    rewardSatang,
    questFundingTotalSatang:
      typeof d.questFundingTotal === "number"
        ? Math.round(d.questFundingTotal * 100)
        : null,
    headcount: d.headcount,
    acceptedParticipants: options.acceptedParticipants ?? d.activeWorkerCount,
    startDate,
    deadline,
    timeRange: d.dueAt ? timeRange(d.startTime, d.dueAt) : undefined,
    postedAt: d.startTime,
    location: d.locations[0]?.label ?? "Online",
    locationDetails: { label: d.locations[0]?.label ?? null },
    locationMode: d.locations.length > 0 ? "on-campus" : "online",
    participation: d.participation,
    mode: d.mode,
    creator: { name: d.hirerName },
    hirerName: d.hirerName,
    imageUris: d.images?.map((img: QuestV2PublicImage) => img.url) ?? [],
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

/**
 * The Hirer detail read answers 404 (the v2 contract documents no other
 * non-owner status) to a viewer who does not own the Quest. Offline and Server
 * failures must surface, not demote the viewer to a prospective Worker.
 */
function isNonOwnerDetailError(error: unknown): boolean {
  return (
    error instanceof ApiError && (error.status === 403 || error.status === 404)
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
  if (routeActor === QuestActor.HIRER) return routeActor;
  if (assignment) return QuestActor.WORKER;
  if (application) return QuestActor.CANDIDATE;
  if (team) return QuestActor.PROSPECTIVE_WORKER;
  return routeActor;
}

/**
 * The viewer's role on a `GROUP + CANDIDATE` Team. The Server exposes the
 * selected Team roster to its members through completion for reward settlement.
 */
function deriveTeamRole(
  actor: LiveQuestActor,
  mode: QuestV2Mode,
  participation: QuestV2Participation,
  team: QuestV2Team | null,
  viewerId: string
): QuestTeamRole | null {
  if (
    actor === QuestActor.HIRER ||
    mode !== QuestMode.CANDIDATE ||
    participation !== QuestParticipation.GROUP
  ) {
    return null;
  }
  if (!team) return QuestTeamRole.UNKNOWN;
  return team.leaderId === viewerId
    ? QuestTeamRole.LEADER
    : QuestTeamRole.MEMBER;
}

export class LiveQuestService {
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

  private async loadGroupParticipants(
    routeActor: LiveQuestActor,
    quest: QuestV2Detail | QuestV2PublicDetail | QuestV2ParticipationDetail,
    conversations: ServerChatConversation | null,
    resolvedAssignments: readonly LiveQuestAssignment[],
    options: LiveQuestSnapshotOptions
  ): Promise<LiveQuestParticipant[]> {
    return routeActor === QuestActor.PROSPECTIVE_WORKER &&
      quest.mode === QuestMode.FIRST_COME_FIRST_SERVED &&
      conversations
      ? await chatApi
          .listParticipants(conversations.id, options)
          .then((conversationParticipants) =>
            conversationParticipants.reduce<LiveQuestParticipant[]>(
              (workers, participant) => {
                if (participant.role !== "WORKER" || !participant.id)
                  return workers;
                workers.push({
                  id: participant.id,
                  displayName: participant.displayName,
                  ...(participant.avatar?.url
                    ? { avatarUrl: participant.avatar.url }
                    : {}),
                  ...(participant.avatar?.fileId
                    ? { avatarFileId: participant.avatar.fileId }
                    : {}),
                });
                return workers;
              },
              []
            )
          )
          .catch(() => this.loadParticipantProfiles(resolvedAssignments))
      : await this.loadParticipantProfiles(resolvedAssignments);
  }

  async listCandidateInquiries(
    params: { limit?: number; cursor?: string } = {}
  ): Promise<ServerCandidateInquiryPage> {
    return chatApi.listCandidateInquiries(params);
  }

  async getCandidateInquiryMessages(
    conversationId: string,
    params: { limit?: number; before?: string; after?: string } = {},
    options?: RequestOptions
  ): Promise<ServerChatMessagePage> {
    return chatApi.getCandidateInquiryMessages(conversationId, params, options);
  }

  async listBoardQuests(options?: RequestOptions): Promise<QuestBoardCard[]> {
    const items: QuestBoardCard[] = [];
    const seenCursors = new Set<string>();
    let cursor: string | undefined;

    do {
      const result = await questApi.listBoard(
        cursor ? { cursor, limit: 50 } : { limit: 50 },
        options
      );
      items.push(...result.items.map(cardToQuestBoardCard));
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
    return result.items.map((q) => canonicalToQuestBoardQuest(q));
  }
  async listMyWorkerAssignments(
    status?: QuestV2AssignmentMineStatus,
    options?: RequestOptions
  ): Promise<QuestV2Assignment[]> {
    return options
      ? questApi.listMyAssignments(status, options)
      : questApi.listMyAssignments(status);
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
    let routeActor: LiveQuestActor = QuestActor.PROSPECTIVE_WORKER;
    try {
      quest = await questApi.getDetail(questId, options);
      routeActor = QuestActor.HIRER;
    } catch (error) {
      if (!isNonOwnerDetailError(error)) throw error;
      try {
        quest = await questApi.getPublicDetail(questId, options);
      } catch {
        quest = await questApi.getParticipationDetail(questId, options);
      }
    }

    // The detail read names a pending edit, so a cold start finds it without
    // the realtime event; the event id still covers a request that has ended.
    const editRequestId =
      ("pendingEditRequest" in quest
        ? quest.pendingEditRequest?.requestId
        : undefined) ?? options.editRequestId;
    const [
      assignments,
      applications,
      teams,
      underfilled,
      proofs,
      completionConfirmations,
      conversations,
      editRequest,
    ] = await Promise.all([
      optionalResource(
        () => questApi.listQuestAssignments(questId, options),
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
      quest.proofRequired
        ? Promise.resolve([] as QuestV2CompletionConfirmation[])
        : optionalResource(
            () => questApi.listCompletionConfirmations(questId, options),
            [] as QuestV2CompletionConfirmation[]
          ),
      optionalResource(
        () =>
          chatApi.findConversation(
            (conversation) => conversation.quest.id === questId,
            options
          ),
        null as ServerChatConversation | null
      ),
      editRequestId
        ? optionalResource(
            () => questApi.getEditRequest(editRequestId, options),
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
    // Settlement closes each early finisher's Work Chat membership, so the
    // Participation roster wins over the chat roster whenever the Server sends it.
    const participationWorkers =
      "workers" in quest && quest.workers ? quest.workers : null;
    const participants =
      quest.participation !== "GROUP"
        ? []
        : participationWorkers
          ? participationWorkers.map(({ id, displayName }) => ({
              id,
              displayName,
            }))
          : await this.loadGroupParticipants(
              routeActor,
              quest,
              conversations,
              resolvedAssignments,
              options
            );
    const application = ownApplication(applications, viewerId);
    const listedTeam = ownTeam(teams, viewerId);
    const team = listedTeam && withIssuedJoinCode(listedTeam);
    const actor = deriveActor(routeActor, assignment, application, team);
    const teamRole = deriveTeamRole(
      actor,
      quest.mode,
      quest.participation,
      team,
      viewerId
    );
    const teamRewardAllocation =
      (quest.state === "QUEST_COMPLETED" ||
        quest.state === "QUEST_CANCELLED") &&
      quest.mode === QuestMode.CANDIDATE &&
      quest.participation === "GROUP" &&
      teamRole !== null
        ? await optionalResource(
            () => questApi.getTeamRewardAllocation(questId, options),
            null as Awaited<
              ReturnType<typeof questApi.getTeamRewardAllocation>
            > | null
          )
        : null;
    const capabilities = deriveQuestCapabilities({
      viewerId,
      actor,
      state: quest.state,
      startTime: quest.startTime,
      dueAt: quest.dueAt,
      mode: quest.mode,
      participation: quest.participation,
      proofRequired: quest.proofRequired,
      headcount: quest.headcount,
      assignments: resolvedAssignments,
      assignment,
      application,
      team,
      teamRole,
      underfilled,
      editRequest,
      proofs,
      workConversation: conversations,
      now: serverNow(),
    });
    const nextAction = deriveQuestNextAction({
      state: quest.state,
      actor,
      mode: quest.mode,
      participation: quest.participation,
      capabilities,
      application,
      applications,
      team,
      teams,
      underfilled,
      editRequest,
    });

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
      teamRole,
      teamRewardAllocation,
      teams,
      underfilled,
      editRequest,
      proofs,
      completionConfirmations,
      workConversation: conversations,
      proofRequired: quest.proofRequired,
      dueAt: quest.dueAt ?? null,
      nextAction,
      capabilities,
    };
  }

  async uploadImages(
    questId: string,
    imageUris: string[],
    idempotencyKey = createQuestIdempotencyKey()
  ): Promise<QuestV2Image[]> {
    const assets = imageUris.map((uri) => ({ uri }));
    return questApi.uploadQuestImages(questId, assets, idempotencyKey);
  }

  async createAndPublishQuest(
    payload: CreateQuestV2Payload,
    idempotencyKey?: string
  ): Promise<QuestV2CanonicalQuest> {
    const created = await questApi.createQuest(
      payload,
      createQuestIdempotencyKey()
    );
    return questApi.publishQuest(created.id, idempotencyKey);
  }

  async joinQuest(questId: string): Promise<QuestV2Assignment> {
    return questApi.joinQuest(questId, createQuestIdempotencyKey());
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

  async listQuestReviews(
    questId: string,
    _viewerId?: string
  ): Promise<QuestV2Review[]> {
    return questApi.listQuestReviews(questId);
  }
}

export const liveQuestService = new LiveQuestService();
