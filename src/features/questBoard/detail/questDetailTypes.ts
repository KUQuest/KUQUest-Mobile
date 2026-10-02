import type { LiveQuestSnapshot } from "../live/liveQuestTypes";
import type {
  QuestBoardQuest,
  QuestDetailState,
  QuestAvailability,
  QuestSettlementSummary,
  WorkConversationCapability,
} from "../domain/types";

export type QuestDetailProjectionSource = LiveQuestSnapshot | QuestDetailState;
export type QuestDetailApplicationStatus = "none" | "pending" | "accepted";
export type QuestDetailJoinStatus = "pending" | "accepted" | "history";

export interface QuestDetailProjectionCapabilities {
  canApply: boolean;
  canJoin: boolean;
  canWithdrawApplication: boolean;
  canCreateTeam: boolean;
  canInviteWorker: boolean;
  canRespondInvitation: boolean;
  canJoinTeam: boolean;
  canUpdateTeam: boolean;
  canLeaveTeam: boolean;
  canRemoveTeamMember: boolean;
  canRegenerateTeamCode: boolean;
  canSubmitTeam: boolean;
  canSelectCandidate: boolean;
  canSelectTeam: boolean;
  canRejectCandidate: boolean;
  canRejectTeam: boolean;
  canDecideUnderfilled: boolean;
  canConsentUnderfilled: boolean;
  canRespondPartialStart: boolean;
  canMessageOwner: boolean;
}

export interface QuestDetailProjection {
  /** Fixture state remains available for Prototype Fixture action surfaces. */
  state: QuestDetailState | null;
  quest: QuestBoardQuest;
  lifecycleState: string;
  availability: QuestAvailability;
  applicationStatus: QuestDetailApplicationStatus;
  joinStatus?: QuestDetailJoinStatus;
  isOwner: boolean;
  isAssigned: boolean;
  hasPendingApplication: boolean;
  partialStartPending: boolean;
  settlement: QuestSettlementSummary | null;
  conversationCapability: WorkConversationCapability;
  participants: readonly {
    id: string;
    displayName: string;
    avatarUrl?: string;
    avatarFileId?: string;
  }[];
  participantCount: number;
  capabilities: QuestDetailProjectionCapabilities;
}
