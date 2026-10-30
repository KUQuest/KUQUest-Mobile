import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithQueryClient } from "@/testing/queryTestUtils";
import { walletApi } from "@/api/WalletApi";
import { walletMessages } from "@/locales/walletMessages";
import { PayoutStatusSection } from "../PayoutStatusSection";

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "th" }),
}));
jest.mock("@/api/WalletApi", () => {
  const original = jest.requireActual("@/api/WalletApi");
  return {
    ...original,
    walletApi: {
      getPayout: jest.fn(),
      listPayoutStatusHistory: jest.fn(),
    },
  };
});

const m = walletMessages.th;

const pendingPayout = {
  id: "payout-1",
  status: "PENDING_ADMIN_APPROVAL",
  payoutStatus: "PENDING_ADMIN_APPROVAL",
  receiptSatang: 10_000,
  maximumFeeSatang: 1_500,
  maximumTaxSatang: 45,
  maximumDebitSatang: 11_545,
  actualFeeSatang: null,
  actualTaxSatang: null,
  actualDebitSatang: null,
  createdAt: "2026-05-01T03:00:00Z",
};

describe("PayoutStatusSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the Admin approval state, maximum amounts, and status history", async () => {
    (walletApi.getPayout as jest.Mock).mockResolvedValue(pendingPayout);
    (walletApi.listPayoutStatusHistory as jest.Mock).mockResolvedValue([
      {
        id: "h-1",
        fromStatus: null,
        toStatus: "PENDING_ADMIN_APPROVAL",
        reason: null,
        occurredAt: "2026-05-01T03:00:00Z",
      },
      {
        id: "h-2",
        fromStatus: "PENDING_ADMIN_APPROVAL",
        toStatus: "CANCELLED",
        reason: "Bank details mismatch",
        occurredAt: "2026-05-01T04:00:00Z",
      },
    ]);
    const view = await renderWithQueryClient(
      <PayoutStatusSection messages={m} payoutId="payout-1" />
    );

    await waitFor(() =>
      expect(view.getByTestId("payout-status-label")).toHaveTextContent(
        m.payoutStatusLabels.PENDING_ADMIN_APPROVAL
      )
    );
    expect(view.getByText(m.payoutFeesMaximumNote)).toBeTruthy();
    expect(view.getByText("฿115.45")).toBeTruthy();
    await waitFor(() =>
      expect(view.getByTestId("payout-history-h-2")).toBeTruthy()
    );
    expect(view.getByText(m.payoutStatusLabels.CANCELLED)).toBeTruthy();
    expect(
      view.getByText(m.payoutHistoryReason("Bank details mismatch"))
    ).toBeTruthy();
    expect(walletApi.getPayout).toHaveBeenCalledWith(
      "payout-1",
      expect.anything()
    );
  });

  it("shows settled amounts without the maximum note once the Payout succeeded", async () => {
    (walletApi.getPayout as jest.Mock).mockResolvedValue({
      ...pendingPayout,
      status: "SUCCEEDED",
      payoutStatus: "SUCCEEDED",
      actualFeeSatang: 1_000,
      actualTaxSatang: 30,
      actualDebitSatang: 11_030,
    });
    (walletApi.listPayoutStatusHistory as jest.Mock).mockResolvedValue([]);
    const view = await renderWithQueryClient(
      <PayoutStatusSection messages={m} payoutId="payout-1" />
    );

    await waitFor(() =>
      expect(view.getByTestId("payout-status-label")).toHaveTextContent(
        m.payoutStatusLabels.SUCCEEDED
      )
    );
    expect(view.getByText("฿110.30")).toBeTruthy();
    expect(view.queryByText(m.payoutFeesMaximumNote)).toBeNull();
    await waitFor(() =>
      expect(view.getByTestId("payout-history-empty")).toBeTruthy()
    );
  });

  it("shows an error with retry when the Payout cannot be loaded", async () => {
    (walletApi.getPayout as jest.Mock)
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(pendingPayout);
    (walletApi.listPayoutStatusHistory as jest.Mock).mockResolvedValue([]);
    const view = await renderWithQueryClient(
      <PayoutStatusSection messages={m} payoutId="payout-1" />
    );

    await waitFor(() =>
      expect(view.getByTestId("payout-status-error")).toBeTruthy()
    );
    await fireEvent.press(view.getByTestId("payout-status-retry"));
    await waitFor(() =>
      expect(view.getByTestId("payout-status-section")).toBeTruthy()
    );
  });
});
