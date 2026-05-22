import React, { useMemo } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { useTheme } from "@/context/ThemeContext";
import { radius, spacing, type ThemeColors } from "@/lib/theme";

export function Card({ style, ...rest }: ViewProps) {
  const { colors, elevation } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <View {...rest} style={[styles.card, elevation.sm, style]} />;
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
  });
}
