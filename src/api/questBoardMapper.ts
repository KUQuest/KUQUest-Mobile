import type {
  QuestBoardCard,
  QuestBoardCursor,
  QuestBoardLocation,
  QuestBoardMode,
  QuestBoardParticipation,
  QuestBoardTag,
} from "./questBoardContracts";

/**
 * The production Quest Board projection. It intentionally contains only
 * fields returned by GET /api/v2/quests; Detail data is loaded separately.
 */
export interface ApiQuestBoardItem {
  questId: string;
  title: string;
  reward: number;
  tag: QuestBoardTag;
  mode: QuestBoardMode;
  participation: QuestBoardParticipation;
  headcount: number;
  startTime: string;
  estimatedDurationMinutes: number | null;
  hirerName: string;
  location: QuestBoardLocation | null;
}

export interface ApiQuestBoardPage {
  items: ApiQuestBoardItem[];
  nextCursor: string | null;
}

export function mapQuestBoardCard(card: QuestBoardCard): ApiQuestBoardItem {
  return {
    questId: card.id,
    title: card.title,
    reward: card.reward,
    tag: card.tag,
    mode: card.mode,
    participation: card.participation,
    headcount: card.headcount,
    startTime: card.startTime,
    estimatedDurationMinutes: card.estimatedDurationMinutes,
    hirerName: card.hirerName,
    location: card.location,
  };
}

export function mapQuestBoardPage(page: QuestBoardCursor): ApiQuestBoardPage {
  return {
    items: page.items.map(mapQuestBoardCard),
    nextCursor: page.nextCursor,
  };
}
