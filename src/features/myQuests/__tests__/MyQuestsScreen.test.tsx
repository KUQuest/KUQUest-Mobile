import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import MyQuestsScreen from "../MyQuestsScreen";
import { myQuestService } from "../myQuestService";

const mockPush = jest.fn();

let mockWorkerList: jest.MockedFunction<
  typeof myQuestService.listMyWorkerQuestSnapshots
>;

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
  useFocusEffect: (effect: () => (() => void) | void) =>
    jest.requireActual("react").useEffect(effect, [effect]),
}));
jest.mock("@/locales/LocaleProvider", () => ({
  useLocale: () => ({ locale: "en" }),
}));
jest.mock("@/components/navigation/NavigationVisibilityContext", () => ({
  useNavigationVisibility: () => ({ handleScroll: jest.fn() }),
}));
jest.mock("@/features/auth/AuthService", () => ({
  authService: {
    getSession: jest.fn(async () => ({ user: { id: "worker-1" } })),
  },
}));
jest.mock("../myQuestService", () => ({
  myQuestService: {
    listMyWorkerQuestSnapshots: jest.fn(),
    listAllMyHirerQuests: jest.fn(),
  },
}));

jest.mock("@/features/questBoard/questWorkflow", () => ({
  questWorkflow: {
    subscribe: jest.fn(() => jest.fn()),
    getQuestDetailState: jest.fn(),
  },
}));

const snapshot = (overrides: Record<string, unknown> = {}) => ({
  viewerId: "worker-1",
  actor: "WORKER",
  state: "QUEST_ASSIGNED",
  mode: "FIRST_COME_FIRST_SERVED",
  participation: "SINGLE",
  quest: {
    id: "quest-live-1",
    version: 1,
    title: "Live campus delivery",
    description: "Deliver the package.",
    condition: { items: [] },
    tag: { id: "delivery", name: "Delivery" },
    mode: "FIRST_COME_FIRST_SERVED",
    participation: "SINGLE",
    state: "QUEST_ASSIGNED",
    questFundingTotal: 200,
    headcount: 1,
    startTime: "2026-10-01T09:00:00Z",
    dueAt: "2026-10-01T12:00:00Z",
    proofRequired: true,
    locations: [{ label: "Main Campus" }],
  },
  assignment: {
    id: "assignment-1",
    questId: "quest-live-1",
    workerId: "worker-1",
    state: "ASSIGNMENT_ACTIVE",
    questState: "QUEST_ASSIGNED",
    createdAt: "2026-09-17T10:00:00Z",
  },
  assignments: [],
  application: null,
  applications: [],
  team: null,
  teams: [],
  underfilled: null,
  editRequest: null,
  proofs: [],
  workConversation: null,
  proofRequired: true,
  dueAt: "2026-10-01T12:00:00Z",
  nextAction: "WAIT_FOR_START",
  capabilities: { canReadWorkChat: false },
  ...overrides,
});

describe("MyQuestsScreen live Worker list", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockedService = jest.requireMock("../myQuestService")
      .myQuestService as typeof myQuestService;
    mockWorkerList = mockedService.listMyWorkerQuestSnapshots = jest
      .fn()
      .mockResolvedValue([snapshot()] as never);
  });

  it("loads assigned Quest snapshots on focus and renders live state", async () => {
    const screen = await render(<MyQuestsScreen />);

    await waitFor(() =>
      expect(screen.getByText("Live campus delivery")).toBeTruthy()
    );
    expect(screen.getByText("Awaiting start")).toBeTruthy();
    expect(screen.getByTestId("my-quest-action-quest-live-1")).toBeTruthy();
  });

  it("opens the worker Quest route with the selected status", async () => {
    const screen = await render(<MyQuestsScreen />);
    await waitFor(() =>
      expect(screen.getByText("Live campus delivery")).toBeTruthy()
    );
    fireEvent.press(screen.getByTestId("my-quest-card-quest-live-1"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "../quest/quest-live-1/work",
      params: { viewerId: "worker-1", studentId: "worker-1" },
    });
  });

  it("maps in-progress and terminal assignments to accepted and history", async () => {
    mockWorkerList.mockResolvedValue([
      snapshot({ state: "QUEST_IN_PROGRESS", nextAction: "SUBMIT_PROOF" }),
      snapshot({
        quest: {
          ...snapshot().quest,
          id: "quest-done",
          title: "Completed Quest",
          state: "QUEST_COMPLETED",
        },
        state: "QUEST_COMPLETED",
        assignment: {
          ...snapshot().assignment,
          questId: "quest-done",
          state: "ASSIGNMENT_COMPLETED",
          questState: "QUEST_COMPLETED",
        },
      }),
    ] as never);
    const screen = await render(<MyQuestsScreen />);
    fireEvent.press(screen.getByTestId("my-quests-status-next"));
    await waitFor(() =>
      expect(screen.getByText("Live campus delivery")).toBeTruthy()
    );
    expect(screen.getByText("Submit proof")).toBeTruthy();
    fireEvent.press(screen.getByTestId("my-quests-status-next"));
    await waitFor(() =>
      expect(screen.getByText("Completed Quest")).toBeTruthy()
    );
  });
});
