import type { QuestV2Application, QuestV2Team } from "@/api/questV2Contracts";
import type { SupportedLocale } from "@/locales/locale";
import type { ThemeColors } from "@/theme/colors";

interface SelectRosterScreenBaseViewModel {
  title: string;
  colors: ThemeColors;
  onBack: () => void;
}

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
      status: "not-required";
      message: string;
    })
  | (SelectRosterScreenBaseViewModel & {
      status: "ready";
      isGroup: boolean;
      canSelectCandidate: boolean;
      canRejectCandidate: boolean;
      canSelectTeam: boolean;
      canRejectTeam: boolean;
      questTitle: string;
      subtitle: string;
      requestedHeadcountLabel: string;
      requestedHeadcount: number;
      actualHeadcountLabel: string;
      actualHeadcount: number;
      proposalCountLabel: string;
      noProposalsLabel: string;
      pendingApplications: QuestV2Application[];
      pendingTeams: QuestV2Team[];
      refreshing: boolean;
      locale: SupportedLocale;
      selectLabel: string;
      rejectLabel: string;
      submittedLabel: string;
      teamProposalLabel: string;
      memberCount: (count: number) => string;
      onRefresh: () => void;
      onSelectApplication: (application: QuestV2Application) => void;
      onRejectApplication: (application: QuestV2Application) => void;
      onSelectTeam: (team: QuestV2Team) => void;
      onRejectTeam: (team: QuestV2Team) => void;
    });
