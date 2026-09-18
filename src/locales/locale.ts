export type SupportedLocale = "th" | "en";

export const DEFAULT_LOCALE: SupportedLocale = "th";
export const LOCALE_STORAGE_KEY = "kuquest_user_locale";

export function getDeviceLocale(): SupportedLocale {
  return DEFAULT_LOCALE;
}
