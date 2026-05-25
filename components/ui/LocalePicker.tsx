import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useLocale } from "@/context/LocaleContext";
import { haptic } from "@/lib/haptics";
import { LOCALE_LABEL, LOCALE_SHORT, type Locale } from "@/lib/locale";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing, typography, type ThemeColors } from "@/lib/theme";

export interface LocalePickerProps {
  visible: boolean;
  onClose: () => void;
}

export function LocalePicker({ visible, onClose }: LocalePickerProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { locale, locales, setLocale } = useLocale();
  const styles = useMemo(() => createStyles(colors), [colors]);

  function onSelect(target: Locale) {
    if (target !== locale) haptic.selection();
    setLocale(target);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdropWrap}>
        {/* Backdrop e card como irmaos. No web, Pressable vira <button>;
            antes o card+options ficavam DENTRO do backdrop button, gerando
            <button> aninhado e hydration error. Agora o button do backdrop
            cobre absoluteFill atras, e o card e' outro node solto. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t("cta.close")}
        />
        <View
          style={[styles.card, { paddingBottom: insets.bottom + spacing.md }]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Ionicons name="globe-outline" size={20} color={colors.primary} />
            <Text style={styles.title}>{t("profile.language")}</Text>
          </View>
          {locales.map((loc, idx) => {
            const active = locale === loc;
            return (
              <View key={loc}>
                {idx > 0 ? <View style={styles.divider} /> : null}
                <Pressable
                  onPress={() => onSelect(loc)}
                  style={({ pressed }) => [
                    styles.option,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={LOCALE_LABEL[loc]}
                  accessibilityState={{ selected: active }}
                >
                  <View style={styles.optionTexts}>
                    <Text style={styles.optionName}>{LOCALE_LABEL[loc]}</Text>
                    <Text style={styles.optionShort}>{LOCALE_SHORT[loc]}</Text>
                  </View>
                  {active ? (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    backdropWrap: {
      flex: 1,
      backgroundColor: c.overlay,
      justifyContent: "flex-end",
    },
    card: {
      backgroundColor: c.surface,
      borderTopLeftRadius: radius["2xl"],
      borderTopRightRadius: radius["2xl"],
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.borderStrong,
      marginBottom: spacing.lg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingBottom: spacing.md,
    },
    title: {
      ...typography.h3,
      color: c.text,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.md + 2,
    },
    optionTexts: { flex: 1 },
    optionName: {
      ...typography.body,
      fontWeight: "600",
      color: c.text,
    },
    optionShort: {
      ...typography.caption,
      color: c.textMuted,
      marginTop: 2,
      letterSpacing: 1,
    },
    divider: {
      height: 1,
      backgroundColor: c.separator,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
