import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithQueryClient } from "@/testing/queryTestUtils";
import { questApi } from "@/api/QuestApi";
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

describe("WorkerHomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (questApi.listMyAssignments as jest.Mock).mockResolvedValue([]);
    (questApi.listBoard as jest.Mock).mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    (questApi.listTags as jest.Mock).mockResolvedValue([
      { id: "tag-1", name: "Printing" },
      { id: "tag-2", name: "Design" },
    ]);
  });

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

    fireEvent.changeText(
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

    fireEvent.press(view.getByTestId("tag-pill-tag-1"));

    await waitFor(() => {
      expect(questApi.listBoard).toHaveBeenCalledWith(
        expect.objectContaining({ tagId: "tag-1" }),
        expect.anything()
      );
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

    fireEvent.press(view.getByTestId("worker-feed-card-quest-100"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]",
      params: { id: "quest-100" },
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

    fireEvent.press(view.getByTestId("worker-quick-access-bar"));

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
});
