import { screen } from "@testing-library/react-native";

import { renderWithQueryClient } from "@/testing/queryTestUtils";
import { DisputeOutcome } from "../DisputeOutcome";

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en", setLocale: jest.fn() }),
}));
const mockCaseQuery = jest.fn();
jest.mock("../../api/questBoardQueries", () => ({
  useMyDisputeCaseQuery: (...args: unknown[]) => mockCaseQuery(...args),
}));

function resolvedCase(resolvedWorkerId: string) {
  return {
    data: {
      case: {
        id: "c-1",
        displayId: "DC-1",
        questId: "q-1",
        status: "DISPUTE_CASE_RESOLVED",
        createdAt: "2026-10-30T00:00:00Z",
        resolvedWorkerId,
        resolvedAmountSatang: 25050,
        resolvedAt: "2026-10-31T00:00:00Z",
      },
    },
  };
}

describe("DisputeOutcome", () => {
  beforeEach(() => mockCaseQuery.mockReset());

  it("tells the filing Worker they won and how much", async () => {
    mockCaseQuery.mockReturnValue(resolvedCase("worker-1"));
    await renderWithQueryClient(
      <DisputeOutcome
        questId="q-1"
        viewerId="worker-1"
        status="DISPUTE_CASE_RESOLVED"
      />
    );
    expect(
      screen.getByText("You won the case. ฿250.50 was added to your Earnings.")
    ).toBeTruthy();
    expect(mockCaseQuery).toHaveBeenCalledWith("q-1", "worker-1", true);
  });

  it("says when the amount went to another Worker", async () => {
    mockCaseQuery.mockReturnValue(resolvedCase("worker-2"));
    await renderWithQueryClient(
      <DisputeOutcome
        questId="q-1"
        viewerId="worker-1"
        status="DISPUTE_CASE_RESOLVED"
      />
    );
    expect(
      screen.getByText("Admin paid ฿250.50 to another Worker on this Quest.")
    ).toBeTruthy();
  });

  it("explains a dismissed case without reading the case again", async () => {
    mockCaseQuery.mockReturnValue({ data: undefined });
    await renderWithQueryClient(
      <DisputeOutcome
        questId="q-1"
        viewerId="worker-1"
        status="DISPUTE_CASE_DISMISSED"
      />
    );
    expect(
      screen.getByText("You did not win the case. No money was moved.")
    ).toBeTruthy();
    expect(mockCaseQuery).toHaveBeenCalledWith("q-1", "worker-1", false);
  });

  it("shows nothing while the case is pending", async () => {
    mockCaseQuery.mockReturnValue({ data: undefined });
    await renderWithQueryClient(
      <DisputeOutcome
        questId="q-1"
        viewerId="worker-1"
        status="DISPUTE_CASE_PENDING"
      />
    );
    expect(screen.queryByTestId("dispute-outcome")).toBeNull();
  });
});
