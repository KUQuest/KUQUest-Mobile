import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { WorkspaceQuickSwitch } from "../WorkspaceQuickSwitch";

const mockReplace = jest.fn();
const mockSwitchWorkspace = jest.fn();
let mockIsWorker = false;

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));

jest.mock("@/features/workspace/AppThemeProvider", () => ({
  useAppTheme: () => ({ colors: { primary: "test-primary" } }),
}));

jest.mock("@/features/workspace/roleWorkspaceStore", () => ({
  useRoleWorkspace: () => ({
    isWorker: mockIsWorker,
    switchWorkspace: mockSwitchWorkspace,
  }),
}));

describe("WorkspaceQuickSwitch", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockSwitchWorkspace.mockReset();
    mockIsWorker = false;
  });

  it("names opposite workspace and switches once before returning to Home", async () => {
    let completeSwitch!: () => void;
    mockSwitchWorkspace.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          completeSwitch = resolve;
        })
    );

    const hirer = await render(<WorkspaceQuickSwitch />);
    const hirerButton = hirer.getByLabelText("Switch to Worker workspace");
    expect(hirerButton.props.accessibilityRole).toBe("button");
    expect(hirerButton.props.accessibilityState).toEqual({
      busy: false,
      disabled: false,
    });
    await fireEvent.press(hirerButton);
    await fireEvent.press(hirerButton);
    expect(mockSwitchWorkspace).toHaveBeenCalledTimes(1);
    expect(
      hirer.getByTestId("workspace-quick-switch").props.accessibilityState
    ).toEqual({ busy: true, disabled: true });
    expect(mockReplace).not.toHaveBeenCalled();
    completeSwitch();
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/(tabs)"));

    hirer.unmount();
    mockReplace.mockReset();
    mockSwitchWorkspace.mockReset();
    mockSwitchWorkspace.mockResolvedValue(undefined);
    mockIsWorker = true;
    const worker = await render(<WorkspaceQuickSwitch />);
    const workerButton = worker.getByLabelText("Switch to Hirer workspace");
    expect(workerButton).toBeTruthy();
    await fireEvent.press(workerButton);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/(tabs)"));
    expect(mockSwitchWorkspace).toHaveBeenCalledTimes(1);
  });
});
