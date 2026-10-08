import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithQueryClient } from "@/testing/queryTestUtils";

import { questApi } from "@/api/QuestApi";
import { isPrototypeDemoEnabled } from "@/features/auth/authEnvironment";
import { studentApi } from "@/api/StudentApi";
import HomeScreen from "../HomeScreen";
import { DEFAULT_LOCALE } from "@/locales/locale";
import { hirerHomeMessages } from "@/locales/hirerHomeMessages";
const mockPush = jest.fn();

jest.mock("@/features/auth/authEnvironment", () => ({
  isPrototypeDemoEnabled: jest.fn(() => false),
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useFocusEffect: (cb: () => void) => {
    const React = jest.requireActual("react");
    React.useEffect(() => {
      cb();
    }, [cb]);
  },
}));

jest.mock("@/api/QuestApi", () => ({
  questApi: {
    listMine: jest.fn(),
    listQuestAssignments: jest.fn(),
    listApplications: jest.fn(),
    listCandidateTeams: jest.fn(),
    listProofSubmissions: jest.fn(),
  },
}));

jest.mock("@/api/StudentApi", () => {
  const actual = jest.requireActual("@/api/StudentApi");
  return {
    ...actual,
    studentApi: {
      getPublicProfile: jest.fn(),
    },
  };
});

describe("HomeScreen live active quests syncing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isPrototypeDemoEnabled).mockReturnValue(false);
  });

  it("syncs and displays active quests created by the hirer with assigned worker", async () => {
    (questApi.listMine as jest.Mock).mockResolvedValue({
      items: [
        {
          id: "live-q1",
          title: "Science Exhibition Booth Setup",
          state: "QUEST_ASSIGNED",
          mode: "FIRST_COME_FIRST_SERVED",
          participation: "SINGLE",
          headcount: 1,
          dueAt: "2026-09-20T17:00:00.000+07:00",
          tag: { name: "Design" },
        },
      ],
      nextCursor: null,
    });

    (questApi.listQuestAssignments as jest.Mock).mockResolvedValue([
      {
        id: "assign-1",
        questId: "live-q1",
        workerId: "worker-chat-1",
        state: "ASSIGNMENT_ACTIVE",
      },
    ]);

    (studentApi.getPublicProfile as jest.Mock).mockResolvedValue({
      firstName: "Chat",
      lastName: "Worker",
      avatar: null,
      department: {
        faculty: { name: "Engineering" },
      },
    });

    const { getByText, queryByText } = await renderWithQueryClient(
      <HomeScreen />
    );

    await waitFor(() => {
      expect(getByText("Science Exhibition Booth Setup")).toBeTruthy();
    });

    expect(getByText("Chat Worker")).toBeTruthy();
    expect(queryByText("Design")).toBeNull();
  });

  it("opens live Quest Manage without enabling fixture preview", async () => {
    (questApi.listMine as jest.Mock).mockResolvedValue({
      items: [
        {
          id: "live-detail",
          title: "Live Quest",
          state: "QUEST_OPEN",
          mode: "FIRST_COME_FIRST_SERVED",
          participation: "SINGLE",
          headcount: 1,
          dueAt: null,
        },
      ],
      nextCursor: null,
    });
    (questApi.listQuestAssignments as jest.Mock).mockResolvedValue([]);

    const { getByTestId } = await renderWithQueryClient(<HomeScreen />);
    await waitFor(() =>
      expect(getByTestId("hirer-quest-card-details-live-detail")).toBeTruthy()
    );
    await fireEvent.press(getByTestId("hirer-quest-card-details-live-detail"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]/manage",
      params: { id: "live-detail" },
    });
  });

  it("shows fixture preview after demo backend failure without opening unsupported routes", async () => {
    jest.mocked(isPrototypeDemoEnabled).mockReturnValue(true);
    (questApi.listMine as jest.Mock).mockRejectedValue(
      new Error("Backend unavailable")
    );

    const { getByTestId, queryByTestId } = await renderWithQueryClient(
      <HomeScreen />
    );

    await waitFor(() => {
      expect(
        getByTestId("hirer-quest-card-hirer-home-progress-demo")
      ).toBeTruthy();
    });
    expect(queryByTestId("hirer-home-error")).toBeNull();
    await fireEvent.press(
      getByTestId("hirer-quest-card-details-hirer-home-progress-demo")
    );
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]",
      params: {
        id: "hirer-home-progress-demo",
        preview: "populated",
      },
    });
    mockPush.mockClear();
    await fireEvent.press(
      getByTestId("hirer-quest-card-worker-hirer-home-progress-demo")
    );
    expect(mockPush).not.toHaveBeenCalled();
    expect(
      queryByTestId("hirer-quest-card-worker-profile-hirer-home-progress-demo")
    ).toBeNull();
  });

  it("keeps production query failures on the error state", async () => {
    (questApi.listMine as jest.Mock).mockRejectedValue(
      new Error("Backend unavailable")
    );

    const { getByTestId, queryByTestId } = await renderWithQueryClient(
      <HomeScreen />
    );

    await waitFor(() => {
      expect(getByTestId("hirer-home-error")).toBeTruthy();
    });
    expect(queryByTestId("hirer-quest-carousel")).toBeNull();
  });

  it("uses Home loading skeletons from shared primitives", async () => {
    const { promise } = Promise.withResolvers<never>();
    (questApi.listMine as jest.Mock).mockReturnValue(promise);

    const { getByTestId, queryByTestId } = await renderWithQueryClient(
      <HomeScreen />
    );

    expect(getByTestId("hirer-home-loading-skeleton")).toBeTruthy();
    expect(queryByTestId("quest-board-loading-skeleton")).toBeNull();
  });

  it("opens the roster screen from the assigned Worker banner", async () => {
    (questApi.listMine as jest.Mock).mockResolvedValue({
      items: [
        {
          id: "live-q1",
          title: "Science Exhibition Booth Setup",
          state: "QUEST_ASSIGNED",
          mode: "FIRST_COME_FIRST_SERVED",
          participation: "SINGLE",
          headcount: 1,
          dueAt: "2026-09-20T17:00:00.000+07:00",
          tag: { name: "Design" },
        },
      ],
      nextCursor: null,
    });

    (questApi.listQuestAssignments as jest.Mock).mockResolvedValue([
      {
        id: "assign-1",
        questId: "live-q1",
        workerId: "worker-chat-1",
        state: "ASSIGNMENT_ACTIVE",
      },
    ]);

    (studentApi.getPublicProfile as jest.Mock).mockResolvedValue({
      firstName: "Chat",
      lastName: "Worker",
      avatar: null,
      department: { faculty: { name: "Engineering" } },
    });

    const { getByText, getByTestId } = await renderWithQueryClient(
      <HomeScreen />
    );

    await waitFor(() => {
      expect(getByText("Science Exhibition Booth Setup")).toBeTruthy();
    });

    await fireEvent.press(getByTestId("hirer-quest-card-worker-live-q1"));
    await fireEvent.press(
      getByTestId("hirer-quest-card-worker-profile-live-q1")
    );
    expect(mockPush).toHaveBeenCalledWith("/profile/worker-chat-1");

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]/select-roster",
      params: { id: "live-q1" },
    });
  });

  it("opens the roster from the attention list, not the applicants summary", async () => {
    (questApi.listMine as jest.Mock).mockResolvedValue({
      items: [
        {
          id: "live-q2",
          title: "Poster Design Sprint",
          state: "QUEST_OPEN",
          mode: "CANDIDATE",
          participation: "SINGLE",
          headcount: 1,
          dueAt: null,
          tag: { name: "Design" },
        },
      ],
      nextCursor: null,
    });

    (questApi.listQuestAssignments as jest.Mock).mockResolvedValue([]);
    (questApi.listApplications as jest.Mock).mockResolvedValue([
      {
        id: "app-1",
        questId: "live-q2",
        memberId: "candidate-1",
        state: "APPLICATION_APPLIED",
        appliedAt: "2026-09-18T10:00:00.000+07:00",
      },
    ]);

    (studentApi.getPublicProfile as jest.Mock).mockResolvedValue({
      firstName: "Nina",
      lastName: "Candidate",
      avatar: null,
      department: { faculty: { name: "Design" } },
    });

    const { getByTestId } = await renderWithQueryClient(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId("hirer-quest-card-applicants-live-q2")).toBeTruthy();
    });

    expect(
      getByTestId("hirer-quest-card-applicants-live-q2").props
    ).not.toHaveProperty("accessibilityRole", "button");
    await fireEvent.press(getByTestId("hirer-attention-applicants-live-q2"));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]/select-roster",
      params: { id: "live-q2" },
    });
  });

  it("resolves submitted team leaders as applicants and opens select-roster for GROUP Candidate quests", async () => {
    (questApi.listMine as jest.Mock).mockResolvedValue({
      items: [
        {
          id: "live-q3",
          title: "Campus Mural Team Project",
          state: "QUEST_OPEN",
          mode: "CANDIDATE",
          participation: "GROUP",
          headcount: 3,
          dueAt: null,
          tag: { name: "Art" },
        },
      ],
      nextCursor: null,
    });

    (questApi.listQuestAssignments as jest.Mock).mockResolvedValue([]);
    (questApi.listCandidateTeams as jest.Mock).mockResolvedValue([
      {
        id: "team-1",
        questId: "live-q3",
        leaderId: "leader-1",
        name: "Muralists",
        headcount: 3,
        state: "TEAM_SUBMITTED",
        members: [{ memberId: "leader-1", joinedAt: "2026-09-01T00:00:00Z" }],
        submission: null,
        createdAt: "2026-09-01T00:00:00Z",
      },
    ]);

    (studentApi.getPublicProfile as jest.Mock).mockResolvedValue({
      firstName: "Leo",
      lastName: "Leader",
      avatar: null,
      department: { faculty: { name: "Art" } },
    });

    const { getByTestId } = await renderWithQueryClient(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId("hirer-quest-card-live-q3")).toBeTruthy();
    });

    expect(questApi.listApplications).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(getByTestId("hirer-quest-card-applicants-live-q3")).toBeTruthy();
    });
    await fireEvent.press(getByTestId("hirer-attention-applicants-live-q3"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]/select-roster",
      params: { id: "live-q3" },
    });
  });

  it("shows empty state when no active quests exist", async () => {
    (questApi.listMine as jest.Mock).mockResolvedValue({
      items: [],
      nextCursor: null,
    });

    const { getByTestId, queryByTestId } = await renderWithQueryClient(
      <HomeScreen />
    );

    await waitFor(() => {
      expect(getByTestId("hirer-home-empty")).toBeTruthy();
    });

    expect(queryByTestId("hirer-quest-carousel")).toBeNull();
  });
  it("shows empty state when all Hirer Quests are completed", async () => {
    (questApi.listMine as jest.Mock).mockResolvedValue({
      items: [
        {
          id: "completed-1",
          title: "Completed Quest",
          state: "QUEST_COMPLETED",
          mode: "FIRST_COME_FIRST_SERVED",
          participation: "SINGLE",
          headcount: 1,
          dueAt: "2026-09-20T17:00:00.000+07:00",
          tag: { name: "Design" },
        },
      ],
      nextCursor: null,
    });

    const { getByTestId, queryByTestId, queryByText } =
      await renderWithQueryClient(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId("hirer-home-empty")).toBeTruthy();
    });
    expect(queryByTestId("hirer-quest-carousel")).toBeNull();
    expect(queryByText("Completed Quest")).toBeNull();
  });

  it("keeps the home carousel compact while counting every Hirer Quest", async () => {
    const activeQuests = Array.from({ length: 6 }, (_, index) => ({
      id: `active-${index + 1}`,
      title: `Open Quest ${index + 1}`,
      state: "QUEST_OPEN",
      mode: "FIRST_COME_FIRST_SERVED",
      participation: "SINGLE",
      headcount: 1,
      dueAt: "2026-09-20T17:00:00.000+07:00",
      tag: { name: "Design" },
    }));

    (questApi.listMine as jest.Mock)
      .mockResolvedValueOnce({
        items: [
          ...activeQuests.slice(0, 5),
          {
            id: "draft-1",
            title: "Draft Quest 1",
            state: "QUEST_DRAFT",
            mode: "FIRST_COME_FIRST_SERVED",
            participation: "SINGLE",
            headcount: 1,
            dueAt: null,
            tag: { name: "Design" },
          },
        ],
        nextCursor: "page-2",
      })
      .mockResolvedValueOnce({
        items: [
          activeQuests[5],
          {
            id: "draft-2",
            title: "Draft Quest 2",
            state: "QUEST_DRAFT",
            mode: "FIRST_COME_FIRST_SERVED",
            participation: "SINGLE",
            headcount: 1,
            dueAt: null,
            tag: { name: "Design" },
          },
          {
            id: "completed-1",
            title: "Completed Quest",
            state: "QUEST_COMPLETED",
            mode: "FIRST_COME_FIRST_SERVED",
            participation: "SINGLE",
            headcount: 1,
            dueAt: "2026-09-20T17:00:00.000+07:00",
            tag: { name: "Design" },
          },
        ],
        nextCursor: null,
      });
    (questApi.listQuestAssignments as jest.Mock).mockResolvedValue([]);
    (questApi.listApplications as jest.Mock).mockResolvedValue([]);
    (questApi.listCandidateTeams as jest.Mock).mockResolvedValue([]);

    const { getByLabelText, getByTestId, getByText, queryByText } =
      await renderWithQueryClient(<HomeScreen />);

    await waitFor(() => {
      expect(getByText("Open Quest 1")).toBeTruthy();
    });

    expect(getByLabelText("กำลังดำเนินการ: 6")).toBeTruthy();
    expect(getByLabelText("ฉบับร่าง: 2")).toBeTruthy();
    expect(getByLabelText("เสร็จสิ้น: 1")).toBeTruthy();
    expect(getByTestId("hirer-view-all-active")).toBeTruthy();
    expect(queryByText("Open Quest 6")).toBeNull();
    expect(queryByText("Completed Quest")).toBeNull();

    fireEvent.press(getByTestId("hirer-view-all-active"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/my-quests",
      params: { role: "hirer", tab: "active" },
    });
  });

  it("shows attention for an active Quest outside the five-card carousel", async () => {
    const activeQuests = Array.from({ length: 6 }, (_, index) => ({
      id: `attention-active-${index + 1}`,
      title: `Active Quest ${index + 1}`,
      state: "QUEST_OPEN",
      mode: "FIRST_COME_FIRST_SERVED",
      participation: "SINGLE",
      headcount: 1,
      dueAt: null,
    }));
    activeQuests[5] = {
      ...activeQuests[5],
      mode: "CANDIDATE",
      title: "Sixth Quest Needs Selection",
    };
    (questApi.listMine as jest.Mock).mockResolvedValue({
      items: activeQuests,
      nextCursor: null,
    });
    (questApi.listQuestAssignments as jest.Mock).mockResolvedValue([]);
    (questApi.listApplications as jest.Mock).mockResolvedValue([
      {
        id: "sixth-application",
        questId: "attention-active-6",
        memberId: "candidate-six",
        state: "APPLICATION_APPLIED",
        appliedAt: "2026-09-18T10:00:00.000+07:00",
      },
    ]);

    const { getByTestId, queryByText } = await renderWithQueryClient(
      <HomeScreen />
    );

    await waitFor(() => {
      expect(
        getByTestId("hirer-attention-applicants-attention-active-6")
      ).toBeTruthy();
    });
    expect(queryByText("Active Quest 6")).toBeNull();
    await fireEvent.press(
      getByTestId("hirer-attention-applicants-attention-active-6")
    );
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]/select-roster",
      params: { id: "attention-active-6" },
    });
  });

  it("routes pending Proof from Needs your attention without a card CTA", async () => {
    (questApi.listMine as jest.Mock).mockResolvedValue({
      items: [
        {
          id: "live-proof",
          title: "Poster Design",
          state: "QUEST_IN_PROGRESS",
          mode: "FIRST_COME_FIRST_SERVED",
          participation: "SINGLE",
          headcount: 1,
          proofRequired: true,
          dueAt: "2026-09-30T17:00:00.000+07:00",
        },
      ],
      nextCursor: null,
    });
    (questApi.listQuestAssignments as jest.Mock).mockResolvedValue([]);
    (questApi.listProofSubmissions as jest.Mock).mockResolvedValue([
      {
        id: "proof-1",
        status: "PROOF_PENDING",
        submittedAt: "2026-09-23T10:00:00.000Z",
      },
    ]);

    const { getByTestId, queryByTestId } = await renderWithQueryClient(
      <HomeScreen />
    );
    const messages = hirerHomeMessages[DEFAULT_LOCALE];

    await waitFor(() => {
      expect(
        getByTestId("hirer-quest-card-progress-live-proof").props
          .accessibilityLabel
      ).toContain(
        `${messages.timelineLabels.review}, ${messages.currentStageLabel}`
      );
    });
    expect(questApi.listProofSubmissions).toHaveBeenCalledWith(
      "live-proof",
      expect.anything()
    );

    expect(
      queryByTestId("hirer-quest-card-review-proof-live-proof")
    ).toBeNull();
    expect(getByTestId("hirer-attention-proof-live-proof")).toBeTruthy();
    await fireEvent.press(getByTestId("hirer-attention-proof-live-proof"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]/proof-review",
      params: { id: "live-proof" },
    });
  });

  it("keeps Hirer shortcuts and hides the Worker Quest Board", async () => {
    (questApi.listMine as jest.Mock).mockResolvedValue({
      items: [],
      nextCursor: null,
    });

    const { getByTestId, queryByTestId } = await renderWithQueryClient(
      <HomeScreen />
    );

    await waitFor(() => {
      expect(getByTestId("hirer-home-shortcuts")).toBeTruthy();
    });

    for (const tab of ["active", "draft", "completed"]) {
      await fireEvent.press(getByTestId(`hirer-overview-${tab}`));
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/my-quests",
        params: { role: "hirer", tab },
      });
    }

    await fireEvent.press(getByTestId("hirer-shortcut-my-quests"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/my-quests",
      params: { role: "hirer" },
    });

    expect(queryByTestId("hirer-shortcut-board")).toBeNull();

    await fireEvent.press(getByTestId("hirer-shortcut-topup"));
    expect(mockPush).toHaveBeenCalledWith("/top-up");

    await fireEvent.press(getByTestId("hirer-shortcut-settings"));
    expect(mockPush).toHaveBeenCalledWith("/settings");

    await fireEvent.press(getByTestId("hirer-home-empty-create"));
    expect(mockPush).toHaveBeenCalledWith("/create");
  });

  it("lists a sent Proof under Needs your attention and opens Proof review", async () => {
    (questApi.listMine as jest.Mock).mockResolvedValue({
      items: [
        {
          id: "live-proof",
          title: "Poster Design",
          state: "QUEST_IN_PROGRESS",
          mode: "FIRST_COME_FIRST_SERVED",
          participation: "SINGLE",
          headcount: 1,
          proofRequired: true,
          dueAt: "2026-09-30T17:00:00.000+07:00",
        },
      ],
      nextCursor: null,
    });
    (questApi.listQuestAssignments as jest.Mock).mockResolvedValue([]);
    (questApi.listProofSubmissions as jest.Mock).mockResolvedValue([
      {
        id: "proof-1",
        status: "PROOF_PENDING",
        submittedAt: "2026-09-23T10:00:00.000Z",
      },
    ]);

    const { getByTestId } = await renderWithQueryClient(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId("hirer-attention-proof-live-proof")).toBeTruthy();
    });
    await fireEvent.press(getByTestId("hirer-attention-proof-live-proof"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]/proof-review",
      params: { id: "live-proof" },
    });
  });

  it("renders localized partial-failure notice with retry when enrichment fails", async () => {
    (questApi.listMine as jest.Mock).mockResolvedValue({
      items: [
        {
          id: "live-enrich-fail",
          title: "Lab Assistant",
          state: "QUEST_ASSIGNED",
          mode: "FIRST_COME_FIRST_SERVED",
          participation: "SINGLE",
          headcount: 1,
          dueAt: "2026-09-30T17:00:00.000+07:00",
        },
      ],
      nextCursor: null,
    });
    (questApi.listQuestAssignments as jest.Mock).mockRejectedValueOnce(
      new Error("Network error")
    );

    const { getByTestId, getByText } = await renderWithQueryClient(
      <HomeScreen />
    );
    const messages = hirerHomeMessages[DEFAULT_LOCALE];

    await waitFor(() => {
      expect(getByTestId("hirer-home-partial-failure")).toBeTruthy();
    });

    expect(getByText(messages.partialFailureTitle)).toBeTruthy();
    expect(getByText(messages.partialFailureDescription)).toBeTruthy();

    // Now mock success for retry
    (questApi.listQuestAssignments as jest.Mock).mockResolvedValueOnce([
      {
        id: "assign-retry",
        questId: "live-enrich-fail",
        workerId: "worker-retry-1",
        state: "ASSIGNMENT_ACTIVE",
      },
    ]);
    (studentApi.getPublicProfile as jest.Mock).mockResolvedValue({
      firstName: "Somchai",
      lastName: "Dee",
      avatar: null,
      department: { faculty: { name: "Science" } },
    });

    fireEvent.press(getByTestId("hirer-home-partial-failure-retry"));

    await waitFor(() => {
      expect(questApi.listQuestAssignments).toHaveBeenCalledTimes(2);
    });
  });
});
