import { questApi, type QuestV2AssignmentMineStatus } from "@/api/QuestApi";
import type {
  QuestV2Assignment,
  QuestV2CanonicalQuest,
} from "@/api/questV2Contracts";
import { liveQuestService } from "@/features/questBoard/liveQuestService";
import type { LiveQuestSnapshot } from "@/features/questBoard/liveQuestService";
import type { WorkConversationCapability } from "@/features/questBoard/types";
import type { SupportedLocale } from "@/locales/LocaleProvider";
import { questBoardMessages } from "@/locales/questBoardMessages";
/** The v2 endpoint accepts limits from 1 through 50. */
const PAGE_LIMIT = 50;

export type HirerTab = "active" | "draft" | "completed";
export type StatusTone = "success" | "warning" | "danger" | "neutral";
export type CategoryTone = "green" | "blue" | "purple";

export type QuestSummary = {
  id: string;
  title: string;
  tag: string;
  categoryTone: CategoryTone;
  date: string;
  location: string;
  description: string;
  detail: string;
  teamSize: string;
  status: string;
  statusTone: StatusTone;
  action: string;
  actionType?: "edit" | "applicants" | "detail";
  secondaryAction?: string;
  groupChatId?: string;
  groupChatCapability?: WorkConversationCapability;
  groupChatViewerId?: string;
  host?: string;
  appliedOn?: string;
  reason?: string;
};

export const actionLabels: Record<
  SupportedLocale,
  {
    detail: string;
    applicants: string;
    edit: string;
    message: string;
    start: string;
  }
> = {
  th: {
    detail: "ดูรายละเอียด",
    applicants: "ดูผู้สมัคร",
    edit: "แก้ไข",
    message: "ข้อความ",
    start: "รอเริ่มงาน",
  },
  en: {
    detail: "View Detail",
    applicants: "View Applicants",
    edit: "Edit",
    message: "Message",
    start: "Awaiting start",
  },
};

export function formatQuestDate(
  value: string,
  locale: SupportedLocale
): string {
  if (!value) return "—";
  const dateValue = value.length > 10 ? value.slice(0, 10) : value;
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${dateValue}T12:00:00`));
}

export function getCategoryTone(tag: string): CategoryTone {
  if (tag.toLocaleLowerCase().includes("print") || tag.includes("ถ่าย")) {
    return "blue";
  }
  if (tag.toLocaleLowerCase().includes("design") || tag.includes("ออกแบบ")) {
    return "purple";
  }
  return "green";
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

export function getLiveHirerItems(
  quests: QuestV2CanonicalQuest[],
  tab: HirerTab,
  locale: SupportedLocale
): QuestSummary[] {
  return quests.flatMap((quest) => {
    const terminal =
      quest.state === "QUEST_COMPLETED" ||
      quest.state === "QUEST_CANCELLED" ||
      quest.state === "QUEST_FAILED";
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
        action:
          quest.state === "QUEST_DRAFT"
            ? actionLabels[locale].edit
            : actionLabels[locale].detail,
        actionType:
          quest.state === "QUEST_DRAFT"
            ? ("edit" as const)
            : ("detail" as const),
      },
    ];
  });
}

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
  getLiveHirerItems,
  liveQuestStatusTone,
  liveQuestStatusLabel,
  listAllMyWorkerAssignments,
  listMyWorkerAssignments: listAllMyWorkerAssignments,
  listMyWorkerQuestSnapshots,
  listAllMyWorkerQuestSnapshots,
  listMyHirerQuestSnapshots,
};
