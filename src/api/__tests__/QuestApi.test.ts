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
      hiddenAt: null,
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
      createdAt: "2026-09-14T10:00:00+07:00",
      updatedAt: "2026-09-14T10:00:00+07:00",
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
  const okJson = (data: unknown) => ({
    ok: true,
    status: 200,
    headers: new Headers({ "content-type": "application/json" }),
    text: async () => JSON.stringify(data),
  });

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
    const result = await api.createQuest(payload, "create-quest-1");

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

    const result = await api.publishQuest("quest-1", "publish-quest-1");

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

  it("cancels a Quest with an idempotency key", async () => {
    fetchMock.mockResolvedValue(
      okJson({
        success: true,
        data: {
          questStatus: "QUEST_CANCELLED",
          outcome: "CANCELLED",
          paidSatang: 0,
          refundedSatang: 10000,
        },
      })
    );

    await expect(api.cancelQuest("quest-1", "cancel-quest-1")).resolves.toEqual(
      {
        questStatus: "QUEST_CANCELLED",
        outcome: "CANCELLED",
        paidSatang: 0,
        refundedSatang: 10000,
      }
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v2/quests/quest-1/cancel",
      expect.objectContaining({
        method: "POST",
        body: "{}",
        headers: expect.objectContaining({
          "Idempotency-Key": "cancel-quest-1",
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

    await api.listMyAssignments("completed");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v2/assignments/mine?status=completed",
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
  it("covers Candidate application lifecycle routes and typed responses", async () => {
    const application = {
      id: "application-1",
      questId: "quest-1",
      memberId: "member-1",
      state: "APPLICATION_APPLIED",
      appliedAt: "2026-09-15T10:00:00Z",
    };
    const assignment = {
      id: "assignment-1",
      questId: "quest-1",
      workerId: "member-1",
      state: "ASSIGNMENT_ACTIVE",
      questState: "QUEST_IN_PROGRESS",
      startedAt: "2026-09-15T10:00:00Z",
      createdAt: "2026-09-15T09:00:00Z",
    };
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.endsWith("/applications") && init?.method === "GET") {
        return Promise.resolve(
          okJson({ success: true, data: { items: [application] } })
        );
      }
      if (url.endsWith("/select")) {
        return Promise.resolve(
          okJson({
            success: true,
            data: {
              assignments: [assignment],
              questState: "QUEST_IN_PROGRESS",
            },
          })
        );
      }
      if (url.endsWith("/withdraw")) {
        return Promise.resolve(
          okJson({
            success: true,
            data: { ...application, state: "APPLICATION_WITHDRAWN" },
          })
        );
      }
      if (url.endsWith("/reject")) {
        return Promise.resolve(
          okJson({
            success: true,
            data: { ...application, state: "APPLICATION_REJECTED" },
          })
        );
      }
      return Promise.resolve(okJson({ success: true, data: application }));
    });

    await expect(api.applyQuest("quest-1", "apply-1")).resolves.toMatchObject({
      id: "application-1",
      state: "APPLICATION_APPLIED",
    });
    await expect(api.listApplications("quest-1")).resolves.toEqual([
      application,
    ]);
    await expect(
      api.getApplication("quest-1", "application-1")
    ).resolves.toEqual(application);
    await expect(
      api.withdrawApplication("quest-1", "application-1", "withdraw-1")
    ).resolves.toMatchObject({
      id: "application-1",
      state: "APPLICATION_WITHDRAWN",
    });
    await expect(
      api.selectApplication("quest-1", "application-1", "select-1")
    ).resolves.toEqual({
      assignments: [assignment],
      questState: "QUEST_IN_PROGRESS",
    });
    await expect(
      api.rejectCandidateApplication("quest-1", "application-1", "reject-1")
    ).resolves.toEqual({
      ...application,
      state: "APPLICATION_REJECTED",
    });

    expect(fetchMock.mock.calls[0]).toEqual([
      "https://api.example.test/api/v2/quests/quest-1/applications",
      expect.objectContaining({
        method: "POST",
        body: "{}",
        headers: expect.objectContaining({ "idempotency-key": "apply-1" }),
      }),
    ]);
    expect(fetchMock.mock.calls[3]).toEqual([
      "https://api.example.test/api/v2/quests/quest-1/applications/application-1/withdraw",
      expect.objectContaining({
        method: "POST",
        body: "{}",
        headers: expect.objectContaining({ "idempotency-key": "withdraw-1" }),
      }),
    ]);
    expect(fetchMock.mock.calls[4]).toEqual([
      "https://api.example.test/api/v2/quests/quest-1/applications/application-1/select",
      expect.objectContaining({
        method: "POST",
        body: "{}",
        headers: expect.objectContaining({ "idempotency-key": "select-1" }),
      }),
    ]);
  });

  it("sends Candidate team mutations with payloads and idempotency keys", async () => {
    const team = {
      id: "team-1",
      questId: "quest-1",
      leaderId: "member-1",
      name: "Design crew",
      headcount: 2,
      state: "TEAM_FORMING",
      joinCode: "JOIN-123",
      joinCodeExpiresAt: "2026-09-16T10:00:00Z",
      members: [{ memberId: "member-1", joinedAt: "2026-09-15T10:00:00Z" }],
      submission: null,
      createdAt: "2026-09-15T09:00:00Z",
    };
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.endsWith("/teams") && init?.method === "GET") {
        return Promise.resolve(
          okJson({ success: true, data: { items: [team] } })
        );
      }
      if (url.endsWith("/reject")) {
        return Promise.resolve(
          okJson({ success: true, data: { ...team, state: "TEAM_REJECTED" } })
        );
      }
      return Promise.resolve(okJson({ success: true, data: team }));
    });

    await expect(
      api.createCandidateTeam(
        "quest-1",
        { name: "Design crew", headcount: 2 },
        "team-create-1"
      )
    ).resolves.toEqual(team);
    await expect(
      api.updateCandidateTeam(
        "quest-1",
        "team-1",
        { name: "Design team" },
        "team-update-1"
      )
    ).resolves.toEqual(team);
    await expect(
      api.joinCandidateTeam("quest-1", "team-1", "JOIN-123", "team-join-1")
    ).resolves.toEqual(team);
    await expect(
      api.submitCandidateTeam(
        "quest-1",
        "team-1",
        { text: "Ready to work", fileIds: ["file-1"] },
        "team-submit-1"
      )
    ).resolves.toEqual(team);
    await expect(api.listCandidateTeams("quest-1")).resolves.toEqual([team]);
    await expect(api.getCandidateTeam("quest-1", "team-1")).resolves.toEqual(
      team
    );
    await expect(
      api.rejectCandidateTeam("quest-1", "team-1", "team-reject-1")
    ).resolves.toEqual({ ...team, state: "TEAM_REJECTED" });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.example.test/api/v2/quests/quest-1/teams",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Design crew", headcount: 2 }),
        headers: expect.objectContaining({
          "idempotency-key": "team-create-1",
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.example.test/api/v2/quests/quest-1/teams/team-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ name: "Design team" }),
        headers: expect.objectContaining({
          "idempotency-key": "team-update-1",
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://api.example.test/api/v2/quests/quest-1/teams/team-1/join",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ joinCode: "JOIN-123" }),
        headers: expect.objectContaining({ "idempotency-key": "team-join-1" }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "https://api.example.test/api/v2/quests/quest-1/teams/team-1/submit",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ text: "Ready to work", fileIds: ["file-1"] }),
        headers: expect.objectContaining({
          "idempotency-key": "team-submit-1",
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      5,
      "https://api.example.test/api/v2/quests/quest-1/teams",
      expect.objectContaining({ method: "GET" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      6,
      "https://api.example.test/api/v2/quests/quest-1/teams/team-1",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("handles underfilled decisions through separate routes", async () => {
    const underfilled = {
      id: "underfilled-1",
      questId: "quest-1",
      questState: "QUEST_IN_PROGRESS",
      state: "UNDERFILLED_DECISION_PENDING",
      activeWorkerCount: 1,
      headcount: 2,
      workerRewardPool: 200,
      questReward: 200,
      dueAt: "2026-09-16T12:00:00Z",
      decision: {
        status: "UNDERFILLED_DECISION_PENDING",
        value: null,
        expiresAt: "2026-09-15T11:00:00Z",
      },
      consent: {
        status: "UNDERFILLED_CONSENT_NOT_STARTED",
        expiresAt: null,
        totalCount: 0,
        acceptedCount: 0,
        declinedCount: 0,
        pendingCount: 0,
      },
      responses: [],
      ownResponse: null,
    };
    fetchMock.mockResolvedValue(okJson({ success: true, data: underfilled }));

    await expect(api.getUnderfilled("quest-1")).resolves.toEqual(underfilled);
    await expect(
      api.decideUnderfilled("quest-1", "PROCEED", "decision-1")
    ).resolves.toEqual(underfilled);
    await expect(
      api.respondUnderfilledConsent("quest-1", "ACCEPT", "consent-1")
    ).resolves.toEqual(underfilled);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.example.test/api/v2/quests/quest-1/underfilled",
      expect.objectContaining({ method: "GET" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.example.test/api/v2/quests/quest-1/underfilled/decision",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ decision: "PROCEED" }),
        headers: expect.objectContaining({ "idempotency-key": "decision-1" }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://api.example.test/api/v2/quests/quest-1/underfilled/consent",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ decision: "ACCEPT" }),
        headers: expect.objectContaining({ "idempotency-key": "consent-1" }),
      })
    );

    // Worker underfilled response (omits responses, ownResponse has no workerId/assignmentId)
    const workerUnderfilled = {
      ...underfilled,
      responses: undefined,
      ownResponse: {
        decision: "ACCEPT",
        questReward: 200,
        respondedAt: "2026-09-15T10:30:00Z",
      },
    };
    fetchMock.mockResolvedValueOnce(
      okJson({ success: true, data: workerUnderfilled })
    );
    await expect(api.getUnderfilled("quest-1")).resolves.toMatchObject({
      id: "underfilled-1",
      ownResponse: { decision: "ACCEPT", questReward: 200 },
    });
  });
  it("uses If-Match with Quest edits and preserves edit-request contracts", async () => {
    const editRequest = {
      requestId: "edit-request-1",
      questId: "quest-1",
      status: "EDIT_REQUEST_PENDING",
      failureCode: null,
      createdAt: "2026-09-15T10:00:00Z",
      expiresAt: "2026-09-15T11:00:00Z",
      appliedAt: null,
      failedAt: null,
      previousCondition: { items: [{ position: 0, text: "Old condition" }] },
      proposedCondition: { items: [{ position: 0, text: "New condition" }] },
      responseSummary: {
        totalCount: 1,
        acceptedCount: 0,
        declinedCount: 0,
        pendingCount: 1,
      },
      responses: [],
      ownResponse: null,
    };
    fetchMock.mockResolvedValue(okJson(detailResponse));

    await expect(
      api.editQuest(
        "quest-1",
        { title: "Updated title" },
        { version: 7, idempotencyKey: "edit-1" }
      )
    ).resolves.toMatchObject({ id: "quest-1" });

    fetchMock.mockResolvedValue(okJson({ success: true, data: editRequest }));
    await expect(
      api.createEditRequest(
        "quest-1",
        { condition: { items: ["New condition"] } },
        "request-1"
      )
    ).resolves.toEqual(editRequest);
    await expect(api.getEditRequest("edit-request-1")).resolves.toEqual(
      editRequest
    );
    await expect(
      api.respondToEditRequest(
        "edit-request-1",
        { decision: "EDIT_RESPONSE_ACCEPTED" },
        "response-1"
      )
    ).resolves.toEqual(editRequest);

    // Worker edit request response (omits responses, ownResponse has no workerId)
    const workerEditRequest = {
      ...editRequest,
      responses: undefined,
      ownResponse: {
        decision: "EDIT_RESPONSE_ACCEPTED",
        reason: null,
        respondedAt: "2026-09-15T10:15:00Z",
      },
    };
    fetchMock.mockResolvedValueOnce(
      okJson({ success: true, data: workerEditRequest })
    );
    await expect(api.getEditRequest("edit-request-1")).resolves.toMatchObject({
      requestId: "edit-request-1",
      ownResponse: { decision: "EDIT_RESPONSE_ACCEPTED" },
    });

    expect(fetchMock.mock.calls[0]).toEqual([
      "https://api.example.test/api/v2/quests/quest-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ title: "Updated title" }),
        headers: expect.objectContaining({
          "idempotency-key": "edit-1",
          "If-Match": "7",
        }),
      }),
    ]);
    expect(fetchMock.mock.calls[1]).toEqual([
      "https://api.example.test/api/v2/quests/quest-1/edit-requests",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ condition: { items: ["New condition"] } }),
        headers: expect.objectContaining({ "idempotency-key": "request-1" }),
      }),
    ]);
    expect(fetchMock.mock.calls[3]).toEqual([
      "https://api.example.test/api/v2/quests/edit-requests/edit-request-1/respond",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          decision: "EDIT_RESPONSE_ACCEPTED",
        }),
        headers: expect.objectContaining({ "idempotency-key": "response-1" }),
      }),
    ]);
  });

  it("covers proof lifecycle transport and typed completion/proof review parsing", async () => {
    const proof = {
      id: "proof-1",
      questId: "quest-1",
      workerId: "worker-1",
      teamId: null,
      submittedByUserId: "user-1",
      description: "Evidence",
      status: "PROOF_PENDING",
      submittedAt: null,
      createdAt: "2026-09-15T10:00:00Z",
      updatedAt: "2026-09-15T10:00:00Z",
      visibility: "FULL",
      fileIds: ["file-1"],
      files: [
        {
          fileId: "file-1",
          contentType: "image/png",
          sizeBytes: 100,
          position: 0,
          uploadStatus: "PROOF_FILE_READY",
          failureCode: null,
        },
      ],
    };
    const proofReview = {
      success: true,
      data: {
        proof: { id: "proof-1", status: "PROOF_APPROVED" },
        questStatus: "QUEST_COMPLETED",
      },
    };
    const deletion = {
      success: true,
      data: { deleted: true, proofSubmissionId: "proof-1" },
    };
    const completion = {
      success: true,
      data: {
        confirmed: true,
        confirmedAt: "2026-09-15T12:00:00Z",
        questStatus: "QUEST_COMPLETED",
      },
    };
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.endsWith("/review")) return Promise.resolve(okJson(proofReview));
      if (url.endsWith("/completion-confirmation"))
        return Promise.resolve(okJson(completion));
      if (
        init?.method === "DELETE" &&
        url.endsWith("/proof-submissions/proof-1")
      ) {
        return Promise.resolve(okJson(deletion));
      }
      if (url.endsWith("/proof-submissions") && init?.method === "GET") {
        return Promise.resolve(
          okJson({ success: true, data: { items: [proof] } })
        );
      }
      return Promise.resolve(okJson({ success: true, data: proof }));
    });

    await expect(
      api.createProofDraft(
        "quest-1",
        {
          assets: [
            {
              uri: "file:///tmp/evidence.png",
              name: "evidence.png",
              type: "image/png",
            },
          ],
          description: "Evidence",
        },
        "proof-create-1"
      )
    ).resolves.toEqual(proof);
    const createInit = fetchMock.mock.calls[0][1] as RequestInit;
    expect(createInit.method).toBe("POST");
    expect(createInit.headers).toEqual(
      expect.objectContaining({ "idempotency-key": "proof-create-1" })
    );
    expect((createInit.body as FormData).get("description")).toBe("Evidence");
    expect((createInit.body as FormData).get("files")).toEqual(
      expect.any(Blob)
    );

    await expect(
      api.updateProofDraft(
        "quest-1",
        "proof-1",
        { description: "Updated evidence", fileIds: ["file-1"] },
        "proof-update-1"
      )
    ).resolves.toEqual(proof);
    await expect(
      api.submitProofDraft("quest-1", "proof-1", "proof-submit-1")
    ).resolves.toEqual(proof);
    await expect(api.listProofSubmissions("quest-1")).resolves.toEqual([proof]);
    await expect(
      api.deleteProofDraft("quest-1", "proof-1", "proof-delete-1")
    ).resolves.toEqual({
      deleted: true,
      proofSubmissionId: "proof-1",
    });
    await expect(
      api.reviewProof(
        "quest-1",
        "proof-1",
        { decision: "PROOF_APPROVED" },
        "proof-review-1"
      )
    ).resolves.toEqual({
      proof: { id: "proof-1", status: "PROOF_APPROVED" },
      questStatus: "QUEST_COMPLETED",
    });
    await expect(
      api.confirmCompletion("quest-1", "completion-1")
    ).resolves.toEqual({
      confirmed: true,
      confirmedAt: "2026-09-15T12:00:00Z",
      questStatus: "QUEST_COMPLETED",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.example.test/api/v2/quests/quest-1/proof-submissions/proof-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          description: "Updated evidence",
          fileIds: ["file-1"],
        }),
        headers: expect.objectContaining({
          "idempotency-key": "proof-update-1",
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      6,
      "https://api.example.test/api/v2/quests/quest-1/proof-submissions/proof-1/review",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ decision: "PROOF_APPROVED" }),
        headers: expect.objectContaining({
          "idempotency-key": "proof-review-1",
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      7,
      "https://api.example.test/api/v2/quests/quest-1/completion-confirmation",
      expect.objectContaining({
        method: "POST",
        body: "{}",
        headers: expect.objectContaining({ "idempotency-key": "completion-1" }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      5,
      "https://api.example.test/api/v2/quests/quest-1/proof-submissions/proof-1",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          "idempotency-key": "proof-delete-1",
        }),
      })
    );
  });
  it("edits an existing proof draft with newly selected multipart files", async () => {
    const proof = {
      id: "proof-1",
      questId: "quest-1",
      workerId: "worker-1",
      teamId: null,
      submittedByUserId: "user-1",
      description: "Updated evidence",
      status: null,
      submittedAt: null,
      createdAt: "2026-09-15T10:00:00Z",
      updatedAt: "2026-09-15T10:00:00Z",
      visibility: "FULL",
      fileIds: ["file-1"],
      files: [
        {
          fileId: "file-1",
          contentType: "image/png",
          sizeBytes: 100,
          position: 0,
          uploadStatus: "PROOF_FILE_READY",
          failureCode: null,
        },
      ],
    };
    fetchMock.mockResolvedValue(okJson({ success: true, data: proof }));

    await expect(
      api.updateProofDraft(
        "quest-1",
        "proof-1",
        {
          assets: [
            {
              uri: "file:///tmp/new-evidence.pdf",
              name: "new-evidence.pdf",
              type: "application/pdf",
            },
          ],
          description: "Updated evidence",
        },
        "proof-file-update-1"
      )
    ).resolves.toEqual(proof);

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(request.method).toBe("PATCH");
    expect(request.headers).toEqual(
      expect.objectContaining({ "idempotency-key": "proof-file-update-1" })
    );
    expect((request.body as FormData).get("description")).toBe(
      "Updated evidence"
    );
    expect((request.body as FormData).get("files")).toEqual(expect.any(Blob));
  });

  it("rejects non-approval reasons longer than 1000 characters", async () => {
    await expect(
      api.reviewProof(
        "quest-1",
        "proof-1",
        {
          decision: "PROOF_NOT_APPROVED",
          reason: "x".repeat(1001),
        },
        "proof-review-too-long"
      )
    ).rejects.toThrow("Reason must be at most 1000 characters");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("creates and updates typed Quest reviews", async () => {
    const review = {
      id: "review-1",
      questId: "quest-1",
      reviewerId: "hirer-1",
      revieweeId: "worker-1",
      rating: 5,
      comment: "Excellent work",
      createdAt: "2026-09-15T12:00:00Z",
      updatedAt: "2026-09-15T12:00:00Z",
    };
    fetchMock.mockResolvedValue(okJson({ success: true, data: review }));

    await expect(
      api.createReview(
        "quest-1",
        { revieweeId: "worker-1", rating: 5, comment: "Excellent work" },
        "review-create-1"
      )
    ).resolves.toEqual(review);
    await expect(
      api.updateReview(
        "quest-1",
        "review-1",
        { rating: 4, comment: "Good work" },
        "review-update-1"
      )
    ).resolves.toEqual(review);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.example.test/api/v2/quests/quest-1/reviews",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          revieweeId: "worker-1",
          rating: 5,
          comment: "Excellent work",
        }),
        headers: expect.objectContaining({
          "idempotency-key": "review-create-1",
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.example.test/api/v2/quests/quest-1/reviews/review-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ rating: 4, comment: "Good work" }),
        headers: expect.objectContaining({
          "idempotency-key": "review-update-1",
        }),
      })
    );
  });
  it("fetches an expiring proof file link from the proof file endpoint", async () => {
    const fileLink = {
      fileId: "file-1",
      contentType: "image/png",
      sizeBytes: 100,
      position: 0,
      url: "https://files.example.test/proof-1.png?token=temporary",
      urlExpiresAt: "2026-09-24T12:00:00Z",
    };
    fetchMock.mockResolvedValue(okJson({ success: true, data: fileLink }));

    await expect(
      api.getProofFileLink("quest-1", "proof-1", "file-1")
    ).resolves.toEqual(fileLink);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v2/quests/quest-1/proof-submissions/proof-1/files/file-1",
      expect.objectContaining({ method: "GET" })
    );
  });
});
