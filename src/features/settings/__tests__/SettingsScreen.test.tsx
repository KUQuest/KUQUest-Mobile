import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import SettingsScreen from "../SettingsScreen";
import { authService } from "../../auth/AuthService";

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush, replace: mockReplace }),
}));

jest.mock("../../auth/AuthService", () => ({
  authService: { signOut: jest.fn().mockResolvedValue(undefined) },
}));

const mockSetLocale = jest.fn();
let mockLocale: "th" | "en" = "en";

jest.mock("../../../features/preferences/localeStore", () => ({
  useLocale: () => ({
    locale: mockLocale,
    setLocale: mockSetLocale,
  }),
}));

describe("Settings screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetLocale.mockReset();
    mockLocale = "en";
  });

  it("renders grouped account, preference, support, and about content", async () => {
    const view = await render(<SettingsScreen />);

    expect(view.getByRole("header", { name: "Settings" })).toBeTruthy();
    expect(view.getByText("Account")).toBeTruthy();
    expect(view.getByText("Preferences")).toBeTruthy();
    expect(view.getByText("Support")).toBeTruthy();
    expect(view.getByText("Version 1.0.0")).toBeTruthy();
    expect(view.getByText("Edit Profile")).toBeTruthy();
    expect(view.queryByTestId("settings-switch-account")).toBeNull();
    expect(view.getByTestId("settings-notifications")).toBeTruthy();
    expect(
      view.getByTestId("settings-scroll").props.contentContainerStyle
        ?.paddingBottom
    ).toBeGreaterThanOrEqual(24);
    expect(view.getByTestId("settings-content")).toBeTruthy();
    expect(view.queryByTestId("settings-report")).toBeNull();
  });

  it("renders language row with current language and opens modal when pressed", async () => {
    const view = await render(<SettingsScreen />);

    expect(view.getByText("English")).toBeTruthy();

    fireEvent.press(view.getByTestId("settings-language"));

    await waitFor(() => {
      expect(view.getByTestId("settings-language-modal")).toBeTruthy();
      expect(view.getByTestId("settings-language-th")).toBeTruthy();
      expect(view.getByTestId("settings-language-en")).toBeTruthy();
    });
  });

  it("switches language to Thai when Thai option is pressed in modal", async () => {
    const view = await render(<SettingsScreen />);

    fireEvent.press(view.getByTestId("settings-language"));
    await waitFor(() =>
      expect(view.getByTestId("settings-language-th")).toBeTruthy()
    );
    fireEvent.press(view.getByTestId("settings-language-th"));

    await waitFor(() => expect(mockSetLocale).toHaveBeenCalledWith("th"));
  });

  it("switches language to English when English option is pressed in modal", async () => {
    mockLocale = "th";
    const view = await render(<SettingsScreen />);

    fireEvent.press(view.getByTestId("settings-language"));
    await waitFor(() =>
      expect(view.getByTestId("settings-language-en")).toBeTruthy()
    );
    fireEvent.press(view.getByTestId("settings-language-en"));

    await waitFor(() => expect(mockSetLocale).toHaveBeenCalledWith("en"));
  });

  it("closes modal when cancel button is pressed without calling setLocale", async () => {
    const view = await render(<SettingsScreen />);

    fireEvent.press(view.getByTestId("settings-language"));
    await waitFor(() =>
      expect(view.getByTestId("settings-language-modal-cancel")).toBeTruthy()
    );
    fireEvent.press(view.getByTestId("settings-language-modal-cancel"));

    await waitFor(() => {
      expect(view.queryByTestId("settings-language-th")).toBeNull();
    });
    expect(mockSetLocale).not.toHaveBeenCalled();
  });

  it("renders a red logout button at the bottom and returns to the start screen", async () => {
    const view = await render(<SettingsScreen />);

    fireEvent.press(view.getByTestId("settings-logout"));

    await waitFor(() => {
      expect(authService.signOut).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("renders a red logout button at the bottom and returns to the start screen", async () => {
    const view = await render(<SettingsScreen />);

    fireEvent.press(view.getByTestId("settings-logout"));

    await waitFor(() => {
      expect(authService.signOut).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("toggles quest notifications", async () => {
    const view = await render(<SettingsScreen />);
    const toggle = view.getByTestId("settings-notifications");

    expect(toggle.props.accessibilityState.checked).toBe(true);
    fireEvent.press(toggle);
    await waitFor(() =>
      expect(
        view.getByTestId("settings-notifications").props.accessibilityState
          .checked
      ).toBe(false)
    );
  });

  it("does not render account switcher", async () => {
    const view = await render(<SettingsScreen />);

    expect(view.queryByTestId("settings-switch-account")).toBeNull();
    expect(view.queryByText("Switch account")).toBeNull();
    expect(authService.signOut).not.toHaveBeenCalled();
  });

  it("opens Edit Profile from settings", async () => {
    const view = await render(<SettingsScreen />);

    fireEvent.press(view.getByTestId("settings-edit-profile"));

    expect(mockPush).toHaveBeenCalledWith("/profile/edit");
  });
});
