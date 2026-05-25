// GlobeLocationPin — overlay sobre o Globe que mostra um pin estilizado
// + linha clean + label com cidade/UF do usuario. Posicionamento
// absolute pra ficar ancorado ao globo (pose estatica, coordenadas
// hardcoded da projecao visual de Sao Paulo no canvas do cobe).
// Pin custom + leader-line + label de localizacao sobre o globo.

import { useMemo } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/context/ThemeContext";
import { useUserLocation } from "@/lib/useUserLocation";
import { fontFamily, type ThemeColors } from "@/lib/theme";

export interface GlobeLocationPinProps {
  /** Posicao do pin (canto superior do icone) relativa ao parent. */
  style?: ViewStyle;
}

const PIN_SIZE = 18;
const LINE_HEIGHT = 28;
const PIN_COLOR = "#f97316"; // laranja, igual ao markerColor antigo do cobe

export function GlobeLocationPin({ style }: GlobeLocationPinProps) {
  const { colors } = useTheme();
  const location = useUserLocation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <Ionicons name="location" size={PIN_SIZE} color={PIN_COLOR} style={styles.pin} />
      <View style={styles.line} />
      <View style={styles.labelWrap}>
        <Text style={styles.label} numberOfLines={1}>
          {location.label}
        </Text>
      </View>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
    },
    pin: {
      // Pin com leve sombra pra destacar sobre o globo.
      textShadowColor: "rgba(0, 0, 0, 0.4)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    line: {
      width: 1,
      height: LINE_HEIGHT,
      backgroundColor: c.text,
      opacity: 0.7,
      marginTop: -2,
    },
    labelWrap: {
      marginTop: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
      backgroundColor: c.heroVerticalBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.heroVerticalBorder,
    },
    label: {
      fontFamily: fontFamily.medium,
      fontSize: 11,
      letterSpacing: -0.3,
      color: c.text,
    },
  });
}
