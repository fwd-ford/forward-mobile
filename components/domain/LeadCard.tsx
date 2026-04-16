import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Lead } from "@/lib/api";
import { colors, spacing, typography, type ColorToken } from "@/lib/theme";

const priorityTone: Record<Lead["priority"], ColorToken> = {
  low: "textMuted",
  medium: "warning",
  high: "primary",
  critical: "critical",
};

export function LeadCard({ lead }: { lead: Lead }) {
  const { t } = useTranslation();
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
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(lead.expected_value_brl)}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  vin: { ...typography.h3, color: colors.text },
  reason: { ...typography.body, color: colors.textMuted },
  value: { ...typography.body, color: colors.text, fontWeight: "600" },
});
