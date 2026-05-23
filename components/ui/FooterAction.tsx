// FooterAction: botao primario de footer fixo. Usado na tela de detalhe do
// lead pra agrupar 3 acoes lado a lado (Ligar, Mensagem, Marcar contato).
// Quando `disabled`, renderiza badge "Em breve" abaixo do label e bloqueia
// onPress + haptic, sem fingir que a acao acontece.

import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/context/ThemeContext";
import { radius, spacing, typography, type ThemeColors } from "@/lib/theme";

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
        disabled && styles.btnDisabled,
        pressed && !disabled && { opacity: 0.7 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <Ionicons name={icon} size={20} color={disabled ? colors.textSubtle : colors.primary} />
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
      backgroundColor: c.primarySoft,
    },
    btnDisabled: {
      backgroundColor: c.surfaceElevated,
      opacity: 0.7,
    },
    label: {
      ...typography.caption,
      fontWeight: "700",
      color: c.primary,
    },
    hint: {
      marginTop: 2,
      paddingHorizontal: spacing.xs,
      paddingVertical: 1,
      borderRadius: radius.sm,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    hintLabel: {
      ...typography.label,
      fontSize: 9,
      color: c.textSubtle,
      textTransform: "uppercase",
    },
  });
}
