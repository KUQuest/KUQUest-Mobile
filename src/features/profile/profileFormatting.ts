import type { SupportedLocale } from "@/locales/locale";

const monthYearFormatters: Record<SupportedLocale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }),
  th: new Intl.DateTimeFormat("th-TH", {
    month: "short",
    year: "numeric",
  }),
};

/** Formats a profile date such as a certificate issue date as month and year. */
export function formatDisplayMonthYear(
  value: string | Date | null | undefined,
  locale: SupportedLocale = "en"
): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "";
  }
  return monthYearFormatters[locale].format(date);
}
