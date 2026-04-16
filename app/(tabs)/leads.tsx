import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";

import { LeadCard } from "@/components/domain/LeadCard";
import { api, ApiError, type Lead } from "@/lib/api";
import { getAccessToken } from "@/lib/session";
import { colors, spacing, typography } from "@/lib/theme";

export default function LeadsScreen() {
  const { t } = useTranslation();
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
      data={leads}
      keyExtractor={(l) => l.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
      renderItem={({ item }) => (
        <Link href={{ pathname: "/lead/[id]", params: { id: item.id } }} asChild>
          <View>
            <LeadCard lead={item} />
          </View>
        </Link>
      )}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  error: { ...typography.body, color: colors.danger, marginBottom: spacing.md },
});
