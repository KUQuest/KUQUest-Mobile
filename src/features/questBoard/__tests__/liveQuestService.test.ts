import { liveQuestService } from "../liveQuestService";
import { questApi } from "@/api/QuestApi";
import type { CreateQuestV2Payload } from "@/api/QuestApi";

jest.mock("@/api/QuestApi", () => ({
  createQuestIdempotencyKey: jest.fn(() => "create-key-1"),
  questApi: {
    createQuest: jest.fn(),
    editQuest: jest.fn(),
    getPublishCheck: jest.fn(),
    publishQuest: jest.fn(),
    getDetail: jest.fn(),
    getPublicDetail: jest.fn(),
    getParticipationDetail: jest.fn(),
    uploadQuestImages: jest.fn(),
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

  it("loads public quest detail when hirer getDetail fails", async () => {
    mockedQuestApi.getDetail.mockRejectedValue(new Error("Not found"));
    mockedQuestApi.getPublicDetail.mockResolvedValue({
      id: "quest-public-1",
      title: "Public quest",
      description: "Description",
      condition: { items: [{ id: "c1", text: "Condition 1" }] },
      tag: { id: "tag-1", name: "Design" },
      mode: "FIRST_COME_FIRST_SERVED",
      participation: "SINGLE",
      state: "QUEST_OPEN",
      questReward: 150,
      headcount: 1,
      activeWorkerCount: 0,
      startTime: "2026-09-16T10:00:00+07:00",
      dueAt: "2026-09-16T12:00:00+07:00",
      proofRequired: true,
      hirerName: "John Hirer",
      locations: [{ label: "Library" }],
      images: [
        {
          imageId: "img-1",
          position: 0,
          url: "https://example.test/img.jpg",
          urlExpiresAt: "2026-09-17T00:00:00Z",
        },
      ],
    } as never);

    const result = await liveQuestService.getQuestDetail("quest-public-1");
    expect(result.id).toBe("quest-public-1");
    expect(result.creator.name).toBe("John Hirer");
    expect(result.rewardSatang).toBe(15000);
    expect(result.imageUris).toEqual(["https://example.test/img.jpg"]);
    expect(mockedQuestApi.getDetail).toHaveBeenCalledWith("quest-public-1");
    expect(mockedQuestApi.getPublicDetail).toHaveBeenCalledWith(
      "quest-public-1"
    );
  });

  it("loads participation quest detail when both hirer and public detail fail", async () => {
    mockedQuestApi.getDetail.mockRejectedValue(new Error("Not found"));
    mockedQuestApi.getPublicDetail.mockRejectedValue(new Error("Not open"));
    mockedQuestApi.getParticipationDetail.mockResolvedValue({
      id: "quest-part-1",
      title: "In-progress quest",
      description: "Description",
      condition: { items: [{ id: "c1", text: "Condition 1" }] },
      tag: null,
      mode: "FIRST_COME_FIRST_SERVED",
      participation: "SINGLE",
      state: "QUEST_IN_PROGRESS",
      questReward: 300,
      headcount: 1,
      activeWorkerCount: 1,
      startTime: "2026-09-16T10:00:00+07:00",
      dueAt: null,
      proofRequired: false,
      hirerName: "Alice Hirer",
      locations: [],
      images: [],
      assignment: {
        status: "ASSIGNMENT_ACTIVE",
        startedAt: "2026-09-16T10:00:00Z",
      },
      capabilities: { canViewOnly: false },
    } as never);

    const result = await liveQuestService.getQuestDetail("quest-part-1");
    expect(result.id).toBe("quest-part-1");
    expect(result.creator.name).toBe("Alice Hirer");
    expect(result.rewardSatang).toBe(30000);
    expect(mockedQuestApi.getParticipationDetail).toHaveBeenCalledWith(
      "quest-part-1"
    );
  });

  it("uploads images through questApi.uploadQuestImages", async () => {
    mockedQuestApi.uploadQuestImages.mockResolvedValue([
      {
        imageId: "img-1",
        position: 0,
        url: "https://example.test/img.jpg",
        urlExpiresAt: "2026-09-17T00:00:00Z",
      },
    ] as never);

    const images = await liveQuestService.uploadImages("quest-1", [
      "file:///tmp/img1.jpg",
    ]);
    expect(images).toHaveLength(1);
    expect(mockedQuestApi.uploadQuestImages).toHaveBeenCalledWith(
      "quest-1",
      [{ uri: "file:///tmp/img1.jpg" }],
      expect.any(String)
    );
  });

  it("edits a draft quest via questApi.editQuest", async () => {
    mockedQuestApi.editQuest.mockResolvedValue({
      id: "quest-1",
      version: 2,
    } as never);

    const updated = await liveQuestService.editQuest(
      "quest-1",
      1,
      { title: "Updated Title" },
      "idem-1"
    );
    expect(updated.id).toBe("quest-1");
    expect(mockedQuestApi.editQuest).toHaveBeenCalledWith(
      "quest-1",
      1,
      { title: "Updated Title" },
      "idem-1"
    );
  });
});
