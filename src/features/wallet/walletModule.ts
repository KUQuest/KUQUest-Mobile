import {
  walletApi,
  type TopUpData,
  type TopUpQuote,
  type WalletBalances,
} from "@/api/WalletApi";
import { parseSatangInput } from "@/domain/satang";

/**
 * Client-side rules and lifecycle sequencing for the Wallet slice.
 *
 * The Server is the sole authority for money calculation
 * (docs/rulebook/finance/money-policy-contract.md): this module never derives
 * fees or totals. Permitted client arithmetic is Satang parsing, comparison
 * against stated bounds, and summing the four compartments to check the
 * capacity ceiling.
 */

export const MIN_TOP_UP_SATANG = 1_000;
export const MAX_WALLET_SATANG = 2_000_000_000;

export interface WalletCompartments {
  spendingSatang: number;
  earningsSatang: number;
  fundingReservedSatang: number;
  payoutReserveSatang: number;
  totalSatang: number;
}

export function toCompartments(balances: WalletBalances): WalletCompartments {
  const spendingSatang = balances.spendingBalanceSatang;
  const earningsSatang = balances.earningsBalanceSatang;
  const fundingReservedSatang = balances.fundingReservedSatang;
  const payoutReserveSatang = balances.reservedForPayoutsSatang;
  return {
    spendingSatang,
    earningsSatang,
    fundingReservedSatang,
    payoutReserveSatang,
    totalSatang:
      spendingSatang +
      earningsSatang +
      fundingReservedSatang +
      payoutReserveSatang,
  };
}

export type AmountRejection =
  "INVALID" | "BELOW_MINIMUM" | "ABOVE_CEILING" | "INSUFFICIENT_BALANCE";

export type AmountCheck =
  { ok: true; satang: number } | { ok: false; reason: AmountRejection };

export function checkTopUpAmount(
  input: string,
  compartments?: WalletCompartments | null
): AmountCheck {
  const satang = parseSatangInput(input);
  if (satang === null) {
    return { ok: false, reason: "INVALID" };
  }
  if (satang < MIN_TOP_UP_SATANG) {
    return { ok: false, reason: "BELOW_MINIMUM" };
  }
  if (compartments && compartments.totalSatang + satang > MAX_WALLET_SATANG) {
    return { ok: false, reason: "ABOVE_CEILING" };
  }
  return { ok: true, satang };
}

export function checkConversionAmount(
  amountSatang: number,
  compartments: WalletCompartments
): AmountCheck {
  if (!Number.isSafeInteger(amountSatang) || amountSatang <= 0) {
    return { ok: false, reason: "INVALID" };
  }
  if (amountSatang > compartments.earningsSatang) {
    return { ok: false, reason: "INSUFFICIENT_BALANCE" };
  }
  // A conversion moves satang between compartments, so the post-conversion
  // total equals totalSatang; reject only a wallet already past the ceiling.
  if (compartments.totalSatang > MAX_WALLET_SATANG) {
    return { ok: false, reason: "ABOVE_CEILING" };
  }
  return { ok: true, satang: amountSatang };
}

export function isQuoteExpired(quote: TopUpQuote, now: Date): boolean {
  const expiresAtMs = Date.parse(quote.expiresAt);
  return Number.isNaN(expiresAtMs) || expiresAtMs <= now.getTime();
}

export type TopUpCreation =
  { ok: true; topUp: TopUpData } | { ok: false; reason: "QUOTE_EXPIRED" };

export async function requestTopUpQuote(
  amountSatang: number
): Promise<TopUpQuote> {
  return walletApi.quoteTopUp(amountSatang);
}

export async function createTopUpFromQuote(
  quote: TopUpQuote,
  now: Date
): Promise<TopUpCreation> {
  if (isQuoteExpired(quote, now)) {
    return { ok: false, reason: "QUOTE_EXPIRED" };
  }
  const topUp = await walletApi.createTopUp(quote.id);
  return { ok: true, topUp };
}

export async function checkTopUpPayment(topUpId: string): Promise<TopUpData> {
  return walletApi.getTopUpStatus(topUpId);
}

export async function simulateTopUpPayment(
  topUpId: string
): Promise<TopUpData | null> {
  // POST /api/v1/top-ups/{id}/simulate is documented nowhere; production
  // payment verification uses getTopUpStatus, so simulation stays dev-only.
  if (!__DEV__) {
    return null;
  }
  return walletApi.simulateTopUp(topUpId);
}

export async function convertEarnings(
  amountSatang: number,
  compartments: WalletCompartments
): Promise<AmountCheck> {
  const check = checkConversionAmount(amountSatang, compartments);
  if (!check.ok) {
    return check;
  }
  await walletApi.convertEarnings(amountSatang);
  return { ok: true, satang: amountSatang };
}
