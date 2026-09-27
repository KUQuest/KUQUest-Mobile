import {
  act,
  fireEvent,
  renderHook,
  waitFor,
} from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { renderWithQueryClient as render } from "@/testing/queryTestUtils";
import * as questDetailProjection from "../questDetailProjection";
import { getQuestDetailProjection } from "../questDetailProjection";
import {
  DEFAULT_PROTOTYPE_VIEWER_ID,
  questFixtureAdapter,
} from "../../fixtures/adapters/questFixtureAdapter";
import { questWorkflow } from "../../workflow/questWorkflow";
import QuestDetailScreen from "../QuestDetailScreen";
import { useQuestDetailReadSource } from "../useQuestDetailReadSource";
import * as questBoardQueries from "../../api/questBoardQueries";

const mockGetQuestDetail = jest.fn();
const mockGetLiveSnapshot = jest.fn();
let mockExposeLiveSnapshot = false;

jest.mock("../../live/liveQuestService", () => ({
  liveQuestService: {
    getQuestDetail: (...args: unknown[]) => mockGetQuestDetail(...args),
    get getLiveSnapshot() {
      return mockExposeLiveSnapshot ? mockGetLiveSnapshot : undefined;
    },
  },
}));

jest.mock("expo-router", () => ({
  useFocusEffect: () => undefined,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ id: "quest-1" }),
}));

describe("QuestDetailScreen smoke", () => {
  beforeEach(() => {
    mockGetQuestDetail.mockReset();
    mockGetLiveSnapshot.mockReset();
    mockExposeLiveSnapshot = false;
    questFixtureAdapter.reset();
  });
  afterEach(() => {
    questFixtureAdapter.reset();
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
