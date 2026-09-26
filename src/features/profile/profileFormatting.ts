import type { SupportedLocale } from "@/locales/locale";
import { formatCalendarMonthYear } from "@/domain/datetime";

/** Formats a profile date such as a certificate issue date as month and year. */
export function formatDisplayMonthYear(
  value: string | Date | null | undefined,
  locale: SupportedLocale
): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "";
  }
  return formatCalendarMonthYear(date, locale);
}
