import { useState } from "react";

import { showConfirmModal, showErrorAlert } from "@/components/ui/SweetAlert";

import { createQuestIdempotencyKey } from "@/api/QuestApi";
import type { QuestV2Application, QuestV2Team } from "@/api/questV2Contracts";
import {
  useRejectApplicationMutation,
  useRejectCandidateTeamMutation,
  useSelectApplicationMutation,
  useSelectCandidateTeamMutation,
} from "@/features/questBoard/api/questBoardQueries";
import { useCandidateSelection } from "@/features/questBoard/useCandidateSelection";
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
  const [pendingReject, setPendingReject] =
    useState<PendingRosterAction | null>(null);
  const selection = useCandidateSelection({
    questId,
    messages,
    groupMessages,
    onSelect: ({ kind, proposalId }) => {
      if (!questId) return Promise.reject(new Error("Quest ID is required"));
      return kind === "application"
        ? selectApplicationMutation.mutateAsync({
            questId,
            applicationId: proposalId,
            viewerId,
            idempotencyKey: createQuestIdempotencyKey(),
          })
        : selectCandidateTeamMutation.mutateAsync({
            questId,
            teamId: proposalId,
            viewerId,
            idempotencyKey: createQuestIdempotencyKey(),
          });
    },
    onSuccess: onSelectSuccess,
  });

  async function perform(action: PendingRosterAction, run: RosterCommand) {
    if (!questId) return;
    setPendingReject(action);
    try {
      await run(questId, createQuestIdempotencyKey());
    } catch (caught) {
      showErrorAlert(messages.actionFailedTitle, caught);
      await refetchSnapshot();
    } finally {
      setPendingReject(null);
    }
  }

  function confirmReject(
    title: string,
    message: string,
    action: PendingRosterAction,
    run: RosterCommand
  ) {
    if (!questId || pendingReject || selection.pending) return;
    showConfirmModal({
      title,
      message,
      confirmLabel: groupMessages.reject,
      cancelLabel: groupMessages.cancel,
      onConfirm: () => void perform(action, run),
    });
  }

  const pendingAction: PendingRosterAction | null = selection.pending
    ? { proposalId: selection.pending.proposalId, kind: "select" }
    : pendingReject;

  return {
    pendingAction,
    selectApplication: (application) =>
      selection.confirmSelection({
        proposalId: application.id,
        kind: "application",
      }),
    rejectApplication: (application) =>
      confirmReject(
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
      selection.confirmSelection({ proposalId: team.id, kind: "team" }),
    rejectTeam: (team) =>
      confirmReject(
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
