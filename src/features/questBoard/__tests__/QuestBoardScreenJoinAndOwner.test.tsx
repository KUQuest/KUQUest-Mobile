import React from "react";
import { Alert } from "react-native";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithQueryClient as render } from "@/testing/queryTestUtils";

import QuestBoardScreen from "../QuestBoardScreen";
import QuestDetailScreen from "../QuestDetailScreen";
import { liveQuestService } from "../liveQuestService";
import { authService } from "@/features/auth/AuthService";
import type { LiveQuestSnapshot } from "../liveQuestService";
import type { QuestBoardQuest } from "../types";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({
    id: "quest-live-1",
    mode: "browse",
    joinStatus: "pending",
  }),
  useFocusEffect: (effect: () => (() => void) | void) =>
    jest.requireActual("react").useEffect(effect, []),
}));

jest.mock("@/features/navigation/navigationUiStore", () => ({
  handleNavigationScroll: jest.fn(),
}));

jest.mock("@/features/wallet/HomeWalletOverview", () => ({
  HomeWalletOverview: () => null,
}));

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));
jest.mock("@/features/auth/AuthService", () => ({
  authService: {
    getSession: jest
      .fn()
      .mockResolvedValue({ user: { id: "current-worker-1" } }),
  },
}));

jest.mock("../liveQuestService", () => {
  const actual = jest.requireActual("../liveQuestService");
  return {
    ...actual,
    liveQuestService: {
      listBoardQuests: jest.fn(),
      getHirerParticipant: jest.fn(),
      getLiveSnapshot: jest.fn(),
      joinQuest: jest.fn(),
      applyQuest: jest.fn(),
      withdrawApplication: jest.fn(),
      createCandidateInquiry: jest.fn(),
      selectApplication: jest.fn(),
      rejectApplication: jest.fn(),
      selectCandidateTeam: jest.fn(),
      rejectCandidateTeam: jest.fn(),
      createCandidateTeam: jest.fn(),
      joinCandidateTeam: jest.fn(),
      updateCandidateTeam: jest.fn(),
      leaveCandidateTeam: jest.fn(),
      removeCandidateTeamMember: jest.fn(),
      regenerateCandidateTeamJoinCode: jest.fn(),
      submitCandidateTeam: jest.fn(),
      getUnderfilled: jest.fn(),
      decideUnderfilled: jest.fn(),
      respondUnderfilledConsent: jest.fn(),
    },
  };
});

const mockQuestItem: QuestBoardQuest = {
  id: "quest-fcfs-1",
  title: "Deliver documents across campus",
  tags: ["Delivery"],
  description: "Pick up envelopes from building A and take to building B.",
  completionCriteria: "Documents delivered safely.",
  proofRequired: "none",
  rewardPerPerson: 150,
  rewardSatang: 15000,
  headcount: 2,
  acceptedParticipants: 0,
  startDate: "2026-10-01",
  deadline: "2026-10-02",
  timeRange: "09:00–12:00",
  postedAt: "2026-09-16T10:00:00+07:00",
  location: "Main Campus",
  locationMode: "on-campus",

  participationMode: "single",
  candidateMode: "NO_CANDIDATE", // FCFS
  creator: { name: "Prof Oak", faculty: "Science" },
  ownerStudentId: "",
  studentInterestMatch: false,
  status: "QUEST_OPEN",
};
function createLiveSnapshot(
  overrides: Partial<LiveQuestSnapshot> = {}
): LiveQuestSnapshot {
  return {
    viewerId: "current-worker-1",
    actor: "PROSPECTIVE_WORKER",
    quest: {
      id: "quest-live-1",
      title: "Live Quest",
      description: "A live quest",
      condition: { items: [{ position: 0, text: "Complete the task" }] },
      tag: null,
      mode: "FIRST_COME_FIRST_SERVED",
      participation: "SINGLE",
      state: "QUEST_OPEN",
      questReward: 150,
      headcount: 1,
      activeWorkerCount: 0,
      startTime: "2026-10-01T09:00:00.000+07:00",
      dueAt: "2026-10-02T12:00:00.000+07:00",
      proofRequired: false,
      hirerName: "Prof Oak",
      locations: [{ label: "Main Campus" }],
      images: [],
      hasJoined: false,
      assignmentId: null,
      assignmentStatus: null,
    },
    state: "QUEST_OPEN",
    mode: "FIRST_COME_FIRST_SERVED",
    participation: "SINGLE",
    assignment: null,
    assignments: [],
    application: null,
    applications: [],
    team: null,
    teams: [],
    underfilled: null,
    editRequest: null,
    proofs: [],
    workConversation: null,
    proofRequired: false,
    dueAt: "2026-10-02T12:00:00.000+07:00",
    nextAction: "JOIN",
    capabilities: {
      canJoin: true,
      canApply: false,
      canWithdrawApplication: false,
      canCreateTeam: false,
      canJoinTeam: false,
      canUpdateTeam: false,
      canLeaveTeam: false,
      canRemoveTeamMember: false,
      canRegenerateTeamCode: false,
      canSubmitTeam: false,
      canSelectCandidate: false,
      canSelectTeam: false,
      canRejectCandidate: false,
      canRejectTeam: false,
      canDecideUnderfilled: false,
      canConsentUnderfilled: false,
      canRequestEdit: false,
      canRespondToEdit: false,
      canReadWorkChat: false,
      canWriteWorkChat: false,
      canSubmitProof: false,
      canConfirmCompletion: false,
      canCancel: false,
      canReviewProof: false,
      canCreateReview: false,
      canUpdateReview: false,
    },
    ...overrides,
  };
}

describe("QuestBoardScreen - Owner Profile and Card Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (liveQuestService.listBoardQuests as jest.Mock).mockResolvedValue([
      mockQuestItem,
    ]);
    (liveQuestService.getHirerParticipant as jest.Mock).mockResolvedValue({
      id: "hirer-oak-uuid",
      displayName: "Prof Oak",
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("displays post owner name and avatar initials on the quest card", async () => {
    const view = await render(
      <QuestBoardScreen currentStudentId="current-worker-1" />
    );

    await waitFor(() => {
      expect(view.getByText("Prof Oak")).toBeTruthy();
    });

    expect(view.getByText("PO")).toBeTruthy();
  });

  it("navigates to owner profile page when owner avatar is pressed", async () => {
    const view = await render(
      <QuestBoardScreen currentStudentId="current-worker-1" />
    );

    await waitFor(() => {
      expect(view.getByText("Prof Oak")).toBeTruthy();
    });

    const ownerButton = view.getByTestId("quest-card-owner-quest-fcfs-1");
    fireEvent.press(ownerButton);

    await waitFor(() => {
      expect(liveQuestService.getHirerParticipant).toHaveBeenCalledWith(
        "quest-fcfs-1"
      );
      expect(mockPush).toHaveBeenCalledWith("/profile/hirer-oak-uuid");
    });
  });
  it("opens Candidate Inquiry with explicit route parameters", async () => {
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(
      createLiveSnapshot({
        mode: "CANDIDATE",
        quest: {
          ...createLiveSnapshot().quest,
          mode: "CANDIDATE",
        },
      })
    );
    (liveQuestService.createCandidateInquiry as jest.Mock).mockResolvedValue({
      id: "inquiry-1",
    });

    const view = await render(
      <QuestDetailScreen questId="quest-live-1" studentId="current-worker-1" />
    );

    await waitFor(() =>
      expect(view.getByTestId("quest-message-owner-button")).toBeTruthy()
    );
    fireEvent.press(view.getByTestId("quest-message-owner-button"));

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/quest/[id]/inquiry/[conversationId]",
        params: {
          id: "quest-live-1",
          conversationId: "inquiry-1",
          viewerId: "current-worker-1",
        },
      })
    );
  });

  it("does not render a join pill in quest cards", async () => {
    const view = await render(
      <QuestBoardScreen currentStudentId="current-worker-1" />
    );

    await waitFor(() => {
      expect(view.getByText("Deliver documents across campus")).toBeTruthy();
    });

    expect(view.queryByTestId("quest-join-pill-quest-fcfs-1")).toBeNull();
  });
  it("deduplicates concurrent explicit board refreshes", async () => {
    const view = await render(
      <QuestBoardScreen currentStudentId="current-worker-1" />
    );

    await waitFor(() =>
      expect(liveQuestService.listBoardQuests).toHaveBeenCalledTimes(1)
    );

    let resolveRefresh!: (items: QuestBoardQuest[]) => void;
    const pendingRefresh = new Promise<QuestBoardQuest[]>((resolve) => {
      resolveRefresh = resolve;
    });
    (liveQuestService.listBoardQuests as jest.Mock).mockReturnValueOnce(
      pendingRefresh
    );

    const results = view.getByLabelText("Quest Board results");
    results.props.refreshControl.props.onRefresh();
    results.props.refreshControl.props.onRefresh();

    expect(liveQuestService.listBoardQuests).toHaveBeenCalledTimes(2);
    resolveRefresh([mockQuestItem]);
    await waitFor(() =>
      expect(
        view.getByLabelText("Quest Board results").props.refreshControl.props
          .refreshing
      ).toBe(false)
    );
  });
  it("hydrates the live join CTA after session loading without refresh", async () => {
    let resolveSession!: (value: { user: { id: string } }) => void;
    (authService.getSession as jest.Mock).mockReturnValueOnce(
      new Promise<{ user: { id: string } }>((resolve) => {
        resolveSession = resolve;
      })
    );
    const snapshot = createLiveSnapshot();
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(snapshot);

    const view = await render(<QuestDetailScreen questId="quest-live-1" />);

    expect(view.queryByTestId("quest-apply-button")).toBeNull();
    resolveSession({ user: { id: "current-worker-1" } });

    await waitFor(() => {
      expect(liveQuestService.getLiveSnapshot).toHaveBeenCalledWith(
        "quest-live-1",
        "current-worker-1",
        expect.objectContaining({ signal: expect.anything() })
      );
      expect(view.getByTestId("quest-apply-button")).toBeTruthy();
    });
  });
  it("navigates to Work Hub after a live FCFS join succeeds", async () => {
    const snapshot = createLiveSnapshot();
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(snapshot);
    (liveQuestService.joinQuest as jest.Mock).mockResolvedValue({
      id: "assignment-live-1",
      questId: "quest-live-1",
      workerId: "current-worker-1",
      state: "ASSIGNMENT_ACTIVE",
      questState: "QUEST_ASSIGNED",
      createdAt: "2026-09-17T10:00:00.000+07:00",
    });

    const view = await render(
      <QuestDetailScreen questId="quest-live-1" studentId="current-worker-1" />
    );

    await waitFor(() => {
      expect(view.getByTestId("quest-apply-button")).toBeTruthy();
    });
    await fireEvent.press(view.getByTestId("quest-apply-button"));
    await waitFor(() => {
      expect(view.getByTestId("confirm-quest-application")).toBeTruthy();
    });
    fireEvent.press(view.getByTestId("confirm-quest-application"));

    await waitFor(() => {
      expect(liveQuestService.joinQuest).toHaveBeenCalledWith("quest-live-1");
      expect(mockPush).toHaveBeenCalledWith("/my-quests");
    });
  });
  it("applies through the live Candidate API instead of fixture dispatch", async () => {
    const base = createLiveSnapshot();
    const snapshot = createLiveSnapshot({
      mode: "CANDIDATE",
      nextAction: "APPLY",
      quest: {
        ...base.quest,
        mode: "CANDIDATE",
        participation: "SINGLE",
      },
      capabilities: {
        ...base.capabilities,
        canJoin: false,
        canApply: true,
      },
    });
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(snapshot);
    (liveQuestService.applyQuest as jest.Mock).mockResolvedValue({
      id: "application-live-1",
      questId: "quest-live-1",
      memberId: "current-worker-1",
      state: "APPLICATION_APPLIED",
      appliedAt: "2026-09-17T10:00:00.000Z",
    });

    const view = await render(
      <QuestDetailScreen questId="quest-live-1" studentId="current-worker-1" />
    );

    await waitFor(() =>
      expect(view.getByTestId("quest-apply-button")).toBeTruthy()
    );
    fireEvent.press(view.getByTestId("quest-apply-button"));
    fireEvent.press(await view.findByTestId("confirm-quest-application"));

    await waitFor(() => {
      expect(liveQuestService.applyQuest).toHaveBeenCalledWith(
        "quest-live-1",
        expect.any(String)
      );
      expect(liveQuestService.joinQuest).not.toHaveBeenCalled();
    });
  });

  it("rejects candidate application through live API when confirmed by Hirer", async () => {
    const base = createLiveSnapshot();
    const alertSpy = jest.spyOn(Alert, "alert");
    const snapshot = createLiveSnapshot({
      actor: "HIRER",
      state: "QUEST_OPEN",
      mode: "CANDIDATE",
      participation: "SINGLE",
      applications: [
        {
          id: "app-live-1",
          questId: "quest-live-1",
          memberId: "applicant-1",
          state: "APPLICATION_APPLIED",
          appliedAt: "2026-09-17T10:00:00.000Z",
        },
      ],
      capabilities: {
        ...base.capabilities,
        canSelectCandidate: true,
        canRejectCandidate: true,
      },
    });
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(snapshot);
    (liveQuestService.rejectApplication as jest.Mock).mockResolvedValue({
      id: "app-live-1",
      questId: "quest-live-1",
      memberId: "applicant-1",
      state: "APPLICATION_REJECTED",
      appliedAt: "2026-09-17T10:00:00.000Z",
    });

    const view = await render(
      <QuestDetailScreen questId="quest-live-1" studentId="hirer-1" />
    );

    await waitFor(() =>
      expect(
        view.getByTestId("quest-candidate-review-entry-action")
      ).toBeTruthy()
    );
    fireEvent.press(view.getByTestId("quest-candidate-review-entry-action"));

    const rejectButton = await view.findByTestId(
      "candidate-review-reject-app-live-1"
    );
    fireEvent.press(rejectButton);

    expect(alertSpy).toHaveBeenCalled();
    const alertButtons = alertSpy.mock.calls[alertSpy.mock.calls.length - 1][2];
    const confirmReject = alertButtons?.find((b) => b.style === "destructive");
    expect(confirmReject).toBeTruthy();

    confirmReject?.onPress?.();

    await waitFor(() => {
      expect(liveQuestService.rejectApplication).toHaveBeenCalledWith(
        "quest-live-1",
        "app-live-1",
        expect.any(String)
      );
    });
    alertSpy.mockRestore();
  });
  it("opens the live underfilled consent branch and invokes the worker callback", async () => {
    const base = createLiveSnapshot();
    const snapshot = createLiveSnapshot({
      actor: "WORKER",
      state: "QUEST_ASSIGNED",
      mode: "FIRST_COME_FIRST_SERVED",
      participation: "GROUP",
      nextAction: "CONSENT_UNDERFILLED",
      quest: {
        ...base.quest,
        mode: "FIRST_COME_FIRST_SERVED",
        participation: "GROUP",
        state: "QUEST_ASSIGNED",
        hasJoined: true,
        assignmentId: "assignment-live-1",
        assignmentStatus: "ASSIGNMENT_ACTIVE",
      },
      assignment: {
        id: "assignment-live-1",
        questId: "quest-live-1",
        workerId: "current-worker-1",
        state: "ASSIGNMENT_ACTIVE",
        questState: "QUEST_ASSIGNED",
        startedAt: null,
        createdAt: "2026-09-17T10:00:00.000Z",
      },
      underfilled: {
        id: "underfilled-live-1",
        questId: "quest-live-1",
        questState: "QUEST_ASSIGNED",
        state: "UNDERFILLED_CONSENT_PENDING",
        activeWorkerCount: 1,
        headcount: 2,
        workerRewardPool: 150,
        questReward: 150,
        dueAt: "2026-10-02T12:00:00.000Z",
        decision: {
          status: "UNDERFILLED_DECISION_PROCEEDED",
          value: "PROCEED",
          expiresAt: null,
        },
        consent: {
          status: "UNDERFILLED_CONSENT_PENDING",
          expiresAt: "2030-10-02T12:00:00.000Z",
          totalCount: 1,
          acceptedCount: 0,
          declinedCount: 0,
          pendingCount: 1,
        },
        responses: [
          {
            workerId: "current-worker-1",
            assignmentId: "assignment-live-1",
            decision: null,
            questReward: 150,
            respondedAt: null,
          },
        ],
        ownResponse: null,
      },
      capabilities: {
        ...base.capabilities,
        canJoin: false,
        canConsentUnderfilled: true,
        canReadWorkChat: true,
        canWriteWorkChat: true,
      },
    });
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(snapshot);
    (liveQuestService.respondUnderfilledConsent as jest.Mock).mockResolvedValue(
      snapshot.underfilled
    );

    const view = await render(
      <QuestDetailScreen questId="quest-live-1" studentId="current-worker-1" />
    );

    await waitFor(() =>
      expect(
        view.getByTestId("quest-live-underfilled-entry-action")
      ).toBeTruthy()
    );
    fireEvent.press(view.getByTestId("quest-live-underfilled-entry-action"));
    fireEvent.press(await view.findByTestId("partial-group-start-approve"));

    await waitFor(() =>
      expect(liveQuestService.respondUnderfilledConsent).toHaveBeenCalledWith(
        "quest-live-1",
        "ACCEPT",
        expect.any(String)
      )
    );
  });

  it("does not offer voluntary leave to an active Worker", async () => {
    const base = createLiveSnapshot();
    const snapshot = createLiveSnapshot({
      actor: "WORKER",
      state: "QUEST_ASSIGNED",
      quest: {
        ...base.quest,
        state: "QUEST_ASSIGNED",
        hasJoined: true,
        assignmentId: "assignment-live-1",
        assignmentStatus: "ASSIGNMENT_ACTIVE",
      },
      assignment: {
        id: "assignment-live-1",
        questId: "quest-live-1",
        workerId: "current-worker-1",
        state: "ASSIGNMENT_ACTIVE",
        questState: "QUEST_ASSIGNED",
        startedAt: null,
        createdAt: "2026-09-17T10:00:00.000+07:00",
      },
      nextAction: "WAIT_FOR_START",
      capabilities: {
        ...base.capabilities,
        canJoin: false,
        canReadWorkChat: true,
        canWriteWorkChat: true,
      },
    });
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(snapshot);

    const view = await render(
      <QuestDetailScreen
        questId="quest-live-1"
        studentId="current-worker-1"
        mode="join"
      />
    );

    await waitFor(() => {
      expect(view.getByTestId("quest-canonical-status")).toBeTruthy();
    });
    expect(view.queryByTestId("quest-leave-button")).toBeNull();
    expect(view.getByTestId("view-my-quests")).toBeTruthy();
  });
});
