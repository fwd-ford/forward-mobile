import { useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { LeadCard } from "@/components/domain/LeadCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTheme } from "@/context/ThemeContext";
import { api, ApiError, type Lead } from "@/lib/api";
import { getAccessToken } from "@/lib/session";
import { spacing, typography, type ThemeColors } from "@/lib/theme";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      style={styles.container}
      data={leads}
      keyExtractor={(l) => l.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={load}
          tintColor={colors.text}
        />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>{t("home.todays_leads")}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      }
      ListEmptyComponent={
        !refreshing ? (
          <EmptyState
            icon="briefcase-outline"
            title={t("home.empty_title")}
            description={t("home.empty_description")}
          />
        ) : null
      }
      renderItem={({ item }) => <LeadCard lead={item} />}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
    />
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { backgroundColor: c.bg },
    list: { padding: spacing.lg, paddingBottom: spacing["3xl"] },
    header: { marginBottom: spacing.lg, gap: spacing.sm },
    title: { ...typography.h1, color: c.text },
    error: { ...typography.body, color: c.error },
  });
}
