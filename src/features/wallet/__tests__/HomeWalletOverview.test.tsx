import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { HomeWalletOverview } from "../HomeWalletOverview";
import { walletApi } from "@/api/WalletApi";

jest.mock("@/api/WalletApi", () => {
  const original = jest.requireActual("@/api/WalletApi");
  return {
    ...original,
    walletApi: {
      getWallet: jest.fn(),
      quoteTopUp: jest.fn(),
      createTopUp: jest.fn(),
      getTopUpStatus: jest.fn(),
      simulateTopUp: jest.fn(),
      convertEarnings: jest.fn(),
      getTransactionHistory: jest.fn(),
    },
  };
});

describe("HomeWalletOverview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (walletApi.getWallet as jest.Mock).mockResolvedValue({
      spendingBalanceSatang: 125000,
      earningsBalanceSatang: 45000,
      fundingReservedSatang: 15000,
      reservedForPayoutsSatang: 5000,
    });
    (walletApi.getTransactionHistory as jest.Mock).mockResolvedValue({
      items: [
        {
          id: "tx-1",
          type: "TOP_UP",
          title: "PromptPay Top-Up",
          titleTh: "เติมเงินผ่านพร้อมเพย์",
          amountSatang: 50000,
          direction: "INFLOW",
          status: "COMPLETED",
          createdAt: "2026-09-14T10:00:00Z",
        },
      ],
    });
  });

  it("renders wallet balances properly", async () => {
    const view = await render(<HomeWalletOverview locale="en" />);

    await waitFor(() => {
      expect(view.getByTestId("wallet-spending-balance")).toBeTruthy();
    });

    expect(view.getByText("฿1,250.00")).toBeTruthy();
    expect(view.getByText("฿450.00")).toBeTruthy();
    expect(view.getByText("฿150.00")).toBeTruthy();
    expect(view.getByText("฿50.00")).toBeTruthy();
  });

  it("quotes server totals before confirmation and creates PromptPay only after confirm", async () => {
    (walletApi.quoteTopUp as jest.Mock).mockResolvedValueOnce({
      id: "quote-1",
      creditSatang: 50000,
      chargedFeeSatang: 400,
      chargedTaxSatang: 28,
      paymentTotalSatang: 50428,
      expiresAt: "2026-09-15T12:00:00Z",
    });
    (walletApi.createTopUp as jest.Mock).mockResolvedValueOnce({
      id: "topup-1",
      creditSatang: 50000,
      chargedFeeSatang: 400,
      chargedTaxSatang: 28,
      paymentTotalSatang: 50428,
      qrDataUrl: "data:image/png;base64,mock-qr",
      topUpStatus: "PENDING",
    });
    (walletApi.simulateTopUp as jest.Mock).mockResolvedValueOnce({
      id: "topup-1",
      creditSatang: 50000,
      topUpStatus: "PAID",
    });

    const view = await render(<HomeWalletOverview locale="en" />);

    await waitFor(() => {
      expect(view.getByTestId("wallet-topup-button")).toBeTruthy();
    });

    fireEvent.press(view.getByTestId("wallet-topup-button"));
    await waitFor(() => {
      expect(view.getByTestId("quest-funding-top-up-quick-500")).toBeTruthy();
    });
    fireEvent.press(view.getByTestId("quest-funding-top-up-quick-500"));
    await waitFor(() => {
      expect(view.getByTestId("quest-funding-top-up-amount").props.value).toBe(
        "500"
      );
    });
    await fireEvent.press(view.getByTestId("quest-funding-top-up-continue"));

    await waitFor(() => {
      expect(
        view.getByTestId("quest-funding-top-up-confirmation")
      ).toBeTruthy();
      expect(view.getByText("฿500.00")).toBeTruthy();
      expect(view.getByText("฿4.00")).toBeTruthy();
      expect(view.getByText("฿0.28")).toBeTruthy();
      expect(view.getByText("฿504.28")).toBeTruthy();
    });
    expect(walletApi.quoteTopUp).toHaveBeenCalledWith(50_000);
    expect(walletApi.createTopUp).not.toHaveBeenCalled();

    await fireEvent.press(view.getByTestId("quest-funding-top-up-confirm"));

    await waitFor(() => {
      expect(view.getByTestId("quest-funding-top-up-promptpay")).toBeTruthy();
    });
    expect(walletApi.createTopUp).toHaveBeenCalledWith("quote-1");

    await fireEvent.press(
      view.getByTestId("quest-funding-top-up-verify-payment")
    );
    await waitFor(() => {
      expect(view.getByTestId("quest-funding-verified-badge")).toBeTruthy();
      expect(
        view.getByText("฿500.00 credited to your Spending Balance")
      ).toBeTruthy();
    });
  });

  it("opens history modal with ledger-backed activities when History is pressed", async () => {
    const view = await render(<HomeWalletOverview locale="en" />);

    await waitFor(() => {
      expect(view.getByTestId("wallet-history-button")).toBeTruthy();
    });

    fireEvent.press(view.getByTestId("wallet-history-button"));

    await waitFor(() => {
      expect(view.getByText("Transaction History")).toBeTruthy();
      expect(view.getByText("PromptPay Top-Up")).toBeTruthy();
    });
  });
});
