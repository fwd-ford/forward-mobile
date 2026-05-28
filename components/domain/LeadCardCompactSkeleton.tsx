// LeadCardCompactSkeleton — placeholder do LeadCardCompact com mesma
// dimensao (130 height), mesma cor de background, e barras de shimmer
// representando texto. Usado em initialLoading da home.
// Skeleton compativel com LeadCardCompact pra estado de loading.

import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { Skeleton } from "@/components/ui/Skeleton";
import { useTheme } from "@/context/ThemeContext";
import { type ThemeColors } from "@/lib/theme";

const CARD_HEIGHT = 130;

export function LeadCardCompactSkeleton() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Skeleton width={90} height={20} />
        <Skeleton width={52} height={16} borderRadius={5} />
      </View>
      <Skeleton width={120} height={12} style={styles.customer} />
      <Skeleton width={140} height={11} style={styles.reason} />
      <View style={styles.divider} />
      <View style={styles.bottomRow}>
        <Skeleton width={50} height={10} />
        <Skeleton width={36} height={10} />
      </View>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: {
      flex: 1,
      height: CARD_HEIGHT,
      backgroundColor: c.leadCardCompactBg,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 10,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.heroVerticalBorder,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    customer: {
      marginTop: 8,
    },
    reason: {
      marginTop: 4,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.leadCardCompactText,
      opacity: 0.15,
      marginTop: 10,
      marginBottom: 6,
    },
    bottomRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
  });
}
