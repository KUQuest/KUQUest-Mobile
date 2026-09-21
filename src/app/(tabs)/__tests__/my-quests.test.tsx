import React from "react";
import { render } from "@testing-library/react-native";
import { useLocalSearchParams } from "expo-router";

import MyQuestsRoute from "../my-quests";
import { useRoleWorkspace } from "@/features/workspace/roleWorkspaceStore";

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(),
}));

jest.mock("@/features/workspace/roleWorkspaceStore", () => ({
  useRoleWorkspace: jest.fn(),
}));

jest.mock("@/features/workerHome/screens/WorkerWorkManagementScreen", () => ({
  __esModule: true,
  default: () => {
    const React = jest.requireActual("react");
    const { Text } = jest.requireActual("react-native");
    return React.createElement(
      Text,
      { testID: "worker-work-management-route" },
      "Worker Work Management"
    );
  },
}));

jest.mock("@/features/myQuests/MyQuestListScreen", () => ({
  __esModule: true,
  default: ({ initialRole }: { initialRole?: string }) => {
    const React = jest.requireActual("react");
    const { Text } = jest.requireActual("react-native");
    return React.createElement(
      Text,
      { testID: "hirer-my-quests-route" },
      initialRole ?? "missing role"
    );
  },
}));

describe("Work Management route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({});
  });

  it("opens Worker Work Management in the Worker workspace", async () => {
    (useRoleWorkspace as jest.Mock).mockReturnValue({ workspace: "worker" });

    const view = await render(<MyQuestsRoute />);

    expect(view.getByTestId("worker-work-management-route")).toBeTruthy();
    expect(view.queryByTestId("hirer-my-quests-route")).toBeNull();
  });

  it("opens Hirer My Quests in the Hirer workspace", async () => {
    (useRoleWorkspace as jest.Mock).mockReturnValue({ workspace: "hirer" });

    const view = await render(<MyQuestsRoute />);

    expect(view.getByTestId("hirer-my-quests-route").props.children).toBe(
      "hirer"
    );
    expect(view.queryByTestId("worker-work-management-route")).toBeNull();
  });
});
