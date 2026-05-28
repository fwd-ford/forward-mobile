// Design tokens for the ForwardService mobile app — Glass Minimalist redesign.
// Light + dark palettes keyed by semantic tokens. Screens consume via useTheme().
// Spec: docs/superpowers/specs/2026-05-23-glass-minimalist-design.md
//
// Tokens de design: paletas light/dark, glass, tipografia Fraunces+Inter.

import { Platform } from "react-native";

export type ThemeMode = "light" | "dark";

export type ThemeColors = {
  // Base surfaces
  bg: string;
  bgDeep: string;
  bgElevated: string;
  surface: string;
  surfaceElevated: string;
  surfaceHover: string;
  // Glass (new): semi-transparent, paired with backdrop-blur at the consumer.
  glassBase: string;
  glassBorder: string;
  // Borders + separators
  border: string;
  borderStrong: string;
  separator: string;
  // Text
  text: string;
  textMuted: string;
  textSubtle: string;
  // Primary CTA — white pill in dark, dark pill in light (TIDE-style).
  // Brand fordBlue is exported separately and used ONLY in the wordmark.
  primary: string;
  primaryDeep: string;
  primaryText: string;
  primarySoft: string;
  // Status / semantic
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  error: string;
  errorSoft: string;
  critical: string;
  // Misc
  overlay: string;
  tabBar: string;
  inputBg: string;
  // Home redesign tokens (Figma node 1:2 light / 8:55 dark).
  bgGradientFrom: string;
  bgGradientTo: string;
  heroVerticalBg: string;
  heroVerticalBorder: string;
  clockGradientFrom: string;
  clockGradientMid: string;
  clockGradientTo: string;
  leadCardCompactBg: string;
  leadCardCompactText: string;
  bottomBarBg: string;
};

// Ford Blue is the brand mark. Used ONLY on the FORD wordmark + logo glyph.
// Never on CTAs, switches, tabs, or any interactive surface.
// Azul Ford apenas no wordmark/logo. Nunca em UI interativa.
export const FORD_BLUE = "#003478";
export const FORD_BLUE_DEEP = "#002356";

export const palette: Record<ThemeMode, ThemeColors> = {
  light: {
    bg: "#FAFAFA",
    bgDeep: "#F0F0F2",
    bgElevated: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    surfaceHover: "#F4F4F6",
    glassBase: "rgba(255, 255, 255, 0.65)",
    glassBorder: "rgba(0, 0, 0, 0.06)",
    border: "rgba(0, 0, 0, 0.08)",
    borderStrong: "rgba(0, 0, 0, 0.14)",
    separator: "rgba(0, 0, 0, 0.05)",
    text: "#1A1A1A",
    textMuted: "#6B7280",
    textSubtle: "#9CA3AF",
    primary: "#1A1A1A",
    primaryDeep: "#000000",
    primaryText: "#FAFAFA",
    primarySoft: "rgba(26, 26, 26, 0.06)",
    success: "#0F8A5F",
    successSoft: "rgba(15, 138, 95, 0.10)",
    warning: "#B5670A",
    warningSoft: "rgba(181, 103, 10, 0.10)",
    error: "#C7363A",
    errorSoft: "rgba(199, 54, 58, 0.10)",
    critical: "#A11A20",
    overlay: "rgba(11, 18, 32, 0.40)",
    tabBar: "rgba(255, 255, 255, 0.78)",
    inputBg: "rgba(255, 255, 255, 0.60)",
    // Home redesign — Figma node 1:2 (light).
    bgGradientFrom: "#f0e9e9",
    bgGradientTo: "#4b4b4b",
    heroVerticalBg: "rgba(255, 255, 255, 0.51)",
    heroVerticalBorder: "#c5c5c5",
    clockGradientFrom: "rgba(0, 0, 0, 0.09)",
    clockGradientMid: "rgba(51, 51, 51, 0.49)",
    clockGradientTo: "#666666",
    leadCardCompactBg: "rgba(217, 217, 217, 0.66)",
    leadCardCompactText: "#3a3838",
    bottomBarBg: "rgba(238, 238, 238, 0.98)",
  },
  dark: {
    bg: "#1E1E1E",
    bgDeep: "#161616",
    bgElevated: "#252525",
    surface: "#252525",
    surfaceElevated: "#2A2A2A",
    surfaceHover: "#303030",
    glassBase: "rgba(40, 40, 40, 0.55)",
    glassBorder: "rgba(255, 255, 255, 0.08)",
    border: "rgba(255, 255, 255, 0.07)",
    borderStrong: "rgba(255, 255, 255, 0.12)",
    separator: "rgba(255, 255, 255, 0.06)",
    text: "#F5F5F5",
    textMuted: "#9CA3AF",
    textSubtle: "#6B7280",
    primary: "#FAFAFA",
    primaryDeep: "#E5E5E5",
    primaryText: "#1A1A1A",
    primarySoft: "rgba(250, 250, 250, 0.10)",
    success: "#2DB67B",
    successSoft: "rgba(45, 182, 123, 0.16)",
    warning: "#E3A93C",
    warningSoft: "rgba(227, 169, 60, 0.16)",
    error: "#E5484D",
    errorSoft: "rgba(229, 72, 77, 0.16)",
    critical: "#FF453A",
    overlay: "rgba(0, 0, 0, 0.6)",
    tabBar: "rgba(30, 30, 30, 0.72)",
    inputBg: "rgba(40, 40, 40, 0.55)",
    // Home redesign — Figma node 8:55 (dark).
    bgGradientFrom: "#4a4a4a",
    bgGradientTo: "#0d0d0d",
    heroVerticalBg: "rgba(0, 0, 0, 0.51)",
    heroVerticalBorder: "#4c4c4c",
    clockGradientFrom: "rgba(255, 255, 255, 0.09)",
    clockGradientMid: "rgba(255, 255, 255, 0.49)",
    clockGradientTo: "#ffffff",
    leadCardCompactBg: "rgba(9, 9, 9, 0.66)",
    leadCardCompactText: "#ffffff",
    bottomBarBg: "rgba(15, 15, 15, 0.98)",
  },
};

// Font families — Playfair Display (display serif) + Manrope (sans body)
// loaded via expo-google-fonts in _layout.tsx. Keys preservadas pra que a
// migracao ocorra sem precisar atualizar nenhum consumer (todo lugar que
// usava Fraunces via displayBold passa a renderizar Playfair Bold, etc).
// Mono fica em system stack (no bundle), com Windows fallback.
// Fontes: Playfair Display + Manrope via @expo-google-fonts; mono em system stack.
export const fontFamily = {
  // Display serif (Playfair Display) — for h-display + h-section.
  displayRegular: "PlayfairDisplay_400Regular",
  displaySemibold: "PlayfairDisplay_600SemiBold",
  displayBold: "PlayfairDisplay_700Bold",
  displayItalic: "PlayfairDisplay_500Medium_Italic",
  // Sans body (Manrope) — for body, captions, labels, mono fallback.
  regular: "Manrope_400Regular",
  medium: "Manrope_500Medium",
  semibold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  light: "Manrope_300Light",
  // Mono stack (system).
  mono: Platform.select({
    ios: "Menlo",
    android: "monospace",
    default:
      'ui-monospace, "SF Mono", "JetBrains Mono", "Cascadia Code", "Consolas", "Liberation Mono", Menlo, monospace',
  }) as string,
} as const;

// Numeric weights kept for any caller that still spreads typography helpers.
// React Native maps these to the loaded font weights automatically when the
// fontFamily explicitly carries the weight (e.g. Inter_600SemiBold).
export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
} as const;

export const fontSize = {
  xs: 10,
  sm: 11,
  md: 13,
  base: 14,
  lg: 16,
  xl: 18,
  "2xl": 22,
  "3xl": 28,
  "4xl": 32,
  "5xl": 40,
  "6xl": 56,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  pill: 9999,
  full: 9999,
} as const;

export const letterSpacing = {
  tight: 0,
  normal: 1,
  wide: 2,
  wider: 3,
  widest: 4,
  ultra: 6,
} as const;

// Elevation light: real shadows. Elevation dark: subtle top-highlight only
// (shadows on dark turn into smudges; Vercel/Cursor pattern).
// Glass surfaces dont use either — they get a thin border via glassBorder.
export const elevationLight = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  primary: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

export const elevationDark = {
  none: {},
  sm: { borderTopColor: "rgba(255,255,255,0.04)", borderTopWidth: 1 },
  md: { borderTopColor: "rgba(255,255,255,0.06)", borderTopWidth: 1 },
  lg: { borderTopColor: "rgba(255,255,255,0.08)", borderTopWidth: 1 },
  primary: { borderTopColor: "rgba(255,255,255,0.10)", borderTopWidth: 1 },
} as const;

export const elevationAliasLight = {
  card: elevationLight.sm,
  sheet: elevationLight.lg,
  popover: elevationLight.primary,
} as const;

export const elevationAliasDark = {
  card: elevationDark.sm,
  sheet: elevationDark.lg,
  popover: elevationDark.primary,
} as const;

export type Elevation = typeof elevationLight | typeof elevationDark;

// Typography helpers — Fraunces for display, Inter for everything else.
// Spread directly into a Text style. Color comes from useTheme() at the
// consumer (these helpers are color-agnostic).
//
// Display = page titles, section titles. Heavy serif presence.
// Body / caption / label = all Inter for UI consistency.
// Tipografia: Fraunces no display, Inter no resto. Cor vem do consumer.
export const typography = {
  // Display — Playfair serif. hDisplay ajustado pra 36/45/-1.8 conforme
  // Figma node 1:2 do redesign 2026-05-25 (era 5xl/44/-1.2 com Fraunces).
  hDisplay: {
    fontFamily: fontFamily.displayRegular,
    fontSize: 36,
    lineHeight: 45,
    letterSpacing: -1.8,
  },
  hSection: {
    fontFamily: fontFamily.displaySemibold,
    fontSize: fontSize["3xl"],
    lineHeight: 32,
    letterSpacing: -0.8,
  },
  // Legacy aliases (h1/h2) so screens not yet migrated keep working.
  // Aliases legados pra telas ainda nao migradas.
  h1: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize["5xl"],
    lineHeight: 44,
    letterSpacing: -1.2,
  },
  h2: {
    fontFamily: fontFamily.displaySemibold,
    fontSize: fontSize["3xl"],
    lineHeight: 32,
    letterSpacing: -0.8,
  },
  // Body — Inter sans.
  h3: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xl,
    lineHeight: 24,
  },
  bodyLg: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.lg + 1,
    lineHeight: 24,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.lg,
    lineHeight: 22,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    lineHeight: 18,
  },
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    letterSpacing: 0.5,
  },
  // Mailchimp-style uppercase tag.
  labelCaps: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    letterSpacing: 1.4,
    textTransform: "uppercase" as const,
  },
  mono: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0,
  },
  monoSmall: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    letterSpacing: 0,
  },
  // Home redesign — Figma pixel-perfect entries (2026-05-25).
  // Consumidos por home + componentes novos (HeroStatsBlock, LeadCardCompact,
  // RotatingClock, PriorityBadge).
  hKpiValue: {
    fontFamily: fontFamily.displayRegular,
    fontSize: 48,
    lineHeight: 48,
    letterSpacing: -2.4,
  },
  hKpiLabel: {
    fontFamily: fontFamily.displayItalic,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.8,
  },
  hSectionItalic: {
    fontFamily: fontFamily.displayItalic,
    fontSize: 20,
    lineHeight: 30,
    letterSpacing: -1,
  },
  cardValue: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    letterSpacing: -0.7,
  },
  cardId: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    letterSpacing: -0.6,
  },
  cardMeta: {
    fontFamily: fontFamily.light,
    fontSize: 10,
    letterSpacing: -0.5,
  },
  cardTime: {
    fontFamily: fontFamily.light,
    fontSize: 14,
    letterSpacing: -0.7,
  },
  clockHero: {
    fontFamily: fontFamily.regular,
    fontSize: 80,
    lineHeight: 80,
    letterSpacing: -4,
  },
  badge: {
    fontFamily: fontFamily.light,
    fontSize: 10,
    letterSpacing: -0.5,
  },
} as const;

// Status palette: estados de lead (mapeia 1:1 com api Lead.status).
// Domain-specific, mas tema-agnostic — cores funcionam em light e dark.
export type LeadStatusKey =
  | "new"
  | "assigned"
  | "contacted"
  | "converted"
  | "lost"
  | "expired";

export type StatusPaletteEntry = {
  labelKey: string;
  color: string;
  bg: string;
  border: string;
};

export const leadStatusPalette: Record<LeadStatusKey, StatusPaletteEntry> = {
  new: {
    labelKey: "status.new",
    color: "#5B8DEF",
    bg: "rgba(91, 141, 239, 0.14)",
    border: "rgba(91, 141, 239, 0.40)",
  },
  assigned: {
    labelKey: "status.assigned",
    color: "#A855F7",
    bg: "rgba(168, 85, 247, 0.14)",
    border: "rgba(168, 85, 247, 0.40)",
  },
  contacted: {
    labelKey: "status.contacted",
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.14)",
    border: "rgba(245, 158, 11, 0.40)",
  },
  converted: {
    labelKey: "status.converted",
    color: "#10B981",
    bg: "rgba(16, 185, 129, 0.16)",
    border: "rgba(16, 185, 129, 0.45)",
  },
  lost: {
    labelKey: "status.lost",
    color: "#6B7280",
    bg: "rgba(107, 114, 128, 0.14)",
    border: "rgba(107, 114, 128, 0.35)",
  },
  expired: {
    labelKey: "status.expired",
    color: "#9CA3AF",
    bg: "rgba(156, 163, 175, 0.12)",
    border: "rgba(156, 163, 175, 0.30)",
  },
};

export type LeadPriorityKey = "low" | "medium" | "high" | "critical";

export const leadPriorityPalette: Record<LeadPriorityKey, StatusPaletteEntry> = {
  low: {
    labelKey: "priority.low",
    color: "#6B7280",
    bg: "rgba(107, 114, 128, 0.12)",
    border: "rgba(107, 114, 128, 0.30)",
  },
  medium: {
    // amarelo-mostarda — "atenção" no meio da escala de urgência.
    // Antes era amber #F59E0B (próximo demais do laranja de high).
    labelKey: "priority.medium",
    color: "#EAB308",
    bg: "rgba(234, 179, 8, 0.14)",
    border: "rgba(234, 179, 8, 0.40)",
  },
  high: {
    // laranja vivo — convenção universal cinza→amarelo→laranja→vermelho
    // dá escala visual de urgência. Antes era azul #5B8DEF, que não
    // comunica "alta prioridade" — sugeria info/calmo no meio do funil.
    labelKey: "priority.high",
    color: "#F97316",
    bg: "rgba(249, 115, 22, 0.16)",
    border: "rgba(249, 115, 22, 0.45)",
  },
  critical: {
    labelKey: "priority.critical",
    color: "#FF453A",
    bg: "rgba(255, 69, 58, 0.16)",
    border: "rgba(255, 69, 58, 0.50)",
  },
};

export type ChurnSegmentKey = "fiel" | "abandono" | "esquecido" | "economico";

export const churnSegmentPalette: Record<ChurnSegmentKey, StatusPaletteEntry> = {
  fiel: {
    labelKey: "segment.fiel",
    color: "#10B981",
    bg: "rgba(16, 185, 129, 0.14)",
    border: "rgba(16, 185, 129, 0.40)",
  },
  abandono: {
    labelKey: "segment.abandono",
    color: "#FF453A",
    bg: "rgba(255, 69, 58, 0.14)",
    border: "rgba(255, 69, 58, 0.40)",
  },
  esquecido: {
    labelKey: "segment.esquecido",
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.14)",
    border: "rgba(245, 158, 11, 0.40)",
  },
  economico: {
    labelKey: "segment.economico",
    color: "#A855F7",
    bg: "rgba(168, 85, 247, 0.14)",
    border: "rgba(168, 85, 247, 0.40)",
  },
};

// Legacy color export — kept so any code path still importing from this module
// instead of useTheme() does not break. Migrate consumers to useTheme().
// Tokens legados: nao usar em codigo novo. Migrar para useTheme().
export const colors = palette.dark;
export type ColorToken = keyof ThemeColors;
export type SpacingToken = keyof typeof spacing;
