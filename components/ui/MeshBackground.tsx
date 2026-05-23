// Mesh gradient background — fixed at the root, sits behind every screen so
// the glass surfaces have texture to blur into. Three radial-style layers
// (top-left, top-right, bottom) over a flat base color. Static, no animation.
//
// Bg mesh fixo no root: 3 camadas de gradiente sobre cor base. Sem animacao.

import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/context/ThemeContext";

type MeshConfig = {
  base: string;
  topLeft: [string, string];
  topRight: [string, string];
  bottom: [string, string];
};

const MESH: Record<"light" | "dark", MeshConfig> = {
  dark: {
    base: "#161616",
    topLeft: ["rgba(40, 40, 55, 0.35)", "rgba(40, 40, 55, 0)"],
    topRight: ["rgba(60, 40, 40, 0.20)", "rgba(60, 40, 40, 0)"],
    bottom: ["rgba(30, 30, 35, 0)", "rgba(22, 22, 22, 0.45)"],
  },
  light: {
    base: "#F0F0F2",
    topLeft: ["rgba(220, 220, 235, 0.50)", "rgba(220, 220, 235, 0)"],
    topRight: ["rgba(245, 240, 235, 0.35)", "rgba(245, 240, 235, 0)"],
    bottom: ["rgba(240, 240, 242, 0)", "rgba(240, 240, 242, 0.40)"],
  },
};

export function MeshBackground() {
  const { mode } = useTheme();
  const cfg = useMemo(() => MESH[mode], [mode]);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: cfg.base }]} pointerEvents="none">
      <LinearGradient
        colors={cfg.topLeft}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={cfg.topRight}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.3, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={cfg.bottom}
        start={{ x: 0.5, y: 0.4 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
