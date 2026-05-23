// Inline error banner with optional retry action. Replaces the <Text style={error}>
// pattern in Home, Leads, LeadDetail. Always renders an icon for scannability;
// retry button only renders if onRetry is provided.
// Banner inline de erro: icon + mensagem + retry opcional.

import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/context/ThemeContext";
import { radius, spacing, typography, type ThemeColors } from "@/lib/theme";
import { haptic } from "@/lib/haptics";

export interface ErrorBannerProps {
  message: string;
  /** Sync ou async. Quando async, o banner mostra spinner ate a promise resolver. */
  onRetry?: () => void | Promise<void>;
  /** Override the default retry label. Pass an i18n key if you want a non-default label. */
  retryLabel?: string;
}

export function ErrorBanner({ message, onRetry, retryLabel }: ErrorBannerProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry || retrying) return;
    haptic.light();
    try {
      setRetrying(true);
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
      <Text style={styles.message} numberOfLines={3}>
        {message}
      </Text>
      {onRetry ? (
        <Pressable
          onPress={handleRetry}
          disabled={retrying}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={retryLabel ?? t("common.retry")}
          accessibilityState={{ busy: retrying, disabled: retrying }}
          style={({ pressed }) => [
            styles.retry,
            pressed && !retrying && { opacity: 0.7 },
            retrying && { opacity: 0.85 },
          ]}
        >
          {retrying ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <Text style={styles.retryLabel}>{retryLabel ?? t("common.retry")}</Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      backgroundColor: c.errorSoft,
      borderColor: c.error,
      borderWidth: 1,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      marginHorizontal: spacing.xl,
      marginBottom: spacing.md,
    },
    message: {
      flex: 1,
      ...typography.caption,
      color: c.text,
      fontWeight: "600",
    },
    retry: {
      minHeight: 44,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      borderRadius: radius.sm,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.error,
      alignItems: "center",
      justifyContent: "center",
    },
    retryLabel: {
      ...typography.caption,
      fontWeight: "700",
      color: c.error,
    },
  });
}
