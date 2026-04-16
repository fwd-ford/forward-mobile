// i18n bootstrap. Language is detected from the device; falls back to pt-BR.
// Bootstrap de i18n: detecta do dispositivo, fallback pt-BR.

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { NativeModules, Platform } from "react-native";

import en from "./en.json";
import ptBR from "./pt-BR.json";

function detectLocale(): string {
  try {
    const tag =
      Platform.OS === "ios"
        ? NativeModules.SettingsManager?.settings?.AppleLocale ??
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        : NativeModules.I18nManager?.localeIdentifier;
    return typeof tag === "string" ? tag.replace("_", "-") : "pt-BR";
  } catch {
    return "pt-BR";
  }
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    "pt-BR": { translation: ptBR },
  },
  lng: detectLocale(),
  fallbackLng: "pt-BR",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v4",
});

export default i18n;
