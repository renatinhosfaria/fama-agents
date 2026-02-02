import type { Locale, TranslationKey, TranslationKeys, TranslationParams } from "./types.js";
import { en } from "./en.js";
import { ptBR } from "./pt-BR.js";

export type { Locale, TranslationKey, TranslationKeys, TranslationParams, TranslateFn } from "./types.js";

const locales: Record<Locale, TranslationKeys> = {
  en,
  "pt-BR": ptBR,
};

let currentLocale: Locale = "pt-BR";
let currentTranslations: TranslationKeys = ptBR;
let initialized = false;

/**
 * Initialize the i18n system with the given locale.
 * Falls back to "en" if the locale is not supported.
 * Subsequent calls are no-ops unless `force` is true.
 */
export function initI18n(locale?: string, force = false): void {
  if (initialized && !force) return;

  if (locale && locale in locales) {
    currentLocale = locale as Locale;
  } else if (locale) {
    // Try prefix match (e.g. "pt" → "pt-BR")
    const match = Object.keys(locales).find((k) => k.startsWith(locale)) as Locale | undefined;
    currentLocale = match ?? "en";
  }
  currentTranslations = locales[currentLocale];
  initialized = true;
}

/**
 * Reset the i18n system (useful for testing).
 */
export function resetI18n(): void {
  currentLocale = "pt-BR";
  currentTranslations = ptBR;
  initialized = false;
}

/**
 * Returns the current locale.
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Returns a list of supported locales.
 */
export function getSupportedLocales(): Locale[] {
  return Object.keys(locales) as Locale[];
}

/**
 * Translate a key, interpolating `{param}` placeholders.
 *
 * @example
 * t("cli.run.agent", { agent: "feature-developer" })
 * // → "Agent: feature-developer"  (en)
 * // → "Agente: feature-developer" (pt-BR)
 */
export function t(key: TranslationKey, params?: TranslationParams): string {
  let text = currentTranslations[key];

  if (text === undefined) {
    // Fallback to English, then to the raw key
    text = en[key] ?? key;
  }

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }

  return text;
}
