import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { questApi } from "@/api/QuestApi";
import { studentApi } from "@/api/StudentApi";
import { LocaleProvider } from "@/locales/LocaleProvider";
import HomeScreen from "../HomeScreen";

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

    const { getByText, getByTestId } = await render(
      <LocaleProvider>
        <HomeScreen />
      </LocaleProvider>
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

    const { getByText, getByTestId } = await render(
      <LocaleProvider>
        <HomeScreen />
      </LocaleProvider>
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

    const { getByText, getByTestId } = await render(
      <LocaleProvider>
        <HomeScreen />
      </LocaleProvider>
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

    const { getByText, getByTestId } = await render(
      <LocaleProvider>
        <HomeScreen />
      </LocaleProvider>
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

    const { getByTestId, queryByTestId } = await render(
      <LocaleProvider>
        <HomeScreen />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(getByTestId("hirer-home-empty")).toBeTruthy();
    });

    expect(queryByTestId("hirer-quest-carousel")).toBeNull();
  });
  it("navigates to the correct destination for each Quick Access action", async () => {
    (questApi.listMine as jest.Mock).mockResolvedValue({
      items: [],
      nextCursor: null,
    });

    const { getByTestId } = await render(
      <LocaleProvider>
        <HomeScreen />
      </LocaleProvider>
    );

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
