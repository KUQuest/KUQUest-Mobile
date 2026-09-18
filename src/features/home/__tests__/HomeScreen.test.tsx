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
  },
}));

jest.mock("@/api/StudentApi", () => ({
  studentApi: {
    getPublicProfile: jest.fn(),
  },
}));

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
    expect(mockPush).toHaveBeenCalledWith("/top-up");
  });
});
