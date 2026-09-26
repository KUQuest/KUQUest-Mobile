import { questApi, type QuestV2AssignmentMineStatus } from "@/api/QuestApi";
import type { RequestOptions } from "@/api/ApiClient";
import type {
  QuestV2Assignment,
  QuestV2CanonicalQuest,
} from "@/api/questV2Contracts";
import { liveQuestService } from "@/features/questBoard/live/liveQuestService";
import { isTerminalStatus, QuestStatus } from "@/domain/questLifecycle";
import { QuestMode } from "@/features/questBoard/domain/types";
import { formatSatang } from "@/domain/satang";
import type { LiveQuestSnapshot } from "@/features/questBoard/live/liveQuestService";
import type { SupportedLocale } from "@/locales/locale";
import { myQuestMessages } from "@/locales/myQuestMessages";
import { questBoardMessages } from "@/locales/questBoardMessages";
import type { HirerTab, StatusTone, QuestSummary } from "./myQuestTypes";
import { formatQuestDateTime, getCategoryTone } from "./myQuestFormatting";
/** The v2 endpoint accepts limits from 1 through 50. */
const PAGE_LIMIT = 50;

export type {
  HirerTab,
  StatusTone,
  CategoryTone,
  QuestSummary,
} from "./myQuestTypes";

export function getLiveHirerItems(
  quests: QuestV2CanonicalQuest[],
  tab: HirerTab,
  locale: SupportedLocale
): QuestSummary[] {
  const messages = myQuestMessages[locale];
  return quests.flatMap((quest) => {
    const terminal = isTerminalStatus(quest.state);
    const matchesTab =
      tab === "draft"
        ? quest.state === QuestStatus.QUEST_DRAFT
        : tab === "completed"
          ? terminal
          : !terminal && quest.state !== QuestStatus.QUEST_DRAFT;
    if (!matchesTab) return [];

    const tag = quest.tag?.name ?? "Quest";
    const statusValue = quest.hiddenAt ? QuestStatus.QUEST_HIDDEN : quest.state;
    const status = liveQuestStatusLabel(statusValue, locale);
    const isDraft = quest.state === QuestStatus.QUEST_DRAFT;
    return [
      {
        id: quest.id,
        title: quest.title,
        tag,
        categoryTone: getCategoryTone(tag),
        startsAt: formatQuestDateTime(quest.startTime, locale),
        endsAt: quest.dueAt
          ? formatQuestDateTime(quest.dueAt, locale)
          : messages.notSet,
        location: quest.locations[0]?.label ?? "",
        online: quest.locations.length === 0,
        description: quest.description ?? "",
        detail: status,
        teamSize: String(quest.headcount),
        mode:
          quest.mode === QuestMode.CANDIDATE
            ? messages.modeCandidate
            : messages.modeFirstCome,
        reward: formatSatang(Math.round(quest.questFundingTotal * 100), locale),
        status,
        statusTone: liveQuestStatusTone(statusValue),
        primaryAction: isDraft ? "edit" : terminal ? "review" : "manage",
        secondaryAction:
          quest.state === QuestStatus.QUEST_FAILED
            ? ("dispute" as const)
            : undefined,
        cancelFromCard: isDraft
          ? ("draft" as const)
          : quest.state === QuestStatus.QUEST_OPEN
            ? ("open" as const)
            : undefined,
      },
    ];
  });
}

export function liveQuestStatusTone(
  status: QuestV2CanonicalQuest["state"] | typeof QuestStatus.QUEST_HIDDEN
): StatusTone {
  if (status === QuestStatus.QUEST_COMPLETED) return "success";
  if (
    status === QuestStatus.QUEST_CANCELLED ||
    status === QuestStatus.QUEST_FAILED
  ) {
    return "danger";
  }
  if (status === QuestStatus.QUEST_DRAFT) return "neutral";
  if (status === QuestStatus.QUEST_HIDDEN) return "warning";
  return "success";
}

export function liveQuestStatusLabel(
  status: QuestV2CanonicalQuest["state"] | typeof QuestStatus.QUEST_HIDDEN,
  locale: SupportedLocale
): string {
  if (status === QuestStatus.QUEST_FAILED)
    return myQuestMessages[locale].statusFailed;
  return questBoardMessages[locale].statusLabel(status);
}
/**
 * Loads every Quest owned by the authenticated Hirer from the canonical v2
 * endpoint. Cursors are opaque and must only be carried forward from the API.
 */
export async function listAllMyHirerQuests(
  options?: RequestOptions
): Promise<QuestV2CanonicalQuest[]> {
  const quests: QuestV2CanonicalQuest[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | undefined;

  while (true) {
    const page = await questApi.listMine(
      { cursor, limit: PAGE_LIMIT },
      options
    );
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
  status?: QuestV2AssignmentMineStatus,
  options?: RequestOptions
): Promise<QuestV2Assignment[]> {
  return questApi.listMyAssignments(status, options);
}
/**
 * Loads fresh live Quest snapshots for every Assignment owned by the
 * authenticated Worker. Each snapshot re-reads server state, so a mutation
 * cannot leave My Quests showing a locally assumed lifecycle.
 */
export async function listMyWorkerQuestSnapshots(
  viewerId: string,
  status?: QuestV2AssignmentMineStatus,
  options?: RequestOptions
): Promise<LiveQuestSnapshot[]> {
  const assignments = await listAllMyWorkerAssignments(status, options);
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
/** Explicit alias for callers that name the Worker surface first. */
export const listAllMyWorkerQuestSnapshots = listMyWorkerQuestSnapshots;

export const myQuestService = {
  listAllMyHirerQuests,
  getLiveHirerItems,
  liveQuestStatusTone,
  liveQuestStatusLabel,
  listAllMyWorkerAssignments,
  listMyWorkerAssignments: listAllMyWorkerAssignments,
  listMyWorkerQuestSnapshots,
  listAllMyWorkerQuestSnapshots,
  listMyHirerQuestSnapshots,
};
