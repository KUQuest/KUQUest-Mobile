import type { PendingRosterAction } from "./useSelectRosterActions";

interface SelectRosterScreenBaseViewModel {
  title: string;
  onBack: () => void;
}

/** One submitted Candidate or Candidate Team proposal awaiting the Hirer. */
export interface RosterProposal {
  id: string;
  /** Applicant, or the Team Leader for a Candidate Team. */
  memberId: string;
  detail: string;
  testID: string;
  onSelect: () => void;
  onReject: () => void;
}

export type RosterSelection =
  | { mode: "automatic"; message: string }
  | {
      mode: "candidate";
      title: string;
      subtitle: string;
      countLabel: string;
      emptyLabel: string;
      proposals: RosterProposal[];
      canSelect: boolean;
      canReject: boolean;
      selectLabel: string;
      rejectLabel: string;
      pendingAction: PendingRosterAction | null;
    };

export type SelectRosterScreenViewModel =
  | (SelectRosterScreenBaseViewModel & {
      status: "loading";
      loadingMessage: string;
    })
  | (SelectRosterScreenBaseViewModel & {
      status: "error";
      errorTitle: string;
      errorMessage: string;
      retryLabel: string;
      onRetry: () => void;
    })
  | (SelectRosterScreenBaseViewModel & {
      status: "ready";
      questTitle: string;
      workersTitle: string;
      workerCountLabel: string;
      /** Filled share of the requested headcount, 0–1. */
      filledRatio: number;
      noWorkersLabel: string;
      workerIds: string[];
      openProfileLabel: (name: string) => string;
      onOpenProfile: (memberId: string) => void;
      selection: RosterSelection;
      refreshing: boolean;
      onRefresh: () => void;
    });
