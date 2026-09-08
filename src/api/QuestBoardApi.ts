import { ApiClient } from "./ApiClient";
import {
  questBoardQuerySchema,
  questBoardResponseSchema,
} from "./questBoardContracts";
import type {
  QuestBoardCursor,
  QuestBoardQuery,
} from "./questBoardContracts";

function toQueryString(query: QuestBoardQuery): string {
  const parsedQuery = questBoardQuerySchema.parse(query);
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(parsedQuery)) {
    if (value !== undefined) searchParams.set(key, String(value));
  }

  const encodedQuery = searchParams.toString();
  return encodedQuery ? `?${encodedQuery}` : "";
}

export class QuestBoardApi {
  constructor(private readonly client: ApiClient) {}

  async listQuests(query: QuestBoardQuery = {}): Promise<QuestBoardCursor> {
    const body = await this.client.request<unknown>(
      `/api/v2/quests${toQueryString(query)}`
    );

    return questBoardResponseSchema.parse(body).data;
  }

  /** @deprecated Use listQuests for the v2 Board endpoint. */
  async listBoardQuests(query: QuestBoardQuery = {}): Promise<QuestBoardCursor> {
    return this.listQuests(query);
  }
}
