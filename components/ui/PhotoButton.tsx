// Photo source button (Camera / Gallery / Remove). Square card with icon
// circle + label. Extracted from profile.tsx where it lived as an inline
// subcomponent. Destructive variant flips colors to error tones.
// Extraido do profile.tsx pra reuso e clareza.

import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/context/ThemeContext";
import { radius, spacing, typography, type ThemeColors } from "@/lib/theme";

export interface PhotoButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

export function PhotoButton({
  icon,
  label,
  onPress,
  disabled,
  destructive,
}: PhotoButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && { opacity: 0.5 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View
        style={[
          styles.iconWrap,
          destructive ? { backgroundColor: colors.errorSoft } : undefined,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={destructive ? colors.error : colors.primary}
        />
      </View>
      <Text
        style={[
          styles.label,
          destructive ? { color: colors.error } : undefined,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    button: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      paddingVertical: spacing.md + 2,
      alignItems: "center",
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      ...typography.caption,
      fontWeight: "600",
      color: c.text,
    },
    pressed: { opacity: 0.7 },
  });
}
