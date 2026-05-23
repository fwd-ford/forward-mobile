import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { LeadCard } from "@/components/domain/LeadCard";
import { LeadCardSkeleton } from "@/components/domain/LeadCardSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useTheme } from "@/context/ThemeContext";
import { haptic } from "@/lib/haptics";
import { ACTIVE_LEAD_STATUSES, api, ApiError, type Lead } from "@/lib/api";
import { getAccessToken } from "@/lib/session";
import { radius, spacing, typography, type ThemeColors } from "@/lib/theme";

type FilterKey = "all" | "critical" | "today" | "forgotten";

const DAY_MS = 24 * 60 * 60 * 1000;

function parseTimestamp(s: string | undefined): number | null {
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
}

function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function normalize(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function applyFilters(leads: Lead[], filter: FilterKey, query: string): Lead[] {
  let out = leads;

  switch (filter) {
    case "critical":
      out = out.filter((l) => l.priority === "critical");
      break;
    case "today": {
      // Hoje = a partir do inicio do dia local, nao "ultimas 24h".
      const cutoff = startOfTodayMs();
      out = out.filter((l) => {
        const t = parseTimestamp(l.created_at);
        return t !== null && t >= cutoff;
      });
      break;
    }
    case "forgotten": {
      // Proxy para "sem follow-up ha >=30d": status ainda nao avancou
      // (new/assigned) e created_at >=30d atras. Quando o backend expor
      // last_contact_at, trocar pra esse campo.
      const cutoff = Date.now() - 30 * DAY_MS;
      out = out.filter((l) => {
        if (l.status === "contacted" || l.status === "converted") return false;
        const t = parseTimestamp(l.created_at);
        return t !== null && t <= cutoff;
      });
      break;
    }
    case "all":
    default:
      break;
  }

  const q = normalize(query.trim());
  if (q.length > 0) {
    out = out.filter(
      (l) =>
        normalize(l.vin ?? "").includes(q) ||
        normalize(l.reason ?? "").includes(q),
    );
  }

  return out;
}

export default function LeadsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = (await getAccessToken()) ?? undefined;
      setLeads(await api.listLeads({ limit: 100 }, token));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("home.error"));
    }
  }, [t]);

  useEffect(() => {
    void (async () => {
      await load();
      setInitialLoading(false);
    })();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filtered = useMemo(() => applyFilters(leads, filter, query), [leads, filter, query]);
  const activeCount = useMemo(
    () => leads.filter((l) => ACTIVE_LEAD_STATUSES.has(l.status)).length,
    [leads],
  );
  const isFiltering = filter !== "all" || query.trim().length > 0;

  function onFilterPress(k: FilterKey) {
    haptic.selection();
    setFilter(k);
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t("leads.title")}
        subtitle={
          isFiltering
            ? t("leads.subtitle_showing", { showing: filtered.length, total: activeCount })
            : activeCount === 0
              ? t("leads.subtitle_count_zero")
              : t("leads.subtitle_count", { count: activeCount })
        }
      />

      <View style={styles.controls}>
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder={t("leads.search_placeholder")}
          icon="search-outline"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.chips}
        >
          {(["all", "critical", "today", "forgotten"] as FilterKey[]).map((k) => {
            const active = filter === k;
            return (
              <Pressable
                key={k}
                onPress={() => onFilterPress(k)}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && { opacity: 0.8 },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {t(`leads.filter.${k}`)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}

      {initialLoading ? (
        <View style={styles.skeletonStack}>
          <LeadCardSkeleton />
          <LeadCardSkeleton />
          <LeadCardSkeleton />
          <LeadCardSkeleton />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            !error ? (
              query.trim().length > 0 ? (
                <EmptyState
                  icon="search-outline"
                  title={t("leads.empty_search_title")}
                  description={t("leads.empty_search_description", { query: query.trim() })}
                />
              ) : (
                <EmptyState
                  icon="briefcase-outline"
                  title={t("home.empty_title")}
                  description={t("home.empty_description")}
                />
              )
            ) : null
          }
          renderItem={({ item }) => (
            <LeadCard
              lead={item}
              onPress={() =>
                router.push({
                  pathname: "/lead/[id]",
                  // Hidrata o detalhe na hora pra evitar refetch de 200 leads. Veja lead/[id].tsx.
                  params: { id: item.id, lead: JSON.stringify(item) },
                })
              }
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        />
      )}
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    controls: {
      paddingHorizontal: spacing.xl,
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    chips: {
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    chipLabel: {
      ...typography.caption,
      fontWeight: "600",
      color: c.text,
    },
    chipLabelActive: {
      color: c.primaryText,
    },
    skeletonStack: {
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
    },
    list: {
      padding: spacing.xl,
      paddingBottom: spacing["4xl"],
    },
  });
}
