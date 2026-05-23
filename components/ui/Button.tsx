import React, { useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from "react-native";

import { useTheme } from "@/context/ThemeContext";
import { radius, spacing, typography, type ThemeColors } from "@/lib/theme";

type Variant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends Omit<PressableProps, "children"> {
  label: string;
  variant?: Variant;
  loading?: boolean;
  /** Optional label shown next to the spinner while loading. Falls back to spinner-only when omitted. */
  loadingLabel?: string;
}

export function Button({
  label,
  variant = "primary",
  loading,
  loadingLabel,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const { colors, elevation } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Spring scale on press — pressIn snaps in fast, pressOut bounces back a hair.
  // O contraste das curvas eh o que faz o botao "ter peso".
  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 60,
      bounciness: 0,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 60,
      bounciness: 6,
    }).start();
  };

  const variantStyle = styles[variant];
  const labelStyle =
    variant === "ghost"
      ? [styles.label, { color: colors.primary }]
      : variant === "secondary"
        ? [styles.label, { color: colors.text }]
        : [styles.label, { color: colors.primaryText }];
  const indicatorColor = variant === "primary" ? colors.primaryText : colors.primary;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        {...rest}
        disabled={disabled || loading}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        style={({ pressed }) => [
          styles.base,
          variantStyle,
          variant === "primary" ? elevation.primary : undefined,
          disabled ? { opacity: 0.45 } : pressed ? { opacity: 0.9 } : undefined,
          typeof style === "function" ? style({ pressed } as never) : style,
        ]}
      >
        {loading ? (
          loadingLabel ? (
            <>
              <ActivityIndicator color={indicatorColor} style={styles.spinnerInline} />
              <Text style={labelStyle}>{loadingLabel}</Text>
            </>
          ) : (
            <ActivityIndicator color={indicatorColor} />
          )
        ) : (
          <Text style={labelStyle}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    base: {
      height: 48,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "transparent",
    },
    spinnerInline: {
      marginRight: spacing.sm,
    },
    primary: { backgroundColor: c.primary, borderColor: c.primary },
    secondary: { backgroundColor: c.surface, borderColor: c.border },
    ghost: { backgroundColor: "transparent", borderColor: c.borderStrong },
    label: {
      ...typography.h3,
    },
  });
}
