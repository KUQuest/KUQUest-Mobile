import {
  walletApi,
  type TopUpData,
  type TopUpQuote,
  type UserTransaction,
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

export function formatHirerCardAmount(satang: number): string {
  const safeSatang = Math.max(0, satang || 0);
  const baht = Math.floor(safeSatang / 100);
  const cents = safeSatang % 100;
  const formattedBaht = baht.toLocaleString("en-US");
  return `฿ ${formattedBaht}.${String(cents).padStart(2, "0")}`;
}

export function formatHirerTransactionAmount(
  satang: number,
  direction: "INFLOW" | "OUTFLOW"
): {
  text: string;
  isInflow: boolean;
} {
  const isInflow = direction === "INFLOW";
  const sign = isInflow ? "+" : "-";
  const safeSatang = Math.max(0, satang || 0);
  const baht = Math.floor(safeSatang / 100);
  const cents = safeSatang % 100;
  const formattedBaht = baht.toLocaleString("en-US");
  return {
    text: `${sign} ฿${formattedBaht}.${String(cents).padStart(2, "0")}`,
    isInflow,
  };
}

export function formatTransactionDate(
  dateInput: string | Date,
  locale: "th" | "en" = "th"
): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return "";

  if (locale === "th") {
    try {
      return date.toLocaleDateString("th-TH-u-ca-buddhist", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      const thaiMonths = [
        "ม.ค.",
        "ก.พ.",
        "มี.ค.",
        "เม.ย.",
        "พ.ค.",
        "มิ.ย.",
        "ก.ค.",
        "ส.ค.",
        "ก.ย.",
        "ต.ค.",
        "พ.ย.",
        "ธ.ค.",
      ];
      const day = date.getDate();
      const month = thaiMonths[date.getMonth()];
      const year = date.getFullYear() + 543;
      return `${day} ${month} ${year}`;
    }
  }

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export type HirerTransactionIconKind =
  | "escrow_pay"
  | "top_up"
  | "unlock_pay"
  | "refund"
  | "fee"
  | "generic_inflow"
  | "generic_outflow";

export interface ClassifiedHirerTransaction {
  id: string;
  title: string;
  subtitle?: string;
  dateFormatted: string;
  amountText: string;
  isInflow: boolean;
  iconKind: HirerTransactionIconKind;
  status: string;
}

export function classifyHirerTransaction(
  tx: UserTransaction,
  locale: "th" | "en" = "th"
): ClassifiedHirerTransaction {
  const isTh = locale === "th";
  let title = isTh ? tx.titleTh : tx.title;
  let iconKind: HirerTransactionIconKind =
    tx.direction === "INFLOW" ? "generic_inflow" : "generic_outflow";
  let direction: "INFLOW" | "OUTFLOW" = tx.direction;

  if (tx.type === "HOLD") {
    title = isTh ? "พักเงินสำหรับเควสต์" : "Reserved for Quest";
    iconKind = "escrow_pay";
    direction = "OUTFLOW";
  } else if (tx.type === "TOP_UP") {
    title = isTh ? "เติมเงินเข้า Wallet" : "Top up to Wallet";
    iconKind = "top_up";
    direction = "INFLOW";
  } else if (tx.type === "RELEASE") {
    if (
      tx.direction === "INFLOW" ||
      (tx.spendingDeltaSatang && tx.spendingDeltaSatang > 0)
    ) {
      title = isTh ? "คืนเงินจากภารกิจ" : "Quest Refund";
      iconKind = "refund";
      direction = "INFLOW";
    } else {
      title = isTh ? "ปลดล็อกและจ่ายเงิน" : "Unlock & Pay";
      iconKind = "unlock_pay";
      direction = "OUTFLOW";
    }
  } else if (tx.type === "SPEND") {
    if (
      tx.resourceType === "platform_fee" ||
      (tx.reference && tx.reference.toLowerCase().includes("fee"))
    ) {
      title = isTh ? "ค่าธรรมเนียมระบบ" : "System Fee";
      iconKind = "fee";
      direction = "OUTFLOW";
    } else if (
      tx.resourceType === "quest_escrow" ||
      (tx.fundingReservedDeltaSatang && tx.fundingReservedDeltaSatang > 0)
    ) {
      title = isTh ? "พักเงินสำหรับเควสต์" : "Reserved for Quest";
      iconKind = "escrow_pay";
      direction = "OUTFLOW";
    } else if (
      tx.payoutReservedDeltaSatang &&
      tx.payoutReservedDeltaSatang > 0
    ) {
      title = isTh ? "ปลดล็อกและจ่ายเงิน" : "Unlock & Pay";
      iconKind = "unlock_pay";
      direction = "OUTFLOW";
    } else {
      title = isTh ? "พักเงินสำหรับเควสต์" : "Wallet Payment";
      iconKind = "escrow_pay";
      direction = "OUTFLOW";
    }
  } else if (tx.type === "EARN") {
    title = isTh ? "รายได้จากเควสต์" : "Quest Earnings";
    iconKind = "generic_inflow";
    direction = "INFLOW";
  } else if (tx.type === "CONVERT") {
    title = isTh ? "โอนรายได้เข้าสู่ยอดเงินพร้อมใช้" : "Converted to Spending";
    iconKind = "generic_inflow";
    direction = "INFLOW";
  }

  const { text: amountText, isInflow } = formatHirerTransactionAmount(
    tx.amountSatang,
    direction
  );
  const dateFormatted = formatTransactionDate(tx.createdAt, locale);

  let subtitle: string | undefined;
  if (tx.reference && !tx.reference.match(/^[0-9a-f-]{36}$/i)) {
    subtitle = tx.reference;
  }

  return {
    id: tx.id,
    title,
    subtitle,
    dateFormatted,
    amountText,
    isInflow,
    iconKind,
    status: tx.status,
  };
}
