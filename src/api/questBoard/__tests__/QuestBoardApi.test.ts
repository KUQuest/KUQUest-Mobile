import { ApiClient } from "../../ApiClient";
import { QuestBoardApi } from "../QuestBoardApi";

const questId = "2ad5b944-830b-4e28-95a7-5fe2792b713a";
const tagId = "58818dc3-6dad-424f-8dfd-d20b6747aeb3";

function response(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  } as Response;
}

describe("QuestBoardApi", () => {
  let fetchMock: jest.Mock;
  let api: QuestBoardApi;

  beforeEach(() => {
    fetchMock = jest.fn();
    api = new QuestBoardApi(new ApiClient({
      baseUrl: "https://api.example.test",
      fetchImpl: fetchMock as unknown as typeof fetch,
      cookieProvider: () => "better-auth.session_token=session-cookie",
    }));
  });

  test("lists Board cards through the v2 endpoint with validated query values", async () => {
    fetchMock.mockResolvedValue(response({
      success: true,
      data: {
        items: [{
          id: questId,
          title: "Design a landing page",
          reward: 980,
          tag: { id: tagId, name: "Design" },
          mode: "NO_CANDIDATE",
          participation: "SOLO",
          headcount: 1,
          startTime: "2026-09-30T09:00:00.000+07:00",
          estimatedDurationMinutes: null,
          hirerName: "Hirer display name",
          location: null,
        }],
        nextCursor: null,
      },
    }));

    await expect(api.listBoardQuests({
      q: "design",
      minReward: 100,
      limit: 20,
    })).resolves.toEqual(expect.objectContaining({ nextCursor: null }));

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v2/quests?q=design&minReward=100&limit=20",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Cookie: "better-auth.session_token=session-cookie",
        }),
      })
    );
  });

});
