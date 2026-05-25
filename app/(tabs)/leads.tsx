// Leads — Glass Minimalist redesign (Fase 2, screen 3/6).
// Header: labelCaps with count + Fraunces 40 "Leads" title.
// Inline glass search bar + filter chips (active=solid pill, inactive=glass).
// LeadCard list already migrated to GlassSurface in the Home PR.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { LeadCard } from "@/components/domain/LeadCard";
import { LeadCardSkeleton } from "@/components/domain/LeadCardSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { useTheme } from "@/context/ThemeContext";
import { haptic } from "@/lib/haptics";
import { ACTIVE_LEAD_STATUSES, api, ApiError, type Lead } from "@/lib/api";
import { fontFamily, radius, spacing, typography, type ThemeColors } from "@/lib/theme";

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
      const cutoff = startOfTodayMs();
      out = out.filter((l) => {
        const t = parseTimestamp(l.created_at);
        return t !== null && t >= cutoff;
      });
      break;
    }
    case "forgotten": {
      // Proxy para "sem follow-up ha >=30d": status ainda nao avancou e created_at >=30d.
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
  const [searchFocused, setSearchFocused] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setLeads(await api.listLeads({ limit: 100 }));
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
  // Counts per filter ANTES do search query — chips mostram o universo
  // disponivel, search filtra em cima do filter ativo.
  const filterCounts = useMemo(
    () => ({
      all: applyFilters(leads, "all", "").length,
      critical: applyFilters(leads, "critical", "").length,
      today: applyFilters(leads, "today", "").length,
      forgotten: applyFilters(leads, "forgotten", "").length,
    }),
    [leads],
  );
  const isFiltering = filter !== "all" || query.trim().length > 0;
  // Mirror Home: when fetch fails with no cached data, swap the search+chips
  // header + ErrorBanner combo for a full-screen EmptyState + retry pill so
  // both tabs feel identical under network failures.
  // Erro fullscreen igual a Home quando lista vazia (cloud-offline + pill).
  const showFullScreenError = error !== null && leads.length === 0;

  function onFilterPress(k: FilterKey) {
    haptic.selection();
    setFilter(k);
  }

  const filters: { key: FilterKey; labelKey: string }[] = [
    { key: "all", labelKey: "leads.filter.all" },
    { key: "critical", labelKey: "leads.filter.critical" },
    { key: "today", labelKey: "leads.filter.today" },
    { key: "forgotten", labelKey: "leads.filter.forgotten" },
  ];

  const subtitle = isFiltering
    ? t("leads.subtitle_showing", { showing: filtered.length, total: activeCount })
    : activeCount === 0
      ? t("leads.subtitle_count_zero")
      : t("leads.subtitle_count", { count: activeCount });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.labelCaps}>{subtitle}</Text>
        <Text style={styles.heroTitle} numberOfLines={1}>
          {t("leads.title")}
        </Text>

        {/* Search + chips hidden when there is nothing to filter (full-screen error). */}
        {/* Esconde busca/chips no erro fullscreen — nao ha o que filtrar. */}
        {!showFullScreenError ? (
          <>
            <GlassSurface variant="thin" radius={radius.pill} style={styles.searchWrap}>
              <View style={styles.searchInner}>
                <Ionicons name="search-outline" size={18} color={colors.textMuted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t("leads.search_placeholder")}
                  placeholderTextColor={colors.textSubtle}
                  autoCapitalize="none"
                  autoCorrect={false}
                  // VIN tem 17 chars; motivo curto cabe folgado em 80.
                  // Cap previne payload flooding em caso de paste acidental.
                  maxLength={80}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  style={[styles.searchInput, { color: colors.text }]}
                />
                {query.length > 0 ? (
                  <Pressable onPress={() => setQuery("")} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color={colors.textSubtle} />
                  </Pressable>
                ) : null}
              </View>
            </GlassSurface>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.chipsRow}
            >
              {filters.map((f) => {
                const active = filter === f.key;
                const Wrapper = active ? View : GlassSurface;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => onFilterPress(f.key)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={({ pressed }) => [pressed && { opacity: 0.85 }]}
                  >
                    <Wrapper
                      variant="thin"
                      radius={radius.pill}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text
                        style={[
                          styles.chipLabel,
                          { color: active ? colors.primaryText : colors.text },
                        ]}
                      >
                        {t(f.labelKey)}
                        {filterCounts[f.key] > 0 ? (
                          <Text
                            style={[
                              styles.chipCount,
                              { color: active ? colors.primaryText : colors.textMuted },
                            ]}
                          >
                            {"  "}
                            {filterCounts[f.key]}
                          </Text>
                        ) : null}
                      </Text>
                    </Wrapper>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        ) : null}
      </View>

      {showFullScreenError ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="cloud-offline-outline"
            title={t("home.error_title")}
            description={error ?? undefined}
          />
          <Pressable
            onPress={() => void load()}
            style={({ pressed }) => [
              styles.retryPill,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Text style={styles.retryPillLabel}>{t("common.retry")}</Text>
          </Pressable>
        </View>
      ) : error ? (
        <View style={styles.errorWrap}>
          <ErrorBanner message={error} onRetry={() => void load()} />
        </View>
      ) : null}

      {showFullScreenError ? null : initialLoading ? (
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
              tintColor={colors.text}
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
            <View style={styles.leadItem}>
              <LeadCard
                lead={item}
                onPress={() =>
                  router.push({
                    pathname: "/lead/[id]",
                    params: { id: item.id },
                  })
                }
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: "transparent" },
    header: {
      paddingHorizontal: spacing["2xl"],
      paddingTop: spacing["3xl"],
      gap: spacing.md,
    },
    labelCaps: {
      ...typography.labelCaps,
      color: c.textMuted,
    },
    heroTitle: {
      ...typography.hDisplay,
      color: c.text,
      marginBottom: spacing.md,
    },
    searchWrap: { marginBottom: spacing.xs },
    searchInner: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      height: 48,
    },
    searchInput: {
      flex: 1,
      ...typography.body,
      paddingVertical: 0,
    },
    chipsRow: {
      gap: spacing.sm,
      paddingVertical: spacing.xs,
      paddingRight: spacing["2xl"],
    },
    chip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
    },
    chipActive: {
      backgroundColor: c.primary,
      borderWidth: 0,
    },
    chipCount: {
      ...typography.label,
      fontFamily: fontFamily.semibold,
      opacity: 0.8,
    },
    chipLabel: {
      ...typography.caption,
      fontFamily: fontFamily.semibold,
    },
    errorWrap: {
      paddingHorizontal: spacing["2xl"],
      marginBottom: spacing.md,
    },
    emptyWrap: {
      alignItems: "center",
      marginTop: spacing["2xl"],
      gap: spacing.lg,
      paddingHorizontal: spacing["2xl"],
    },
    retryPill: {
      paddingVertical: spacing.md - 2,
      paddingHorizontal: spacing["2xl"],
      borderRadius: radius.pill,
      backgroundColor: c.primary,
    },
    retryPillLabel: {
      ...typography.body,
      fontFamily: fontFamily.semibold,
      color: c.primaryText,
    },
    skeletonStack: {
      gap: spacing.md,
      paddingHorizontal: spacing["2xl"],
      marginTop: spacing.md,
    },
    list: {
      paddingTop: spacing.md,
      paddingBottom: spacing["6xl"],
    },
    leadItem: {
      marginHorizontal: spacing["2xl"],
      marginBottom: spacing.md,
    },
  });
}
