import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { walletApi } from "@/api/WalletApi";
import { useQuestTopUpFlow } from "../useQuestTopUpFlow";

jest.mock("@/api/ServerSocket", () => ({
  openServerSocket: jest.fn(() => ({ send: jest.fn(), close: jest.fn() })),
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
    },
  };
});

const pendingTopUp = {
  id: "topup-1",
  internalReference: "top-up:topup-1",
  creditSatang: 10000,
  chargedFeeSatang: 0,
  chargedTaxSatang: 0,
  paymentTotalSatang: 10000,
  topUpStatus: "PENDING" as const,
  qrExpiresAt: "2099-12-31T23:59:59.000Z",
  qrPayload: "payload",
  qrDataUrl: "data:image/png;base64,qr",
  createdAt: "2026-09-18T10:00:00.000Z",
};

function renderFlow() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(
    () => useQuestTopUpFlow({ locale: "en", onBackFromAmount: jest.fn() }),
    { wrapper }
  );
}

describe("useQuestTopUpFlow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (walletApi.getWallet as jest.Mock).mockResolvedValue({
      spendingBalanceSatang: 0,
      earningsBalanceSatang: 0,
      fundingReservedSatang: 0,
      reservedForPayoutsSatang: 0,
    });
    (walletApi.quoteTopUp as jest.Mock).mockResolvedValue({
      id: "quote-1",
      creditSatang: 10000,
      chargedFeeSatang: 0,
      chargedTaxSatang: 0,
      paymentTotalSatang: 10000,
      expiresAt: "2099-12-31T23:59:59.000Z",
    });
    (walletApi.createTopUp as jest.Mock).mockResolvedValue(pendingTopUp);
  });

  it.each([
    [
      "EXPIRED",
      "This QR code has expired. Enter an amount to create a new one.",
    ],
    ["FAILED", "This payment failed. Enter an amount to try again."],
  ])(
    "restarts from the amount step when verification reports %s",
    async (topUpStatus, message) => {
      // Stay PENDING until the Worker verifies; the status query may refetch
      // on mount and must not reach the terminal status first.
      (walletApi.getTopUpStatus as jest.Mock).mockResolvedValue(pendingTopUp);
      const { result } = await renderFlow();

      await act(async () => result.current.handleTopUpAmountChange("100"));
      await act(async () => result.current.handleTopUpContinue());
      await act(async () => result.current.handleTopUpConfirm());
      await waitFor(() => expect(result.current.topUpStep).toBe("promptPay"));
      (walletApi.getTopUpStatus as jest.Mock).mockResolvedValue({
        ...pendingTopUp,
        topUpStatus,
      });

      await act(async () => result.current.handleVerifyPayment());

      await waitFor(() => {
        expect(result.current.topUpStep).toBe("amount");
        expect(result.current.verificationError).toBe(message);
      });
      expect(result.current.activeTopUp).toBeNull();
      expect(result.current.topUpQuote).toBeNull();
    }
  );

  it("keeps the QR open while the top-up is still pending", async () => {
    (walletApi.getTopUpStatus as jest.Mock).mockResolvedValue(pendingTopUp);
    const { result } = await renderFlow();

    await act(async () => result.current.handleTopUpAmountChange("100"));
    await act(async () => result.current.handleTopUpContinue());
    await act(async () => result.current.handleTopUpConfirm());
    await act(async () => result.current.handleVerifyPayment());

    expect(result.current.topUpStep).toBe("promptPay");
    expect(result.current.verificationError).toBe(
      "Awaiting payment confirmation…"
    );
  });
});
