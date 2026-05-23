// FooterAction: pressable column for the fixed glass footer in lead detail.
// Three of these sit side-by-side (Ligar / Mensagem / Marcar contato).
// When `disabled`, renders a small "Em breve" hint and blocks onPress, so we
// never lie about what works.

import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/context/ThemeContext";
import { fontFamily, radius, spacing, typography, type ThemeColors } from "@/lib/theme";

export interface FooterActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Override do badge "Em breve" quando disabled. Default usa common.coming_soon. */
  disabledHintLabel?: string;
}

export function FooterAction({
  icon,
  label,
  onPress,
  disabled = false,
  disabledHintLabel,
}: FooterActionProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        pressed && !disabled && { opacity: 0.7 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <Ionicons
        name={icon}
        size={22}
        color={disabled ? colors.textSubtle : colors.text}
      />
      <Text
        style={[styles.label, disabled && { color: colors.textSubtle }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {disabled ? (
        <View style={styles.hint}>
          <Text style={styles.hintLabel}>{disabledHintLabel ?? t("common.coming_soon")}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    btn: {
      flex: 1,
      minHeight: 56,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      backgroundColor: "transparent",
    },
    label: {
      ...typography.caption,
      fontFamily: fontFamily.semibold,
      color: c.text,
    },
    hint: {
      marginTop: 2,
      paddingHorizontal: spacing.sm,
      paddingVertical: 1,
      borderRadius: radius.sm,
      backgroundColor: c.glassBase,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.glassBorder,
    },
    hintLabel: {
      ...typography.label,
      fontSize: 9,
      color: c.textSubtle,
      textTransform: "uppercase",
    },
  });
}
