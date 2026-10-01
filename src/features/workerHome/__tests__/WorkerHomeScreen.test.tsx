import { act, fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithQueryClient } from "@/testing/queryTestUtils";
import { questApi } from "@/api/QuestApi";
import { resetServerClock } from "@/api/serverClock";
import { liveQuestService } from "@/features/questBoard/live/liveQuestService";
import type {
  QuestV2BoardCard,
  QuestV2MyAssignment,
  QuestV2UnderfilledSummary,
} from "@/api/questV2Contracts";
import { subscribeToQuestBoardEvents } from "@/features/questBoard/live/questEvents";
import { QuestUnderfilledState } from "@/features/questBoard/domain/types";
import WorkerHomeScreen from "../WorkerHomeScreen";
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));

jest.mock("@/api/QuestApi", () => ({
  questApi: {
    getParticipationDetail: jest.fn(),
    listMyAssignments: jest.fn(),
    listBoard: jest.fn(),
    listTags: jest.fn(),
  },
}));

jest.mock("@/features/questBoard/live/questEvents", () => ({
  subscribeToQuestBoardEvents: jest.fn(),
}));

jest.mock("@/features/auth/sessionQueries", () => ({
  useSessionQuery: () => ({ data: { user: { id: "worker-1" } } }),
}));

describe("WorkerHomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(subscribeToQuestBoardEvents)
      .mockReset()
      .mockReturnValue(jest.fn());
    (questApi.listMyAssignments as jest.Mock).mockResolvedValue([]);
    (questApi.listBoard as jest.Mock).mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    (questApi.listTags as jest.Mock).mockResolvedValue([
      { id: "tag-1", name: "Printing" },
      { id: "tag-2", name: "Design" },
    ]);
    (questApi.listMyAssignments as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
    resetServerClock();
  });

  function makeAssignment(
    state: QuestV2UnderfilledSummary["state"],
    cancellationReason: QuestV2UnderfilledSummary["cancellationReason"] = null,
    questId = "quest-1"
  ): QuestV2MyAssignment {
    const needsConsent =
      state === QuestUnderfilledState.UNDERFILLED_CONSENT_PENDING;
    return {
      id: `assignment-${questId}`,
      questId,
      workerId: "worker-1",
      state: "ASSIGNMENT_ACTIVE",
      questState:
        state === QuestUnderfilledState.UNDERFILLED_COMPLETED
          ? "QUEST_ASSIGNED"
          : "QUEST_OPEN",
      startedAt: null,
      createdAt: "2026-10-01T00:00:00.000Z",
      underfilled: {
        state,
        decision: { expiresAt: "2026-10-01T00:10:00.000Z" },
        consent: {
          expiresAt: needsConsent ? "2026-10-01T00:01:30.000Z" : null,
        },
        activeWorkerCount: 1,
        headcount: 2,
        cancellationReason,
      },
    };
  }

  it("renders the Work header without a workspace status badge", async () => {
    const view = await renderWithQueryClient(<WorkerHomeScreen />);

    await waitFor(() => {
      expect(view.getByTestId("worker-home-title")).toBeTruthy();
    });

    expect(view.getByText("Work")).toBeTruthy();
    expect(view.queryByTestId("worker-workspace-badge")).toBeNull();
    expect(view.queryByText("Worker")).toBeNull();
    expect(view.queryByTestId("switch-to-hirer-button")).toBeNull();
  });

  it("renders the search bar and quick tag filters", async () => {
    const view = await renderWithQueryClient(<WorkerHomeScreen />);

    await waitFor(() => {
      expect(view.getByTestId("worker-quest-search-input")).toBeTruthy();
      expect(view.getByTestId("tag-pill-all")).toBeTruthy();
      expect(view.getByTestId("tag-pill-tag-1")).toBeTruthy();
      expect(view.getByTestId("tag-pill-tag-2")).toBeTruthy();
    });

    expect(view.getByText("Printing")).toBeTruthy();
    expect(view.getByText("Design")).toBeTruthy();
  });

  it("queries the board with search text when typing in search input", async () => {
    const view = await renderWithQueryClient(<WorkerHomeScreen />);

    await waitFor(() => {
      expect(view.getByTestId("worker-quest-search-input")).toBeTruthy();
    });

    await fireEvent.changeText(
      view.getByTestId("worker-quest-search-input"),
      "poster"
    );
    await waitFor(() => {
      expect(questApi.listBoard).toHaveBeenCalledWith(
        expect.objectContaining({ q: "poster" }),
        expect.anything()
      );
    });
  });

  it("queries the board with tagId when a quick tag pill is pressed", async () => {
    const view = await renderWithQueryClient(<WorkerHomeScreen />);

    await waitFor(() => {
      expect(view.getByTestId("tag-pill-tag-1")).toBeTruthy();
    });

    await fireEvent.press(view.getByTestId("tag-pill-tag-1"));

    await waitFor(() => {
      expect(questApi.listBoard).toHaveBeenCalledWith(
        expect.objectContaining({ tagId: "tag-1" }),
        expect.anything()
      );
    });
  });

  it("refreshes filtered Worker Board results after an invalidation", async () => {
    let boardChanged = false;
    let invalidateBoard: (() => void) | undefined;
    const boardQuest = (id: string, title: string, questReward: number) => ({
      id,
      title,
      questReward,
      tag: { id: "tag-1", name: "Printing" },
      mode: "FIRST_COME_FIRST_SERVED",
      participation: "SINGLE",
      headcount: 1,
      activeWorkerCount: 0,
      startTime: "2026-09-18T12:00:00Z",
      dueAt: "2026-09-19T12:00:00Z",
      hirerName: "Prof. Somchai",
      location: "Main Library",
    });
    const currentQuest = boardQuest(
      "quest-current",
      "Poster Design Draft",
      250
    );
    const publishedQuest = boardQuest(
      "quest-published",
      "Poster Design Published",
      300
    );
    (questApi.listBoard as jest.Mock).mockImplementation(
      ({ q, tagId }: { q?: string; tagId?: string | null }) =>
        Promise.resolve({
          items:
            q === "poster" && tagId === "tag-1"
              ? [boardChanged ? publishedQuest : currentQuest]
              : [],
          nextCursor: null,
        })
    );
    jest
      .mocked(subscribeToQuestBoardEvents)
      .mockImplementation((onInvalidated) => {
        invalidateBoard = () =>
          onInvalidated({
            type: "QUEST_BOARD_INVALIDATED",
            version: 1,
            questId: "00000000-0000-4000-8000-000000000001",
          });
        return jest.fn();
      });

    const view = await renderWithQueryClient(<WorkerHomeScreen />);
    await waitFor(() =>
      expect(view.getByTestId("worker-quest-search-input")).toBeTruthy()
    );
    await fireEvent.changeText(
      view.getByTestId("worker-quest-search-input"),
      "poster"
    );
    await fireEvent.press(view.getByTestId("tag-pill-tag-1"));

    await waitFor(() =>
      expect(view.getByTestId("worker-feed-card-quest-current")).toBeTruthy()
    );
    expect(questApi.listBoard).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: "poster", tagId: "tag-1" }),
      expect.anything()
    );
    expect(subscribeToQuestBoardEvents).toHaveBeenCalledTimes(1);

    boardChanged = true;
    await act(async () => {
      if (!invalidateBoard) throw new Error("Expected Board subscription");
      invalidateBoard();
    });

    await waitFor(() =>
      expect(view.getByTestId("worker-feed-card-quest-published")).toBeTruthy()
    );
    expect(questApi.listBoard).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: "poster", tagId: "tag-1" }),
      expect.anything()
    );
  });
  it("keeps background Board refresh separate from pull-to-refresh indicator", async () => {
    let releaseBoardRefetch!: () => void;
    let releasePullRefetch!: () => void;
    const currentQuest: QuestV2BoardCard = {
      id: "quest-current",
      title: "Current Poster",
      questReward: 250,
      tag: { id: "tag-1", name: "Printing" },
      mode: "FIRST_COME_FIRST_SERVED",
      participation: "SINGLE",
      headcount: 1,
      activeWorkerCount: 0,
      startTime: "2026-09-18T12:00:00Z",
      dueAt: "2026-09-19T12:00:00Z",
      hirerName: "Prof. Somchai",
      location: "Main Library",
    };
    const updatedQuest: QuestV2BoardCard = {
      ...currentQuest,
      id: "quest-updated",
      title: "Updated Poster",
    };
    const listBoard = jest.mocked(questApi.listBoard);
    listBoard
      .mockResolvedValueOnce({ items: [currentQuest], nextCursor: null })
      .mockImplementationOnce(async () => {
        await new Promise<void>((resolve) => {
          releaseBoardRefetch = resolve;
        });
        return { items: [updatedQuest], nextCursor: null };
      });
    let invalidateBoard: (() => void) | undefined;
    jest
      .mocked(subscribeToQuestBoardEvents)
      .mockImplementation((onInvalidated) => {
        invalidateBoard = () =>
          onInvalidated({
            type: "QUEST_BOARD_INVALIDATED",
            version: 1,
            questId: "00000000-0000-4000-8000-000000000001",
          });
        return jest.fn();
      });

    const view = await renderWithQueryClient(<WorkerHomeScreen />);
    await waitFor(() =>
      expect(view.getByTestId("worker-feed-card-quest-current")).toBeTruthy()
    );

    await act(async () => {
      if (!invalidateBoard) throw new Error("Expected Board subscription");
      invalidateBoard();
    });
    await waitFor(() => expect(listBoard).toHaveBeenCalledTimes(2));
    await act(async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
    });
    expect(
      view.getByTestId("worker-home-scroll").props.refreshControl.props
        .refreshing
    ).toBe(false);

    await act(async () => {
      releaseBoardRefetch();
    });
    await waitFor(() =>
      expect(view.getByTestId("worker-feed-card-quest-updated")).toBeTruthy()
    );

    listBoard.mockImplementationOnce(async () => {
      await new Promise<void>((resolve) => {
        releasePullRefetch = resolve;
      });
      return { items: [updatedQuest], nextCursor: null };
    });
    await act(async () => {
      view
        .getByTestId("worker-home-scroll")
        .props.refreshControl.props.onRefresh();
    });
    await waitFor(() =>
      expect(
        view.getByTestId("worker-home-scroll").props.refreshControl.props
          .refreshing
      ).toBe(true)
    );
    await act(async () => {
      releasePullRefetch();
    });
    await waitFor(() =>
      expect(
        view.getByTestId("worker-home-scroll").props.refreshControl.props
          .refreshing
      ).toBe(false)
    );
  });

  it("shows Board error and retries Board while assignments succeed", async () => {
    (questApi.listBoard as jest.Mock)
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValue({ items: [], nextCursor: null });

    const view = await renderWithQueryClient(<WorkerHomeScreen />);

    await waitFor(() => {
      expect(view.getByText("Couldn't load available quests")).toBeTruthy();
      expect(questApi.listMyAssignments).toHaveBeenCalled();
    });
    expect(view.queryByText("No open quests right now")).toBeNull();

    await fireEvent.press(view.getByText("Try again"));

    await waitFor(() => {
      expect(questApi.listBoard).toHaveBeenCalledTimes(2);
      expect(view.getByText("No open quests right now")).toBeTruthy();
    });
  });

  it("shows tag-unavailable copy and retries the tag request", async () => {
    (questApi.listTags as jest.Mock)
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValue([{ id: "tag-1", name: "Printing" }]);

    const view = await renderWithQueryClient(<WorkerHomeScreen />);

    await waitFor(() => {
      expect(view.getByText("Tags unavailable")).toBeTruthy();
    });
    await fireEvent.press(view.getByText("Try again"));

    await waitFor(() => {
      expect(questApi.listTags).toHaveBeenCalledTimes(2);
      expect(view.getByTestId("tag-pill-tag-1")).toBeTruthy();
    });
  });

  it("keeps the quest feed available when active assignments fail", async () => {
    (questApi.listMyAssignments as jest.Mock)
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValue([]);
    (questApi.listBoard as jest.Mock).mockResolvedValue({
      items: [
        {
          id: "quest-available",
          title: "Available Quest",
          questReward: 250,
          tag: { id: "tag-1", name: "Printing" },
          mode: "FIRST_COME_FIRST_SERVED",
          participation: "SINGLE",
          headcount: 1,
          activeWorkerCount: 0,
          startTime: "2026-09-18T12:00:00Z",
          dueAt: "2026-09-19T12:00:00Z",
          hirerName: "Prof. Somchai",
          location: "Main Library",
        },
      ],
      nextCursor: null,
    });

    const view = await renderWithQueryClient(<WorkerHomeScreen />);

    await waitFor(() => {
      expect(view.getByTestId("worker-assignment-error")).toBeTruthy();
      expect(view.getByTestId("worker-feed-card-quest-available")).toBeTruthy();
    });
    await fireEvent.press(view.getByText("Try again"));

    await waitFor(() => {
      expect(questApi.listMyAssignments).toHaveBeenCalledTimes(2);
      expect(view.getByTestId("worker-feed-card-quest-available")).toBeTruthy();
    });
  });

  it("applies shared filter-sheet tag and reward bounds to Worker Board", async () => {
    const boardQuest = (id: string, title: string, questReward: number) => ({
      id,
      title,
      questReward,
      tag: { id: "tag-1", name: "Printing" },
      mode: "FIRST_COME_FIRST_SERVED",
      participation: "SINGLE",
      headcount: 1,
      activeWorkerCount: 0,
      startTime: "2026-09-18T12:00:00Z",
      dueAt: "2026-09-19T12:00:00Z",
      hirerName: "Prof. Somchai",
      location: "Main Library",
    });
    (questApi.listBoard as jest.Mock).mockResolvedValue({
      items: [
        boardQuest("quest-in-range", "In range", 300),
        boardQuest("quest-out-of-range", "Out of range", 700),
      ],
      nextCursor: null,
    });
    const view = await renderWithQueryClient(<WorkerHomeScreen />);
    await waitFor(() =>
      expect(view.getByTestId("worker-filter-button")).toBeTruthy()
    );

    await fireEvent.press(view.getByTestId("worker-filter-button"));
    await fireEvent.changeText(
      view.getByTestId("quest-filter-tag-search"),
      "Print"
    );
    await fireEvent.press(view.getByTestId("quest-filter-tag-Printing"));
    await fireEvent.changeText(
      view.getByTestId("quest-filter-reward-min"),
      "100"
    );
    await fireEvent.changeText(
      view.getByTestId("quest-filter-reward-max"),
      "500"
    );
    await fireEvent.press(view.getByTestId("apply-quest-filters"));

    await waitFor(() => {
      expect(questApi.listBoard).toHaveBeenLastCalledWith(
        expect.objectContaining({ tagId: "tag-1" }),
        expect.anything()
      );
      expect(view.getByTestId("worker-feed-card-quest-in-range")).toBeTruthy();
      expect(
        view.queryByTestId("worker-feed-card-quest-out-of-range")
      ).toBeNull();
      expect(
        view.getByTestId("tag-pill-tag-1").props.accessibilityState
      ).toEqual(expect.objectContaining({ selected: true }));
    });
  });

  it("renders quest board cards and navigates to quest details on press", async () => {
    (questApi.listBoard as jest.Mock).mockResolvedValue({
      items: [
        {
          id: "quest-100",
          title: "Library Book Scanning",
          questReward: 250,
          tag: { id: "tag-1", name: "Campus" },
          mode: "FIRST_COME_FIRST_SERVED",
          participation: "SINGLE",
          headcount: 1,
          activeWorkerCount: 0,
          startTime: "2026-09-18T12:00:00Z",
          dueAt: "2026-09-19T12:00:00Z",
          hirerName: "Prof. Somchai",
          location: "Main Library",
        },
      ],
      nextCursor: null,
    });

    const view = await renderWithQueryClient(<WorkerHomeScreen />);

    await waitFor(() => {
      expect(view.getByTestId("worker-feed-card-quest-100")).toBeTruthy();
      expect(view.getByText("Library Book Scanning")).toBeTruthy();
      expect(view.getByText("฿250")).toBeTruthy();
    });

    await fireEvent.press(view.getByTestId("worker-feed-card-quest-100"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]",
      params: { id: "quest-100" },
    });
    expect(
      view.getByTestId("worker-feed-card-quest-100").props.accessibilityLabel
    ).not.toContain("workers joined");
  });

  it("shows GROUP capacity and full status while keeping full cards tappable", async () => {
    (questApi.listBoard as jest.Mock).mockResolvedValue({
      items: [
        {
          id: "quest-full",
          title: "Campus cleanup",
          questReward: 250,
          tag: null,
          mode: "FIRST_COME_FIRST_SERVED",
          participation: "GROUP",
          headcount: 2,
          activeWorkerCount: 2,
          startTime: "2026-09-18T12:00:00Z",
          dueAt: "2026-09-19T12:00:00Z",
          hirerName: "Prof. Somchai",
          location: null,
        },
      ],
      nextCursor: null,
    });
    const view = await renderWithQueryClient(<WorkerHomeScreen />);

    await waitFor(() => {
      expect(view.getByText("2 / 2 workers joined")).toBeTruthy();
      expect(view.getByText("Full")).toBeTruthy();
      expect(
        view.getByTestId("worker-feed-card-quest-full").props.accessibilityLabel
      ).toContain("2 / 2 workers joined");
    });
    await fireEvent.press(view.getByTestId("worker-feed-card-quest-full"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]",
      params: { id: "quest-full" },
    });
  });

  it("does NOT show Grab-like quick access bar when user has no active assignment", async () => {
    (questApi.listMyAssignments as jest.Mock).mockResolvedValue([]);

    const view = await renderWithQueryClient(<WorkerHomeScreen />);

    await waitFor(() => {
      expect(view.getByTestId("worker-home-title")).toBeTruthy();
    });

    expect(view.queryByTestId("worker-quick-access-bar")).toBeNull();
  });

  it("shows the quick access bar with quest state and name", async () => {
    (questApi.listMyAssignments as jest.Mock).mockResolvedValue([
      {
        id: "assign-active-1",
        questId: "quest-active-12345678",
        workerId: "worker-1",
        state: "ASSIGNMENT_ACTIVE",
        questState: "QUEST_IN_PROGRESS",
        startedAt: "2026-09-18T10:00:00Z",
        createdAt: "2026-09-18T09:00:00Z",
      },
    ]);
    (questApi.getParticipationDetail as jest.Mock).mockResolvedValue({
      id: "quest-active-12345678",
      title: "Library Setup",
      state: "QUEST_IN_PROGRESS",
    });

    const view = await renderWithQueryClient(<WorkerHomeScreen />);

    await waitFor(() => {
      expect(view.getByTestId("worker-quick-access-bar")).toBeTruthy();
      expect(view.getByText("In Progress")).toBeTruthy();
      expect(view.getByText(/Library Setup/)).toBeTruthy();
    });

    await fireEvent.press(view.getByTestId("worker-quick-access-bar"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]/work",
      params: { id: "quest-active-12345678" },
    });
  });

  it("shows the quick access bar while an assignment waits to start", async () => {
    (questApi.listMyAssignments as jest.Mock).mockResolvedValue([
      {
        id: "assign-assigned-1",
        questId: "quest-assigned-1",
        workerId: "worker-1",
        state: "ASSIGNMENT_ACTIVE",
        questState: "QUEST_ASSIGNED",
        startedAt: null,
        createdAt: "2026-09-18T09:00:00Z",
      },
    ]);
    (questApi.getParticipationDetail as jest.Mock).mockResolvedValue({
      id: "quest-assigned-1",
      title: "Campus Cleanup",
      state: "QUEST_ASSIGNED",
    });

    const view = await renderWithQueryClient(<WorkerHomeScreen />);

    await waitFor(() => {
      expect(view.getByTestId("worker-quick-access-bar")).toBeTruthy();
      expect(view.getByText(/Campus Cleanup/)).toBeTruthy();
    });
  });
  it("shows consent-required summary countdown, refetches once on expiry, and links to consent", async () => {
    resetServerClock();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-01T00:00:00.000Z"));
    const getLiveSnapshot = jest.spyOn(liveQuestService, "getLiveSnapshot");
    (questApi.listMyAssignments as jest.Mock).mockResolvedValue([
      makeAssignment(QuestUnderfilledState.UNDERFILLED_CONSENT_PENDING),
    ]);
    const view = await renderWithQueryClient(<WorkerHomeScreen />);

    expect(await view.findByText("Respond to revised terms")).toBeTruthy();
    expect(await view.findByText("Time remaining: 01:30")).toBeTruthy();
    expect(
      view.getByTestId("worker-home-underfilled-countdown").props
        .accessibilityLiveRegion
    ).toBe("none");
    await act(async () => {
      jest.advanceTimersByTime(31_000);
    });
    expect(view.getByText("Time remaining: 00:59")).toBeTruthy();
    expect(
      view.getByTestId("worker-home-underfilled-countdown").props
        .accessibilityLiveRegion
    ).toBe("polite");
    const initialCalls = (questApi.listMyAssignments as jest.Mock).mock.calls
      .length;
    await fireEvent.press(view.getByTestId("worker-home-underfilled-action"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]/partial-start",
      params: { id: "quest-1" },
    });

    jest.setSystemTime(new Date("2026-10-01T00:01:30.000Z"));
    await act(async () => {
      jest.advanceTimersByTime(1_000);
    });
    expect(view.getByText("Time ran out. Checking the result.")).toBeTruthy();
    await waitFor(() =>
      expect(questApi.listMyAssignments).toHaveBeenCalledTimes(initialCalls + 1)
    );
    await act(async () => {
      jest.advanceTimersByTime(2_000);
    });
    expect(questApi.listMyAssignments).toHaveBeenCalledTimes(initialCalls + 1);
    await fireEvent.press(view.getByTestId("worker-home-underfilled-action"));
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: "/quest/[id]",
      params: { id: "quest-1" },
    });
    expect(getLiveSnapshot).not.toHaveBeenCalled();
    await view.unmount();
  });

  it("shows each cancellation reason and generic cancellation only when reason is null", async () => {
    const cases = [
      ["HIRER_CANCELLED", "The Hirer cancelled this quest."],
      [
        "HIRER_NO_DECISION",
        "The Hirer did not decide in time; this quest was cancelled.",
      ],
      [
        "WORKER_DECLINED",
        "A worker declined the revised terms; this quest was cancelled.",
      ],
      [
        "CONSENT_TIMEOUT",
        "A worker did not respond in time; this quest was cancelled.",
      ],
      [null, "This quest was cancelled."],
    ] as const;
    for (const [reason, message] of cases) {
      (questApi.listMyAssignments as jest.Mock).mockResolvedValue([
        makeAssignment(QuestUnderfilledState.UNDERFILLED_CANCELLED, reason),
      ]);
      const view = await renderWithQueryClient(<WorkerHomeScreen />);
      expect(await view.findByText(message)).toBeTruthy();
      await fireEvent.press(view.getByTestId("worker-home-underfilled-action"));
      expect(mockPush).toHaveBeenLastCalledWith({
        pathname: "/quest/[id]",
        params: { id: "quest-1" },
      });
      await view.unmount();
    }
  });

  it("shows the decision-pending and accepted/assigned summary states", async () => {
    (questApi.listMyAssignments as jest.Mock).mockResolvedValue([
      makeAssignment(QuestUnderfilledState.UNDERFILLED_DECISION_PENDING),
    ]);
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-01T00:00:00.000Z"));
    const waiting = await renderWithQueryClient(<WorkerHomeScreen />);
    expect(
      await waiting.findByText(
        "Waiting for the Hirer to decide whether to proceed."
      )
    ).toBeTruthy();
    expect(await waiting.findByText("Time remaining: 10:00")).toBeTruthy();
    await fireEvent.press(
      waiting.getByTestId("worker-home-underfilled-action")
    );
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: "/quest/[id]",
      params: { id: "quest-1" },
    });
    await waiting.unmount();

    (questApi.listMyAssignments as jest.Mock).mockResolvedValue([
      makeAssignment(QuestUnderfilledState.UNDERFILLED_COMPLETED),
    ]);
    const assigned = await renderWithQueryClient(<WorkerHomeScreen />);
    expect(
      await assigned.findByText("Everyone agreed. Check Quest status.")
    ).toBeTruthy();
    await fireEvent.press(
      assigned.getByTestId("worker-home-underfilled-action")
    );
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: "/quest/[id]",
      params: { id: "quest-1" },
    });
    await assigned.unmount();
  });

  it("links additional pending summary actions to Work Management", async () => {
    (questApi.listMyAssignments as jest.Mock).mockResolvedValue([
      makeAssignment(QuestUnderfilledState.UNDERFILLED_CONSENT_PENDING),
      makeAssignment(
        QuestUnderfilledState.UNDERFILLED_DECISION_PENDING,
        null,
        "quest-2"
      ),
    ]);
    const view = await renderWithQueryClient(<WorkerHomeScreen />);
    expect(await view.findByText("+1 more pending action")).toBeTruthy();
    await fireEvent.press(view.getByTestId("worker-home-more-actions"));
    expect(mockPush).toHaveBeenCalledWith("/my-quests");
    await view.unmount();
  });
});
