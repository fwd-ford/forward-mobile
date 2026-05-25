// AppBackground — wrapper que aplica o gradient vertical da home (Figma
// node 1:2 light / 8:55 dark). LinearGradient absoluto fullscreen,
// le bgGradientFrom/bgGradientTo do theme.
// Background da home: gradient vertical, le cores do tema.

import { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/context/ThemeContext";

export interface AppBackgroundProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function AppBackground({ children, style }: AppBackgroundProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={[colors.bgGradientFrom, colors.bgGradientTo]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
