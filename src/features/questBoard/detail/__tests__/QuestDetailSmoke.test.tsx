import {
  act,
  fireEvent,
  renderHook,
  waitFor,
} from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { renderWithQueryClient as render } from "@/testing/queryTestUtils";
import { questBoardMessages } from "@/locales/questBoardMessages";
import * as questDetailFeature from "../useQuestDetailFeature";
import * as questDetailProjection from "../questDetailProjection";
import { getQuestDetailProjection } from "../questDetailProjection";
import {
  DEFAULT_PROTOTYPE_VIEWER_ID,
  questFixtureAdapter,
} from "../../fixtures/adapters/questFixtureAdapter";
import { questWorkflow } from "../../workflow/questWorkflow";
import QuestDetailScreen from "../QuestDetailScreen";
import { useQuestDetailReadSource } from "../useQuestDetailReadSource";
import { useQuestDetailNavigation } from "../useQuestDetailNavigation";
import { CircleAlert } from "lucide-react-native";
import type { QuestDetailLiveActionContext } from "../questDetailActions";
import { QuestDetailBody } from "../components/QuestDetailBody";
import * as questBoardQueries from "../../api/questBoardQueries";
import { useQuestDetailLiveActions } from "../useQuestDetailLiveActions";
import type { QuestDetailSurfaceTransitions } from "../useQuestDetailSurfaceState";

const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();
const mockGetQuestDetail = jest.fn();
const mockGetLiveSnapshot = jest.fn();
const mockJoinCandidateTeam = jest.fn();
let mockExposeLiveSnapshot = false;

jest.mock("../../live/liveQuestService", () => ({
  liveQuestService: {
    getQuestDetail: (...args: unknown[]) => mockGetQuestDetail(...args),
    joinCandidateTeam: (...args: unknown[]) => mockJoinCandidateTeam(...args),
    get getLiveSnapshot() {
      return mockExposeLiveSnapshot ? mockGetLiveSnapshot : undefined;
    },
  },
}));

jest.mock("expo-router", () => ({
  useFocusEffect: () => undefined,
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
    back: jest.fn(),
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => ({ id: "quest-1" }),
}));

describe("QuestDetailScreen smoke", () => {
  beforeEach(() => {
    mockRouterPush.mockReset();
    mockRouterReplace.mockReset();
    mockGetQuestDetail.mockReset();
    mockGetLiveSnapshot.mockReset();
    mockJoinCandidateTeam.mockReset();
    mockExposeLiveSnapshot = false;
    questFixtureAdapter.reset();
  });
  afterEach(() => {
    questFixtureAdapter.reset();
  });
  it("shows proof review before rating and opens the proof-review route", async () => {
    const quest = questFixtureAdapter.listBoardQuests(
      "student-001",
      questFixtureAdapter.now
    )[0];
    if (!quest) throw new Error("Expected a Quest fixture");
    const navigation = await renderHook(() =>
      useQuestDetailNavigation({
        quest,
        projection: null,
        source: { kind: "live-detail" },
        viewerId: "hirer-1",
        messages: questBoardMessages.en,
        canMessageOwner: false,
        createCandidateInquiry: async () => ({ id: "inquiry-1" }),
      })
    );
    const featureSpy = jest
      .spyOn(questDetailFeature, "useQuestDetailFeature")
      .mockReturnValue({
        handleBack: jest.fn(),
        messages: questBoardMessages.en,
        state: "ready",
        quest,
        bodyProps: {
          quest,
          locale: "en",
          messages: questBoardMessages.en,
          imageUris: [],
          refreshing: false,
          onRefresh: jest.fn(),
          canParticipate: false,
          participationFirstCome: false,
          onOpenParticipation: jest.fn(),
          participationBusy: false,
          onOpenWorkHub: jest.fn(),
        },
        sheets: {},
        team: undefined,
        partialStartConsent: { surfaceState: "empty" },
        onRetry: jest.fn(),
        actionBar: {
          isPostView: true,
          canEditPost: false,
          canReview: true,
          canReviewProof: true,
          onReviewProof: navigation.result.current.openProofReview,
          canMessageOwner: false,
          onMessageOwner: jest.fn(),
          canShowWithdraw: false,
          onLeaveQuest: jest.fn(),
          canApply: false,
          firstCome: false,
          onOpenApply: jest.fn(),
          onEditPost: jest.fn(),
          busy: false,
        },
      });

    try {
      const screen = await render(<QuestDetailScreen questId={quest.id} />);
      const proofButton = screen.getByTestId("quest-detail-review-proof");
      const ratingButton = screen.getByTestId("quest-review-button");
      const actionParent = proofButton.parent;
      if (!actionParent) throw new Error("Expected shared action-bar parent");
      expect(ratingButton.parent).toBe(actionParent);
      expect(actionParent.children.indexOf(proofButton)).toBeLessThan(
        actionParent.children.indexOf(ratingButton)
      );

      await fireEvent.press(proofButton);

      expect(mockRouterPush).toHaveBeenCalledWith({
        pathname: "/quest/[id]/proof-review",
        params: { id: quest.id },
      });
    } finally {
      featureSpy.mockRestore();
    }
  });
  it("opens Work Hub with viewer identity and replaces to Manage", async () => {
    const quest = questFixtureAdapter.listBoardQuests(
      "student-001",
      questFixtureAdapter.now
    )[0];
    if (!quest) throw new Error("Expected a Quest fixture");
    const navigation = await renderHook(() =>
      useQuestDetailNavigation({
        quest,
        projection: null,
        source: { kind: "live-detail" },
        viewerId: "worker-1",
        messages: questBoardMessages.en,
        canMessageOwner: false,
        createCandidateInquiry: async () => ({ id: "inquiry-1" }),
      })
    );

    navigation.result.current.openWorkHub();
    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]/work",
      params: { id: quest.id, viewerId: "worker-1" },
    });
    navigation.result.current.openManage();
    expect(mockRouterReplace).toHaveBeenCalledWith({
      pathname: "/quest/[id]/manage",
      params: { id: quest.id },
    });
  });
  it("offers accepted Workers an Open Work Hub action from Detail", async () => {
    const quest = questFixtureAdapter.listBoardQuests(
      "student-001",
      questFixtureAdapter.now
    )[0];
    if (!quest) throw new Error("Expected a Quest fixture");
    const openWorkHub = jest.fn();
    const screen = await render(
      <QuestDetailBody
        quest={quest}
        locale="en"
        messages={questBoardMessages.en}
        imageUris={[]}
        refreshing={false}
        onRefresh={jest.fn()}
        canParticipate={false}
        participationFirstCome={false}
        onOpenParticipation={jest.fn()}
        participationBusy={false}
        status={{
          title: "Application accepted",
          description: "Your place is confirmed",
          unavailable: false,
          postView: false,
          leftQuest: false,
          history: false,
          Icon: CircleAlert,
          iconColor: "",
        }}
        onOpenWorkHub={openWorkHub}
      />
    );

    await fireEvent.press(screen.getByTestId("open-work-hub"));

    expect(screen.getByText("Open Work Hub")).toBeTruthy();
    expect(openWorkHub).toHaveBeenCalledTimes(1);
  });
  it("allows team join when server capability allows it", async () => {
    const quest = questFixtureAdapter.listBoardQuests(
      "student-001",
      questFixtureAdapter.now
    )[0];
    if (!quest) throw new Error("Expected a Quest fixture");
    const beginLiveAction = jest.fn(() => true);
    const transitions: QuestDetailSurfaceTransitions = {
      beginLiveAction,
      endLiveAction: jest.fn(),
      markJoined: jest.fn(),
      markLeft: jest.fn(),
      openConfirmation: jest.fn(),
      closeConfirmation: jest.fn(),
      dismissIntent: jest.fn(),
      openCandidateReview: jest.fn(),
      closeCandidateReview: jest.fn(),
      setTeamSearchQuery: jest.fn(),
      setTeamSelectedMemberIds: jest.fn(),
      setTeamReviewing: jest.fn(),
      selectProposal: jest.fn(),
      markFixtureChanged: jest.fn(),
    };
    const context: QuestDetailLiveActionContext = {
      questId: quest.id,
      viewerId: "worker-1",
      quest,
      projectionCapabilities: {
        canApply: false,
        canJoin: false,
        canWithdrawApplication: false,
        canCreateTeam: false,
        canInviteWorker: false,
        canRespondInvitation: false,
        canJoinTeam: true,
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
        canRespondPartialStart: false,
        canMessageOwner: false,
      },
      liveSnapshot: null,
      messages: questBoardMessages.en,
      transitions,
    };
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    mockJoinCandidateTeam.mockResolvedValue({ id: "team-1" });

    try {
      const hook = await renderHook(() => useQuestDetailLiveActions(context), {
        wrapper,
      });
      let joined: unknown;
      await act(async () => {
        joined = await hook.result.current.joinTeam("team-1", "abc123");
      });

      expect(joined).toEqual({ id: "team-1" });
      expect(beginLiveAction).toHaveBeenCalledTimes(1);
      expect(mockJoinCandidateTeam).toHaveBeenCalled();
    } finally {
      queryClient.clear();
    }
  });

  it("renders the live quest path after the fold", async () => {
    const fixture = questFixtureAdapter.listBoardQuests(
      "student-001",
      questFixtureAdapter.now
    )[0];
    if (!fixture) throw new Error("Expected a Quest fixture");
    const state = questFixtureAdapter.getQuestDetail(
      fixture.id,
      DEFAULT_PROTOTYPE_VIEWER_ID,
      questFixtureAdapter.now
    );
    if (!state) throw new Error("Expected a Quest detail fixture");
    expect(
      getQuestDetailProjection(
        state,
        DEFAULT_PROTOTYPE_VIEWER_ID,
        questFixtureAdapter.now
      )
    ).toMatchObject({
      quest: { id: fixture.id, title: fixture.title },
      participantCount: expect.any(Number),
    });
    mockGetQuestDetail.mockResolvedValue(fixture);

    const view = await render(<QuestDetailScreen questId={fixture.id} />);

    await waitFor(() => {
      expect(mockGetQuestDetail).toHaveBeenCalledWith(
        fixture.id,
        expect.objectContaining({ signal: expect.anything() })
      );
    });
    expect(await view.findByText(fixture.title)).toBeTruthy();
  });
  it("falls back to public detail when live snapshots need a viewer", async () => {
    const fixture = questFixtureAdapter.listBoardQuests(
      DEFAULT_PROTOTYPE_VIEWER_ID,
      questFixtureAdapter.now
    )[0];
    if (!fixture) throw new Error("Expected a Quest fixture");
    mockExposeLiveSnapshot = true;
    mockGetQuestDetail.mockResolvedValue(fixture);

    const view = await render(<QuestDetailScreen questId={fixture.id} />);

    await waitFor(() => {
      expect(mockGetQuestDetail).toHaveBeenCalledWith(
        fixture.id,
        expect.objectContaining({ signal: expect.anything() })
      );
    });
    expect(mockGetLiveSnapshot).not.toHaveBeenCalled();
    expect(await view.findByText(fixture.title)).toBeTruthy();
  });

  it("keeps preview participation in the fixture workflow", async () => {
    const fixture = questFixtureAdapter.getQuestDetail(
      "print-documents",
      DEFAULT_PROTOTYPE_VIEWER_ID,
      questFixtureAdapter.now
    );
    if (!fixture) throw new Error("Expected a Quest fixture");
    const dispatch = jest.spyOn(questWorkflow, "dispatch");

    try {
      const view = await render(
        <QuestDetailScreen
          questId={fixture.quest.id}
          previewState="populated"
          studentId={DEFAULT_PROTOTYPE_VIEWER_ID}
        />
      );
      fireEvent.press(await view.findByTestId("quest-apply-button"));
      fireEvent.press(await view.findByTestId("confirm-quest-application"));

      await waitFor(() => {
        expect(dispatch).toHaveBeenCalledWith(
          expect.objectContaining({ questId: fixture.quest.id })
        );
      });
      expect(
        questWorkflow.getQuestDetailState(
          fixture.quest.id,
          DEFAULT_PROTOTYPE_VIEWER_ID
        )
      ).toMatchObject({
        assignments: expect.arrayContaining([
          expect.objectContaining({
            workerId: DEFAULT_PROTOTYPE_VIEWER_ID,
            status: "ASSIGNMENT_ACTIVE",
          }),
        ]),
      });
      expect(mockGetQuestDetail).not.toHaveBeenCalled();
    } finally {
      dispatch.mockRestore();
    }
  });
  it("polls while a Worker has a pending Candidate application on an open Quest", async () => {
    const mockLiveSnapshotQuery = jest.spyOn(
      questBoardQueries,
      "useLiveQuestSnapshotQuery"
    );
    const mockDetailQuery = jest.spyOn(
      questBoardQueries,
      "useQuestDetailQuery"
    );
    mockLiveSnapshotQuery.mockReturnValue({
      data: undefined,
      error: null,
      isPending: false,
      isRefetching: false,
      refetch: jest.fn(),
    } as never);
    mockDetailQuery.mockReturnValue({
      data: undefined,
      error: null,
      isPending: false,
      isRefetching: false,
      refetch: jest.fn(),
    } as never);
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    try {
      await renderHook(
        () =>
          useQuestDetailReadSource({
            questId: "quest-1",
            viewerId: "worker-1",
            explicitPreview: false,
            sessionReady: true,
          }),
        { wrapper }
      );
      const interval = mockLiveSnapshotQuery.mock.calls[0]?.[4] as (
        snapshot: unknown
      ) => number | false;

      expect(
        interval({
          actor: "CANDIDATE",
          mode: "CANDIDATE",
          state: "QUEST_OPEN",
          application: { state: "APPLICATION_APPLIED" },
          team: null,
        })
      ).toBe(15_000);
      expect(
        interval({
          actor: "PROSPECTIVE_WORKER",
          mode: "CANDIDATE",
          state: "QUEST_OPEN",
          application: null,
          team: { state: "TEAM_SUBMITTED" },
        })
      ).toBe(15_000);
      expect(
        interval({
          actor: "CANDIDATE",
          mode: "CANDIDATE",
          state: "QUEST_OPEN",
          application: { state: "APPLICATION_REJECTED" },
          team: null,
        })
      ).toBe(false);
      expect(
        interval({
          actor: "HIRER",
          mode: "CANDIDATE",
          state: "QUEST_OPEN",
          application: { state: "APPLICATION_APPLIED" },
          team: null,
        })
      ).toBe(false);
      expect(
        interval({
          actor: "CANDIDATE",
          mode: "CANDIDATE",
          state: "QUEST_ASSIGNED",
          application: { state: "APPLICATION_APPLIED" },
          team: null,
        })
      ).toBe(false);
    } finally {
      mockLiveSnapshotQuery.mockRestore();
      mockDetailQuery.mockRestore();
      queryClient.clear();
    }
  });
  it("refetches an underfilled Group FCFS Quest when its start time arrives", async () => {
    jest.useFakeTimers();
    const mockLiveSnapshotQuery = jest.spyOn(
      questBoardQueries,
      "useLiveQuestSnapshotQuery"
    );
    const mockDetailQuery = jest.spyOn(
      questBoardQueries,
      "useQuestDetailQuery"
    );
    const mockProjection = jest
      .spyOn(questDetailProjection, "getQuestDetailProjection")
      .mockReturnValue(null as never);
    const refetch = jest.fn();
    const startTime = new Date(Date.now() + 10_000).toISOString();
    const snapshot = {
      actor: "HIRER",
      quest: { id: "quest-1", startTime },
      state: "QUEST_ASSIGNED",
      mode: "FIRST_COME_FIRST_SERVED",
      participation: "GROUP",
      underfilled: null,
    } as never;
    refetch.mockResolvedValue({ data: snapshot } as never);
    mockExposeLiveSnapshot = true;
    mockLiveSnapshotQuery.mockReturnValue({
      data: snapshot,
      error: null,
      isPending: false,
      isRefetching: false,
      refetch,
    } as never);
    mockDetailQuery.mockReturnValue({
      data: undefined,
      error: null,
      isPending: false,
      isRefetching: false,
      refetch: jest.fn(),
    } as never);
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    try {
      await renderHook(
        () =>
          useQuestDetailReadSource({
            questId: "quest-1",
            viewerId: "hirer-1",
            explicitPreview: false,
            sessionReady: true,
          }),
        { wrapper }
      );
      expect(refetch).not.toHaveBeenCalled();

      await act(async () => {
        await jest.advanceTimersByTimeAsync(12_001);
      });

      expect(refetch).toHaveBeenCalledTimes(1);
    } finally {
      mockLiveSnapshotQuery.mockRestore();
      mockDetailQuery.mockRestore();
      mockProjection.mockRestore();
      queryClient.clear();
      jest.useRealTimers();
    }
  });
});
