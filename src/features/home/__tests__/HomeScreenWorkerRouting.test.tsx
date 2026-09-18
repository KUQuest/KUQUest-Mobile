import React from "react";
import { render } from "@testing-library/react-native";
import type HomeScreenComponent from "../HomeScreen";

const mockPush = jest.fn();

jest.doMock("@/components/navigation/RoleWorkspaceContext", () => ({
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
}));
jest.doMock("@/locales/LocaleProvider", () => ({
  useLocale: () => ({ locale: "en" }),
}));
jest.doMock("@/features/auth/authEnvironment", () => ({
  isPrototypeDemoEnabled: () => false,
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
