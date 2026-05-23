import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { LeadCard } from "@/components/domain/LeadCard";
import { LeadCardSkeleton } from "@/components/domain/LeadCardSkeleton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useTheme } from "@/context/ThemeContext";
import { ACTIVE_LEAD_STATUSES, api, ApiError, type Lead } from "@/lib/api";
import { formatBRL } from "@/lib/format";
import { fetchMyProfile } from "@/lib/profile";
import { getAccessToken } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { radius, spacing, typography, type ThemeColors } from "@/lib/theme";

type HeroStats = {
  activeLeads: number;
  pipelineBRL: number;
};

const TOP_VISIBLE = 5;
// Hero stats sao calculados client-side a partir do array retornado por listLeads.
// Sprint 1 nao tem endpoint dedicado de agregacao (/leads/stats), entao puxamos um
// teto bem acima da expectativa real por vendedor (~50 leads ativos). Quando o backend
// expor agregacao, trocar isso por uma chamada dedicada e parar de truncar.
const HERO_FETCH_LIMIT = 200;
const GREETING_REFRESH_MS = 60_000;

function greetingKey(hour: number): "home.greeting_morning" | "home.greeting_afternoon" | "home.greeting_evening" {
  if (hour < 12) return "home.greeting_morning";
  if (hour < 18) return "home.greeting_afternoon";
  return "home.greeting_evening";
}

function computeHeroStats(leads: Lead[]): HeroStats {
  const activeLeads = leads.filter((l) => ACTIVE_LEAD_STATUSES.has(l.status)).length;
  const pipelineBRL = leads.reduce((sum, l) => sum + (l.expected_value_brl ?? 0), 0);
  return { activeLeads, pipelineBRL };
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  // Reavalia o greeting periodicamente: sem isso o usuario que abre o app as 11h55
  // ve "Bom dia" ate fechar e reabrir, mesmo passando do meio-dia.
  const [now, setNow] = useState(() => new Date());

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = (await getAccessToken()) ?? undefined;
      const data = await api.listLeads({ limit: HERO_FETCH_LIMIT }, token);
      setLeads(data);
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

  useEffect(() => {
    void (async () => {
      const profile = await fetchMyProfile().catch(() => null);
      if (profile?.full_name) {
        setName(profile.full_name.split(" ")[0]);
        return;
      }
      const auth = await supabase.auth.getUser();
      const email = auth.data.user?.email;
      if (email) {
        const prefix = email.split("@")[0];
        setName(prefix.charAt(0).toUpperCase() + prefix.slice(1));
      }
    })();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), GREETING_REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const hero = useMemo(() => computeHeroStats(leads), [leads]);
  const topLeads = useMemo(() => leads.slice(0, TOP_VISIBLE), [leads]);
  const greeting = t(greetingKey(now.getHours()), { name: name || "" });

  return (
    <FlatList
      style={styles.container}
      data={initialLoading ? [] : topLeads}
      keyExtractor={(l) => l.id}
      contentContainerStyle={[styles.list, { paddingTop: insets.top }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
      ListHeaderComponent={
        <View>
          <ScreenHeader title={t("home.today")} subtitle={greeting.trim()} />

          {/*
            Hero hides on initial error with no cached leads: rendering "0 / R$ 0"
            mid-error reads as real numbers and panics the user. Once any data
            arrived (e.g. refresh-after-success), keep it visible even if a later
            refresh errors so stale-but-useful beats blank.
            Hero some no erro inicial sem leads: "0 / R$ 0" parece dado real e
            assusta. Com dados em cache, mantem mesmo num erro de refresh.
          */}
          {!(error && leads.length === 0) ? (
            <Card style={styles.hero}>
              <View style={styles.heroCol}>
                <Text style={styles.heroLabel}>{t("home.hero.active_leads")}</Text>
                <Text style={styles.heroValue}>{hero.activeLeads}</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroCol}>
                <Text style={styles.heroLabel}>{t("home.hero.pipeline")}</Text>
                <Text style={styles.heroValue}>{formatBRL(hero.pipelineBRL, { compact: true })}</Text>
              </View>
            </Card>
          ) : null}

          {error && leads.length > 0 ? (
            <ErrorBanner message={error} onRetry={() => void load()} />
          ) : null}

          {initialLoading ? (
            <View style={styles.skeletonStack}>
              <LeadCardSkeleton />
              <LeadCardSkeleton />
              <LeadCardSkeleton />
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        !initialLoading ? (
          error ? (
            <EmptyState
              icon="cloud-offline-outline"
              title={t("home.error_title")}
              description={error}
              action={
                <Button
                  label={t("common.retry")}
                  variant="secondary"
                  onPress={() => void load()}
                />
              }
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
      ListFooterComponent={
        !initialLoading && leads.length > TOP_VISIBLE ? (
          <Pressable
            onPress={() => router.push("/leads")}
            accessibilityRole="button"
            style={({ pressed }) => [styles.seeAll, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.seeAllLabel}>
              {t("home.see_all_with_count", { count: leads.length })}
            </Text>
          </Pressable>
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
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { backgroundColor: c.bg },
    list: { paddingBottom: spacing["4xl"] },
    hero: {
      flexDirection: "row",
      alignItems: "stretch",
      marginHorizontal: spacing.xl,
      marginBottom: spacing.lg,
      padding: spacing.lg,
    },
    heroCol: { flex: 1, gap: spacing.xs },
    heroDivider: {
      width: 1,
      backgroundColor: c.separator,
      marginHorizontal: spacing.md,
    },
    heroLabel: {
      ...typography.label,
      color: c.textMuted,
      textTransform: "uppercase",
    },
    heroValue: {
      ...typography.mono,
      fontSize: 28,
      color: c.text,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    skeletonStack: {
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
    },
    seeAll: {
      marginTop: spacing.lg,
      marginHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: "center",
    },
    seeAllLabel: {
      ...typography.caption,
      fontWeight: "700",
      color: c.primary,
    },
  });
}
