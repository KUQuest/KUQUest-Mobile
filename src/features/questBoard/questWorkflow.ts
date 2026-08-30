import type { ChatConversation, ChatMessage } from '../chat/chatTypes';
import { getVisibleQuests } from './questBoardViewData';
import { getQuestPublishCheck as getDraftPublishCheck, type QuestDraft } from '../createQuest/createQuestModel';
import {
  DEFAULT_PROTOTYPE_VIEWER_ID,
  questFixtureAdapter,
  toBoardQuest,
  type QuestFixtureAdapter,
  type QuestFixtureCreateInput,
  type QuestFixtureResult,
} from './questFixtureAdapter';
import type {
  QuestBoardQuest,
  QuestDetailState,
  QuestEditConsent,
  QuestPartialStartConsent,
  QuestPublishCheck,
  QuestSettlementSummary,
  WorkConversationCapability,
} from './types';

export { DEFAULT_PROTOTYPE_VIEWER_ID };
export type { QuestFixtureResult };

export interface QuestWorkflowOptions {
  /** The adapter's construction-time clock is the default prototype time source. */
  refreshIntervalMs?: number;
}

export function getQuestRewardSatang(quest: QuestBoardQuest): number {
  return quest.rewardSatang ?? Math.round(quest.rewardPerPerson * 100);
}

export function formatConsentCountdown(
  consent: QuestEditConsent | QuestPartialStartConsent | undefined,
  now = new Date(),
): string | null {
  if (!consent || !['EDIT_REQUEST_PENDING', 'PARTIAL_START_PENDING'].includes(consent.status)) return null;
  const remaining = Math.max(0, new Date(consent.responseDeadlineAt).getTime() - now.getTime());
  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function toQuestBoardQuest(state: QuestDetailState): QuestBoardQuest {
  return toBoardQuest(state);
}

export interface QuestWorkflow {
  getNow(): Date;
  getQuestBoardModel(viewerId?: string, now?: Date): QuestBoardQuest[];
  getQuestBoardQuest(questId: string, viewerId?: string, now?: Date): QuestBoardQuest | null;
  getQuestDetailState(questId: string, viewerId?: string, now?: Date): QuestDetailState | null;
  getMyQuestsModel(viewerId?: string, now?: Date): QuestDetailState[];
  getPublishCheck(questId: string, now?: Date): QuestPublishCheck | null;
  getDraftPublishCheck(draft: QuestDraft): QuestPublishCheck;
  getEscrowSummary(rewardSatang: number, headcount: number): ReturnType<QuestFixtureAdapter['getEscrowSummary']>;
  getSettlement(questId: string, now?: Date): QuestSettlementSummary | null;
  getConversationCapability(questId: string, viewerId?: string, now?: Date): WorkConversationCapability;
  listConversations(viewerId?: string, now?: Date): ChatConversation[];
  getConversation(conversationId: string, viewerId?: string, now?: Date): ChatConversation | null;
  getConversationMessages(conversationId: string, viewerId?: string, now?: Date): ChatMessage[];
  sendMessage(conversationId: string, senderId: string, body: string, now?: Date): ReturnType<QuestFixtureAdapter['sendMessage']>;
  markConversationRead(conversationId: string, viewerId?: string, now?: Date): ReturnType<QuestFixtureAdapter['markConversationRead']>;
  searchMembers(questId: string, query: string, leaderId?: string, now?: Date): ReturnType<QuestFixtureAdapter['searchMembers']>;
  createAndPublishQuest(payload: QuestFixtureCreateInput, hirerId?: string, now?: Date): QuestFixtureResult;
  subscribe(listener: () => void): () => void;
  reset(): void;
  joinDirect(questId: string, workerId?: string, now?: Date): QuestFixtureResult;
  applyCandidate(questId: string, workerId?: string, now?: Date): QuestFixtureResult;
  withdrawApplication(questId: string, applicationId?: string, workerId?: string, now?: Date): QuestFixtureResult;
  createTeam(questId: string, leaderId?: string, nameOrNow?: string | Date, now?: Date): QuestFixtureResult;
  inviteWorker(questId: string, workerId: string, leaderId?: string, now?: Date): QuestFixtureResult;
  revokeInvitation(questId: string, invitationId: string, leaderId?: string, now?: Date): QuestFixtureResult;
  respondToInvitation(questId: string, invitationId: string, workerId: string, accept: boolean, now?: Date): QuestFixtureResult;
  submitTeam(questId: string, leaderId?: string, now?: Date): QuestFixtureResult;
  selectCandidate(questId: string, applicationId: string, hirerId?: string, now?: Date): QuestFixtureResult;
  rejectCandidate(questId: string, applicationId: string, hirerId?: string, now?: Date): QuestFixtureResult;
  rejectTeam(questId: string, teamId: string, hirerId?: string, now?: Date): QuestFixtureResult;
  selectTeam(questId: string, teamId: string, hirerId?: string, now?: Date): QuestFixtureResult;
  requestEdit(questId: string, changes: QuestEditConsent['requestedChanges'], hirerId?: string, now?: Date): QuestFixtureResult;
  voteEditConsent(questId: string, workerId: string, approve: boolean, now?: Date): QuestFixtureResult;
  votePartialStartConsent(questId: string, voterId: string, approve: boolean, now?: Date): QuestFixtureResult;
  submitProof(questId: string, ownerId?: string, imageUris?: string[], note?: string, now?: Date): QuestFixtureResult;
  reviewProof(questId: string, proofId: string, approve: boolean, reason?: string, hirerId?: string, now?: Date): QuestFixtureResult;
  submitRework(questId: string, proofId: string, ownerId?: string, imageUris?: string[], note?: string, now?: Date): QuestFixtureResult;
  confirmCompletion(questId: string, workerId?: string, now?: Date): QuestFixtureResult;
  completeQuest(questId: string, hirerId?: string, now?: Date): QuestFixtureResult;
  openDispute(questId: string, actorId?: string, now?: Date): QuestFixtureResult;
  resolveDispute(questId: string, actorId?: string, now?: Date): QuestFixtureResult;
  cancelQuest(questId: string, actorId?: string, now?: Date): QuestFixtureResult;
  publishQuest(questId: string, hirerId?: string, now?: Date): QuestFixtureResult;
}

export function createQuestWorkflow(
  adapter: QuestFixtureAdapter = questFixtureAdapter,
  options: QuestWorkflowOptions = {},
): QuestWorkflow {
  let currentNow = new Date(adapter.now.getTime());
  let adapterUnsubscribe: (() => void) | undefined;
  let refreshTimer: ReturnType<typeof setInterval> | undefined;
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((listener) => listener());
  const at = (now?: Date): Date => {
    if (now) return new Date(now.getTime());
    if (listeners.size === 0) currentNow = new Date(adapter.now.getTime());
    return new Date(currentNow.getTime());
  };
  const timeForAdapter = (now?: Date): Date | undefined => {
    const time = at(now);
    return now || time.getTime() !== adapter.now.getTime() ? time : undefined;
  };
  const startRefresh = () => {
    if (listeners.size !== 1) return;
    currentNow = new Date(adapter.now.getTime());
    adapterUnsubscribe = adapter.subscribe(notify);
    const interval = options.refreshIntervalMs ?? 1000;
    refreshTimer = setInterval(() => {
      currentNow = new Date(currentNow.getTime() + interval);
      notify();
    }, interval);
  };
  const stopRefresh = () => {
    if (listeners.size !== 0) return;
    adapterUnsubscribe?.();
    adapterUnsubscribe = undefined;
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = undefined;
  };

  return {
    getNow: () => at(),
    getQuestBoardModel: (viewerId = DEFAULT_PROTOTYPE_VIEWER_ID, now) => {
      const currentTime = at(now);
      return getVisibleQuests(adapter.listBoardQuests(viewerId, currentTime), { currentStudentId: viewerId, now: currentTime });
    },
    getQuestBoardQuest: (questId, viewerId = DEFAULT_PROTOTYPE_VIEWER_ID, now) => {
      const currentTime = at(now);
      const boardQuest = adapter.listBoardQuests(viewerId, currentTime).find((quest) => quest.id === questId);
      if (boardQuest) return boardQuest;
      const state = adapter.getQuestDetail(questId, viewerId, currentTime);
      return state ? toBoardQuest(state) : null;
    },
    getQuestDetailState: (questId, viewerId = DEFAULT_PROTOTYPE_VIEWER_ID, now) => adapter.getQuestDetail(questId, viewerId, at(now)),
    getMyQuestsModel: (viewerId = DEFAULT_PROTOTYPE_VIEWER_ID, now) => adapter.listStates(viewerId, at(now)),
    getPublishCheck: (questId) => adapter.getPublishCheck(questId),
    getDraftPublishCheck: (draft) => getDraftPublishCheck(draft),
    getEscrowSummary: (rewardSatang, headcount) => adapter.getEscrowSummary(rewardSatang, headcount),
    getSettlement: (questId, now) => adapter.getSettlement(questId, at(now)),
    getConversationCapability: (questId, viewerId, now) => {
      const time = timeForAdapter(now);
      return time ? adapter.getConversationCapability(questId, viewerId, time) : adapter.getConversationCapability(questId, viewerId);
    },
    listConversations: (viewerId, now) => {
      const time = timeForAdapter(now);
      return time ? adapter.listConversations(viewerId, time) : adapter.listConversations(viewerId);
    },
    getConversation: (conversationId, viewerId, now) => {
      const time = timeForAdapter(now);
      return time ? adapter.getConversation(conversationId, viewerId, time) : adapter.getConversation(conversationId, viewerId);
    },
    getConversationMessages: (conversationId, viewerId, now) => {
      const time = timeForAdapter(now);
      return time ? adapter.getConversationMessages(conversationId, viewerId, time) : adapter.getConversationMessages(conversationId, viewerId);
    },
    sendMessage: (conversationId, senderId, body, now) => {
      const time = timeForAdapter(now);
      return time ? adapter.sendMessage(conversationId, senderId, body, time) : adapter.sendMessage(conversationId, senderId, body);
    },
    markConversationRead: (conversationId, viewerId, now) => {
      const time = timeForAdapter(now);
      return time ? adapter.markConversationRead(conversationId, viewerId, time) : adapter.markConversationRead(conversationId, viewerId);
    },
    searchMembers: (questId, query, leaderId, now) => adapter.searchMembers(questId, query, leaderId, at(now)),
    createAndPublishQuest: (payload, hirerId, now) => adapter.createAndPublishQuest(payload, hirerId, at(now)),
    subscribe: (listener) => {
      listeners.add(listener);
      startRefresh();
      return () => {
        listeners.delete(listener);
        stopRefresh();
      };
    },
    reset: () => {
      currentNow = new Date(adapter.now.getTime());
      adapter.reset();
    },
    joinDirect: (questId, workerId, now) => adapter.joinDirect(questId, workerId, at(now)),
    applyCandidate: (questId, workerId, now) => adapter.applyCandidate(questId, workerId, at(now)),
    withdrawApplication: (questId, applicationId, workerId, now) => adapter.withdrawApplication(questId, applicationId, workerId, at(now)),
    createTeam: (questId, leaderId, nameOrNow, now) => adapter.createTeam(questId, leaderId, nameOrNow, at(now)),
    inviteWorker: (questId, workerId, leaderId, now) => adapter.inviteWorker(questId, workerId, leaderId, at(now)),
    revokeInvitation: (questId, invitationId, leaderId, now) => adapter.revokeInvitation(questId, invitationId, leaderId, at(now)),
    respondToInvitation: (questId, invitationId, workerId, accept, now) => adapter.respondToInvitation(questId, invitationId, workerId, accept, at(now)),
    submitTeam: (questId, leaderId, now) => adapter.submitTeam(questId, leaderId, at(now)),
    selectCandidate: (questId, applicationId, hirerId, now) => adapter.selectCandidate(questId, applicationId, hirerId, at(now)),
    rejectCandidate: (questId, applicationId, hirerId, now) => adapter.rejectCandidate(questId, applicationId, hirerId, at(now)),
    rejectTeam: (questId, teamId, hirerId, now) => adapter.rejectTeam(questId, teamId, hirerId, at(now)),
    selectTeam: (questId, teamId, hirerId, now) => adapter.selectTeam(questId, teamId, hirerId, at(now)),
    requestEdit: (questId, changes, hirerId, now) => adapter.requestEdit(questId, changes, hirerId, at(now)),
    voteEditConsent: (questId, workerId, approve, now) => adapter.voteEditConsent(questId, workerId, approve, at(now)),
    votePartialStartConsent: (questId, voterId, approve, now) => adapter.votePartialStartConsent(questId, voterId, approve, at(now)),
    submitProof: (questId, ownerId, imageUris, note, now) => adapter.submitProof(questId, ownerId, imageUris, note, at(now)),
    reviewProof: (questId, proofId, approve, reason, hirerId, now) => adapter.reviewProof(questId, proofId, approve, reason, hirerId, at(now)),
    submitRework: (questId, proofId, ownerId, imageUris, note, now) => adapter.submitRework(questId, proofId, ownerId, imageUris, note, at(now)),
    confirmCompletion: (questId, workerId, now) => adapter.confirmCompletion(questId, workerId, at(now)),
    completeQuest: (questId, hirerId, now) => adapter.completeQuest(questId, hirerId, at(now)),
    openDispute: (questId, actorId, now) => adapter.openDispute(questId, actorId, at(now)),
    resolveDispute: (questId, actorId, now) => adapter.resolveDispute(questId, actorId, at(now)),
    cancelQuest: (questId, actorId, now) => adapter.cancelQuest(questId, actorId, at(now)),
    publishQuest: (questId, hirerId, now) => adapter.publishQuest(questId, hirerId, at(now)),
  };
}

export const questWorkflow = createQuestWorkflow();
