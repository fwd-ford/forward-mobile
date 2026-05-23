// Home — Glass Minimalist redesign (Fase 2, screen 2/6).
// Layout:
//   label-caps "HOJE" -> Fraunces 40 greeting
//   GlassSurface hero with 2 KPI columns (active leads + pipeline)
//   "Leads recentes" Fraunces 28 section header
//   Lista de LeadCards (LeadCard ja foi migrado pra GlassSurface thin)
//
// Header inline per the screen-by-screen workflow; ScreenTitle vira component
// na Fase 3 quando todas as telas tiverem o mesmo padrao.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
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
import { GlassSurface } from "@/components/ui/GlassSurface";
import { useTheme } from "@/context/ThemeContext";
import { ACTIVE_LEAD_STATUSES, api, ApiError, type Lead } from "@/lib/api";
import { formatBRL } from "@/lib/format";
import { fetchMyProfile } from "@/lib/profile";
import { getAccessToken } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { fontFamily, radius, spacing, typography, type ThemeColors } from "@/lib/theme";

type HeroStats = {
  activeLeads: number;
  pipelineBRL: number;
};

const TOP_VISIBLE = 5;
// Hero stats sao calculados client-side a partir do array retornado por listLeads.
// Sprint 1 nao tem endpoint dedicado de agregacao (/leads/stats), entao puxamos
// um teto bem acima da expectativa real por vendedor.
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
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
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

  const showHero = !(error && leads.length === 0);

  return (
    <FlatList
      style={styles.container}
      data={initialLoading ? [] : topLeads}
      keyExtractor={(l) => l.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          {/* Label + Fraunces 40 greeting (Mailchimp pattern). */}
          {/* Label minusculo + titulo Fraunces gigante (padrao Mailchimp). */}
          <Text style={styles.labelCaps}>{t("home.today")}</Text>
          <Text style={styles.heroTitle} numberOfLines={2}>
            {greeting.trim()}
          </Text>

          {showHero ? (
            <GlassSurface variant="regular" radius={24} style={styles.heroCard}>
              <View style={styles.heroInner}>
                <View style={styles.heroCol}>
                  <Text style={styles.heroLabel}>{t("home.hero.active_leads")}</Text>
                  <Text style={styles.heroValue}>{hero.activeLeads}</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroCol}>
                  <Text style={styles.heroLabel}>{t("home.hero.pipeline")}</Text>
                  <Text style={styles.heroValue}>
                    {formatBRL(hero.pipelineBRL, { compact: true })}
                  </Text>
                </View>
              </View>
            </GlassSurface>
          ) : null}

          {error && leads.length > 0 ? (
            <View style={styles.errorWrap}>
              <ErrorBanner message={error} onRetry={() => void load()} />
            </View>
          ) : null}

          {initialLoading ? (
            <View style={styles.skeletonStack}>
              <LeadCardSkeleton />
              <LeadCardSkeleton />
              <LeadCardSkeleton />
            </View>
          ) : !initialLoading && topLeads.length > 0 ? (
            <Text style={styles.sectionTitle}>{t("home.todays_leads")}</Text>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        !initialLoading ? (
          error ? (
            <View style={styles.emptyWrap}>
              <EmptyState
                icon="cloud-offline-outline"
                title={t("home.error_title")}
                description={error}
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
        <View style={styles.leadItem}>
          <LeadCard
            lead={item}
            onPress={() =>
              router.push({
                pathname: "/lead/[id]",
                params: { id: item.id, lead: JSON.stringify(item) },
              })
            }
          />
        </View>
      )}
    />
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { backgroundColor: "transparent" },
    list: { paddingBottom: spacing["6xl"] },
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
      marginBottom: spacing.lg,
    },
    heroCard: {
      marginBottom: spacing["2xl"],
    },
    heroInner: {
      flexDirection: "row",
      alignItems: "stretch",
      padding: spacing.xl,
    },
    heroCol: { flex: 1, gap: spacing.xs },
    heroDivider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: c.glassBorder,
      marginHorizontal: spacing.lg,
    },
    heroLabel: {
      ...typography.labelCaps,
      color: c.textMuted,
    },
    heroValue: {
      fontFamily: fontFamily.semibold,
      fontSize: 32,
      letterSpacing: -0.6,
      color: c.text,
    },
    errorWrap: { marginBottom: spacing.lg },
    skeletonStack: { gap: spacing.md, marginTop: spacing.sm },
    sectionTitle: {
      ...typography.hSection,
      color: c.text,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    leadItem: {
      marginHorizontal: spacing["2xl"],
      marginTop: spacing.md,
    },
    emptyWrap: { alignItems: "center", marginTop: spacing["2xl"], gap: spacing.lg },
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
    seeAll: {
      marginTop: spacing.xl,
      marginHorizontal: spacing["2xl"],
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderStrong,
      alignItems: "center",
    },
    seeAllLabel: {
      ...typography.caption,
      fontFamily: fontFamily.semibold,
      color: c.text,
    },
  });
}
