import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { questApi } from "@/api/QuestApi";
import { studentApi } from "@/api/StudentApi";
import {
  QuestMode,
  QuestParticipation,
  QuestProofStatus,
  QuestStatus,
} from "@/features/questBoard/domain/types";
import { subscribeToHirerQuestEvents } from "@/features/questBoard/live/questEvents";
import { isTerminalStatus } from "@/domain/questLifecycle";
import { myQuestService } from "@/features/myQuests/myQuestService";
import {
  HIRER_HOME_MAX_ACTIVE_QUESTS,
  getHirerAttentionItems,
  prioritizeHirerHomeQuests,
  type CanonicalHirerQuestStatus,
  type HirerHomeData,
  type QuestMemberProfile,
} from "../hirerHomeData";

export const homeKeys = {
  all: ["home"] as const,
  hirer: () => [...homeKeys.all, "hirer"] as const,
};

export function useHirerHomeQuery() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: homeKeys.hirer(),
    queryFn: ({ signal }) => loadHirerHome(signal),
  });
  const hasSnapshot = query.data !== undefined;

  useEffect(() => {
    if (!hasSnapshot) return;
    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: homeKeys.hirer() });
    };
    return subscribeToHirerQuestEvents(invalidate, invalidate);
  }, [hasSnapshot, queryClient]);

  return query;
}

async function loadHirerHome(signal: AbortSignal): Promise<HirerHomeData> {
  const quests = await myQuestService.listAllMyHirerQuests({ signal });
  const activeSourceQuests = quests.filter(
    (q) => q.state !== QuestStatus.QUEST_DRAFT && !isTerminalStatus(q.state)
  );
  const draftCount = quests.filter(
    (q) => q.state === QuestStatus.QUEST_DRAFT
  ).length;
  const completedCount = quests.filter(
    (q) => q.state === QuestStatus.QUEST_COMPLETED
  ).length;
  const prioritizedQuests = prioritizeHirerHomeQuests(
    activeSourceQuests.map((quest) => ({
      quest,
      status: quest.state as CanonicalHirerQuestStatus,
      dueAt: quest.dueAt,
    }))
  ).map(({ quest }) => quest);
  const carouselQuestIds = new Set(
    prioritizedQuests
      .slice(0, HIRER_HOME_MAX_ACTIVE_QUESTS)
      .map((quest) => quest.id)
  );
  let hasPartialFailure = false;

  const hydratedQuests = await Promise.all(
    prioritizedQuests.map(async (q) => {
      const isCarouselQuest = carouselQuestIds.has(q.id);
      const isSingleCandidate =
        q.mode === QuestMode.CANDIDATE &&
        q.participation !== QuestParticipation.GROUP;
      const isGroupCandidate =
        q.mode === QuestMode.CANDIDATE &&
        q.participation === QuestParticipation.GROUP;
      // Applications and Candidate Teams answer 404 once a Quest has started,
      // and applicants only matter while it is open.
      const shouldLoadProposals = q.state === QuestStatus.QUEST_OPEN;
      const [assignments, applications, teams, proofs] = await Promise.all([
        isCarouselQuest
          ? questApi.listQuestAssignments(q.id, { signal }).catch(() => {
              hasPartialFailure = true;
              return [];
            })
          : Promise.resolve([]),
        isSingleCandidate && shouldLoadProposals
          ? questApi.listApplications(q.id, { signal }).catch(() => {
              hasPartialFailure = true;
              return [];
            })
          : Promise.resolve([]),
        isGroupCandidate && shouldLoadProposals
          ? questApi.listCandidateTeams(q.id, { signal }).catch(() => {
              hasPartialFailure = true;
              return [];
            })
          : Promise.resolve([]),
        q.proofRequired && q.state === QuestStatus.QUEST_IN_PROGRESS
          ? questApi.listProofSubmissions(q.id, { signal }).catch(() => {
              hasPartialFailure = true;
              return [];
            })
          : Promise.resolve([]),
      ]);

      const memberIds = isCarouselQuest
        ? Array.from(
            new Set([
              ...assignments.map((a) => a.workerId),
              ...applications.map((a) => a.memberId),
              ...teams.map((t) => t.leaderId),
            ])
          )
        : [];
      const profileMap = new Map<string, QuestMemberProfile>();
      await Promise.all(
        memberIds.map(async (id) => {
          try {
            const p = await studentApi.getPublicProfile(id, { signal });
            const name = [p.firstName, p.lastName].filter(Boolean).join(" ");
            profileMap.set(id, {
              id,
              displayName: name || "—",
              avatarUri: p.avatar?.url,
              faculty: p.department?.faculty?.name,
            });
          } catch {
            hasPartialFailure = true;
            profileMap.set(id, {
              id,
              displayName: "—",
            });
          }
        })
      );
      const assignedWorkers = assignments
        .map((a) => profileMap.get(a.workerId))
        .filter((p): p is QuestMemberProfile => Boolean(p));

      const applicantIds = isGroupCandidate
        ? teams
            .filter((t) => t.state === "TEAM_SUBMITTED")
            .map((t) => t.leaderId)
        : applications
            .filter((app) => app.state === "APPLICATION_APPLIED")
            .map((app) => app.memberId);
      const applicants = applicantIds
        .map(
          (id) =>
            profileMap.get(id) ?? {
              id,
              displayName: "",
            }
        )
        .filter((p): p is QuestMemberProfile => Boolean(p));

      return {
        id: q.id,
        title: q.title,
        status: q.state as CanonicalHirerQuestStatus,
        mode: q.mode,
        participation: q.participation,
        headcount: q.headcount,
        startTime: q.startTime,
        dueAt: q.dueAt,
        assignedWorkers,
        applicants,
        proofPending: proofs.some(
          (proof) =>
            proof.status === QuestProofStatus.PROOF_PENDING &&
            proof.submittedAt !== null
        ),
      };
    })
  );

  return {
    activeQuests: hydratedQuests.slice(0, HIRER_HOME_MAX_ACTIVE_QUESTS),
    attentionItems: getHirerAttentionItems(hydratedQuests),
    activeQuestCount: activeSourceQuests.length,
    draftCount,
    completedCount,
    hasPartialFailure,
  };
}
