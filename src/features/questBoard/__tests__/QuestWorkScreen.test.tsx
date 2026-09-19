import { act, fireEvent, waitFor } from "@testing-library/react-native";

import QuestWorkScreen from "../QuestWorkScreen";
import { liveQuestService, type LiveQuestSnapshot } from "../liveQuestService";
import type { QuestV2Detail } from "@/api/questV2Contracts";
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

jest.mock("../liveQuestService", () => ({
  liveQuestService: {
    getLiveSnapshot: jest.fn(),
    respondToEditRequest: jest.fn(),
    confirmCompletion: jest.fn(),
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

  it("refreshes the server-owned automatic transition without a Start Work command", async () => {
    jest.useFakeTimers();
    const startTime = new Date(Date.now() + 65_000).toISOString();
    const assigned = makeSnapshot({
      quest: { ...defaultQuest, startTime },
    });
    const inProgress = makeSnapshot({
      state: "QUEST_IN_PROGRESS",
      nextAction: "SUBMIT_PROOF",
      quest: { ...defaultQuest, startTime, state: "QUEST_IN_PROGRESS" },
    });
    let snapshotRequestCount = 0;
    mockedGetSnapshot.mockImplementation(() => {
      snapshotRequestCount += 1;
      return Promise.resolve(
        snapshotRequestCount === 1 ? assigned : inProgress
      );
    });
    const view = await renderWithQueryClient(
      <QuestWorkScreen questId="quest-work-1" viewerId="worker-1" />
    );
    await waitFor(() =>
      expect(
        view.getAllByText("Waiting for work to start").length
      ).toBeGreaterThan(0)
    );

    await act(async () => {
      await jest.advanceTimersByTimeAsync(65_000);
    });

    expect(await view.findByText("In progress")).toBeTruthy();
    expect(mockedGetSnapshot.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(view.queryByText("Start Work")).toBeNull();
    jest.useRealTimers();
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

  it("navigates to proof submission with the quest and viewer context", async () => {
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
      expect(
        view.getByRole("button", { name: "Proof submission" })
      ).toBeTruthy()
    );
    fireEvent.press(view.getByRole("button", { name: "Proof submission" }));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "../proof",
      params: {
        id: "quest-work-1",
        viewerId: "worker-1",
        studentId: "worker-1",
      },
    });
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
