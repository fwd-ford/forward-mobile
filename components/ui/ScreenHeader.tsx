// Standard header for tab screens. Replaces the ad-hoc <View><Text/></View>
// pattern repeated across (tabs)/index, leads, profile. Title is h1, optional
// subtitle is body textMuted, optional trailing slot is right-aligned for
// actions like filter / refresh / count.
// Header padronizado das tabs. Substitui o markup inline duplicado.

import { useMemo, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/context/ThemeContext";
import { spacing, typography, type ThemeColors } from "@/lib/theme";

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}

export function ScreenHeader({ title, subtitle, trailing }: ScreenHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.lg,
    },
    text: { flex: 1, gap: spacing.xs },
    title: {
      ...typography.h1,
      color: c.text,
    },
    subtitle: {
      ...typography.body,
      color: c.textMuted,
    },
    trailing: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
  });
}
