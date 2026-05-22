import { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/context/ThemeContext";
import { spacing, typography, type ThemeColors } from "@/lib/theme";

export interface LoadingScreenProps {
  label?: string;
  subtitle?: string;
  /** Inline mode renders just the dots + label (no full-screen wrapper). */
  inline?: boolean;
}

const DOT_DELAY_MS = 180;

export function LoadingScreen({ label, subtitle, inline = false }: LoadingScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (inline) {
    return (
      <View style={styles.inline}>
        <View style={styles.dots}>
          <Dot delay={0} color={colors.primary} />
          <Dot delay={DOT_DELAY_MS} color={colors.primary} />
          <Dot delay={DOT_DELAY_MS * 2} color={colors.primary} />
        </View>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.dots}>
          <Dot delay={0} color={colors.primary} />
          <Dot delay={DOT_DELAY_MS} color={colors.primary} />
          <Dot delay={DOT_DELAY_MS * 2} color={colors.primary} />
        </View>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function Dot({ delay, color }: { delay: number; color: string }) {
  const opacity = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 360,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.25,
          duration: 360,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity, delay]);

  return <Animated.View style={[dotStyles.dot, { backgroundColor: color, opacity }]} />;
}

const dotStyles = StyleSheet.create({
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.bg,
    },
    inline: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing["3xl"],
    },
    content: { alignItems: "center" },
    dots: {
      flexDirection: "row",
      gap: spacing.xs + 2,
      marginBottom: spacing.xl,
    },
    label: {
      ...typography.body,
      fontWeight: "700",
      color: c.text,
    },
    subtitle: {
      ...typography.caption,
      color: c.textMuted,
      marginTop: spacing.xs,
      textAlign: "center",
      paddingHorizontal: spacing["2xl"],
    },
  });
}
