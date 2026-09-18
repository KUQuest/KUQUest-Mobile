import { create } from "zustand";

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  type SupportedLocale,
} from "@/locales/locale";
import { secureStorage } from "@/infrastructure/storage/keyValueStorage";

interface LocaleStoreState {
  locale: SupportedLocale;
  setLocale: (nextLocale: SupportedLocale) => Promise<void>;
  hydrateLocale: () => Promise<void>;
}

export const useLocaleStore = create<LocaleStoreState>((set) => ({
  locale: DEFAULT_LOCALE,
  setLocale: async (nextLocale) => {
    set({ locale: nextLocale });
    try {
      await secureStorage.set(LOCALE_STORAGE_KEY, nextLocale);
    } catch {
      // Locale state is already updated when persistence fails.
    }
  },
  hydrateLocale: async () => {
    try {
      const storedLocale = await secureStorage.get(LOCALE_STORAGE_KEY);
      if (storedLocale === "th" || storedLocale === "en") {
        set({ locale: storedLocale });
      }
    } catch {
      // Keep the default locale when persistence is unavailable.
    }
  },
}));

export function useLocale() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  return { locale, setLocale };
}
