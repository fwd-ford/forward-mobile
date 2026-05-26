// CityPicker — modal bottom sheet pra escolher a cidade que aparece
// no marker do globo. Mesma estrutura do LocalePicker. Persiste a
// escolha via UserLocationContext (AsyncStorage).

import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/context/ThemeContext";
import { useUserLocation } from "@/context/UserLocationContext";
import type { City } from "@/lib/cities";
import { haptic } from "@/lib/haptics";
import { radius, spacing, typography, type ThemeColors } from "@/lib/theme";

export interface CityPickerProps {
  visible: boolean;
  onClose: () => void;
}

export function CityPicker({ visible, onClose }: CityPickerProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { city, cities, setCity } = useUserLocation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  function onSelect(target: City) {
    if (target.id !== city.id) haptic.selection();
    setCity(target);
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
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <Text style={styles.title}>{t("profile.location")}</Text>
          </View>
          <ScrollView style={styles.list}>
            {cities.map((c, idx) => {
              const active = city.id === c.id;
              return (
                <View key={c.id}>
                  {idx > 0 ? <View style={styles.divider} /> : null}
                  <Pressable
                    onPress={() => onSelect(c)}
                    style={({ pressed }) => [
                      styles.option,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={c.label}
                    accessibilityState={{ selected: active }}
                  >
                    <View style={styles.optionTexts}>
                      <Text style={styles.optionName}>{c.name}</Text>
                      <Text style={styles.optionShort}>{c.region}</Text>
                    </View>
                    {active ? (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    ) : null}
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
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
      maxHeight: "70%",
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
    list: {
      flexGrow: 0,
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
