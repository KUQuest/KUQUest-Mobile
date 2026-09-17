import { ApiClient } from "../ApiClient";
import { QuestApi } from "../QuestApi";

jest.mock("expo-file-system", () => ({
  File: class MockFile extends Blob {
    readonly uri: string;
    constructor(uri: string) {
      super();
      this.uri = uri;
    }
  },
}));
describe("QuestApi", () => {
  let fetchMock: jest.Mock;
  let api: QuestApi;

  beforeEach(() => {
    fetchMock = jest.fn();
    const client = new ApiClient({
      baseUrl: "https://api.example.test",
      fetchImpl: fetchMock as unknown as typeof fetch,
      cookieProvider: () => "better-auth.session_token=test-token",
    });
    api = new QuestApi(client);
  });

  const detailResponse = {
    success: true,
    data: {
      id: "quest-1",
      version: 1,
      title: "Test quest",
      description: "Complete the test quest.",
      condition: { items: [{ position: 0, text: "Submit the result." }] },
      tag: { id: "tag-1", name: "Design" },
      mode: "FIRST_COME_FIRST_SERVED",
      participation: "SINGLE",
      state: "QUEST_OPEN",
      questFundingTotal: 100,
      headcount: 1,
      startTime: "2026-09-15T10:00:00+07:00",
      dueAt: "2026-09-15T12:00:00+07:00",
      proofRequired: true,
      locations: [{ label: "Campus Library" }],
      images: [],
    },
  } as const;

  const publishResponse = {
    success: true,
    data: {
      quest: detailResponse.data,
      questEscrow: {
        reservationId: "reservation-1",
        questFundingTotal: 100,
        questFundingTotalSatang: 10000,
        questReward: 98.04,
        questRewardSatang: 9804,
        platformFee: 1.96,
        platformFeeSatang: 196,
        escrowRequirement: 100,
        escrowRequirementSatang: 10000,
        headcount: 1,
        platformFeeBps: 200,
        feeRoundingMode: "UP",
        policyRevisionId: "policy-1",
        policyRevision: 1,
      },
    },
  } as const;

  it("lists quest board cards with query parameters", async () => {
    const data = {
      success: true,
      data: {
        items: [
          {
            id: "quest-1",
            title: "Test quest",
            questReward: 100,
            tag: { id: "tag-1", name: "Design" },
            mode: "FIRST_COME_FIRST_SERVED",
            participation: "SINGLE",
            headcount: 1,
            activeWorkerCount: 0,
            startTime: "2026-09-15T10:00:00+07:00",
            dueAt: "2026-09-15T12:00:00+07:00",
            hirerName: "Hirer Test",
            location: "Campus Library",
          },
        ],
        nextCursor: null,
      },
    };

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(data),
    });

    const result = await api.listBoard({ tagId: "tag-1", q: "Test" });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe("Test quest");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v2/quests?tagId=tag-1&q=Test",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("creates a Quest draft through the v2 API contract", async () => {
    const payload = {
      title: "Test quest",
      description: "Complete the test quest.",
      condition: { items: ["Submit the result."] },
      mode: "FIRST_COME_FIRST_SERVED" as const,
      participation: "SINGLE" as const,
      questFundingTotal: 100,
      headcount: 1,
      startTime: "2026-09-15T10:00:00+07:00",
      dueAt: "2026-09-15T12:00:00+07:00",
      tagId: "tag-1",
      proofRequired: true,
      locations: [{ label: "Campus Library" }],
    };

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(detailResponse),
    });
    const result = await api.createQuest(payload);

    expect(result.id).toBe("quest-1");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v2/quests",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "Idempotency-Key": expect.any(String),
        }),
      })
    );
  });

  it("edits a quest draft with If-Match and explicit idempotency key", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(detailResponse),
    });

    const result = await api.editQuest(
      "quest-1",
      1,
      { title: "Updated Title" },
      "idem-edit-1"
    );

    expect(result.id).toBe("quest-1");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v2/quests/quest-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ title: "Updated Title" }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "Idempotency-Key": "idem-edit-1",
          "If-Match": "1",
        }),
      })
    );
  });

  it("generates an idempotency key when editing without one", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () =>
        JSON.stringify({
          ...detailResponse,
          data: { ...detailResponse.data, version: 2 },
        }),
    });

    const result = await api.editQuest("quest-1", 2, {
      questFundingTotal: 600,
    });

    expect(result.version).toBe(2);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v2/quests/quest-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ questFundingTotal: 600 }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "Idempotency-Key": expect.any(String),
          "If-Match": "2",
        }),
      })
    );
  });

  it("publishes a Quest with an idempotency key", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(publishResponse),
    });

    const result = await api.publishQuest("quest-1");

    expect(result.state).toBe("QUEST_OPEN");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v2/quests/quest-1/publish",
      expect.objectContaining({
        method: "POST",
        body: "{}",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "Idempotency-Key": expect.any(String),
        }),
      })
    );
  });

  it("fetches server publish check validation", async () => {
    const data = {
      success: true,
      data: {
        questFundingTotalSatang: 10000,
        questRewardSatang: 9804,
        platformFeeSatang: 196,
        escrowRequirementSatang: 10000,
        headcount: 1,
        platformFeeBps: 200,
        feeRoundingMode: "UP",
        policyRevisionId: "policy-1",
        policyRevision: 1,
        blockingReasons: [],
        warnings: [],
        canPublish: true,
        questFundingTotal: 100,
        questReward: 98.04,
        platformFee: 1.96,
        escrowRequirement: 100,
      },
    };

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(data),
    });

    const check = await api.getPublishCheck("quest-1");

    expect(check.canPublish).toBe(true);
    expect(check.blockingReasons).toEqual([]);
    expect(check.escrowRequirementSatang).toBe(10000);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v2/quests/quest-1/publish-check",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("lists worker assignments from /api/v2/assignments/mine", async () => {
    const data = {
      success: true,
      data: {
        items: [
          {
            id: "assign-1",
            questId: "quest-1",
            workerId: "worker-1",
            state: "ASSIGNMENT_ACTIVE",
            questState: "QUEST_IN_PROGRESS",
            startedAt: "2026-09-15T10:00:00Z",
            createdAt: "2026-09-15T09:00:00Z",
          },
        ],
      },
    };

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(data),
    });

    const assignments = await api.listMyAssignments();
    expect(assignments).toHaveLength(1);
    expect(assignments[0].state).toBe("ASSIGNMENT_ACTIVE");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v2/assignments/mine",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("retrieves public quest detail from /api/v2/quests/:id/public", async () => {
    const publicData = {
      success: true,
      data: {
        id: "quest-public-1",
        title: "Public quest",
        description: "Public description",
        condition: { items: [{ position: 0, text: "Do the work." }] },
        tag: { id: "tag-1", name: "Design" },
        mode: "FIRST_COME_FIRST_SERVED",
        participation: "SINGLE",
        state: "QUEST_OPEN",
        questReward: 100,
        headcount: 1,
        activeWorkerCount: 0,
        startTime: "2026-09-15T10:00:00+07:00",
        dueAt: "2026-09-15T12:00:00+07:00",
        proofRequired: false,
        hirerName: "Hirer One",
        locations: [{ label: "Campus Library" }],
        images: [
          {
            imageId: "img-1",
            position: 0,
            url: "https://example.test/img1.jpg",
            urlExpiresAt: "2026-09-16T12:00:00Z",
          },
        ],
      },
    };

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(publicData),
    });

    const detail = await api.getPublicDetail("quest-public-1");
    expect(detail.id).toBe("quest-public-1");
    expect(detail.hirerName).toBe("Hirer One");
    expect(detail.questReward).toBe(100);
    expect(detail.images).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v2/quests/quest-public-1/public",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("retrieves participation quest detail from /api/v2/quests/:id/participation", async () => {
    const participationData = {
      success: true,
      data: {
        id: "quest-worker-1",
        title: "Assigned quest",
        description: "Worker description",
        condition: { items: [{ position: 0, text: "Do the work." }] },
        tag: { id: "tag-1", name: "Design" },
        mode: "FIRST_COME_FIRST_SERVED",
        participation: "SINGLE",
        state: "QUEST_IN_PROGRESS",
        questReward: 200,
        headcount: 1,
        activeWorkerCount: 1,
        startTime: "2026-09-15T10:00:00+07:00",
        dueAt: "2026-09-15T12:00:00+07:00",
        proofRequired: true,
        hirerName: "Hirer Two",
        locations: [],
        images: [],
        assignment: {
          status: "ASSIGNMENT_ACTIVE",
          startedAt: "2026-09-15T10:00:00Z",
        },
        capabilities: {
          canViewOnly: false,
        },
      },
    };

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(participationData),
    });

    const detail = await api.getParticipationDetail("quest-worker-1");
    expect(detail.id).toBe("quest-worker-1");
    expect(detail.assignment?.status).toBe("ASSIGNMENT_ACTIVE");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v2/quests/quest-worker-1/participation",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("uploads quest images with idempotency key", async () => {
    const uploadResponse = {
      success: true,
      data: {
        images: [
          {
            imageId: "img-new-1",
            fileId: "file-new-1",
            position: 0,
            url: "https://example.test/uploaded.jpg",
            urlExpiresAt: "2026-09-16T12:00:00Z",
          },
        ],
      },
    };

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(uploadResponse),
    });

    const images = await api.uploadQuestImages(
      "quest-1",
      [{ uri: "file:///tmp/image.png", name: "test.png", type: "image/png" }],
      "idem-1"
    );

    expect(images).toHaveLength(1);
    expect(images[0].imageId).toBe("img-new-1");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v2/quests/quest-1/images",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Idempotency-Key": "idem-1",
        }),
      })
    );
  });

  it("parses live tags response correctly", async () => {
    const data = {
      success: true,
      data: [
        { id: "tag-1", name: "Content", createdAt: "2026-08-01T00:00:00.000Z" },
        { id: "tag-2", name: "Frontend" },
      ],
    };

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(data),
    });

    const tags = await api.listTags();

    expect(tags).toEqual([
      { id: "tag-1", name: "Content", createdAt: "2026-08-01T00:00:00.000Z" },
      { id: "tag-2", name: "Frontend" },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/tags",
      expect.objectContaining({ method: "GET" })
    );
  });
});
