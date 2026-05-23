import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useTheme } from "@/context/ThemeContext";
import type { Lead } from "@/lib/api";
import { spacing, typography, type ColorToken, type ThemeColors } from "@/lib/theme";

const priorityTone: Record<Lead["priority"], ColorToken> = {
  low: "textMuted",
  medium: "warning",
  high: "primary",
  critical: "critical",
};

export function LeadCard({ lead }: { lead: Lead }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.vin}>{lead.vin ?? "—"}</Text>
        <Badge label={t(`priority.${lead.priority}`)} tone={priorityTone[lead.priority]} />
      </View>
      {lead.reason ? <Text style={styles.reason}>{lead.reason}</Text> : null}
      <View style={styles.row}>
        <Badge label={t(`status.${lead.status}`)} tone="textMuted" />
        {lead.expected_value_brl != null ? (
          <Text style={styles.value}>
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
              lead.expected_value_brl,
            )}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: { gap: spacing.sm },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    vin: { ...typography.h3, color: c.text },
    reason: { ...typography.body, color: c.textMuted },
    value: { ...typography.body, color: c.text, fontWeight: "600" },
  });
}
