import { useCallback } from "react";
import { AccessibilityInfo } from "react-native";

import {
  showConfirmModal,
  showSweetAlert,
  SweetAlertVariant,
} from "@/components/ui/SweetAlert";

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
      showSweetAlert({
        title: facts.messages.confirmParticipationTitle,
        message: facts.messages.participationConfirmed,
        variant: SweetAlertVariant.Success,
      });
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
    showConfirmModal({
      title: label,
      message: facts.messages.withdrawApplicationDescription,
      confirmLabel: label,
      cancelLabel: facts.messages.cancel,
      onConfirm: () => {
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
          AccessibilityInfo.announceForAccessibility(facts.messages.leftQuest);
        })();
      },
    });
  }, [facts, liveActions, previewActions, transitions]);

  return { confirmApplication, leaveQuest };
}
