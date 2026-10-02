import { QuestStatus } from "../domain/types";

export type CancelTier = 1 | 2 | 3;

export function getCancelTier(state: QuestStatus): CancelTier | null {
  switch (state) {
    case QuestStatus.QUEST_DRAFT:
    case QuestStatus.QUEST_OPEN:
      return 1;
    case QuestStatus.QUEST_ASSIGNED:
      return 2;
    case QuestStatus.QUEST_IN_PROGRESS:
      return 3;
    default:
      return null;
  }
}
