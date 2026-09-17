import { render } from "@testing-library/react-native";
import React from "react";

import HomeRoute from "../index";

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
jest.mock("@/features/questBoard/QuestBoardScreen", () => ({
  __esModule: true,
  default: () => {
    const React = jest.requireActual("react");
    const { Text } = jest.requireActual("react-native");
    return React.createElement(
      Text,
      { testID: "quest-board-route" },
      "Quest Board"
    );
  },
}));

describe("authenticated Home route", () => {
  it("opens the Hirer Home composition by default", async () => {
    const view = await render(<HomeRoute />);

    expect(view.getByTestId("hirer-home-route")).toBeTruthy();
    expect(view.queryByTestId("quest-board-route")).toBeNull();
  });
});
