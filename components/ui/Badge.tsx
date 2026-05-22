import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/context/ThemeContext";
import { radius, spacing, typography, type ColorToken, type ThemeColors } from "@/lib/theme";

export interface BadgeProps {
  label: string;
  tone?: ColorToken;
}

export function Badge({ label, tone = "primary" }: BadgeProps) {
  const { colors } = useTheme();
  const color = colors[tone];
  const styles = useMemo(() => createStyles(colors), [colors]);
  // Translucent fill (22 hex = ~13%) + solid border + solid text in the same hue.
  // Fundo translucido + borda solida + texto na mesma matiz.
  return (
    <View style={[styles.wrap, { backgroundColor: color + "22", borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

function createStyles(_c: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      alignSelf: "flex-start",
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    text: { ...typography.label, textTransform: "uppercase" },
  });
}
