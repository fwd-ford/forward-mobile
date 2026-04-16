import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography, type ColorToken } from "@/lib/theme";

export interface BadgeProps {
  label: string;
  tone?: ColorToken;
}

export function Badge({ label, tone = "primary" }: BadgeProps) {
  const color = colors[tone];
  return (
    <View style={[styles.wrap, { backgroundColor: color + "22", borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  text: { ...typography.label, textTransform: "uppercase" },
});
