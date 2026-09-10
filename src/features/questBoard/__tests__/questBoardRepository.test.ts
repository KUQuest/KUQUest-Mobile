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
            questReward: 980,
            tag: {
              id: "58818dc3-6dad-424f-8dfd-d20b6747aeb3",
              name: "Design",
            },
            mode: "FIRST_COME_FIRST_SERVED",
            participation: "SINGLE",
            headcount: 1,
            activeWorkerCount: 0,
            startTime: "2099-09-30T09:00:00.000+07:00",
            dueAt: "2099-09-30T11:00:00.000+07:00",
            hirerName: "API Hirer",
            location: "Online",
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

  test("requests and maps server-authoritative Quest Detail", async () => {
    const api = {
      getQuestDetail: jest.fn().mockResolvedValue({
        id: "2ad5b944-830b-4e28-95a7-5fe2792b713a",
        title: "API Quest",
        description: "Server detail",
        condition: { items: [{ position: 0, text: "Do the work" }] },
        tag: { id: "58818dc3-6dad-424f-8dfd-d20b6747aeb3", name: "Design" },
        mode: "FIRST_COME_FIRST_SERVED",
        participation: "SINGLE",
        state: "QUEST_ASSIGNED",
        questReward: 980,
        headcount: 1,
        activeWorkerCount: 1,
        startTime: "2099-09-30T09:00:00.000+07:00",
        dueAt: "2099-09-30T11:00:00.000+07:00",
        proofRequired: true,
        hirerName: "API Hirer",
        locations: [{ label: "Online" }],
        images: [],
      }),
    } as unknown as QuestBoardApi;
    const repository = new ApiQuestBoardRepository(api);

    await expect(repository.getQuestDetail("2ad5b944-830b-4e28-95a7-5fe2792b713a"))
      .resolves.toEqual(expect.objectContaining({
        questId: "2ad5b944-830b-4e28-95a7-5fe2792b713a",
        state: "QUEST_ASSIGNED",
        activeWorkerCount: 1,
      }));
    expect(api.getQuestDetail).toHaveBeenCalledWith(
      "2ad5b944-830b-4e28-95a7-5fe2792b713a"
    );
  });

  test("requests public Board Detail through the public API method", async () => {
    const api = {
      getPublicQuestDetail: jest.fn().mockResolvedValue({
        id: "2ad5b944-830b-4e28-95a7-5fe2792b713a",
        title: "Public API Quest",
        description: null,
        condition: { items: [{ position: 0, text: "Do the work" }] },
        tag: null,
        mode: "FIRST_COME_FIRST_SERVED",
        participation: "GROUP",
        state: "QUEST_OPEN",
        questReward: 980,
        headcount: 2,
        activeWorkerCount: 0,
        startTime: "2099-09-30T09:00:00.000+07:00",
        dueAt: null,
        proofRequired: false,
        hirerName: "API Hirer",
        locations: [],
        images: [],
      }),
    } as unknown as QuestBoardApi;
    const repository = new ApiQuestBoardRepository(api);

    await expect(
      repository.getPublicQuestDetail(
        "2ad5b944-830b-4e28-95a7-5fe2792b713a"
      )
    ).resolves.toEqual(expect.objectContaining({
      questId: "2ad5b944-830b-4e28-95a7-5fe2792b713a",
      tag: null,
      dueAt: null,
    }));
    expect(api.getPublicQuestDetail).toHaveBeenCalledWith(
      "2ad5b944-830b-4e28-95a7-5fe2792b713a"
    );
  });
});
