import { formatTimestampDateTime } from "@/domain/datetime";
import { isTerminalStatus, QuestStatus } from "@/domain/questLifecycle";
import type { SupportedLocale } from "@/locales/locale";
import type {
  CanonicalHirerQuestStatus,
  TimelineStageKey,
  QuestProgressStage,
  HirerHomeQuestFixture,
} from "./hirerHomeTypes";
import { timelineStageOrder } from "./hirerHomeTypes";

export type {
  CanonicalHirerQuestStatus,
  TimelineStageKey,
  TimelineStageState,
  QuestProgressStage,
  LocalizedHirerCopy,
  HirerHomeQuestFixture,
  QuestMemberProfile,
  LiveHirerQuestCardData,
  HirerHomeData,
} from "./hirerHomeTypes";

export const HIRER_HOME_MAX_ACTIVE_QUESTS = 5;

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

type HirerHomeQuestPriorityInput = {
  status: CanonicalHirerQuestStatus;
  dueAt?: string | null;
};

const getHirerHomeQuestPriority = (
  quest: HirerHomeQuestPriorityInput
): number => {
  if (quest.status === QuestStatus.QUEST_IN_PROGRESS) return 0;
  if (quest.status === QuestStatus.QUEST_ASSIGNED) return 1;
  if (quest.status === QuestStatus.QUEST_OPEN) return 2;
  return 3;
};

export function prioritizeHirerHomeQuests<
  T extends HirerHomeQuestPriorityInput,
>(quests: T[]): T[] {
  return quests
    .map((quest, index) => ({ quest, index }))
    .sort((left, right) => {
      const priorityDifference =
        getHirerHomeQuestPriority(left.quest) -
        getHirerHomeQuestPriority(right.quest);
      if (priorityDifference !== 0) return priorityDifference;

      const leftDueAt = left.quest.dueAt
        ? Date.parse(left.quest.dueAt)
        : Number.POSITIVE_INFINITY;
      const rightDueAt = right.quest.dueAt
        ? Date.parse(right.quest.dueAt)
        : Number.POSITIVE_INFINITY;
      const dueAtDifference =
        (Number.isNaN(leftDueAt) ? Number.POSITIVE_INFINITY : leftDueAt) -
        (Number.isNaN(rightDueAt) ? Number.POSITIVE_INFINITY : rightDueAt);
      if (dueAtDifference !== 0) return dueAtDifference;

      return left.index - right.index;
    })
    .map(({ quest }) => quest);
}

export function getQuestProgressStages(
  status: CanonicalHirerQuestStatus,
  proofPending = false
): QuestProgressStage[] {
  // A sent Proof keeps the Quest QUEST_IN_PROGRESS; only the Proof list
  // reveals that the Quest reached Hirer review.
  const activeStageIndex = timelineStageOrder.indexOf(
    proofPending && status === QuestStatus.QUEST_IN_PROGRESS
      ? "review"
      : activeStageByStatus[status]
  );
  const isCompleted = status === QuestStatus.QUEST_COMPLETED;
  const isTerminal = isTerminalStatus(status);

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
  const formattedDateTime = formatTimestampDateTime(date, locale);
  return locale === "th"
    ? `ครบกำหนด ${formattedDateTime}`
    : `Due ${formattedDateTime}`;
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
