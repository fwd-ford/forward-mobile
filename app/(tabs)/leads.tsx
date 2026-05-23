import { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { LeadCard } from "@/components/domain/LeadCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTheme } from "@/context/ThemeContext";
import { api, ApiError, type Lead } from "@/lib/api";
import { getAccessToken } from "@/lib/session";
import { spacing, typography, type ThemeColors } from "@/lib/theme";

export default function LeadsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = (await getAccessToken()) ?? undefined;
        setLeads(await api.listLeads({ limit: 100 }, token));
      } catch (e) {
        setError(e instanceof ApiError ? e.message : t("home.error"));
      }
    })();
  }, []);

  return (
    <FlatList
      style={styles.container}
      data={leads}
      keyExtractor={(l) => l.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
      ListEmptyComponent={
        !error ? (
          <EmptyState
            icon="briefcase-outline"
            title={t("home.empty_title")}
            description={t("home.empty_description")}
          />
        ) : null
      }
      renderItem={({ item }) => (
        <LeadCard
          lead={item}
          onPress={() => router.push({ pathname: "/lead/[id]", params: { id: item.id } })}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
    />
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { backgroundColor: c.bg },
    list: { padding: spacing.lg, paddingBottom: spacing["3xl"] },
    error: { ...typography.body, color: c.error, marginBottom: spacing.md },
  });
}
