import { render } from "@testing-library/react-native";

import { AppThemeProvider } from "@/features/workspace/AppThemeProvider";
import { PartialGroupStartConsentContent } from "@/features/questBoard/teamAssemble/components/PartialGroupStartConsentContent";
import { formatSatang } from "@/domain/satang";

const underfilled = {
  id: "underfilled-1",
  questId: "quest-1",
  questState: "QUEST_OPEN",
  state: "UNDERFILLED_DECISION_PENDING",
  activeWorkerCount: 1,
  headcount: 2,
  workerRewardPool: 180,
  questReward: 90,
  dueAt: "2026-10-02T12:00:00.000Z",
  cancellationReason: null,
  cancelledAt: null,
  decision: {
    status: "UNDERFILLED_DECISION_PENDING",
    value: null,
    expiresAt: "2999-10-02T04:10:00.000Z",
  },
  consent: {
    status: "UNDERFILLED_CONSENT_NOT_STARTED",
    expiresAt: null,
    totalCount: 0,
    acceptedCount: 0,
    declinedCount: 0,
    pendingCount: 0,
  },
  responses: [],
  ownResponse: null,
} as never;

function renderUnderfilledContent(originalRewardSatang: number | undefined) {
  return render(
    <AppThemeProvider>
      <PartialGroupStartConsentContent
        underfilled={underfilled}
        hirerId="hirer-1"
        viewerId="hirer-1"
        canDecide
        originalRewardSatang={originalRewardSatang}
        locale="en"
      />
    </AppThemeProvider>
  );
}
describe("hirer underfilled reward display", () => {
  it("shows published reward before revised reward when original reward exists", async () => {
    const view = await renderUnderfilledContent(12000);

    expect(
      view.getByText(
        `${formatSatang(12000, "en")} → ${formatSatang(9000, "en")}`
      )
    ).toBeTruthy();
  });

  it("shows revised reward only when published reward is null", async () => {
    const view = await renderUnderfilledContent(undefined);

    expect(view.getByText(formatSatang(9000, "en"))).toBeTruthy();
    expect(view.queryByText(/฿120/)).toBeNull();
  });
});
