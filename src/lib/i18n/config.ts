export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];

export const LOCALE_COOKIE = "forma-locale";
export const LOCALE_STORAGE_KEY = "forma-locale";
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return value === "es" || value === "en";
}
