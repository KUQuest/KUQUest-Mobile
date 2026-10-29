import type { UploadAsset } from "@/api/fileUpload";
import type { QuestBoardMessages } from "@/locales/questBoardMessages";
import type { QuestDetailProjectionCapabilities } from "./questDetailProjection";
import type { LiveQuestSnapshot } from "../live/liveQuestService";
import type { QuestBoardQuest } from "../domain/types";
import type { QuestDetailSurfaceTransitions } from "./useQuestDetailSurfaceState";
export interface QuestDetailLiveActionContext {
  questId?: string;
  viewerId: string;
  quest: QuestBoardQuest | null;
  messages: QuestBoardMessages;
  transitions: QuestDetailSurfaceTransitions;
  projectionCapabilities?: QuestDetailProjectionCapabilities;
  liveSnapshot: LiveQuestSnapshot | null;
}

export function getQuestDetailLiveTeam(
  snapshot: LiveQuestSnapshot | null
): NonNullable<LiveQuestSnapshot["team"]> | null {
  return snapshot?.team ?? null;
}

export interface QuestDetailLiveActions {
  join: () => Promise<unknown>;
  apply: () => Promise<unknown>;
  withdraw: (applicationId: string) => Promise<unknown>;
  createCandidateInquiry: (questId: string) => Promise<{ id: string }>;
  selectProposal: (proposalId: string) => Promise<unknown>;
  rejectProposal: (proposalId: string) => Promise<unknown>;
  decideUnderfilled: (decision: "PROCEED" | "CANCEL") => Promise<unknown>;
  respondUnderfilled: (decision: "ACCEPT" | "DECLINE") => Promise<unknown>;
  createTeam: (name: string) => Promise<unknown>;
  joinTeam: (teamId: string, joinCode: string) => Promise<unknown>;
  leaveTeam: (teamId: string) => Promise<unknown>;
  removeTeamMember: (teamId: string, memberId: string) => Promise<unknown>;
  regenerateTeamCode: (teamId: string) => Promise<unknown>;
  updateTeamName: (teamId: string, name: string) => Promise<unknown>;
  submitTeam: (
    teamId: string,
    payload?: { text?: string; fileIds?: string[] }
  ) => Promise<unknown>;
  uploadTeamFile: (asset: UploadAsset) => Promise<{
    id: string;
    name: string;
    sizeBytes?: number;
  }>;
}
