import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithQueryClient } from "@/testing/queryTestUtils";

import { questApi } from "@/api/QuestApi";
import { studentApi } from "@/api/StudentApi";
import HomeScreen from "../HomeScreen";
import { DEFAULT_LOCALE } from "@/locales/locale";
import { hirerHomeMessages } from "../hirerHomeMessages";

const mockPush = jest.fn();

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

    const { getByText, getByTestId } = await renderWithQueryClient(
      <HomeScreen />
    );

    await waitFor(() => {
      expect(getByText("Science Exhibition Booth Setup")).toBeTruthy();
    });

    expect(getByText("Chat Worker")).toBeTruthy();
    expect(getByTestId("hirer-quest-card-worker-live-q1")).toBeTruthy();
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

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]/select-roster",
      params: { id: "live-q1" },
    });
  });

  it("opens the roster screen from the applicants banner and the attention list", async () => {
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

    await fireEvent.press(getByTestId("hirer-quest-card-applicants-live-q2"));
    await fireEvent.press(getByTestId("hirer-attention-applicants-live-q2"));

    expect(mockPush).toHaveBeenCalledTimes(2);
    expect(mockPush).toHaveBeenNthCalledWith(2, {
      pathname: "/quest/[id]/select-roster",
      params: { id: "live-q2" },
    });
    expect(mockPush).toHaveBeenNthCalledWith(1, {
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
    await fireEvent.press(getByTestId("hirer-quest-card-applicants-live-q3"));

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

  it("moves an in-progress Active Quest to review once a Worker sends Proof", async () => {
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

    await fireEvent.press(
      getByTestId("hirer-quest-card-review-proof-live-proof")
    );
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]/proof-review",
      params: { id: "live-proof" },
    });
  });

  it("opens My Quests from the overview counts and each shortcut destination", async () => {
    (questApi.listMine as jest.Mock).mockResolvedValue({
      items: [],
      nextCursor: null,
    });

    const { getByTestId } = await renderWithQueryClient(<HomeScreen />);

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

    await fireEvent.press(getByTestId("hirer-shortcut-board"));
    expect(mockPush).toHaveBeenCalledWith("/quest-board");

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
});
