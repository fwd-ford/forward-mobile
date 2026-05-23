// LocaleProvider: thin layer over react-i18next. Owns the persisted user
// override in AsyncStorage and keeps i18next.language in sync. When no override
// is stored, the locale follows the device locale detected at boot.
// Provider de locale: persiste override do usuario, mantem i18next em sincronia.

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";

import i18n, { detectDeviceLocale } from "@/i18n";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { isLocale, LOCALES, type Locale } from "@/lib/locale";

type LocaleContextValue = {
  locale: Locale;
  /** Supported locales for picker UIs. */
  locales: readonly Locale[];
  setLocale: (l: Locale) => void;
  isHydrated: boolean;
  /** true when a user override is persisted; false when following the device. */
  isOverridden: boolean;
  /** Drop the override and follow the device locale again. */
  resetToSystem: () => void;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  // i18n already exposes the active language reactively via useTranslation —
  // we read i18n.language through it so any setLocale call re-renders consumers.
  const { i18n: i18nInstance } = useTranslation();
  const activeLocale: Locale = isLocale(i18nInstance.language)
    ? i18nInstance.language
    : detectDeviceLocale();

  const [override, setOverride] = useState<Locale | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Boot: apply persisted override on top of the device-detected locale.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEYS.LOCALE)
      .then((stored: string | null) => {
        if (cancelled) return;
        if (isLocale(stored)) {
          setOverride(stored);
          if (i18n.language !== stored) void i18n.changeLanguage(stored);
        }
      })
      .finally(() => {
        if (!cancelled) setIsHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persistOverride = useCallback((next: Locale | null) => {
    if (next === null) {
      AsyncStorage.removeItem(STORAGE_KEYS.LOCALE).catch(() => {
        // storage failures should not block UX
      });
    } else {
      AsyncStorage.setItem(STORAGE_KEYS.LOCALE, next).catch(() => {
        // storage failures should not block UX
      });
    }
  }, []);

  const setLocale = useCallback(
    (next: Locale) => {
      setOverride(next);
      persistOverride(next);
      if (i18n.language !== next) void i18n.changeLanguage(next);
    },
    [persistOverride],
  );

  const resetToSystem = useCallback(() => {
    const device = detectDeviceLocale();
    setOverride(null);
    persistOverride(null);
    if (i18n.language !== device) void i18n.changeLanguage(device);
  }, [persistOverride]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale: activeLocale,
      locales: LOCALES,
      setLocale,
      isHydrated,
      isOverridden: override !== null,
      resetToSystem,
    }),
    [activeLocale, override, isHydrated, setLocale, resetToSystem],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used inside <LocaleProvider>");
  }
  return ctx;
}
