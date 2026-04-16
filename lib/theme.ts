// Design tokens for the ForwardService mobile app.
// Centralised so UI primitives and screens never hardcode values.
// Tokens de design: cores, espacamento, tipografia.

export const colors = {
  bg: "#0B1220",
  surface: "#121A2B",
  surfaceAlt: "#1A2336",
  border: "#24304A",
  text: "#E6EDF7",
  textMuted: "#93A1B8",
  primary: "#3366FF",
  primaryAlt: "#1E4CFF",
  success: "#2DB67B",
  warning: "#E3A93C",
  danger: "#E5484D",
  critical: "#FF5463",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: "700" as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: "700" as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: "600" as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: "600" as const, letterSpacing: 0.5 },
} as const;

export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
