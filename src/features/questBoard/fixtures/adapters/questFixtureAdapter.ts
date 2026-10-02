import { questFixtures } from "../questFixtures";
import { DEFAULT_MEMBER_DIRECTORY } from "../memberDirectory";
import {
  FIXTURE_CHAT_SEEDS,
  QUEST_OWNER_GREETING,
  questConversationId,
  type FixtureChatConversation,
  type FixtureChatMessage,
} from "../chatSeeds";
import { seedStates } from "../questSeeds";
import { DEFAULT_PROTOTYPE_VIEWER_ID, PROTOTYPE_NOW } from "../constants";
import { DEFAULT_PLATFORM_FEE_BASIS_POINTS } from "../../domain/constants";
import { clone } from "../../domain/questStateUtils";
import { createPayloadBlockers, safeDate } from "../questValidation";
import type { QuestFixtureCreateInput } from "../questValidation";
import {
  calculateEscrow,
  calculatePublishCheck,
  conversationFor,
  formatConsentCountdown as formatConsentCountdownPure,
  getConsentRemainingMs as getConsentRemainingMsPure,
  normalizeStateShape,
  projectedState,
  stateForViewer,
  unique,
} from "../../domain/questSelectors";
import {
  ensureConversation,
  hydrateChatSeed,
  latestChatMessage,
  projectChatConversation,
  projectChatMessage,
} from "../chatProjection";
import { toBoardQuest } from "../../presentation/questBoardViewData";
import { createQuestStore, questStore } from "../../store/questStore";
import { reduceQuestAction, type QuestReducerAction } from "../questReducer";
import type { ChatConversation, ChatMessage } from "../../../chat/chatTypes";
import {
  QuestApplicationStatus,
  QuestInvitationStatus,
  QuestParticipation,
  QuestStatus,
  QuestTeamStatus,
  type QuestBoardQuest,
  type QuestDetailState,
  type QuestEditConsent,
  type QuestEscrowSummary,
  type QuestPartialStartConsent,
  type QuestPublishCheck,
  type QuestSettlementSummary,
  type WorkConversationCapability,
} from "../../domain/types";
export { DEFAULT_PROTOTYPE_VIEWER_ID } from "../constants";
export {
  EDIT_CONSENT_WINDOW_MS,
  PARTIAL_GROUP_START_CONSENT_WINDOW_MS,
} from "../../domain/constants";

export function getConsentRemainingMs(
  consent: QuestEditConsent | QuestPartialStartConsent | undefined,
  now = new Date()
): number | null {
  return getConsentRemainingMsPure(consent, now);
}

export function formatConsentCountdown(
  consent: QuestEditConsent | QuestPartialStartConsent | undefined,
  now = new Date()
): string | null {
  return formatConsentCountdownPure(consent, now);
}

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

export type QuestFixtureValueResult<T> =
  | { ok: true; value: T; state?: QuestDetailState }
  | { ok: false; error: QuestFixtureError; state?: QuestDetailState };

export type QuestActionResult =
  | QuestFixtureResult
  | QuestFixtureValueResult<ChatMessage>
  | QuestFixtureValueResult<ChatConversation>;

export interface QuestMemberSearchResult {
  id: string;
  workerId: string;
  displayName: string;
}

export interface QuestFixtureAdapterOptions {
  now?: Date;
  states?: QuestDetailState[];
  platformFeeBasisPoints?: number;
  /** Injectable KU directory seam used by the team invitation search prototype. */
  memberDirectory?: QuestMemberSearchResult[];
}

export type { QuestFixtureCreateInput } from "../questValidation";

export type QuestFixtureAction = QuestReducerAction;

export type ChatAction =
  | {
      type: "SEND_MESSAGE";
      conversationId: string;
      senderId: string;
      body: string;
    }
  | {
      type: "MARK_CONVERSATION_READ";
      conversationId: string;
      viewerId?: string;
    };

export type QuestWorkflowAction = QuestFixtureAction | ChatAction;

export interface QuestFixtureAdapter {
  readonly now: Date;
  getState(
    questId: string,
    viewerId?: string,
    now?: Date
  ): QuestDetailState | null;
  getQuestDetail(
    questId: string,
    viewerId?: string,
    now?: Date
  ): QuestDetailState | null;
  listStates(viewerId?: string, now?: Date): QuestDetailState[];
  listBoardQuests(viewerId?: string, now?: Date): QuestBoardQuest[];
  getPublishCheck(questId: string, now?: Date): QuestPublishCheck | null;
  getEscrowSummary(rewardSatang: number, headcount: number): QuestEscrowSummary;
  getConversationCapability(
    questId: string,
    viewerId?: string,
    now?: Date
  ): WorkConversationCapability;
  /** Returns only conversations readable by the viewer, ordered by latest message. */
  listConversations(viewerId?: string, now?: Date): ChatConversation[];
  /** Returns a conversation only when its server id and viewer membership match. */
  getConversation(
    conversationId: string,
    viewerId?: string,
    now?: Date
  ): ChatConversation | null;
  /** Returns messages in a readable server conversation, or an empty list when denied. */
  getConversationMessages(
    conversationId: string,
    viewerId?: string,
    now?: Date
  ): ChatMessage[];
  /** Short alias for callers that already have a conversation context. */
  getMessages(
    conversationId: string,
    viewerId?: string,
    now?: Date
  ): ChatMessage[];
  /** Appends a session-only message after re-checking server conversation capability. */
  sendMessage(
    conversationId: string,
    senderId: string,
    body: string,
    now?: Date
  ): QuestFixtureValueResult<ChatMessage>;
  /** Explicit alias for the chat action. */
  sendChatMessage(
    conversationId: string,
    senderId: string,
    body: string,
    now?: Date
  ): QuestFixtureValueResult<ChatMessage>;
  /** Marks the viewer read cursor for a server conversation. */
  markConversationRead(
    conversationId: string,
    viewerId?: string,
    now?: Date
  ): QuestFixtureValueResult<ChatConversation>;
  /** Short alias for marking the viewer read cursor. */
  markRead(
    conversationId: string,
    viewerId?: string,
    now?: Date
  ): QuestFixtureValueResult<ChatConversation>;
  /** Compatibility projection for the pre-adapter inbox; fixture data still lives in the adapter. */
  listFixtureConversations(viewerId?: string, now?: Date): ChatConversation[];
  getSettlement(questId: string, now?: Date): QuestSettlementSummary | null;
  searchMembers(
    questId: string,
    query: string,
    leaderId?: string,
    now?: Date
  ): QuestMemberSearchResult[];
  /** Creates and publishes a new in-memory demo Quest; drafts remain in SecureStore. */
  createQuest(
    payload: QuestFixtureCreateInput,
    hirerId?: string,
    now?: Date
  ): QuestFixtureResult;
  createAndPublishQuest(
    payload: QuestFixtureCreateInput,
    hirerId?: string,
    now?: Date
  ): QuestFixtureResult;
  dispatch(
    action: {
      type: "SEND_MESSAGE";
      conversationId: string;
      senderId: string;
      body: string;
    },
    now?: Date
  ): QuestFixtureValueResult<ChatMessage>;
  dispatch(
    action: {
      type: "MARK_CONVERSATION_READ";
      conversationId: string;
      viewerId?: string;
    },
    now?: Date
  ): QuestFixtureValueResult<ChatConversation>;
  dispatch(action: QuestFixtureAction, now?: Date): QuestFixtureResult;
  dispatch(
    action: QuestWorkflowAction,
    now?: Date
  ):
    | QuestFixtureResult
    | QuestFixtureValueResult<ChatMessage>
    | QuestFixtureValueResult<ChatConversation>;
  subscribe(listener: () => void): () => void;
  reset(): void;
  joinDirect(
    questId: string,
    workerId?: string,
    now?: Date
  ): QuestFixtureResult;
  applyCandidate(
    questId: string,
    workerId?: string,
    now?: Date
  ): QuestFixtureResult;
  withdrawApplication(
    questId: string,
    applicationId?: string,
    workerIdOrNow?: string | Date,
    now?: Date
  ): QuestFixtureResult;
  createTeam(
    questId: string,
    leaderId?: string,
    nameOrNow?: string | Date,
    now?: Date
  ): QuestFixtureResult;
  inviteWorker(
    questId: string,
    workerId: string,
    leaderId?: string,
    now?: Date
  ): QuestFixtureResult;
  revokeInvitation(
    questId: string,
    invitationId: string,
    leaderId?: string,
    now?: Date
  ): QuestFixtureResult;
  respondToInvitation(
    questId: string,
    invitationId: string,
    workerId: string,
    accept: boolean,
    now?: Date
  ): QuestFixtureResult;
  acceptInvitation(
    questId: string,
    invitationId: string,
    workerId?: string,
    now?: Date
  ): QuestFixtureResult;
  declineInvitation(
    questId: string,
    invitationId: string,
    workerId?: string,
    now?: Date
  ): QuestFixtureResult;
  submitTeam(
    questId: string,
    leaderId?: string,
    now?: Date
  ): QuestFixtureResult;
  selectCandidate(
    questId: string,
    applicationId: string,
    hirerId?: string,
    now?: Date
  ): QuestFixtureResult;
  rejectCandidate(
    questId: string,
    applicationId: string,
    hirerId?: string,
    now?: Date
  ): QuestFixtureResult;
  rejectTeam(
    questId: string,
    teamId: string,
    hirerId?: string,
    now?: Date
  ): QuestFixtureResult;
  selectTeam(
    questId: string,
    teamId: string,
    hirerId?: string,
    now?: Date
  ): QuestFixtureResult;
  requestEdit(
    questId: string,
    changes: QuestEditConsent["requestedChanges"],
    hirerId?: string,
    now?: Date
  ): QuestFixtureResult;
  voteEditConsent(
    questId: string,
    workerId: string,
    approve: boolean,
    now?: Date
  ): QuestFixtureResult;
  respondToEditConsent(
    questId: string,
    workerId: string,
    approve: boolean,
    now?: Date
  ): QuestFixtureResult;
  votePartialGroupStartConsent(
    questId: string,
    voterId: string,
    approve: boolean,
    now?: Date
  ): QuestFixtureResult;
  submitProof(
    questId: string,
    ownerId?: string,
    imageUris?: string[],
    note?: string,
    now?: Date
  ): QuestFixtureResult;
  reviewProof(
    questId: string,
    proofId: string,
    approve: boolean,
    reason?: string,
    hirerId?: string,
    now?: Date
  ): QuestFixtureResult;
  approveProof(
    questId: string,
    proofId: string,
    hirerId?: string,
    now?: Date
  ): QuestFixtureResult;
  rejectProof(
    questId: string,
    proofId: string,
    reason?: string,
    hirerId?: string,
    now?: Date
  ): QuestFixtureResult;
  submitRework(
    questId: string,
    proofId: string,
    ownerId?: string,
    imageUris?: string[],
    note?: string,
    now?: Date
  ): QuestFixtureResult;
  confirmCompletion(
    questId: string,
    workerId?: string,
    now?: Date
  ): QuestFixtureResult;
  completeQuest(
    questId: string,
    hirerId?: string,
    now?: Date
  ): QuestFixtureResult;
  openDispute(
    questId: string,
    actorId?: string,
    now?: Date
  ): QuestFixtureResult;
  resolveDispute(
    questId: string,
    actorId?: string,
    now?: Date
  ): QuestFixtureResult;
  cancelQuest(
    questId: string,
    actorId?: string,
    now?: Date
  ): QuestFixtureResult;
  publishQuest(
    questId: string,
    hirerId?: string,
    now?: Date
  ): QuestFixtureResult;
}

export function createQuestFixtureAdapter(
  options: QuestFixtureAdapterOptions = {}
): QuestFixtureAdapter {
  const initialSeeds =
    options.states?.map((state) => ({
      state: normalizeStateShape(clone(state)),
      conversationMemberIds: [...(state.conversationMemberIds ?? [])],
    })) ?? seedStates();
  const initialStates = initialSeeds.map(({ state }) => clone(state));
  const stateStore =
    Object.keys(options).length === 0
      ? questStore
      : createQuestStore(initialStates);
  stateStore.getState().replaceQuestStates(initialStates);
  initialSeeds.forEach(({ state, conversationMemberIds }) => {
    state.conversationMemberIds = unique([
      ...(state.conversationMemberIds ?? []),
      ...conversationMemberIds,
    ]);
    if (state.assignments.length > 0 && !state.conversation.conversationId)
      ensureConversation(state, conversationMemberIds);
  });
  stateStore
    .getState()
    .replaceQuestStates(initialSeeds.map(({ state }) => clone(state)));
  const baseNow = safeDate(options.now, new Date(PROTOTYPE_NOW));
  const feeRateBasisPoints =
    options.platformFeeBasisPoints ?? DEFAULT_PLATFORM_FEE_BASIS_POINTS;
  const memberDirectory =
    options.memberDirectory?.map((member) => ({
      ...member,
      id: member.id || member.workerId,
      workerId: member.workerId || member.id,
    })) ?? DEFAULT_MEMBER_DIRECTORY;
  const conversations = new Map<string, FixtureChatConversation>(
    FIXTURE_CHAT_SEEDS.map((seed) => [seed.id, hydrateChatSeed(seed)])
  );

  const createChatFromState = (
    state: QuestDetailState
  ): FixtureChatConversation => {
    const conversationId =
      state.conversation.conversationId ?? questConversationId(state.quest.id);
    const isGroup = state.quest.participation === QuestParticipation.GROUP;
    return hydrateChatSeed({
      id: conversationId,
      questId: state.quest.id,
      memberIds: state.conversationMemberIds ?? [],
      questTitle: { en: state.quest.title, th: state.quest.title },
      participantName: isGroup
        ? "Quest team"
        : (questFixtures.find((fixture) => fixture.id === state.quest.id)
            ?.creator.name ?? state.quest.hirerId),
      participantRole: isGroup ? "member" : "owner",
      initials: isGroup ? "QT" : "QO",
      avatarColor: "#EAF6ED",
      messages: [
        {
          id: `${conversationId}-welcome`,
          senderId: state.quest.hirerId,
          text: QUEST_OWNER_GREETING,
          time: "Now",
        },
      ],
    });
  };
  const syncChatForState = (state: QuestDetailState): void => {
    const conversationId = state.conversation.conversationId;
    if (!conversationId) return;
    const conversation =
      conversations.get(conversationId) ?? createChatFromState(state);
    conversation.questId = state.quest.id;
    conversation.memberIds = unique([
      ...(conversation.memberIds ?? []),
      ...(state.conversationMemberIds ?? []),
    ]);
    conversations.set(conversationId, conversation);
  };
  Object.values(stateStore.getState().quests).forEach(syncChatForState);
  const initialStateValues = Object.values(stateStore.getState().quests).map(
    (state) => clone(state)
  );
  const initialConversations = new Map(
    [...conversations.entries()].map(([id, conversation]) => [
      id,
      clone(conversation),
    ])
  );
  let createdQuestCounter = 0;
  const nextCreatedQuestId = (): string => {
    let questId = "";
    do {
      createdQuestCounter += 1;
      questId = `created-quest-${createdQuestCounter}`;
    } while (stateStore.getState().quests[questId]);
    return questId;
  };
  const getInternal = (questId: string): QuestDetailState | null =>
    stateStore.getState().quests[questId] ?? null;
  const viewer = (viewerId: string | undefined): string =>
    viewerId?.trim() || DEFAULT_PROTOTYPE_VIEWER_ID;
  const at = (now: Date | undefined): Date => safeDate(now, baseNow);
  const commit = (state: QuestDetailState): void => {
    const normalized = normalizeStateShape(state);
    stateStore.getState().setQuestState(normalized);
    syncChatForState(normalized);
  };
  type ChatContext = {
    conversation: FixtureChatConversation;
    state?: QuestDetailState;
    capability: WorkConversationCapability;
  };
  const deniedChatCapability = (
    conversationId: string
  ): WorkConversationCapability => ({
    conversationId,
    canRead: false,
    canWrite: false,
    readOnly: true,
    readOnlyReason: "NOT_A_MEMBER",
  });
  const getChatContext = (
    conversationId: string,
    viewerId: string,
    now: Date
  ): ChatContext | undefined => {
    const conversation = conversations.get(conversationId);
    if (!conversation || !conversation.memberIds.includes(viewerId))
      return undefined;
    if (!conversation.questId) {
      return {
        conversation,
        capability: {
          conversationId,
          canRead: true,
          canWrite: true,
          readOnly: false,
        },
      };
    }
    const state = getInternal(conversation.questId);
    if (!state || state.conversation.conversationId !== conversationId)
      return undefined;
    const projected = projectedState(state, now);
    const capability = conversationFor(projected, viewerId);
    if (!capability.canRead) return undefined;
    return { conversation, state, capability };
  };
  const fixtureChatContext = (
    conversation: FixtureChatConversation,
    viewerId: string,
    now: Date
  ): ChatContext => {
    if (!conversation.questId) {
      return {
        conversation,
        capability: {
          conversationId: conversation.id,
          canRead: true,
          canWrite: true,
          readOnly: false,
        },
      };
    }
    const state = getInternal(conversation.questId);
    if (state && state.conversation.conversationId === conversation.id) {
      return {
        conversation,
        state,
        capability: conversationFor(projectedState(state, now), viewerId),
      };
    }
    return {
      conversation,
      capability: conversation.memberIds.includes(viewerId)
        ? {
            conversationId: conversation.id,
            canRead: true,
            canWrite: true,
            readOnly: false,
          }
        : deniedChatCapability(conversation.id),
    };
  };
  const sortedChatConversations = (
    items: ChatConversation[]
  ): ChatConversation[] =>
    items.sort((left, right) => {
      const leftRecord = conversations.get(left.id);
      const rightRecord = conversations.get(right.id);
      const leftTime = leftRecord
        ? new Date(latestChatMessage(leftRecord)?.sentAt ?? "").getTime()
        : Number.NEGATIVE_INFINITY;
      const rightTime = rightRecord
        ? new Date(latestChatMessage(rightRecord)?.sentAt ?? "").getTime()
        : Number.NEGATIVE_INFINITY;
      return rightTime - leftTime || left.id.localeCompare(right.id);
    });

  const runQuestAction = (
    action: QuestReducerAction,
    now: Date
  ): QuestFixtureResult => {
    const questId =
      action.type === "CREATE_AND_PUBLISH" ? undefined : action.questId;
    const current = questId ? getInternal(questId) : null;
    const createdQuestId =
      action.type === "CREATE_AND_PUBLISH" &&
      createPayloadBlockers(action.payload).length === 0
        ? nextCreatedQuestId()
        : undefined;
    const reduced = reduceQuestAction(current, action, now, {
      feeRateBasisPoints,
      createdQuestId,
    });
    if (reduced.nextState !== current) commit(reduced.nextState);
    return reduced.ok
      ? { ok: true, state: reduced.state }
      : { ok: false, state: reduced.state, error: reduced.error };
  };

  const adapter: QuestFixtureAdapter = {
    now: new Date(baseNow.getTime()),
    getState: (
      questId,
      viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const state = getInternal(questId);
      return state ? stateForViewer(state, viewer(viewerId), at(now)) : null;
    },
    getQuestDetail: (
      questId,
      viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => adapter.getState(questId, viewerId, now),
    listStates: (viewerId = DEFAULT_PROTOTYPE_VIEWER_ID, now = baseNow) =>
      Object.values(stateStore.getState().quests).map((state) =>
        stateForViewer(state, viewer(viewerId), at(now))
      ),
    listBoardQuests: (
      viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const currentViewer = viewer(viewerId);
      const currentTime = at(now);
      return Object.values(stateStore.getState().quests)
        .map((state) => stateForViewer(state, currentViewer, currentTime))
        .filter(
          (state) =>
            state.quest.status === QuestStatus.QUEST_OPEN &&
            state.quest.hirerId !== currentViewer
        )
        .filter((state) => !state.quest.id.endsWith("-demo"))
        .filter(
          (state) =>
            !state.applications.some(
              (item) =>
                item.applicantId === currentViewer &&
                item.status === QuestApplicationStatus.APPLICATION_APPLIED
            )
        )
        .map(toBoardQuest);
    },
    getPublishCheck: (questId) => {
      const state = getInternal(questId);
      return state
        ? calculatePublishCheck(state.quest, feeRateBasisPoints)
        : null;
    },
    getEscrowSummary: (rewardSatang, headcount) =>
      calculateEscrow(rewardSatang, headcount, feeRateBasisPoints),
    getSettlement: (questId, now = baseNow) => {
      const state = getInternal(questId);
      return state
        ? (stateForViewer(state, DEFAULT_PROTOTYPE_VIEWER_ID, at(now))
            .settlement ?? null)
        : null;
    },
    getConversationCapability: (
      questId,
      viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const state = getInternal(questId);
      return state
        ? conversationFor(projectedState(state, at(now)), viewer(viewerId))
        : {
            conversationId: null,
            canRead: false,
            canWrite: false,
            readOnly: true,
            readOnlyReason: "NOT_A_MEMBER",
          };
    },
    listConversations: (
      viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const currentViewer = viewer(viewerId);
      const currentTime = at(now);
      return sortedChatConversations(
        [...conversations.values()].flatMap((conversation) => {
          const context = getChatContext(
            conversation.id,
            currentViewer,
            currentTime
          );
          return context?.capability.canRead
            ? [
                projectChatConversation(
                  conversation,
                  currentViewer,
                  context.capability,
                  context.state
                ),
              ]
            : [];
        })
      );
    },
    getConversation: (
      conversationId,
      viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const currentViewer = viewer(viewerId);
      const context = getChatContext(conversationId, currentViewer, at(now));
      return context?.capability.canRead
        ? projectChatConversation(
            context.conversation,
            currentViewer,
            context.capability,
            context.state
          )
        : null;
    },
    getConversationMessages: (
      conversationId,
      viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const conversation = adapter.getConversation(
        conversationId,
        viewerId,
        now
      );
      return conversation?.messages ?? [];
    },
    getMessages: (
      conversationId,
      viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => adapter.getConversationMessages(conversationId, viewerId, now),
    sendMessage: (conversationId, senderId, body, now = baseNow) => {
      const currentTime = at(now);
      const currentViewer = viewer(senderId);
      const stored = conversations.get(conversationId);
      if (!stored)
        return {
          ok: false,
          error: { code: "NOT_FOUND", message: "Conversation not found." },
        };
      const context = getChatContext(
        conversationId,
        currentViewer,
        currentTime
      );
      const contextState = context?.state
        ? stateForViewer(context.state, currentViewer, currentTime)
        : undefined;
      if (!context)
        return {
          ok: false,
          error: {
            code: "FORBIDDEN",
            message: "Only conversation members can send messages.",
          },
          state: contextState,
        };
      if (!context.capability.canWrite || context.capability.readOnly) {
        return {
          ok: false,
          error: {
            code: "INVALID_STATUS",
            message: "This conversation is read-only.",
          },
          state: contextState,
        };
      }
      const text = body.trim();
      if (!text)
        return {
          ok: false,
          error: {
            code: "INVALID_MESSAGE",
            message: "A message cannot be empty.",
          },
          state: contextState,
        };
      const requestedSentAt = currentTime.getTime();
      const latestSentAt = new Date(
        latestChatMessage(stored)?.sentAt ?? ""
      ).getTime();
      const latestReadAt = Math.max(
        ...Object.values(stored.readAt)
          .map((value) => new Date(value).getTime())
          .filter((value) => Number.isFinite(value)),
        Number.NEGATIVE_INFINITY
      );
      const sentAt = Math.max(
        requestedSentAt,
        Number.isFinite(latestSentAt) ? latestSentAt + 1 : requestedSentAt,
        Number.isFinite(latestReadAt) ? latestReadAt + 1 : requestedSentAt
      );
      const message: FixtureChatMessage = {
        id: `${conversationId}-message-${stored.messages.length + 1}`,
        senderId: currentViewer,
        text: { en: text, th: text },
        time: "Now",
        sentAt: new Date(sentAt).toISOString(),
      };
      stored.messages.push(message);
      stateStore.getState().touch();
      return {
        ok: true,
        value: projectChatMessage(message, currentViewer),
        state: contextState,
      };
    },
    sendChatMessage: (conversationId, senderId, body, now = baseNow) =>
      adapter.sendMessage(conversationId, senderId, body, now),
    markConversationRead: (
      conversationId,
      viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const currentTime = at(now);
      const currentViewer = viewer(viewerId);
      const stored = conversations.get(conversationId);
      if (!stored)
        return {
          ok: false,
          error: { code: "NOT_FOUND", message: "Conversation not found." },
        };
      const context = getChatContext(
        conversationId,
        currentViewer,
        currentTime
      );
      if (!context || !context.capability.canRead)
        return {
          ok: false,
          error: {
            code: "FORBIDDEN",
            message: "Only conversation members can mark messages read.",
          },
        };
      stored.readAt[currentViewer] = currentTime.toISOString();
      stateStore.getState().touch();
      return {
        ok: true,
        value: projectChatConversation(
          stored,
          currentViewer,
          context.capability,
          context.state
        ),
        state: context.state
          ? stateForViewer(context.state, currentViewer, currentTime)
          : undefined,
      };
    },
    markRead: (
      conversationId,
      viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => adapter.markConversationRead(conversationId, viewerId, now),
    listFixtureConversations: (
      viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const currentViewer = viewer(viewerId);
      const currentTime = at(now);
      return FIXTURE_CHAT_SEEDS.flatMap((seed) => {
        const conversation = conversations.get(seed.id);
        if (!conversation || !conversation.memberIds.includes(currentViewer))
          return [];
        const context = fixtureChatContext(
          conversation,
          currentViewer,
          currentTime
        );
        return [
          projectChatConversation(
            conversation,
            currentViewer,
            context.capability,
            context.state
          ),
        ];
      });
    },
    searchMembers: (
      questId,
      query,
      leaderId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const state = getInternal(questId);
      if (!state) return [];
      const current = projectedState(state, at(now));
      const leaderTeam = current.teams.find(
        (teamItem) =>
          teamItem.leaderId === leaderId &&
          teamItem.status === QuestTeamStatus.TEAM_FORMING
      );
      if (!leaderTeam) return [];
      const normalizedQuery = query.trim().toLocaleLowerCase();
      const occupied = new Set(
        current.teams.flatMap((teamItem) =>
          teamItem.members.map((member) => member.workerId)
        )
      );
      const pending = new Set(
        current.invitations
          .filter(
            (item) => item.status === QuestInvitationStatus.INVITATION_PENDING
          )
          .map((item) => item.invitedWorkerId)
      );
      return memberDirectory
        .filter(
          (member) =>
            member.workerId !== current.quest.hirerId &&
            member.workerId !== leaderId
        )
        .filter(
          (member) =>
            !occupied.has(member.workerId) && !pending.has(member.workerId)
        )
        .filter(
          (member) =>
            !normalizedQuery ||
            `${member.displayName} ${member.workerId}`
              .toLocaleLowerCase()
              .includes(normalizedQuery)
        )
        .map((member) => ({ ...member }));
    },
    createQuest: (payload, hirerId = "demo-hirer", now = baseNow) =>
      adapter.createAndPublishQuest(payload, hirerId, now),
    createAndPublishQuest: (payload, hirerId = "demo-hirer", now = baseNow) =>
      runQuestAction({ type: "CREATE_AND_PUBLISH", payload, hirerId }, at(now)),
    subscribe: (listener) => stateStore.subscribe(() => listener()),
    reset: () => {
      createdQuestCounter = 0;
      stateStore
        .getState()
        .replaceQuestStates(initialStateValues.map((state) => clone(state)));
      conversations.clear();
      initialConversations.forEach((conversation, id) =>
        conversations.set(id, clone(conversation))
      );
    },
    joinDirect: (
      questId,
      workerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => runQuestAction({ type: "DIRECT_JOIN", questId, workerId }, at(now)),
    applyCandidate: (
      questId,
      workerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => runQuestAction({ type: "APPLY", questId, workerId }, at(now)),
    withdrawApplication: (questId, applicationId, workerIdOrNow, now) => {
      const currentNow =
        workerIdOrNow instanceof Date ? workerIdOrNow : (now ?? baseNow);
      const workerId =
        typeof workerIdOrNow === "string" ? workerIdOrNow : undefined;
      return runQuestAction(
        { type: "WITHDRAW_APPLICATION", questId, applicationId, workerId },
        at(currentNow)
      );
    },
    createTeam: (
      questId,
      leaderId = DEFAULT_PROTOTYPE_VIEWER_ID,
      nameOrNow,
      now
    ) => {
      const currentNow =
        nameOrNow instanceof Date ? nameOrNow : (now ?? baseNow);
      const name = typeof nameOrNow === "string" ? nameOrNow : undefined;
      return runQuestAction(
        { type: "CREATE_TEAM", questId, leaderId, name },
        at(currentNow)
      );
    },
    inviteWorker: (
      questId,
      workerId,
      leaderId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) =>
      runQuestAction(
        { type: "INVITE_WORKER", questId, workerId, leaderId },
        at(now)
      ),
    revokeInvitation: (
      questId,
      invitationId,
      leaderId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) =>
      runQuestAction(
        { type: "REVOKE_INVITATION", questId, invitationId, leaderId },
        at(now)
      ),
    respondToInvitation: (
      questId,
      invitationId,
      workerId,
      accept,
      now = baseNow
    ) =>
      runQuestAction(
        { type: "RESPOND_INVITATION", questId, invitationId, workerId, accept },
        at(now)
      ),
    acceptInvitation: (
      questId,
      invitationId,
      workerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) =>
      adapter.respondToInvitation(questId, invitationId, workerId, true, now),
    declineInvitation: (
      questId,
      invitationId,
      workerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) =>
      adapter.respondToInvitation(questId, invitationId, workerId, false, now),
    submitTeam: (
      questId,
      leaderId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => runQuestAction({ type: "SUBMIT_TEAM", questId, leaderId }, at(now)),
    selectCandidate: (
      questId,
      applicationId,
      hirerId = "demo-hirer",
      now = baseNow
    ) =>
      runQuestAction(
        { type: "SELECT_CANDIDATE", questId, applicationId, hirerId },
        at(now)
      ),
    rejectCandidate: (
      questId,
      applicationId,
      hirerId = "demo-hirer",
      now = baseNow
    ) =>
      runQuestAction(
        { type: "REJECT_CANDIDATE", questId, applicationId, hirerId },
        at(now)
      ),
    rejectTeam: (questId, teamId, hirerId = "demo-hirer", now = baseNow) =>
      runQuestAction(
        { type: "REJECT_TEAM", questId, teamId, hirerId },
        at(now)
      ),
    selectTeam: (questId, teamId, hirerId = "demo-hirer", now = baseNow) =>
      runQuestAction(
        { type: "SELECT_TEAM", questId, teamId, hirerId },
        at(now)
      ),
    requestEdit: (questId, changes, hirerId = "demo-hirer", now = baseNow) =>
      runQuestAction(
        { type: "REQUEST_EDIT", questId, changes, hirerId },
        at(now)
      ),
    voteEditConsent: (questId, workerId, approve, now = baseNow) =>
      runQuestAction(
        { type: "VOTE_EDIT_CONSENT", questId, workerId, approve },
        at(now)
      ),
    respondToEditConsent: (questId, workerId, approve, now = baseNow) =>
      adapter.voteEditConsent(questId, workerId, approve, now),
    votePartialGroupStartConsent: (questId, voterId, approve, now = baseNow) =>
      runQuestAction(
        {
          type: "VOTE_PARTIAL_GROUP_START_CONSENT",
          questId,
          voterId,
          approve,
        },
        at(now)
      ),
    submitProof: (
      questId,
      ownerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      imageUris = [],
      note = "",
      now = baseNow
    ) =>
      runQuestAction(
        { type: "SUBMIT_PROOF", questId, ownerId, imageUris, note },
        at(now)
      ),
    reviewProof: (
      questId,
      proofId,
      approve,
      reason = "",
      hirerId = "demo-hirer",
      now = baseNow
    ) =>
      runQuestAction(
        { type: "REVIEW_PROOF", questId, proofId, approve, reason, hirerId },
        at(now)
      ),
    approveProof: (questId, proofId, hirerId = "demo-hirer", now = baseNow) =>
      adapter.reviewProof(questId, proofId, true, "", hirerId, now),
    rejectProof: (
      questId,
      proofId,
      reason = "",
      hirerId = "demo-hirer",
      now = baseNow
    ) => adapter.reviewProof(questId, proofId, false, reason, hirerId, now),
    submitRework: (
      questId,
      proofId,
      ownerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      imageUris = [],
      note = "",
      now = baseNow
    ) =>
      runQuestAction(
        { type: "REWORK_PROOF", questId, proofId, ownerId, imageUris, note },
        at(now)
      ),
    confirmCompletion: (
      questId,
      workerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) =>
      runQuestAction(
        { type: "CONFIRM_COMPLETION", questId, workerId },
        at(now)
      ),
    completeQuest: (questId, hirerId = "demo-hirer", now = baseNow) =>
      runQuestAction({ type: "COMPLETE", questId, hirerId }, at(now)),
    openDispute: (
      questId,
      actorId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => runQuestAction({ type: "OPEN_DISPUTE", questId, actorId }, at(now)),
    resolveDispute: (questId, actorId = "admin-demo", now = baseNow) =>
      runQuestAction({ type: "RESOLVE_DISPUTE", questId, actorId }, at(now)),
    cancelQuest: (questId, actorId = "demo-hirer", now = baseNow) =>
      runQuestAction({ type: "CANCEL", questId, actorId }, at(now)),
    publishQuest: (questId, hirerId = "demo-hirer", now = baseNow) =>
      runQuestAction({ type: "PUBLISH", questId, hirerId }, at(now)),
    dispatch: ((action: QuestWorkflowAction, now = baseNow) => {
      if (action.type === "SEND_MESSAGE")
        return adapter.sendMessage(
          action.conversationId,
          action.senderId,
          action.body,
          now
        );
      if (action.type === "MARK_CONVERSATION_READ")
        return adapter.markConversationRead(
          action.conversationId,
          action.viewerId,
          now
        );
      const handlers = {
        CREATE_AND_PUBLISH: (
          item: Extract<QuestFixtureAction, { type: "CREATE_AND_PUBLISH" }>
        ) => adapter.createAndPublishQuest(item.payload, item.hirerId, now),
        DIRECT_JOIN: (
          item: Extract<QuestFixtureAction, { type: "DIRECT_JOIN" }>
        ) => adapter.joinDirect(item.questId, item.workerId, now),
        APPLY: (item: Extract<QuestFixtureAction, { type: "APPLY" }>) =>
          adapter.applyCandidate(item.questId, item.workerId, now),
        WITHDRAW_APPLICATION: (
          item: Extract<QuestFixtureAction, { type: "WITHDRAW_APPLICATION" }>
        ) =>
          adapter.withdrawApplication(
            item.questId,
            item.applicationId,
            item.workerId ?? item.applicantId,
            now
          ),
        CREATE_TEAM: (
          item: Extract<QuestFixtureAction, { type: "CREATE_TEAM" }>
        ) => adapter.createTeam(item.questId, item.leaderId, item.name, now),
        INVITE_WORKER: (
          item: Extract<QuestFixtureAction, { type: "INVITE_WORKER" }>
        ) =>
          adapter.inviteWorker(item.questId, item.workerId, item.leaderId, now),
        REVOKE_INVITATION: (
          item: Extract<QuestFixtureAction, { type: "REVOKE_INVITATION" }>
        ) =>
          adapter.revokeInvitation(
            item.questId,
            item.invitationId,
            item.leaderId,
            now
          ),
        RESPOND_INVITATION: (
          item: Extract<QuestFixtureAction, { type: "RESPOND_INVITATION" }>
        ) =>
          adapter.respondToInvitation(
            item.questId,
            item.invitationId,
            item.workerId,
            item.accept,
            now
          ),
        SUBMIT_TEAM: (
          item: Extract<QuestFixtureAction, { type: "SUBMIT_TEAM" }>
        ) => adapter.submitTeam(item.questId, item.leaderId, now),
        SELECT_CANDIDATE: (
          item: Extract<QuestFixtureAction, { type: "SELECT_CANDIDATE" }>
        ) =>
          adapter.selectCandidate(
            item.questId,
            item.applicationId,
            item.hirerId,
            now
          ),
        REJECT_CANDIDATE: (
          item: Extract<QuestFixtureAction, { type: "REJECT_CANDIDATE" }>
        ) =>
          adapter.rejectCandidate(
            item.questId,
            item.applicationId,
            item.hirerId,
            now
          ),
        REJECT_TEAM: (
          item: Extract<QuestFixtureAction, { type: "REJECT_TEAM" }>
        ) => adapter.rejectTeam(item.questId, item.teamId, item.hirerId, now),
        SELECT_TEAM: (
          item: Extract<QuestFixtureAction, { type: "SELECT_TEAM" }>
        ) => adapter.selectTeam(item.questId, item.teamId, item.hirerId, now),
        REQUEST_EDIT: (
          item: Extract<QuestFixtureAction, { type: "REQUEST_EDIT" }>
        ) => adapter.requestEdit(item.questId, item.changes, item.hirerId, now),
        VOTE_EDIT_CONSENT: (
          item: Extract<QuestFixtureAction, { type: "VOTE_EDIT_CONSENT" }>
        ) =>
          adapter.voteEditConsent(
            item.questId,
            item.workerId,
            item.approve,
            now
          ),
        VOTE_PARTIAL_GROUP_START_CONSENT: (
          item: Extract<
            QuestFixtureAction,
            { type: "VOTE_PARTIAL_GROUP_START_CONSENT" }
          >
        ) =>
          adapter.votePartialGroupStartConsent(
            item.questId,
            item.voterId,
            item.approve,
            now
          ),
        VOTE_PARTIAL_START_CONSENT: (
          item: Extract<
            QuestFixtureAction,
            { type: "VOTE_PARTIAL_START_CONSENT" }
          >
        ) =>
          adapter.votePartialGroupStartConsent(
            item.questId,
            item.voterId,
            item.approve,
            now
          ),
        SUBMIT_PROOF: (
          item: Extract<QuestFixtureAction, { type: "SUBMIT_PROOF" }>
        ) =>
          adapter.submitProof(
            item.questId,
            item.ownerId,
            item.imageUris,
            item.note,
            now
          ),
        REVIEW_PROOF: (
          item: Extract<QuestFixtureAction, { type: "REVIEW_PROOF" }>
        ) =>
          adapter.reviewProof(
            item.questId,
            item.proofId,
            item.approve,
            item.reason,
            item.hirerId,
            now
          ),
        REWORK_PROOF: (
          item: Extract<QuestFixtureAction, { type: "REWORK_PROOF" }>
        ) =>
          adapter.submitRework(
            item.questId,
            item.proofId,
            item.ownerId,
            item.imageUris,
            item.note,
            now
          ),
        CONFIRM_COMPLETION: (
          item: Extract<QuestFixtureAction, { type: "CONFIRM_COMPLETION" }>
        ) => adapter.confirmCompletion(item.questId, item.workerId, now),
        COMPLETE: (item: Extract<QuestFixtureAction, { type: "COMPLETE" }>) =>
          adapter.completeQuest(item.questId, item.hirerId, now),
        OPEN_DISPUTE: (
          item: Extract<QuestFixtureAction, { type: "OPEN_DISPUTE" }>
        ) => adapter.openDispute(item.questId, item.actorId, now),
        RESOLVE_DISPUTE: (
          item: Extract<QuestFixtureAction, { type: "RESOLVE_DISPUTE" }>
        ) => adapter.resolveDispute(item.questId, item.actorId, now),
        CANCEL: (item: Extract<QuestFixtureAction, { type: "CANCEL" }>) =>
          adapter.cancelQuest(item.questId, item.actorId, now),
        PUBLISH: (item: Extract<QuestFixtureAction, { type: "PUBLISH" }>) =>
          adapter.publishQuest(item.questId, item.hirerId, now),
      };
      return handlers[action.type](action as never);
    }) as QuestFixtureAdapter["dispatch"],
  };

  return adapter;
}

export const questFixtureAdapter = createQuestFixtureAdapter();
