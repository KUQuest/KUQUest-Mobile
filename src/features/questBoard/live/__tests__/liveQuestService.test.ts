import { liveQuestService } from "../liveQuestService";
import { ApiError } from "@/api/ApiClient";
import { questApi } from "@/api/QuestApi";
import { chatApi } from "@/api/ChatApi";
import type { CreateQuestV2Payload } from "@/api/QuestApi";
import type { QuestV2Assignment } from "@/api/questV2Contracts";

jest.mock("@/api/QuestApi", () => ({
  createQuestIdempotencyKey: jest.fn(() => "create-key-1"),
  questApi: {
    client: {
      requestJson: jest.fn(),
    },
    createQuest: jest.fn(),
    editQuest: jest.fn(),
    getPublishCheck: jest.fn(),
    publishQuest: jest.fn(),
    getDetail: jest.fn(),
    getPublicDetail: jest.fn(),
    getParticipationDetail: jest.fn(),
    uploadQuestImages: jest.fn(),
    joinQuest: jest.fn(),
    rejectCandidateApplication: jest.fn(),
    rejectCandidateTeam: jest.fn(),
    listMyAssignments: jest.fn(),
    listQuestAssignments: jest.fn(),
    listApplications: jest.fn(),
    listCandidateTeams: jest.fn(),
    createCandidateTeam: jest.fn(),
    getUnderfilled: jest.fn(),
    listProofSubmissions: jest.fn(),
  },
}));

jest.mock("@/api/ChatApi", () => ({
  chatApi: {
    createCandidateInquiry: jest.fn(),
    listConversations: jest.fn(),
  },
}));

jest.mock("@/features/auth/AuthService", () => ({
  authService: {
    getStudentApi: jest.fn(() => Promise.reject(new Error("offline"))),
  },
}));

const mockedQuestApi = questApi as jest.Mocked<typeof questApi>;
const mockedChatApi = chatApi as jest.Mocked<typeof chatApi>;

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
  it("calls questApi.joinQuest with questId and idempotencyKey", async () => {
    const assignment = { id: "assign-1", status: "ASSIGNMENT_ACTIVE" };
    mockedQuestApi.joinQuest.mockResolvedValue(assignment as never);

    const res = await liveQuestService.joinQuest("quest-join-1");
    expect(res).toBe(assignment);
    expect(mockedQuestApi.joinQuest).toHaveBeenCalledWith(
      "quest-join-1",
      "create-key-1"
    );
  });

  it("resolves and caches hirer participant from candidate-inquiries endpoint", async () => {
    mockedChatApi.createCandidateInquiry.mockResolvedValue({
      participants: [
        {
          id: "worker-1",
          role: "PROSPECTIVE_WORKER",
          displayName: "Worker Bob",
        },
        { id: "hirer-1", role: "HIRER", displayName: "Hirer Alice" },
      ],
    } as never);

    const hirer = await liveQuestService.getHirerParticipant("quest-hirer-1");
    expect(hirer).toEqual({ id: "hirer-1", displayName: "Hirer Alice" });
    expect(mockedChatApi.createCandidateInquiry).toHaveBeenCalledWith(
      "quest-hirer-1"
    );

    // Cached subsequent call
    const cached = await liveQuestService.getHirerParticipant("quest-hirer-1");
    expect(cached).toEqual({ id: "hirer-1", displayName: "Hirer Alice" });
    expect(mockedChatApi.createCandidateInquiry).toHaveBeenCalledTimes(1);
  });

  it("returns null when inquiry fails or has no hirer participant", async () => {
    mockedChatApi.createCandidateInquiry.mockRejectedValueOnce(
      new Error("Network error")
    );

    const hirer =
      await liveQuestService.getHirerParticipant("quest-hirer-fail");
    expect(hirer).toBeNull();
  });
  it("allows a Hirer to read and write an active Work Conversation", async () => {
    mockedQuestApi.getDetail.mockResolvedValue({
      id: "quest-work-1",
      title: "Work Quest",
      description: "Coordinate the work.",
      condition: { items: [{ id: "condition-1", text: "Complete the work." }] },
      tag: null,
      mode: "FIRST_COME_FIRST_SERVED",
      participation: "SINGLE",
      state: "QUEST_IN_PROGRESS",
      questReward: 100,
      headcount: 1,
      activeWorkerCount: 1,
      startTime: "2099-08-26T09:00:00+07:00",
      dueAt: "2099-08-27T12:00:00+07:00",
      proofRequired: false,
      hirerName: "Hirer Alice",
      locations: [],
      images: [],
    } as never);
    mockedQuestApi.listQuestAssignments.mockResolvedValue([]);
    mockedQuestApi.listApplications.mockResolvedValue([]);
    mockedQuestApi.listCandidateTeams.mockResolvedValue([]);
    mockedQuestApi.getUnderfilled.mockResolvedValue(null as never);
    mockedQuestApi.listProofSubmissions.mockResolvedValue([]);
    mockedChatApi.listConversations.mockResolvedValue({
      items: [
        {
          id: "conversation-work-1",
          type: "CONVERSATION_WORK",
          quest: {
            id: "quest-work-1",
            title: "Work Quest",
            status: "QUEST_IN_PROGRESS",
          },
          latestMessage: null,
          lastActivityAt: null,
          archived: false,
          readOnly: false,
          unreadCount: 0,
        },
      ],
      nextCursor: null,
    } as never);

    const snapshot = await liveQuestService.getLiveSnapshot(
      "quest-work-1",
      "hirer-1"
    );

    expect(snapshot.capabilities).toMatchObject({
      canReadWorkChat: true,
      canWriteWorkChat: true,
    });
  });
  it("lets a non-member join by invite before startTime only", async () => {
    mockedQuestApi.getDetail.mockRejectedValue(new Error("not the Hirer"));
    mockedQuestApi.getPublicDetail.mockImplementation(
      async () =>
        ({
          id: "quest-join-1",
          title: "Join Quest",
          description: "Join a forming team.",
          condition: { items: [{ id: "condition-1", text: "Join the team." }] },
          tag: null,
          mode: "CANDIDATE",
          participation: "GROUP",
          state: "QUEST_OPEN",
          questReward: 100,
          headcount: 3,
          activeWorkerCount: 0,
          startTime: new Date(Date.now() + 60_000).toISOString(),
          dueAt: null,
          proofRequired: true,
          hirerName: "Hirer Alice",
          locations: [],
          images: [],
        }) as never
    );
    mockedQuestApi.listQuestAssignments.mockResolvedValue([]);
    mockedQuestApi.listApplications.mockResolvedValue([]);
    // A non-member cannot list other Candidate Teams (Server: 404).
    mockedQuestApi.listCandidateTeams.mockRejectedValue(
      new ApiError(404, "QUEST_NOT_FOUND", "Quest not found")
    );
    mockedQuestApi.getUnderfilled.mockResolvedValue(null as never);
    mockedQuestApi.listProofSubmissions.mockResolvedValue([]);
    mockedChatApi.listConversations.mockResolvedValue({
      items: [],
      nextCursor: null,
    } as never);

    const beforeStart = await liveQuestService.getLiveSnapshot(
      "quest-join-1",
      "worker-1"
    );
    expect(beforeStart.capabilities.canJoinTeam).toBe(true);

    mockedQuestApi.getPublicDetail.mockImplementation(
      async () =>
        ({
          id: "quest-join-1",
          title: "Join Quest",
          description: "Join a forming team.",
          condition: { items: [{ id: "condition-1", text: "Join the team." }] },
          tag: null,
          mode: "CANDIDATE",
          participation: "GROUP",
          state: "QUEST_OPEN",
          questReward: 100,
          headcount: 3,
          activeWorkerCount: 0,
          startTime: new Date(Date.now() - 60_000).toISOString(),
          dueAt: null,
          proofRequired: true,
          hirerName: "Hirer Alice",
          locations: [],
          images: [],
        }) as never
    );
    const afterStart = await liveQuestService.getLiveSnapshot(
      "quest-join-1",
      "worker-1"
    );
    expect(afterStart.capabilities.canJoinTeam).toBe(false);
  });

  it("keeps the issued Join Code for the Team Leader after the list read hides it", async () => {
    const expiresAt = new Date(Date.now() + 86_400_000).toISOString();
    const team = {
      id: "team-code-1",
      questId: "quest-code-1",
      leaderId: "leader-1",
      name: "Campus Gardeners",
      headcount: 3,
      state: "TEAM_FORMING" as const,
      joinCode: null,
      joinCodeExpiresAt: expiresAt,
      members: [{ memberId: "leader-1", joinedAt: new Date().toISOString() }],
      submission: null,
      createdAt: new Date().toISOString(),
    };
    mockedQuestApi.createCandidateTeam.mockResolvedValue({
      ...team,
      joinCode: "ABCD2345",
    });
    mockedQuestApi.getDetail.mockRejectedValue(new Error("not the Hirer"));
    mockedQuestApi.getPublicDetail.mockResolvedValue({
      id: "quest-code-1",
      title: "Team Quest",
      description: "Form a team.",
      condition: { items: [{ id: "condition-1", text: "Form a team." }] },
      tag: null,
      mode: "CANDIDATE",
      participation: "GROUP",
      state: "QUEST_OPEN",
      questReward: 100,
      headcount: 3,
      activeWorkerCount: 0,
      startTime: new Date(Date.now() + 60_000).toISOString(),
      dueAt: null,
      proofRequired: true,
      hirerName: "Hirer Alice",
      locations: [],
      images: [],
    } as never);
    mockedQuestApi.listQuestAssignments.mockResolvedValue([]);
    mockedQuestApi.listApplications.mockResolvedValue([]);
    mockedQuestApi.getUnderfilled.mockResolvedValue(null as never);
    mockedQuestApi.listProofSubmissions.mockResolvedValue([]);
    mockedChatApi.listConversations.mockResolvedValue({
      items: [],
      nextCursor: null,
    } as never);

    await liveQuestService.createCandidateTeam("quest-code-1", {
      name: "Campus Gardeners",
      headcount: 3,
    });
    mockedQuestApi.listCandidateTeams.mockResolvedValue([team]);
    const snapshot = await liveQuestService.getLiveSnapshot(
      "quest-code-1",
      "leader-1"
    );
    expect(snapshot.team?.joinCode).toBe("ABCD2345");

    mockedQuestApi.listCandidateTeams.mockResolvedValue([
      {
        ...team,
        joinCodeExpiresAt: new Date(Date.now() + 90_000_000).toISOString(),
      },
    ]);
    const regeneratedElsewhere = await liveQuestService.getLiveSnapshot(
      "quest-code-1",
      "leader-1"
    );
    expect(regeneratedElsewhere.team?.joinCode).toBeNull();
  });

  it("rejects candidate application through questApi.rejectCandidateApplication", async () => {
    const application = { id: "app-1", state: "APPLICATION_REJECTED" };
    mockedQuestApi.rejectCandidateApplication.mockResolvedValueOnce(
      application as never
    );

    const result = await liveQuestService.rejectApplication(
      "quest-1",
      "app-1",
      "reject-key-1"
    );
    expect(result).toBe(application);
    expect(mockedQuestApi.rejectCandidateApplication).toHaveBeenCalledWith(
      "quest-1",
      "app-1",
      "reject-key-1"
    );
  });

  it("rejects candidate team through questApi.rejectCandidateTeam", async () => {
    const team = { id: "team-1", state: "TEAM_REJECTED" };
    mockedQuestApi.rejectCandidateTeam.mockResolvedValueOnce(team as never);

    const result = await liveQuestService.rejectCandidateTeam(
      "quest-1",
      "team-1",
      "reject-key-2"
    );
    expect(result).toBe(team);
    expect(mockedQuestApi.rejectCandidateTeam).toHaveBeenCalledWith(
      "quest-1",
      "team-1",
      "reject-key-2"
    );
  });

  it("lists worker assignments with optional status filter", async () => {
    const assignments = [{ id: "assign-1", state: "ASSIGNMENT_COMPLETED" }];
    mockedQuestApi.listMyAssignments.mockResolvedValueOnce(
      assignments as never
    );

    const result = await liveQuestService.listMyWorkerAssignments("completed");
    expect(result).toBe(assignments);
    expect(mockedQuestApi.listMyAssignments).toHaveBeenCalledWith("completed");
  });

  describe("Start Work required starter", () => {
    const assignment = (
      workerId: string,
      startedAt: string | null = null
    ): QuestV2Assignment => ({
      id: `assignment-${workerId}`,
      questId: "quest-start-1",
      workerId,
      state: "ASSIGNMENT_ACTIVE",
      questState: "QUEST_ASSIGNED",
      startedAt,
      createdAt: "2099-08-25T09:00:00+07:00",
    });

    async function startCapability({
      mode,
      participation,
      viewerAssignment = assignment("worker-1"),
      leaderId,
    }: {
      mode: "FIRST_COME_FIRST_SERVED" | "CANDIDATE";
      participation: "SINGLE" | "GROUP";
      viewerAssignment?: QuestV2Assignment;
      leaderId?: string;
    }) {
      // A Worker cannot read the Hirer detail; the snapshot falls back to public detail.
      mockedQuestApi.getDetail.mockRejectedValue(new Error("forbidden"));
      mockedQuestApi.getPublicDetail.mockResolvedValue({
        id: "quest-start-1",
        title: "Start Quest",
        description: "Start the work.",
        condition: { items: [{ id: "condition-1", text: "Do the work." }] },
        tag: null,
        mode,
        participation,
        state: "QUEST_ASSIGNED",
        questReward: 100,
        headcount: participation === "GROUP" ? 2 : 1,
        activeWorkerCount: participation === "GROUP" ? 2 : 1,
        startTime: "2099-08-26T09:00:00+07:00",
        dueAt: "2099-08-27T12:00:00+07:00",
        proofRequired: true,
        hirerName: "Hirer Alice",
        locations: [],
        images: [],
      } as never);
      mockedQuestApi.listQuestAssignments.mockResolvedValue([
        viewerAssignment,
        ...(participation === "GROUP" ? [assignment("worker-2")] : []),
      ] as never);
      mockedQuestApi.listApplications.mockResolvedValue([]);
      mockedQuestApi.listCandidateTeams.mockResolvedValue(
        (leaderId
          ? [
              {
                id: "team-1",
                questId: "quest-start-1",
                leaderId,
                name: "Team",
                headcount: 2,
                state: "TEAM_SELECTED",
                members: [{ memberId: "worker-1" }, { memberId: "worker-2" }],
              },
            ]
          : []) as never
      );
      mockedQuestApi.getUnderfilled.mockResolvedValue(null as never);
      mockedQuestApi.listProofSubmissions.mockResolvedValue([]);
      mockedChatApi.listConversations.mockResolvedValue({
        items: [],
        nextCursor: null,
      } as never);

      const snapshot = await liveQuestService.getLiveSnapshot(
        "quest-start-1",
        "worker-1"
      );
      return snapshot.capabilities.canStartWork;
    }

    it("requires the Active Worker of a SINGLE Quest", async () => {
      await expect(
        startCapability({ mode: "CANDIDATE", participation: "SINGLE" })
      ).resolves.toBe(true);
    });

    it("requires every Active Worker of a GROUP FIRST_COME_FIRST_SERVED Quest", async () => {
      await expect(
        startCapability({
          mode: "FIRST_COME_FIRST_SERVED",
          participation: "GROUP",
        })
      ).resolves.toBe(true);
    });

    it("requires only the Team Leader of a GROUP CANDIDATE Quest", async () => {
      await expect(
        startCapability({
          mode: "CANDIDATE",
          participation: "GROUP",
          leaderId: "worker-1",
        })
      ).resolves.toBe(true);
      await expect(
        startCapability({
          mode: "CANDIDATE",
          participation: "GROUP",
          leaderId: "worker-2",
        })
      ).resolves.toBe(false);
    });

    it("stops offering Start Work once the Assignment recorded it", async () => {
      await expect(
        startCapability({
          mode: "FIRST_COME_FIRST_SERVED",
          participation: "GROUP",
          viewerAssignment: assignment("worker-1", "2099-08-26T09:01:00Z"),
        })
      ).resolves.toBe(false);
    });
  });
});
