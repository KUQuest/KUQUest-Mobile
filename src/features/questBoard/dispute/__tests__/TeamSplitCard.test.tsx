import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { ApiError } from "@/api/ApiClient";
import { disputeApi, type TeamSplit } from "@/api/DisputeApi";
import { renderWithQueryClient } from "@/testing/queryTestUtils";
import { TeamSplitCard } from "../TeamSplitCard";

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en", setLocale: jest.fn() }),
}));
jest.mock("@/api/DisputeApi", () => ({
  ...jest.requireActual("@/api/DisputeApi"),
  disputeApi: { submitTeamSplit: jest.fn() },
}));
jest.mock("@/features/questBoard/api/questBoardQueries", () => ({
  invalidateQuestReads: jest.fn().mockResolvedValue(undefined),
}));
const mockShowSweetAlert = jest.fn();
jest.mock("@/components/ui/SweetAlert", () => ({
  SweetAlertVariant: { Success: "success", Error: "error" },
  showConfirmModal: ({ onConfirm }: { onConfirm: () => void }) => onConfirm(),
  showSweetAlert: (alert: unknown) => mockShowSweetAlert(alert),
}));

const submitTeamSplit = jest.mocked(disputeApi.submitTeamSplit);

function split(overrides: Partial<TeamSplit> = {}): TeamSplit {
  return {
    disputeCaseId: "case-1",
    status: "AWAITING_SPLIT",
    splitSource: null,
    approvedAmountSatang: 12345,
    deadlineAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    confirmedAt: null,
    paidAt: null,
    paymentPending: false,
    viewerIsLeader: true,
    canSubmitSplit: true,
    members: [
      {
        memberId: "leader",
        displayName: "Lead",
        isLeader: true,
        percentageBasisPoints: null,
        amountSatang: null,
        paidAt: null,
      },
      {
        memberId: "member",
        displayName: "Mem",
        isLeader: false,
        percentageBasisPoints: null,
        amountSatang: null,
        paidAt: null,
      },
    ],
    ...overrides,
  };
}

describe("TeamSplitCard", () => {
  beforeEach(() => jest.clearAllMocks());

  it("blocks a total other than 100% and submits basis points", async () => {
    submitTeamSplit.mockResolvedValue(split({ status: "SPLIT_CONFIRMED" }));
    await renderWithQueryClient(
      <TeamSplitCard questId="q-1" viewerId="leader" split={split()} />
    );

    expect(
      screen.getByText("Admin approved ฿123.45 for the team.")
    ).toBeTruthy();
    await fireEvent.changeText(
      screen.getByTestId("team-split-percent-leader"),
      "60"
    );
    await fireEvent.changeText(
      screen.getByTestId("team-split-percent-member"),
      "30"
    );
    await fireEvent.press(screen.getByTestId("team-split-submit"));
    expect(screen.getByText("The total must be exactly 100%.")).toBeTruthy();
    expect(submitTeamSplit).not.toHaveBeenCalled();

    await fireEvent.changeText(
      screen.getByTestId("team-split-percent-member"),
      "40"
    );
    await fireEvent.press(screen.getByTestId("team-split-submit"));
    await waitFor(() =>
      expect(submitTeamSplit).toHaveBeenCalledWith(
        "q-1",
        [
          { memberId: "leader", percentageBasisPoints: 6000 },
          { memberId: "member", percentageBasisPoints: 4000 },
        ],
        expect.stringMatching(/^team-split-/)
      )
    );
  });

  it("reuses the Idempotency-Key when retrying the same shares after a 503", async () => {
    submitTeamSplit
      .mockRejectedValueOnce(new ApiError(503, "HTTP_503", "busy"))
      .mockResolvedValueOnce(split({ status: "SPLIT_CONFIRMED" }));
    await renderWithQueryClient(
      <TeamSplitCard questId="q-1" viewerId="leader" split={split()} />
    );

    await fireEvent.press(screen.getByTestId("team-split-equal"));
    await fireEvent.press(screen.getByTestId("team-split-submit"));
    await waitFor(() => expect(submitTeamSplit).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(mockShowSweetAlert).toHaveBeenCalledWith(
        expect.objectContaining({ message: "The service is busy. Try again." })
      )
    );
    await fireEvent.press(screen.getByTestId("team-split-submit"));
    await waitFor(() => expect(submitTeamSplit).toHaveBeenCalledTimes(2));

    const [first, second] = submitTeamSplit.mock.calls;
    expect(second[2]).toBe(first[2]);
  });

  it("shows a Team member the waiting state without a form", async () => {
    await renderWithQueryClient(
      <TeamSplitCard
        questId="q-1"
        viewerId="member"
        split={split({ viewerIsLeader: false, canSubmitSplit: false })}
      />
    );
    expect(
      screen.getByText("Waiting for the Team Leader to split.")
    ).toBeTruthy();
    expect(screen.queryByTestId("team-split-form")).toBeNull();
  });

  it("shows a paid Member only their own server amount and the auto split note", async () => {
    await renderWithQueryClient(
      <TeamSplitCard
        questId="q-1"
        viewerId="member"
        split={split({
          status: "PAID",
          splitSource: "AUTO_EQUAL",
          viewerIsLeader: false,
          canSubmitSplit: false,
          members: [
            {
              memberId: "leader",
              displayName: "Lead",
              isLeader: true,
              percentageBasisPoints: 5000,
              amountSatang: 6173,
              paidAt: "2026-10-31T03:00:00Z",
            },
            {
              memberId: "member",
              displayName: "Mem",
              isLeader: false,
              percentageBasisPoints: 5000,
              amountSatang: 6172,
              paidAt: "2026-10-31T03:00:00Z",
            },
          ],
        })}
      />
    );
    expect(screen.getByTestId("team-split-auto-equal")).toBeTruthy();
    expect(screen.getByText("฿61.72")).toBeTruthy();
    expect(screen.queryByTestId("team-split-member-leader")).toBeNull();
  });

  it("says payment is being processed while paymentPending", async () => {
    await renderWithQueryClient(
      <TeamSplitCard
        questId="q-1"
        viewerId="leader"
        split={split({
          status: "SPLIT_CONFIRMED",
          splitSource: "LEADER",
          canSubmitSplit: false,
          paymentPending: true,
        })}
      />
    );
    expect(screen.getByTestId("team-split-payment-pending")).toBeTruthy();
  });
});
