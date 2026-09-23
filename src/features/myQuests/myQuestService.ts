import { questApi, type QuestV2AssignmentMineStatus } from "@/api/QuestApi";
import type { RequestOptions } from "@/api/WalletApi";
import type {
  QuestV2Assignment,
  QuestV2CanonicalQuest,
} from "@/api/questV2Contracts";
import { liveQuestService } from "@/features/questBoard/live/liveQuestService";
import { isTerminalStatus } from "@/domain/questLifecycle";
import type { LiveQuestSnapshot } from "@/features/questBoard/live/liveQuestService";
import type { SupportedLocale } from "@/locales/locale";
import { questBoardMessages } from "@/locales/questBoardMessages";
import type { HirerTab, StatusTone, QuestSummary } from "./myQuestTypes";
import { formatQuestDate, getCategoryTone } from "./myQuestFormatting";
/** The v2 endpoint accepts limits from 1 through 50. */
const PAGE_LIMIT = 50;

export type {
  HirerTab,
  StatusTone,
  CategoryTone,
  QuestSummary,
} from "./myQuestTypes";

const actionLabels = {
  th: {
    detail: "ดูรายละเอียด",
    applicants: "ดูผู้สมัคร",
    edit: "แก้ไข",
    review: "เขียนรีวิว",
    message: "ข้อความ",
    start: "เริ่มงาน",
  },
  en: {
    detail: "View Detail",
    applicants: "View Applicants",
    edit: "Edit",
    review: "Write review",
    message: "Message",
    start: "Start work",
  },
} satisfies Record<SupportedLocale, Record<string, string>>;

export function getLiveHirerItems(
  quests: QuestV2CanonicalQuest[],
  tab: HirerTab,
  locale: SupportedLocale
): QuestSummary[] {
  return quests.flatMap((quest) => {
    const terminal = isTerminalStatus(quest.state);
    const matchesTab =
      tab === "draft"
        ? quest.state === "QUEST_DRAFT"
        : tab === "completed"
          ? terminal
          : !terminal && quest.state !== "QUEST_DRAFT";
    if (!matchesTab) return [];

    const tag = quest.tag?.name ?? "Quest";
    const statusValue = quest.hiddenAt ? "QUEST_HIDDEN" : quest.state;
    const status = liveQuestStatusLabel(statusValue, locale);
    const isDraft = quest.state === "QUEST_DRAFT";
    return [
      {
        id: quest.id,
        title: quest.title,
        tag,
        categoryTone: getCategoryTone(tag),
        date: formatQuestDate(quest.startTime, locale),
        location: quest.locations[0]?.label ?? "—",
        description: quest.description ?? "",
        detail: status,
        teamSize: String(quest.headcount),
        status,
        statusTone: liveQuestStatusTone(statusValue),
        action: isDraft
          ? actionLabels[locale].edit
          : terminal
            ? actionLabels[locale].review
            : actionLabels[locale].detail,
        actionType: isDraft
          ? ("edit" as const)
          : terminal
            ? ("review" as const)
            : ("detail" as const),
      },
    ];
  });
}

export function liveQuestStatusTone(
  status: QuestV2CanonicalQuest["state"] | "QUEST_HIDDEN"
): StatusTone {
  if (status === "QUEST_COMPLETED") return "success";
  if (status === "QUEST_CANCELLED" || status === "QUEST_FAILED") {
    return "danger";
  }
  if (status === "QUEST_DRAFT") return "neutral";
  if (status === "QUEST_HIDDEN") return "warning";
  return "success";
}

export function liveQuestStatusLabel(
  status: QuestV2CanonicalQuest["state"] | "QUEST_HIDDEN",
  locale: SupportedLocale
): string {
  if (status === "QUEST_FAILED") return locale === "th" ? "ล้มเหลว" : "Failed";
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
