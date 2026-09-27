import React from "react";
import { AccessibilityInfo } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";

import { NotificationBannerHost } from "../NotificationBannerHost";
import type { ForegroundNotice } from "../useNotificationCoordinator";

const mockIsScreenReaderEnabled = jest.fn<Promise<boolean>, []>();
const mockAddAccessibilityListener = jest.fn();
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 20, right: 0, bottom: 0, left: 0 }),
}));
jest.mock("@/features/workspace/AppThemeProvider", () => ({
  useAppTheme: () => ({ colors: { textSecondary: "#444444" } }),
}));
jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));

const notice: ForegroundNotice = {
  id: 1,
  title: "New message",
  message: "Campus cleanup",
  href: { pathname: "/chat/[id]", params: { id: "conversation-1" } },
};

jest
  .spyOn(AccessibilityInfo, "isScreenReaderEnabled")
  .mockImplementation(() => mockIsScreenReaderEnabled());
jest
  .spyOn(AccessibilityInfo, "addEventListener")
  .mockImplementation((...args) => mockAddAccessibilityListener(...args));
beforeEach(() => {
  jest.useFakeTimers();
  mockAddAccessibilityListener.mockReturnValue({ remove: jest.fn() });
});
afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.clearAllMocks();
});

async function renderBanner(screenReaderEnabled: boolean, dismiss = jest.fn()) {
  mockIsScreenReaderEnabled.mockResolvedValue(screenReaderEnabled);
  const view = await render(
    <NotificationBannerHost
      notices={[notice]}
      dismiss={dismiss}
      open={jest.fn()}
    />
  );
  await act(async () => {
    await Promise.resolve();
  });
  return { view, dismiss };
}

describe("NotificationBannerHost", () => {
  it("auto-dismisses after 4 seconds when screen reader is off", async () => {
    const { dismiss } = await renderBanner(false);

    await act(async () => {
      jest.advanceTimersByTime(3_999);
    });
    expect(dismiss).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it("keeps banner visible for screen-reader users until dismissed", async () => {
    const { view, dismiss } = await renderBanner(true);

    await act(async () => {
      jest.advanceTimersByTime(4_000);
    });
    expect(dismiss).not.toHaveBeenCalled();
    await fireEvent.press(view.getByTestId("notification-banner-dismiss"));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });
});
