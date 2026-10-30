import { screen } from "@testing-library/react-native";

import { notificationApi } from "@/api/NotificationApi";
import { renderWithQueryClient } from "@/testing/queryTestUtils";
import { ProfileTopBar } from "../components/ProfileTopBar";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en", setLocale: jest.fn() }),
}));
jest.mock("@/api/NotificationApi", () => ({
  ...jest.requireActual("@/api/NotificationApi"),
  notificationApi: { countUnread: jest.fn() },
}));

const countUnread = jest.mocked(notificationApi.countUnread);

describe("ProfileTopBar notification badge", () => {
  it("shows no badge without unread notifications", async () => {
    countUnread.mockResolvedValue(0);
    await renderWithQueryClient(<ProfileTopBar />);
    expect(await screen.findByLabelText("Notifications")).toBeTruthy();
    expect(screen.queryByTestId("notifications-unread-badge")).toBeNull();
  });

  it("shows the exact count up to nine", async () => {
    countUnread.mockResolvedValue(3);
    await renderWithQueryClient(<ProfileTopBar />);
    expect(
      await screen.findByText("3", { includeHiddenElements: true })
    ).toBeTruthy();
    expect(screen.getByLabelText("Notifications, 3 unread")).toBeTruthy();
  });

  it("caps the badge at 9+ while the label keeps the exact count", async () => {
    countUnread.mockResolvedValue(42);
    await renderWithQueryClient(<ProfileTopBar />);
    expect(
      await screen.findByText("9+", { includeHiddenElements: true })
    ).toBeTruthy();
    expect(screen.getByLabelText("Notifications, 42 unread")).toBeTruthy();
  });
});
