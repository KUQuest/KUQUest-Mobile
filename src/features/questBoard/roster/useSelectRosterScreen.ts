import { useCallback } from "react";
import { useRouter } from "expo-router";

import { useSessionQuery } from "@/features/auth/sessionQueries";
import { useLocale } from "@/features/preferences/localeStore";
import { groupQuestMessages } from "@/locales/groupQuestMessages";
import { questBoardMessages } from "@/locales/questBoardMessages";
import {
  useCandidateRosterEvents,
  useLiveQuestSnapshotQuery,
} from "@/features/questBoard/api/questBoardQueries";
import {
  QuestAssignmentStatus,
  QuestMode,
  QuestParticipation,
} from "../domain/types";
import {
  getApplicationSubmissionDetail,
  getPendingApplications,
  getPendingTeams,
  getSelectRosterPermissions,
} from "./selectRosterSelectors";
import type {
  RosterSelection,
  SelectRosterScreenViewModel,
} from "./selectRosterViewModel";
import { useSelectRosterActions } from "./useSelectRosterActions";

export function useSelectRosterScreen(
  questId?: string
): SelectRosterScreenViewModel {
  const router = useRouter();
  const { locale } = useLocale();
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
  const snapshot = snapshotQuery.data;
  useCandidateRosterEvents(snapshot);
  const onBack = useCallback(() => router.back(), [router]);
  const onOpenProfile = useCallback(
    (memberId: string) => router.push(`/profile/${memberId}`),
    [router]
  );
  const actions = useSelectRosterActions({
    questId,
    viewerId,
    messages,
    groupMessages,
    onSelectSuccess: onBack,
    refetchSnapshot: snapshotQuery.refetch,
  });

  const baseViewModel = { title: messages.selectRosterTitle, onBack };

  if (snapshotQuery.isPending) {
    return {
      ...baseViewModel,
      status: "loading",
      loadingMessage: groupMessages.loading,
    };
  }

  if (snapshotQuery.isError || !snapshot) {
    return {
      ...baseViewModel,
      status: "error",
      errorTitle: groupMessages.errorTitle,
      errorMessage:
        snapshotQuery.error instanceof Error
          ? snapshotQuery.error.message
          : groupMessages.errorDescription,
      retryLabel: groupMessages.retry,
      onRetry: () => void snapshotQuery.refetch(),
    };
  }

  const workerIds = [
    ...new Set(
      snapshot.assignments
        .filter(
          (assignment) =>
            assignment.state !== QuestAssignmentStatus.ASSIGNMENT_CANCELLED
        )
        .map((assignment) => assignment.workerId)
    ),
  ];
  const headcount = snapshot.quest.headcount;

  let selection: RosterSelection;
  if (snapshot.mode === QuestMode.CANDIDATE) {
    const permissions = getSelectRosterPermissions(snapshot);
    const isGroup = snapshot.participation === QuestParticipation.GROUP;
    const proposals = isGroup
      ? getPendingTeams(snapshot.teams).map((team) => ({
          id: team.id,
          memberId: team.leaderId,
          detail: `${team.name || groupMessages.teamProposal} · ${groupMessages.memberCount(team.members.length)}`,
          testID: `select-roster-team-${team.id}`,
          onSelect: () => actions.selectTeam(team),
          onReject: () => actions.rejectTeam(team),
        }))
      : getPendingApplications(snapshot.applications).map((application) => ({
          id: application.id,
          memberId: application.memberId,
          detail: getApplicationSubmissionDetail(
            application.appliedAt,
            locale,
            groupMessages.submittedLabel
          ),
          testID: `select-roster-candidate-${application.id}`,
          onSelect: () => actions.selectApplication(application),
          onReject: () => actions.rejectApplication(application),
        }));
    selection = {
      mode: "candidate",
      title: messages.rosterProposalsTitle,
      subtitle: groupMessages.candidateReviewSubtitle,
      countLabel: groupMessages.proposalCount(proposals.length),
      emptyLabel: groupMessages.noProposals,
      proposals,
      canSelect: isGroup
        ? permissions.canSelectTeam
        : permissions.canSelectCandidate,
      canReject: isGroup
        ? permissions.canRejectTeam
        : permissions.canRejectCandidate,
      selectLabel: groupMessages.selectProposal,
      rejectLabel: groupMessages.reject,
      pendingAction: actions.pendingAction,
    };
  } else {
    selection = { mode: "automatic", message: messages.noSelectionNeeded };
  }

  return {
    ...baseViewModel,
    status: "ready",
    questTitle: snapshot.quest.title,
    workersTitle: messages.rosterWorkersTitle,
    workerCountLabel: messages.rosterWorkerCount(workerIds.length, headcount),
    filledRatio: headcount > 0 ? Math.min(workerIds.length / headcount, 1) : 0,
    noWorkersLabel: messages.rosterNoWorkers,
    workerIds,
    openProfileLabel: messages.rosterOpenProfile,
    onOpenProfile,
    selection,
    refreshing: snapshotQuery.isRefetching,
    onRefresh: () => void snapshotQuery.refetch(),
  };
}
