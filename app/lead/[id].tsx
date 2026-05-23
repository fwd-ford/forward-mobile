import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast, type ToastVariant } from "@/components/ui/Toast";
import { useTheme } from "@/context/ThemeContext";
import { haptic } from "@/lib/haptics";
import { api, ApiError, type Lead } from "@/lib/api";
import { formatRelativeTime } from "@/lib/relative-time";
import {
  leadPriorityPalette,
  leadStatusPalette,
  radius,
  spacing,
  typography,
  type ThemeColors,
} from "@/lib/theme";

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: "", variant: "info" });

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      // Placeholder: API da Sprint 1 nao expoe GET lead por id.
      // Swap pra api.getLead(id) quando o endpoint singular existir.
      const all = await api.listLeads({ limit: 200 });
      setLead(all.find((l) => l.id === id) ?? null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("home.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  function onComingSoonAction(actionKey: string) {
    haptic.medium();
    setToast({
      visible: true,
      message: `${t(actionKey)}: ${t("common.coming_soon")}`,
      variant: "info",
    });
  }

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.scroll}>
          <Skeleton width={240} height={28} borderRadius={radius.sm} />
          <View style={styles.skeletonRow}>
            <Skeleton width={84} height={28} borderRadius={radius.sm} />
            <Skeleton width={84} height={28} borderRadius={radius.sm} />
          </View>
          <Skeleton width="100%" height={80} borderRadius={radius.lg} />
          <Skeleton width="100%" height={120} borderRadius={radius.lg} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing["3xl"] }]}>
        <ErrorBanner message={error} onRetry={() => void load()} />
      </View>
    );
  }

  if (!lead) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.muted}>{t("lead.not_found")}</Text>
      </View>
    );
  }

  const priority = leadPriorityPalette[lead.priority];
  const status = leadStatusPalette[lead.status];
  const relativeTime = formatRelativeTime(lead.created_at, t);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 96 }]}
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
            {relativeTime ? (
              <Text style={styles.created}>
                {t("lead.section.created")}: {relativeTime}
              </Text>
            ) : null}
          </Card>
        ) : null}
      </ScrollView>

      {/* Footer fixo com 3 acoes (stubs por enquanto) */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <FooterAction
          icon="call-outline"
          label={t("lead.actions.call")}
          onPress={() => onComingSoonAction("lead.actions.call")}
          colors={colors}
          styles={styles}
        />
        <FooterAction
          icon="chatbubble-ellipses-outline"
          label={t("lead.actions.message")}
          onPress={() => onComingSoonAction("lead.actions.message")}
          colors={colors}
          styles={styles}
        />
        <FooterAction
          icon="checkmark-circle-outline"
          label={t("lead.actions.mark_contacted")}
          onPress={() => onComingSoonAction("lead.actions.mark_contacted")}
          colors={colors}
          styles={styles}
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

type FooterActionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
};

function FooterAction({ icon, label, onPress, colors, styles }: FooterActionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.footerBtn, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={styles.footerBtnLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
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
    footerBtn: {
      flex: 1,
      minHeight: 56,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      backgroundColor: c.primarySoft,
    },
    footerBtnLabel: {
      ...typography.caption,
      fontWeight: "700",
      color: c.primary,
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
      backgroundColor: c.bg,
    },
  });
}
