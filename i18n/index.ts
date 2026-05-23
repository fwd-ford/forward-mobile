// i18n bootstrap. Initial language is detected from the device and mapped to
// one of our supported locales. LocaleContext is in charge of applying a
// persisted user override on top of this at app startup.
// Bootstrap do i18n: locale inicial via device; LocaleContext aplica override
// persistido depois.

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { NativeModules, Platform } from "react-native";

import { isLocale, type Locale } from "@/lib/locale";

import en from "./en.json";
import ptBR from "./pt-BR.json";

/** Reads the device locale and maps it onto a supported Locale, defaulting to pt-BR. */
export function detectDeviceLocale(): Locale {
  try {
    const tag =
      Platform.OS === "ios"
        ? NativeModules.SettingsManager?.settings?.AppleLocale ??
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        : NativeModules.I18nManager?.localeIdentifier;
    if (typeof tag !== "string") return "pt-BR";
    const normalized = tag.replace("_", "-");
    if (isLocale(normalized)) return normalized;
    // Map base language (e.g. "en-US" -> "en", "pt-PT" -> "pt-BR").
    if (normalized.startsWith("en")) return "en";
    if (normalized.startsWith("pt")) return "pt-BR";
    return "pt-BR";
  } catch {
    return "pt-BR";
  }
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    "pt-BR": { translation: ptBR },
  },
  lng: detectDeviceLocale(),
  fallbackLng: "pt-BR",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v4",
});

export default i18n;
