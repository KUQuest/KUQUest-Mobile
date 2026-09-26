import {
  WalletTransactionTitleKey,
  walletApi,
  type TopUpData,
  type TopUpQuote,
  type UserTransaction,
  type WalletBalances,
} from "@/api/WalletApi";
import { parseSatangInput } from "@/domain/satang";
import { formatTimeInBangkok, formatTimestampDate } from "@/domain/datetime";
import type { SupportedLocale } from "@/locales/locale";
import { walletMessages } from "@/locales/walletMessages";

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

export function formatTransactionDate(
  dateInput: string | Date,
  locale: SupportedLocale
): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return "";
  return formatTimestampDate(date, locale) ?? "";
}

export type HirerTransactionIconKind =
  | "escrow_pay"
  | "top_up"
  | "unlock_pay"
  | "refund"
  | "fee"
  | "generic_inflow"
  | "generic_outflow";

export type TransactionStatusKind =
  "completed" | "pending" | "failed" | "expired";

export function formatTransactionStatus(
  status: string,
  locale: SupportedLocale
): { label: string; kind: TransactionStatusKind } {
  const upper = status.toUpperCase();
  const messages = walletMessages[locale];

  if (
    upper === "COMPLETED" ||
    upper === "PAID" ||
    upper === "SUCCEEDED" ||
    upper === "SETTLED"
  ) {
    return { label: messages.statusCompleted, kind: "completed" };
  }
  if (
    upper.includes("PENDING") ||
    upper.includes("SUBMITTED") ||
    upper === "WAITING"
  ) {
    return { label: messages.statusPending, kind: "pending" };
  }
  if (upper === "EXPIRED") {
    return { label: messages.statusExpired, kind: "expired" };
  }
  return { label: messages.statusFailed, kind: "failed" };
}

export function formatTransactionTime(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return "";
  return formatTimeInBangkok(date);
}

export interface ClassifiedHirerTransaction {
  id: string;
  title: string;
  subtitle?: string;
  dateFormatted: string;
  timeFormatted: string;
  amountSatang: number;
  isInflow: boolean;
  iconKind: HirerTransactionIconKind;
  status: string;
  statusLabel: string;
  statusKind: TransactionStatusKind;
  type: string;
  sourceApi: "ACTIVITIES" | "TOP_UPS" | "PAYOUTS";
  sourceApiLabel: string;
  reference?: string;
  destinationInfo?: string;
  createdAt: string;
}

export function classifyHirerTransaction(
  tx: UserTransaction,
  locale: SupportedLocale
): ClassifiedHirerTransaction {
  const messages = walletMessages[locale];
  let titleKey = tx.titleKey;
  let iconKind: HirerTransactionIconKind =
    tx.direction === "INFLOW" ? "generic_inflow" : "generic_outflow";
  let direction: "INFLOW" | "OUTFLOW" = tx.direction;

  if (tx.type === "HOLD") {
    titleKey = WalletTransactionTitleKey.RESERVED_FOR_QUEST;
    iconKind = "escrow_pay";
    direction = "OUTFLOW";
  } else if (tx.type === "TOP_UP") {
    titleKey = WalletTransactionTitleKey.TOP_UP_TO_WALLET;
    iconKind = "top_up";
    direction = "INFLOW";
  } else if (tx.type === "RELEASE") {
    if (
      tx.direction === "INFLOW" ||
      (tx.spendingDeltaSatang && tx.spendingDeltaSatang > 0)
    ) {
      titleKey = WalletTransactionTitleKey.QUEST_REFUND;
      iconKind = "refund";
      direction = "INFLOW";
    } else {
      titleKey = WalletTransactionTitleKey.UNLOCK_AND_PAY;
      iconKind = "unlock_pay";
      direction = "OUTFLOW";
    }
  } else if (tx.type === "SPEND") {
    if (
      tx.resourceType === "platform_fee" ||
      (tx.reference && tx.reference.toLowerCase().includes("fee"))
    ) {
      titleKey = WalletTransactionTitleKey.SYSTEM_FEE;
      iconKind = "fee";
      direction = "OUTFLOW";
    } else if (
      tx.resourceType === "quest_escrow" ||
      (tx.fundingReservedDeltaSatang && tx.fundingReservedDeltaSatang > 0)
    ) {
      titleKey = WalletTransactionTitleKey.RESERVED_FOR_QUEST;
      iconKind = "escrow_pay";
      direction = "OUTFLOW";
    } else if (
      tx.payoutReservedDeltaSatang &&
      tx.payoutReservedDeltaSatang > 0
    ) {
      titleKey = WalletTransactionTitleKey.UNLOCK_AND_PAY;
      iconKind = "unlock_pay";
      direction = "OUTFLOW";
    } else {
      iconKind = "escrow_pay";
      direction = "OUTFLOW";
    }
  } else if (tx.type === "EARN") {
    iconKind = "generic_inflow";
    direction = "INFLOW";
  } else if (tx.type === "CONVERT") {
    titleKey = WalletTransactionTitleKey.CONVERTED_TO_SPENDING;
    iconKind = "generic_inflow";
    direction = "INFLOW";
  } else if (tx.type === "PAYOUT") {
    iconKind = "unlock_pay";
    direction = "OUTFLOW";
  }

  const isInflow = direction === "INFLOW";
  const dateFormatted = formatTransactionDate(tx.createdAt, locale);
  const timeFormatted = formatTransactionTime(tx.createdAt);
  const { label: statusLabel, kind: statusKind } = formatTransactionStatus(
    tx.status,
    locale
  );

  let subtitle: string | undefined;
  if (tx.destinationInfo) {
    subtitle = tx.destinationInfo;
  } else if (tx.reference && !tx.reference.match(/^[0-9a-f-]{36}$/i)) {
    subtitle = tx.reference;
  }

  const sourceApi =
    tx.sourceApi ??
    (tx.type === "TOP_UP"
      ? "TOP_UPS"
      : tx.type === "PAYOUT"
        ? "PAYOUTS"
        : "ACTIVITIES");

  const sourceApiLabel =
    sourceApi === "TOP_UPS"
      ? messages.sourceTopUps
      : sourceApi === "PAYOUTS"
        ? messages.sourcePayouts
        : messages.sourceActivities;

  return {
    id: tx.id,
    title: messages.transactionTitles[titleKey],
    subtitle,
    dateFormatted,
    timeFormatted,
    amountSatang: tx.amountSatang,
    isInflow,
    iconKind,
    status: tx.status,
    statusLabel,
    statusKind,
    type: tx.type,
    sourceApi,
    sourceApiLabel,
    reference: tx.reference,
    destinationInfo: tx.destinationInfo,
    createdAt: tx.createdAt,
  };
}
