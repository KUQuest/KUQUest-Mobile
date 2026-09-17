import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Button, Text, View } from "react-native";
import * as SecureStore from "expo-secure-store";

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  LocaleProvider,
  useLocale,
} from "../LocaleProvider";

function TestConsumer() {
  const { locale, setLocale } = useLocale();
  return (
    <View>
      <Text testID="current-locale">{locale}</Text>
      <Button
        testID="switch-to-en"
        title="Switch to EN"
        onPress={() => setLocale("en")}
      />
      <Button
        testID="switch-to-th"
        title="Switch to TH"
        onPress={() => setLocale("th")}
      />
    </View>
  );
}

describe("LocaleProvider", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await SecureStore.deleteItemAsync(LOCALE_STORAGE_KEY);
  });

  it("defaults to 'th' when no locale is stored in SecureStore", async () => {
    const view = await render(
      <LocaleProvider>
        <TestConsumer />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(view.getByTestId("current-locale")).toHaveTextContent("th");
    });
    expect(DEFAULT_LOCALE).toBe("th");
  });

  it("restores 'en' from SecureStore when persisted", async () => {
    await SecureStore.setItemAsync(LOCALE_STORAGE_KEY, "en");

    const view = await render(
      <LocaleProvider>
        <TestConsumer />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(view.getByTestId("current-locale")).toHaveTextContent("en");
    });
  });

  it("restores 'th' from SecureStore when persisted", async () => {
    await SecureStore.setItemAsync(LOCALE_STORAGE_KEY, "th");

    const view = await render(
      <LocaleProvider>
        <TestConsumer />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(view.getByTestId("current-locale")).toHaveTextContent("th");
    });
  });

  it("falls back to 'th' if SecureStore returns invalid value", async () => {
    await SecureStore.setItemAsync(LOCALE_STORAGE_KEY, "invalid-locale");

    const view = await render(
      <LocaleProvider>
        <TestConsumer />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(view.getByTestId("current-locale")).toHaveTextContent("th");
    });
  });

  it("gracefully defaults to 'th' if SecureStore.getItemAsync throws", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(
      new Error("SecureStore error")
    );

    const view = await render(
      <LocaleProvider>
        <TestConsumer />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(view.getByTestId("current-locale")).toHaveTextContent("th");
    });
  });

  it("setLocale updates the active locale and persists to SecureStore", async () => {
    const view = await render(
      <LocaleProvider>
        <TestConsumer />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(view.getByTestId("current-locale")).toHaveTextContent("th");
    });

    fireEvent.press(view.getByTestId("switch-to-en"));

    await waitFor(() => {
      expect(view.getByTestId("current-locale")).toHaveTextContent("en");
    });

    const stored = await SecureStore.getItemAsync(LOCALE_STORAGE_KEY);
    expect(stored).toBe("en");

    fireEvent.press(view.getByTestId("switch-to-th"));

    await waitFor(() => {
      expect(view.getByTestId("current-locale")).toHaveTextContent("th");
    });

    const storedAfter = await SecureStore.getItemAsync(LOCALE_STORAGE_KEY);
    expect(storedAfter).toBe("th");
  });

  it("setLocale still updates state even if SecureStore.setItemAsync throws", async () => {
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(
      new Error("Write error")
    );

    const view = await render(
      <LocaleProvider>
        <TestConsumer />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(view.getByTestId("current-locale")).toHaveTextContent("th");
    });

    fireEvent.press(view.getByTestId("switch-to-en"));

    await waitFor(() => {
      expect(view.getByTestId("current-locale")).toHaveTextContent("en");
    });
  });
});
