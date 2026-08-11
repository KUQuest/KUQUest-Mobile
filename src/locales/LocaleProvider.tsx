import { AppState, AppStateStatus } from 'react-native';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { getLocales } from 'expo-localization';

export type SupportedLocale = 'th' | 'en';

export function getDeviceLocale(): SupportedLocale {
  return getLocales()[0]?.languageCode === 'th' ? 'th' : 'en';
}

interface LocaleContextValue {
  locale: SupportedLocale;
}

const LocaleContext = createContext<LocaleContextValue>({ locale: getDeviceLocale() });

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<SupportedLocale>(getDeviceLocale);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        setLocale(getDeviceLocale());
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  return <LocaleContext.Provider value={{ locale }}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}
