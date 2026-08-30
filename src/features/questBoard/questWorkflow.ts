import type { ChatConversation, ChatMessage } from '../chat/chatTypes';
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
  QuestPublishCheck,
  QuestSettlementSummary,
  WorkConversationCapability,
} from './types';

export function getQuestRewardSatang(quest: QuestBoardQuest): number {
  return quest.rewardSatang ?? Math.round(quest.rewardPerPerson * 100);
}

export interface QuestWorkflow {
  getQuestBoardModel(viewerId?: string, now?: Date): QuestBoardQuest[];
  getQuestBoardQuest(questId: string, viewerId?: string, now?: Date): QuestBoardQuest | null;
  getQuestDetailState(questId: string, viewerId?: string, now?: Date): QuestDetailState | null;
  getMyQuestsModel(viewerId?: string, now?: Date): QuestDetailState[];
  getPublishCheck(questId: string, now?: Date): QuestPublishCheck | null;
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

export function createQuestWorkflow(adapter: QuestFixtureAdapter = questFixtureAdapter): QuestWorkflow {
  return {
    getQuestBoardModel: (viewerId = DEFAULT_PROTOTYPE_VIEWER_ID, now) => adapter.listBoardQuests(viewerId, now),
    getQuestBoardQuest: (questId, viewerId = DEFAULT_PROTOTYPE_VIEWER_ID, now) => {
      const boardQuest = adapter.listBoardQuests(viewerId, now).find((quest) => quest.id === questId);
      if (boardQuest) return boardQuest;
      const state = adapter.getQuestDetail(questId, viewerId, now);
      return state ? toBoardQuest(state) : null;
    },
    getQuestDetailState: (questId, viewerId = DEFAULT_PROTOTYPE_VIEWER_ID, now) => adapter.getQuestDetail(questId, viewerId, now),
    getMyQuestsModel: (viewerId = DEFAULT_PROTOTYPE_VIEWER_ID, now) => adapter.listStates(viewerId, now),
    getPublishCheck: (questId, now) => adapter.getPublishCheck(questId, now),
    getEscrowSummary: (rewardSatang, headcount) => adapter.getEscrowSummary(rewardSatang, headcount),
    getSettlement: (questId, now) => adapter.getSettlement(questId, now),
    getConversationCapability: (questId, viewerId, now) => adapter.getConversationCapability(questId, viewerId, now),
    listConversations: (viewerId, now) => adapter.listConversations(viewerId, now),
    getConversation: (conversationId, viewerId, now) => adapter.getConversation(conversationId, viewerId, now),
    getConversationMessages: (conversationId, viewerId, now) => adapter.getConversationMessages(conversationId, viewerId, now),
    sendMessage: (conversationId, senderId, body, now) => adapter.sendMessage(conversationId, senderId, body, now),
    markConversationRead: (conversationId, viewerId, now) => adapter.markConversationRead(conversationId, viewerId, now),
    searchMembers: (questId, query, leaderId, now) => adapter.searchMembers(questId, query, leaderId, now),
    createAndPublishQuest: (payload, hirerId, now) => adapter.createAndPublishQuest(payload, hirerId, now),
    subscribe: (listener) => adapter.subscribe(listener),
    reset: () => adapter.reset(),
    joinDirect: (questId, workerId, now) => adapter.joinDirect(questId, workerId, now),
    applyCandidate: (questId, workerId, now) => adapter.applyCandidate(questId, workerId, now),
    withdrawApplication: (questId, applicationId, workerId, now) => adapter.withdrawApplication(questId, applicationId, workerId, now),
    createTeam: (questId, leaderId, nameOrNow, now) => adapter.createTeam(questId, leaderId, nameOrNow, now),
    inviteWorker: (questId, workerId, leaderId, now) => adapter.inviteWorker(questId, workerId, leaderId, now),
    revokeInvitation: (questId, invitationId, leaderId, now) => adapter.revokeInvitation(questId, invitationId, leaderId, now),
    respondToInvitation: (questId, invitationId, workerId, accept, now) => adapter.respondToInvitation(questId, invitationId, workerId, accept, now),
    submitTeam: (questId, leaderId, now) => adapter.submitTeam(questId, leaderId, now),
    selectCandidate: (questId, applicationId, hirerId, now) => adapter.selectCandidate(questId, applicationId, hirerId, now),
    rejectCandidate: (questId, applicationId, hirerId, now) => adapter.rejectCandidate(questId, applicationId, hirerId, now),
    rejectTeam: (questId, teamId, hirerId, now) => adapter.rejectTeam(questId, teamId, hirerId, now),
    selectTeam: (questId, teamId, hirerId, now) => adapter.selectTeam(questId, teamId, hirerId, now),
    requestEdit: (questId, changes, hirerId, now) => adapter.requestEdit(questId, changes, hirerId, now),
    voteEditConsent: (questId, workerId, approve, now) => adapter.voteEditConsent(questId, workerId, approve, now),
    votePartialStartConsent: (questId, voterId, approve, now) => adapter.votePartialStartConsent(questId, voterId, approve, now),
    submitProof: (questId, ownerId, imageUris, note, now) => adapter.submitProof(questId, ownerId, imageUris, note, now),
    reviewProof: (questId, proofId, approve, reason, hirerId, now) => adapter.reviewProof(questId, proofId, approve, reason, hirerId, now),
    submitRework: (questId, proofId, ownerId, imageUris, note, now) => adapter.submitRework(questId, proofId, ownerId, imageUris, note, now),
    confirmCompletion: (questId, workerId, now) => adapter.confirmCompletion(questId, workerId, now),
    completeQuest: (questId, hirerId, now) => adapter.completeQuest(questId, hirerId, now),
    openDispute: (questId, actorId, now) => adapter.openDispute(questId, actorId, now),
    resolveDispute: (questId, actorId, now) => adapter.resolveDispute(questId, actorId, now),
    cancelQuest: (questId, actorId, now) => adapter.cancelQuest(questId, actorId, now),
    publishQuest: (questId, hirerId, now) => adapter.publishQuest(questId, hirerId, now),
  };
}

export const questWorkflow = createQuestWorkflow();
