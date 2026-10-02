import { render } from "@testing-library/react-native";
import React from "react";

import { useRoleWorkspace } from "@/features/workspace/roleWorkspaceStore";
import HomeRoute from "../index";

jest.mock("@/features/workspace/roleWorkspaceStore", () => ({
  useRoleWorkspace: jest.fn(),
}));
jest.mock("@/features/home/HomeScreen", () => ({
  __esModule: true,
  default: () => {
    const React = jest.requireActual("react");
    const { Text } = jest.requireActual("react-native");
    return React.createElement(
      Text,
      { testID: "hirer-home-route" },
      "Hirer Home"
    );
  },
}));
jest.mock("@/features/workerHome/WorkerHomeScreen", () => ({
  __esModule: true,
  default: () => {
    const React = jest.requireActual("react");
    const { Text } = jest.requireActual("react-native");
    return React.createElement(
      Text,
      { testID: "worker-home-route" },
      "Worker Home"
    );
  },
}));

const mockUseRoleWorkspace = useRoleWorkspace as jest.Mock;

describe("authenticated Home route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens the Hirer Home composition for the Hirer workspace", async () => {
    mockUseRoleWorkspace.mockReturnValue({
      workspace: "hirer",
      isHirer: true,
      isWorker: false,
      switchWorkspace: jest.fn(),
      setWorkspace: jest.fn(),
    });

    const view = await render(<HomeRoute />);

    expect(view.getByTestId("hirer-home-route")).toBeTruthy();
    expect(view.queryByTestId("worker-home-route")).toBeNull();
  });

  it("opens the Worker Home composition for the Worker workspace", async () => {
    mockUseRoleWorkspace.mockReturnValue({
      workspace: "worker",
      isHirer: false,
      isWorker: true,
      switchWorkspace: jest.fn(),
      setWorkspace: jest.fn(),
    });

    const view = await render(<HomeRoute />);

    expect(view.getByTestId("worker-home-route")).toBeTruthy();
    expect(view.queryByTestId("hirer-home-route")).toBeNull();
  });
});
