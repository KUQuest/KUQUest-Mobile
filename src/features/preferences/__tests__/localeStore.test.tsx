import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Button, Text, View } from "react-native";
import * as SecureStore from "expo-secure-store";

import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY } from "@/locales/locale";
import { useLocale, useLocaleStore } from "@/features/preferences/localeStore";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

function TestConsumer() {
  const { locale, setLocale } = useLocale();
  return (
    <View>
      <Text testID="current-locale">{locale}</Text>
      <Button title="English" onPress={() => void setLocale("en")} />
      <Button title="Thai" onPress={() => void setLocale("th")} />
    </View>
  );
}

describe("localeStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLocaleStore.setState({ locale: DEFAULT_LOCALE });
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
  });

  it("defaults to 'th' when no locale is stored in SecureStore", async () => {
    const view = await render(<TestConsumer />);
    expect(view.getByTestId("current-locale").props.children).toBe("th");
  });

  it("restores 'en' from SecureStore when persisted", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("en");
    const view = await render(<TestConsumer />);
    await useLocaleStore.getState().hydrateLocale();
    await waitFor(() =>
      expect(view.getByTestId("current-locale").props.children).toBe("en")
    );
  });

  it("restores 'th' from SecureStore when persisted", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("th");
    const view = await render(<TestConsumer />);
    await useLocaleStore.getState().hydrateLocale();
    await waitFor(() =>
      expect(view.getByTestId("current-locale").props.children).toBe("th")
    );
  });

  it("falls back to 'th' if SecureStore returns invalid value", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("fr");
    const view = await render(<TestConsumer />);
    await useLocaleStore.getState().hydrateLocale();
    expect(view.getByTestId("current-locale").props.children).toBe("th");
  });

  it("gracefully defaults to 'th' if SecureStore.getItemAsync throws", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(
      new Error("fail")
    );
    const view = await render(<TestConsumer />);
    await useLocaleStore.getState().hydrateLocale();
    expect(view.getByTestId("current-locale").props.children).toBe("th");
  });

  it("setLocale updates the active locale and persists to SecureStore", async () => {
    const view = await render(<TestConsumer />);
    fireEvent.press(view.getByText("English"));
    await waitFor(() =>
      expect(view.getByTestId("current-locale").props.children).toBe("en")
    );
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      LOCALE_STORAGE_KEY,
      "en"
    );
  });

  it("setLocale still updates state even if SecureStore.setItemAsync throws", async () => {
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(
      new Error("fail")
    );
    const view = await render(<TestConsumer />);
    fireEvent.press(view.getByText("English"));
    await waitFor(() =>
      expect(view.getByTestId("current-locale").props.children).toBe("en")
    );
  });
});
