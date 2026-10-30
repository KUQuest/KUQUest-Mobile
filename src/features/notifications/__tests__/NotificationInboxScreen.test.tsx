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

const todayRow = {
  ...unknownType,
  id: "n-3",
  createdAt: "2026-10-31T02:00:00Z",
  readAt: "2026-10-31T03:00:00Z",
};

describe("NotificationInboxScreen", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    api.markRead.mockResolvedValue(undefined);
    api.countUnread.mockResolvedValue(0);
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

  it("offers Mark all read when unread rows sit on pages not loaded yet", async () => {
    api.countUnread.mockResolvedValue(3);
    api.listNotifications.mockResolvedValue({
      items: [unknownType],
      nextCursor: "c-2",
    });

    await renderWithQueryClient(<NotificationInboxScreen />);

    expect(
      await screen.findByTestId("notifications-mark-all-read")
    ).toBeTruthy();
  });

  it("explains a load failure without repeating the title", async () => {
    api.listNotifications.mockRejectedValue(new Error("offline"));

    await renderWithQueryClient(<NotificationInboxScreen />);

    expect(
      await screen.findByText("Check your connection and try again.")
    ).toBeTruthy();
    expect(screen.getAllByText("Unable to load notifications.")).toHaveLength(
      1
    );
  });

  it("groups rows under Today and Yesterday section headers", async () => {
    jest.useFakeTimers({
      now: new Date("2026-10-31T05:00:00Z"),
      advanceTimers: true,
    });
    api.listNotifications.mockResolvedValue({
      items: [todayRow, redFlag, unknownType],
      nextCursor: null,
    });

    await renderWithQueryClient(<NotificationInboxScreen />);

    expect(await screen.findByText("Today")).toBeTruthy();
    expect(screen.getByText("Yesterday")).toBeTruthy();
    expect(screen.getByText("29 Oct 2026")).toBeTruthy();
  });

  it("shows the unread count on the Unread chip", async () => {
    api.countUnread.mockResolvedValue(3);
    api.listNotifications.mockResolvedValue({
      items: [redFlag],
      nextCursor: null,
    });

    await renderWithQueryClient(<NotificationInboxScreen />);

    expect(await screen.findByText("Unread · 3")).toBeTruthy();
    expect(
      screen.getByTestId("notifications-filter-unread").props.accessibilityState
    ).toEqual({ selected: false });
  });

  it("hides the count on the Unread chip when nothing is unread", async () => {
    api.listNotifications.mockResolvedValue({
      items: [unknownType],
      nextCursor: null,
    });

    await renderWithQueryClient(<NotificationInboxScreen />);

    expect(await screen.findByText("Unread")).toBeTruthy();
    expect(screen.queryByText(/Unread ·/)).toBeNull();
  });

  it("marks only rows that open the profile with a chevron and hint", async () => {
    api.listNotifications.mockResolvedValue({
      items: [redFlag, unknownType],
      nextCursor: null,
    });

    await renderWithQueryClient(<NotificationInboxScreen />);
    await screen.findByText("Account update");

    expect(screen.getByTestId("notification-chevron-n-1")).toBeTruthy();
    expect(screen.queryByTestId("notification-chevron-n-2")).toBeNull();
    expect(
      screen.getByTestId("notification-row-n-1").props.accessibilityHint
    ).toBe("Unread. Opens your profile");
    expect(
      screen.getByTestId("notification-row-n-2").props.accessibilityHint
    ).toBeUndefined();
  });

  it("tells an Unread-only Member they are all caught up", async () => {
    api.listNotifications.mockResolvedValue({ items: [], nextCursor: null });

    await renderWithQueryClient(<NotificationInboxScreen />);
    expect(await screen.findByText("No notifications yet")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("notifications-filter-unread"));
    expect(await screen.findByText("You're all caught up")).toBeTruthy();
  });
});
