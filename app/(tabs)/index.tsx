// Home — Figma pixel-perfect redesign (2026-05-25).
// Layout (Figma node 1:2 light / 8:55 dark):
//   - AppBackground gradient vertical fullscreen
//   - Hero area (altura ~460) absolute positioned:
//       greeting "Bem-vindo, {nome completo}" Playfair 36 top-left
//       RotatingClock HH:MM gigante top-right
//       Globe DOM Component pontilhado canto direito
//       HeroStatsBlock vertical com bleed -80 a esquerda (Leads + Valor)
//   - SectionTitle "Ultimos Leads" Playfair italic 20
//   - Grid 2 colunas de LeadCardCompact (3 linhas, 6 leads)
//   - SeeAllPill no footer quando ha mais leads
// Spec: docs/superpowers/specs/2026-05-25-mobile-dashboard-redesign-design.md
// Home redesign: greeting + clock + globe + hero vertical + grid de cards.

import { memo, useCallback, useEffect, useMemo, useState } from "react";
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

import { AppBackground } from "@/components/ui/AppBackground";
import Globe from "@/components/illustrations/Globe.dom";
import { RotatingClock } from "@/components/illustrations/RotatingClock";
import { HeroStatsBlock, type HeroStatsItem } from "@/components/ui/HeroStatsBlock";
import { LeadCardCompact } from "@/components/domain/LeadCardCompact";
import { LeadCardCompactSkeleton } from "@/components/domain/LeadCardCompactSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useTheme } from "@/context/ThemeContext";
import { useUserLocation } from "@/context/UserLocationContext";
import { ACTIVE_LEAD_STATUSES, api, ApiError, type Lead } from "@/lib/api";
import { toFullName, toFriendlyFirstName } from "@/lib/displayName";
import { formatBRL } from "@/lib/format";
import { fetchMyProfile } from "@/lib/profile";
import { supabase } from "@/lib/supabase";
import { fontFamily, radius, spacing, typography, type ThemeColors } from "@/lib/theme";

type HeroStats = {
  activeLeads: number;
  pipelineBRL: number;
};

const TOP_VISIBLE = 6;
const HERO_FETCH_LIMIT = 200;
const GRID_HORIZONTAL_PADDING = 30;
const GRID_GAP = 8;
const HERO_AREA_HEIGHT = 460;

function computeHeroStats(leads: Lead[]): HeroStats {
  const activeLeads = leads.filter((l) => ACTIVE_LEAD_STATUSES.has(l.status)).length;
  const pipelineBRL = leads.reduce((sum, l) => sum + (l.expected_value_brl ?? 0), 0);
  return { activeLeads, pipelineBRL };
}

const Greeting = memo(function Greeting({ name }: { name: string }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Text style={styles.greeting} numberOfLines={2}>
      {t("home.welcome", { name })}
    </Text>
  );
});

const HeroDecoration = memo(function HeroDecoration({
  markerLat,
  markerLng,
}: {
  markerLat: number;
  markerLng: number;
}) {
  return (
    <>
      <View style={decorationStyles.clockWrap} pointerEvents="none">
        <RotatingClock />
      </View>
      <View style={decorationStyles.globeWrap} pointerEvents="none">
        <Globe size={324} markerLat={markerLat} markerLng={markerLng} />
      </View>
    </>
  );
});

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { city } = useUserLocation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<string>("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.listLeads({ limit: HERO_FETCH_LIMIT });
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
        setName(toFullName(profile.full_name));
        return;
      }
      const auth = await supabase.auth.getUser();
      const email = auth.data.user?.email;
      if (email) {
        const local = email.split("@")[0] ?? "";
        setName(toFriendlyFirstName(local));
      }
    })();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const hero = useMemo(() => computeHeroStats(leads), [leads]);
  const topLeads = useMemo(() => leads.slice(0, TOP_VISIBLE), [leads]);

  const showHero = !(error && leads.length === 0);

  const heroItems = useMemo<readonly [HeroStatsItem, HeroStatsItem]>(
    () => [
      { label: t("home.hero.leads_label"), value: String(hero.activeLeads) },
      {
        label: t("home.hero.value_label"),
        value: formatBRL(hero.pipelineBRL, { compact: true, omitCurrency: true }),
      },
    ],
    [hero, t],
  );

  return (
    <AppBackground>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.list}
        data={initialLoading ? [] : topLeads}
        keyExtractor={(l) => l.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.text}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.heroArea}>
              <Greeting name={name} />
              <HeroDecoration markerLat={city.lat} markerLng={city.lng} />
              {showHero ? (
                <View style={styles.heroStatsWrap}>
                  <HeroStatsBlock items={heroItems} />
                </View>
              ) : null}
            </View>
            {error && leads.length > 0 ? (
              <View style={styles.errorWrap}>
                <ErrorBanner message={error} onRetry={() => void load()} />
              </View>
            ) : null}
            {!initialLoading && topLeads.length > 0 ? (
              <Text style={styles.sectionTitle}>{t("home.recent_leads")}</Text>
            ) : null}
            {initialLoading ? (
              <Text style={styles.sectionTitle}>{t("home.recent_leads")}</Text>
            ) : null}
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: GRID_GAP }} />}
        ListEmptyComponent={
          initialLoading ? (
            <View style={styles.skeletonGrid}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={styles.skeletonCell}>
                  <LeadCardCompactSkeleton />
                </View>
              ))}
            </View>
          ) : error ? (
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
          <LeadCardCompact
            lead={item}
            onPress={() =>
              router.push({
                pathname: "/lead/[id]",
                params: { id: item.id },
              })
            }
          />
        )}
      />
    </AppBackground>
  );
}

const decorationStyles = StyleSheet.create({
  clockWrap: {
    position: "absolute",
    // Clock empurrado +15px pra direita (175 -> 190) pra distanciar
    // do bleed do hero card a esquerda em viewports menores.
    left: 190,
    top: 100,
  },
  // Globe posicionado com bleed a direita: ~half dele sai pela borda
  // direita da tela em viewport mobile (393px). Cria efeito editorial
  // simetrico ao bleed do hero card a esquerda.
  globeWrap: {
    position: "absolute",
    left: 185,
    top: 130,
    width: 324,
    height: 315,
  },
});

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { backgroundColor: "transparent" },
    list: { paddingBottom: spacing["6xl"] },
    heroArea: {
      height: HERO_AREA_HEIGHT,
      paddingTop: 45,
    },
    heroStatsWrap: {
      position: "absolute",
      // bleed leve (-20): card sai um pouco da borda esquerda mantendo
      // ar editorial, mas com texto "Leads / Valor" visivel na tela.
      // Figma original tinha -80 mas escondia o texto inteiro em mobile.
      left: -15,
      top: 192,
    },
    columnWrapper: {
      gap: GRID_GAP,
      paddingHorizontal: GRID_HORIZONTAL_PADDING,
    },
    sectionTitle: {
      ...typography.hSectionItalic,
      color: c.text,
      paddingHorizontal: GRID_HORIZONTAL_PADDING,
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    errorWrap: {
      paddingHorizontal: GRID_HORIZONTAL_PADDING,
      marginBottom: spacing.lg,
    },
    skeletonGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: GRID_HORIZONTAL_PADDING,
      gap: GRID_GAP,
    },
    skeletonCell: {
      // 2 colunas: (viewport - 2*padding - gap) / 2 = width disponivel.
      // Calculo em width:'48%' aproxima sem precisar saber viewport.
      width: "48%",
    },
    emptyWrap: {
      alignItems: "center",
      marginTop: spacing["2xl"],
      gap: spacing.lg,
      paddingHorizontal: GRID_HORIZONTAL_PADDING,
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
      color: c.text,
    },
    greeting: {
      ...typography.hDisplay,
      color: c.text,
      paddingHorizontal: GRID_HORIZONTAL_PADDING,
      maxWidth: 280,
    },
  });
}
