import type {
  QuestBoardQuest,
  QuestAvailability,
  WorkConversationCapability,
} from "../domain/types";

export type QuestDetailApplicationStatus = "none" | "pending" | "accepted";
export type QuestDetailJoinStatus = "pending" | "accepted" | "history";

export interface QuestDetailProjectionCapabilities {
  canApply: boolean;
  canJoin: boolean;
  canWithdrawApplication: boolean;
  canCreateTeam: boolean;
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
  canRespondToEdit: boolean;
  canMessageOwner: boolean;
}

export interface QuestDetailProjection {
  quest: QuestBoardQuest;
  lifecycleState: string;
  availability: QuestAvailability;
  applicationStatus: QuestDetailApplicationStatus;
  joinStatus?: QuestDetailJoinStatus;
  isOwner: boolean;
  isAssigned: boolean;
  hasPendingApplication: boolean;
  partialStartPending: boolean;
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
