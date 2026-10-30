import { fireEvent } from "@testing-library/react-native";

import type { QuestV2DisputeTeamSplit } from "@/api/questV2Contracts";
import { questWorkMessages } from "@/locales/questWorkMessages";
import { renderWithQueryClient } from "@/testing/queryTestUtils";
import TeamDisputeSplitCard from "../components/TeamDisputeSplitCard";

const mockConfirm = jest.fn();
jest.mock("@/components/ui/SweetAlert", () => ({
  showConfirmModal: (options: { onConfirm: () => void }) =>
    mockConfirm(options),
}));
jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));

const leaderId = "11111111-1111-4111-8111-111111111111";
const memberId = "22222222-2222-4222-8222-222222222222";

function split(
  overrides: Partial<QuestV2DisputeTeamSplit> = {}
): QuestV2DisputeTeamSplit {
  return {
    disputeCaseId: "33333333-3333-4333-8333-333333333333",
    status: "AWAITING_SPLIT",
    splitSource: null,
    approvedAmountSatang: 10_000,
    deadlineAt: "2099-08-27T12:00:00.000Z",
    confirmedAt: null,
    paidAt: null,
    paymentPending: false,
    viewerIsLeader: false,
    canSubmitSplit: false,
    members: [
      {
        memberId: leaderId,
        displayName: "Aphinya",
        isLeader: true,
        percentageBasisPoints: null,
        amountSatang: null,
        paidAt: null,
      },
      {
        memberId,
        displayName: "Nichakan",
        isLeader: false,
        percentageBasisPoints: null,
        amountSatang: null,
        paidAt: null,
      },
    ],
    ...overrides,
  };
}

const render = (value: QuestV2DisputeTeamSplit, onSubmit = jest.fn()) =>
  renderWithQueryClient(
    <TeamDisputeSplitCard
      split={value}
      messages={questWorkMessages.en}
      submitting={false}
      onSubmit={onSubmit}
    />
  );

describe("Team Dispute split", () => {
  beforeEach(() => mockConfirm.mockReset());

  it("sends every member's share, with the remainder to the Team Leader", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const view = await render(
      split({ viewerIsLeader: true, canSubmitSplit: true }),
      onSubmit
    );
    expect(view.getByText("Split the Dispute amount")).toBeTruthy();

    await fireEvent.changeText(view.getByLabelText("Nichakan Share (%)"), "25");
    await fireEvent.press(
      view.getByRole("button", { name: "Submit split and pay the team" })
    );
    mockConfirm.mock.calls[0][0].onConfirm();

    expect(onSubmit).toHaveBeenCalledWith([
      { memberId, percentageBasisPoints: 2_500 },
      { memberId: leaderId, percentageBasisPoints: 7_500 },
    ]);
  });

  it("shows a Team Member who must split and offers no editor", async () => {
    const view = await render(split());
    expect(view.getByText(/Waiting for the Team Leader/)).toBeTruthy();
    expect(
      view.queryByRole("button", { name: "Submit split and pay the team" })
    ).toBeNull();
  });

  it("shows each member's paid share", async () => {
    const paid = split();
    const view = await render({
      ...paid,
      status: "PAID",
      splitSource: "LEADER",
      paidAt: "2099-08-27T12:00:00.000Z",
      members: paid.members.map((member) => ({
        ...member,
        percentageBasisPoints: member.isLeader ? 7_500 : 2_500,
        amountSatang: member.isLeader ? 7_500 : 2_500,
      })),
    });
    expect(
      view.getByText("Paid to each member's Earnings Balance.")
    ).toBeTruthy();
    expect(view.getByText("Nichakan: 25.00% · ฿25.00")).toBeTruthy();
    expect(view.getByText("Aphinya: 75.00% · ฿75.00")).toBeTruthy();
  });
});
