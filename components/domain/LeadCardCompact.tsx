// LeadCardCompact — card editorial pra grid 2x3 da home. Sem foto, com
// hierarquia tipografica casando com a estetica da home: valor em
// Playfair Italic (ecoa o "Ultimos Leads" + KPI labels do hero), nome
// em Manrope Medium, reason em Manrope Light, ID + tempo no rodape.
// Distinta do LeadCard "lista" que continua em /leads.

import { useMemo, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { useTheme } from "@/context/ThemeContext";
import type { Lead } from "@/lib/api";
import { customerNameFor } from "@/lib/demo-data";
import { haptic } from "@/lib/haptics";
import { formatRelativeTime } from "@/lib/relative-time";
import { fontFamily, spacing, typography, type ThemeColors } from "@/lib/theme";

// Format currency sem centavos: "R$ 1.987". Valor focal limpo, sem
// truncar com badge ao lado. Mantemos o "R$" pra clareza monetaria.
const BRL_NO_CENTS = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export interface LeadCardCompactProps {
  lead: Lead;
  onPress?: () => void;
}

const SCALE_PRESSED = 0.97;
const CARD_HEIGHT = 130;
const ID_LENGTH = 5;

function shortId(id: string): string {
  return id.replace(/-/g, "").slice(0, ID_LENGTH).toUpperCase();
}

export function LeadCardCompact({ lead, onPress }: LeadCardCompactProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scale = useRef(new Animated.Value(1)).current;

  const customer = customerNameFor(lead.customer_id);
  const relativeTime = formatRelativeTime(lead.created_at, t);
  const valueText =
    lead.expected_value_brl != null
      ? BRL_NO_CENTS.format(lead.expected_value_brl)
      : "—";

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scale, {
      toValue: SCALE_PRESSED,
      useNativeDriver: true,
      speed: 60,
      bounciness: 0,
    }).start();
  };
  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 60,
      bounciness: 6,
    }).start();
  };

  const body = (
    <View style={styles.card}>
      {/* Topo: valor focal em Playfair Italic + badge prioridade */}
      <View style={styles.topRow}>
        <Text style={styles.value} numberOfLines={1}>
          {valueText}
        </Text>
        <PriorityBadge priority={lead.priority} style={styles.badge} />
      </View>

      {/* Identidade: nome do customer destacado + reason ao lado */}
      <Text style={styles.customer} numberOfLines={1}>
        {customer}
      </Text>
      <Text style={styles.reason} numberOfLines={2}>
        {lead.reason ?? ""}
      </Text>

      {/* Rodape: linha sutil separando + id mono + relative time */}
      <View style={styles.divider} />
      <View style={styles.bottomRow}>
        <Text style={styles.id} numberOfLines={1}>
          #{shortId(lead.id)}
        </Text>
        <Text style={styles.time} numberOfLines={1}>
          {relativeTime ?? ""}
        </Text>
      </View>
    </View>
  );

  if (!onPress) return body;

  return (
    <Animated.View style={[styles.outer, { transform: [{ scale }] }]}>
      <Pressable
        onPress={() => {
          haptic.light();
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`${customer}, ${valueText}`}
      >
        {body}
      </Pressable>
    </Animated.View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    // outer wrap absorve o flex:1 do FlatList numColumns pra que o
    // Animated.View nao colapse o card pra largura intrinseca.
    outer: {
      flex: 1,
    },
    card: {
      flex: 1,
      height: CARD_HEIGHT,
      backgroundColor: c.leadCardCompactBg,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 10,
      overflow: "hidden",
      // Border sutil pra dar definicao sem ser pesada.
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.heroVerticalBorder,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: spacing.xs,
    },
    // Valor: focal point. Playfair Italic ecoa "Ultimos Leads" e
    // "Leads/Valor" do hero — mantem coesao editorial.
    value: {
      fontFamily: fontFamily.displayItalic,
      fontSize: 16,
      lineHeight: 20,
      letterSpacing: -0.4,
      color: c.leadCardCompactText,
      flexShrink: 1,
    },
    badge: {
      flexShrink: 0,
      marginTop: 2,
    },
    customer: {
      fontFamily: fontFamily.medium,
      fontSize: 12,
      letterSpacing: -0.2,
      color: c.leadCardCompactText,
      marginTop: 8,
    },
    reason: {
      ...typography.cardMeta,
      fontSize: 11,
      lineHeight: 14,
      color: c.leadCardCompactText,
      opacity: 0.7,
      marginTop: 2,
      flex: 1,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.leadCardCompactText,
      opacity: 0.15,
      marginTop: 6,
      marginBottom: 6,
    },
    bottomRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    id: {
      fontFamily: fontFamily.mono,
      fontSize: 10,
      letterSpacing: 0.5,
      color: c.leadCardCompactText,
      opacity: 0.55,
    },
    time: {
      ...typography.cardMeta,
      fontSize: 10,
      letterSpacing: 0.2,
      color: c.leadCardCompactText,
      opacity: 0.8,
    },
  });
}
