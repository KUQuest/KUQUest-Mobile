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
        internalReference: "top-up:topup-1",
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
    expect(topUp.internalReference).toBe("top-up:topup-1");
    expect(topUp.qrDataUrl).toContain("data:image/png;base64");
  });

  it("calls the server-side Xendit test-payment simulation endpoint", async () => {
    const data = {
      success: true,
      data: {
        id: "topup-1",
        internalReference: "top-up:topup-1",
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

    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/api/v1/wallet/activities")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ "content-type": "application/json" }),
          text: async () => JSON.stringify(activityResponse),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        text: async () =>
          JSON.stringify({ success: true, data: { items: [] } }),
      });
    });

    const history = await api.getTransactionHistory(30);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/wallet/activities?limit=30",
      expect.objectContaining({ method: "GET" })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/top-ups?limit=30",
      expect.objectContaining({ method: "GET" })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/payouts?limit=30",
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

  it("lists payout destinations", async () => {
    const destinationsResponse = {
      success: true,
      data: {
        destinations: [
          {
            id: "dest-1",
            type: "PROMPTPAY",
            accountHolderName: "Somchai Jaidee",
            maskedAccount: "xxx-xxx-1234",
            bankCode: null,
            isDefault: true,
            createdAt: "2026-09-17T10:00:00Z",
          },
        ],
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(destinationsResponse),
    });

    const destinations = await api.listPayoutDestinations();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/payout-destinations",
      expect.objectContaining({ method: "GET" })
    );
    expect(destinations).toHaveLength(1);
    expect(destinations[0]).toEqual(
      expect.objectContaining({
        id: "dest-1",
        type: "PROMPTPAY",
        accountHolderName: "Somchai Jaidee",
        maskedAccount: "xxx-xxx-1234",
        isDefault: true,
      })
    );
  });

  it("creates a new payout destination", async () => {
    const createResponse = {
      success: true,
      data: {
        destination: {
          id: "dest-2",
          type: "BANK_ACCOUNT",
          accountHolderName: "Somchai Jaidee",
          maskedAccount: "xxx-x-xx567-8",
          bankCode: "KBANK",
          isDefault: false,
          createdAt: "2026-09-17T11:00:00Z",
        },
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(createResponse),
    });

    const destination = await api.createPayoutDestination({
      type: "BANK_ACCOUNT",
      accountNumber: "1234567890",
      accountHolderName: "Somchai Jaidee",
      bankCode: "KBANK",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/payout-destinations",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          accountHolderName: "Somchai Jaidee",
          accountNumber: "1234567890",
          bankCode: "KBANK",
          givenName: "Somchai",
          surname: "Jaidee",
          routingType: "BANK_ACCOUNT",
          type: "BANK_ACCOUNT",
        }),
      })
    );
    expect(destination).toEqual(
      expect.objectContaining({
        id: "dest-2",
        type: "BANK_ACCOUNT",
        maskedAccount: "xxx-x-xx567-8",
        bankCode: "KBANK",
      })
    );
  });

  it("requests a payout with amount and destination", async () => {
    const payoutResponse = {
      success: true,
      data: {
        payout: {
          id: "payout-1",
          amountSatang: 50000,
          feeSatang: 0,
          status: "PENDING_ADMIN_APPROVAL",
          destination: {
            type: "PROMPTPAY",
            maskedAccount: "xxx-xxx-1234",
          },
          createdAt: "2026-09-17T12:00:00Z",
        },
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(payoutResponse),
    });

    const payout = await api.requestPayout(50000, "dest-1", "idemp-payout-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/payouts",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "idempotency-key": "idemp-payout-1",
        }),
        body: JSON.stringify({
          amountSatang: 50000,
          destinationId: "dest-1",
        }),
      })
    );
    expect(payout).toEqual(
      expect.objectContaining({
        id: "payout-1",
        amountSatang: 50000,
        feeSatang: 0,
        status: "PENDING_ADMIN_APPROVAL",
      })
    );
  });

  it("gets active payout destination matching OpenAPI schema", async () => {
    const activeDestinationResponse = {
      success: true,
      data: {
        id: "dest-open-1",
        principalUserId: "user-1",
        recipientType: "SELF",
        givenName: "Anan",
        surname: "Sukjai",
        relationship: "SELF",
        accountCountry: "TH",
        accountCurrency: "THB",
        bankCode: "SCB",
        accountHolderName: "Anan Sukjai",
        routingType: "BANK_ACCOUNT",
        maskedLastFour: "9876",
        maskedRoutingValue: "xxx-x-xx987-6",
        createdAt: "2026-09-18T08:00:00Z",
        retiredAt: null,
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(activeDestinationResponse),
    });

    const destination = await api.getActivePayoutDestination();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/payout-destinations",
      expect.objectContaining({ method: "GET" })
    );
    expect(destination).toEqual(
      expect.objectContaining({
        id: "dest-open-1",
        givenName: "Anan",
        surname: "Sukjai",
        bankCode: "SCB",
        accountHolderName: "Anan Sukjai",
        type: "BANK_ACCOUNT",
        maskedAccount: "xxx-x-xx987-6",
      })
    );
  });

  it("retires active payout destination with DELETE without path id", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () =>
        JSON.stringify({ success: true, data: { retired: true } }),
    });

    const retired = await api.retireActivePayoutDestination();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/payout-destinations",
      expect.objectContaining({ method: "DELETE" })
    );
    expect(retired).toBe(true);
  });

  it("quotes a payout with receiptSatang", async () => {
    const quoteResponse = {
      success: true,
      data: {
        id: "quote-1",
        principalUserId: "user-1",
        payoutDestinationId: "dest-1",
        policyRevisionId: "rev-1",
        receiptSatang: 20000,
        maximumFeeSatang: 1500,
        maximumTaxSatang: 105,
        maximumDebitSatang: 21605,
        feeRoundingMode: "UP",
        expiresAt: "2026-09-18T10:15:00Z",
        consumedAt: null,
        createdAt: "2026-09-18T10:00:00Z",
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(quoteResponse),
    });

    const quote = await api.quotePayout(20000);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/payouts/quotes",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ receiptSatang: 20000 }),
      })
    );
    expect(quote.id).toBe("quote-1");
    expect(quote.receiptSatang).toBe(20000);
    expect(quote.maximumDebitSatang).toBe(21605);
  });

  it("creates a payout against a quoteId with idempotency key", async () => {
    const createPayoutResponse = {
      success: true,
      data: {
        id: "payout-quote-1",
        internalReference: "PO-12345",
        principalUserId: "user-1",
        quoteId: "quote-1",
        payoutDestinationId: "dest-1",
        payoutStatus: "PENDING_ADMIN_APPROVAL",
        receiptSatang: 20000,
        actualFeeSatang: 1500,
        createdAt: "2026-09-18T10:01:00Z",
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(createPayoutResponse),
    });

    const record = await api.createPayout("quote-1", "idemp-key-99");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/payouts",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "idempotency-key": "idemp-key-99",
        }),
        body: JSON.stringify({ quoteId: "quote-1" }),
      })
    );
    expect(record.id).toBe("payout-quote-1");
    expect(record.status).toBe("PENDING_ADMIN_APPROVAL");
    expect(record.amountSatang).toBe(20000);
  });

  it("fetches single payout detail and status history", async () => {
    const payoutDetailResponse = {
      success: true,
      data: {
        id: "payout-1",
        payoutStatus: "SUBMITTED_TO_PROVIDER",
        receiptSatang: 50000,
        actualFeeSatang: 1500,
        createdAt: "2026-09-18T10:00:00Z",
      },
    };
    const statusHistoryResponse = {
      success: true,
      data: [
        {
          id: "hist-1",
          fromStatus: "PENDING_ADMIN_APPROVAL",
          toStatus: "SUBMITTED_TO_PROVIDER",
          occurredAt: "2026-09-18T10:05:00Z",
        },
      ],
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(payoutDetailResponse),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(statusHistoryResponse),
    });

    const detail = await api.getPayout("payout-1");
    const history = await api.listPayoutStatusHistory("payout-1");

    expect(detail.status).toBe("SUBMITTED_TO_PROVIDER");
    expect(history).toHaveLength(1);
    expect(history[0].toStatus).toBe("SUBMITTED_TO_PROVIDER");
  });

  it("lists payouts history", async () => {
    const payoutsResponse = {
      success: true,
      data: {
        payouts: [
          {
            id: "payout-1",
            amountSatang: 50000,
            feeSatang: 0,
            status: "PENDING_ADMIN_APPROVAL",
            destination: {
              type: "PROMPTPAY",
              maskedAccount: "xxx-xxx-1234",
            },
            createdAt: "2026-09-17T12:00:00Z",
          },
        ],
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(payoutsResponse),
    });

    const payouts = await api.listPayouts();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/payouts",
      expect.objectContaining({ method: "GET" })
    );
    expect(payouts).toHaveLength(1);
    expect(payouts[0]).toEqual(
      expect.objectContaining({
        id: "payout-1",
        amountSatang: 50000,
        status: "PENDING_ADMIN_APPROVAL",
      })
    );
  });

  it("merges activities and top-ups without duplicating transactions", async () => {
    const activitiesResponse = {
      success: true,
      data: {
        activities: [
          {
            id: "act-topup-1",
            ledgerTransactionId: "ledger-tx-1",
            occurredAt: "2026-09-18T10:00:00Z",
            type: "TOP_UP",
            activityStatus: "COMPLETED",
            spendingDeltaSatang: 10000,
            earningsDeltaSatang: 0,
            fundingReservedDeltaSatang: 0,
            payoutReservedDeltaSatang: 0,
            resourceType: "TOP_UP",
            resourceId: "topup-uuid-1",
          },
        ],
      },
    };

    const topUpsResponse = {
      success: true,
      data: {
        items: [
          {
            id: "topup-uuid-1",
            internalReference: "top-up:topup-uuid-1",
            creditSatang: 10000,
            paymentTotalSatang: 10086,
            topUpStatus: "PAID",
            creditedLedgerTransactionId: "ledger-tx-1",
            createdAt: "2026-09-18T10:00:00Z",
          },
        ],
      },
    };

    const payoutsResponse = {
      success: true,
      data: {
        items: [],
      },
    };

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        text: async () => JSON.stringify(activitiesResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        text: async () => JSON.stringify(topUpsResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        text: async () => JSON.stringify(payoutsResponse),
      });

    const history = await api.getTransactionHistory();

    // Must be exactly 1 item, NOT 2 items!
    expect(history.items).toHaveLength(1);
    expect(history.items[0]).toMatchObject({
      amountSatang: 10000,
      direction: "INFLOW",
      type: "TOP_UP",
      status: "PAID",
      reference: "top-up:topup-uuid-1",
    });
  });
});
