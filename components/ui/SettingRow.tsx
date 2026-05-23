// SettingRow: linha de configuracao com icone + label/value + slot direito.
// Reutilizada na tela de perfil (tema, idioma) e qualquer outra que precise
// expor uma propriedade com explicacao secundaria + controle inline.

import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/context/ThemeContext";
import { radius, spacing, typography, type ThemeColors } from "@/lib/theme";

export type SettingRowEmphasis = "label" | "value";

export interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  right?: React.ReactNode;
  /**
   * Define qual texto recebe o peso visual principal. Default "value" — usado
   * quando o label e contexto ("Idioma") e o value e a informacao ("PT").
   * Use "label" quando o label ja e a informacao principal ("Modo escuro")
   * e o value e auxiliar ("Manual").
   */
  emphasis?: SettingRowEmphasis;
}

export function SettingRow({
  icon,
  label,
  value,
  right,
  emphasis = "value",
}: SettingRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const labelStyle = emphasis === "label" ? styles.textPrimary : styles.textSecondary;
  const valueStyle = emphasis === "label" ? styles.textSecondary : styles.textPrimary;

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <View style={styles.textCol}>
          <Text style={labelStyle} numberOfLines={1}>
            {label}
          </Text>
          <Text style={valueStyle} numberOfLines={1}>
            {value}
          </Text>
        </View>
      </View>
      {right}
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      marginHorizontal: spacing.xl,
      marginBottom: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    left: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    textCol: { flex: 1 },
    textPrimary: {
      ...typography.body,
      fontWeight: "700",
      color: c.text,
    },
    textSecondary: {
      ...typography.caption,
      color: c.textMuted,
      marginTop: 2,
    },
  });
}
