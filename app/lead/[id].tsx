import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { FooterAction } from "@/components/ui/FooterAction";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast, type ToastVariant } from "@/components/ui/Toast";
import { useTheme } from "@/context/ThemeContext";
import { haptic } from "@/lib/haptics";
import { api, ApiError, type Lead } from "@/lib/api";
import { formatBRL } from "@/lib/format";
import { formatRelativeTime } from "@/lib/relative-time";
import {
  leadPriorityPalette,
  leadStatusPalette,
  radius,
  spacing,
  typography,
  type ThemeColors,
} from "@/lib/theme";

function tryParseLead(serialized: string | string[] | undefined): Lead | null {
  if (!serialized || Array.isArray(serialized)) return null;
  try {
    const parsed = JSON.parse(serialized) as Lead;
    return parsed && typeof parsed.id === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export default function LeadDetailScreen() {
  const { id, lead: serializedLead } = useLocalSearchParams<{ id: string; lead?: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Hidrata na hora se a tela anterior passou o lead serializado (caminho feliz
  // vindo de Home/Leads). Cai pro listLeads quando o usuario abre por deep link
  // sem param, ou quando a desserializacao falha.
  const hydratedLead = useMemo(() => tryParseLead(serializedLead), [serializedLead]);

  const [lead, setLead] = useState<Lead | null>(hydratedLead);
  const [loading, setLoading] = useState(hydratedLead === null);
  const [error, setError] = useState<string | null>(null);
  const [footerHeight, setFooterHeight] = useState(0);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: "", variant: "info" });

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      // Placeholder: API da Sprint 1 nao expoe GET lead por id. Quando expor,
      // trocar por api.getLead(id) e dropar o filter abaixo.
      const all = await api.listLeads({ limit: 200 });
      setLead(all.find((l) => l.id === id) ?? null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("home.error"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    if (hydratedLead && hydratedLead.id === id) return;
    void load();
  }, [hydratedLead, id, load]);

  const onComingSoonAction = useCallback(
    (actionKey: string) => {
      haptic.medium();
      setToast({
        visible: true,
        message: `${t(actionKey)}: ${t("common.coming_soon")}`,
        variant: "info",
      });
    },
    [t],
  );

  const onFooterLayout = useCallback((e: LayoutChangeEvent) => {
    setFooterHeight(e.nativeEvent.layout.height);
  }, []);

  if (loading && !lead) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.scroll}>
          <Skeleton width={240} height={28} borderRadius={radius.sm} />
          <View style={styles.skeletonRow}>
            <Skeleton width={84} height={28} borderRadius={radius.sm} />
            <Skeleton width={84} height={28} borderRadius={radius.sm} />
          </View>
          <Skeleton width={140} height={16} borderRadius={radius.sm} />
          <Skeleton width={120} height={14} borderRadius={radius.sm} />
          <Skeleton width="100%" height={64} borderRadius={radius.lg} />
          <Skeleton width="100%" height={120} borderRadius={radius.lg} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing["3xl"] }]}>
        <ErrorBanner message={error} onRetry={() => void load()} />
        <View style={styles.notFoundActions}>
          <Button label={t("common.back")} variant="ghost" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  if (!lead) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.muted}>{t("lead.not_found")}</Text>
        <View style={styles.notFoundActions}>
          <Button label={t("common.back")} variant="primary" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const priority = leadPriorityPalette[lead.priority];
  const status = leadStatusPalette[lead.status];
  const relativeTime = formatRelativeTime(lead.created_at, t);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + footerHeight + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.vin} numberOfLines={1}>
          {lead.vin ?? "—"}
        </Text>

        <View style={styles.badgesRow}>
          <View style={[styles.badge, { backgroundColor: priority.bg, borderColor: priority.border }]}>
            <Text style={[styles.badgeLabel, { color: priority.color }]}>
              {t(priority.labelKey)}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: status.bg, borderColor: status.border }]}>
            <Text style={[styles.badgeLabel, { color: status.color }]}>
              {t(status.labelKey)}
            </Text>
          </View>
        </View>

        {relativeTime ? (
          <Text style={styles.created}>
            {t("lead.section.created")}: {relativeTime}
          </Text>
        ) : null}

        {lead.reason ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t("lead.section.reason")}</Text>
            <Text style={styles.sectionBody}>{lead.reason}</Text>
          </View>
        ) : null}

        {lead.expected_value_brl != null ? (
          <Card style={styles.valueCard}>
            <Text style={styles.sectionLabel}>{t("lead.section.value")}</Text>
            <Text style={styles.valueBig}>{formatBRL(lead.expected_value_brl)}</Text>
          </Card>
        ) : null}
      </ScrollView>

      {/* Footer fixo: stubs honestos (disabled + "Em breve") ate o backend expor as acoes. */}
      <View
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
        onLayout={onFooterLayout}
      >
        <FooterAction
          icon="call-outline"
          label={t("lead.actions.call")}
          onPress={() => onComingSoonAction("lead.actions.call")}
          disabled
        />
        <FooterAction
          icon="chatbubble-ellipses-outline"
          label={t("lead.actions.message")}
          onPress={() => onComingSoonAction("lead.actions.message")}
          disabled
        />
        <FooterAction
          icon="checkmark-circle-outline"
          label={t("lead.actions.mark_contacted")}
          onPress={() => onComingSoonAction("lead.actions.mark_contacted")}
          disabled
        />
      </View>

      <Toast
        message={toast.message}
        variant={toast.variant}
        visible={toast.visible}
        onHide={() => setToast((p) => ({ ...p, visible: false }))}
      />
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    scroll: {
      padding: spacing.xl,
      gap: spacing.lg,
    },
    vin: {
      ...typography.mono,
      fontSize: 22,
      color: c.text,
      fontWeight: "700",
      letterSpacing: -0.2,
    },
    badgesRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    badge: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.sm,
      borderWidth: 1,
    },
    badgeLabel: {
      ...typography.label,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    section: {
      gap: spacing.sm,
    },
    sectionLabel: {
      ...typography.label,
      color: c.textMuted,
      textTransform: "uppercase",
    },
    sectionBody: {
      ...typography.body,
      color: c.text,
    },
    valueCard: {
      gap: spacing.sm,
    },
    valueBig: {
      ...typography.mono,
      fontSize: 32,
      color: c.primary,
      fontWeight: "800",
      letterSpacing: -0.4,
    },
    created: {
      ...typography.caption,
      color: c.textSubtle,
    },
    footer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: "row",
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      backgroundColor: c.surface,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    skeletonRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    muted: { ...typography.body, color: c.textMuted },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xl,
      gap: spacing.lg,
      backgroundColor: c.bg,
    },
    notFoundActions: {
      marginTop: spacing.lg,
      paddingHorizontal: spacing.xl,
    },
  });
}
