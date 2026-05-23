// Skeleton placeholder matching the shape of the rewritten LeadCard.
// Used during initial load on Home and Leads. Render 3-5 stacked
// instances inside the list while data is fetching.
// Esqueleto do LeadCard novo: usado no loading inicial.

import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing, type ThemeColors } from "@/lib/theme";

export function LeadCardSkeleton() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Card style={styles.card}>
      <View style={styles.leftStripe} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Skeleton width={72} height={18} borderRadius={radius.sm} />
          <Skeleton width={56} height={14} borderRadius={radius.sm} />
        </View>
        <Skeleton width="80%" height={16} borderRadius={radius.sm} />
        <Skeleton width="60%" height={14} borderRadius={radius.sm} />
        <View style={styles.row}>
          <Skeleton width={48} height={14} borderRadius={radius.sm} />
          <Skeleton width={72} height={16} borderRadius={radius.sm} />
        </View>
      </View>
    </Card>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      padding: 0,
      overflow: "hidden",
    },
    leftStripe: {
      width: 3,
      backgroundColor: c.border,
    },
    body: {
      flex: 1,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
  });
}
