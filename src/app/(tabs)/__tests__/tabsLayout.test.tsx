import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import TabsLayout from "../_layout";

const mockPush = jest.fn();
let mockWorker = true;
let mockRoute = "money";
let mockSegments = ["(tabs)", "money"];
let mockAssignments: object[] = [];
let mockSceneOptions: any;

jest.mock("expo-router", () => {
  const React = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  const Tabs = (props: any) => {
    mockSceneOptions = props.screenOptions({ route: { name: mockRoute } });
    return React.createElement(
      View,
      null,
      props.tabBar({
        state: { index: 0, routes: [{ name: mockRoute }] },
        insets: { bottom: 0 },
      })
    );
  };
  Tabs.Screen = function Screen() {
    return null;
  };
  return {
    Tabs,
    useSegments: () => mockSegments,
    useRouter: () => ({ push: mockPush }),
  };
});
jest.mock("@/components/navigation/BottomNav", () => ({
  BottomNav: () => null,
}));
jest.mock("@/features/workspace/roleWorkspaceStore", () => ({
  useRoleWorkspace: () => ({ isWorker: mockWorker }),
}));
jest.mock("@/features/workerHome/api/workerHomeQueries", () => ({
  useWorkerAssignmentsQuery: () => ({ data: mockAssignments }),
  useWorkerParticipationDetailQuery: () => ({
    data: { title: "Active quest", state: "QUEST_ASSIGNED" },
  }),
}));
jest.mock("@/features/workerHome/components/WorkerQuickAccessBar", () => {
  const React = jest.requireActual("react");
  const { Pressable, Text } = jest.requireActual("react-native");
  return {
    WorkerQuickAccessBar: ({ assignment, onPress }: any) =>
      assignment
        ? React.createElement(
            Pressable,
            { testID: "worker-dock", onPress },
            React.createElement(Text, null, "Work Hub")
          )
        : null,
  };
});

const assignment = {
  questId: "quest-1",
  state: "ASSIGNMENT_ACTIVE",
  questState: "QUEST_ASSIGNED",
};

describe("worker quest shortcut across tabs", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockWorker = true;
    mockRoute = "money";
    mockSegments = ["(tabs)", "money"];
    mockAssignments = [assignment];
  });
  it("shows the shortcut on a worker tab and opens the active Work Hub", async () => {
    const view = await render(<TabsLayout />);
    await fireEvent.press(view.getByTestId("worker-dock"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]/work",
      params: { id: "quest-1" },
    });
    expect(mockSceneOptions.sceneStyle.paddingBottom).toBeGreaterThan(0);
  });
  it("opens the work list when there are multiple active quests", async () => {
    mockAssignments = [assignment, { ...assignment, questId: "quest-2" }];
    const view = await render(<TabsLayout />);
    await fireEvent.press(view.getByTestId("worker-dock"));
    expect(mockPush).toHaveBeenCalledWith("/my-quests");
  });
  it("does not reserve space when there is no active assignment", async () => {
    mockAssignments = [];
    const view = await render(<TabsLayout />);
    expect(view.queryByTestId("worker-dock")).toBeNull();
    expect(mockSceneOptions.sceneStyle).toBeUndefined();
  });
  it("does not duplicate Home or show the shortcut in the Hirer workspace", async () => {
    mockRoute = "index";
    const home = await render(<TabsLayout />);
    expect(home.queryByTestId("worker-dock")).toBeNull();
    expect(mockSceneOptions.sceneStyle).toBeUndefined();
    await home.unmount();
    mockWorker = false;
    mockRoute = "money";
    const hirer = await render(<TabsLayout />);
    expect(hirer.queryByTestId("worker-dock")).toBeNull();
    expect(mockSceneOptions.sceneStyle).toBeUndefined();
  });
  it("does not show the shortcut or reserve space when the tab bar is hidden", async () => {
    mockRoute = "chat";
    mockSegments = ["(tabs)", "chat", "conversation-1"];
    const view = await render(<TabsLayout />);
    expect(view.queryByTestId("worker-dock")).toBeNull();
    expect(mockSceneOptions.sceneStyle).toBeUndefined();
  });
});
