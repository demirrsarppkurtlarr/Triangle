import { cookies } from "next/headers";

import {
  DEFAULT_LOCALE,
  getDictionary,
  LOCALE_COOKIE,
  type Dictionary,
  type Locale,
} from "@/lib/i18n/dictionaries";

export function parseLocale(value: string | undefined | null): Locale {
  return value === "en" ? "en" : "tr";
}

export async function getRequestLocale(): Promise<Locale> {
  const jar = await cookies();
  return parseLocale(jar.get(LOCALE_COOKIE)?.value ?? DEFAULT_LOCALE);
}

export async function getRequestDictionary(): Promise<{
  locale: Locale;
  t: Dictionary;
}> {
  const locale = await getRequestLocale();
  return { locale, t: getDictionary(locale) };
}
