import { fireEvent, render, waitFor } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";
import { Appearance, Pressable, Text } from "react-native";

import {
  APPEARANCE_STORAGE_KEY,
  AppearanceProvider,
  DEFAULT_APPEARANCE,
  useAppearance,
} from "../AppearanceProvider";

function AppearanceProbe() {
  const { appearance, setAppearance } = useAppearance();

  return (
    <>
      <Text testID="appearance-value">{appearance}</Text>
      <Pressable onPress={() => setAppearance("dark")} testID="set-dark">
        <Text>Set dark</Text>
      </Pressable>
    </>
  );
}

describe("AppearanceProvider", () => {
  const setColorSchemeSpy = jest.spyOn(Appearance, "setColorScheme");

  beforeEach(async () => {
    await SecureStore.deleteItemAsync(APPEARANCE_STORAGE_KEY);
    jest.clearAllMocks();
  });

  it("starts in light mode and persists an explicit dark selection", async () => {
    const view = await render(
      <AppearanceProvider>
        <AppearanceProbe />
      </AppearanceProvider>
    );

    expect(view.getByTestId("appearance-value").props.children).toBe(
      DEFAULT_APPEARANCE
    );

    fireEvent.press(view.getByTestId("set-dark"));

    await waitFor(() => {
      expect(view.getByTestId("appearance-value").props.children).toBe("dark");
    });
    expect(setColorSchemeSpy).toHaveBeenLastCalledWith("dark");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      APPEARANCE_STORAGE_KEY,
      "dark"
    );
  });

  it("restores a supported appearance from storage", async () => {
    await SecureStore.setItemAsync(APPEARANCE_STORAGE_KEY, "dark");
    jest.clearAllMocks();

    const view = await render(
      <AppearanceProvider>
        <AppearanceProbe />
      </AppearanceProvider>
    );

    await waitFor(() => {
      expect(view.getByTestId("appearance-value").props.children).toBe("dark");
    });
    expect(setColorSchemeSpy).toHaveBeenLastCalledWith("dark");
  });

  it("falls back to light mode when stored appearance is unsupported", async () => {
    await SecureStore.setItemAsync(APPEARANCE_STORAGE_KEY, "system");

    const view = await render(
      <AppearanceProvider>
        <AppearanceProbe />
      </AppearanceProvider>
    );

    await waitFor(() => {
      expect(view.getByTestId("appearance-value").props.children).toBe("light");
    });
  });
});
