import {
  QuestApplicationStatus,
  QuestStatus,
} from "@/features/questBoard/domain/types";
import { fireEvent, waitFor } from "@testing-library/react-native";

import { renderWithQueryClient } from "@/testing/queryTestUtils";
import { workerSnapshot } from "@/testing/workerSnapshotFixtures";
import { workerWorkMessages } from "@/locales/workerWorkMessages";
import WorkerWorkManagementScreen from "../WorkerWorkManagementScreen";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockListSnapshots = jest.fn();
const mockListApplications = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
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
jest.mock("@/features/myQuests/myQuestService", () => ({
  myQuestService: {
    listMyWorkerQuestSnapshots: (...args: unknown[]) =>
      mockListSnapshots(...args),
    listMyWorkerCandidateApplications: (...args: unknown[]) =>
      mockListApplications(...args),
  },
}));

describe("WorkerWorkManagementScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListApplications.mockResolvedValue([]);
  });

  it("groups work that needs the Worker and opens proof submission", async () => {
    mockListSnapshots.mockResolvedValue([
      workerSnapshot({
        id: "quest-proof",
        title: "Print flyers",
        nextAction: "SUBMIT_PROOF",
        workConversationId: "chat-1",
      }),
      workerSnapshot({
        id: "quest-waiting",
        title: "Library shift",
        state: "QUEST_ASSIGNED",
        nextAction: "WAIT_FOR_START",
      }),
    ]);

    const screen = await renderWithQueryClient(<WorkerWorkManagementScreen />);

    await waitFor(() => expect(screen.getByText("Print flyers")).toBeTruthy());
    expect(mockListSnapshots).toHaveBeenCalledWith(
      "worker-1",
      "all",
      expect.anything()
    );
    expect(screen.getByText("Needs your action")).toBeTruthy();
    expect(screen.getByText("Other accepted work")).toBeTruthy();
    expect(screen.getByText("Proof due")).toBeTruthy();
    expect(screen.getByText("Awaiting start")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Active, 2 items" })).toBeTruthy();

    await fireEvent.press(screen.getByTestId("worker-work-open-quest-proof"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]/work",
      params: { id: "quest-proof", viewerId: "worker-1" },
    });
    expect(screen.queryByRole("button", { name: /Open Work Chat/ })).toBeNull();
  });

  it("sends underfilled-start consent directly to its route", async () => {
    mockListSnapshots.mockResolvedValue([
      workerSnapshot({
        id: "quest-underfilled",
        title: "Group survey",
        state: "QUEST_OPEN",
        nextAction: "CONSENT_UNDERFILLED",
      }),
    ]);

    const screen = await renderWithQueryClient(<WorkerWorkManagementScreen />);

    await waitFor(() =>
      expect(
        screen.getByText(workerWorkMessages.en.status.consentUnderfilled)
      ).toBeTruthy()
    );
    expect(
      screen.getByTestId("worker-work-open-quest-underfilled").props
        .accessibilityHint
    ).toBe("Open Quest Group survey");
    await fireEvent.press(
      screen.getByTestId("worker-work-open-quest-underfilled")
    );
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]/partial-start",
      params: { id: "quest-underfilled" },
    });
  });

  it("shows finished work, including cancelled work, under History", async () => {
    mockListSnapshots.mockResolvedValue([
      workerSnapshot({
        id: "quest-done",
        title: "Finished survey",
        state: "QUEST_COMPLETED",
        assignmentState: "ASSIGNMENT_COMPLETED",
      }),
      workerSnapshot({
        id: "quest-cancelled",
        title: "Cancelled cleanup",
        state: "QUEST_CANCELLED",
        assignmentState: "ASSIGNMENT_CANCELLED",
      }),
    ]);

    const screen = await renderWithQueryClient(<WorkerWorkManagementScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("worker-work-active-empty")).toBeTruthy()
    );
    await fireEvent.press(screen.getByTestId("worker-work-find-quests"));
    expect(mockReplace).toHaveBeenCalledWith("/(tabs)");

    await fireEvent.press(screen.getByTestId("worker-work-tab-history"));
    expect(
      screen.getByRole("tab", { name: "History, 2 items", selected: true })
    ).toBeTruthy();
    expect(screen.getByText("Finished survey")).toBeTruthy();
    expect(screen.getByText("Completed")).toBeTruthy();
    expect(screen.getByText("Cancelled cleanup")).toBeTruthy();
    expect(screen.getByText("Cancelled")).toBeTruthy();
  });

  it("offers a retry when the work list cannot load", async () => {
    mockListSnapshots.mockRejectedValueOnce(new Error("offline"));
    mockListSnapshots.mockResolvedValueOnce([]);

    const screen = await renderWithQueryClient(<WorkerWorkManagementScreen />);

    await waitFor(() =>
      expect(screen.getByText("Could not load your work")).toBeTruthy()
    );
    await fireEvent.press(screen.getByTestId("worker-work-retry"));
    await waitFor(() =>
      expect(screen.getByTestId("worker-work-active-empty")).toBeTruthy()
    );
  });
  it("opens an application card on Quest Detail", async () => {
    mockListSnapshots.mockResolvedValue([]);
    mockListApplications.mockResolvedValue([
      {
        id: "application-1",
        questId: "quest-application",
        memberId: "worker-1",
        kind: "SINGLE",
        state: "APPLICATION_APPLIED",
        appliedAt: "2026-09-01T09:00:00Z",
        quest: {
          title: "Applied Quest",
          startTime: "2026-10-01T09:00:00Z",
          dueAt: null,
          mode: "CANDIDATE",
          participation: "SINGLE",
          state: "QUEST_OPEN",
        },
      },
    ]);

    const screen = await renderWithQueryClient(<WorkerWorkManagementScreen />);

    await waitFor(() =>
      expect(screen.getByText("Pending selection")).toBeTruthy()
    );
    await fireEvent.press(
      screen.getByTestId("worker-work-open-quest-application")
    );
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]",
      params: { id: "quest-application" },
    });
  });
  it("opens Work Hub for a selected application with viewerId", async () => {
    mockListSnapshots.mockResolvedValue([]);
    mockListApplications.mockResolvedValue([
      {
        id: "application-selected",
        questId: "quest-selected",
        memberId: "worker-1",
        kind: "SINGLE",
        state: QuestApplicationStatus.APPLICATION_SELECTED,
        appliedAt: "2026-09-01T09:00:00Z",
        quest: {
          title: "Selected Quest",
          startTime: "2026-10-01T09:00:00Z",
          dueAt: null,
          mode: "CANDIDATE",
          participation: "SINGLE",
          state: QuestStatus.QUEST_ASSIGNED,
        },
      },
    ]);

    const screen = await renderWithQueryClient(<WorkerWorkManagementScreen />);
    await waitFor(() => expect(screen.getByText("Selected")).toBeTruthy());
    await fireEvent.press(
      screen.getByTestId("worker-work-open-quest-selected")
    );

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]/work",
      params: { id: "quest-selected", viewerId: "worker-1" },
    });
  });
  it("keeps Assignment cards visible when Candidate applications fail to load", async () => {
    mockListSnapshots.mockResolvedValue([
      workerSnapshot({ id: "quest-assignment", title: "Assigned Quest" }),
    ]);
    mockListApplications.mockRejectedValueOnce(new Error("offline"));

    const screen = await renderWithQueryClient(<WorkerWorkManagementScreen />);

    await waitFor(() =>
      expect(screen.getByText("Assigned Quest")).toBeTruthy()
    );
    expect(screen.queryByTestId("worker-work-error")).toBeNull();
  });
});
