import { useCallback, useReducer } from "react";

import type { QuestJoinStatus } from "./questDetailRoute";

export interface QuestDetailSurfaceState {
  liveAction: string | null;
  localJoinedStatus?: QuestJoinStatus;
  leftQuest: boolean;
  manualConfirmationOpen: boolean;
  dismissedIntent?: string;
  candidateReviewSheetOpen: boolean;
  partialStartSheetDismissed: boolean;
  teamSearchQuery: string;
  teamSelectedMemberIds: string[];
  teamReviewing: boolean;
  selectedProposalId: string | null;
  fixtureRevision: number;
}

type SurfaceAction =
  | { type: "begin-live-action"; name: string }
  | { type: "end-live-action" }
  | { type: "mark-joined"; status: QuestJoinStatus }
  | { type: "mark-left" }
  | { type: "open-confirmation" }
  | { type: "close-confirmation" }
  | { type: "dismiss-intent"; key: string }
  | { type: "open-candidate-review" }
  | { type: "close-candidate-review" }
  | { type: "dismiss-partial-consent" }
  | { type: "reopen-partial-consent" }
  | { type: "set-team-search"; value: string }
  | { type: "set-team-selection"; value: string[] }
  | { type: "set-team-reviewing"; value: boolean }
  | { type: "select-proposal"; value: string | null }
  | { type: "fixture-changed" };

const initialState: QuestDetailSurfaceState = {
  liveAction: null,
  localJoinedStatus: undefined,
  leftQuest: false,
  manualConfirmationOpen: false,
  dismissedIntent: undefined,
  candidateReviewSheetOpen: false,
  partialStartSheetDismissed: false,
  teamSearchQuery: "",
  teamSelectedMemberIds: [],
  teamReviewing: false,
  selectedProposalId: null,
  fixtureRevision: 0,
};

function reduceSurfaceState(
  state: QuestDetailSurfaceState,
  action: SurfaceAction
): QuestDetailSurfaceState {
  switch (action.type) {
    case "begin-live-action":
      return state.liveAction ? state : { ...state, liveAction: action.name };
    case "end-live-action":
      return { ...state, liveAction: null };
    case "mark-joined":
      return { ...state, localJoinedStatus: action.status };
    case "mark-left":
      return { ...state, leftQuest: true };
    case "open-confirmation":
      return { ...state, manualConfirmationOpen: true };
    case "close-confirmation":
      return { ...state, manualConfirmationOpen: false };
    case "dismiss-intent":
      return { ...state, dismissedIntent: action.key };
    case "open-candidate-review":
      return {
        ...state,
        candidateReviewSheetOpen: true,
        selectedProposalId: null,
      };
    case "close-candidate-review":
      return {
        ...state,
        candidateReviewSheetOpen: false,
        selectedProposalId: null,
      };
    case "dismiss-partial-consent":
      return { ...state, partialStartSheetDismissed: true };
    case "reopen-partial-consent":
      return { ...state, partialStartSheetDismissed: false };
    case "set-team-search":
      return { ...state, teamSearchQuery: action.value };
    case "set-team-selection":
      return { ...state, teamSelectedMemberIds: action.value };
    case "set-team-reviewing":
      return { ...state, teamReviewing: action.value };
    case "select-proposal":
      return { ...state, selectedProposalId: action.value };
    case "fixture-changed":
      return { ...state, fixtureRevision: state.fixtureRevision + 1 };
  }
}

export interface QuestDetailSurfaceTransitions {
  beginLiveAction: (name: string) => boolean;
  endLiveAction: () => void;
  markJoined: (status: QuestJoinStatus) => void;
  markLeft: () => void;
  openConfirmation: () => void;
  closeConfirmation: () => void;
  dismissIntent: (key: string) => void;
  openCandidateReview: () => void;
  closeCandidateReview: () => void;
  dismissPartialConsent: () => void;
  reopenPartialConsent: () => void;
  setTeamSearchQuery: (value: string) => void;
  setTeamSelectedMemberIds: (value: string[]) => void;
  setTeamReviewing: (value: boolean) => void;
  selectProposal: (value: string | null) => void;
  markFixtureChanged: () => void;
}

export function useQuestDetailSurfaceState(): {
  state: QuestDetailSurfaceState;
  transitions: QuestDetailSurfaceTransitions;
} {
  const [state, dispatch] = useReducer(reduceSurfaceState, initialState);

  const beginLiveAction = useCallback(
    (name: string): boolean => {
      if (state.liveAction) return false;
      dispatch({ type: "begin-live-action", name });
      return true;
    },
    [state.liveAction]
  );
  const endLiveAction = useCallback(
    () => dispatch({ type: "end-live-action" }),
    []
  );
  const markJoined = useCallback(
    (status: QuestJoinStatus) => dispatch({ type: "mark-joined", status }),
    []
  );
  const markLeft = useCallback(() => dispatch({ type: "mark-left" }), []);
  const openConfirmation = useCallback(
    () => dispatch({ type: "open-confirmation" }),
    []
  );
  const closeConfirmation = useCallback(
    () => dispatch({ type: "close-confirmation" }),
    []
  );
  const dismissIntent = useCallback(
    (key: string) => dispatch({ type: "dismiss-intent", key }),
    []
  );
  const openCandidateReview = useCallback(
    () => dispatch({ type: "open-candidate-review" }),
    []
  );
  const closeCandidateReview = useCallback(
    () => dispatch({ type: "close-candidate-review" }),
    []
  );
  const dismissPartialConsent = useCallback(
    () => dispatch({ type: "dismiss-partial-consent" }),
    []
  );
  const reopenPartialConsent = useCallback(
    () => dispatch({ type: "reopen-partial-consent" }),
    []
  );
  const setTeamSearchQuery = useCallback(
    (value: string) => dispatch({ type: "set-team-search", value }),
    []
  );
  const setTeamSelectedMemberIds = useCallback(
    (value: string[]) => dispatch({ type: "set-team-selection", value }),
    []
  );
  const setTeamReviewing = useCallback(
    (value: boolean) => dispatch({ type: "set-team-reviewing", value }),
    []
  );
  const selectProposal = useCallback(
    (value: string | null) => dispatch({ type: "select-proposal", value }),
    []
  );
  const markFixtureChanged = useCallback(
    () => dispatch({ type: "fixture-changed" }),
    []
  );

  return {
    state,
    transitions: {
      beginLiveAction,
      endLiveAction,
      markJoined,
      markLeft,
      openConfirmation,
      closeConfirmation,
      dismissIntent,
      openCandidateReview,
      closeCandidateReview,
      dismissPartialConsent,
      reopenPartialConsent,
      setTeamSearchQuery,
      setTeamSelectedMemberIds,
      setTeamReviewing,
      selectProposal,
      markFixtureChanged,
    },
  };
}
