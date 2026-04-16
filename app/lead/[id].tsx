import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { api, ApiError, type Lead } from "@/lib/api";
import { colors, spacing, typography } from "@/lib/theme";

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const [lead, setLead] = useState<Lead | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Placeholder: Sprint 1 API does not expose GET lead by id.
    // Placeholder: API da Sprint 1 nao expoe GET lead por id.
    api
      .listLeads({ limit: 200 })
      .then((all) => setLead(all.find((l) => l.id === id) ?? null))
      .catch((e) => setError(e instanceof ApiError ? e.message : t("home.error")));
  }, [id]);

  if (error) return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;
  if (!lead) return <View style={styles.center}><Text style={styles.muted}>…</Text></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.vin}>{lead.vin ?? "—"}</Text>
        <View style={styles.row}>
          <Badge label={t(`priority.${lead.priority}`)} tone="primary" />
          <Badge label={t(`status.${lead.status}`)} tone="textMuted" />
        </View>
        {lead.reason ? <Text style={styles.body}>{lead.reason}</Text> : null}
        {lead.expected_value_brl != null ? (
          <Text style={styles.body}>
            {t("lead.expected_value")}:{" "}
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(lead.expected_value_brl)}
          </Text>
        ) : null}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg },
  card: { gap: spacing.md },
  row: { flexDirection: "row", gap: spacing.sm },
  vin: { ...typography.h2, color: colors.text },
  body: { ...typography.body, color: colors.text },
  muted: { ...typography.body, color: colors.textMuted },
  error: { ...typography.body, color: colors.danger },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
});
