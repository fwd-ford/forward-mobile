// LeadCardCompact — variante quadrada 170x115 do LeadCard pra grid 2x3
// na home (Figma node 1:2 / 8:55). Mostra valor + ID curto + foto Raptor
// + nome do customer + reason + hora relativa + PriorityBadge.
// Distinta do LeadCard "lista" que continua em /leads.
// Card compacto pra grid da home redesign 2026-05-25.

import { useMemo, useRef } from "react";
import {
  Animated,
  Image,
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
import { spacing, typography, type ThemeColors } from "@/lib/theme";

// Format currency com centavos: "R$ 1.987,32". Diferente de lib/format
// que omite centavos pra outras telas — aqui na home queremos visualizar
// o valor completo dado o estilo editorial do card (Figma node 8:72).
const BRL_WITH_CENTS = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const raptorAsset = require("@/assets/images/raptor-card.png");

export interface LeadCardCompactProps {
  lead: Lead;
  onPress?: () => void;
}

const SCALE_PRESSED = 0.97;
const CARD_HEIGHT = 115;
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
      ? BRL_WITH_CENTS.format(lead.expected_value_brl)
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
      <View style={styles.topRow}>
        <Text style={styles.value} numberOfLines={1}>
          {valueText}
        </Text>
        <PriorityBadge priority={lead.priority} style={styles.badge} />
      </View>
      <Text style={styles.id} numberOfLines={1}>
        ID:{shortId(lead.id)}
      </Text>
      <View style={styles.imageWrap}>
        <Image
          source={raptorAsset}
          style={styles.image}
          resizeMode="cover"
          accessible={false}
        />
      </View>
      <Text style={styles.customer} numberOfLines={1}>
        {customer}
      </Text>
      <View style={styles.bottomRow}>
        <Text style={styles.reason} numberOfLines={1}>
          {lead.reason ?? ""}
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
      borderRadius: 5,
      paddingHorizontal: 14,
      paddingTop: 8,
      paddingBottom: 6,
      overflow: "hidden",
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.xs,
    },
    value: {
      ...typography.cardValue,
      color: c.leadCardCompactText,
      flexShrink: 1,
    },
    badge: {
      flexShrink: 0,
    },
    id: {
      ...typography.cardId,
      color: c.leadCardCompactText,
      marginTop: 2,
    },
    imageWrap: {
      alignSelf: "center",
      width: "70%",
      height: 53,
      marginTop: -2,
      overflow: "hidden",
    },
    image: {
      width: "144%",
      height: "156%",
      marginLeft: "-24%",
      marginTop: "-36%",
    },
    customer: {
      ...typography.cardMeta,
      color: c.leadCardCompactText,
      marginTop: 2,
    },
    bottomRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.xs,
      marginTop: 2,
    },
    reason: {
      ...typography.cardMeta,
      color: c.leadCardCompactText,
      flex: 1,
    },
    time: {
      ...typography.cardTime,
      color: c.leadCardCompactText,
    },
  });
}
