import { render } from "@testing-library/react-native";
import React from "react";
import { useLocalSearchParams } from "expo-router";

import CreateRoute from "../create";

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(),
}));

jest.mock("@/features/createQuest/CreateQuestScreen", () => ({
  __esModule: true,
  default: ({ editQuestId }: { editQuestId?: string }) => {
    const React = jest.requireActual("react");
    const { Text } = jest.requireActual("react-native");
    return React.createElement(
      Text,
      { testID: "create-quest-screen-mock" },
      `CreateQuestScreen:${editQuestId ?? "new"}`
    );
  },
}));

describe("Create route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders CreateQuestScreen directly without a draft picker when no editQuestId is provided", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({});

    const view = await render(<CreateRoute />);

    const screenMock = view.getByTestId("create-quest-screen-mock");
    expect(screenMock).toBeTruthy();
    expect(screenMock.props.children).toBe("CreateQuestScreen:new");
    expect(view.queryByText("เลือกฉบับร่างเพื่อแก้ไข")).toBeNull();
    expect(view.queryByText("Choose a draft to edit")).toBeNull();
  });

  it("renders CreateQuestScreen with editQuestId when editQuestId is provided", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      editQuestId: "draft-xyz-123",
    });

    const view = await render(<CreateRoute />);

    const screenMock = view.getByTestId("create-quest-screen-mock");
    expect(screenMock).toBeTruthy();
    expect(screenMock.props.children).toBe("CreateQuestScreen:draft-xyz-123");
  });
});
