import React from "react";
import { act, fireEvent, waitFor } from "@testing-library/react-native";
import { walletApi } from "@/api/WalletApi";
import { renderWithQueryClient } from "@/testing/queryTestUtils";
import { workerRamp } from "@/theme/colors";
import { useRoleWorkspaceStore } from "@/features/workspace/roleWorkspaceStore";
import TopUpScreen from "../TopUpScreen";

const mockBack = jest.fn();
const mockCanGoBack = jest.fn(() => true);
const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    canGoBack: mockCanGoBack,
    push: mockPush,
    replace: mockReplace,
  }),
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
      listTopUps: jest.fn(),
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
  qrExpiresAt: "2026-12-31T23:59:59.000Z",
  qrPayload: "00020101021229370016A000000677010111...",
  qrDataUrl: "data:image/png;base64,mockqrdata",
  createdAt: "2026-09-18T10:00:00.000Z",
};

describe("TopUpScreen", () => {
  beforeEach(() => {
    useRoleWorkspaceStore.setState({ workspace: "hirer" });
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(true);
    (walletApi.getWallet as jest.Mock).mockResolvedValue({
      spendingBalanceSatang: 100_000,
      earningsBalanceSatang: 0,
      fundingReservedSatang: 0,
      reservedForPayoutsSatang: 0,
    });
    (walletApi.quoteTopUp as jest.Mock).mockResolvedValue(mockQuote);
    (walletApi.createTopUp as jest.Mock).mockResolvedValue(mockTopUpRecord);
    (walletApi.listTopUps as jest.Mock).mockResolvedValue([]);
  });

  it("uses the Worker accent on the PromptPay step", async () => {
    useRoleWorkspaceStore.setState({ workspace: "worker" });
    const view = await renderWithQueryClient(<TopUpScreen />);

    await fireEvent.press(view.getByTestId("top-up-continue-btn"));
    await waitFor(() => {
      expect(view.getByTestId("top-up-confirmation-step")).toBeTruthy();
    });
    await fireEvent.press(view.getByTestId("top-up-confirm-btn"));
    await waitFor(() => {
      expect(view.getByTestId("top-up-promptpay-accent").props.color).toBe(
        workerRamp.light.primaryDark
      );
    });
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

  it("shows refreshed balance and transaction reference after polling detects payment", async () => {
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

  it("still verifies payment through the manual Check Status fallback", async () => {
    (walletApi.getTopUpStatus as jest.Mock)
      .mockResolvedValueOnce(mockTopUpRecord)
      .mockResolvedValue({ ...mockTopUpRecord, topUpStatus: "PAID" });
    const view = await renderWithQueryClient(<TopUpScreen />);

    await fireEvent.press(view.getByTestId("top-up-continue-btn"));
    await waitFor(() => expect(view.getByTestId("top-up-confirmation-step")));
    await fireEvent.press(view.getByTestId("top-up-confirm-btn"));
    await waitFor(() =>
      expect(view.getByTestId("top-up-promptpay-step")).toBeTruthy()
    );
    await waitFor(() =>
      expect(walletApi.getTopUpStatus).toHaveBeenCalledTimes(1)
    );

    await waitFor(() =>
      expect(view.getByTestId("top-up-check-status-btn")).toBeEnabled()
    );
    await fireEvent.press(view.getByTestId("top-up-check-status-btn"));

    await waitFor(() => {
      expect(walletApi.getTopUpStatus).toHaveBeenCalledTimes(2);
      expect(view.getByTestId("top-up-success-view")).toBeTruthy();
    });
  });
  it("shows payment success plus localized refresh notice with retry when wallet refetch fails", async () => {
    (walletApi.getTopUpStatus as jest.Mock).mockResolvedValue({
      ...mockTopUpRecord,
      topUpStatus: "PAID",
    });
    (walletApi.getWallet as jest.Mock)
      .mockRejectedValueOnce(new Error("Network timeout"))
      .mockResolvedValueOnce({
        spendingBalanceSatang: 30_000,
        earningsBalanceSatang: 0,
        fundingReservedSatang: 0,
        reservedForPayoutsSatang: 0,
      });

    const view = await renderWithQueryClient(<TopUpScreen />);

    await waitFor(() => {
      expect(view.getByTestId("top-up-continue-btn")).toBeTruthy();
    });
    await fireEvent.press(view.getByTestId("top-up-continue-btn"));
    await waitFor(() => {
      expect(view.getByTestId("top-up-confirmation-step")).toBeTruthy();
    });
    await fireEvent.press(view.getByTestId("top-up-confirm-btn"));

    await waitFor(() => {
      expect(view.getByTestId("top-up-success-view")).toBeTruthy();
      expect(view.getByText("เติมเงินสำเร็จ")).toBeTruthy();
      expect(view.getByTestId("top-up-current-balance")).toHaveTextContent(
        "ไม่สามารถโหลดยอดเงินพร้อมใช้ปัจจุบันได้"
      );
      expect(view.getByTestId("top-up-balance-refresh-notice")).toBeTruthy();
      expect(
        view.getByText("ชำระเงินสำเร็จ แต่ไม่สามารถรีเฟรชยอดเงินได้")
      ).toBeTruthy();
      expect(view.getByTestId("top-up-retry-balance-btn")).toBeTruthy();
      expect(view.queryByText("Network timeout")).toBeNull();
    });

    await fireEvent.press(view.getByTestId("top-up-retry-balance-btn"));

    await waitFor(() => {
      expect(walletApi.getWallet).toHaveBeenCalledTimes(2);
      expect(view.getByTestId("top-up-current-balance")).toHaveTextContent(
        "฿300.00"
      );
      expect(view.queryByTestId("top-up-balance-refresh-notice")).toBeNull();
    });
  });

  it("shows localized error and never displays raw exception message on quote failure", async () => {
    (walletApi.quoteTopUp as jest.Mock).mockRejectedValueOnce(
      new Error("Internal DB connection crashed")
    );

    const view = await renderWithQueryClient(<TopUpScreen />);

    await waitFor(() => {
      expect(view.getByTestId("top-up-continue-btn")).toBeTruthy();
    });
    await fireEvent.press(view.getByTestId("top-up-continue-btn"));

    await waitFor(() => {
      expect(
        view.getByText("ยังไม่พบการชำระเงิน กรุณาตรวจสอบอีกครั้ง")
      ).toBeTruthy();
      expect(view.queryByText("Internal DB connection crashed")).toBeNull();
    });
  });
  it("resumes the newest unexpired pending top-up on mount and shows its QR", async () => {
    (walletApi.listTopUps as jest.Mock).mockResolvedValue([
      {
        id: "older",
        topUpStatus: "PENDING",
        qrExpiresAt: "2026-12-31T23:59:59.000Z",
        createdAt: "2026-09-17T10:00:00.000Z",
      },
      {
        id: "expired",
        topUpStatus: "PENDING",
        qrExpiresAt: "2026-09-01T00:00:00.000Z",
        createdAt: "2026-09-30T10:00:00.000Z",
      },
      {
        id: "newest",
        topUpStatus: "PENDING",
        qrExpiresAt: "2026-12-31T23:59:59.000Z",
        createdAt: "2026-09-29T10:00:00.000Z",
      },
    ]);
    (walletApi.getTopUpStatus as jest.Mock).mockResolvedValue({
      ...mockTopUpRecord,
      id: "newest",
    });
    const view = await renderWithQueryClient(<TopUpScreen />);

    await waitFor(() => {
      expect(walletApi.getTopUpStatus).toHaveBeenCalledWith(
        "newest",
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
      expect(view.getByTestId("top-up-promptpay-step")).toBeTruthy();
      expect(view.getByTestId("top-up-qr-image")).toBeTruthy();
    });
  });

  it("ignores expired or terminal top-ups and shows the amount step", async () => {
    (walletApi.listTopUps as jest.Mock).mockResolvedValue([
      {
        id: "expired",
        topUpStatus: "PENDING",
        qrExpiresAt: "2026-09-01T00:00:00.000Z",
        createdAt: "2026-09-30T10:00:00.000Z",
      },
      {
        id: "paid",
        topUpStatus: "PAID",
        qrExpiresAt: "2026-12-31T23:59:59.000Z",
        createdAt: "2026-09-30T11:00:00.000Z",
      },
    ]);
    const view = await renderWithQueryClient(<TopUpScreen />);

    await waitFor(() => {
      expect(walletApi.listTopUps).toHaveBeenCalled();
      expect(view.getByTestId("top-up-amount-step")).toBeTruthy();
    });
    expect(walletApi.getTopUpStatus).not.toHaveBeenCalled();
  });

  it("moves to success when polling reports PAID without pressing Check Status", async () => {
    jest.useFakeTimers();
    (walletApi.getTopUpStatus as jest.Mock)
      .mockResolvedValueOnce(mockTopUpRecord)
      .mockResolvedValueOnce({ ...mockTopUpRecord, topUpStatus: "PAID" });
    const view = await renderWithQueryClient(<TopUpScreen />);

    await fireEvent.press(view.getByTestId("top-up-continue-btn"));
    await waitFor(() => expect(view.getByTestId("top-up-confirmation-step")));
    await fireEvent.press(view.getByTestId("top-up-confirm-btn"));
    await waitFor(() =>
      expect(view.getByTestId("top-up-promptpay-step")).toBeTruthy()
    );
    await waitFor(() =>
      expect(walletApi.getTopUpStatus).toHaveBeenCalledTimes(1)
    );

    await act(async () => {
      await jest.advanceTimersByTimeAsync(5_000);
    });

    await waitFor(() => {
      expect(view.getByTestId("top-up-success-view")).toBeTruthy();
      expect(view.queryByTestId("top-up-check-status-btn")).toBeNull();
    });
    jest.useRealTimers();
  });

  it("stops polling after a terminal status", async () => {
    jest.useFakeTimers();
    (walletApi.getTopUpStatus as jest.Mock).mockResolvedValue({
      ...mockTopUpRecord,
      topUpStatus: "PAID",
    });
    const view = await renderWithQueryClient(<TopUpScreen />);
    await fireEvent.press(view.getByTestId("top-up-continue-btn"));
    await waitFor(() => expect(view.getByTestId("top-up-confirmation-step")));
    await fireEvent.press(view.getByTestId("top-up-confirm-btn"));
    await waitFor(() => expect(view.getByTestId("top-up-success-view")));
    const requests = (walletApi.getTopUpStatus as jest.Mock).mock.calls.length;

    await act(async () => {
      await jest.advanceTimersByTimeAsync(10_000);
    });

    expect(walletApi.getTopUpStatus).toHaveBeenCalledTimes(requests);
    jest.useRealTimers();
  });
  it("calls router.back when header back button is pressed on Step 1", async () => {
    const view = await renderWithQueryClient(<TopUpScreen />);

    await waitFor(() => {
      expect(view.getByTestId("top-up-back-btn")).toBeTruthy();
    });

    await fireEvent.press(view.getByTestId("top-up-back-btn"));
    expect(mockBack).toHaveBeenCalled();
  });
  it("replaces to /(tabs)/money when there is no history", async () => {
    mockCanGoBack.mockReturnValue(false);
    const view = await renderWithQueryClient(<TopUpScreen />);
    await waitFor(() => {
      expect(view.getByTestId("top-up-back-btn")).toBeTruthy();
    });

    await fireEvent.press(view.getByTestId("top-up-back-btn"));

    expect(mockReplace).toHaveBeenCalledWith("/(tabs)/money");
    expect(mockBack).not.toHaveBeenCalled();
  });
});
