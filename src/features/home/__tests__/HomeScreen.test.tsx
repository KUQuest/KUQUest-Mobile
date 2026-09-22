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

  it("opens the quest detail screen from the roster modal when there is no pending Candidate selection", async () => {
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

    fireEvent.press(getByTestId("hirer-quest-card-worker-live-q1"));
    await waitFor(() => {
      expect(getByTestId("hirer-roster-manage-button")).toBeTruthy();
    });
    fireEvent.press(getByTestId("hirer-roster-manage-button"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]",
      params: { id: "live-q1" },
    });
  });

  it("opens the select-roster screen from the roster modal when an individual Candidate application is pending", async () => {
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

    const { getByText, getByTestId } = await renderWithQueryClient(
      <HomeScreen />
    );

    await waitFor(() => {
      expect(getByText("Poster Design Sprint")).toBeTruthy();
    });

    fireEvent.press(getByTestId("hirer-quest-card-applicants-live-q2"));
    await waitFor(() => {
      expect(getByTestId("hirer-roster-manage-button")).toBeTruthy();
    });
    fireEvent.press(getByTestId("hirer-roster-manage-button"));

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

    const { getByText, getByTestId } = await renderWithQueryClient(
      <HomeScreen />
    );

    await waitFor(() => {
      expect(getByText("Campus Mural Team Project")).toBeTruthy();
    });

    expect(questApi.listApplications).not.toHaveBeenCalled();

    fireEvent.press(getByTestId("hirer-quest-card-applicants-live-q3"));
    await waitFor(() => {
      expect(getByText("Leo Leader")).toBeTruthy();
    });

    fireEvent.press(getByTestId("hirer-roster-manage-button"));

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

    const { getByTestId, getByText, queryByText } = await renderWithQueryClient(
      <HomeScreen />
    );

    await waitFor(() => {
      expect(getByText("Open Quest 1")).toBeTruthy();
    });

    expect(getByText("6 เควสต์ที่กำลังดำเนินการ")).toBeTruthy();
    expect(getByText("2 ฉบับร่าง")).toBeTruthy();
    expect(getByText("1 เควสต์ที่เสร็จสิ้นแล้ว")).toBeTruthy();
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
        getByTestId("hirer-quest-card-live-proof").props.accessibilityLabel
      ).toContain(
        `${messages.timelineLabels.review}, ${messages.currentStageLabel}`
      );
    });
    expect(questApi.listProofSubmissions).toHaveBeenCalledWith(
      "live-proof",
      expect.anything()
    );

    fireEvent.press(getByTestId("hirer-quest-card-review-proof-live-proof"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]/proof-review",
      params: { id: "live-proof" },
    });
  });

  it("navigates to the correct destination for each Quick Access action", async () => {
    (questApi.listMine as jest.Mock).mockResolvedValue({
      items: [],
      nextCursor: null,
    });

    const { getByTestId } = await renderWithQueryClient(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId("hirer-home-quick-access")).toBeTruthy();
    });

    fireEvent.press(getByTestId("hirer-quick-access-active"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/my-quests",
      params: { role: "hirer", tab: "active" },
    });

    fireEvent.press(getByTestId("hirer-quick-access-draft"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/my-quests",
      params: { role: "hirer", tab: "draft" },
    });

    fireEvent.press(getByTestId("hirer-quick-access-history"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/my-quests",
      params: { role: "hirer", tab: "completed" },
    });

    fireEvent.press(getByTestId("hirer-quick-access-board"));
    expect(mockPush).toHaveBeenCalledWith("/quest-board");

    fireEvent.press(getByTestId("hirer-quick-access-topup"));
    expect(mockPush).toHaveBeenCalledWith("/money");
  });
});
