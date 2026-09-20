import type { ChatConversation, ChatMessage } from "../chat/chatTypes";
import {
  getQuestPublishCheck as getDraftPublishCheck,
  type QuestDraft,
} from "../createQuest/createQuestModel";
import { getVisibleQuests } from "./questBoardViewData";
import { questFixtures } from "./questFixtures";
import {
  DEFAULT_PROTOTYPE_VIEWER_ID,
  formatConsentCountdown as adapterFormatConsentCountdown,
  getQuestRewardSatang as adapterGetQuestRewardSatang,
  questFixtureAdapter,
  toBoardQuest,
  type QuestFixtureAdapter,
  type QuestActionResult,
  type QuestFixtureAction,
  type QuestFixtureResult,
  type QuestFixtureValueResult,
  type QuestWorkflowAction,
} from "./questFixtureAdapter";
import { createQuestClockStore } from "./store/questClockStore";
import { liveQuestService } from "./liveQuestService";
import type {
  LiveQuestSnapshot,
  LiveQuestSnapshotOptions,
} from "./liveQuestService";
import { QuestApplicationStatus } from "./types";
import type {
  QuestBoardQuest,
  QuestDetailState,
  QuestEditConsent,
  QuestPartialStartConsent,
  QuestPublishCheck,
  QuestSettlementSummary,
  WorkConversationCapability,
} from "./types";

export { DEFAULT_PROTOTYPE_VIEWER_ID };
export type {
  QuestActionResult,
  QuestFixtureAction,
  QuestFixtureResult,
  QuestWorkflowAction,
};

export const getQuestRewardSatang = adapterGetQuestRewardSatang;
export const formatConsentCountdown = adapterFormatConsentCountdown;

export type QuestMyQuestRelationship = "hirer" | "applicant" | "worker";
export type QuestMyQuestTab =
  "pending" | "accepted" | "history" | "active" | "draft" | "completed";

export interface QuestMyQuestProjection {
  state: QuestDetailState;
  quest: QuestBoardQuest;
  relationship: QuestMyQuestRelationship;
  tab: QuestMyQuestTab;
  hasAssignment: boolean;
  hasPendingApplication: boolean;
  isTerminal: boolean;
  groupChatCapability?: WorkConversationCapability;
}

export type QuestBoardPreviewState =
  | "populated"
  | "loading"
  | "empty"
  | "error"
  | "application-pending"
  | "application-accepted"
  | "full"
  | "closed";

export interface QuestBoardReadyModel {
  kind: "ready";
  quests: QuestBoardQuest[];
}

export interface QuestBoardLoadingModel {
  kind: "loading";
}

export interface QuestBoardEmptyModel {
  kind: "empty";
}

export interface QuestBoardErrorModel {
  kind: "error";
}

export interface QuestBoardUnavailableModel {
  kind: "unavailable";
  availability: "full" | "closed";
  quest: QuestBoardQuest;
}

export type QuestBoardSurfaceModel =
  | QuestBoardReadyModel
  | QuestBoardLoadingModel
  | QuestBoardEmptyModel
  | QuestBoardErrorModel
  | QuestBoardUnavailableModel;

export interface QuestWorkflow {
  getNow(seed?: Date): Date;
  getQuestBoardModel(viewerId?: string): QuestBoardQuest[];
  getQuestBoardSurfaceModel(
    viewerId?: string,
    previewState?: QuestBoardPreviewState
  ): QuestBoardSurfaceModel;
  getQuestBoardQuest(
    questId: string,
    viewerId?: string
  ): QuestBoardQuest | null;
  getQuestDetailState(
    questId: string,
    viewerId?: string
  ): QuestDetailState | null;
  /**
   * Reads the production Quest boundary. Existing synchronous methods remain
   * fixture-only so preview and roleplay callers stay deterministic.
   */
  getLiveQuestSnapshot(
    questId: string,
    viewerId: string,
    options?: LiveQuestSnapshotOptions
  ): Promise<LiveQuestSnapshot>;
  getMyQuestsModel(viewerId?: string): QuestDetailState[];
  getMyQuestsProjection(viewerId?: string): QuestMyQuestProjection[];
  getPublishCheck(questId: string): QuestPublishCheck | null;
  getDraftPublishCheck(draft: QuestDraft): QuestPublishCheck;
  getEscrowSummary(
    rewardSatang: number,
    headcount: number
  ): ReturnType<QuestFixtureAdapter["getEscrowSummary"]>;
  getSettlement(
    questId: string,
    viewerId?: string
  ): QuestSettlementSummary | null;
  getConsentCountdown(
    consent?: QuestEditConsent | QuestPartialStartConsent
  ): string | null;
  getConversationCapability(
    questId: string,
    viewerId?: string
  ): WorkConversationCapability;
  listConversations(viewerId?: string): ChatConversation[];
  getConversation(
    conversationId: string,
    viewerId?: string
  ): ChatConversation | null;
  getConversationMessages(
    conversationId: string,
    viewerId?: string
  ): ChatMessage[];
  searchMembers(
    questId: string,
    query: string,
    leaderId?: string
  ): ReturnType<QuestFixtureAdapter["searchMembers"]>;
  subscribe(listener: () => void): () => void;
  reset(): void;
  dispatch(action: {
    type: "SEND_MESSAGE";
    conversationId: string;
    senderId: string;
    body: string;
  }): QuestFixtureValueResult<ChatMessage>;
  dispatch(action: {
    type: "MARK_CONVERSATION_READ";
    conversationId: string;
    viewerId?: string;
  }): QuestFixtureValueResult<ChatConversation>;
  dispatch(action: QuestFixtureAction): QuestFixtureResult;
  dispatch(action: QuestWorkflowAction): QuestActionResult;
}

function createUnavailableQuest(
  availability: "full" | "closed"
): QuestBoardQuest {
  const quest =
    questFixtures.find((item) => !item.prototypeOnly) ?? questFixtures[0];
  return availability === "full"
    ? { ...quest, acceptedParticipants: quest.headcount }
    : { ...quest, deadline: "2026-08-11" };
}

function enrichBoardQuest(quest: QuestBoardQuest): QuestBoardQuest {
  const fixture = questFixtures.find((item) => item.id === quest.id);
  return fixture ? { ...quest, creator: fixture.creator } : quest;
}

function createMyQuestProjection(
  state: QuestDetailState,
  viewerId: string
): QuestMyQuestProjection | null {
  const quest = toQuestBoardQuest(state);
  const hasAssignment = state.assignments.some(
    (item) =>
      item.workerId === viewerId && item.status !== "ASSIGNMENT_CANCELLED"
  );
  const hasPendingApplication = state.applications.some(
    (item) =>
      item.applicantId === viewerId &&
      item.status === QuestApplicationStatus.APPLICATION_APPLIED
  );
  const isTerminal =
    state.quest.status === "QUEST_COMPLETED" ||
    state.quest.status === "QUEST_CANCELLED";
  const isHirer = state.quest.hirerId === viewerId;
  const relationship: QuestMyQuestRelationship = isHirer
    ? "hirer"
    : hasAssignment
      ? "worker"
      : hasPendingApplication
        ? "applicant"
        : "worker";
  if (!isHirer && !hasAssignment && !hasPendingApplication) return null;
  const tab: QuestMyQuestTab = isHirer
    ? state.quest.status === "QUEST_DRAFT"
      ? "draft"
      : isTerminal
        ? "completed"
        : "active"
    : hasAssignment
      ? isTerminal
        ? "history"
        : "accepted"
      : "pending";
  return {
    state,
    quest,
    relationship,
    tab,
    hasAssignment,
    hasPendingApplication,
    isTerminal,
    groupChatCapability: state.conversation.canRead
      ? state.conversation
      : undefined,
  };
}

export function toQuestBoardQuest(state: QuestDetailState): QuestBoardQuest {
  return enrichBoardQuest(toBoardQuest(state));
}

export function createQuestWorkflow(
  adapter: QuestFixtureAdapter = questFixtureAdapter,
  options: { refreshIntervalMs?: number } = {}
): QuestWorkflow {
  const clockEnabled = options.refreshIntervalMs !== undefined;
  const clockStore = createQuestClockStore(adapter.now);
  let adapterUnsubscribe: (() => void) | undefined;
  let refreshTimer: ReturnType<typeof setInterval> | undefined;
  let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
  let subscriberCount = 0;

  const scheduleNextDeadline = (): void => {
    clearTimeout(deadlineTimer);
    deadlineTimer = undefined;
    if (subscriberCount === 0) return;
    const nowMs = clockStore.getState().nowMs;
    const deadlines = adapter
      .listStates(DEFAULT_PROTOTYPE_VIEWER_ID, new Date(nowMs))
      .flatMap((state) => [
        state.quest.startAt,
        state.partialStartConsent?.responseDeadlineAt,
        state.editConsent?.responseDeadlineAt,
      ])
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value).getTime())
      .filter((value) => Number.isFinite(value) && value >= nowMs);
    const nextDeadlineMs = Math.min(...deadlines);
    if (!Number.isFinite(nextDeadlineMs)) return;
    deadlineTimer = setTimeout(
      () => {
        notify();
        scheduleNextDeadline();
      },
      Math.max(0, nextDeadlineMs - nowMs)
    );
  };
  const notify = () => {
    clockStore.getState().advance(0);
    scheduleNextDeadline();
  };
  const at = (): Date => {
    if (subscriberCount === 0)
      clockStore.getState().setNow(adapter.now.getTime());
    return new Date(clockStore.getState().nowMs);
  };
  const startRefresh = () => {
    if (subscriberCount !== 1) return;
    clockStore.getState().setNow(adapter.now.getTime());
    adapterUnsubscribe = adapter.subscribe(notify);
    scheduleNextDeadline();
    if (!clockEnabled) return;
    const interval = Math.max(1, options.refreshIntervalMs ?? 1000);
    refreshTimer = setInterval(() => {
      clockStore.getState().advance(interval);
    }, interval);
  };
  const stopRefresh = () => {
    if (subscriberCount !== 0) return;
    adapterUnsubscribe?.();
    adapterUnsubscribe = undefined;
    clearInterval(refreshTimer);
    refreshTimer = undefined;
    clearTimeout(deadlineTimer);
    deadlineTimer = undefined;
  };

  return {
    getNow: (seed) => {
      if (seed && subscriberCount === 0)
        clockStore.getState().setNow(seed.getTime());
      return new Date(clockStore.getState().nowMs);
    },
    getQuestBoardModel: (viewerId = DEFAULT_PROTOTYPE_VIEWER_ID) => {
      const now = at();
      return getVisibleQuests(
        adapter.listBoardQuests(viewerId, now).map(enrichBoardQuest),
        { currentStudentId: viewerId, now }
      );
    },
    getQuestBoardSurfaceModel: (
      viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      previewState = "populated"
    ) => {
      if (previewState === "loading") return { kind: "loading" };
      if (previewState === "empty") return { kind: "empty" };
      if (previewState === "error") return { kind: "error" };
      if (previewState === "full" || previewState === "closed") {
        const quest = createUnavailableQuest(previewState);
        return { kind: "unavailable", availability: previewState, quest };
      }
      const now = at();
      return {
        kind: "ready",
        quests: getVisibleQuests(
          adapter.listBoardQuests(viewerId, now).map(enrichBoardQuest),
          { currentStudentId: viewerId, now }
        ),
      };
    },
    getQuestBoardQuest: (questId, viewerId = DEFAULT_PROTOTYPE_VIEWER_ID) => {
      const now = at();
      const boardQuest = adapter
        .listBoardQuests(viewerId, now)
        .find((quest) => quest.id === questId);
      if (boardQuest) return enrichBoardQuest(boardQuest);
      const state = adapter.getQuestDetail(questId, viewerId, now);
      return state ? toQuestBoardQuest(state) : null;
    },
    getQuestDetailState: (questId, viewerId = DEFAULT_PROTOTYPE_VIEWER_ID) =>
      adapter.getQuestDetail(questId, viewerId, at()),
    getLiveQuestSnapshot: (questId, viewerId, options) =>
      liveQuestService.getLiveSnapshot(questId, viewerId, options),
    getMyQuestsModel: (viewerId = DEFAULT_PROTOTYPE_VIEWER_ID) =>
      adapter.listStates(viewerId, at()),
    getMyQuestsProjection: (viewerId = DEFAULT_PROTOTYPE_VIEWER_ID) => {
      const now = at();
      return adapter.listStates(viewerId, now).flatMap((state) => {
        const projection = createMyQuestProjection(state, viewerId);
        return projection ? [projection] : [];
      });
    },
    getPublishCheck: (questId) => adapter.getPublishCheck(questId),
    getDraftPublishCheck: (draft) => getDraftPublishCheck(draft),
    getEscrowSummary: (rewardSatang, headcount) =>
      adapter.getEscrowSummary(rewardSatang, headcount),
    getSettlement: (questId, viewerId = DEFAULT_PROTOTYPE_VIEWER_ID) => {
      const state = adapter.getQuestDetail(questId, viewerId, at());
      return state?.settlement ?? null;
    },
    getConsentCountdown: (consent) =>
      adapterFormatConsentCountdown(consent, at()),
    getConversationCapability: (questId, viewerId) =>
      adapter.getConversationCapability(questId, viewerId, at()),
    listConversations: (viewerId) => adapter.listConversations(viewerId, at()),
    getConversation: (conversationId, viewerId) =>
      adapter.getConversation(conversationId, viewerId, at()),
    getConversationMessages: (conversationId, viewerId) =>
      adapter.getConversationMessages(conversationId, viewerId, at()),
    searchMembers: (questId, query, leaderId) =>
      adapter.searchMembers(questId, query, leaderId, at()),
    subscribe: (listener) => {
      subscriberCount += 1;
      startRefresh();
      const unsubscribeClock = clockStore.subscribe(() => listener());
      return () => {
        unsubscribeClock();
        subscriberCount -= 1;
        stopRefresh();
      };
    },
    reset: () => {
      clockStore.getState().setNow(adapter.now.getTime());
      adapter.reset();
    },
    dispatch: ((action: QuestWorkflowAction) =>
      adapter.dispatch(action, at())) as QuestWorkflow["dispatch"],
  };
}

export const questWorkflow = createQuestWorkflow();
