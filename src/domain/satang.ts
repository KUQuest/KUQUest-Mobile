export const SATANG_PER_BAHT = 100;

export function isValidSatang(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

/** Parse a user-entered THB amount without using floating-point arithmetic. */
export function parseSatangInput(value: string): number | null {
  const trimmed = value.trim();
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(trimmed);
  if (!match) return null;
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(2, "0") || "0");
  const satang = whole * SATANG_PER_BAHT + fraction;
  return Number.isSafeInteger(satang) ? satang : null;
}

export type SatangFormat = "compact" | "exact" | "signed";

export function formatSatang(
  value: number,
  locale: "en" | "th",
  format: SatangFormat = "compact"
): string {
  const signed = format === "signed";
  const sign = signed ? (value < 0 ? "-" : "+") : "";
  const absoluteValue = signed ? Math.abs(value) : value;
  if (!isValidSatang(absoluteValue)) return "฿0";
  const baht = Math.floor(absoluteValue / SATANG_PER_BAHT);
  const satang = absoluteValue % SATANG_PER_BAHT;
  const formattedBaht = baht.toLocaleString(
    locale === "th" ? "th-TH" : "en-US"
  );
  if (format === "exact" || signed) {
    return `${sign}฿${formattedBaht}.${String(satang).padStart(2, "0")}`;
  }
  return satang === 0
    ? `฿${formattedBaht}`
    : `฿${formattedBaht}.${String(satang).padStart(2, "0")}`;
}
