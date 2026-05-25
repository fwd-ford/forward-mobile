// LeadCard — domain component for showing a lead in lists.
// Layout (left to right):
//   [3px priority stripe] [body]
// Body rows:
//   1. Priority chip (colored, uppercase) on the left + relative time on the right
//   2. VIN in mono semibold
//   3. Reason in body textMuted (optional)
//   4. Status dot + label on the left + expected value (mono primary text) on the right
// Wrapped in GlassSurface (thin variant) so it sits on top of the mesh bg.
// Card de lead: stripe + chip + VIN mono + razao + status + valor sobre glass.

import React, { useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { GlassSurface } from "@/components/ui/GlassSurface";
import { useTheme } from "@/context/ThemeContext";
import { haptic } from "@/lib/haptics";
import type { Lead } from "@/lib/api";
import { customerNameFor } from "@/lib/demo-data";
import { formatRelativeTime } from "@/lib/relative-time";
import {
  leadPriorityPalette,
  leadStatusPalette,
  radius,
  spacing,
  typography,
  type ThemeColors,
} from "@/lib/theme";

export interface LeadCardProps {
  lead: Lead;
  onPress?: () => void;
}

const SCALE_PRESSED = 0.99;

export function LeadCard({ lead, onPress }: LeadCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scale = useRef(new Animated.Value(1)).current;

  const priority = leadPriorityPalette[lead.priority];
  const status = leadStatusPalette[lead.status];
  const relativeTime = formatRelativeTime(lead.created_at, t);

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

  const cardBody = (
    <GlassSurface variant="thin" radius={18} style={styles.card}>
      <View style={[styles.stripe, { backgroundColor: priority.color }]} />
      <View style={styles.body}>
        <View style={styles.row}>
          <View style={[styles.chip, { backgroundColor: priority.bg, borderColor: priority.border }]}>
            <Text style={[styles.chipLabel, { color: priority.color }]} numberOfLines={1}>
              {t(priority.labelKey)}
            </Text>
          </View>
          {relativeTime ? (
            <Text style={styles.time} numberOfLines={1}>
              {relativeTime}
            </Text>
          ) : null}
        </View>

        <Text style={styles.customer} numberOfLines={1}>
          {customerNameFor(lead.customer_id)}
        </Text>

        <Text style={styles.vin} numberOfLines={1}>
          {lead.vin ?? "—"}
        </Text>

        {lead.reason ? (
          <Text style={styles.reason} numberOfLines={2}>
            {lead.reason}
          </Text>
        ) : null}

        <View style={styles.row}>
          <View style={styles.statusGroup}>
            <View style={[styles.dot, { backgroundColor: status.color }]} />
            <Text style={styles.statusLabel} numberOfLines={1}>
              {t(status.labelKey)}
            </Text>
          </View>
          {lead.expected_value_brl != null ? (
            <Text style={styles.value} numberOfLines={1}>
              {formatBRL(lead.expected_value_brl)}
            </Text>
          ) : null}
        </View>
      </View>
    </GlassSurface>
  );

  if (!onPress) return cardBody;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => {
          haptic.light();
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`${t(priority.labelKey)} · ${lead.vin ?? ""}`}
      >
        {cardBody}
      </Pressable>
    </Animated.View>
  );
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      padding: 0,
      overflow: "hidden",
    },
    stripe: {
      width: 3,
    },
    body: {
      flex: 1,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.md,
    },
    chip: {
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 2,
      borderRadius: radius.sm,
      borderWidth: 1,
    },
    chipLabel: {
      ...typography.label,
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    time: {
      ...typography.caption,
      color: c.textSubtle,
    },
    customer: {
      ...typography.body,
      fontWeight: "700",
      color: c.text,
    },
    vin: {
      ...typography.mono,
      fontSize: 11,
      color: c.textMuted,
      letterSpacing: 0.4,
    },
    reason: {
      ...typography.body,
      color: c.textMuted,
    },
    statusGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs + 2,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusLabel: {
      ...typography.caption,
      color: c.textMuted,
      fontWeight: "600",
    },
    value: {
      ...typography.mono,
      color: c.text,
      fontWeight: "700",
    },
  });
}
