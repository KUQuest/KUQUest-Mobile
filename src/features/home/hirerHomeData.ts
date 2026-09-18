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
  tag?: LocalizedHirerCopy;
  status: CanonicalHirerQuestStatus;
  worker: {
    id: string;
    displayName: LocalizedHirerCopy;
    avatarUri?: string;
    faculty?: LocalizedHirerCopy;
  };
  dueAt: string;
}
export interface QuestMemberProfile {
  id: string;
  displayName: string;
  avatarUri?: string;
  faculty?: string;
}

export interface LiveHirerQuestCardData {
  id: string;
  title: string;
  tag?: string;
  status: CanonicalHirerQuestStatus;
  mode: "FIRST_COME_FIRST_SERVED" | "CANDIDATE";
  participation: "SINGLE" | "GROUP";
  headcount: number;
  dueAt?: string | null;
  assignedWorkers: QuestMemberProfile[];
  applicants: QuestMemberProfile[];
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
  dueAt: string | null | undefined,
  locale: SupportedLocale
): string {
  if (!dueAt) return "—";
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

export const hirerHomeQuestFixtures: HirerHomeQuestFixture[] = [
  {
    id: "hirer-home-progress-demo",
    title: {
      en: "Sweep the area around campus",
      th: "กวาดขยะรอบมหาวิทยาลัย",
    },
    tag: {
      en: "Cleaning",
      th: "ทำความสะอาด",
    },
    status: QuestStatus.QUEST_IN_PROGRESS,
    worker: {
      id: "demo-worker-1",
      displayName: {
        en: "Nattaphon Jaidee",
        th: "ณัฐพล ใจดี",
      },
      faculty: {
        en: "Faculty of Engineering",
        th: "คณะวิศวกรรมศาสตร์",
      },
    },
    dueAt: "2026-09-19T18:00:00+07:00",
  },
  {
    id: "clean-fan",
    title: {
      en: "Clean a dorm fan",
      th: "ล้างพัดลมหอพัก 13",
    },
    tag: {
      en: "Cleaning",
      th: "ทำความสะอาด",
    },
    status: QuestStatus.QUEST_ASSIGNED,
    worker: {
      id: "demo-worker-2",
      displayName: {
        en: "Ploy Kittisuk",
        th: "พลอย กิตติสุข",
      },
      faculty: {
        en: "Faculty of Science",
        th: "คณะวิทยาศาสตร์",
      },
    },
    dueAt: "2026-09-20T12:00:00+07:00",
  },
  {
    id: "print-documents",
    title: {
      en: "Photocopy course documents",
      th: "ถ่ายเอกสารประกอบการเรียน",
    },
    tag: {
      en: "Printing",
      th: "ถ่ายเอกสาร",
    },
    status: QuestStatus.QUEST_COMPLETED,
    worker: {
      id: "demo-worker-3",
      displayName: {
        en: "Somchai Meesook",
        th: "สมชาย มีสุข",
      },
      faculty: {
        en: "Faculty of Agriculture",
        th: "คณะเกษตร",
      },
    },
    dueAt: "2026-09-18T16:00:00+07:00",
  },
];

export const hirerHomeQuestFixture: HirerHomeQuestFixture =
  hirerHomeQuestFixtures[0];
