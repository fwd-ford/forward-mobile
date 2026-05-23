// Glass surface — semi-transparent + blur. Abstraction over platform diffs:
//   iOS / web   -> expo-blur BlurView (web: backdrop-filter via the lib)
//   Android     -> rgba fill only (real blur is jank in long lists on Android)
//
// Variants control blur intensity + opacity. Use `regular` by default,
// `thin` for nested surfaces, `thick` for sheets and modals.
//
// Superficie glass: blur real no iOS/web; fill rgba no Android (perf).

import { useMemo, type ReactNode } from "react";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";

import { useTheme } from "@/context/ThemeContext";

export type GlassVariant = "thin" | "regular" | "thick";

export interface GlassSurfaceProps {
  variant?: GlassVariant;
  radius?: number;
  border?: boolean;
  style?: ViewStyle | ViewStyle[];
  children?: ReactNode;
}

const INTENSITY: Record<GlassVariant, number> = {
  thin: 30,
  regular: 60,
  thick: 90,
};

// Android falls back to fill-only — these alphas keep parity with the visual
// weight of the blur intensities above.
const ANDROID_ALPHA: Record<GlassVariant, number> = {
  thin: 0.45,
  regular: 0.6,
  thick: 0.78,
};

export function GlassSurface({
  variant = "regular",
  radius = 20,
  border = true,
  style,
  children,
}: GlassSurfaceProps) {
  const { colors, mode } = useTheme();

  const containerStyle = useMemo<ViewStyle>(
    () => ({
      borderRadius: radius,
      overflow: "hidden",
      borderWidth: border ? StyleSheet.hairlineWidth : 0,
      borderColor: colors.glassBorder,
      backgroundColor: Platform.OS === "android" ? androidFill(mode, variant) : "transparent",
    }),
    [radius, border, colors.glassBorder, mode, variant],
  );

  if (Platform.OS === "android") {
    return <View style={[containerStyle, style]}>{children}</View>;
  }

  // BlurView for iOS + web (expo-blur uses backdrop-filter on web).
  // tint='default' adapts to theme; we pass dark/light explicitly so the
  // glass reads correctly even when device theme disagrees with app theme.
  return (
    <View style={[containerStyle, style]}>
      <BlurView
        intensity={INTENSITY[variant]}
        tint={mode === "dark" ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

function androidFill(mode: "light" | "dark", variant: GlassVariant): string {
  const alpha = ANDROID_ALPHA[variant];
  return mode === "dark"
    ? `rgba(40, 40, 40, ${alpha})`
    : `rgba(255, 255, 255, ${alpha})`;
}
