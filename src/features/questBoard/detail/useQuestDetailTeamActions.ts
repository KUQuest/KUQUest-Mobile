import { useCallback } from "react";

import type {
  QuestDetailLiveActions,
  QuestDetailPreviewActions,
} from "./questDetailActions";
import type { QuestDetailPresentationFacts } from "./questDetailPresentation";
import type { QuestDetailSurfaceTransitions } from "./useQuestDetailSurfaceState";

export interface QuestDetailTeamHandlers {
  openLiveUnderfilled: () => void;
  liveUnderfilledDecision: (decision: "PROCEED" | "CANCEL") => void;
  liveUnderfilledConsent: (decision: "ACCEPT" | "DECLINE") => void;
  liveCreateTeam: () => void;
  liveJoinTeam: (teamId: string, joinCode: string) => void;
  liveLeaveTeam: (teamId: string) => void;
  liveRemoveTeamMember: (teamId: string, memberId: string) => void;
  liveRegenerateTeamCode: (teamId: string) => void;
  liveUpdateTeamName: (teamId: string, name: string) => void;
  liveSubmitTeam: (
    teamId: string,
    payload?: { text?: string; fileIds?: string[] }
  ) => void;
  fixtureCreateTeam: () => void;
  fixtureInviteMembers: (memberIds: string[]) => void;
  fixtureSubmitTeam: (teamId: string) => void;
  fixtureRespondInvitation: (invitationId: string, accept: boolean) => void;
  fixturePartialStartVote: (approve: boolean) => void;
}

export function useQuestDetailTeamActions({
  facts,
  liveActions,
  previewActions,
  transitions,
}: {
  facts: QuestDetailPresentationFacts | null;
  liveActions: QuestDetailLiveActions;
  previewActions: QuestDetailPreviewActions;
  transitions: QuestDetailSurfaceTransitions;
}): QuestDetailTeamHandlers {
  const openLiveUnderfilled = useCallback(() => {
    transitions.reopenPartialConsent();
    if (
      facts?.source.kind !== "live-snapshot" ||
      facts.liveSnapshot?.underfilled
    ) {
      return;
    }
    void liveActions.openUnderfilled();
  }, [facts, liveActions, transitions]);
  const liveUnderfilledDecision = useCallback(
    (decision: "PROCEED" | "CANCEL") => {
      void liveActions.decideUnderfilled(decision);
    },
    [liveActions]
  );
  const liveUnderfilledConsent = useCallback(
    (decision: "ACCEPT" | "DECLINE") => {
      void liveActions.respondUnderfilled(decision);
    },
    [liveActions]
  );
  const liveCreateTeam = useCallback(() => {
    void liveActions.createTeam();
  }, [liveActions]);
  const liveJoinTeam = useCallback(
    (teamId: string, joinCode: string) => {
      void liveActions.joinTeam(teamId, joinCode);
    },
    [liveActions]
  );
  const liveLeaveTeam = useCallback(
    (teamId: string) => {
      void liveActions.leaveTeam(teamId);
    },
    [liveActions]
  );
  const liveRemoveTeamMember = useCallback(
    (teamId: string, memberId: string) => {
      void liveActions.removeTeamMember(teamId, memberId);
    },
    [liveActions]
  );
  const liveRegenerateTeamCode = useCallback(
    (teamId: string) => {
      void liveActions.regenerateTeamCode(teamId);
    },
    [liveActions]
  );
  const liveUpdateTeamName = useCallback(
    (teamId: string, name: string) => {
      void liveActions.updateTeamName(teamId, name);
    },
    [liveActions]
  );
  const liveSubmitTeam = useCallback(
    (teamId: string, payload?: { text?: string; fileIds?: string[] }) => {
      void liveActions.submitTeam(teamId, payload);
    },
    [liveActions]
  );
  const fixtureCreateTeam = useCallback(() => {
    previewActions.createTeam();
  }, [previewActions]);
  const fixtureInviteMembers = useCallback(
    (memberIds: string[]) => {
      previewActions.inviteMembers(memberIds);
    },
    [previewActions]
  );
  const fixtureSubmitTeam = useCallback(
    (teamId: string) => {
      if (!facts?.teamSheetTeam || facts.teamSheetTeam.id !== teamId) return;
      previewActions.submitTeam(teamId);
    },
    [facts, previewActions]
  );
  const fixtureRespondInvitation = useCallback(
    (invitationId: string, accept: boolean) => {
      previewActions.respondInvitation(invitationId, accept);
    },
    [previewActions]
  );
  const fixturePartialStartVote = useCallback(
    (approve: boolean) => {
      if (!facts) return;
      if (
        facts.source.kind !== "preview" &&
        facts.projection?.capabilities.canConsentUnderfilled
      ) {
        void liveActions.respondUnderfilled(approve ? "ACCEPT" : "DECLINE");
        return;
      }
      previewActions.votePartialStart(approve);
    },
    [facts, liveActions, previewActions]
  );

  return {
    openLiveUnderfilled,
    liveUnderfilledDecision,
    liveUnderfilledConsent,
    liveCreateTeam,
    liveJoinTeam,
    liveLeaveTeam,
    liveRemoveTeamMember,
    liveRegenerateTeamCode,
    liveUpdateTeamName,
    liveSubmitTeam,
    fixtureCreateTeam,
    fixtureInviteMembers,
    fixtureSubmitTeam,
    fixtureRespondInvitation,
    fixturePartialStartVote,
  };
}
