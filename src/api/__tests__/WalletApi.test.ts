import { ApiClient } from "../ApiClient";
import { WalletApi } from "../WalletApi";

describe("WalletApi", () => {
  let fetchMock: jest.Mock;
  let api: WalletApi;

  beforeEach(() => {
    fetchMock = jest.fn();
    const client = new ApiClient({
      baseUrl: "https://api.example.test",
      fetchImpl: fetchMock as unknown as typeof fetch,
      cookieProvider: () => "better-auth.session_token=test-token",
    });
    api = new WalletApi(client);
  });

  it("fetches 4-compartment wallet balances", async () => {
    const data = {
      success: true,
      data: {
        wallet: {
          spendingBalanceSatang: 100000,
          earningsBalanceSatang: 50000,
          fundingReservedSatang: 15000,
          reservedForPayoutsSatang: 10000,
        },
      },
    };

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(data),
    });

    const wallet = await api.getWallet();
    expect(wallet.spendingBalanceSatang).toBe(100000);
    expect(wallet.earningsBalanceSatang).toBe(50000);
    expect(wallet.fundingReservedSatang).toBe(15000);
    expect(wallet.reservedForPayoutsSatang).toBe(10000);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/wallet",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("retains the server-calculated quote and payment totals", async () => {
    const quoteData = {
      success: true,
      data: {
        id: "quote-1",
        creditSatang: 50000,
        chargedFeeSatang: 400,
        chargedTaxSatang: 28,
        paymentTotalSatang: 50428,
        expiresAt: "2026-09-15T12:00:00Z",
      },
    };
    const topUpData = {
      success: true,
      data: {
        id: "topup-1",
        creditSatang: 50000,
        chargedFeeSatang: 400,
        chargedTaxSatang: 28,
        paymentTotalSatang: 50428,
        qrPayload: "00020101021229370016A000000677010111...",
        qrDataUrl: "data:image/png;base64,iVBORw...",
        qrExpiresAt: "2026-09-15T12:15:00Z",
        topUpStatus: "PENDING",
        createdAt: "2026-09-15T12:00:00Z",
      },
    };

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        text: async () => JSON.stringify(quoteData),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        text: async () => JSON.stringify(topUpData),
      });

    const quote = await api.quoteTopUp(50000);
    expect(quote).toMatchObject({
      chargedFeeSatang: 400,
      chargedTaxSatang: 28,
      creditSatang: 50000,
      expiresAt: "2026-09-15T12:00:00Z",
      paymentTotalSatang: 50428,
    });

    const topUp = await api.createTopUp("quote-1", "idemp-1");
    expect(topUp).toMatchObject({
      chargedFeeSatang: 400,
      chargedTaxSatang: 28,
      creditSatang: 50000,
      paymentTotalSatang: 50428,
    });
    expect(topUp.topUpStatus).toBe("PENDING");
    expect(topUp.qrDataUrl).toContain("data:image/png;base64");
  });

  it("calls the server-side Xendit test-payment simulation endpoint", async () => {
    const data = {
      success: true,
      data: {
        id: "topup-1",
        creditSatang: 10000,
        chargedFeeSatang: 0,
        chargedTaxSatang: 0,
        paymentTotalSatang: 10000,
        qrPayload: null,
        qrDataUrl: null,
        qrExpiresAt: null,
        topUpStatus: "PAID",
        createdAt: "2026-09-15T12:00:00Z",
      },
    };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(data),
    });

    const topUp = await api.simulateTopUp("topup-1");

    expect(topUp.topUpStatus).toBe("PAID");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/top-ups/topup-1/simulate",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("fetches ledger-backed wallet activities for transaction history", async () => {
    const activityResponse = {
      success: true,
      data: {
        activities: [
          {
            id: "activity-1",
            occurredAt: "2026-09-14T10:00:00Z",
            type: "TOP_UP",
            activityStatus: "COMPLETED",
            spendingDeltaSatang: 20000,
            earningsDeltaSatang: 0,
            fundingReservedDeltaSatang: 0,
            payoutReservedDeltaSatang: 0,
            resourceType: "wallet_ledger_transaction",
            resourceId: "ledger-1",
          },
          {
            id: "activity-2",
            occurredAt: "2026-09-13T10:00:00Z",
            type: "HOLD",
            activityStatus: "COMPLETED",
            spendingDeltaSatang: -50000,
            earningsDeltaSatang: 0,
            fundingReservedDeltaSatang: 50000,
            payoutReservedDeltaSatang: 0,
            resourceType: "wallet_ledger_transaction",
            resourceId: "ledger-2",
          },
        ],
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(activityResponse),
    });

    const history = await api.getTransactionHistory(30);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/wallet/activities?limit=30",
      expect.objectContaining({ method: "GET" })
    );
    expect(history.items).toHaveLength(2);
    expect(history.items[0]).toEqual(
      expect.objectContaining({
        type: "TOP_UP",
        amountSatang: 20000,
        direction: "INFLOW",
      })
    );
    expect(history.items[1]).toEqual(
      expect.objectContaining({
        type: "HOLD",
        amountSatang: 50000,
        direction: "OUTFLOW",
      })
    );
  });
});
