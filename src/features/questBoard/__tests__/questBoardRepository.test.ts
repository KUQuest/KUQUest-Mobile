import { ApiQuestBoardRepository } from "../questBoardRepository";
import type { QuestBoardApi } from "@/api/questBoard/QuestBoardApi";

describe("ApiQuestBoardRepository", () => {
  test("requests through QuestBoardApi and maps the cursor page", async () => {
    const api = {
      listQuests: jest.fn().mockResolvedValue({
        items: [
          {
            id: "2ad5b944-830b-4e28-95a7-5fe2792b713a",
            title: "API Quest",
            reward: 980,
            tag: {
              id: "58818dc3-6dad-424f-8dfd-d20b6747aeb3",
              name: "Design",
            },
            mode: "NO_CANDIDATE",
            participation: "SOLO",
            headcount: 1,
            startTime: "2099-09-30T09:00:00.000+07:00",
            estimatedDurationMinutes: 120,
            hirerName: "API Hirer",
            location: { label: "Online" },
          },
        ],
        nextCursor: "next-page",
      }),
    } as unknown as QuestBoardApi;
    const repository = new ApiQuestBoardRepository(api);

    await expect(repository.listQuests({ limit: 20 })).resolves.toEqual({
      items: [
        expect.objectContaining({
          questId: "2ad5b944-830b-4e28-95a7-5fe2792b713a",
          title: "API Quest",
        }),
      ],
      nextCursor: "next-page",
    });
    expect(api.listQuests).toHaveBeenCalledWith({ limit: 20 });
  });
});
