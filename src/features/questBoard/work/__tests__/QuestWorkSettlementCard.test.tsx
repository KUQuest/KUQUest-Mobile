import { renderWithQueryClient } from "@/testing/queryTestUtils";
import QuestWorkSettlementCard from "../components/QuestWorkSettlementCard";
import type { LiveQuestSnapshot } from "../../live/liveQuestTypes";

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));

function snapshot(
  settlement: unknown,
  assignmentState = "ASSIGNMENT_COMPLETED"
) {
  return {
    state: "QUEST_COMPLETED",
    assignment: { state: assignmentState },
    quest: { workerSettlement: settlement },
  } as LiveQuestSnapshot;
}

describe("Worker settlement", () => {
  it("shows the server's credited amount, including an underfilled allocation", async () => {
    const view = await renderWithQueryClient(
      <QuestWorkSettlementCard
        snapshot={snapshot({
          status: "PAID",
          amountSatang: 147059,
          settledAt: "2026-10-02T00:00:00Z",
        })}
      />
    );
    expect(view.getByText("฿1,470.59")).toBeTruthy();
    expect(view.getByText("Paid to your Earnings Balance")).toBeTruthy();
  });
  it("does not claim completed work has been paid while transfer is pending", async () => {
    const view = await renderWithQueryClient(
      <QuestWorkSettlementCard
        snapshot={snapshot({
          status: "PENDING",
          amountSatang: null,
          settledAt: null,
        })}
      />
    );
    expect(
      view.getByText("Payment pending. Refresh to check the transfer.")
    ).toBeTruthy();
    expect(view.queryByTestId("work-settlement-amount")).toBeNull();
  });
  it("shows zero for a Team Member or Assignment with no payment", async () => {
    const view = await renderWithQueryClient(
      <QuestWorkSettlementCard
        snapshot={snapshot({
          status: "NO_PAYMENT",
          amountSatang: 0,
          settledAt: null,
        })}
      />
    );
    expect(view.getByText("฿0.00")).toBeTruthy();
    expect(view.getByText("No payment for this Assignment.")).toBeTruthy();
  });
  it("keeps an older API response unavailable instead of assuming payment", async () => {
    const view = await renderWithQueryClient(
      <QuestWorkSettlementCard snapshot={snapshot(undefined)} />
    );
    expect(
      view.getByText("Settlement details are not available yet.")
    ).toBeTruthy();
    expect(view.queryByTestId("work-settlement-amount")).toBeNull();
  });
});
