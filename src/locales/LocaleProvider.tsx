import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type SupportedLocale = "th" | "en";

export const DEFAULT_LOCALE: SupportedLocale = "th";
export const LOCALE_STORAGE_KEY = "kuquest_locale";

function isSupportedLocale(value: string | null): value is SupportedLocale {
  return value === "th" || value === "en";
}

interface LocaleContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const hasManualSelection = useRef(false);

  useEffect(() => {
    let mounted = true;

    void SecureStore.getItemAsync(LOCALE_STORAGE_KEY)
      .then((storedLocale) => {
        if (
          mounted &&
          !hasManualSelection.current &&
          isSupportedLocale(storedLocale)
        ) {
          setLocaleState(storedLocale);
        }
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const setLocale = useCallback((nextLocale: SupportedLocale) => {
    hasManualSelection.current = true;
    setLocaleState(nextLocale);
    void SecureStore.setItemAsync(LOCALE_STORAGE_KEY, nextLocale).catch(
      () => undefined
    );
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}
