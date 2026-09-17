import { walletApi } from "@/api/WalletApi";
import type { TopUpData, TopUpQuote, WalletBalances } from "@/api/WalletApi";

import {
  checkConversionAmount,
  checkTopUpAmount,
  checkTopUpPayment,
  convertEarnings,
  createTopUpFromQuote,
  type WalletCompartments,
  MAX_WALLET_SATANG,
  MIN_TOP_UP_SATANG,
  simulateTopUpPayment,
  toCompartments,
} from "../walletModule";

jest.mock("@/api/WalletApi", () => {
  const original = jest.requireActual("@/api/WalletApi");
  return {
    ...original,
    walletApi: {
      quoteTopUp: jest.fn(),
      createTopUp: jest.fn(),
      getTopUpStatus: jest.fn(),
      simulateTopUp: jest.fn(),
      convertEarnings: jest.fn(),
    },
  };
});

const now = new Date("2026-01-01T00:00:00.000Z");

const topUpData: TopUpData = {
  id: "topup-1",
  creditSatang: 50_000,
  chargedFeeSatang: 0,
  chargedTaxSatang: 0,
  paymentTotalSatang: 50_000,
  qrPayload: null,
  qrDataUrl: null,
  qrExpiresAt: null,
  topUpStatus: "PENDING",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const quoteBase = {
  id: "quote-1",
  creditSatang: 50_000,
  chargedFeeSatang: 0,
  chargedTaxSatang: 0,
  paymentTotalSatang: 50_000,
};

const expiredQuote: TopUpQuote = {
  ...quoteBase,
  expiresAt: "2025-12-31T23:55:00.000Z",
};

const liveQuote: TopUpQuote = {
  ...quoteBase,
  expiresAt: "2026-01-01T00:05:00.000Z",
};

const conversionCompartments: WalletCompartments = {
  spendingSatang: 7_000,
  earningsSatang: 5_000,
  fundingReservedSatang: 0,
  payoutReserveSatang: 0,
  totalSatang: 12_000,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("checkTopUpAmount", () => {
  it("parses a plain baht amount into satang", () => {
    expect(checkTopUpAmount("500")).toEqual({ ok: true, satang: 50_000 });
  });

  it("accepts the 10.00 baht minimum inclusively", () => {
    expect(checkTopUpAmount("10")).toEqual({
      ok: true,
      satang: MIN_TOP_UP_SATANG,
    });
  });

  it("rejects an amount below the minimum", () => {
    expect(checkTopUpAmount("9.99")).toEqual({
      ok: false,
      reason: "BELOW_MINIMUM",
    });
  });

  it("rejects unparseable input", () => {
    expect(checkTopUpAmount("abc")).toEqual({ ok: false, reason: "INVALID" });
  });

  it("rejects a top-up that would push the total past the ceiling", () => {
    expect(
      checkTopUpAmount("10", {
        spendingSatang: MAX_WALLET_SATANG - 500,
        earningsSatang: 0,
        fundingReservedSatang: 0,
        payoutReserveSatang: 0,
        totalSatang: MAX_WALLET_SATANG - 500,
      })
    ).toEqual({ ok: false, reason: "ABOVE_CEILING" });
  });

  it("accepts a top-up landing exactly on the ceiling", () => {
    expect(
      checkTopUpAmount("10", {
        spendingSatang: MAX_WALLET_SATANG - MIN_TOP_UP_SATANG,
        earningsSatang: 0,
        fundingReservedSatang: 0,
        payoutReserveSatang: 0,
        totalSatang: MAX_WALLET_SATANG - MIN_TOP_UP_SATANG,
      })
    ).toEqual({ ok: true, satang: MIN_TOP_UP_SATANG });
  });
});

describe("toCompartments", () => {
  it("maps the four balances and sums them without mutating", () => {
    const balances: WalletBalances = {
      spendingBalanceSatang: 125_000,
      earningsBalanceSatang: 45_000,
      fundingReservedSatang: 15_000,
      reservedForPayoutsSatang: 5_000,
    };

    expect(toCompartments(balances)).toEqual({
      spendingSatang: 125_000,
      earningsSatang: 45_000,
      fundingReservedSatang: 15_000,
      payoutReserveSatang: 5_000,
      totalSatang: 190_000,
    });
    expect(balances).toEqual({
      spendingBalanceSatang: 125_000,
      earningsBalanceSatang: 45_000,
      fundingReservedSatang: 15_000,
      reservedForPayoutsSatang: 5_000,
    });
  });
});

describe("checkConversionAmount", () => {
  it("rejects a non-positive amount", () => {
    expect(checkConversionAmount(0, conversionCompartments)).toEqual({
      ok: false,
      reason: "INVALID",
    });
  });

  it("rejects an amount above the earnings balance", () => {
    expect(checkConversionAmount(5_001, conversionCompartments)).toEqual({
      ok: false,
      reason: "INSUFFICIENT_BALANCE",
    });
  });

  it("accepts converting the whole earnings balance", () => {
    expect(checkConversionAmount(5_000, conversionCompartments)).toEqual({
      ok: true,
      satang: 5_000,
    });
  });
});

describe("convertEarnings", () => {
  it("does not call the transport when validation rejects", async () => {
    const result = await convertEarnings(0, conversionCompartments);

    expect(result).toEqual({ ok: false, reason: "INVALID" });
    expect(walletApi.convertEarnings).not.toHaveBeenCalled();
  });

  it("calls the transport once with the amount on success", async () => {
    (walletApi.convertEarnings as jest.Mock).mockResolvedValueOnce({
      id: "conversion-1",
      amountSatang: 5_000,
    });

    const result = await convertEarnings(5_000, conversionCompartments);

    expect(result).toEqual({ ok: true, satang: 5_000 });
    expect(walletApi.convertEarnings).toHaveBeenCalledTimes(1);
    expect(walletApi.convertEarnings).toHaveBeenCalledWith(5_000);
  });
});

describe("createTopUpFromQuote", () => {
  it("refuses an expired quote without creating the top-up", async () => {
    const result = await createTopUpFromQuote(expiredQuote, now);

    expect(result).toEqual({ ok: false, reason: "QUOTE_EXPIRED" });
    expect(walletApi.createTopUp).not.toHaveBeenCalled();
  });

  it("creates the top-up from a live quote", async () => {
    (walletApi.createTopUp as jest.Mock).mockResolvedValueOnce(topUpData);

    const result = await createTopUpFromQuote(liveQuote, now);

    expect(result).toEqual({ ok: true, topUp: topUpData });
    expect(walletApi.createTopUp).toHaveBeenCalledWith("quote-1");
  });
});

describe("checkTopUpPayment", () => {
  it("verifies payment via status only", async () => {
    (walletApi.getTopUpStatus as jest.Mock).mockResolvedValueOnce(topUpData);

    const result = await checkTopUpPayment("topup-1");

    expect(result).toEqual(topUpData);
    expect(walletApi.getTopUpStatus).toHaveBeenCalledWith("topup-1");
    expect(walletApi.simulateTopUp).not.toHaveBeenCalled();
  });
});

const devFlag = globalThis as typeof globalThis & { __DEV__?: boolean };
const initialDevFlag = devFlag.__DEV__;

describe("simulateTopUpPayment", () => {
  afterEach(() => {
    if (initialDevFlag === undefined) delete devFlag.__DEV__;
    else devFlag.__DEV__ = initialDevFlag;
  });

  it("returns null and calls nothing outside development", async () => {
    devFlag.__DEV__ = false;

    const result = await simulateTopUpPayment("topup-1");

    expect(result).toBeNull();
    expect(walletApi.simulateTopUp).not.toHaveBeenCalled();
  });

  it("simulates the payment in development", async () => {
    (walletApi.simulateTopUp as jest.Mock).mockResolvedValueOnce(topUpData);
    devFlag.__DEV__ = true;

    const result = await simulateTopUpPayment("topup-1");

    expect(result).toEqual(topUpData);
    expect(walletApi.simulateTopUp).toHaveBeenCalledWith("topup-1");
  });
});
