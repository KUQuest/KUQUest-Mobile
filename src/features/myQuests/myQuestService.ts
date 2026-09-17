import { liveQuestService } from "@/features/questBoard/liveQuestService";
import type { LiveQuestSnapshot } from "@/features/questBoard/liveQuestService";
import { questApi, type QuestV2AssignmentMineStatus } from "@/api/QuestApi";
import type {
  QuestV2Assignment,
  QuestV2CanonicalQuest,
} from "@/api/questV2Contracts";
/** The v2 endpoint accepts limits from 1 through 50. */
const PAGE_LIMIT = 50;

/**
 * Loads every Quest owned by the authenticated Hirer from the canonical v2
 * endpoint. Cursors are opaque and must only be carried forward from the API.
 */
export async function listAllMyHirerQuests(): Promise<QuestV2CanonicalQuest[]> {
  const quests: QuestV2CanonicalQuest[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | undefined;

  while (true) {
    const page = await questApi.listMine({ cursor, limit: PAGE_LIMIT });
    quests.push(...page.items);

    if (!page.nextCursor) return quests;
    if (seenCursors.has(page.nextCursor)) {
      throw new Error("The Quest pagination cursor repeated unexpectedly.");
    }
    seenCursors.add(page.nextCursor);
    cursor = page.nextCursor;
  }
}
/** Loads the authenticated Worker's authoritative Assignment roster. */
export async function listAllMyWorkerAssignments(
  status?: QuestV2AssignmentMineStatus
): Promise<QuestV2Assignment[]> {
  return liveQuestService.listMyWorkerAssignments(status);
}
/**
 * Loads fresh live Quest snapshots for every Assignment owned by the
 * authenticated Worker. Each snapshot re-reads server state, so a mutation
 * cannot leave My Quests showing a locally assumed lifecycle.
 */
export async function listMyWorkerQuestSnapshots(
  viewerId: string,
  status?: QuestV2AssignmentMineStatus
): Promise<LiveQuestSnapshot[]> {
  const assignments = await listAllMyWorkerAssignments(status);
  const questIds = new Set(assignments.map((assignment) => assignment.questId));
  return Promise.all(
    [...questIds].map((questId) =>
      liveQuestService.getLiveSnapshot(questId, viewerId)
    )
  );
}

/**
 * Loads fresh live snapshots for Quests owned by the authenticated Hirer.
 * `listAllMyHirerQuests` remains available for the existing card projection.
 */
export async function listMyHirerQuestSnapshots(
  viewerId: string
): Promise<LiveQuestSnapshot[]> {
  const quests = await listAllMyHirerQuests();
  return Promise.all(
    quests.map((quest) => liveQuestService.getLiveSnapshot(quest.id, viewerId))
  );
}
export async function getMyHirerQuestSnapshot(
  questId: string,
  viewerId: string
): Promise<LiveQuestSnapshot> {
  return liveQuestService.getLiveSnapshot(questId, viewerId);
}

export async function refreshMyHirerQuestSnapshot(
  questId: string,
  viewerId: string
): Promise<LiveQuestSnapshot> {
  return liveQuestService.refreshLiveSnapshot(questId, viewerId);
}

/** Explicit alias for callers that name the Worker surface first. */
export const listAllMyWorkerQuestSnapshots = listMyWorkerQuestSnapshots;

export const myQuestService = {
  listAllMyHirerQuests,
  listAllMyWorkerAssignments,
  listMyWorkerAssignments: listAllMyWorkerAssignments,
  listMyWorkerQuestSnapshots,
  listAllMyWorkerQuestSnapshots,
  listMyHirerQuestSnapshots,
};
