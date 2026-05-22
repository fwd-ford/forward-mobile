import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState, type ReactNode } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { useTheme } from "@/context/ThemeContext";
import { radius, spacing, typography, type ThemeColors } from "@/lib/theme";

export interface InputProps extends TextInputProps {
  label?: string;
  /** Already-translated error message. Pass undefined/null when valid. */
  error?: string | null;
  icon?: keyof typeof Ionicons.glyphMap;
  rightSlot?: ReactNode;
  /** When supplied, wraps the input in an Animated.View so useShake() can drive translateX. */
  shakeAnim?: Animated.Value;
}

export function Input({
  label,
  error,
  icon,
  rightSlot,
  shakeAnim,
  ...inputProps
}: InputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Border priority: error wins > focused wins > default. Same rule for the icon tint.
  // Prioridade da borda: erro > focado > default. Mesma regra pro tint do icone.
  const borderColor = error
    ? colors.error
    : focused
      ? colors.primary
      : colors.border;
  const iconColor = error
    ? colors.error
    : focused
      ? colors.primary
      : colors.textSubtle;

  const content = (
    <>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.field, { borderColor }]}>
        {icon ? (
          <Ionicons name={icon} size={18} color={iconColor} style={styles.icon} />
        ) : null}
        <TextInput
          {...inputProps}
          placeholderTextColor={colors.textSubtle}
          style={[styles.input, inputProps.style]}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
        />
        {rightSlot}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </>
  );

  if (shakeAnim) {
    return (
      <Animated.View style={[styles.wrapper, { transform: [{ translateX: shakeAnim }] }]}>
        {content}
      </Animated.View>
    );
  }
  return <View style={styles.wrapper}>{content}</View>;
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    wrapper: { marginBottom: spacing.md },
    label: {
      ...typography.caption,
      fontWeight: "600",
      color: c.textMuted,
      marginBottom: spacing.sm,
    },
    field: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      backgroundColor: c.inputBg,
    },
    icon: { marginRight: spacing.sm },
    input: {
      flex: 1,
      paddingVertical: spacing.md + 2,
      fontSize: 16,
      color: c.text,
    },
    error: {
      ...typography.caption,
      fontWeight: "500",
      color: c.error,
      marginTop: spacing.xs + 2,
      marginLeft: spacing.xs,
    },
  });
}
