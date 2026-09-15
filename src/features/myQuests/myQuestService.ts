import { questApi } from "@/api/QuestApi";
import type { QuestV2CanonicalQuest } from "@/api/questV2Contracts";

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

export const myQuestService = {
  listAllMyHirerQuests,
};
