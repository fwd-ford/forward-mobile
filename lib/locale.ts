// Locale metadata. Two supported codes today (BCP-47 tags matching i18n
// resource keys). Add new entries here and in i18n/<code>.json together.
// Locales suportados: pt-BR (default) e en.

export type Locale = "pt-BR" | "en";

export const LOCALES: readonly Locale[] = ["pt-BR", "en"] as const;

export const LOCALE_LABEL: Record<Locale, string> = {
  "pt-BR": "Português (Brasil)",
  en: "English",
};

/** Two-letter short code for compact UI (chips, selectors). */
export const LOCALE_SHORT: Record<Locale, string> = {
  "pt-BR": "PT",
  en: "EN",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "pt-BR" || value === "en";
}
