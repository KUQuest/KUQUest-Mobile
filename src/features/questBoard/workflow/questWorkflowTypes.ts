import type { ChatConversation, ChatMessage } from "@/features/chat/chatTypes";
import type { QuestDraft } from "@/features/createQuest/domain/createQuestModel";
import type {
  QuestFixtureAdapter,
  QuestActionResult,
  QuestFixtureAction,
  QuestFixtureResult,
  QuestFixtureValueResult,
  QuestWorkflowAction,
} from "../fixtures/adapters/questFixtureAdapter";
import type {
  LiveQuestSnapshot,
  LiveQuestSnapshotOptions,
} from "../live/liveQuestTypes";
import type {
  QuestBoardQuest,
  QuestDetailState,
  QuestEditConsent,
  QuestPartialStartConsent,
  QuestPublishCheck,
  QuestSettlementSummary,
  WorkConversationCapability,
} from "../domain/types";

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
