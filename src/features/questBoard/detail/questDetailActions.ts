import type { UploadAsset } from "@/api/fileUpload";
import type { QuestBoardMessages } from "@/locales/questBoardMessages";
import type { QuestDetailProjectionCapabilities } from "../questDetailProjection";
import type { LiveQuestSnapshot } from "../liveQuestService";
import type { QuestBoardQuest } from "../types";
import type { QuestActionResult } from "../questFixtureAdapter";
import type { QuestDetailSurfaceTransitions } from "./useQuestDetailSurfaceState";
export interface QuestDetailLiveActionContext {
  questId?: string;
  viewerId: string;
  quest: QuestBoardQuest | null;
  messages: QuestBoardMessages;
  refresh: () => Promise<unknown>;
  transitions: QuestDetailSurfaceTransitions;
  projectionCapabilities?: QuestDetailProjectionCapabilities;
  liveSnapshot: LiveQuestSnapshot | null;
}

export interface QuestDetailPreviewActionContext {
  questId?: string;
  viewerId: string;
  messages: QuestBoardMessages;
  transitions: QuestDetailSurfaceTransitions;
  candidateGroup: boolean;
}
export function getQuestDetailLiveTeam(
  snapshot: LiveQuestSnapshot | null
): NonNullable<LiveQuestSnapshot["team"]> | null {
  return (
    snapshot?.team ??
    snapshot?.teams.find(
      (team) =>
        team.state === "TEAM_FORMING" && team.members.length < team.headcount
    ) ??
    null
  );
}

export interface QuestDetailLiveActions {
  join: () => Promise<unknown>;
  apply: () => Promise<unknown>;
  withdraw: (applicationId: string) => Promise<unknown>;
  createCandidateInquiry: (questId: string) => Promise<{ id: string }>;
  selectProposal: (proposalId: string) => Promise<unknown>;
  rejectProposal: (proposalId: string) => Promise<unknown>;
  openUnderfilled: () => Promise<unknown>;
  decideUnderfilled: (decision: "PROCEED" | "CANCEL") => Promise<unknown>;
  respondUnderfilled: (decision: "ACCEPT" | "DECLINE") => Promise<unknown>;
  createTeam: () => Promise<unknown>;
  joinTeam: (joinCode: string) => Promise<unknown>;
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

export interface QuestDetailPreviewActions {
  directJoin: () => QuestActionResult;
  apply: () => QuestActionResult;
  withdraw: () => QuestActionResult;
  createTeam: () => QuestActionResult;
  inviteMembers: (memberIds: string[]) => QuestActionResult | undefined;
  submitTeam: (teamId: string) => QuestActionResult;
  respondInvitation: (
    invitationId: string,
    accept: boolean
  ) => QuestActionResult;
  votePartialStart: (approve: boolean) => QuestActionResult;
  selectProposal: (proposalId: string) => QuestActionResult;
  rejectProposal: (proposalId: string) => QuestActionResult;
  searchMembers: (
    questId: string,
    query: string,
    leaderId: string
  ) => { id: string; workerId: string; displayName: string }[];
}
