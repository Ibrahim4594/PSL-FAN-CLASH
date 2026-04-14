'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { type Locale, t as translate, getDirection } from './i18n';

interface LocaleContextValue {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  toggle: () => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  dir: 'ltr',
  toggle: () => {},
  t: (key: string) => key,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');

  const toggle = useCallback(() => {
    setLocale(prev => prev === 'en' ? 'ur' : 'en');
  }, []);

  const tFn = useCallback((key: string) => translate(key, locale), [locale]);

  return (
    <LocaleContext.Provider value={{ locale, dir: getDirection(locale), toggle, t: tFn }}>
      {children}
    </LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);
