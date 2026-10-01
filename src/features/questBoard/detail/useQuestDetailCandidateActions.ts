import { useCallback } from "react";

import { showConfirmModal } from "@/components/ui/SweetAlert";
import { useCandidateSelection } from "@/features/questBoard/useCandidateSelection";
import { groupQuestMessages } from "@/locales/groupQuestMessages";
import { questBoardMessages } from "@/locales/questBoardMessages";

import { QuestParticipation } from "../domain/types";

import type {
  QuestDetailLiveActions,
  QuestDetailPreviewActions,
} from "./questDetailActions";
import type { QuestDetailNavigation } from "./useQuestDetailNavigation";
import type { QuestDetailPresentationFacts } from "./questDetailPresentation";
import type { QuestDetailSurfaceTransitions } from "./useQuestDetailSurfaceState";

export interface QuestDetailCandidateHandlers {
  selectCandidate: (proposalId: string) => void;
  rejectCandidate: (proposalId: string) => void;
}

export function useQuestDetailCandidateActions({
  facts,
  liveActions,
  previewActions,
  navigation,
  transitions,
}: {
  facts: QuestDetailPresentationFacts | null;
  liveActions: QuestDetailLiveActions;
  previewActions: QuestDetailPreviewActions;
  navigation: QuestDetailNavigation;
  transitions: QuestDetailSurfaceTransitions;
}): QuestDetailCandidateHandlers {
  const { confirmSelection } = useCandidateSelection({
    questId:
      facts?.source.kind === "live-snapshot" ? facts.quest.id : undefined,
    messages: facts?.messages ?? questBoardMessages.en,
    groupMessages: facts?.groupMessages ?? groupQuestMessages.en,
    onSelect: ({ proposalId }) => liveActions.selectProposal(proposalId),
    onSuccess: () => {
      transitions.closeCandidateReview();
      navigation.openManage();
    },
    onError: () => undefined,
    isSuccessful: (result) => result !== undefined,
  });

  const selectCandidate = useCallback(
    (proposalId: string) => {
      if (!facts) return;
      if (facts.source.kind === "live-snapshot") {
        confirmSelection({
          proposalId,
          kind:
            facts.liveSnapshot?.participation === QuestParticipation.GROUP
              ? "team"
              : "application",
        });
        return;
      }
      previewActions.selectProposal(proposalId);
    },
    [facts, previewActions, confirmSelection]
  );

  const rejectCandidate = useCallback(
    (proposalId: string) => {
      if (!facts) return;
      const proposalType =
        facts.source.kind === "live-snapshot"
          ? facts.liveSnapshot?.participation === "GROUP"
            ? facts.groupMessages.teamProposal
            : facts.groupMessages.individualProposal
          : facts.candidateGroup
            ? facts.groupMessages.teamProposal
            : facts.groupMessages.individualProposal;
      showConfirmModal({
        title: facts.groupMessages.reject,
        message: `${facts.quest.title}\n${proposalType}`,
        confirmLabel: facts.groupMessages.reject,
        cancelLabel: facts.groupMessages.cancel,
        onConfirm: () => {
          if (facts.source.kind === "live-snapshot") {
            void liveActions.rejectProposal(proposalId).then((result) => {
              if (result === undefined) return;
              transitions.selectProposal(null);
            });
            return;
          }
          previewActions.rejectProposal(proposalId);
        },
      });
    },
    [facts, liveActions, previewActions, transitions]
  );

  return { selectCandidate, rejectCandidate };
}
