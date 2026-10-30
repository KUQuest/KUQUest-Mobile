import { useCallback } from "react";
import { AccessibilityInfo } from "react-native";

import {
  showConfirmModal,
  showSweetAlert,
  SweetAlertVariant,
} from "@/components/ui/SweetAlert";

import type { QuestDetailLiveActions } from "./questDetailActions";
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
  navigation,
  transitions,
}: {
  facts: QuestDetailPresentationFacts | null;
  liveActions: QuestDetailLiveActions;
  navigation: QuestDetailNavigation;
  transitions: QuestDetailSurfaceTransitions;
}): QuestDetailParticipationHandlers {
  const confirmApplication = useCallback(async () => {
    if (!facts || !facts.canApply) return;
    if (facts.firstCome) {
      const result = await liveActions.join();
      if (result === undefined) return;
      transitions.markJoined("accepted");
      transitions.closeConfirmation();
      if (facts.groupFcfs) {
        showSweetAlert({
          title: facts.messages.groupFcfsYouAreIn,
          message: facts.messages.groupFcfsConfirmedSpot,
          variant: SweetAlertVariant.Success,
        });
        return;
      }
      navigation.openWorkHub();
      showSweetAlert({
        title: facts.messages.confirmParticipationTitle,
        message: facts.messages.participationConfirmed,
        variant: SweetAlertVariant.Success,
      });
      return;
    }
    if (facts.projection?.capabilities.canApply) {
      const result = await liveActions.apply();
      if (result === undefined) return;
      transitions.closeConfirmation();
      transitions.dismissIntent(facts.routeIntentKey);
    }
  }, [facts, liveActions, navigation, transitions]);

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
            !facts.projection?.capabilities.canWithdrawApplication ||
            !liveApplication
          ) {
            return;
          }
          const result = await liveActions.withdraw(liveApplication.id);
          if (result === undefined) return;
          transitions.markLeft();
          AccessibilityInfo.announceForAccessibility(facts.messages.leftQuest);
        })();
      },
    });
  }, [facts, liveActions, transitions]);

  return { confirmApplication, leaveQuest };
}
