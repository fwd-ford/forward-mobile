// SettingRow: linha de configuracao com icone + label/value + slot direito.
// Reescrita pro Glass Minimalist: transparent (sem wrapping de card), opt-in
// divider hairline pra ser usada dentro de um group GlassSurface no Profile.
//
// Layout: [iconWrap 36x36] [label\nvalue] [right slot]

import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/context/ThemeContext";
import { spacing, typography, type ThemeColors } from "@/lib/theme";

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
  /** Show a hairline divider at the bottom — set true on all-but-last in a group. */
  divider?: boolean;
}

export function SettingRow({
  icon,
  label,
  value,
  right,
  emphasis = "value",
  divider,
}: SettingRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const labelStyle = emphasis === "label" ? styles.textPrimary : styles.textSecondary;
  const valueStyle = emphasis === "label" ? styles.textSecondary : styles.textPrimary;

  return (
    <View
      style={[
        styles.row,
        divider && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.glassBorder },
      ]}
    >
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={18} color={colors.text} />
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
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md + 2,
      backgroundColor: "transparent",
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
