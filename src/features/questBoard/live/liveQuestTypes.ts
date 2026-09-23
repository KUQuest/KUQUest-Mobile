import type { RequestOptions } from "@/api/WalletApi";
import type {
  QuestV2Application,
  QuestV2Assignment,
  QuestV2Detail,
  QuestV2PublicDetail,
  QuestV2Mode,
  QuestV2Participation,
  QuestV2ParticipationDetail,
  QuestV2ProofSubmission,
  QuestV2Team,
  QuestV2Underfilled,
  QuestV2EditRequest,
} from "@/api/questV2Contracts";
import type { ServerChatConversation } from "@/api/ChatApi";
import type { QuestNextAction } from "../domain/types";

export type LiveQuestActor =
  "HIRER" | "PROSPECTIVE_WORKER" | "CANDIDATE" | "WORKER";

/**
 * Server-derived action for the authenticated viewer. The lifecycle worker
 * starts assigned Quests; the client only refreshes this projection.
 * Named values live in the canonical contract (`QuestNextAction` in `../domain/types`).
 */
export type LiveQuestNextAction = QuestNextAction;

export interface LiveQuestCapabilities {
  canJoin: boolean;
  canApply: boolean;
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
  canRequestEdit: boolean;
  canRespondToEdit: boolean;
  canReadWorkChat: boolean;
  canWriteWorkChat: boolean;
  canSubmitProof: boolean;
  canConfirmCompletion: boolean;
  canCancel: boolean;
  canReviewProof: boolean;
  canCreateReview: boolean;
  canUpdateReview: boolean;
}

export type LiveQuestAssignment = Omit<
  QuestV2Assignment,
  "id" | "createdAt"
> & {
  id?: string;
  createdAt?: string;
};
export interface LiveQuestParticipant {
  id: string;
  displayName: string;
  avatarUrl?: string;
  avatarFileId?: string;
}

export interface LiveQuestSnapshot {
  viewerId: string;
  actor: LiveQuestActor;
  quest: QuestV2Detail | QuestV2PublicDetail | QuestV2ParticipationDetail;
  state: QuestV2Detail["state"];
  mode: QuestV2Mode;
  participation: QuestV2Participation;
  assignment: LiveQuestAssignment | null;
  assignments: LiveQuestAssignment[];
  participants?: LiveQuestParticipant[];
  application: QuestV2Application | null;
  applications: QuestV2Application[];
  team: QuestV2Team | null;
  teams: QuestV2Team[];
  underfilled: QuestV2Underfilled | null;
  editRequest: QuestV2EditRequest | null;
  proofs: QuestV2ProofSubmission[];
  workConversation: ServerChatConversation | null;
  proofRequired: boolean;
  dueAt: string | null;
  nextAction: LiveQuestNextAction;
  capabilities: LiveQuestCapabilities;
}

export interface LiveQuestSnapshotOptions extends RequestOptions {
  /** Supply the request id when the assigned flow has a pending edit. */
  editRequestId?: string;
}
