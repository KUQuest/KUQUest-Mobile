import { ApiClient } from "../ApiClient";
import { QuestApi } from "../QuestApi";

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
          "idempotency-key": expect.any(String),
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
          "idempotency-key": expect.any(String),
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
});
