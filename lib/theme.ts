// Design tokens for the ForwardService mobile app.
// Two palettes (light + dark) keyed by semantic tokens. Screens consume via
// useTheme() — never import `palette` directly.
// Tokens de design: paletas light/dark, espacamento, tipografia, elevacao.

import { Platform } from "react-native";

export type ThemeMode = "light" | "dark";

export type ThemeColors = {
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceElevated: string;
  surfaceHover: string;
  border: string;
  borderStrong: string;
  separator: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryDeep: string;
  primaryText: string;
  primarySoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  error: string;
  errorSoft: string;
  critical: string;
  overlay: string;
  tabBar: string;
  inputBg: string;
};

// Ford Blue is the brand primary. Light uses the classic deep blue; dark uses
// a lighter, more saturated variant for legibility on dark backgrounds.
// Azul Ford classico (#003478) no light; variante mais clara no dark.
export const FORD_BLUE = "#003478";
export const FORD_BLUE_DEEP = "#002356";
export const FORD_BLUE_DARK_MODE = "#5B8DEF";
export const FORD_BLUE_DARK_MODE_DEEP = "#3D6FCC";

export const palette: Record<ThemeMode, ThemeColors> = {
  light: {
    bg: "#F7F8FA",
    bgElevated: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    surfaceHover: "#F1F3F7",
    border: "rgba(11, 18, 32, 0.08)",
    borderStrong: "rgba(11, 18, 32, 0.14)",
    separator: "rgba(11, 18, 32, 0.05)",
    text: "#0B1220",
    textMuted: "#56627A",
    textSubtle: "#8E97AC",
    primary: FORD_BLUE,
    primaryDeep: FORD_BLUE_DEEP,
    primaryText: "#FFFFFF",
    primarySoft: "rgba(0, 52, 120, 0.10)",
    success: "#0F8A5F",
    successSoft: "rgba(15, 138, 95, 0.10)",
    warning: "#B5670A",
    warningSoft: "rgba(181, 103, 10, 0.10)",
    error: "#C7363A",
    errorSoft: "rgba(199, 54, 58, 0.10)",
    critical: "#A11A20",
    overlay: "rgba(11, 18, 32, 0.40)",
    tabBar: "rgba(255, 255, 255, 0.92)",
    inputBg: "#FFFFFF",
  },
  dark: {
    bg: "#0B1220",
    bgElevated: "#101A2E",
    surface: "#121A2B",
    surfaceElevated: "#1A2336",
    surfaceHover: "#1F2A40",
    border: "rgba(255, 255, 255, 0.07)",
    borderStrong: "rgba(255, 255, 255, 0.12)",
    separator: "rgba(255, 255, 255, 0.05)",
    text: "#E6EDF7",
    textMuted: "#93A1B8",
    textSubtle: "#6C7A95",
    primary: FORD_BLUE_DARK_MODE,
    primaryDeep: FORD_BLUE_DARK_MODE_DEEP,
    primaryText: "#FFFFFF",
    primarySoft: "rgba(91, 141, 239, 0.16)",
    success: "#2DB67B",
    successSoft: "rgba(45, 182, 123, 0.16)",
    warning: "#E3A93C",
    warningSoft: "rgba(227, 169, 60, 0.16)",
    error: "#E5484D",
    errorSoft: "rgba(229, 72, 77, 0.16)",
    critical: "#FF5463",
    overlay: "rgba(0, 0, 0, 0.6)",
    tabBar: "rgba(11, 18, 32, 0.85)",
    inputBg: "#121A2B",
  },
};

export const fontFamily = {
  regular: "System",
  medium: "System",
  semibold: "System",
  bold: "System",
  extrabold: "System",
  mono: Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "ui-monospace",
  }) as string,
} as const;

// Weight tokens — paired with fontFamily.System on RN to get bold variants
// without bundling custom fonts. When we ship Manrope/Inter later, swap families.
// Pesos: enquanto nao ha fonte custom, usa system + fontWeight numerico.
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
  "5xl": 48,
  "6xl": 72,
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

// Elevation pra light: sombras reais (iOS shadow* + Android elevation).
// Hierarquia visual depende da luz vinda de cima.
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
    shadowColor: FORD_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

// Elevation pra dark: zero sombra. Hierarquia via top-highlight (borda superior
// clarinha). Estetica Vercel/Cursor — sombras em fundo escuro viram manchas.
export const elevationDark = {
  none: {},
  sm: { borderTopColor: "rgba(255,255,255,0.04)", borderTopWidth: 1 },
  md: { borderTopColor: "rgba(255,255,255,0.06)", borderTopWidth: 1 },
  lg: { borderTopColor: "rgba(255,255,255,0.08)", borderTopWidth: 1 },
  primary: { borderTopColor: "rgba(255,255,255,0.10)", borderTopWidth: 1 },
} as const;

// Semantic elevation aliases — usar nas telas em vez de sm/md/lg/primary direto.
// Card = elemento normal. Sheet = modal/bottom-sheet. Popover = floating action.
// Aliases semanticos: card / sheet / popover.
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

// Typography helpers que combinam size + weight + lineHeight em um objeto
// pronto pra spread. Substitui o `typography.h1` antigo, agora tema-aware
// no consumer (cor vem de useTheme()).
// Helpers de tipografia: spread direto no style.
export const typography = {
  h1: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.extrabold,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  h2: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  h3: { fontSize: fontSize.xl, fontWeight: fontWeight.semibold, lineHeight: 24 },
  body: { fontSize: fontSize.lg, fontWeight: fontWeight.regular, lineHeight: 22 },
  caption: { fontSize: fontSize.md, fontWeight: fontWeight.regular, lineHeight: 18 },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, letterSpacing: 0.5 },
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

// Priority palette: mapeia api Lead.priority. Critical chama atencao maxima.
export type LeadPriorityKey = "low" | "medium" | "high" | "critical";

export const leadPriorityPalette: Record<LeadPriorityKey, StatusPaletteEntry> = {
  low: {
    labelKey: "priority.low",
    color: "#6B7280",
    bg: "rgba(107, 114, 128, 0.12)",
    border: "rgba(107, 114, 128, 0.30)",
  },
  medium: {
    labelKey: "priority.medium",
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.14)",
    border: "rgba(245, 158, 11, 0.40)",
  },
  high: {
    labelKey: "priority.high",
    color: FORD_BLUE_DARK_MODE,
    bg: "rgba(91, 141, 239, 0.16)",
    border: "rgba(91, 141, 239, 0.45)",
  },
  critical: {
    labelKey: "priority.critical",
    color: "#FF5463",
    bg: "rgba(255, 84, 99, 0.16)",
    border: "rgba(255, 84, 99, 0.50)",
  },
};

// Churn segment palette: mapeia segment do ChurnScore.
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
    color: "#FF5463",
    bg: "rgba(255, 84, 99, 0.14)",
    border: "rgba(255, 84, 99, 0.40)",
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

// Tokens legados — mantidos para callers ainda nao migrados. Vao sumir
// conforme as telas adotam useTheme(). NAO usar em codigo novo.
// Legacy tokens: nao usar em codigo novo. Migrar para useTheme().
export const colors = palette.dark;
export type ColorToken = keyof ThemeColors;
export type SpacingToken = keyof typeof spacing;
