import { useState } from "react";
import { Alert } from "react-native";

import { createQuestIdempotencyKey } from "@/api/QuestApi";
import type { QuestV2Application, QuestV2Team } from "@/api/questV2Contracts";
import {
  useRejectApplicationMutation,
  useRejectCandidateTeamMutation,
  useSelectApplicationMutation,
  useSelectCandidateTeamMutation,
} from "@/features/questBoard/api/questBoardQueries";
import type { GroupQuestMessages } from "@/locales/groupQuestMessages";
import type { QuestBoardMessages } from "@/locales/questBoardMessages";

export type RosterActionKind = "select" | "reject";

export interface PendingRosterAction {
  proposalId: string;
  kind: RosterActionKind;
}

export interface SelectRosterActions {
  /** Confirmed select/reject command that is still in flight. */
  pendingAction: PendingRosterAction | null;
  selectApplication: (application: QuestV2Application) => void;
  rejectApplication: (application: QuestV2Application) => void;
  selectTeam: (team: QuestV2Team) => void;
  rejectTeam: (team: QuestV2Team) => void;
}

type RosterCommand = (
  questId: string,
  idempotencyKey: string
) => Promise<unknown>;

export function useSelectRosterActions({
  questId,
  viewerId,
  messages,
  groupMessages,
  onSelectSuccess,
  refetchSnapshot,
}: {
  questId?: string;
  viewerId: string;
  messages: QuestBoardMessages;
  groupMessages: GroupQuestMessages;
  onSelectSuccess: () => void;
  refetchSnapshot: () => Promise<unknown>;
}): SelectRosterActions {
  const selectApplicationMutation = useSelectApplicationMutation();
  const rejectApplicationMutation = useRejectApplicationMutation();
  const selectCandidateTeamMutation = useSelectCandidateTeamMutation();
  const rejectCandidateTeamMutation = useRejectCandidateTeamMutation();
  const [pendingAction, setPendingAction] =
    useState<PendingRosterAction | null>(null);

  async function perform(
    targetQuestId: string,
    action: PendingRosterAction,
    run: RosterCommand
  ) {
    setPendingAction(action);
    try {
      await run(targetQuestId, createQuestIdempotencyKey());
      if (action.kind === "select") onSelectSuccess();
    } catch (caught) {
      Alert.alert(
        messages.actionFailedTitle,
        caught instanceof Error ? caught.message : messages.actionFailedTitle
      );
      if (action.kind === "reject") await refetchSnapshot();
    } finally {
      setPendingAction(null);
    }
  }

  function confirm(
    title: string,
    message: string,
    action: PendingRosterAction,
    run: RosterCommand
  ) {
    if (!questId || pendingAction) return;
    Alert.alert(title, message, [
      { text: groupMessages.cancel, style: "cancel" },
      {
        text:
          action.kind === "select"
            ? groupMessages.selectProposal
            : groupMessages.reject,
        style: action.kind === "reject" ? "destructive" : "default",
        onPress: () => void perform(questId, action, run),
      },
    ]);
  }

  return {
    pendingAction,
    selectApplication: (application) =>
      confirm(
        messages.confirmSelectCandidateTitle,
        messages.confirmSelectCandidateMessage,
        { proposalId: application.id, kind: "select" },
        (targetQuestId, idempotencyKey) =>
          selectApplicationMutation.mutateAsync({
            questId: targetQuestId,
            applicationId: application.id,
            viewerId,
            idempotencyKey,
          })
      ),
    rejectApplication: (application) =>
      confirm(
        messages.confirmRejectCandidateTitle,
        messages.confirmRejectMessage,
        { proposalId: application.id, kind: "reject" },
        (targetQuestId, idempotencyKey) =>
          rejectApplicationMutation.mutateAsync({
            questId: targetQuestId,
            applicationId: application.id,
            viewerId,
            idempotencyKey,
          })
      ),
    selectTeam: (team) =>
      confirm(
        messages.confirmSelectTeamTitle,
        messages.confirmSelectTeamMessage,
        { proposalId: team.id, kind: "select" },
        (targetQuestId, idempotencyKey) =>
          selectCandidateTeamMutation.mutateAsync({
            questId: targetQuestId,
            teamId: team.id,
            viewerId,
            idempotencyKey,
          })
      ),
    rejectTeam: (team) =>
      confirm(
        messages.confirmRejectTeamTitle,
        messages.confirmRejectMessage,
        { proposalId: team.id, kind: "reject" },
        (targetQuestId, idempotencyKey) =>
          rejectCandidateTeamMutation.mutateAsync({
            questId: targetQuestId,
            teamId: team.id,
            viewerId,
            idempotencyKey,
          })
      ),
  };
}
