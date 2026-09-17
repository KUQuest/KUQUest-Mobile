import * as SecureStore from "expo-secure-store";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export type SupportedLocale = "th" | "en";

export const DEFAULT_LOCALE: SupportedLocale = "th";
export const LOCALE_STORAGE_KEY = "kuquest_user_locale";

export function getDeviceLocale(): SupportedLocale {
  return DEFAULT_LOCALE;
}

export interface LocaleContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => Promise<void>;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: async () => {},
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(DEFAULT_LOCALE);

  useEffect(() => {
    const loadLocale = async () => {
      try {
        const storedLocale = await SecureStore.getItemAsync(LOCALE_STORAGE_KEY);
        if (storedLocale === "th" || storedLocale === "en") {
          setLocaleState(storedLocale);
        }
      } catch {
        // Gracefully fall back to the default locale when storage is unavailable.
      }
    };

    void loadLocale();
  }, []);

  const setLocale = async (nextLocale: SupportedLocale) => {
    setLocaleState(nextLocale);
    try {
      await SecureStore.setItemAsync(LOCALE_STORAGE_KEY, nextLocale);
    } catch {
      // Gracefully handle storage write errors.
    }
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}
