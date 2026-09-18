import React from "react";
import { render } from "@testing-library/react-native";
import type HomeScreenComponent from "../HomeScreen";

const mockPush = jest.fn();

jest.doMock("@/features/workspace/roleWorkspaceStore", () => ({
  useRoleWorkspace: () => ({
    workspace: "worker",
    isHirer: false,
    isWorker: true,
    switchWorkspace: jest.fn(),
    setWorkspace: jest.fn(),
  }),
}));
jest.doMock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (cb: () => void) => {
    const ReactActual = jest.requireActual("react");
    ReactActual.useEffect(() => {
      cb();
    }, [cb]);
  },
}));
jest.doMock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));
jest.doMock("@/features/auth/authEnvironment", () => ({
  isPrototypeDemoEnabled: () => false,
}));
jest.doMock("@/api/QuestApi", () => ({
  questApi: {
    listMine: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
    listQuestAssignments: jest.fn().mockResolvedValue([]),
    listApplications: jest.fn().mockResolvedValue([]),
  },
}));
jest.doMock("@/api/StudentApi", () => ({
  studentApi: {
    getPublicProfile: jest.fn(),
  },
}));
jest.doMock("@/features/workerHome/WorkerHomeScreen", () => {
  const ReactActual = jest.requireActual("react");
  const { Text } = jest.requireActual("react-native");
  return function MockWorkerHome() {
    return ReactActual.createElement(
      Text,
      { testID: "worker-home-route" },
      "Worker Home"
    );
  };
});

const HomeScreen = require("../HomeScreen")
  .default as typeof HomeScreenComponent;

describe("HomeScreen workspace routing", () => {
  it("renders Worker Home for the Worker workspace", async () => {
    const view = await render(<HomeScreen />);

    expect(view.getByTestId("worker-home-route")).toBeTruthy();
    expect(view.queryByTestId("hirer-home-title")).toBeNull();
  });
});
