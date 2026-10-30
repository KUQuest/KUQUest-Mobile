import { useCallback } from "react";

import type { QuestDetailLiveActions } from "./questDetailActions";
import {
  QuestUnderfilledConsentDecision,
  QuestUnderfilledDecision,
} from "../domain/types";

export interface QuestDetailTeamHandlers {
  liveUnderfilledDecision: (decision: QuestUnderfilledDecision) => void;
  liveUnderfilledConsent: (decision: QuestUnderfilledConsentDecision) => void;
  liveCreateTeam: (name: string) => void;
  liveJoinTeam: (teamId: string, joinCode: string) => void;
  liveLeaveTeam: (teamId: string) => void;
  liveRemoveTeamMember: (teamId: string, memberId: string) => void;
  liveRegenerateTeamCode: (teamId: string) => void;
  liveUpdateTeamName: (teamId: string, name: string) => void;
  liveSubmitTeam: (
    teamId: string,
    payload?: { text?: string; fileIds?: string[] }
  ) => void;
}

export function useQuestDetailTeamActions({
  liveActions,
}: {
  liveActions: QuestDetailLiveActions;
}): QuestDetailTeamHandlers {
  const liveUnderfilledDecision = useCallback(
    (decision: QuestUnderfilledDecision) => {
      void liveActions.decideUnderfilled(decision);
    },
    [liveActions]
  );
  const liveUnderfilledConsent = useCallback(
    (decision: QuestUnderfilledConsentDecision) => {
      void liveActions.respondUnderfilled(decision);
    },
    [liveActions]
  );
  const liveCreateTeam = useCallback(
    (name: string) => {
      void liveActions.createTeam(name);
    },
    [liveActions]
  );
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

  return {
    liveUnderfilledDecision,
    liveUnderfilledConsent,
    liveCreateTeam,
    liveJoinTeam,
    liveLeaveTeam,
    liveRemoveTeamMember,
    liveRegenerateTeamCode,
    liveUpdateTeamName,
    liveSubmitTeam,
  };
}
