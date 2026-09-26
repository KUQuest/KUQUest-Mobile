import { fireEvent, waitFor } from "@testing-library/react-native";

import { renderWithQueryClient } from "@/testing/queryTestUtils";
import { workerSnapshot } from "@/testing/workerSnapshotFixtures";
import WorkerWorkManagementScreen from "../WorkerWorkManagementScreen";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockListSnapshots = jest.fn();

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
  },
}));

describe("WorkerWorkManagementScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it("sends underfilled-start consent to Quest Detail", async () => {
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
      expect(screen.getByText("Underfilled start")).toBeTruthy()
    );
    await fireEvent.press(
      screen.getByTestId("worker-work-open-quest-underfilled")
    );
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]",
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
});
