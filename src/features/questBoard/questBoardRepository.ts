import { ApiClient } from "@/api/ApiClient";
import { QuestBoardApi } from "@/api/questBoard/QuestBoardApi";
import type { QuestBoardQuery } from "@/api/questBoard/questBoardContracts";
import {
  mapQuestBoardPage,
  mapQuestBoardDetail,
  type ApiQuestDetailItem,
  type ApiQuestBoardPage,
} from "@/api/questBoard/questBoardMapper";

export interface QuestBoardRepository {
  listQuests(query?: QuestBoardQuery): Promise<ApiQuestBoardPage>;
}

export interface QuestDetailRepository {
  getQuestDetail(questId: string): Promise<ApiQuestDetailItem>;
}

export class ApiQuestBoardRepository
  implements QuestBoardRepository, QuestDetailRepository
{
  constructor(
    private readonly api: QuestBoardApi = new QuestBoardApi(new ApiClient())
  ) {}

  async listQuests(query: QuestBoardQuery = {}): Promise<ApiQuestBoardPage> {
    const page = await this.api.listQuests(query);
    return mapQuestBoardPage(page);
  }

  async getQuestDetail(questId: string): Promise<ApiQuestDetailItem> {
    const detail = await this.api.getQuestDetail(questId);
    return mapQuestBoardDetail(detail);
  }
}

export const questBoardRepository = new ApiQuestBoardRepository();
export const questDetailRepository: QuestDetailRepository = questBoardRepository;
