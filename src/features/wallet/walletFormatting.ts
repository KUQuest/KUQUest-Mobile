import type { SupportedLocale } from "@/locales/locale";

export function formatTopUpExpiry(
  expiresAt: string,
  locale: SupportedLocale
): string {
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return expiresAt;
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
