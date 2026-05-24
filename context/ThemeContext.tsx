// ThemeProvider: tracks system color scheme by default, lets the user override
// via toggleTheme/setTheme. Override persists in AsyncStorage. Transitions
// use a full-screen overlay fade (320ms) to avoid a jarring color flash.
// Provider de tema: segue o sistema, override manual persiste, cross-fade animado.

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
  ThemeProvider as NavThemeProvider,
} from "@react-navigation/native";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Animated, StyleSheet, useColorScheme, View } from "react-native";

import { STORAGE_KEYS } from "@/lib/storage-keys";
import {
  elevationDark,
  elevationLight,
  palette,
  type Elevation,
  type ThemeColors,
  type ThemeMode,
} from "@/lib/theme";

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ThemeColors;
  elevation: Elevation;
  /** true when there is a stored user override; false when following system. */
  isOverridden: boolean;
  /** true when AsyncStorage hydration finished — gate splash screens on this. */
  isHydrated: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  /** Clear override and follow useColorScheme() again. */
  resetToSystem: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const FADE_DURATION_MS = 320;

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  // Glass Minimalist design ships dark as the canonical mode. Users can opt
  // into light via the Profile switch. Following the system would surprise
  // anyone whose OS is in light by hiding the design's signature look, and
  // react-native-web's useColorScheme misfires on Windows browsers.
  // Default dark sempre; light eh opt-in via switch.
  const systemMode: ThemeMode = "dark";
  // Unused — kept on purpose so we can revisit follow-system if the product
  // decides to honor it later. Avoids a noisy refactor when re-enabled.
  void systemScheme;

  // override === null means "follow system"; otherwise it pins the mode.
  const [override, setOverride] = useState<ThemeMode | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Cross-fade overlay — when the mode flips, we capture the old bg color,
  // paint it on top, then fade to 0 to reveal the new palette underneath.
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [overlayColor, setOverlayColor] = useState<string | null>(null);

  // Boot: read stored override. If absent, keep null (follow system).
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEYS.THEME)
      .then((stored: string | null) => {
        if (cancelled) return;
        if (isThemeMode(stored)) setOverride(stored);
      })
      .finally(() => {
        if (!cancelled) setIsHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const mode: ThemeMode = override ?? systemMode;

  const animateTransition = useCallback(
    (fromMode: ThemeMode) => {
      setOverlayColor(palette[fromMode].bg);
      overlayOpacity.setValue(1);
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: FADE_DURATION_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setOverlayColor(null);
      });
    },
    [overlayOpacity],
  );

  const persistOverride = useCallback((next: ThemeMode | null) => {
    if (next === null) {
      AsyncStorage.removeItem(STORAGE_KEYS.THEME).catch(() => {
        // storage failures should not block UX
      });
    } else {
      AsyncStorage.setItem(STORAGE_KEYS.THEME, next).catch(() => {
        // storage failures should not block UX
      });
    }
  }, []);

  const setTheme = useCallback(
    (next: ThemeMode) => {
      const prev = override ?? systemMode;
      if (prev !== next) animateTransition(prev);
      setOverride(next);
      persistOverride(next);
    },
    [override, systemMode, animateTransition, persistOverride],
  );

  const toggleTheme = useCallback(() => {
    const prev = override ?? systemMode;
    const next: ThemeMode = prev === "dark" ? "light" : "dark";
    animateTransition(prev);
    setOverride(next);
    persistOverride(next);
  }, [override, systemMode, animateTransition, persistOverride]);

  const resetToSystem = useCallback(() => {
    const prev = override ?? systemMode;
    if (prev !== systemMode) animateTransition(prev);
    setOverride(null);
    persistOverride(null);
  }, [override, systemMode, animateTransition, persistOverride]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors: palette[mode],
      elevation: mode === "dark" ? elevationDark : elevationLight,
      isOverridden: override !== null,
      isHydrated,
      toggleTheme,
      setTheme,
      resetToSystem,
    }),
    [mode, override, isHydrated, toggleTheme, setTheme, resetToSystem],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        {overlayColor ? (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              styles.overlay,
              { backgroundColor: overlayColor, opacity: overlayOpacity },
            ]}
          />
        ) : null}
      </View>
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { zIndex: 9999 },
});

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return ctx;
}

// Bridges our ThemeContext into @react-navigation/native's ThemeProvider.
// Without this, expo-router's Stack/Tabs paint screen containers with
// NavDefaultTheme.colors.background (#F2F2F2) on top of MeshBackground,
// regardless of contentStyle on screenOptions. Transparent background + card
// let the root MeshBackground show through every route.
// Bridge: nav containers ficam transparentes pro mesh aparecer em todas as rotas.
export function NavigationThemeBridge({ children }: { children: ReactNode }) {
  const { colors, mode } = useTheme();
  const navTheme = useMemo(() => {
    const base = mode === "dark" ? NavDarkTheme : NavDefaultTheme;
    return {
      ...base,
      dark: mode === "dark",
      colors: {
        ...base.colors,
        background: "transparent",
        card: "transparent",
        text: colors.text,
        primary: colors.primary,
        border: colors.border,
        notification: colors.error,
      },
    };
  }, [mode, colors]);
  return <NavThemeProvider value={navTheme}>{children}</NavThemeProvider>;
}
