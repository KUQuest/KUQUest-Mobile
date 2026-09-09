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
          mode: "FIRST_COME_FIRST_SERVED",
          participation: "SINGLE",
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
      minQuestReward: 100,
      limit: 20,
    })).resolves.toEqual(expect.objectContaining({ nextCursor: null }));

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v2/quests?q=design&minQuestReward=100&limit=20",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Cookie: "better-auth.session_token=session-cookie",
        }),
      })
    );
  });

  test("serializes canonical filters and preserves the opaque cursor", async () => {
    fetchMock.mockResolvedValue(response({
      success: true,
      data: { items: [], nextCursor: "opaque/cursor==" },
    }));

    await api.listQuests({
      tagId,
      mode: "CANDIDATE",
      participation: "GROUP",
      minQuestReward: 100.5,
      maxQuestReward: 700000,
      maxDurationMinutes: 90,
      startFrom: "2026-09-30T09:00:00.000+07:00",
      startTo: "2026-10-01T09:00:00.000+07:00",
      cursor: "opaque/cursor==",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v2/quests?tagId=58818dc3-6dad-424f-8dfd-d20b6747aeb3&mode=CANDIDATE&participation=GROUP&maxDurationMinutes=90&minQuestReward=100.5&maxQuestReward=700000&startFrom=2026-09-30T09%3A00%3A00.000%2B07%3A00&startTo=2026-10-01T09%3A00%3A00.000%2B07%3A00&cursor=opaque%2Fcursor%3D%3D",
      expect.anything(),
    );
  });

});
