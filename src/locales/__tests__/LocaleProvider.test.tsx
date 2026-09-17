import { fireEvent, render, waitFor } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";
import { Pressable, Text } from "react-native";

import {
  DEFAULT_LOCALE,
  LocaleProvider,
  LOCALE_STORAGE_KEY,
  useLocale,
} from "../LocaleProvider";

function LocaleProbe() {
  const { locale, setLocale } = useLocale();

  return (
    <>
      <Text testID="locale-value">{locale}</Text>
      <Pressable onPress={() => setLocale("en")} testID="set-english">
        <Text>Set English</Text>
      </Pressable>
    </>
  );
}

describe("LocaleProvider", () => {
  beforeEach(async () => {
    await SecureStore.deleteItemAsync(LOCALE_STORAGE_KEY);
    jest.clearAllMocks();
  });

  it("starts in Thai and persists an explicit language selection", async () => {
    const view = await render(
      <LocaleProvider>
        <LocaleProbe />
      </LocaleProvider>
    );

    expect(view.getByTestId("locale-value").props.children).toBe(
      DEFAULT_LOCALE
    );

    fireEvent.press(view.getByTestId("set-english"));

    await waitFor(() => {
      expect(view.getByTestId("locale-value").props.children).toBe("en");
    });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      LOCALE_STORAGE_KEY,
      "en"
    );
  });

  it("restores a supported language from storage", async () => {
    await SecureStore.setItemAsync(LOCALE_STORAGE_KEY, "en");
    jest.clearAllMocks();

    const view = await render(
      <LocaleProvider>
        <LocaleProbe />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(view.getByTestId("locale-value").props.children).toBe("en");
    });
  });

  it("falls back to Thai when stored language is unsupported", async () => {
    await SecureStore.setItemAsync(LOCALE_STORAGE_KEY, "fr");

    const view = await render(
      <LocaleProvider>
        <LocaleProbe />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(view.getByTestId("locale-value").props.children).toBe("th");
    });
  });
});
