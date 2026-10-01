import { resetServerClock, syncServerClock } from "@/api/serverClock";
import { Fragment, useState } from "react";
import { act, fireEvent, waitFor } from "@testing-library/react-native";

import { SweetAlertHost } from "@/components/ui/SweetAlert";
import QuestWorkScreen from "../QuestWorkScreen";
import {
  liveQuestService,
  type LiveQuestSnapshot,
} from "../../live/liveQuestService";
import type { QuestV2Detail } from "@/api/questV2Contracts";
import { ApiError } from "@/api/ApiClient";
import { renderWithQueryClient } from "@/testing/queryTestUtils";

type BeforeRemoveEvent = {
  preventDefault: jest.Mock;
  data: { action: { type: string } };
};
let beforeRemoveHandler: ((event: BeforeRemoveEvent) => void) | undefined;
const mockDispatch = jest.fn();
const mockAddListener = jest.fn(
  (_event: string, handler: (event: BeforeRemoveEvent) => void) => {
    beforeRemoveHandler = handler;
    return jest.fn();
  }
);
const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockGetSession = jest.fn();
const mockMineDisputeQuery = jest.fn();
const mockIsMutating = jest.fn(() => 0);
jest.mock("expo-router", () => ({
  useFocusEffect: (effect: () => (() => void) | void) =>
    jest.requireActual("react").useEffect(effect, []),
  useLocalSearchParams: () => ({ id: "quest-work-1", viewerId: "worker-1" }),
  useNavigation: () => ({
    addListener: mockAddListener,
    dispatch: mockDispatch,
  }),
  useRouter: () => ({
    back: mockBack,
    canGoBack: () => true,
    push: mockPush,
    replace: mockReplace,
  }),
}));
const mockFileDispute = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useIsMutating: () => mockIsMutating(),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  SafeAreaView: "SafeAreaView",
}));

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));

jest.mock("@/features/auth/sessionQueries", () => ({
  useSessionQuery: () => ({ data: { user: { id: "worker-1" } } }),
}));
jest.mock("@/features/auth/AuthService", () => ({
  authService: { getSession: mockGetSession },
}));

jest.mock("../../live/liveQuestService", () => ({
  liveQuestService: {
    getLiveSnapshot: jest.fn(),
    respondToEditRequest: jest.fn(),
    confirmCompletion: jest.fn(),
    startWork: jest.fn(),
  },
}));

jest.mock("../../api/questBoardQueries", () => ({
  ...jest.requireActual("../../api/questBoardQueries"),
  useMyDisputeCaseQuery: () => mockMineDisputeQuery(),
  useFileDisputeMutation: () => ({
    mutate: (...args: unknown[]) => mockFileDispute(...args),
    isPending: false,
  }),
}));
jest.mock("@/features/questBoard/review/components/QuestReviewModal", () => {
  const React = jest.requireActual("react");
  const { Text, View } = jest.requireActual("react-native");
  return {
    QuestReviewModal: ({ questId }: { questId: string | null }) =>
      questId
        ? React.createElement(
            View,
            { testID: "quest-review-modal" },
            React.createElement(Text, null, questId)
          )
        : null,
  };
});

const mockedGetSnapshot =
  liveQuestService.getLiveSnapshot as jest.MockedFunction<
    typeof liveQuestService.getLiveSnapshot
  >;
const mockedRespondToEdit =
  liveQuestService.respondToEditRequest as jest.MockedFunction<
    typeof liveQuestService.respondToEditRequest
  >;
const mockedConfirmCompletion =
  liveQuestService.confirmCompletion as jest.MockedFunction<
    typeof liveQuestService.confirmCompletion
  >;
const mockedStartWork = liveQuestService.startWork as jest.MockedFunction<
  typeof liveQuestService.startWork
>;

type SnapshotOverrides = Omit<
  Partial<LiveQuestSnapshot>,
  "quest" | "assignment" | "workConversation" | "capabilities"
> & {
  quest?: Partial<QuestV2Detail>;
  assignment?: NonNullable<LiveQuestSnapshot["assignment"]> | null;
  workConversation?: NonNullable<LiveQuestSnapshot["workConversation"]> | null;
  capabilities?: Partial<LiveQuestSnapshot["capabilities"]>;
};

const defaultQuest = {
  id: "quest-work-1",
  version: 1,
  createdAt: "2020-01-01T08:00:00+07:00",
  updatedAt: "2020-01-01T08:00:00+07:00",
  hiddenAt: null,
  title: "Prepare the student workshop",
  description: "Prepare the student workshop materials.",
  state: "QUEST_ASSIGNED",
  mode: "FIRST_COME_FIRST_SERVED",
  participation: "SINGLE",
  startTime: new Date(Date.now() - 1_000).toISOString(),
  dueAt: "2099-01-01T18:00:00+07:00",
  proofRequired: true,
  condition: {
    items: [
      { position: 0, text: "Use the supplied workshop outline." },
      { position: 1, text: "Leave the room ready for the next class." },
    ],
  },
  tag: null,
  questFundingTotal: 100,
  headcount: 1,
  locations: [],
  images: [],
} satisfies QuestV2Detail;

const defaultAssignment = {
  id: "assignment-1",
  questId: "quest-work-1",
  workerId: "worker-1",
  state: "ASSIGNMENT_ACTIVE",
  questState: "QUEST_ASSIGNED",
  startedAt: null,
  createdAt: "2020-01-01T08:00:00+07:00",
} satisfies NonNullable<LiveQuestSnapshot["assignment"]>;

const defaultWorkConversation = {
  id: "conversation-work-1",
  type: "CONVERSATION_WORK",
  quest: {
    id: "quest-work-1",
    title: "Prepare the student workshop",
    status: "QUEST_ASSIGNED",
  },
  latestMessage: null,
  lastActivityAt: null,
  archived: false,
  readOnly: false,
  unreadCount: 0,
} satisfies NonNullable<LiveQuestSnapshot["workConversation"]>;

const defaultCapabilities = {
  canJoin: false,
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
  canReadWorkChat: true,
  canWriteWorkChat: true,
  canSubmitProof: false,
  canStartWork: false,
  canConfirmCompletion: false,
  canCancel: false,
  canReviewProof: false,
  canCreateReview: false,
} satisfies LiveQuestSnapshot["capabilities"];

function makeSnapshot(overrides: SnapshotOverrides = {}): LiveQuestSnapshot {
  const {
    quest: questOverride,
    assignment: assignmentOverride,
    workConversation: workConversationOverride,
    capabilities: capabilitiesOverride,
    ...rest
  } = overrides;

  return {
    viewerId: "worker-1",
    actor: "WORKER",
    quest: { ...defaultQuest, ...questOverride },
    state: "QUEST_ASSIGNED",
    mode: "FIRST_COME_FIRST_SERVED",
    participation: "SINGLE",
    assignment:
      assignmentOverride === null
        ? null
        : { ...defaultAssignment, ...assignmentOverride },
    assignments: [],
    application: null,
    applications: [],
    team: null,
    teams: [],
    underfilled: null,
    editRequest: null,
    proofs: [],
    workConversation:
      workConversationOverride === null
        ? null
        : { ...defaultWorkConversation, ...workConversationOverride },
    proofRequired: true,
    dueAt: "2099-01-01T18:00:00+07:00",
    nextAction: "WAIT_FOR_START",
    capabilities: { ...defaultCapabilities, ...capabilitiesOverride },
    ...rest,
  };
}

describe("QuestWorkScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    beforeRemoveHandler = undefined;
    mockGetSession.mockResolvedValue({ user: { id: "worker-1" } });
    mockIsMutating.mockReturnValue(0);
    mockedRespondToEdit.mockResolvedValue(makeSnapshot().editRequest as never);
  });
  afterEach(() => {
    jest.useRealTimers();
    resetServerClock();
    jest.restoreAllMocks();
  });
  it("gates Start Work with Server time at both boundaries despite device clock skew", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-01T00:00:00.000Z"));
    const quest = {
      startTime: "2099-08-26T09:00:00+07:00",
      dueAt: "2099-08-26T10:00:00+07:00",
    };
    mockedGetSnapshot.mockImplementation(async () =>
      makeSnapshot({
        quest,
        dueAt: quest.dueAt,
        capabilities: { canStartWork: true },
      })
    );

    syncServerClock("2099-08-26T08:59:59+07:00", null);
    const view = await renderWithQueryClient(
      <QuestWorkScreen questId="quest-work-1" viewerId="worker-1" />
    );
    expect(view.queryByRole("button", { name: "Start Work" })).toBeNull();

    syncServerClock("2099-08-26T09:00:00+07:00", null);
    await act(async () => jest.advanceTimersByTime(1_000));
    expect(
      await view.findByRole("button", { name: "Start Work" })
    ).toBeTruthy();

    syncServerClock("2099-08-26T10:00:00+07:00", null);
    await act(async () => jest.advanceTimersByTime(1_000));
    expect(view.queryByRole("button", { name: "Start Work" })).toBeNull();
  });
  it("refreshes the Work Hub countdown using Server time", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-01T00:00:00.000Z"));
    const serverNow = "2099-08-26T09:00:00+07:00";
    const dueAt = "2099-08-26T09:01:30+07:00";
    syncServerClock(serverNow, null);
    mockedGetSnapshot.mockImplementation(async () =>
      makeSnapshot({
        dueAt,
        quest: { dueAt },
      })
    );

    const view = await renderWithQueryClient(
      <QuestWorkScreen questId="quest-work-1" viewerId="worker-1" />
    );
    expect(await view.findByText("1m remaining")).toBeTruthy();

    await act(async () => jest.advanceTimersByTime(91_000));
    expect(view.getByText("Due now")).toBeTruthy();
  });
  it("refreshes server state once when Start Work deadline expires", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-01T00:00:00.000Z"));
    const startTime = "2099-08-26T09:00:00+07:00";
    const dueAt = "2099-08-26T10:00:00+07:00";
    let snapshotReads = 0;
    mockedGetSnapshot.mockImplementation(async () => {
      snapshotReads += 1;
      return makeSnapshot({
        state: snapshotReads === 1 ? "QUEST_ASSIGNED" : "QUEST_FAILED",
        quest: { startTime, dueAt },
        dueAt,
        capabilities: { canStartWork: true },
      });
    });
    syncServerClock("2099-08-26T09:59:59+07:00", null);
    mockMineDisputeQuery.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      isFetching: false,
      data: { case: null },
      refetch: jest.fn(),
    });

    const view = await renderWithQueryClient(
      <QuestWorkScreen questId="quest-work-1" viewerId="worker-1" />
    );
    expect(await view.findByText("Assigned")).toBeTruthy();

    await act(async () => jest.advanceTimersByTime(1_000));

    expect(await view.findByText("Archived")).toBeTruthy();
    expect(snapshotReads).toBe(2);
  });

  it("confirms before leaving with an unsent proof", async () => {
    mockedGetSnapshot.mockResolvedValue(
      makeSnapshot({ capabilities: { canSubmitProof: true } })
    );
    const view = await renderWithQueryClient(
      <Fragment>
        <QuestWorkScreen questId="quest-work-1" viewerId="worker-1" />
        <SweetAlertHost />
      </Fragment>
    );
    await fireEvent.changeText(
      await view.findByLabelText("Work description (optional)"),
      "Unsent notes"
    );

    const keepEvent = {
      preventDefault: jest.fn(),
      data: { action: { type: "GO_BACK" } },
    };
    await act(async () => beforeRemoveHandler?.(keepEvent));
    expect(keepEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(view.getByText("Discard proof draft?")).toBeTruthy();
    await fireEvent.press(view.getByRole("button", { name: "Keep editing" }));
    expect(mockDispatch).not.toHaveBeenCalled();

    const discardEvent = {
      preventDefault: jest.fn(),
      data: { action: { type: "GO_BACK" } },
    };
    await act(async () => beforeRemoveHandler?.(discardEvent));
    expect(discardEvent.preventDefault).toHaveBeenCalledTimes(1);
    await fireEvent.press(view.getByRole("button", { name: "Discard" }));
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(discardEvent.data.action);
  });

  it("does not prompt for a server-saved proof draft alone", async () => {
    mockedGetSnapshot.mockResolvedValue(
      makeSnapshot({
        capabilities: { canSubmitProof: true },
        proofs: [
          {
            id: "draft-1",
            workerId: "worker-1",
            submittedByUserId: "worker-1",
            teamId: null,
            submittedAt: null,
            description: "Saved notes",
            files: [],
          },
        ] as never,
      })
    );
    const view = await renderWithQueryClient(
      <QuestWorkScreen questId="quest-work-1" viewerId="worker-1" />
    );
    await view.findByDisplayValue("Saved notes");
    const event = {
      preventDefault: jest.fn(),
      data: { action: { type: "GO_BACK" } },
    };
    await act(async () => beforeRemoveHandler?.(event));
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(view.queryByText("Discard proof draft?")).toBeNull();
  });

  it("shows Rate the Hirer to an eligible Worker and opens the review modal", async () => {
    mockedGetSnapshot.mockResolvedValue(
      makeSnapshot({
        state: "QUEST_COMPLETED",
        quest: { state: "QUEST_COMPLETED" },
        capabilities: { canCreateReview: true },
      })
    );
    const view = await renderWithQueryClient(
      <QuestWorkScreen questId="quest-work-1" viewerId="worker-1" />
    );
    await fireEvent.press(
      await view.findByRole("button", { name: "Rate the Hirer" })
    );
    expect(view.getByTestId("quest-review-modal")).toBeTruthy();
    expect(view.getByText("quest-work-1")).toBeTruthy();
  });

  it.each([
    ["the Hirer", { actor: "HIRER" as const }],
    [
      "a Worker without permission",
      { capabilities: { canCreateReview: false } },
    ],
  ])("hides Rate the Hirer for %s", async (_label, overrides) => {
    mockedGetSnapshot.mockResolvedValue(
      makeSnapshot({
        state: "QUEST_COMPLETED",
        quest: { state: "QUEST_COMPLETED" },
        ...overrides,
      })
    );
    const view = await renderWithQueryClient(
      <QuestWorkScreen questId="quest-work-1" viewerId="worker-1" />
    );
    expect(view.queryByRole("button", { name: "Rate the Hirer" })).toBeNull();
  });

  it("gates Work Hub dispute action on server status and hides it after filing", async () => {
    type MineQueryState = {
      isPending: boolean;
      isError: boolean;
      isSuccess: boolean;
      isFetching: boolean;
      data: { case: { displayId: string } | null } | undefined;
      refetch: () => void;
    };
    let updateDisputeQueryState: ((next: MineQueryState) => void) | undefined;
    mockMineDisputeQuery.mockImplementation(() => {
      const [state, setState] = useState<MineQueryState>({
        isPending: true,
        isError: false,
        isSuccess: false,
        isFetching: true,
        data: undefined,
        refetch: jest.fn(),
      });
      updateDisputeQueryState = setState;
      return state;
    });
    mockedGetSnapshot.mockResolvedValue(
      makeSnapshot({
        state: "QUEST_FAILED",
        nextAction: "CREATE_REVIEW",
        quest: { state: "QUEST_FAILED" },
        assignment: {
          ...defaultAssignment,
          state: "ASSIGNMENT_INCOMPLETE",
          questState: "QUEST_FAILED",
        },
      })
    );
    const view = await renderWithQueryClient(
      <Fragment>
        <QuestWorkScreen questId="quest-work-1" viewerId="worker-1" />
        <SweetAlertHost />
      </Fragment>
    );
    await waitFor(() =>
      expect(
        view.getByText(
          "This Quest is terminal. Work Chat remains available as a read-only archive."
        )
      ).toBeTruthy()
    );
    expect(view.queryByRole("button", { name: "File Dispute" })).toBeNull();

    await act(async () =>
      updateDisputeQueryState?.({
        isPending: false,
        isError: true,
        isSuccess: false,
        isFetching: false,
        data: undefined,
        refetch: jest.fn(),
      })
    );
    expect(view.getByText("Couldn't check dispute status.")).toBeTruthy();
    expect(view.getByRole("button", { name: "Retry" })).toBeTruthy();
    expect(view.queryByRole("button", { name: "File Dispute" })).toBeNull();

    await act(async () =>
      updateDisputeQueryState?.({
        isPending: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        data: { case: null },
        refetch: jest.fn(),
      })
    );
    await fireEvent.press(view.getByRole("button", { name: "File Dispute" }));
    await fireEvent.press(view.getByRole("button", { name: "File" }));
    await act(async () => {
      mockIsMutating.mockReturnValue(1);
      updateDisputeQueryState?.({
        isPending: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        data: { case: null },
        refetch: jest.fn(),
      });
    });
    expect(
      view.getByRole("button", { name: "File Dispute" }).props
        .accessibilityState
    ).toEqual({ disabled: true, busy: true });
    await act(async () => {
      mockIsMutating.mockReturnValue(0);
      mockFileDispute.mock.calls[0][1].onSuccess({ displayId: "DC-000123" });
      updateDisputeQueryState?.({
        isPending: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
        data: { case: { displayId: "DC-000123" } },
        refetch: jest.fn(),
      });
    });

    expect(view.getByText("Dispute filed")).toBeTruthy();
    expect(view.queryByRole("button", { name: "File Dispute" })).toBeNull();
  });

  it("renders an assigned wait state with canonical conditions and due countdown", async () => {
    mockedGetSnapshot.mockResolvedValue(makeSnapshot());
    const view = await renderWithQueryClient(
      <QuestWorkScreen questId="quest-work-1" viewerId="worker-1" />
    );

    await waitFor(() =>
      expect(
        view.getAllByText("Waiting for work to start").length
      ).toBeGreaterThan(0)
    );
    expect(view.getByText("Use the supplied workshop outline.")).toBeTruthy();
    expect(view.getByText("Due")).toBeTruthy();
    expect(view.getByText(/remaining/)).toBeTruthy();
    expect(mockedGetSnapshot).toHaveBeenCalledWith(
      "quest-work-1",
      "worker-1",
      expect.objectContaining({ signal: expect.anything() })
    );
  });

  it("keeps refreshing while other Workers still have to press Start Work", async () => {
    jest.useFakeTimers();
    const waiting = makeSnapshot({
      participation: "GROUP",
      assignment: { ...defaultAssignment, startedAt: "2020-01-01T08:00:00Z" },
    });
    const inProgress = makeSnapshot({
      state: "QUEST_IN_PROGRESS",
      participation: "GROUP",
      nextAction: "SUBMIT_PROOF",
      quest: { ...defaultQuest, state: "QUEST_IN_PROGRESS" },
    });
    mockedGetSnapshot
      .mockResolvedValueOnce(waiting)
      .mockResolvedValue(inProgress);
    const view = await renderWithQueryClient(
      <QuestWorkScreen questId="quest-work-1" viewerId="worker-1" />
    );
    expect(await view.findByText(/Waiting for the other Workers/)).toBeTruthy();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(5_000);
    });

    expect(await view.findByText("In progress")).toBeTruthy();
    expect(view.queryByRole("button", { name: "Start Work" })).toBeNull();
    jest.useRealTimers();
  });

  it("offers Start Work to a required starter only once startTime is reached", async () => {
    mockedGetSnapshot.mockResolvedValue(
      makeSnapshot({
        quest: {
          ...defaultQuest,
          startTime: new Date(Date.now() + 3_600_000).toISOString(),
        },
        capabilities: { canStartWork: true },
      })
    );
    const view = await renderWithQueryClient(
      <QuestWorkScreen questId="quest-work-1" viewerId="worker-1" />
    );

    expect(await view.findByText(/^Start Work opens at/)).toBeTruthy();
    expect(view.queryByRole("button", { name: "Start Work" })).toBeNull();
  });

  it("records Start Work and waits for other Workers while the Quest stays assigned", async () => {
    const required = makeSnapshot({
      participation: "GROUP",
      capabilities: { canStartWork: true },
    });
    const recorded = makeSnapshot({
      participation: "GROUP",
      assignment: { ...defaultAssignment, startedAt: "2020-01-01T08:00:00Z" },
    });
    mockedGetSnapshot
      .mockResolvedValueOnce(required)
      .mockResolvedValue(recorded);
    mockedStartWork.mockResolvedValue({
      questId: "quest-work-1",
      assignmentId: "assignment-1",
      startedAt: "2020-01-01T08:00:00Z",
      questState: "QUEST_ASSIGNED",
    });
    const view = await renderWithQueryClient(
      <QuestWorkScreen questId="quest-work-1" viewerId="worker-1" />
    );

    await fireEvent.press(
      await view.findByRole("button", { name: "Start Work" })
    );

    expect(mockedStartWork).toHaveBeenCalledWith(
      "quest-work-1",
      expect.any(String)
    );
    expect(await view.findByText(/Waiting for the other Workers/)).toBeTruthy();
    expect(view.getByText(/^You pressed Start Work at/)).toBeTruthy();
    expect(view.queryByRole("button", { name: "Start Work" })).toBeNull();
    expect(view.queryByText("In progress")).toBeNull();
  });

  it("retries an undelivered Start Work with the same key and uses a new key for a new press", async () => {
    mockedGetSnapshot.mockResolvedValue(
      makeSnapshot({ capabilities: { canStartWork: true } })
    );
    mockedStartWork
      .mockRejectedValueOnce(new TypeError("Network request failed"))
      .mockRejectedValueOnce(
        new ApiError(409, "START_WORK_NOT_AVAILABLE", "Not yet")
      )
      .mockRejectedValueOnce(
        new ApiError(409, "START_WORK_NOT_AVAILABLE", "Not yet")
      );
    const view = await renderWithQueryClient(
      <QuestWorkScreen questId="quest-work-1" viewerId="worker-1" />
    );
    const press = async (calls: number) => {
      await fireEvent.press(
        await view.findByRole("button", { name: "Start Work", disabled: false })
      );
      await waitFor(() => expect(mockedStartWork).toHaveBeenCalledTimes(calls));
    };

    await press(1);
    await press(2);
    expect(
      await view.findByText(
        "Start Work is not open yet. Try again at the start time."
      )
    ).toBeTruthy();
    await press(3);

    const keys = mockedStartWork.mock.calls.map(([, key]) => key);
    expect(keys).toHaveLength(3);
    expect(keys[1]).toBe(keys[0]);
    expect(keys[2]).not.toBe(keys[1]);
  });

  it("reloads the Quest when Start Work was already recorded", async () => {
    mockedGetSnapshot.mockResolvedValue(
      makeSnapshot({ capabilities: { canStartWork: true } })
    );
    mockedStartWork.mockRejectedValue(
      new ApiError(409, "START_WORK_ALREADY_RECORDED", "Already recorded")
    );
    const view = await renderWithQueryClient(
      <QuestWorkScreen questId="quest-work-1" viewerId="worker-1" />
    );
    await fireEvent.press(
      await view.findByRole("button", { name: "Start Work" })
    );

    await waitFor(() => expect(mockedGetSnapshot).toHaveBeenCalledTimes(2));
    expect(view.queryByText(/START_WORK_ALREADY_RECORDED/)).toBeNull();
  });

  it("shows the proof CTA only when proof submission is allowed", async () => {
    mockedGetSnapshot.mockResolvedValue(
      makeSnapshot({
        state: "QUEST_IN_PROGRESS",
        nextAction: "SUBMIT_PROOF",
        quest: { ...defaultQuest, state: "QUEST_IN_PROGRESS" },
        capabilities: { ...makeSnapshot().capabilities, canSubmitProof: true },
      })
    );
    const view = await renderWithQueryClient(
      <QuestWorkScreen questId="quest-work-1" viewerId="worker-1" />
    );

    await waitFor(() =>
      expect(view.getAllByText("Proof submission").length).toBeGreaterThan(0)
    );
    expect(view.queryByText("Confirm completion")).toBeNull();
  });

  it("shows the proof-free confirmation CTA instead of proof submission", async () => {
    mockedGetSnapshot.mockResolvedValue(
      makeSnapshot({
        state: "QUEST_IN_PROGRESS",
        proofRequired: false,
        nextAction: "CONFIRM_COMPLETION",
        quest: {
          ...defaultQuest,
          state: "QUEST_IN_PROGRESS",
          proofRequired: false,
        },
        capabilities: {
          ...makeSnapshot().capabilities,
          canConfirmCompletion: true,
        },
      })
    );
    const view = await renderWithQueryClient(
      <QuestWorkScreen questId="quest-work-1" viewerId="worker-1" />
    );

    await waitFor(() =>
      expect(view.getAllByText("Confirm completion").length).toBeGreaterThan(0)
    );
    expect(view.queryByText("Proof submission")).toBeNull();
  });

  it("shows the proof form inline instead of navigating to a separate page", async () => {
    mockedGetSnapshot.mockResolvedValue(
      makeSnapshot({
        state: "QUEST_IN_PROGRESS",
        nextAction: "SUBMIT_PROOF",
        quest: { ...defaultQuest, state: "QUEST_IN_PROGRESS" },
        capabilities: { ...makeSnapshot().capabilities, canSubmitProof: true },
      })
    );
    const view = await renderWithQueryClient(
      <QuestWorkScreen questId="quest-work-1" viewerId="worker-1" />
    );

    await waitFor(() =>
      expect(view.getByTestId("worker-proof-form")).toBeTruthy()
    );
    expect(
      view.getByRole("button", { name: "Add images or videos" })
    ).toBeTruthy();
    expect(view.getByLabelText("Work description (optional)")).toBeTruthy();
    expect(
      view.getByRole("button", { name: "Submit proof", disabled: true })
    ).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("reuses the Start Work idempotency key after an ambiguous failure", async () => {
    mockedGetSnapshot.mockResolvedValue(
      makeSnapshot({
        capabilities: { canStartWork: true },
      })
    );
    mockedStartWork
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        startedAt: "2026-10-01T08:00:00.000Z",
      } as never);
    const view = await renderWithQueryClient(
      <QuestWorkScreen questId="quest-work-1" viewerId="worker-1" />
    );
    const startButton = await view.findByRole("button", { name: "Start Work" });

    await act(async () => {
      await fireEvent.press(startButton);
    });
    await waitFor(() => expect(mockedStartWork).toHaveBeenCalledTimes(1));
    await act(async () => {
      await fireEvent.press(view.getByRole("button", { name: "Start Work" }));
    });

    expect(mockedStartWork).toHaveBeenCalledTimes(2);
    expect(mockedStartWork.mock.calls[1]?.[1]).toBe(
      mockedStartWork.mock.calls[0]?.[1]
    );
  });

  it("confirms proof-free work, refreshes canonical state, and returns after completion", async () => {
    const active = makeSnapshot({
      state: "QUEST_IN_PROGRESS",
      proofRequired: false,
      nextAction: "CONFIRM_COMPLETION",
      quest: {
        ...defaultQuest,
        state: "QUEST_IN_PROGRESS",
        proofRequired: false,
      },
      capabilities: {
        ...makeSnapshot().capabilities,
        canConfirmCompletion: true,
      },
    });
    const completed = makeSnapshot({
      state: "QUEST_COMPLETED",
      nextAction: "CREATE_REVIEW",
      quest: {
        ...defaultQuest,
        state: "QUEST_COMPLETED",
        proofRequired: false,
      },
      assignment: {
        ...defaultAssignment,
        state: "ASSIGNMENT_COMPLETED",
        questState: "QUEST_COMPLETED",
      },
    });
    mockedGetSnapshot
      .mockResolvedValueOnce(active)
      .mockResolvedValue(completed);
    mockedConfirmCompletion.mockResolvedValue({} as never);
    const view = await renderWithQueryClient(
      <QuestWorkScreen questId="quest-work-1" viewerId="worker-1" />
    );
    await waitFor(() =>
      expect(
        view.getByRole("button", { name: "Confirm completion" })
      ).toBeTruthy()
    );

    await act(async () => {
      fireEvent.press(view.getByRole("button", { name: "Confirm completion" }));
      await Promise.resolve();
    });

    expect(mockedConfirmCompletion).toHaveBeenCalledWith(
      "quest-work-1",
      expect.any(String)
    );
    await waitFor(() =>
      expect(mockedGetSnapshot.mock.calls.length).toBeGreaterThanOrEqual(2)
    );
    expect(mockReplace).toHaveBeenCalledWith("/my-quests");
  });

  it("renders terminal work as a read-only archive", async () => {
    mockedGetSnapshot.mockResolvedValue(
      makeSnapshot({
        state: "QUEST_COMPLETED",
        nextAction: "CREATE_REVIEW",
        quest: { ...defaultQuest, state: "QUEST_COMPLETED" },
        assignment: {
          ...defaultAssignment,
          state: "ASSIGNMENT_COMPLETED",
          questState: "QUEST_COMPLETED",
        },
        workConversation: {
          ...defaultWorkConversation,
          archived: true,
          readOnly: true,
        },
      })
    );
    const view = await renderWithQueryClient(
      <QuestWorkScreen questId="quest-work-1" viewerId="worker-1" />
    );

    expect(
      await view.findByText(
        "This Quest is terminal. Work Chat remains available as a read-only archive."
      )
    ).toBeTruthy();
    expect(view.getByText("Open Work Chat")).toBeTruthy();
    expect(view.queryByText("Proof submission")).toBeNull();
    expect(view.queryByText("Confirm completion")).toBeNull();
  });
});
