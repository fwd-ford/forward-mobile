// LeadCardCompactSkeleton — placeholder do LeadCardCompact com mesma
// dimensao (170x115), mesma cor de background, e barras de shimmer
// representando texto/imagem. Usado em initialLoading da home.
// Skeleton compativel com LeadCardCompact pra estado de loading.

import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { Skeleton } from "@/components/ui/Skeleton";
import { useTheme } from "@/context/ThemeContext";
import { spacing, type ThemeColors } from "@/lib/theme";

const CARD_WIDTH = 170;
const CARD_HEIGHT = 115;

export function LeadCardCompactSkeleton() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Skeleton width={70} height={14} />
        <Skeleton width={52} height={14} borderRadius={5} />
      </View>
      <Skeleton width={50} height={12} style={styles.id} />
      <Skeleton width={102} height={53} style={styles.image} />
      <Skeleton width={120} height={10} style={styles.customer} />
      <View style={styles.bottomRow}>
        <Skeleton width={90} height={10} />
        <Skeleton width={36} height={14} />
      </View>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      backgroundColor: c.leadCardCompactBg,
      borderRadius: 5,
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 6,
      overflow: "hidden",
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.xs,
    },
    id: {
      marginTop: 4,
    },
    image: {
      alignSelf: "center",
      marginTop: 2,
    },
    customer: {
      marginTop: 4,
    },
    bottomRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.xs,
      marginTop: 4,
    },
  });
}
