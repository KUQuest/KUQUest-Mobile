import { useCallback } from "react";

import { showErrorAlert } from "@/components/ui/SweetAlert";

import type { TeamDirectoryMember } from "../teamAssemble/types";
import type { QuestDetailState } from "../domain/types";
import {
  QuestInvitationStatus,
  QuestParticipation,
  QuestTeamStatus,
} from "../domain/types";
import type { QuestFixtureAction } from "../fixtures/adapters/questFixtureAdapter";
import {
  questWorkflow,
  type QuestActionResult,
} from "../workflow/questWorkflow";
import type {
  QuestDetailPreviewActionContext,
  QuestDetailPreviewActions,
} from "./questDetailActions";

type PreviewActionContext = QuestDetailPreviewActionContext;

export function getQuestDetailPreviewTeamDirectory({
  state,
  questId,
  query,
  viewerId,
  isHirer,
}: {
  state: QuestDetailState | null;
  questId?: string;
  query: string;
  viewerId: string;
  isHirer: boolean;
}): TeamDirectoryMember[] {
  if (!state || !questId || isHirer) return [];
  const candidateGroup =
    state.quest.candidateMode !== "NO_CANDIDATE" &&
    state.quest.participation === QuestParticipation.GROUP;
  if (!candidateGroup) return [];
  const ownTeam = state.teams.find(
    (team) =>
      team.members.some((member) => member.workerId === viewerId) ||
      team.leaderId === viewerId
  );
  const invitation = state.invitations.find(
    (item) =>
      item.invitedWorkerId === viewerId &&
      item.status === QuestInvitationStatus.INVITATION_PENDING
  );
  const team =
    ownTeam ??
    (invitation
      ? state.teams.find((item) => item.id === invitation.teamId)
      : undefined);
  if (
    !team ||
    team.leaderId !== viewerId ||
    team.status !== QuestTeamStatus.TEAM_FORMING
  ) {
    return [];
  }
  return questWorkflow.searchMembers(questId, query, viewerId);
}

function missingQuestResult(): QuestActionResult {
  return {
    ok: false,
    error: {
      code: "NOT_FOUND",
      message: "Quest not found.",
    },
  };
}

function fixtureErrorMessage(result: QuestActionResult): string | undefined {
  return result.ok ? undefined : result.error.message;
}

export function useQuestDetailPreviewActions(
  context: PreviewActionContext
): QuestDetailPreviewActions {
  const { questId, viewerId, messages, transitions, candidateGroup } = context;
  const runFixtureAction = useCallback(
    (action: QuestFixtureAction): QuestActionResult => {
      const result = questWorkflow.dispatch(action);
      const errorMessage = fixtureErrorMessage(result);
      if (errorMessage) {
        showErrorAlert(messages.actionFailedTitle, errorMessage);
        return result;
      }
      transitions.markFixtureChanged();
      return result;
    },
    [messages.actionFailedTitle, transitions]
  );

  const directJoin = useCallback(() => {
    if (!questId) return missingQuestResult();
    return runFixtureAction({
      type: "DIRECT_JOIN",
      questId,
      workerId: viewerId,
    });
  }, [questId, runFixtureAction, viewerId]);
  const apply = useCallback(() => {
    if (!questId) return missingQuestResult();
    return runFixtureAction({
      type: "APPLY",
      questId,
      workerId: viewerId,
    });
  }, [questId, runFixtureAction, viewerId]);
  const withdraw = useCallback(() => {
    if (!questId) return missingQuestResult();
    return runFixtureAction({
      type: "WITHDRAW_APPLICATION",
      questId,
      workerId: viewerId,
    });
  }, [questId, runFixtureAction, viewerId]);
  const createTeam = useCallback(() => {
    if (!questId) return missingQuestResult();
    return runFixtureAction({
      type: "CREATE_TEAM",
      questId,
      leaderId: viewerId,
    });
  }, [questId, runFixtureAction, viewerId]);
  const inviteMembers = useCallback(
    (memberIds: string[]) => {
      if (!questId) return undefined;
      let result: QuestActionResult | undefined;
      memberIds.forEach((memberId) => {
        result = runFixtureAction({
          type: "INVITE_WORKER",
          questId,
          workerId: memberId,
          leaderId: viewerId,
        });
      });
      return result;
    },
    [questId, runFixtureAction, viewerId]
  );
  const submitTeam = useCallback(
    (teamId: string) => {
      if (!questId || !teamId) return missingQuestResult();
      return runFixtureAction({
        type: "SUBMIT_TEAM",
        questId,
        leaderId: viewerId,
      });
    },
    [questId, runFixtureAction, viewerId]
  );
  const respondInvitation = useCallback(
    (invitationId: string, accept: boolean) => {
      if (!questId) return missingQuestResult();
      return runFixtureAction({
        type: "RESPOND_INVITATION",
        questId,
        invitationId,
        workerId: viewerId,
        accept,
      });
    },
    [questId, runFixtureAction, viewerId]
  );
  const votePartialStart = useCallback(
    (approve: boolean) => {
      if (!questId) return missingQuestResult();
      return runFixtureAction({
        type: "VOTE_PARTIAL_START_CONSENT",
        questId,
        voterId: viewerId,
        approve,
      });
    },
    [questId, runFixtureAction, viewerId]
  );
  const selectProposal = useCallback(
    (proposalId: string) => {
      if (!questId) return missingQuestResult();
      return runFixtureAction({
        type: "SELECT_CANDIDATE",
        questId,
        applicationId: proposalId,
        hirerId: viewerId,
      });
    },
    [questId, runFixtureAction, viewerId]
  );
  const rejectProposal = useCallback(
    (proposalId: string) => {
      if (!questId) return missingQuestResult();
      return runFixtureAction(
        candidateGroup
          ? {
              type: "REJECT_TEAM",
              questId,
              teamId: proposalId,
              hirerId: viewerId,
            }
          : {
              type: "REJECT_CANDIDATE",
              questId,
              applicationId: proposalId,
              hirerId: viewerId,
            }
      );
    },
    [candidateGroup, questId, runFixtureAction, viewerId]
  );
  const searchMembers = useCallback(
    (targetQuestId: string, query: string, leaderId: string) =>
      questWorkflow.searchMembers(targetQuestId, query, leaderId),
    []
  );

  return {
    directJoin,
    apply,
    withdraw,
    createTeam,
    inviteMembers,
    submitTeam,
    respondInvitation,
    votePartialStart,
    selectProposal,
    rejectProposal,
    searchMembers,
  };
}
