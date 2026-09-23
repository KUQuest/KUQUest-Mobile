import { useCallback } from "react";
import { useRouter } from "expo-router";

import { useSessionQuery } from "@/features/auth/sessionQueries";
import { useLocale } from "@/features/preferences/localeStore";
import { groupQuestMessages } from "@/locales/groupQuestMessages";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { useLiveQuestSnapshotQuery } from "@/features/questBoard/api/questBoardQueries";
import {
  getPendingApplications,
  getPendingTeams,
  getSelectRosterPermissions,
  getSelectRosterProposalCount,
} from "./selectRosterSelectors";
import type { SelectRosterScreenViewModel } from "./selectRosterViewModel";
import { useSelectRosterActions } from "./useSelectRosterActions";

export function useSelectRosterScreen(
  questId?: string
): SelectRosterScreenViewModel {
  const router = useRouter();
  const { locale } = useLocale();
  const { colors } = useAppTheme();
  const messages = questBoardMessages[locale];
  const groupMessages = groupQuestMessages[locale];
  const sessionQuery = useSessionQuery();
  const viewerId = sessionQuery.data?.user.id || "";
  const snapshotQuery = useLiveQuestSnapshotQuery(
    questId ?? null,
    viewerId || null,
    {},
    Boolean(questId && viewerId)
  );
  const onBack = useCallback(() => router.back(), [router]);
  const actions = useSelectRosterActions({
    questId,
    viewerId,
    messages,
    groupMessages,
    onSelectSuccess: onBack,
    refetchSnapshot: snapshotQuery.refetch,
  });

  const baseViewModel = { title: messages.selectRosterTitle, colors, onBack };
  const error =
    snapshotQuery.error instanceof Error
      ? snapshotQuery.error.message
      : snapshotQuery.isError
        ? groupMessages.errorTitle
        : undefined;

  if (snapshotQuery.isPending) {
    return {
      ...baseViewModel,
      status: "loading",
      loadingMessage: groupMessages.loading,
    };
  }

  const snapshot = snapshotQuery.data;
  if (error || !snapshot) {
    return {
      ...baseViewModel,
      status: "error",
      errorTitle: groupMessages.errorTitle,
      errorMessage: error ?? groupMessages.errorDescription,
      retryLabel: groupMessages.retry,
      onRetry: () => void snapshotQuery.refetch(),
    };
  }

  if (snapshot.mode !== "CANDIDATE") {
    return {
      ...baseViewModel,
      status: "not-required",
      message: messages.noSelectionNeeded,
    };
  }

  const permissions = getSelectRosterPermissions(snapshot);
  const pendingApplications = getPendingApplications(snapshot.applications);
  const pendingTeams = getPendingTeams(snapshot.teams);
  const isGroup = snapshot.participation === "GROUP";
  const pendingCount = getSelectRosterProposalCount(
    snapshot.participation,
    pendingApplications,
    pendingTeams
  );

  return {
    ...baseViewModel,
    status: "ready",
    isGroup,
    questTitle: snapshot.quest.title,
    subtitle: groupMessages.candidateReviewSubtitle,
    requestedHeadcountLabel: groupMessages.requestedHeadcount,
    requestedHeadcount: snapshot.quest.headcount,
    actualHeadcountLabel: groupMessages.actualHeadcount,
    actualHeadcount: snapshot.assignments.length,
    proposalCountLabel: groupMessages.proposalCount(pendingCount),
    noProposalsLabel: groupMessages.noProposals,
    pendingApplications,
    pendingTeams,
    refreshing: snapshotQuery.isRefetching,
    locale,
    selectLabel: groupMessages.selectProposal,
    rejectLabel: groupMessages.reject,
    submittedLabel: groupMessages.submittedLabel,
    teamProposalLabel: groupMessages.teamProposal,
    memberCount: groupMessages.memberCount,
    onRefresh: () => void snapshotQuery.refetch(),
    onSelectApplication: actions.selectApplication,
    onRejectApplication: actions.rejectApplication,
    onSelectTeam: actions.selectTeam,
    onRejectTeam: actions.rejectTeam,
    canSelectCandidate: permissions.canSelectCandidate,
    canRejectCandidate: permissions.canRejectCandidate,
    canSelectTeam: permissions.canSelectTeam,
    canRejectTeam: permissions.canRejectTeam,
  };
}
