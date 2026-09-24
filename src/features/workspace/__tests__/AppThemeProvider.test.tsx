import { act, render } from "@testing-library/react-native";
import { Text } from "react-native";

import { AppThemeProvider, useAppTheme } from "../AppThemeProvider";
import { useRoleWorkspaceStore } from "../roleWorkspaceStore";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockUseColorScheme = jest.fn();

jest.mock("nativewind", () => ({
  VariableContextProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));
jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));
jest.mock("expo-system-ui", () => ({
  setBackgroundColorAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: () => mockUseColorScheme(),
}));

function ThemeProbe() {
  const { scheme, colors } = useAppTheme();
  return <Text testID="theme-value">{`${scheme}:${colors.primary}`}</Text>;
}

describe("AppThemeProvider", () => {
  beforeEach(() => {
    mockUseColorScheme.mockReturnValue("dark");
    useRoleWorkspaceStore.setState({ workspace: "worker" });
  });

  it("exposes resolved appearance and workspace palette through one interface", async () => {
    const screen = await render(
      <AppThemeProvider>
        <ThemeProbe />
      </AppThemeProvider>
    );

    expect(screen.getByTestId("theme-value").props.children).toBe(
      "dark:#E1A08C"
    );
  });
  it("updates the light accent when switching from Worker to Hirer", async () => {
    mockUseColorScheme.mockReturnValue("light");

    const screen = await render(
      <AppThemeProvider>
        <ThemeProbe />
      </AppThemeProvider>
    );

    expect(screen.getByTestId("theme-value").props.children).toBe(
      "light:#96533F"
    );

    await act(async () => {
      await useRoleWorkspaceStore.getState().switchWorkspace("hirer");
    });

    expect(screen.getByTestId("theme-value").props.children).toBe(
      "light:#5F7655"
    );
  });
});
