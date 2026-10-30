import { screen, waitFor } from "@testing-library/react-native";

import { profileMessages } from "@/locales/profileMessages";
import { renderWithQueryClient } from "@/testing/queryTestUtils";

import { ProfilePenaltyStatus } from "../components/ProfilePenaltyStatus";

const mockGetPenaltyStatus = jest.fn();

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

describe("ProfilePenaltyStatus", () => {
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

  it("stays hidden when the status cannot load", async () => {
    mockGetPenaltyStatus.mockRejectedValue(new Error("not deployed"));
    await renderWithQueryClient(<ProfilePenaltyStatus />);

    await waitFor(() => expect(mockGetPenaltyStatus).toHaveBeenCalled());
    expect(screen.queryByTestId("profile-penalty-status")).toBeNull();
  });
});
