import { useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { LeadCard } from "@/components/domain/LeadCard";
import { api, ApiError, type Lead } from "@/lib/api";
import { getAccessToken } from "@/lib/session";
import { colors, spacing, typography } from "@/lib/theme";

export default function HomeScreen() {
  const { t } = useTranslation();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setRefreshing(true);
    setError(null);
    try {
      const token = (await getAccessToken()) ?? undefined;
      const data = await api.listLeads({ limit: 20 }, token);
      setLeads(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("home.error"));
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <FlatList
      data={leads}
      keyExtractor={(l) => l.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.text} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>{t("home.todays_leads")}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      }
      ListEmptyComponent={!refreshing ? <Text style={styles.empty}>{t("home.empty")}</Text> : null}
      renderItem={({ item }) => <LeadCard lead={item} />}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { marginBottom: spacing.lg, gap: spacing.sm },
  title: { ...typography.h1, color: colors.text },
  empty: { ...typography.body, color: colors.textMuted, textAlign: "center", marginTop: spacing.xxl },
  error: { ...typography.body, color: colors.danger },
});
