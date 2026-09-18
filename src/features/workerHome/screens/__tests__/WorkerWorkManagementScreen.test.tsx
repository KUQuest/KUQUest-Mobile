import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react-native";
import { questApi } from "@/api/QuestApi";
import { liveQuestService } from "@/features/questBoard/liveQuestService";
import WorkerWorkManagementScreen from "../WorkerWorkManagementScreen";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));

jest.mock("@/features/auth/AuthService", () => ({
  authService: {
    getSession: () =>
      Promise.resolve({
        user: { id: "worker-1", name: "Worker Test" },
      }),
  },
}));

jest.mock("@/api/QuestApi", () => ({
  questApi: {
    getParticipationDetail: jest.fn(),
    listMyAssignments: jest.fn(),
  },
}));

jest.mock("@/features/questBoard/liveQuestService", () => ({
  liveQuestService: {
    getLiveSnapshot: jest.fn(),
  },
}));

describe("WorkerWorkManagementScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (questApi.getParticipationDetail as jest.Mock).mockResolvedValue({
      title: "Mock Quest",
    });
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(null);
  });
  afterEach(async () => {
    await cleanup();
  });

  it("renders NoWorkPromptCard when user has no active work, and navigates to Home on press", async () => {
    (questApi.listMyAssignments as jest.Mock).mockResolvedValue([]);

    const view = await render(<WorkerWorkManagementScreen />);

    await waitFor(() => {
      expect(view.getByTestId("work-management-title")).toBeTruthy();
      expect(view.getByTestId("no-work-prompt-card")).toBeTruthy();
      expect(view.getByText("No Active Work Yet")).toBeTruthy();
      expect(
        view.getByText(
          "Go find quests you like on the Home page and start earning!"
        )
      ).toBeTruthy();
    });

    expect(view.queryByTestId("current-quest-card")).toBeNull();
    expect(view.queryByTestId("working-now-floating-bar")).toBeNull();

    // Tap Find Quests button -> navigates to Home /(tabs)
    await fireEvent.press(view.getByTestId("find-quests-button"));

    expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
  });

  it("renders CurrentQuestCard and WorkingNowFloatingBar when an active quest exists", async () => {
    (questApi.listMyAssignments as jest.Mock).mockResolvedValue([
      {
        id: "assign-active-1",
        questId: "quest-active-1",
        workerId: "worker-1",
        state: "ASSIGNMENT_ACTIVE",
        questState: "QUEST_IN_PROGRESS",
        startedAt: "2026-09-18T10:00:00Z",
        createdAt: "2026-09-18T09:00:00Z",
      },
    ]);
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue({
      quest: {
        id: "quest-active-1",
        title: "Campus Tree Planting",
        hirerName: "Prof. Anan",
      },
      state: "QUEST_IN_PROGRESS",
    });

    const view = await render(<WorkerWorkManagementScreen />);

    await waitFor(() => {
      expect(view.getByTestId("current-quest-card")).toBeTruthy();
      expect(view.getByText("Campus Tree Planting")).toBeTruthy();
      expect(view.getByText("Prof. Anan")).toBeTruthy();
      expect(view.getByText("Quest State")).toBeTruthy();
      expect(view.getByTestId("current-quest-submit-button")).toBeTruthy();
      expect(view.getAllByText("In Progress").length).toBeGreaterThan(0);
    });

    // The card still opens the work details.
    await fireEvent.press(view.getByTestId("current-quest-card"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]/work",
      params: { id: "quest-active-1" },
    });

    // The always-visible submit action opens the worker proof/completion flow.
    mockPush.mockClear();
    await fireEvent.press(view.getByTestId("current-quest-submit-button"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]/proof",
      params: { id: "quest-active-1" },
    });

    // The floating shortcut consistently returns to Work Management.
    mockPush.mockClear();
    await fireEvent.press(view.getByTestId("working-now-floating-bar"));
    expect(mockPush).toHaveBeenCalledWith("/my-quests");
  });
  it("switches tabs between Applied Quest and History", async () => {
    (questApi.getParticipationDetail as jest.Mock).mockImplementation(
      async (questId: string) => ({
        title: questId === "quest-app-1" ? "Campus Cleanup" : "Completed Quest",
      })
    );
    (questApi.listMyAssignments as jest.Mock).mockResolvedValue([
      {
        id: "assign-app-1",
        questId: "quest-app-1",
        workerId: "worker-1",
        state: "ASSIGNMENT_ACTIVE",
        questState: "QUEST_ASSIGNED",
        startedAt: null,
        createdAt: "2026-09-18T09:00:00Z",
      },
      {
        id: "assign-hist-1",
        questId: "quest-hist-1",
        workerId: "worker-1",
        state: "ASSIGNMENT_COMPLETED",
        questState: "QUEST_COMPLETED",
        startedAt: "2026-09-17T09:00:00Z",
        createdAt: "2026-09-17T08:00:00Z",
      },
    ]);

    const view = await render(<WorkerWorkManagementScreen />);
    await waitFor(() => {
      expect(view.getByTestId("applied-quests-list")).toBeTruthy();
      expect(view.getByTestId("applied-quest-item-assign-app-1")).toBeTruthy();
      expect(view.getByText("Campus Cleanup")).toBeTruthy();
    });
    await fireEvent.press(view.getByTestId("tab-history-quest"));

    await waitFor(() => {
      expect(view.getByTestId("history-quests-list")).toBeTruthy();
      expect(view.getByTestId("history-quest-item-assign-hist-1")).toBeTruthy();
    });
  });
});
