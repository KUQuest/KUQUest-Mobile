import { liveQuestService } from "../liveQuestService";
import { questApi } from "@/api/QuestApi";
import type { CreateQuestV2Payload } from "@/api/QuestApi";

jest.mock("@/api/QuestApi", () => ({
  createQuestIdempotencyKey: jest.fn(() => "create-key-1"),
  questApi: {
    createQuest: jest.fn(),
    getPublishCheck: jest.fn(),
    publishQuest: jest.fn(),
  },
}));

const mockedQuestApi = questApi as jest.Mocked<typeof questApi>;

const payload: CreateQuestV2Payload = {
  title: "Clean the library",
  description: "Clean the shared library.",
  condition: { items: ["The library is clean."] },
  mode: "FIRST_COME_FIRST_SERVED",
  participation: "SINGLE",
  questFundingTotal: 100,
  headcount: 1,
  startTime: "2099-08-26T09:00:00+07:00",
  dueAt: "2099-08-27T12:00:00+07:00",
  tagId: "tag-library",
  proofRequired: true,
  locations: [{ label: "Main library" }],
};

describe("LiveQuestService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a server Quest and publishes it with the supplied idempotency key", async () => {
    mockedQuestApi.createQuest.mockResolvedValue({ id: "quest-1" } as never);
    mockedQuestApi.publishQuest.mockResolvedValue({
      state: "QUEST_OPEN",
    } as never);

    await expect(
      liveQuestService.createAndPublishQuest(payload, "publish-key-1")
    ).resolves.toMatchObject({ state: "QUEST_OPEN" });

    expect(mockedQuestApi.createQuest).toHaveBeenCalledWith(
      payload,
      expect.any(String)
    );
    expect(mockedQuestApi.publishQuest).toHaveBeenCalledWith(
      "quest-1",
      "publish-key-1"
    );
  });

  it("loads the server publish check for a created Quest", async () => {
    mockedQuestApi.getPublishCheck.mockResolvedValue({
      canPublish: true,
    } as never);

    await expect(
      liveQuestService.getPublishCheck("quest-1")
    ).resolves.toMatchObject({ canPublish: true });

    expect(mockedQuestApi.getPublishCheck).toHaveBeenCalledWith("quest-1");
  });

  it("exposes separate create and publish calls for safe publish retries", async () => {
    mockedQuestApi.createQuest.mockResolvedValue({ id: "quest-2" } as never);
    mockedQuestApi.publishQuest.mockResolvedValue({
      state: "QUEST_OPEN",
    } as never);

    const created = await liveQuestService.createQuest(payload, "create-key-2");
    await liveQuestService.publishQuest("quest-2", "publish-key-2");

    expect(created.id).toBe("quest-2");
    expect(mockedQuestApi.createQuest).toHaveBeenCalledWith(
      payload,
      "create-key-2"
    );
    expect(mockedQuestApi.publishQuest).toHaveBeenCalledWith(
      "quest-2",
      "publish-key-2"
    );
  });
});
