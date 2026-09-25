import { SweetAlertHost } from "@/components/ui/SweetAlert";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithQueryClient } from "@/testing/queryTestUtils";
import MyQuestListScreen from "../MyQuestListScreen";
import { projectMyQuestWorkspace } from "../myQuestWorkspaceProjection";
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockHirerList = jest.fn();
const mockCancelAsync = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
}));
jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));
jest.mock("@/features/navigation/navigationUiStore", () => ({
  handleNavigationScroll: jest.fn(),
}));
jest.mock("@/features/auth/AuthService", () => ({
  authService: {
    getSession: jest.fn(async () => ({ user: { id: "hirer-1" } })),
  },
}));
jest.mock("../myQuestService", () => {
  const actual = jest.requireActual("../myQuestService");
  return {
    ...actual,
    myQuestService: {
      ...actual.myQuestService,
      listAllMyHirerQuests: (...args: unknown[]) => mockHirerList(...args),
    },
  };
});
jest.mock("@/features/questBoard/api/questBoardQueries", () => ({
  ...jest.requireActual("@/features/questBoard/api/questBoardQueries"),
  useCancelQuestMutation: () => ({
    mutateAsync: mockCancelAsync,
    isPending: false,
    variables: undefined,
  }),
}));

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
    mockHirerList.mockResolvedValue([]);
    mockCancelAsync.mockResolvedValue({ refundedSatang: 0 });
  });

  it("reuses the same list for Hirer drafts and opens the editor", async () => {
    mockHirerList.mockResolvedValue([
      draftQuest("draft-1", "Draft Quest", "QUEST_DRAFT"),
      draftQuest("open-1", "Published Quest", "QUEST_OPEN"),
    ] as never);

    const screen = await renderWithQueryClient(
      <>
        <MyQuestListScreen initialTab="draft" />
        <SweetAlertHost />
      </>
    );
    await waitFor(() => expect(screen.getByText("Draft Quest")).toBeTruthy());
    expect(screen.queryByText("Published Quest")).toBeNull();

    fireEvent.press(screen.getByTestId("my-quest-list-action-draft-1"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]/edit",
      params: { id: "draft-1" },
    });
  });

  it("keeps completed and closed Hirer Quests in history with review actions that open the review Popup", async () => {
    mockHirerList.mockResolvedValue([
      {
        ...draftQuest("completed-1", "Completed Quest", "QUEST_OPEN"),
        state: "QUEST_COMPLETED",
      },
      {
        ...draftQuest("cancelled-1", "Cancelled Quest", "QUEST_OPEN"),
        state: "QUEST_CANCELLED",
      },
      {
        ...draftQuest("failed-1", "Failed Quest", "QUEST_OPEN"),
        state: "QUEST_FAILED",
      },
    ] as never);

    const screen = await renderWithQueryClient(
      <>
        <MyQuestListScreen initialTab="completed" />
        <SweetAlertHost />
      </>
    );
    await waitFor(() => {
      expect(screen.getByText("Completed Quest")).toBeTruthy();
      expect(screen.getByText("Cancelled Quest")).toBeTruthy();
      expect(screen.getByText("Failed Quest")).toBeTruthy();
    });
    expect(screen.getByTestId("my-quest-list-action-completed-1")).toBeTruthy();
    fireEvent.press(screen.getByTestId("my-quest-list-action-completed-1"));
    expect(mockPush).not.toHaveBeenCalled();
    expect(await screen.findByTestId("quest-review-modal")).toBeTruthy();
  });

  it("confirms cancellation and reports successful cancellation", async () => {
    mockHirerList.mockResolvedValue([
      draftQuest("open-1", "Published Quest", "QUEST_OPEN"),
    ] as never);
    mockCancelAsync.mockResolvedValue({ refundedSatang: 125 });

    const screen = await renderWithQueryClient(
      <>
        <MyQuestListScreen initialTab="active" />
        <SweetAlertHost />
      </>
    );
    await waitFor(() =>
      expect(screen.getByText("Published Quest")).toBeTruthy()
    );

    await fireEvent.press(screen.getByTestId("my-quest-list-cancel-open-1"));
    expect(screen.getByText("Cancel this Quest?")).toBeTruthy();
    expect(
      screen.getByText(
        "The Quest stops accepting Workers and the money on hold is refunded to you in full."
      )
    ).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Keep Quest" }));
    expect(screen.queryByTestId("sweet-alert")).toBeNull();
    expect(mockCancelAsync).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId("my-quest-list-cancel-open-1"));
    await fireEvent.press(screen.getByRole("button", { name: "Cancel Quest" }));
    await waitFor(() =>
      expect(mockCancelAsync).toHaveBeenCalledWith({
        questId: "open-1",
        idempotencyKey: expect.any(String),
      })
    );
    expect(await screen.findByText("Quest cancelled")).toBeTruthy();
    expect(screen.getByText(/refunded to you/)).toBeTruthy();
  });

  it("uses draft-specific cancellation copy and leaves draft unchanged when kept", async () => {
    mockHirerList.mockResolvedValue([
      draftQuest("draft-1", "Draft Quest", "QUEST_DRAFT"),
    ] as never);

    const screen = await renderWithQueryClient(
      <>
        <MyQuestListScreen initialTab="draft" />
        <SweetAlertHost />
      </>
    );
    await waitFor(() => expect(screen.getByText("Draft Quest")).toBeTruthy());

    await fireEvent.press(screen.getByTestId("my-quest-list-cancel-draft-1"));
    expect(
      screen.getByText(
        "This draft is cancelled and moved to History. No money is charged."
      )
    ).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Keep Quest" }));

    expect(screen.queryByTestId("sweet-alert")).toBeNull();
    expect(screen.getByText("Draft Quest")).toBeTruthy();
    expect(mockCancelAsync).not.toHaveBeenCalled();
  });
  it("projects Hirer tabs, normalizes invalid tabs, and projects drafts", () => {
    const projection = projectMyQuestWorkspace({
      requestedTab: "history",
      locale: "en",
      hirerQuests: [
        draftQuest("draft-1", "Draft Quest", "QUEST_DRAFT"),
        draftQuest("open-1", "Published Quest", "QUEST_OPEN"),
      ] as never,
    });

    expect(projection.tabs).toEqual(["active", "draft", "completed"]);
    expect(projection.selectedTab).toBe("active");
    expect(projection.selectedTabLabel).toBe("Active");

    const draftProjection = projectMyQuestWorkspace({
      requestedTab: "draft",
      locale: "en",
      hirerQuests: [
        draftQuest("draft-1", "Draft Quest", "QUEST_DRAFT"),
        draftQuest("open-1", "Published Quest", "QUEST_OPEN"),
      ] as never,
    });

    expect(draftProjection.selectedTab).toBe("draft");
    expect(draftProjection.emptyTitle).toBe("No Quest drafts");
    expect(draftProjection.items).toHaveLength(1);
    expect(draftProjection.items[0]?.primaryAction).toBe("edit");
  });
});
