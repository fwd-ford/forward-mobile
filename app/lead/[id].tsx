// Lead detail — Glass Minimalist redesign (Fase 2, screen 5/6).
// Header: own back pill (no Stack header) + VIN eyebrow + VIN mono large + badges.
// Body: glass sections for reason and value.
// Footer: glass thick fixed at the bottom with 3 actions.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutChangeEvent,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { FooterAction } from "@/components/ui/FooterAction";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast, type ToastVariant } from "@/components/ui/Toast";
import { useTheme } from "@/context/ThemeContext";
import { haptic } from "@/lib/haptics";
import { api, ApiError, type Lead } from "@/lib/api";
import { getCustomerById, type Customer } from "@/lib/customer";
import { customerNameFor } from "@/lib/demo-data";
import { nextPrimaryStatus } from "@/lib/lead-status";
import { getSession, isDemoSession } from "@/lib/session";
import { formatBRL } from "@/lib/format";
import { formatRelativeTime } from "@/lib/relative-time";
import {
  fontFamily,
  leadPriorityPalette,
  leadStatusPalette,
  radius,
  spacing,
  typography,
  type ThemeColors,
} from "@/lib/theme";

// Room for the floating back pill so it never covers the "Cliente" eyebrow.
const BACK_PILL_CLEARANCE = 44;

export default function LeadDetailScreen() {
  // So o id vai na URL (nada de customer_id/dealer_id no historico); o lead
  // vem de GET /api/v1/leads/{id}, que ja aplica o escopo por concessionaria.
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [lead, setLead] = useState<Lead | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [footerHeight, setFooterHeight] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: "", variant: "info" });

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      setLead(await api.getLead(id));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setLead(null);
      else setError(e instanceof ApiError ? e.message : t("home.error"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  // Fetch do customer roda em paralelo apos o lead chegar. Pode falhar por
  // RLS (auth role sem dealer/admin) — nesse caso `customer` fica null e o
  // botao Ligar segue desabilitado, sem quebrar a tela.
  useEffect(() => {
    if (!lead?.customer_id) return;
    let alive = true;
    void getCustomerById(lead.customer_id).then((c) => {
      if (alive) setCustomer(c);
    });
    return () => {
      alive = false;
    };
  }, [lead?.customer_id]);

  const showToast = useCallback((message: string, variant: ToastVariant = "info") => {
    setToast({ visible: true, message, variant });
  }, []);

  const onCallPress = useCallback(async () => {
    if (!customer?.phone) {
      showToast(t("lead.no_phone"));
      return;
    }
    haptic.medium();
    // tel: aceita formatos variados; deixamos o OS interpretar.
    await Linking.openURL(`tel:${customer.phone}`).catch(() => showToast(t("lead.no_phone")));
  }, [customer, showToast, t]);

  // WhatsApp: opens the chat with a pre-filled service reminder (the attendant
  // still reviews and taps send). Demo mode / no opt-in uses the share sheet so
  // a fictitious number is never messaged.
  const onWhatsAppPress = useCallback(async () => {
    if (!lead) return;
    haptic.medium();
    const session = getSession();
    const text = t("lead.whatsapp_message", {
      name: (customer?.full_name ?? lead.customer_name ?? customerNameFor(lead.customer_id)).split(" ")[0],
      dealer: session?.user.dealer_name ?? "Ford",
      model: lead.vehicle_model ?? "Ford",
    });
    const digits = customer?.phone?.replace(/\D/g, "");
    const target =
      digits && customer?.opt_in_whatsapp && !isDemoSession()
        ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
        : `https://wa.me/?text=${encodeURIComponent(text)}`;
    await Linking.openURL(target).catch(() => showToast(t("lead.status_update_failed"), "error"));
  }, [customer, lead, showToast, t]);

  // Primary funnel action: new/assigned -> contacted -> converted (PATCH /leads/{id}).
  const nextStatus = lead ? nextPrimaryStatus(lead.status) : null;
  const onAdvanceStatus = useCallback(async () => {
    if (!lead || !nextStatus || updating) return;
    haptic.medium();
    setUpdating(true);
    try {
      const updated = await api.updateLead(lead.id, { status: nextStatus });
      setLead(updated);
      haptic.success();
      showToast(
        t("lead.status_updated", { status: t(leadStatusPalette[updated.status].labelKey) }),
        "success",
      );
    } catch (e) {
      haptic.error();
      if (e instanceof ApiError && e.status === 409) {
        showToast(t("lead.invalid_transition", { status: t(leadStatusPalette[nextStatus].labelKey) }), "error");
      } else {
        showToast(e instanceof ApiError ? e.message : t("lead.status_update_failed"), "error");
      }
    } finally {
      setUpdating(false);
    }
  }, [lead, nextStatus, updating, showToast, t]);

  const onFooterLayout = useCallback((e: LayoutChangeEvent) => {
    setFooterHeight(e.nativeEvent.layout.height);
  }, []);

  // Back pill rendered floating top-left; appears in every state so a stuck
  // skeleton or error screen still has a way out.
  // Pill flutuante de voltar — presente em loading/error/empty/ok pra nao
  // prender o usuario.
  const BackPill = (
    <Pressable
      onPress={() => router.back()}
      hitSlop={8}
      style={({ pressed }) => [
        styles.backPillFloat,
        { top: insets.top + spacing.md },
        pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
      ]}
    >
      <Ionicons name="chevron-back" size={18} color={colors.text} />
      <Text style={styles.backPillFloatLabel}>{t("common.back")}</Text>
    </Pressable>
  );

  if (loading && !lead) {
    return (
      <View style={styles.container}>
        {BackPill}
        <View style={[styles.scroll, { paddingTop: insets.top + spacing["3xl"] + BACK_PILL_CLEARANCE }]}>
          <Skeleton width={120} height={14} borderRadius={radius.sm} />
          <Skeleton width={240} height={32} borderRadius={radius.sm} />
          <View style={styles.skeletonRow}>
            <Skeleton width={84} height={28} borderRadius={radius.pill} />
            <Skeleton width={84} height={28} borderRadius={radius.pill} />
          </View>
          <Skeleton width="100%" height={120} borderRadius={radius.xl} />
          <Skeleton width="100%" height={96} borderRadius={radius.xl} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        {BackPill}
        <View style={[styles.errorWrap, { paddingTop: insets.top + spacing["3xl"] + BACK_PILL_CLEARANCE }]}>
          <ErrorBanner message={error} onRetry={() => void load()} />
        </View>
      </View>
    );
  }

  if (!lead) {
    return (
      <View style={styles.container}>
        {BackPill}
        <View style={[styles.center, { paddingTop: insets.top }]}>
          <Text style={styles.muted}>{t("lead.not_found")}</Text>
        </View>
      </View>
    );
  }

  const priority = leadPriorityPalette[lead.priority];
  const status = leadStatusPalette[lead.status];
  const relativeTime = formatRelativeTime(lead.created_at, t);

  return (
    <View style={styles.container}>
      {BackPill}
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + spacing["3xl"] + BACK_PILL_CLEARANCE,
            paddingBottom: insets.bottom + footerHeight + spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.labelCaps}>{t("lead.section.customer")}</Text>
        <Text style={styles.customerName} numberOfLines={1}>
          {customer?.full_name ?? lead.customer_name ?? customerNameFor(lead.customer_id)}
        </Text>

        {/* Priority como badge filled (urgencia comunica visualmente);
            status como dot+label (mesma convencao do LeadCard) — antes
            os dois eram badges identicos e o leitor nao sabia o que era
            o que. */}
        <View style={styles.badgesRow}>
          <View
            style={[styles.badge, { backgroundColor: priority.bg, borderColor: priority.border }]}
          >
            <Text style={[styles.badgeLabel, { color: priority.color }]}>
              {t(priority.labelKey)}
            </Text>
          </View>
          <View style={styles.statusGroup}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={styles.statusLabel}>{t(status.labelKey)}</Text>
          </View>
        </View>

        <Text style={styles.metaLine}>
          {t("lead.vin_label")} · {lead.vin ?? "—"}
        </Text>
        {lead.vehicle_model ? (
          <Text style={styles.metaLine}>
            {t("lead.vehicle")} · {lead.vehicle_model}
            {lead.vehicle_year ? ` ${lead.vehicle_year}` : ""}
          </Text>
        ) : null}

        {relativeTime ? (
          <Text style={styles.created}>
            {t("lead.section.created")} · {relativeTime}
          </Text>
        ) : null}

        {lead.reason ? (
          <GlassSurface variant="thin" radius={20} style={styles.glassSection}>
            <View style={styles.glassSectionInner}>
              <Text style={styles.sectionLabel}>{t("lead.section.reason")}</Text>
              <Text style={styles.sectionBody}>{lead.reason}</Text>
            </View>
          </GlassSurface>
        ) : null}

        {lead.churn_probability != null ? (
          <GlassSurface variant="thin" radius={20} style={styles.glassSection}>
            <View style={styles.glassSectionInner}>
              <Text style={styles.sectionLabel}>{t("lead.churn")}</Text>
              <Text style={styles.valueBig}>{Math.round(lead.churn_probability * 100)}%</Text>
            </View>
          </GlassSurface>
        ) : null}

        {lead.expected_value_brl != null ? (
          <GlassSurface variant="thin" radius={20} style={styles.glassSection}>
            <View style={styles.glassSectionInner}>
              <Text style={styles.sectionLabel}>{t("lead.section.value")}</Text>
              <Text style={styles.valueBig}>{formatBRL(lead.expected_value_brl)}</Text>
            </View>
          </GlassSurface>
        ) : null}
      </ScrollView>

      {/* Footer fixo glass thick. Stubs honestos (disabled + "Em breve"). */}
      <GlassSurface
        variant="thick"
        radius={0}
        border={false}
        style={styles.footerWrap}
      >
        <View
          style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
          onLayout={onFooterLayout}
        >
          <FooterAction
            icon="call-outline"
            label={t("lead.actions.call")}
            onPress={() => void onCallPress()}
            disabled={!customer?.phone}
          />
          <FooterAction
            icon="logo-whatsapp"
            label={t("lead.actions.message")}
            onPress={() => void onWhatsAppPress()}
          />
          <FooterAction
            icon={nextStatus === "converted" ? "trophy-outline" : "checkmark-circle-outline"}
            label={
              nextStatus === "converted"
                ? t("lead.actions.mark_converted")
                : nextStatus
                  ? t("lead.actions.mark_contacted")
                  : t("lead.actions.done")
            }
            onPress={() => void onAdvanceStatus()}
            disabled={!nextStatus || updating}
          />
        </View>
      </GlassSurface>

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
    container: { flex: 1, backgroundColor: "transparent" },
    scroll: {
      paddingHorizontal: spacing["2xl"],
      gap: spacing.sm,
    },
    backPillFloat: {
      position: "absolute",
      left: spacing.lg,
      zIndex: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderStrong,
      backgroundColor: c.surface,
    },
    backPillFloatLabel: {
      ...typography.label,
      fontFamily: fontFamily.semibold,
      color: c.text,
    },
    labelCaps: {
      ...typography.labelCaps,
      color: c.textMuted,
    },
    customerName: {
      ...typography.hDisplay,
      fontSize: 32,
      lineHeight: 38,
      color: c.text,
      letterSpacing: -0.4,
      marginBottom: spacing.sm,
    },
    badgesRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    badge: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    badgeLabel: {
      ...typography.label,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    statusGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs + 2,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusLabel: {
      ...typography.caption,
      color: c.textMuted,
      fontWeight: "600",
    },
    metaLine: {
      ...typography.caption,
      color: c.textMuted,
    },
    created: {
      ...typography.caption,
      color: c.textSubtle,
      marginBottom: spacing.md,
    },
    glassSection: { marginBottom: spacing.sm },
    glassSectionInner: { padding: spacing.lg, gap: spacing.sm },
    sectionLabel: {
      ...typography.labelCaps,
      color: c.textMuted,
    },
    sectionBody: {
      ...typography.body,
      color: c.text,
    },
    valueBig: {
      fontFamily: fontFamily.semibold,
      fontSize: 36,
      letterSpacing: -0.8,
      color: c.text,
    },
    footerWrap: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.glassBorder,
    },
    footer: {
      flexDirection: "row",
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
    },
    errorWrap: { paddingHorizontal: spacing["2xl"] },
    skeletonRow: { flexDirection: "row", gap: spacing.sm },
    muted: { ...typography.body, color: c.textMuted },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xl,
      gap: spacing.lg,
    },
  });
}
