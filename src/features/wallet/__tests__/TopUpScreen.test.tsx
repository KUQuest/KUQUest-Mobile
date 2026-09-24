import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { walletApi } from "@/api/WalletApi";
import { renderWithQueryClient } from "@/testing/queryTestUtils";
import TopUpScreen from "../TopUpScreen";

const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
}));

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "th" }),
}));

jest.mock("@/api/WalletApi", () => {
  const original = jest.requireActual("@/api/WalletApi");
  return {
    ...original,
    walletApi: {
      quoteTopUp: jest.fn(),
      getWallet: jest.fn(),
      createTopUp: jest.fn(),
      getTopUpStatus: jest.fn(),
      simulateTopUp: jest.fn(),
    },
  };
});

const mockQuote = {
  id: "quote-123",
  creditSatang: 10000,
  chargedFeeSatang: 0,
  chargedTaxSatang: 0,
  paymentTotalSatang: 10000,
  expiresAt: "2026-12-31T23:59:59.000Z",
};

const mockTopUpRecord = {
  id: "topup-456",
  internalReference: "top-up:topup-456",
  creditSatang: 10000,
  chargedFeeSatang: 0,
  chargedTaxSatang: 0,
  paymentTotalSatang: 10000,
  topUpStatus: "PENDING" as const,
  expiresAt: "2026-12-31T23:59:59.000Z",
  qrPayload: "00020101021229370016A000000677010111...",
  qrDataUrl: "data:image/png;base64,mockqrdata",
  createdAt: "2026-09-18T10:00:00.000Z",
};

describe("TopUpScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (walletApi.getWallet as jest.Mock).mockResolvedValue({
      spendingBalanceSatang: 100_000,
      earningsBalanceSatang: 0,
      fundingReservedSatang: 0,
      reservedForPayoutsSatang: 0,
    });
    (walletApi.quoteTopUp as jest.Mock).mockResolvedValue(mockQuote);
    (walletApi.createTopUp as jest.Mock).mockResolvedValue(mockTopUpRecord);
  });

  it("renders Step 1 (amount selection) with default amount and quick options", async () => {
    const view = await renderWithQueryClient(<TopUpScreen />);

    await waitFor(() => {
      expect(view.getByTestId("top-up-amount-step")).toBeTruthy();
      expect(view.getByTestId("top-up-amount-input").props.value).toBe("100");
      expect(view.getByTestId("top-up-quick-500")).toBeTruthy();
      expect(view.getByTestId("top-up-continue-btn")).toBeTruthy();
    });
  });

  it("updates amount when quick chip is tapped", async () => {
    const view = await renderWithQueryClient(<TopUpScreen />);

    await waitFor(() => {
      expect(view.getByTestId("top-up-quick-500")).toBeTruthy();
    });

    await fireEvent.press(view.getByTestId("top-up-quick-500"));

    await waitFor(() => {
      expect(view.getByTestId("top-up-amount-input").props.value).toBe("500");
    });
  });

  it("shows error and disables continue when amount is below minimum", async () => {
    const view = await renderWithQueryClient(<TopUpScreen />);

    await waitFor(() => {
      expect(view.getByTestId("top-up-amount-input")).toBeTruthy();
    });

    await fireEvent.changeText(view.getByTestId("top-up-amount-input"), "5");
    await fireEvent.press(view.getByTestId("top-up-continue-btn"));

    await waitFor(() => {
      expect(view.getByText(/ขั้นต่ำ/)).toBeTruthy();
    });
  });

  it("requests quote and navigates through confirmation to QR payment", async () => {
    const view = await renderWithQueryClient(<TopUpScreen />);

    await waitFor(() => {
      expect(view.getByTestId("top-up-continue-btn")).toBeTruthy();
    });

    // Step 1 -> Continue
    await fireEvent.press(view.getByTestId("top-up-continue-btn"));

    await waitFor(() => {
      expect(walletApi.quoteTopUp).toHaveBeenCalledWith(10000);
      expect(view.getByTestId("top-up-confirmation-step")).toBeTruthy();
      expect(view.getByTestId("top-up-payment-total")).toHaveTextContent(
        "฿100.00"
      );
    });

    // Step 2 -> Confirm
    await fireEvent.press(view.getByTestId("top-up-confirm-btn"));

    await waitFor(() => {
      expect(walletApi.createTopUp).toHaveBeenCalledWith(mockQuote.id);
      expect(view.getByTestId("top-up-promptpay-step")).toBeTruthy();
      expect(view.getByTestId("top-up-qr-amount-value")).toHaveTextContent(
        "฿100.00"
      );
    });
  });

  it("returns to amount step when 'แก้ไขจำนวนเงิน' is tapped in confirmation", async () => {
    const view = await renderWithQueryClient(<TopUpScreen />);

    await waitFor(() => {
      expect(view.getByTestId("top-up-continue-btn")).toBeTruthy();
    });

    await fireEvent.press(view.getByTestId("top-up-continue-btn"));
    await waitFor(() => {
      expect(view.getByTestId("top-up-confirmation-step")).toBeTruthy();
    });

    await fireEvent.press(view.getByTestId("top-up-edit-amount-btn"));
    await waitFor(() => {
      expect(view.getByTestId("top-up-amount-step")).toBeTruthy();
    });
  });

  it("shows refreshed balance and transaction reference after payment", async () => {
    (walletApi.getTopUpStatus as jest.Mock).mockResolvedValue({
      ...mockTopUpRecord,
      topUpStatus: "PAID",
    });
    (walletApi.getWallet as jest.Mock).mockResolvedValueOnce({
      spendingBalanceSatang: 30_000,
      earningsBalanceSatang: 0,
      fundingReservedSatang: 0,
      reservedForPayoutsSatang: 0,
    });

    const view = await renderWithQueryClient(<TopUpScreen />);

    await waitFor(() => {
      expect(view.getByTestId("top-up-continue-btn")).toBeTruthy();
    });

    // Advance to PromptPay step
    await fireEvent.press(view.getByTestId("top-up-continue-btn"));
    await waitFor(() => {
      expect(view.getByTestId("top-up-confirmation-step")).toBeTruthy();
    });
    await fireEvent.press(view.getByTestId("top-up-confirm-btn"));
    await waitFor(() => {
      expect(view.getByTestId("top-up-promptpay-step")).toBeTruthy();
    });

    // Check status
    await fireEvent.press(view.getByTestId("top-up-check-status-btn"));

    await waitFor(() => {
      expect(walletApi.getTopUpStatus).toHaveBeenCalledWith(
        mockTopUpRecord.id,
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
      expect(walletApi.getWallet).toHaveBeenCalledTimes(1);
      expect(view.getByTestId("top-up-success-view")).toBeTruthy();
      expect(view.getByTestId("top-up-verified-badge")).toBeTruthy();
      expect(view.getByText("เติมเงินสำเร็จ")).toBeTruthy();
      expect(view.getByText("฿100.00")).toBeTruthy();
      expect(view.getByTestId("top-up-current-balance")).toHaveTextContent(
        "฿300.00"
      );
      expect(view.getByTestId("top-up-reference-value")).toHaveTextContent(
        "top-up:topup-456"
      );
      expect(view.getByTestId("top-up-done-btn")).toBeTruthy();
    });

    // Tap Done
    await fireEvent.press(view.getByTestId("top-up-done-btn"));
    expect(mockBack).toHaveBeenCalled();
  });

  it("calls router.back when header back button is pressed on Step 1", async () => {
    const view = await renderWithQueryClient(<TopUpScreen />);

    await waitFor(() => {
      expect(view.getByTestId("top-up-back-btn")).toBeTruthy();
    });

    await fireEvent.press(view.getByTestId("top-up-back-btn"));
    expect(mockBack).toHaveBeenCalled();
  });
});
