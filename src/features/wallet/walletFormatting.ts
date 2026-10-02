import { formatTimestamp } from "@/domain/datetime";
import type { SupportedLocale } from "@/locales/locale";

export function formatTopUpExpiry(
  expiresAt: string,
  locale: SupportedLocale
): string {
  return formatTimestamp(expiresAt, locale, expiresAt);
}
