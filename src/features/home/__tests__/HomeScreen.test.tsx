import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

import HomeScreen from "../HomeScreen";

const mockPush = jest.fn();
const mockIsPrototypeDemoEnabled = jest.fn(() => true);

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("@/locales/LocaleProvider", () => ({
  useLocale: () => ({ locale: "en" }),
}));
jest.mock("@/features/auth/authEnvironment", () => ({
  isPrototypeDemoEnabled: () => mockIsPrototypeDemoEnabled(),
}));
describe("Hirer Home", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPrototypeDemoEnabled.mockReturnValue(true);
  });

  it("opens the Quest detail from the active-work card", async () => {
    const view = await render(<HomeScreen />);

    expect(view.getByText("Prototype preview")).toBeTruthy();
    expect(
      view.getByTestId("hirer-quest-card-hirer-home-progress-demo")
    ).toBeTruthy();

    fireEvent.press(
      view.getByTestId("hirer-quest-card-details-hirer-home-progress-demo")
    );

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]",
      params: {
        id: "hirer-home-progress-demo",
        mode: "post",
        preview: "populated",
        studentId: "demo-hirer",
      },
    });
  });

  it("does not show synthetic Quest data outside prototype mode", async () => {
    mockIsPrototypeDemoEnabled.mockReturnValue(false);

    const view = await render(<HomeScreen />);

    expect(view.getByTestId("hirer-home-empty")).toBeTruthy();
    expect(
      view.queryByTestId("hirer-quest-card-hirer-home-progress-demo")
    ).toBeNull();
  });

  it("renders Quick Access buttons and navigates to the selected destination", async () => {
    const view = await render(<HomeScreen />);

    expect(view.getByTestId("hirer-home-quick-access")).toBeTruthy();
    expect(view.getByText("Quick Actions")).toBeTruthy();

    fireEvent.press(view.getByTestId("hirer-quick-access-active"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/my-quests",
      params: { role: "hirer", tab: "active" },
    });

    fireEvent.press(view.getByTestId("hirer-quick-access-draft"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/my-quests",
      params: { role: "hirer", tab: "draft" },
    });

    fireEvent.press(view.getByTestId("hirer-quick-access-history"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/my-quests",
      params: { role: "hirer", tab: "completed" },
    });

    fireEvent.press(view.getByTestId("hirer-quick-access-board"));
    expect(mockPush).toHaveBeenCalledWith("/quest-board");
  });
});
