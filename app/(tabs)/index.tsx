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
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useTheme } from "@/context/ThemeContext";
import { api, ApiError, type Lead } from "@/lib/api";
import { fetchMyProfile } from "@/lib/profile";
import { getAccessToken } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { radius, spacing, typography, type ThemeColors } from "@/lib/theme";

type HeroStats = {
  activeLeads: number;
  pipelineBRL: number;
};

const TOP_VISIBLE = 5;

function greetingKey(hour: number): "home.greeting_morning" | "home.greeting_afternoon" | "home.greeting_evening" {
  if (hour < 12) return "home.greeting_morning";
  if (hour < 18) return "home.greeting_afternoon";
  return "home.greeting_evening";
}

function computeHeroStats(leads: Lead[]): HeroStats {
  const activeLeads = leads.filter((l) => l.status !== "lost" && l.status !== "expired").length;
  const pipelineBRL = leads.reduce((sum, l) => sum + (l.expected_value_brl ?? 0), 0);
  return { activeLeads, pipelineBRL };
}

function formatCompactBRL(value: number): string {
  if (value >= 1000) {
    const k = value / 1000;
    return `R$ ${k.toFixed(k >= 10 ? 0 : 1)}k`;
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
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

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = (await getAccessToken()) ?? undefined;
      const data = await api.listLeads({ limit: 50 }, token);
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
      if (email) setName(email.split("@")[0]);
    })();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const hero = useMemo(() => computeHeroStats(leads), [leads]);
  const topLeads = useMemo(() => leads.slice(0, TOP_VISIBLE), [leads]);
  const greeting = t(greetingKey(new Date().getHours()), { name: name || "" });

  return (
    <FlatList
      style={[styles.container, { paddingTop: insets.top }]}
      data={initialLoading ? [] : topLeads}
      keyExtractor={(l) => l.id}
      contentContainerStyle={styles.list}
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

          <Card style={styles.hero}>
            <View style={styles.heroCol}>
              <Text style={styles.heroLabel}>{t("home.hero.active_leads")}</Text>
              <Text style={styles.heroValue}>{hero.activeLeads}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroCol}>
              <Text style={styles.heroLabel}>{t("home.hero.pipeline")}</Text>
              <Text style={styles.heroValue}>{formatCompactBRL(hero.pipelineBRL)}</Text>
            </View>
          </Card>

          {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}

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
        !initialLoading && !error ? (
          <EmptyState
            icon="briefcase-outline"
            title={t("home.empty_title")}
            description={t("home.empty_description")}
          />
        ) : null
      }
      ListFooterComponent={
        !initialLoading && leads.length > TOP_VISIBLE ? (
          <Pressable
            onPress={() => router.push("/leads")}
            accessibilityRole="button"
            accessibilityLabel={t("home.see_all_with_count", { count: leads.length })}
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
