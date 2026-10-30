import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";

import { profileMessages } from "@/locales/profileMessages";
import { renderWithQueryClient } from "@/testing/queryTestUtils";

import { ProfilePenaltyStatus } from "../components/ProfilePenaltyStatus";

const mockGetPenaltyStatus = jest.fn();
let mockRegainFocus: () => void = () => undefined;

jest.mock("expo-router", () => ({
  useFocusEffect: (effect: () => void) => {
    mockRegainFocus = effect;
  },
}));

jest.mock("../../auth/AuthService", () => ({
  authService: {
    getStudentApi: () =>
      Promise.resolve({ getPenaltyStatus: mockGetPenaltyStatus }),
  },
}));

jest.mock("../../../features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));

const messages = profileMessages.en;
const cleanStatus = {
  misconduct: {
    strikeCount: 0,
    ladderLength: 3,
    nextResult: "PENALTY_RED_FLAG",
  },
  review: {
    strikeCount: 0,
    ladderLength: 3,
    nextResult: "PENALTY_TEMPORARY_BAN_7_DAYS",
  },
  redFlagExpiresAt: null,
};
const redFlagged = {
  ...cleanStatus,
  redFlagExpiresAt: "2026-11-06T00:00:00.000Z",
};
const FRESHNESS_WINDOW_MS = 30_000;

async function regainFocusAfter(elapsedMs: number) {
  const now = Date.now();
  jest.spyOn(Date, "now").mockReturnValue(now + elapsedMs);
  await act(async () => {
    mockRegainFocus();
  });
}

describe("ProfilePenaltyStatus", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mockGetPenaltyStatus.mockReset();
  });

  it("stays hidden for a Member with no penalty", async () => {
    mockGetPenaltyStatus.mockResolvedValue(cleanStatus);
    await renderWithQueryClient(<ProfilePenaltyStatus />);

    await waitFor(() => expect(mockGetPenaltyStatus).toHaveBeenCalled());
    expect(screen.queryByTestId("profile-penalty-status")).toBeNull();
  });

  it("shows the strikes, the next result, and the Red Flag expiry", async () => {
    mockGetPenaltyStatus.mockResolvedValue({
      ...cleanStatus,
      misconduct: {
        strikeCount: 1,
        ladderLength: 3,
        nextResult: "PENALTY_TEMPORARY_BAN_7_DAYS",
      },
      redFlagExpiresAt: "2026-11-06T00:00:00.000Z",
    });
    await renderWithQueryClient(<ProfilePenaltyStatus />);

    expect(await screen.findByText("1 of 3 strikes")).toBeTruthy();
    expect(screen.getByText("Next strike: 7-day ban")).toBeTruthy();
    expect(screen.getByText(/^Red Flag until .*2026/)).toBeTruthy();
    expect(screen.getByText(messages.penaltyMisconductLadder)).toBeTruthy();
    expect(screen.queryByText(messages.penaltyReviewLadder)).toBeNull();
  });

  it("warns a Member one strike from a Permanent ban after the ban ended", async () => {
    mockGetPenaltyStatus.mockResolvedValue({
      ...cleanStatus,
      misconduct: {
        strikeCount: 2,
        ladderLength: 3,
        nextResult: "PENALTY_PERMANENT_BAN",
      },
    });
    await renderWithQueryClient(<ProfilePenaltyStatus />);

    expect(await screen.findByText("2 of 3 strikes")).toBeTruthy();
    expect(screen.getByText("Next strike: Permanent ban")).toBeTruthy();
    expect(screen.queryByText(/^Red Flag until/)).toBeNull();
  });

  it("shows a Red Flag that has no strike", async () => {
    mockGetPenaltyStatus.mockResolvedValue({
      ...cleanStatus,
      redFlagExpiresAt: "2026-11-06T00:00:00.000Z",
    });
    await renderWithQueryClient(<ProfilePenaltyStatus />);

    expect(await screen.findByText(/^Red Flag until/)).toBeTruthy();
    expect(screen.queryByText(messages.penaltyMisconductLadder)).toBeNull();
  });

  it("offers a retry that recovers when the status cannot load", async () => {
    mockGetPenaltyStatus.mockRejectedValueOnce(new Error("offline"));
    await renderWithQueryClient(<ProfilePenaltyStatus />);

    const unavailable = await screen.findByText(
      messages.penaltyStatusUnavailable
    );
    expect(unavailable).toBeTruthy();
    expect(screen.queryByTestId("profile-penalty-status")).toBeNull();

    mockGetPenaltyStatus.mockResolvedValue(redFlagged);
    fireEvent.press(screen.getByRole("button", { name: messages.retry }));

    expect(await screen.findByText(/^Red Flag until/)).toBeTruthy();
    expect(screen.queryByText(messages.penaltyStatusUnavailable)).toBeNull();
  });

  it("recovers from a failed load when the Profile regains focus", async () => {
    mockGetPenaltyStatus.mockRejectedValueOnce(new Error("offline"));
    await renderWithQueryClient(<ProfilePenaltyStatus />);
    await screen.findByText(messages.penaltyStatusUnavailable);

    mockGetPenaltyStatus.mockResolvedValue(redFlagged);
    await regainFocusAfter(0);

    expect(await screen.findByText(/^Red Flag until/)).toBeTruthy();
  });

  it("shows a Red Flag issued after the last load when the Profile regains focus", async () => {
    mockGetPenaltyStatus.mockResolvedValueOnce(cleanStatus);
    await renderWithQueryClient(<ProfilePenaltyStatus />);
    await waitFor(() => expect(mockGetPenaltyStatus).toHaveBeenCalledTimes(1));

    mockGetPenaltyStatus.mockResolvedValue(redFlagged);
    await regainFocusAfter(FRESHNESS_WINDOW_MS + 1);

    expect(await screen.findByText(/^Red Flag until/)).toBeTruthy();
  });

  it("does not reload a status still inside the freshness window", async () => {
    mockGetPenaltyStatus.mockResolvedValue(redFlagged);
    await renderWithQueryClient(<ProfilePenaltyStatus />);
    await screen.findByText(/^Red Flag until/);

    // Margin: real time already passed since the load finished.
    await regainFocusAfter(FRESHNESS_WINDOW_MS - 5_000);

    expect(mockGetPenaltyStatus).toHaveBeenCalledTimes(1);
  });

  it("keeps a known Red Flag visible when a later refresh fails", async () => {
    mockGetPenaltyStatus.mockResolvedValueOnce(redFlagged);
    await renderWithQueryClient(<ProfilePenaltyStatus />);
    await screen.findByText(/^Red Flag until/);

    mockGetPenaltyStatus.mockRejectedValue(new Error("offline"));
    await regainFocusAfter(FRESHNESS_WINDOW_MS + 1);

    await waitFor(() => expect(mockGetPenaltyStatus).toHaveBeenCalledTimes(2));
    expect(screen.getByText(/^Red Flag until/)).toBeTruthy();
    expect(screen.queryByText(messages.penaltyStatusUnavailable)).toBeNull();
  });
});
