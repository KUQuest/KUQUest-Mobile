import { act, render } from "@testing-library/react-native";
import { Text } from "react-native";

import { TopBar } from "@/components/ui/TopBar";
import { hirerRamp, workerRamp } from "@/theme/colors";
import { AppThemeProvider, useAppTheme } from "../AppThemeProvider";
import { useRoleWorkspaceStore } from "../roleWorkspaceStore";

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
      `dark:${workerRamp.dark.primary}`
    );
  });

  it("recolors an already-mounted shared screen when the workspace switches", async () => {
    useRoleWorkspaceStore.setState({ workspace: "hirer" });
    const screen = await render(
      <AppThemeProvider>
        <TopBar onBackPress={jest.fn()} />
      </AppThemeProvider>
    );
    const backIconColor = () => {
      const icon = screen.getByTestId("header-back-button").children[0];
      return typeof icon === "string" ? undefined : icon.props.color;
    };
    expect(backIconColor()).toBe(hirerRamp.dark.primary);

    await act(async () => {
      useRoleWorkspaceStore.setState({ workspace: "worker" });
    });

    expect(backIconColor()).toBe(workerRamp.dark.primary);
  });
});
