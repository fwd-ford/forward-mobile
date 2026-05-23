import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/context/ThemeContext";
import { radius, spacing, typography, type ThemeColors } from "@/lib/theme";

export type ToastVariant = "success" | "error" | "info";

export interface ToastProps {
  message: string;
  variant?: ToastVariant;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

const ENTER_OFFSET = -120;

export function Toast({
  message,
  variant = "success",
  visible,
  onHide,
  duration = 2500,
}: ToastProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const translateY = useRef(new Animated.Value(ENTER_OFFSET)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 14,
        bounciness: 6,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: ENTER_OFFSET,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => onHide());
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, duration, translateY, opacity, onHide]);

  if (!visible) return null;

  const iconName: keyof typeof Ionicons.glyphMap =
    variant === "success"
      ? "checkmark-circle"
      : variant === "error"
        ? "alert-circle"
        : "information-circle";

  const accent =
    variant === "success"
      ? colors.success
      : variant === "error"
        ? colors.error
        : colors.primary;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          top: insets.top + spacing.sm,
          borderLeftColor: accent,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Ionicons name={iconName} size={20} color={accent} />
      <Text style={styles.message} numberOfLines={3}>
        {message}
      </Text>
    </Animated.View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      position: "absolute",
      left: spacing.xl,
      right: spacing.xl,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      borderLeftWidth: 3,
      backgroundColor: c.surface,
      zIndex: 1000,
      elevation: 10,
      shadowColor: "#000",
      shadowOpacity: 0.28,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
    },
    message: {
      flex: 1,
      ...typography.body,
      fontWeight: "600",
      color: c.text,
    },
  });
}
