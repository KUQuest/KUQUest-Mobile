import { useCallback } from "react";
import { Alert } from "react-native";

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
  const selectCandidate = useCallback(
    (proposalId: string) => {
      if (!facts) return;
      if (facts.source.kind === "live-snapshot") {
        void liveActions.selectProposal(proposalId).then((result) => {
          if (result === undefined) return;
          transitions.closeCandidateReview();
          navigation.openWorkHub();
        });
        return;
      }
      previewActions.selectProposal(proposalId);
    },
    [facts, liveActions, navigation, previewActions, transitions]
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
      Alert.alert(
        facts.groupMessages.reject,
        `${facts.quest.title}\n${proposalType}`,
        [
          { text: facts.groupMessages.cancel, style: "cancel" },
          {
            text: facts.groupMessages.reject,
            style: "destructive",
            onPress: () => {
              if (facts.source.kind === "live-snapshot") {
                void liveActions.rejectProposal(proposalId).then((result) => {
                  if (result === undefined) return;
                  transitions.selectProposal(null);
                });
                return;
              }
              previewActions.rejectProposal(proposalId);
            },
          },
        ]
      );
    },
    [facts, liveActions, previewActions, transitions]
  );

  return { selectCandidate, rejectCandidate };
}
