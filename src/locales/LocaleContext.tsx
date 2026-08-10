import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SupportedLocale } from './RegistrationMessages3';

interface LocaleContextType {
  locale: SupportedLocale;
  toggleLocale: () => void;
  setLocale: (locale: SupportedLocale) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<SupportedLocale>('th');

  const toggleLocale = () => {
    setLocale((prev) => (prev === 'th' ? 'en' : 'th'));
  };

  return (
    <LocaleContext.Provider value={{ locale, toggleLocale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
