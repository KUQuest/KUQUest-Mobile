import { fireEvent, render, waitFor } from "@testing-library/react-native";
import QuestDetailScreen from "../QuestDetailScreen";

const mockGetQuestDetail = jest.fn();
const mockGetHirerParticipant = jest.fn();
const mockCreateReview = jest.fn();
const mockUpdateReview = jest.fn();
const mockGetLiveSnapshot = jest.fn();

jest.mock("../liveQuestService", () => {
  const original = jest.requireActual("../liveQuestService");
  return {
    ...original,
    liveQuestService: {
      ...original.liveQuestService,
      getQuestDetail: (...args: unknown[]) => mockGetQuestDetail(...args),
      getLiveSnapshot: (...args: unknown[]) => mockGetLiveSnapshot(...args),
      getHirerParticipant: (...args: unknown[]) =>
        mockGetHirerParticipant(...args),
      getParticipantProfile: jest.fn().mockResolvedValue({
        id: "worker-1",
        displayName: "Somchai Worker",
      }),
      createReview: (...args: unknown[]) => mockCreateReview(...args),
      updateReview: (...args: unknown[]) => mockUpdateReview(...args),
    },
    isReviewWindowActive: () => true,
  };
});

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useFocusEffect: () => undefined,
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ id: "quest-completed-1", mode: "join" }),
}));

jest.mock("@/features/auth/AuthService", () => ({
  authService: {
    getSession: jest.fn().mockResolvedValue({
      user: { id: "worker-1", name: "Somchai Worker" },
    }),
  },
}));

jest.mock("react-native/Libraries/Modal/Modal", () => ({
  __esModule: true,
  default: ({
    visible,
    children,
  }: {
    visible: boolean;
    children: React.ReactNode;
  }) => (visible ? <>{children}</> : null),
}));

jest.mock("../../../locales/LocaleProvider", () => ({
  useLocale: () => ({ locale: "en" }),
}));

describe("QuestDetailScreen Review Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows Rate & Review button on completed terminal quest for worker viewer", async () => {
    const mockDetail = {
      id: "quest-completed-1",
      title: "Completed Lab Setup",
      description: "Finished successfully.",
      status: "QUEST_COMPLETED",
      rewardSatang: 50000,
      rewardText: "฿500",
      headcount: 1,
      acceptedCount: 1,
      date: "2026-09-18",
      deadline: "2026-09-18",
      location: "Engineering",
      locationMode: "on-campus" as const,
      completionCriteria: "Complete setup",
      proofRequired: "none" as const,
      candidateMode: "NO_CANDIDATE" as const,
      participationMode: "individual" as const,
      studentInterestMatch: true,
      ownerStudentId: "hirer-1",
      creator: { name: "Dr. Hirer" },
      assignmentStatus: "ASSIGNMENT_COMPLETED" as const,
      hasJoined: true,
    };

    mockGetQuestDetail.mockResolvedValue(mockDetail);
    mockGetLiveSnapshot.mockResolvedValue({
      viewerId: "worker-1",
      actor: "WORKER",
      quest: {
        id: "quest-completed-1",
        title: "Completed Lab Setup",
        description: "Completed lab setup",
        condition: { items: [{ position: 0, text: "Done" }] },
        tag: null,
        mode: "FIRST_COME_FIRST_SERVED",
        participation: "SINGLE",
        state: "QUEST_COMPLETED",
        questReward: 500,
        headcount: 1,
        activeWorkerCount: 1,
        startTime: "2026-09-18T08:00:00.000+07:00",
        dueAt: "2026-09-18T18:00:00.000+07:00",
        proofRequired: false,
        hirerName: "Dr. Hirer",
        locations: [{ label: "Engineering" }],
        images: [],
        hasJoined: true,
        assignmentId: "assignment-1",
        assignmentStatus: "ASSIGNMENT_COMPLETED",
      },
      state: "QUEST_COMPLETED",
      mode: "FIRST_COME_FIRST_SERVED",
      participation: "SINGLE",
      assignment: {
        state: "ASSIGNMENT_COMPLETED",
      },
      assignments: [
        {
          workerId: "worker-1",
          state: "ASSIGNMENT_COMPLETED",
        },
      ],
      application: null,
      applications: [],
      team: null,
      teams: [],
      underfilled: null,
      editRequest: null,
      proofs: [],
      workConversation: null,
      proofRequired: false,
      dueAt: null,
      nextAction: "CREATE_REVIEW",
      capabilities: {
        canJoin: false,
        canApply: false,
        canWithdrawApplication: false,
        canCreateTeam: false,
        canJoinTeam: false,
        canLeaveTeam: false,
        canRemoveTeamMember: false,
        canRegenerateTeamCode: false,
        canUpdateTeam: false,
        canSubmitTeam: false,
        canSelectCandidate: false,
        canSelectTeam: false,
        canDecideUnderfilled: false,
        canRejectCandidate: false,
        canRejectTeam: false,
        canConsentUnderfilled: false,
        canRequestEdit: false,
        canRespondToEdit: false,
        canReadWorkChat: false,
        canWriteWorkChat: false,
        canSubmitProof: false,
        canConfirmCompletion: false,
        canCancel: false,
        canReviewProof: false,
        canCreateReview: true,
        canUpdateReview: false,
      },
    });
    mockGetHirerParticipant.mockResolvedValue({
      id: "hirer-1",
      displayName: "Dr. Hirer",
    });
    const view = await render(
      <QuestDetailScreen
        questId="quest-completed-1"
        studentId="worker-1"
        joinStatus="history"
        mode="join"
      />
    );

    await waitFor(() => {
      expect(mockGetLiveSnapshot).toHaveBeenCalledWith(
        "quest-completed-1",
        "worker-1"
      );
    });

    await waitFor(() => {
      expect(
        view.queryByTestId("quest-rate-review-button") ||
          view.queryByTestId("quest-rate-review-action-button")
      ).toBeTruthy();
    });

    // Press review button to open modal
    const reviewButton =
      view.queryByTestId("quest-rate-review-button") ??
      view.getByTestId("quest-rate-review-action-button");
    fireEvent.press(reviewButton);

    await waitFor(() => {
      expect(view.getByTestId("rating-review-modal")).toBeTruthy();
      expect(view.getAllByText("Dr. Hirer").length).toBeGreaterThanOrEqual(1);
    });
  });
});
