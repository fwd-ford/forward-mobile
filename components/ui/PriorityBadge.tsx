// PriorityBadge — badge compacto (radius 5, 10px text) que reflete
// lead.priority via leadPriorityPalette existente em lib/theme.
// Usado em LeadCardCompact (home redesign). Reutilizavel em qualquer
// lista de leads onde queremos um sinal visual compacto da prioridade.
// Badge de prioridade no formato do Figma node 1:2.

import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";

import {
  leadPriorityPalette,
  spacing,
  typography,
  type LeadPriorityKey,
} from "@/lib/theme";

export interface PriorityBadgeProps {
  priority: LeadPriorityKey;
  style?: ViewStyle;
}

export function PriorityBadge({ priority, style }: PriorityBadgeProps) {
  const { t } = useTranslation();
  const palette = leadPriorityPalette[priority];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: palette.bg, borderColor: palette.border },
        style,
      ]}
    >
      <Text style={[styles.label, { color: palette.color }]} numberOfLines={1}>
        {t(palette.labelKey)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 5, // valor do Figma
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  label: {
    ...typography.badge,
  },
});
