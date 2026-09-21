import { useCallback } from "react";
import { AccessibilityInfo, Alert } from "react-native";

import type {
  QuestDetailLiveActions,
  QuestDetailPreviewActions,
} from "./questDetailActions";
import type { QuestDetailNavigation } from "./useQuestDetailNavigation";
import type { QuestDetailPresentationFacts } from "./questDetailPresentation";
import type { QuestDetailSurfaceTransitions } from "./useQuestDetailSurfaceState";

export interface QuestDetailParticipationHandlers {
  confirmApplication: () => Promise<void>;
  leaveQuest: () => void;
}

export function useQuestDetailParticipation({
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
}): QuestDetailParticipationHandlers {
  const confirmApplication = useCallback(async () => {
    if (!facts || !facts.canApply) return;
    if (facts.firstCome && facts.source.kind !== "preview") {
      const result = await liveActions.join();
      if (result === undefined) return;
      transitions.markJoined("accepted");
      transitions.closeConfirmation();
      navigation.openWorkHub();
      Alert.alert(
        facts.messages.confirmParticipationTitle,
        facts.messages.participationConfirmed
      );
      return;
    }
    if (
      facts.source.kind !== "preview" &&
      facts.projection?.capabilities.canApply
    ) {
      const result = await liveActions.apply();
      if (result === undefined) return;
      transitions.closeConfirmation();
      transitions.dismissIntent(facts.routeIntentKey);
      return;
    }
    const result = facts.firstCome
      ? previewActions.directJoin()
      : previewActions.apply();
    if (!result.ok) return;
    transitions.closeConfirmation();
    transitions.dismissIntent(facts.routeIntentKey);
  }, [facts, liveActions, navigation, previewActions, transitions]);

  const leaveQuest = useCallback(() => {
    if (!facts || !facts.canShowWithdraw) return;
    const label = facts.messages.withdrawApplication;
    Alert.alert(label, facts.messages.withdrawApplicationDescription, [
      { text: facts.messages.cancel, style: "cancel" },
      {
        text: label,
        style: "destructive",
        onPress: () => {
          void (async () => {
            const liveApplication = facts.liveSnapshot?.application;
            if (
              facts.source.kind !== "preview" &&
              facts.projection?.capabilities.canWithdrawApplication &&
              liveApplication
            ) {
              const result = await liveActions.withdraw(liveApplication.id);
              if (result === undefined) return;
            } else if (facts.source.kind === "preview") {
              const result = previewActions.withdraw();
              if (!result.ok) return;
            } else {
              return;
            }
            transitions.markLeft();
            AccessibilityInfo.announceForAccessibility(
              facts.messages.leftQuest
            );
          })();
        },
      },
    ]);
  }, [facts, liveActions, previewActions, transitions]);

  return { confirmApplication, leaveQuest };
}
