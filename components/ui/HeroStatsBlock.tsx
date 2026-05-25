// HeroStatsBlock — card vertical translucido com dois KPIs empilhados.
// Reproduz o bloco esquerdo do Figma node 1:2 / 8:55: label italic 16
// (Playfair) + value serif 48 (Playfair Regular). Background usa
// heroVerticalBg do tema, com border heroVerticalBorder.
// Bloco vertical de KPIs da home: label italic + numero serif gigante.

import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/context/ThemeContext";
import { spacing, typography, type ThemeColors } from "@/lib/theme";

export interface HeroStatsItem {
  label: string;
  value: string;
}

export interface HeroStatsBlockProps {
  items: readonly [HeroStatsItem, HeroStatsItem];
}

export function HeroStatsBlock({ items }: HeroStatsBlockProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [first, second] = items;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>{first.label}</Text>
        <Text style={styles.value}>{first.value}</Text>
      </View>
      <View style={[styles.row, styles.rowSpacing]}>
        <Text style={styles.label}>{second.label}</Text>
        <Text style={styles.value}>{second.value}</Text>
      </View>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.heroVerticalBg,
      borderColor: c.heroVerticalBorder,
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: spacing["2xl"],
      paddingVertical: spacing.lg,
      width: 180,
      minHeight: 202,
    },
    row: {
      gap: spacing.xs,
    },
    rowSpacing: {
      marginTop: spacing.lg,
    },
    label: {
      ...typography.hKpiLabel,
      color: c.text,
    },
    value: {
      ...typography.hKpiValue,
      color: c.text,
    },
  });
}
