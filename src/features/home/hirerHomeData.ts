import { QuestStatus } from "@/features/questBoard/types";
import type { SupportedLocale } from "@/locales/LocaleProvider";

export const canonicalHirerQuestStatuses = [
  QuestStatus.QUEST_DRAFT,
  QuestStatus.QUEST_OPEN,
  QuestStatus.QUEST_ASSIGNED,
  QuestStatus.QUEST_IN_PROGRESS,
  QuestStatus.QUEST_COMPLETED,
  QuestStatus.QUEST_CANCELLED,
  QuestStatus.QUEST_FAILED,
] as const;

export type CanonicalHirerQuestStatus =
  (typeof canonicalHirerQuestStatuses)[number];

export const timelineStageOrder = [
  "open",
  "assigned",
  "inProgress",
  "review",
  "completed",
] as const;

export type TimelineStageKey = (typeof timelineStageOrder)[number];
export type TimelineStageState =
  "completed" | "current" | "upcoming" | "terminal";

export interface QuestProgressStage {
  key: TimelineStageKey;
  state: TimelineStageState;
}

export interface LocalizedHirerCopy {
  en: string;
  th: string;
}

export interface HirerHomeQuestFixture {
  id: string;
  title: LocalizedHirerCopy;
  status: CanonicalHirerQuestStatus;
  worker: {
    id: string;
    displayName: LocalizedHirerCopy;
    avatarUri?: string;
  };
  dueAt: string;
}

const activeStageByStatus: Record<CanonicalHirerQuestStatus, TimelineStageKey> =
  {
    [QuestStatus.QUEST_DRAFT]: "open",
    [QuestStatus.QUEST_OPEN]: "open",
    [QuestStatus.QUEST_ASSIGNED]: "assigned",
    [QuestStatus.QUEST_IN_PROGRESS]: "inProgress",
    [QuestStatus.QUEST_COMPLETED]: "completed",
    [QuestStatus.QUEST_CANCELLED]: "completed",
    [QuestStatus.QUEST_FAILED]: "review",
  };

const terminalStatuses: Record<CanonicalHirerQuestStatus, boolean> = {
  QUEST_DRAFT: false,
  QUEST_OPEN: false,
  QUEST_ASSIGNED: false,
  QUEST_IN_PROGRESS: false,
  QUEST_COMPLETED: false,
  QUEST_CANCELLED: true,
  QUEST_FAILED: true,
};

export function getQuestProgressStages(
  status: CanonicalHirerQuestStatus
): QuestProgressStage[] {
  const activeStageIndex = timelineStageOrder.indexOf(
    activeStageByStatus[status]
  );
  const isCompleted = status === QuestStatus.QUEST_COMPLETED;
  const isTerminal = terminalStatuses[status];

  return timelineStageOrder.map((key, index) => ({
    key,
    state: isCompleted
      ? "completed"
      : isTerminal
        ? index < activeStageIndex
          ? "completed"
          : index === activeStageIndex
            ? "terminal"
            : "upcoming"
        : index < activeStageIndex
          ? "completed"
          : index === activeStageIndex
            ? "current"
            : "upcoming",
  }));
}

export function formatHirerDueAt(
  dueAt: string,
  locale: SupportedLocale
): string {
  const date = new Date(dueAt);
  if (Number.isNaN(date.getTime())) return dueAt;

  const datePart = new Intl.DateTimeFormat(
    locale === "th" ? "th-TH-u-ca-buddhist" : "en-GB",
    {
      day: "numeric",
      month: "short",
      timeZone: "Asia/Bangkok",
    }
  ).format(date);
  const timePart = new Intl.DateTimeFormat(
    locale === "th" ? "th-TH" : "en-GB",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Bangkok",
    }
  ).format(date);

  return locale === "th"
    ? `ครบกำหนด ${datePart} · ${timePart}`
    : `Due ${datePart} · ${timePart}`;
}

export const hirerHomeQuestFixture: HirerHomeQuestFixture = {
  id: "hirer-home-progress-demo",
  title: {
    en: "Sweep the area around campus",
    th: "กวาดขยะรอบมหาวิทยาลัย",
  },
  status: QuestStatus.QUEST_IN_PROGRESS,
  worker: {
    id: "demo-worker-1",
    displayName: {
      en: "Nattaphon Jaidee",
      th: "ณัฐพล ใจดี",
    },
  },
  dueAt: "2026-09-19T18:00:00+07:00",
};
