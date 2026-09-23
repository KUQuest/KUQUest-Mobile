import { QuestStatus } from "@/domain/questLifecycle";

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
