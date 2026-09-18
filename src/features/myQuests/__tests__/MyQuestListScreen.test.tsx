import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import MyQuestListScreen from "../MyQuestListScreen";

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockWorkerList = jest.fn();
const mockHirerList = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  useFocusEffect: (effect: () => (() => void) | void) =>
    jest.requireActual("react").useEffect(effect, [effect]),
}));
jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));
jest.mock("@/features/navigation/navigationUiStore", () => ({
  handleNavigationScroll: jest.fn(),
}));
jest.mock("@/features/auth/AuthService", () => ({
  authService: {
    getSession: jest.fn(async () => ({ user: { id: "worker-1" } })),
  },
}));
jest.mock("../myQuestService", () => {
  const actual = jest.requireActual("../myQuestService");
  return {
    ...actual,
    myQuestService: {
      ...actual.myQuestService,
      listAllMyHirerQuests: (...args: unknown[]) => mockHirerList(...args),
      listMyWorkerQuestSnapshots: (...args: unknown[]) =>
        mockWorkerList(...args),
    },
  };
});

const baseQuest = {
  version: 1,
  hiddenAt: null,
  description: "Complete the campus task.",
  condition: { items: [{ position: 0, text: "Complete the task." }] },
  tag: { id: "campus", name: "Campus" },
  mode: "FIRST_COME_FIRST_SERVED" as const,
  participation: "SINGLE" as const,
  questFundingTotal: 250,
  headcount: 1,
  startTime: "2026-10-01T09:00:00Z",
  dueAt: "2026-10-01T12:00:00Z",
  proofRequired: true,
  locations: [{ label: "Main Campus" }],
};

function snapshot(
  state:
    | "QUEST_ASSIGNED"
    | "QUEST_IN_PROGRESS"
    | "QUEST_COMPLETED"
    | "QUEST_CANCELLED"
    | "QUEST_FAILED",
  title: string,
  assignmentState:
    "ASSIGNMENT_ACTIVE" | "ASSIGNMENT_COMPLETED" | "ASSIGNMENT_CANCELLED"
) {
  return {
    viewerId: "worker-1",
    actor: "WORKER",
    state,
    mode: baseQuest.mode,
    participation: baseQuest.participation,
    quest: {
      ...baseQuest,
      id: title.toLowerCase().replaceAll(" ", "-"),
      title,
      state,
    },
    assignment: {
      id: `${title}-assignment`,
      questId: title.toLowerCase().replaceAll(" ", "-"),
      workerId: "worker-1",
      state: assignmentState,
      questState: state,
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
    dueAt: baseQuest.dueAt,
    nextAction:
      state === "QUEST_COMPLETED" ? "CREATE_REVIEW" : "WAIT_FOR_START",
    capabilities: { canReadWorkChat: false },
  };
}

function draftQuest(
  id: string,
  title: string,
  state: "QUEST_DRAFT" | "QUEST_OPEN"
) {
  return {
    ...baseQuest,
    id,
    title,
    state,
    createdAt: "2026-09-17T10:00:00Z",
    updatedAt: "2026-09-18T10:00:00Z",
  };
}

describe("MyQuestListScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWorkerList.mockResolvedValue([]);
    mockHirerList.mockResolvedValue([]);
  });

  it("shows completed Quests only in Worker history", async () => {
    mockWorkerList.mockResolvedValue([
      snapshot("QUEST_COMPLETED", "Completed Quest", "ASSIGNMENT_COMPLETED"),
      snapshot("QUEST_CANCELLED", "Cancelled Quest", "ASSIGNMENT_CANCELLED"),
      snapshot("QUEST_FAILED", "Failed Quest", "ASSIGNMENT_CANCELLED"),
    ] as never);

    const screen = await render(
      <MyQuestListScreen initialRole="worker" initialTab="history" />
    );

    await waitFor(() =>
      expect(screen.getByText("Completed Quest")).toBeTruthy()
    );
    expect(screen.queryByText("Quests I posted")).toBeNull();
    expect(screen.queryByText("Cancelled Quest")).toBeNull();
    expect(screen.queryByText("Failed Quest")).toBeNull();
  });

  it("reuses the same list for Hirer drafts and opens the editor", async () => {
    mockHirerList.mockResolvedValue([
      draftQuest("draft-1", "Draft Quest", "QUEST_DRAFT"),
      draftQuest("open-1", "Published Quest", "QUEST_OPEN"),
    ] as never);

    const screen = await render(
      <MyQuestListScreen initialRole="hirer" initialTab="draft" />
    );

    await waitFor(() => expect(screen.getByText("Draft Quest")).toBeTruthy());
    expect(screen.queryByText("Quests I joined")).toBeNull();
    expect(screen.queryByText("Published Quest")).toBeNull();

    fireEvent.press(screen.getByTestId("my-quest-list-action-draft-1"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/create",
      params: { editQuestId: "draft-1" },
    });
  });
});
