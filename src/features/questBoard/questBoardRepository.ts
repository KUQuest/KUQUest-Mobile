import { ApiClient } from "@/api/ApiClient";
import { QuestBoardApi } from "@/api/QuestBoardApi";
import type { QuestBoardQuery } from "@/api/questBoardContracts";
import {
  mapQuestBoardPage,
  type ApiQuestBoardPage,
} from "@/api/questBoardMapper";

export interface QuestBoardRepository {
  listQuests(query?: QuestBoardQuery): Promise<ApiQuestBoardPage>;
}

export class ApiQuestBoardRepository implements QuestBoardRepository {
  constructor(
    private readonly api: QuestBoardApi = new QuestBoardApi(new ApiClient())
  ) {}

  async listQuests(query: QuestBoardQuery = {}): Promise<ApiQuestBoardPage> {
    const page = await this.api.listQuests(query);
    return mapQuestBoardPage(page);
  }
}

export const questBoardRepository = new ApiQuestBoardRepository();
