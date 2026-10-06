import { resetServerClock, syncServerClock } from "@/api/serverClock";
import { liveQuestService } from "../liveQuestService";
import { ApiError } from "@/api/ApiClient";
import { questApi } from "@/api/QuestApi";
import { chatApi } from "@/api/ChatApi";
import type { CreateQuestV2Payload } from "@/api/QuestApi";
import type {
  QuestV2Assignment,
  QuestV2BoardCard,
} from "@/api/questV2Contracts";

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
    listBoard: jest.fn(),
    listQuestReviews: jest.fn(),
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
    getEditRequest: jest.fn(),
  },
}));

jest.mock("@/api/ChatApi", () => ({
  chatApi: {
    createCandidateInquiry: jest.fn(),
    listConversations: jest.fn(),
    listParticipants: jest.fn(),
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
  it("maps Board Hirer profile ids to ownerStudentId and leaves absent profiles empty", async () => {
    const cards: QuestV2BoardCard[] = [
      {
        id: "quest-1",
        title: "Find Hirer id",
        questReward: 50,
        tag: null,
        mode: "FIRST_COME_FIRST_SERVED",
        participation: "SINGLE",
        headcount: 1,
        activeWorkerCount: 0,
        startTime: "2026-09-16T10:00:00+07:00",
        dueAt: null,
        hirerName: "Hirer One",
        hirerProfile: {
          id: "00000000-0000-4000-8000-000000000001",
          version: 1,
          firstName: "Hirer",
          lastName: "One",
          bio: null,
          academicYear: null,
          department: null,
          avatar: null,
          occupation: null,
        },
        location: null,
      },
      {
        id: "quest-2",
        title: "No profile",
        questReward: 50,
        tag: null,
        mode: "FIRST_COME_FIRST_SERVED",
        participation: "SINGLE",
        headcount: 1,
        activeWorkerCount: 0,
        startTime: "2026-09-16T10:00:00+07:00",
        dueAt: null,
        hirerName: "Hirer Two",
        location: null,
      },
    ];
    mockedQuestApi.listBoard.mockResolvedValue({
      items: cards,
      nextCursor: null,
    });

    const quests = await liveQuestService.listBoardQuests();

    expect(quests.map((quest) => quest.ownerStudentId)).toEqual([
      "00000000-0000-4000-8000-000000000001",
      "",
    ]);
  });

  it("returns the Quest's reviews to the caller", async () => {
    const reviews = [
      {
        id: "review-1",
        questId: "quest-1",
        reviewerId: "worker-1",
        revieweeId: "hirer-1",
        rating: 5,
        comment: null,
        createdAt: "2026-09-15T12:00:00Z",
        updatedAt: "2026-09-15T12:00:00Z",
      },
    ];
    mockedQuestApi.listQuestReviews.mockResolvedValue(reviews);

    await expect(
      liveQuestService.listQuestReviews("quest-1", "worker-1")
    ).resolves.toEqual(reviews);
    expect(mockedQuestApi.listQuestReviews).toHaveBeenCalledWith("quest-1");
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

  it("uses Work Conversation Workers for the FCFS group roster and falls back if participants fail", async () => {
    mockedQuestApi.getDetail.mockRejectedValue(new Error("not hirer"));
    mockedQuestApi.getPublicDetail.mockResolvedValue({
      id: "quest-team",
      title: "Team Quest",
      description: "Coordinate the work.",
      condition: { items: [{ id: "condition-1", text: "Complete work." }] },
      tag: null,
      mode: "FIRST_COME_FIRST_SERVED",
      participation: "GROUP",
      state: "QUEST_IN_PROGRESS",
      questReward: 100,
      headcount: 3,
      activeWorkerCount: 3,
      startTime: "2099-08-26T09:00:00+07:00",
      dueAt: "2099-08-27T12:00:00+07:00",
      proofRequired: false,
      hirerName: "Hirer Alice",
      locations: [],
      images: [],
    } as never);
    mockedQuestApi.listQuestAssignments.mockResolvedValue([
      {
        id: "assignment-worker-1",
        questId: "quest-team",
        workerId: "worker-1",
        state: "ASSIGNMENT_ACTIVE",
        questState: "QUEST_IN_PROGRESS",
        startedAt: null,
        createdAt: "2099-08-26T09:00:00+07:00",
      },
    ]);
    mockedQuestApi.listApplications.mockResolvedValue([]);
    mockedQuestApi.listCandidateTeams.mockResolvedValue([]);
    mockedQuestApi.getUnderfilled.mockResolvedValue(null as never);
    mockedQuestApi.listProofSubmissions.mockResolvedValue([]);
    mockedChatApi.listConversations.mockResolvedValue({
      items: [
        {
          id: "conversation-team",
          type: "CONVERSATION_WORK",
          quest: {
            id: "quest-team",
            title: "Team Quest",
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
    mockedChatApi.listParticipants.mockResolvedValue([
      {
        id: "hirer-1",
        role: "HIRER",
        displayName: "Hirer Alice",
        avatar: null,
      },
      {
        id: "worker-1",
        role: "WORKER",
        displayName: "Worker One",
        avatar: {
          fileId: "11111111-1111-4111-8111-111111111111",
          url: "https://cdn.example/one.png",
        },
      },
      {
        id: "worker-2",
        role: "WORKER",
        displayName: "Worker Two",
        avatar: null,
      },
      {
        id: "worker-3",
        role: "WORKER",
        displayName: "Worker Three",
        avatar: null,
      },
    ]);

    const snapshot = await liveQuestService.getLiveSnapshot(
      "quest-team",
      "worker-1"
    );

    expect(snapshot.participants).toEqual([
      {
        id: "worker-1",
        displayName: "Worker One",
        avatarUrl: "https://cdn.example/one.png",
        avatarFileId: "11111111-1111-4111-8111-111111111111",
      },
      { id: "worker-2", displayName: "Worker Two" },
      { id: "worker-3", displayName: "Worker Three" },
    ]);

    mockedChatApi.listParticipants.mockRejectedValueOnce(
      new Error("participants unavailable")
    );
    const fallbackSnapshot = await liveQuestService.getLiveSnapshot(
      "quest-team",
      "worker-1"
    );

    expect(fallbackSnapshot.participants).toEqual([
      { id: "worker-1", displayName: "worker-1" },
    ]);
  });
  describe("pending Quest Edit Request discovery", () => {
    const pendingEdit = {
      requestId: "edit-request-1",
      questId: "quest-edit-1",
      status: "EDIT_REQUEST_PENDING",
      failureCode: null,
      createdAt: "2099-08-26T09:00:00+07:00",
      expiresAt: "2099-08-26T09:10:00+07:00",
      appliedAt: null,
      failedAt: null,
      previousCondition: { items: [{ position: 0, text: "Old" }] },
      proposedCondition: { items: [{ position: 0, text: "New" }] },
      responseSummary: {
        totalCount: 1,
        acceptedCount: 0,
        declinedCount: 0,
        pendingCount: 1,
      },
      ownResponse: null,
    };

    async function loadWorkerSnapshot(
      pendingEditRequest:
        { requestId: string; expiresAt: string } | null | undefined,
      options: { editRequestId?: string } = {}
    ) {
      mockedQuestApi.getDetail.mockRejectedValue(new Error("forbidden"));
      mockedQuestApi.getPublicDetail.mockRejectedValue(new Error("not open"));
      mockedQuestApi.getParticipationDetail.mockResolvedValue({
        id: "quest-edit-1",
        title: "Assigned Quest",
        description: null,
        condition: { items: [{ id: "condition-1", text: "Old" }] },
        tag: null,
        mode: "FIRST_COME_FIRST_SERVED",
        participation: "SINGLE",
        state: "QUEST_ASSIGNED",
        questReward: 100,
        headcount: 1,
        activeWorkerCount: 1,
        startTime: "2099-08-26T09:00:00+07:00",
        dueAt: "2099-08-27T12:00:00+07:00",
        proofRequired: true,
        hirerName: "Hirer Alice",
        locations: [],
        images: [],
        assignment: { status: "ASSIGNMENT_ACTIVE", startedAt: null },
        capabilities: { canViewOnly: false },
        ...(pendingEditRequest === undefined ? {} : { pendingEditRequest }),
      } as never);
      mockedQuestApi.listQuestAssignments.mockResolvedValue([
        {
          id: "assignment-worker-1",
          questId: "quest-edit-1",
          workerId: "worker-1",
          state: "ASSIGNMENT_ACTIVE",
          questState: "QUEST_ASSIGNED",
          startedAt: null,
          createdAt: "2099-08-25T09:00:00+07:00",
        },
      ] as never);
      mockedQuestApi.listApplications.mockResolvedValue([]);
      mockedQuestApi.listCandidateTeams.mockResolvedValue([]);
      mockedQuestApi.getUnderfilled.mockResolvedValue(null as never);
      mockedQuestApi.listProofSubmissions.mockResolvedValue([]);
      mockedQuestApi.getEditRequest.mockResolvedValue(pendingEdit as never);
      mockedChatApi.listConversations.mockResolvedValue({
        items: [],
        nextCursor: null,
      } as never);

      return liveQuestService.getLiveSnapshot(
        "quest-edit-1",
        "worker-1",
        options
      );
    }

    it("loads the pending request the participation detail names without a realtime event", async () => {
      const snapshot = await loadWorkerSnapshot({
        requestId: "edit-request-1",
        expiresAt: pendingEdit.expiresAt,
      });

      expect(mockedQuestApi.getEditRequest).toHaveBeenCalledWith(
        "edit-request-1",
        expect.anything()
      );
      expect(snapshot.capabilities.canRespondToEdit).toBe(true);
      expect(snapshot.nextAction).toBe("RESPOND_TO_EDIT");
    });

    it("prefers the server-named pending request over an older event id", async () => {
      await loadWorkerSnapshot(
        { requestId: "edit-request-1", expiresAt: pendingEdit.expiresAt },
        { editRequestId: "edit-request-old" }
      );

      expect(mockedQuestApi.getEditRequest).toHaveBeenCalledTimes(1);
      expect(mockedQuestApi.getEditRequest).toHaveBeenCalledWith(
        "edit-request-1",
        expect.anything()
      );
    });

    it("reads no edit request when the detail names none and no event arrived", async () => {
      const snapshot = await loadWorkerSnapshot(null);

      expect(mockedQuestApi.getEditRequest).not.toHaveBeenCalled();
      expect(snapshot.capabilities.canRespondToEdit).toBe(false);
    });

    it("still uses the event id when the server does not return the field yet", async () => {
      const snapshot = await loadWorkerSnapshot(undefined, {
        editRequestId: "edit-request-1",
      });

      expect(mockedQuestApi.getEditRequest).toHaveBeenCalledWith(
        "edit-request-1",
        expect.anything()
      );
      expect(snapshot.capabilities.canRespondToEdit).toBe(true);
    });
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

    async function loadStartSnapshot({
      mode,
      participation,
      viewerAssignment = assignment("worker-1"),
      leaderId,
      serverTime = "2099-08-26T10:00:00+07:00",
    }: {
      mode: "FIRST_COME_FIRST_SERVED" | "CANDIDATE";
      participation: "SINGLE" | "GROUP";
      viewerAssignment?: QuestV2Assignment;
      leaderId?: string;
      serverTime?: string;
    }) {
      jest
        .spyOn(Date, "now")
        .mockReturnValue(Date.parse("2026-10-01T00:00:00Z"));
      syncServerClock(serverTime, null);
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

      return liveQuestService.getLiveSnapshot("quest-start-1", "worker-1");
    }

    const startCapability = async (
      input: Parameters<typeof loadStartSnapshot>[0]
    ) => (await loadStartSnapshot(input)).capabilities.canStartWork;

    afterEach(() => {
      resetServerClock();
      jest.restoreAllMocks();
    });

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

    it("offers Start Work to a GROUP CANDIDATE Worker when the Team is unreadable after selection", async () => {
      // Candidate Teams answer 404 once the Quest leaves QUEST_OPEN, so the
      // Team Leader is unknown and the server enforces Team Leader ONLY.
      await expect(
        startCapability({ mode: "CANDIDATE", participation: "GROUP" })
      ).resolves.toBe(true);
    });

    it("names the Team Role only while the Team is readable", async () => {
      const group = { mode: "CANDIDATE", participation: "GROUP" } as const;
      await expect(
        loadStartSnapshot({ ...group, leaderId: "worker-1" })
      ).resolves.toMatchObject({ teamRole: "LEADER" });
      await expect(
        loadStartSnapshot({ ...group, leaderId: "worker-2" })
      ).resolves.toMatchObject({ teamRole: "MEMBER" });
      await expect(loadStartSnapshot(group)).resolves.toMatchObject({
        teamRole: "UNKNOWN",
      });
      await expect(
        loadStartSnapshot({
          mode: "FIRST_COME_FIRST_SERVED",
          participation: "GROUP",
        })
      ).resolves.toMatchObject({ teamRole: null });
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

    it("uses Server time for the inclusive start and exclusive dueAt boundaries", async () => {
      const input = {
        mode: "FIRST_COME_FIRST_SERVED" as const,
        participation: "SINGLE" as const,
      };
      await expect(
        startCapability({ ...input, serverTime: "2099-08-26T08:59:59+07:00" })
      ).resolves.toBe(false);
      await expect(
        startCapability({ ...input, serverTime: "2099-08-26T09:00:00+07:00" })
      ).resolves.toBe(true);
      await expect(
        startCapability({ ...input, serverTime: "2099-08-27T12:00:00+07:00" })
      ).resolves.toBe(false);
    });
  });
});
