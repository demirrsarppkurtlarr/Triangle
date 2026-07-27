"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  DEFAULT_LOCALE,
  getDictionary,
  LOCALE_COOKIE,
  type Dictionary,
  type Locale,
} from "@/lib/i18n/dictionaries";
import { setLocaleAction } from "@/features/settings/actions/settings.actions";

type I18nContextValue = {
  locale: Locale;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
  isPending: boolean;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function writeLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`;
}

type I18nProviderProps = {
  initialLocale?: Locale;
  children: React.ReactNode;
};

export function I18nProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [isPending, startTransition] = useTransition();

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    writeLocaleCookie(next);
    startTransition(() => {
      void setLocaleAction(next);
    });
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: getDictionary(locale),
      setLocale,
      isPending,
    }),
    [locale, setLocale, isPending],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: DEFAULT_LOCALE,
      t: getDictionary(DEFAULT_LOCALE),
      setLocale: () => undefined,
      isPending: false,
    } satisfies I18nContextValue;
  }
  return ctx;
}
