import {
  questBoardDetailResponseSchema,
  questBoardQuerySchema,
  questBoardResponseSchema,
} from "../questBoardContracts";

const questId = "2ad5b944-830b-4e28-95a7-5fe2792b713a";
const tagId = "58818dc3-6dad-424f-8dfd-d20b6747aeb3";

describe("questBoardContracts", () => {
  test("parses the Board success envelope and its server card fields", () => {
    const response = questBoardResponseSchema.parse({
      success: true,
      data: {
        items: [
          {
            id: questId,
            title: "Design a landing page",
            reward: 980,
            tag: { id: tagId, name: "Design" },
            mode: "FIRST_COME_FIRST_SERVED",
            participation: "SINGLE",
            headcount: 1,
            startTime: "2026-09-30T09:00:00.000+07:00",
            estimatedDurationMinutes: 120,
            hirerName: "Hirer display name",
            location: { label: "Online" },
          },
        ],
        nextCursor: null,
      },
    });

    expect(response.data.items[0]).toEqual(expect.objectContaining({
      reward: 980,
      hirerName: "Hirer display name",
    }));
  });

  test("parses the detail success envelope without public-only fields", () => {
    const response = questBoardDetailResponseSchema.parse({
      success: true,
      data: {
        id: questId,
        title: "Design a landing page",
        description: null,
        condition: "Use the supplied brand colors",
        reward: 980,
        tag: null,
        mode: "CANDIDATE",
        participation: "GROUP",
        questStatus: "QUEST_OPEN",
        headcount: 2,
        startTime: "2026-09-30T09:00:00.000+07:00",
        dueAt: null,
        estimatedDurationMinutes: null,
        proofRequired: true,
        hirerName: "Hirer display name",
        locations: [{ label: null }],
        images: [],
      },
    });

    expect(response.data).toEqual(expect.objectContaining({
      condition: "Use the supplied brand colors",
      questStatus: "QUEST_OPEN",
    }));
  });

  test("coerces numeric query strings accepted by the Board endpoint", () => {
    expect(questBoardQuerySchema.parse({
      mode: "FIRST_COME_FIRST_SERVED",
      participation: "SINGLE",
      minQuestReward: "100.50",
      maxQuestReward: "700000",
      maxDurationMinutes: "60",
      limit: "20",
    })).toEqual(expect.objectContaining({
      minQuestReward: 100.5,
      maxQuestReward: 700000,
      maxDurationMinutes: 60,
      limit: 20,
    }));
  });
});
