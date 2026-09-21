import { useQuery } from "@tanstack/react-query";

import { questApi } from "@/api/QuestApi";
import { studentApi } from "@/api/StudentApi";
import { QuestStatus } from "@/features/questBoard/types";
import { myQuestService } from "@/features/myQuests/myQuestService";
import {
  HIRER_HOME_MAX_ACTIVE_QUESTS,
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
  return useQuery({
    queryKey: homeKeys.hirer(),
    queryFn: ({ signal }) => loadHirerHome(signal),
  });
}

async function loadHirerHome(signal: AbortSignal): Promise<HirerHomeData> {
  const quests = await myQuestService.listAllMyHirerQuests({ signal });
  const activeSourceQuests = quests.filter(
    (q) =>
      q.state !== QuestStatus.QUEST_DRAFT &&
      q.state !== QuestStatus.QUEST_COMPLETED &&
      q.state !== QuestStatus.QUEST_CANCELLED &&
      q.state !== QuestStatus.QUEST_FAILED
  );
  const draftCount = quests.filter(
    (q) => q.state === QuestStatus.QUEST_DRAFT
  ).length;
  const completedCount = quests.filter(
    (q) => q.state === QuestStatus.QUEST_COMPLETED
  ).length;
  const selectedSourceQuests = prioritizeHirerHomeQuests(
    activeSourceQuests.map((quest) => ({
      quest,
      status: quest.state as CanonicalHirerQuestStatus,
      dueAt: quest.dueAt,
    }))
  )
    .slice(0, HIRER_HOME_MAX_ACTIVE_QUESTS)
    .map(({ quest }) => quest);

  const activeQuests = await Promise.all(
    selectedSourceQuests.map(async (q) => {
      const isSingleCandidate =
        q.mode === "CANDIDATE" && q.participation !== "GROUP";
      const isGroupCandidate =
        q.mode === "CANDIDATE" && q.participation === "GROUP";
      const [assignments, applications, teams] = await Promise.all([
        questApi.listQuestAssignments(q.id, { signal }).catch(() => []),
        isSingleCandidate
          ? questApi.listApplications(q.id, { signal }).catch(() => [])
          : Promise.resolve([]),
        isGroupCandidate
          ? questApi.listCandidateTeams(q.id, { signal }).catch(() => [])
          : Promise.resolve([]),
      ]);

      const memberIds = Array.from(
        new Set([
          ...assignments.map((a) => a.workerId),
          ...applications.map((a) => a.memberId),
          ...teams.map((t) => t.leaderId),
        ])
      );

      const profileMap = new Map<string, QuestMemberProfile>();
      await Promise.all(
        memberIds.map(async (id) => {
          try {
            const p = await studentApi.getPublicProfile(id, { signal });
            const name = [p.firstName, p.lastName].filter(Boolean).join(" ");
            profileMap.set(id, {
              id,
              displayName: name || "KU Student",
              avatarUri: p.avatar?.url,
              faculty: p.department?.faculty?.name,
            });
          } catch {
            profileMap.set(id, {
              id,
              displayName: "KU Student",
            });
          }
        })
      );

      const assignedWorkers = assignments
        .map((a) => profileMap.get(a.workerId))
        .filter((p): p is QuestMemberProfile => Boolean(p));

      const applicants = isGroupCandidate
        ? teams
            .filter((t) => t.state === "TEAM_SUBMITTED")
            .map((t) => profileMap.get(t.leaderId))
            .filter((p): p is QuestMemberProfile => Boolean(p))
        : applications
            .filter((app) => app.state === "APPLICATION_APPLIED")
            .map((app) => profileMap.get(app.memberId))
            .filter((p): p is QuestMemberProfile => Boolean(p));

      return {
        id: q.id,
        title: q.title,
        tag: q.tag?.name,
        status: q.state as CanonicalHirerQuestStatus,
        mode: q.mode,
        participation: q.participation,
        headcount: q.headcount,
        dueAt: q.dueAt,
        assignedWorkers,
        applicants,
      };
    })
  );

  return {
    activeQuests,
    activeQuestCount: activeSourceQuests.length,
    draftCount,
    completedCount,
  };
}
