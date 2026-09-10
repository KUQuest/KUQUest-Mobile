import type {
  QuestBoardCard,
  QuestBoardCursor,
  QuestBoardDetail,
  QuestBoardImage,
  QuestBoardLocation,
  QuestBoardMode,
  QuestBoardParticipation,
  QuestBoardTag,
  QuestBoardStatus,
} from "./questBoardContracts";

/**
 * The production Quest Board projection. It intentionally contains only
 * fields returned by GET /api/v2/quests; Detail data is loaded separately.
 */
export interface ApiQuestBoardItem {
  questId: string;
  title: string;
  questReward: number;
  tag: QuestBoardTag | null;
  mode: QuestBoardMode;
  participation: QuestBoardParticipation;
  headcount: number;
  activeWorkerCount: number;
  startTime: string;
  dueAt: string | null;
  hirerName: string;
  location: string | null;
}

export interface ApiQuestBoardPage {
  items: ApiQuestBoardItem[];
  nextCursor: string | null;
}

export interface ApiQuestDetailItem {
  questId: string;
  title: string;
  description: string | null;
  conditionItems: { position: number; text: string }[];
  tag: QuestBoardTag | null;
  mode: QuestBoardMode;
  participation: QuestBoardParticipation;
  state: QuestBoardStatus;
  questReward: number;
  headcount: number;
  activeWorkerCount: number;
  startTime: string;
  dueAt: string | null;
  proofRequired: boolean;
  hirerName: string;
  locations: QuestBoardLocation[];
  images: QuestBoardImage[];
}

export function mapQuestBoardCard(card: QuestBoardCard): ApiQuestBoardItem {
  return {
    questId: card.id,
    title: card.title,
    questReward: card.questReward,
    tag: card.tag,
    mode: card.mode,
    participation: card.participation,
    headcount: card.headcount,
    activeWorkerCount: card.activeWorkerCount,
    startTime: card.startTime,
    dueAt: card.dueAt,
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

export function mapQuestBoardDetail(
  detail: QuestBoardDetail
): ApiQuestDetailItem {
  return {
    questId: detail.id,
    title: detail.title,
    description: detail.description,
    conditionItems: detail.condition.items,
    tag: detail.tag,
    mode: detail.mode,
    participation: detail.participation,
    state: detail.state,
    questReward: detail.questReward,
    headcount: detail.headcount,
    activeWorkerCount: detail.activeWorkerCount,
    startTime: detail.startTime,
    dueAt: detail.dueAt,
    proofRequired: detail.proofRequired,
    hirerName: detail.hirerName,
    locations: detail.locations,
    images: detail.images,
  };
}
