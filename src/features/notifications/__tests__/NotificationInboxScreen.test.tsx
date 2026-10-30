import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { notificationApi } from "@/api/NotificationApi";
import { renderWithQueryClient } from "@/testing/queryTestUtils";
import { NotificationInboxScreen } from "../inbox/NotificationInboxScreen";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    replace: jest.fn(),
    canGoBack: () => true,
  }),
}));
jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en", setLocale: jest.fn() }),
}));
jest.mock("@/api/NotificationApi", () => ({
  ...jest.requireActual("@/api/NotificationApi"),
  notificationApi: {
    listNotifications: jest.fn(),
    countUnread: jest.fn(),
    markRead: jest.fn(),
  },
}));

const api = jest.mocked(notificationApi);

const redFlag = {
  id: "n-1",
  type: "PENALTY_RED_FLAG_APPLIED",
  createdAt: "2026-10-30T10:00:00Z",
  readAt: null,
  questId: null,
  result: "RED_FLAG" as const,
  expiresAt: "2026-11-06T10:00:00Z",
};
const unknownType = {
  id: "n-2",
  type: "SOMETHING_NEW",
  createdAt: "2026-10-29T10:00:00Z",
  readAt: "2026-10-29T11:00:00Z",
  questId: null,
  result: null,
  expiresAt: null,
};

describe("NotificationInboxScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.markRead.mockResolvedValue(undefined);
  });

  it("shows app-written copy, a generic row for an unknown type, and marks a row read on tap", async () => {
    api.listNotifications.mockResolvedValue({
      items: [redFlag, unknownType],
      nextCursor: null,
    });

    await renderWithQueryClient(<NotificationInboxScreen />);

    expect(await screen.findByText("Red Flag on your account")).toBeTruthy();
    expect(screen.getByText("Account update")).toBeTruthy();
    expect(screen.getByTestId("notification-unread-n-1")).toBeTruthy();
    expect(screen.queryByTestId("notification-unread-n-2")).toBeNull();

    await fireEvent.press(screen.getByTestId("notification-row-n-1"));
    await waitFor(() =>
      expect(api.markRead).toHaveBeenCalledWith({ ids: ["n-1"] })
    );
    expect(mockPush).toHaveBeenCalledWith("/(tabs)/profile");

    await fireEvent.press(screen.getByTestId("notification-row-n-2"));
    expect(api.markRead).toHaveBeenCalledTimes(1);
  });

  it("marks all read and filters to unread rows", async () => {
    api.listNotifications.mockResolvedValue({
      items: [redFlag],
      nextCursor: null,
    });

    await renderWithQueryClient(<NotificationInboxScreen />);
    await fireEvent.press(
      await screen.findByTestId("notifications-mark-all-read")
    );
    await waitFor(() =>
      expect(api.markRead).toHaveBeenCalledWith({ all: true })
    );

    await fireEvent.press(screen.getByTestId("notifications-filter-unread"));
    await waitFor(() =>
      expect(api.listNotifications).toHaveBeenLastCalledWith(
        expect.objectContaining({ unreadOnly: true }),
        expect.anything()
      )
    );
  });

  it("loads the next page with nextCursor", async () => {
    api.listNotifications
      .mockResolvedValueOnce({ items: [redFlag], nextCursor: "c-2" })
      .mockResolvedValueOnce({ items: [unknownType], nextCursor: null });

    await renderWithQueryClient(<NotificationInboxScreen />);
    await fireEvent.press(await screen.findByTestId("notifications-load-more"));

    expect(await screen.findByText("Account update")).toBeTruthy();
    expect(api.listNotifications).toHaveBeenLastCalledWith(
      expect.objectContaining({ cursor: "c-2" }),
      expect.anything()
    );
  });
});
