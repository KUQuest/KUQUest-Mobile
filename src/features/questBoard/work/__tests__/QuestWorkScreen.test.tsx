import { act, fireEvent, waitFor } from "@testing-library/react-native";

import QuestWorkScreen from "../QuestWorkScreen";
import {
  liveQuestService,
  type LiveQuestSnapshot,
} from "../../live/liveQuestService";
import type { QuestV2Detail } from "@/api/questV2Contracts";
import { ApiError } from "@/api/ApiClient";
import { renderWithQueryClient } from "@/testing/queryTestUtils";

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockGetSession = jest.fn();

jest.mock("expo-router", () => ({
  useFocusEffect: (effect: () => (() => void) | void) =>
    jest.requireActual("react").useEffect(effect, []),
  useLocalSearchParams: () => ({ id: "quest-work-1", viewerId: "worker-1" }),
  useRouter: () => ({
    back: mockBack,
    canGoBack: () => true,
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  SafeAreaView: "SafeAreaView",
}));

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
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
  canUpdateReview: false,
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
    mockGetSession.mockResolvedValue({ user: { id: "worker-1" } });
    mockedRespondToEdit.mockResolvedValue(makeSnapshot().editRequest as never);
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
    expect(view.getByRole("button", { name: "Add files" })).toBeTruthy();
    expect(view.getByLabelText("Work description (optional)")).toBeTruthy();
    expect(
      view.getByRole("button", { name: "Submit proof", disabled: true })
    ).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
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
      .mockResolvedValueOnce(completed);
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
