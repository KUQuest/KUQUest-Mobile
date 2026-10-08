import {
  act,
  fireEvent,
  renderHook,
  waitFor,
  within,
} from "@testing-library/react-native";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ApiError } from "@/api/ApiClient";
import { renderWithQueryClient as render } from "@/testing/queryTestUtils";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { groupQuestMessages } from "@/locales/groupQuestMessages";
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
import { QuestDetailSheets } from "../components/QuestDetailSheets";
import * as questBoardQueries from "../../api/questBoardQueries";
import { useQuestDetailLiveActions } from "../useQuestDetailLiveActions";
import type { QuestDetailSurfaceTransitions } from "../useQuestDetailSurfaceState";

import * as sweetAlert from "@/components/ui/SweetAlert";
import { useQuestDetailParticipation } from "../useQuestDetailParticipation";
import { getQuestDetailPresentationFacts } from "../questDetailPresentation";
const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();
const mockGetQuestDetail = jest.fn();
const mockGetLiveSnapshot = jest.fn();
const mockJoinQuest = jest.fn();
const mockJoinCandidateTeam = jest.fn();
let mockExposeLiveSnapshot = false;

jest.mock("../../live/liveQuestService", () => ({
  liveQuestService: {
    getQuestDetail: (...args: unknown[]) => mockGetQuestDetail(...args),
    joinCandidateTeam: (...args: unknown[]) => mockJoinCandidateTeam(...args),
    joinQuest: (...args: unknown[]) => mockJoinQuest(...args),
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
    mockJoinQuest.mockReset();
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
          onOpenPartialConsent: jest.fn(),
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
          actionLabel: questBoardMessages.en.openWorkHub,
        }}
        onOpenWorkHub={openWorkHub}
        onOpenPartialConsent={jest.fn()}
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
        canRespondToEdit: false,
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
      await fireEvent.press(await view.findByTestId("quest-apply-button"));
      await fireEvent.press(
        await view.findByTestId("confirm-quest-application")
      );

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
          mode: "FIRST_COME_FIRST_SERVED",
          participation: "GROUP",
          state: "QUEST_OPEN",
          application: null,
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
  it("hides worker Group FCFS status from Hirer actor", () => {
    const quest = questFixtureAdapter.listBoardQuests(
      "student-001",
      questFixtureAdapter.now
    )[0];
    if (!quest) throw new Error("Expected a Quest fixture");
    const snapshot = {
      actor: "HIRER",
      participation: "GROUP",
      mode: "FIRST_COME_FIRST_SERVED",
      state: "QUEST_OPEN",
      quest: { ...quest, activeWorkerCount: 1 },
      assignment: null,
      underfilled: null,
    };
    const facts = getQuestDetailPresentationFacts({
      read: {
        quest,
        projection: null,
        source: { kind: "live-snapshot", snapshot },
        refreshing: false,
      },
      route: { mode: "join", questId: quest.id },
      locale: "en",
      messages: questBoardMessages.en,
      groupMessages: {} as never,
      viewerId: "hirer-1",
      surface: {
        localJoinedStatus: null,
        leftQuest: false,
        dismissedIntent: null,
        manualConfirmationOpen: false,
      },
      teamDirectory: [],
      tagCatalog: [],
      colors: { textMuted: "", primary: "", dangerDark: "" },
    } as never);
    expect(facts?.isHirerView).toBe(true);
    expect(facts?.groupFcfs).toBeUndefined();
  });

  it.each([
    ["join", true],
    ["join", false],
    ["preview", true],
    ["preview", false],
  ] as const)(
    "points an accepted Worker at a pending Quest Edit (%s route, pending %s)",
    (mode, canRespondToEdit) => {
      const quest = questFixtureAdapter.listBoardQuests(
        "student-001",
        questFixtureAdapter.now
      )[0];
      if (!quest) throw new Error("Expected a Quest fixture");
      const facts = getQuestDetailPresentationFacts({
        read: {
          quest,
          projection: {
            joinStatus: "accepted",
            applicationStatus: "accepted",
            availability: "full",
            lifecycleState: "QUEST_ASSIGNED",
            capabilities: { canRespondToEdit },
            participants: [],
            participantCount: 1,
          },
          source: {
            kind: "live-snapshot",
            snapshot: { actor: "WORKER", underfilled: null },
          },
          refreshing: false,
        },
        route: { mode, questId: quest.id },
        locale: "en",
        messages: questBoardMessages.en,
        groupMessages: {} as never,
        viewerId: "worker-1",
        surface: {
          localJoinedStatus: null,
          leftQuest: false,
          dismissedIntent: null,
          manualConfirmationOpen: false,
        },
        teamDirectory: [],
        tagCatalog: [],
        colors: { textMuted: "", primary: "", dangerDark: "" },
      } as never);

      expect(facts?.statusTitle).not.toBe("");
      if (canRespondToEdit) {
        expect(facts?.statusTitle).toBe(
          questBoardMessages.en.editResponsePending
        );
        expect(facts?.statusActionLabel).toBe(
          questBoardMessages.en.respondToEdit
        );
      } else {
        expect(facts?.statusTitle).not.toBe(
          questBoardMessages.en.editResponsePending
        );
        expect(facts?.statusActionLabel).toBe(
          questBoardMessages.en.openWorkHub
        );
      }
    }
  );

  it("keeps Group FCFS facts and Join visible without passive explanations", async () => {
    const fixture = questFixtureAdapter.listBoardQuests(
      "student-001",
      questFixtureAdapter.now
    )[0];
    if (!fixture) throw new Error("Expected a Quest fixture");
    const quest = {
      ...fixture,
      participationMode: "team" as const,
      candidateMode: "NO_CANDIDATE" as const,
      headcount: 4,
      acceptedParticipants: 2,
    };
    const view = await render(
      <QuestDetailBody
        quest={quest}
        locale="th"
        messages={questBoardMessages.th}
        imageUris={[]}
        refreshing={false}
        onRefresh={jest.fn()}
        canParticipate
        participationFirstCome
        onOpenParticipation={jest.fn()}
        participationBusy={false}
        onOpenWorkHub={jest.fn()}
        onOpenPartialConsent={jest.fn()}
        groupFcfs={{
          activeWorkerCount: 2,
          headcount: 4,
          isJoined: false,
          state: "QUEST_OPEN",
          startTime: "2099-10-01T10:00:00.000Z",
          underfilled: null,
          canConsent: false,
        }}
      />
    );
    expect(
      view.getByText(questBoardMessages.th.groupFcfsJoinedProgress(2, 4))
    ).toBeTruthy();
    expect(
      view.queryByText(questBoardMessages.th.groupFcfsJoinRule, {
        exact: false,
      })
    ).toBeNull();
    expect(
      view.queryByText(questBoardMessages.th.groupFcfsUnderfillRule, {
        exact: false,
      })
    ).toBeNull();
    expect(
      view.queryByText(questBoardMessages.th.firstComeDescription)
    ).toBeNull();
    expect(view.getByText(quest.description)).toBeTruthy();
    expect(view.getByText(quest.completionCriteria)).toBeTruthy();
    expect(view.getByTestId("quest-apply-button")).toBeTruthy();
  });

  it("shows joined progress and filled assignment without a Join CTA", async () => {
    const fixture = questFixtureAdapter.listBoardQuests(
      "student-001",
      questFixtureAdapter.now
    )[0];
    if (!fixture) throw new Error("Expected a Quest fixture");
    const quest = {
      ...fixture,
      participationMode: "team" as const,
      candidateMode: "NO_CANDIDATE" as const,
      headcount: 4,
      acceptedParticipants: 2,
    };
    const onOpenWorkHub = jest.fn();
    const props = {
      quest,
      locale: "en" as const,
      messages: questBoardMessages.en,
      imageUris: [],
      refreshing: false,
      onRefresh: jest.fn(),
      canParticipate: false,
      participationFirstCome: true,
      onOpenParticipation: jest.fn(),
      participationBusy: false,
      onOpenWorkHub,
      onOpenPartialConsent: jest.fn(),
    };
    const joinedView = await render(
      <QuestDetailBody
        {...props}
        groupFcfs={{
          activeWorkerCount: 2,
          headcount: 4,
          isJoined: true,
          state: "QUEST_OPEN",
          startTime: "2020-10-01T10:00:00.000Z",
          underfilled: null,
          canConsent: false,
        }}
      />
    );
    expect(
      joinedView.getByText(/2 of 4 workers joined · 2 more workers needed/)
    ).toBeTruthy();
    expect(
      joinedView.queryByText(questBoardMessages.en.groupFcfsUnderfillRule)
    ).toBeNull();
    expect(joinedView.getByText(/10:00/)).toBeTruthy();
    expect(
      joinedView.getByTestId("group-fcfs-journey").props.accessibilityRole
    ).toBeUndefined();
    expect(joinedView.queryByTestId("quest-apply-button")).toBeNull();
    await joinedView.unmount();

    const fullView = await render(
      <QuestDetailBody
        {...props}
        quest={{ ...quest, acceptedParticipants: 4 }}
        groupFcfs={{
          activeWorkerCount: 2,
          headcount: 4,
          isJoined: true,
          startTime: "2099-10-01T10:00:00.000Z",
          state: "QUEST_ASSIGNED",
          underfilled: null,
          canConsent: false,
        }}
      />
    );
    expect(
      within(fullView.getByTestId("group-fcfs-journey")).queryByText(
        /workers needed/i
      )
    ).toBeNull();
    expect(fullView.queryByTestId("quest-apply-button")).toBeNull();
    await fireEvent.press(fullView.getByTestId("group-fcfs-open-work-hub"));
    expect(onOpenWorkHub).toHaveBeenCalledTimes(1);
    await fullView.unmount();
    const fullForOther = await render(
      <QuestDetailBody
        {...props}
        quest={{ ...quest, acceptedParticipants: 4 }}
        groupFcfs={{
          activeWorkerCount: 4,
          headcount: 4,
          isJoined: false,
          startTime: "2099-10-01T10:00:00.000Z",
          state: "QUEST_ASSIGNED",
          underfilled: null,
          canConsent: false,
        }}
      />
    );
    expect(
      fullForOther.getByText(questBoardMessages.en.groupFcfsFullForOthers)
    ).toBeTruthy();
    expect(fullForOther.queryByTestId("quest-apply-button")).toBeNull();
  });

  it("announces consent countdown only at expiry and minute boundaries", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2099-10-01T00:09:59.000Z"));
    const fixture = questFixtureAdapter.listBoardQuests(
      "student-001",
      questFixtureAdapter.now
    )[0];
    if (!fixture) throw new Error("Expected a Quest fixture");
    const view = await render(
      <QuestDetailBody
        quest={fixture}
        locale="en"
        messages={questBoardMessages.en}
        imageUris={[]}
        refreshing={false}
        onRefresh={jest.fn()}
        canParticipate={false}
        participationFirstCome
        onOpenParticipation={jest.fn()}
        participationBusy={false}
        onOpenWorkHub={jest.fn()}
        onOpenPartialConsent={jest.fn()}
        groupFcfs={{
          activeWorkerCount: 2,
          headcount: 4,
          isJoined: true,
          state: "QUEST_OPEN",
          startTime: "2020-10-01T10:00:00.000Z",
          underfilled: {
            id: "underfilled-countdown",
            questId: fixture.id,
            questState: "QUEST_OPEN",
            state: "UNDERFILLED_CONSENT_PENDING",
            activeWorkerCount: 2,
            headcount: 4,
            workerRewardPool: null,
            questReward: null,
            dueAt: null,
            decision: {
              status: "UNDERFILLED_DECISION_PROCEEDED",
              value: "PROCEED",
              expiresAt: null,
            },
            consent: {
              status: "UNDERFILLED_CONSENT_PENDING",
              expiresAt: "2099-10-01T00:10:00.000Z",
              totalCount: 2,
              acceptedCount: 0,
              declinedCount: 0,
              pendingCount: 2,
            },
            ownResponse: null,
          },
          canConsent: true,
        }}
      />
    );
    try {
      const countdown = view.getByText(/Consent time remaining/);
      expect(countdown.props.accessibilityLiveRegion).toBe("none");
      await act(async () => {
        await jest.advanceTimersByTimeAsync(1_000);
      });
      expect(
        view.getByText(/Consent time remaining/).props.accessibilityLiveRegion
      ).toBe("polite");
    } finally {
      await view.unmount();
      jest.useRealTimers();
    }
  });

  it("shows decision pending and opens the required consent route", async () => {
    const fixture = questFixtureAdapter.listBoardQuests(
      "student-001",
      questFixtureAdapter.now
    )[0];
    if (!fixture) throw new Error("Expected a Quest fixture");
    const quest = {
      ...fixture,
      participationMode: "team" as const,
      candidateMode: "NO_CANDIDATE" as const,
      headcount: 4,
      acceptedParticipants: 2,
    };
    const underfilled = {
      id: "underfilled-1",
      questId: quest.id,
      questState: "QUEST_OPEN" as const,
      state: "UNDERFILLED_DECISION_PENDING" as const,
      activeWorkerCount: 2,
      headcount: 4,
      workerRewardPool: null,
      questReward: null,
      dueAt: null,
      decision: {
        status: "UNDERFILLED_DECISION_PENDING" as const,
        value: null,
        expiresAt: "2099-10-01T00:10:00.000Z",
      },
      consent: {
        status: "UNDERFILLED_CONSENT_NOT_STARTED" as const,
        expiresAt: null,
        totalCount: 0,
        acceptedCount: 0,
        declinedCount: 0,
        pendingCount: 0,
      },
      ownResponse: null,
    };
    const onOpenPartialConsent = jest.fn();
    const common = {
      quest,
      locale: "en" as const,
      messages: questBoardMessages.en,
      imageUris: [],
      refreshing: false,
      onRefresh: jest.fn(),
      canParticipate: false,
      participationFirstCome: true,
      onOpenParticipation: jest.fn(),
      participationBusy: false,
      onOpenWorkHub: jest.fn(),
      onOpenPartialConsent,
    };
    const pendingView = await render(
      <QuestDetailBody
        {...common}
        groupFcfs={{
          activeWorkerCount: 2,
          headcount: 4,
          isJoined: true,
          state: "QUEST_OPEN",
          startTime: "2099-10-01T10:00:00.000Z",
          underfilled,
          canConsent: false,
        }}
      />
    );
    expect(
      pendingView.getByText(
        questBoardMessages.en.groupFcfsUnderfillDecisionPending
      )
    ).toBeTruthy();
    await pendingView.unmount();

    const consentView = await render(
      <QuestDetailBody
        {...common}
        groupFcfs={{
          activeWorkerCount: 2,
          headcount: 4,
          isJoined: true,
          state: "QUEST_OPEN",
          startTime: "2099-10-01T10:00:00.000Z",
          underfilled: {
            ...underfilled,
            state: "UNDERFILLED_CONSENT_PENDING",
            decision: {
              status: "UNDERFILLED_DECISION_PROCEEDED",
              value: "PROCEED",
              expiresAt: "2099-10-01T00:10:00.000Z",
            },
            consent: {
              status: "UNDERFILLED_CONSENT_PENDING",
              expiresAt: "2099-10-01T00:10:00.000Z",
              totalCount: 2,
              acceptedCount: 0,
              declinedCount: 0,
              pendingCount: 2,
            },
          },
          canConsent: true,
        }}
      />
    );
    expect(
      consentView.getByText(questBoardMessages.en.groupFcfsConsentRequired)
    ).toBeTruthy();
    expect(
      consentView.queryByText(questBoardMessages.en.groupFcfsUnderfillRule)
    ).toBeNull();
    expect(
      within(consentView.getByTestId("group-fcfs-journey")).queryByText(
        /workers needed/i
      )
    ).toBeNull();
    await fireEvent.press(consentView.getByTestId("group-fcfs-consent-action"));
    expect(onOpenPartialConsent).toHaveBeenCalledTimes(1);
    await consentView.unmount();
    const cancelled = await render(
      <QuestDetailBody
        {...common}
        groupFcfs={{
          activeWorkerCount: 1,
          headcount: 4,
          isJoined: false,
          startTime: "2099-10-01T10:00:00.000Z",
          state: "QUEST_CANCELLED",
          underfilled: {
            ...underfilled,
            state: "UNDERFILLED_CANCELLED",
            cancellationReason: "WORKER_DECLINED",
            cancelledAt: "2026-10-01T10:00:00.000Z",
            decision: {
              status: "UNDERFILLED_DECISION_PROCEEDED",
              value: "PROCEED",
              expiresAt: null,
            },
            consent: {
              status: "UNDERFILLED_CONSENT_CANCELLED",
              expiresAt: null,
              totalCount: 2,
              acceptedCount: 1,
              declinedCount: 1,
              pendingCount: 0,
            },
          },
          canConsent: false,
        }}
      />
    );
    expect(
      cancelled.getByText(groupQuestMessages.en.declinedByWorker)
    ).toBeTruthy();
    expect(
      cancelled.getByText(questBoardMessages.en.groupFcfsCancelledNextStep)
    ).toBeTruthy();
    await cancelled.unmount();

    // Mobile #287: the consent outcome describes the hand-off to QUEST_ASSIGNED.
    // Once Work starts it is stale, and a finished Quest has no join step left.
    const consentCompleted = {
      ...underfilled,
      state: "UNDERFILLED_COMPLETED" as const,
      decision: {
        status: "UNDERFILLED_DECISION_PROCEEDED" as const,
        value: "PROCEED" as const,
        expiresAt: null,
      },
      consent: {
        status: "UNDERFILLED_CONSENT_COMPLETED" as const,
        expiresAt: null,
        totalCount: 2,
        acceptedCount: 2,
        declinedCount: 0,
        pendingCount: 0,
      },
    };
    const inProgress = await render(
      <QuestDetailBody
        {...common}
        groupFcfs={{
          activeWorkerCount: 2,
          headcount: 4,
          isJoined: true,
          startTime: "2099-10-01T10:00:00.000Z",
          state: "QUEST_IN_PROGRESS",
          underfilled: consentCompleted,
          canConsent: false,
        }}
      />
    );
    expect(
      inProgress.queryByText(questBoardMessages.en.groupFcfsConsentComplete)
    ).toBeNull();
    expect(
      inProgress.getByText(questBoardMessages.en.groupFcfsYouAreIn)
    ).toBeTruthy();
    await inProgress.unmount();
    const finished = await render(
      <QuestDetailBody
        {...common}
        groupFcfs={{
          activeWorkerCount: 2,
          headcount: 4,
          isJoined: false,
          startTime: "2099-10-01T10:00:00.000Z",
          state: "QUEST_COMPLETED",
          underfilled: consentCompleted,
          canConsent: false,
        }}
      />
    );
    expect(finished.queryByTestId("group-fcfs-journey")).toBeNull();
  });
  it("confirms Group FCFS join with a clear spot-confirmed result", async () => {
    const liveActions = {
      join: jest.fn().mockResolvedValue({ id: "assignment-1" }),
    };
    const markJoined = jest.fn();
    const closeConfirmation = jest.fn();
    const openWorkHub = jest.fn();
    const showSuccess = jest.spyOn(sweetAlert, "showSweetAlert");
    const facts = {
      canApply: true,
      firstCome: true,
      source: { kind: "live-snapshot" },
      groupFcfs: {},
      messages: questBoardMessages.en,
    } as never;
    const hook = await renderHook(() =>
      useQuestDetailParticipation({
        facts,
        liveActions: liveActions as never,
        previewActions: {} as never,
        navigation: { openWorkHub } as never,
        transitions: { markJoined, closeConfirmation } as never,
      })
    );
    await waitFor(() => expect(hook.result.current).not.toBeNull());
    try {
      await act(async () => {
        await hook.result.current.confirmApplication();
      });
      expect(liveActions.join).toHaveBeenCalledTimes(1);
      expect(markJoined).toHaveBeenCalledWith("accepted");
      expect(closeConfirmation).toHaveBeenCalledTimes(1);
      expect(openWorkHub).not.toHaveBeenCalled();
      expect(showSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          message: questBoardMessages.en.groupFcfsConfirmedSpot,
        })
      );
    } finally {
      showSuccess.mockRestore();
    }
  });
  it("continues as a Worker when direct join returns ALREADY_JOINED success", async () => {
    const liveActions = { join: jest.fn().mockResolvedValue(true) };
    const markJoined = jest.fn();
    const closeConfirmation = jest.fn();
    const openWorkHub = jest.fn();
    const facts = {
      canApply: true,
      firstCome: true,
      source: { kind: "live-snapshot" },
      projection: { capabilities: { canApply: true } },
      groupFcfs: undefined,
      messages: questBoardMessages.en,
    } as never;
    const hook = await renderHook(() =>
      useQuestDetailParticipation({
        facts,
        liveActions: liveActions as never,
        previewActions: {} as never,
        navigation: { openWorkHub } as never,
        transitions: { markJoined, closeConfirmation } as never,
      })
    );

    await act(async () => {
      await hook.result.current.confirmApplication();
    });

    expect(markJoined).toHaveBeenCalledWith("accepted");
    expect(closeConfirmation).toHaveBeenCalledTimes(1);
    expect(openWorkHub).toHaveBeenCalledTimes(1);
  });
  it("keeps SINGLE FCFS join navigation on Work Hub", async () => {
    const liveActions = {
      join: jest.fn().mockResolvedValue({ id: "assignment-single" }),
    };
    const markJoined = jest.fn();
    const closeConfirmation = jest.fn();
    const openWorkHub = jest.fn();
    const showSuccess = jest.spyOn(sweetAlert, "showSweetAlert");
    const facts = {
      canApply: true,
      firstCome: true,
      source: { kind: "live-snapshot" },
      projection: { capabilities: { canApply: true } },
      groupFcfs: undefined,
      messages: questBoardMessages.en,
    } as never;
    const hook = await renderHook(() =>
      useQuestDetailParticipation({
        facts,
        liveActions: liveActions as never,
        previewActions: {} as never,
        navigation: { openWorkHub } as never,
        transitions: { markJoined, closeConfirmation } as never,
      })
    );
    try {
      await act(async () => {
        await hook.result.current.confirmApplication();
      });
      expect(liveActions.join).toHaveBeenCalledTimes(1);
      expect(markJoined).toHaveBeenCalledWith("accepted");
      expect(closeConfirmation).toHaveBeenCalledTimes(1);
      expect(openWorkHub).toHaveBeenCalledTimes(1);
      expect(showSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          message: questBoardMessages.en.participationConfirmed,
        })
      );
    } finally {
      showSuccess.mockRestore();
    }
  });
  it("handles a full-capacity join race and refetches the detail snapshot", async () => {
    const queryClient = new QueryClient();
    const questId = "quest-race";
    const viewerId = "worker-race";
    const key = questBoardQueries.questBoardKeys.liveSnapshot(
      questId,
      viewerId
    );
    const openSnapshot = {
      state: "QUEST_OPEN",
      quest: { id: questId, headcount: 1, activeWorkerCount: 0 },
    };
    const fullSnapshot = {
      state: "QUEST_ASSIGNED",
      quest: { id: questId, headcount: 1, activeWorkerCount: 1 },
    };
    mockExposeLiveSnapshot = true;
    mockGetLiveSnapshot.mockResolvedValue(fullSnapshot);
    const refetchDetail = jest
      .fn()
      .mockResolvedValueOnce(openSnapshot)
      .mockResolvedValue(fullSnapshot);
    mockJoinQuest.mockRejectedValueOnce(
      new ApiError(409, "QUEST_FULL", "full")
    );
    const showError = jest.spyOn(sweetAlert, "showSweetAlert");
    const closeConfirmation = jest.fn();
    const transitions = {
      beginLiveAction: jest.fn(() => true),
      endLiveAction: jest.fn(),
      closeConfirmation,
    };
    const context = {
      questId,
      viewerId,
      quest: null,
      messages: questBoardMessages.en,
      transitions,
    } as never;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    try {
      const hook = await renderHook(
        () => ({
          snapshot: useQuery({ queryKey: key, queryFn: refetchDetail }),
          actions: useQuestDetailLiveActions(context),
        }),
        { wrapper }
      );
      await waitFor(() => expect(hook.result.current).not.toBeNull());
      await waitFor(() =>
        expect(hook.result.current.snapshot.data).toEqual(openSnapshot)
      );
      await act(async () => {
        await hook.result.current.actions.join();
      });
      expect(refetchDetail).toHaveBeenCalledTimes(2);
      expect(hook.result.current.snapshot.data).toEqual(fullSnapshot);
      expect(closeConfirmation).toHaveBeenCalledTimes(1);
      expect(showError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: questBoardMessages.en.groupFcfsLastSpotTaken,
        })
      );
    } finally {
      queryClient.clear();
      showError.mockRestore();
    }
  });
  it("treats direct-join ALREADY_JOINED as success after refetch", async () => {
    const queryClient = new QueryClient();
    const questId = "quest-already-joined";
    const viewerId = "worker-already-joined";
    const key = questBoardQueries.questBoardKeys.liveSnapshot(
      questId,
      viewerId
    );
    const openSnapshot = {
      state: "QUEST_OPEN",
      quest: { id: questId, headcount: 2, activeWorkerCount: 1 },
      assignment: null,
    };
    const joinedSnapshot = {
      state: "QUEST_ASSIGNED",
      quest: { id: questId, headcount: 2, activeWorkerCount: 2 },
      assignment: { state: "ASSIGNMENT_ACTIVE" },
    };
    mockExposeLiveSnapshot = true;
    mockGetLiveSnapshot.mockResolvedValue(joinedSnapshot);
    const refetchDetail = jest
      .fn()
      .mockResolvedValueOnce(openSnapshot)
      .mockResolvedValue(joinedSnapshot);
    mockJoinQuest.mockRejectedValueOnce(
      new ApiError(409, "ALREADY_JOINED", "already joined")
    );
    const showAlert = jest.spyOn(sweetAlert, "showSweetAlert");
    const transitions = {
      beginLiveAction: jest.fn(() => true),
      endLiveAction: jest.fn(),
      closeConfirmation: jest.fn(),
    };
    const context = {
      questId,
      viewerId,
      quest: null,
      messages: questBoardMessages.en,
      transitions,
    } as never;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    try {
      const hook = await renderHook(
        () => ({
          snapshot: useQuery({ queryKey: key, queryFn: refetchDetail }),
          actions: useQuestDetailLiveActions(context),
        }),
        { wrapper }
      );
      await waitFor(() =>
        expect(hook.result.current.snapshot.data).toEqual(openSnapshot)
      );
      let joinResult: unknown;
      await act(async () => {
        joinResult = await hook.result.current.actions.join();
      });
      expect(joinResult).toBe(true);
      await waitFor(() =>
        expect(hook.result.current.snapshot.data).toEqual(joinedSnapshot)
      );
      expect(showAlert).not.toHaveBeenCalled();
    } finally {
      queryClient.clear();
      showAlert.mockRestore();
    }
  });
  it.each([
    ["QUEST_NOT_OPEN", "joinQuestNotOpen"],
    ["QUEST_ROSTER_FROZEN", "joinQuestRosterFrozen"],
    ["HIRER_CANNOT_JOIN", "joinQuestHirerCannotJoin"],
    ["MEMBER_RED_FLAGGED", "joinQuestMemberRestricted"],
    ["QUEST_MODE_NOT_ALLOWED", "joinQuestModeNotAllowed"],
    ["QUEST_PARTICIPATION_NOT_ALLOWED", "joinQuestParticipationNotAllowed"],
  ] as const)("refreshes and localizes direct-join %s", async (code, key) => {
    const queryClient = new QueryClient();
    const questId = "quest-join-rejected";
    const viewerId = "worker-join-rejected";
    const closedSnapshot = {
      state: "QUEST_ASSIGNED",
      quest: { id: questId, headcount: 1, activeWorkerCount: 1 },
    };
    mockExposeLiveSnapshot = true;
    mockGetLiveSnapshot.mockResolvedValue(closedSnapshot);
    mockJoinQuest.mockRejectedValueOnce(new ApiError(409, code, "rejected"));
    const showError = jest.spyOn(sweetAlert, "showErrorAlert");
    const closeConfirmation = jest.fn();
    const transitions = {
      beginLiveAction: jest.fn(() => true),
      endLiveAction: jest.fn(),
      closeConfirmation,
    };
    const context = {
      questId,
      viewerId,
      quest: null,
      messages: questBoardMessages.en,
      transitions,
    } as never;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    try {
      const hook = await renderHook(() => useQuestDetailLiveActions(context), {
        wrapper,
      });
      await act(async () => {
        await hook.result.current.join();
      });
      expect(mockGetLiveSnapshot).toHaveBeenCalledWith(questId, viewerId);
      expect(
        queryClient.getQueryData(
          questBoardQueries.questBoardKeys.liveSnapshot(questId, viewerId)
        )
      ).toEqual(closedSnapshot);
      expect(showError).toHaveBeenCalledWith(
        questBoardMessages.en.actionFailedTitle,
        questBoardMessages.en[key]
      );
      expect(closeConfirmation).toHaveBeenCalledTimes(
        code === "QUEST_NOT_OPEN" ? 1 : 0
      );
    } finally {
      queryClient.clear();
      showError.mockRestore();
    }
  });
  it("keeps full capacity visible and disables confirmation in the sheet", async () => {
    const fixture = questFixtureAdapter.listBoardQuests(
      "student-001",
      questFixtureAdapter.now
    )[0];
    const quest = {
      ...fixture,
      participationMode: "team" as const,
      candidateMode: "NO_CANDIDATE" as const,
      headcount: 4,
      acceptedParticipants: 4,
    };
    const onConfirm = jest.fn();
    const view = await render(
      <QuestDetailSheets
        confirmationSheet={{
          locale: "en",
          messages: questBoardMessages.en,
          quest,
          onCancel: jest.fn(),
          onConfirm,
          capacityFull: true,
        }}
      />
    );
    expect(
      view.getByText(questBoardMessages.en.groupFcfsFullForOthers)
    ).toBeTruthy();
    const confirm = view.getByTestId("confirm-quest-application");
    expect(confirm.props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
