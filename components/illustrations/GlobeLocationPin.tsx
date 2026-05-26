// GlobeLocationPin — overlay sobre o Globe que mostra um pin estilizado
// + linha clean + label com cidade/UF do usuario. Posicionamento
// absolute pra ficar ancorado ao globo (pose estatica, coordenadas
// hardcoded da projecao visual de Sao Paulo no canvas do cobe).
// Pin custom + leader-line + label de localizacao sobre o globo.

import { useMemo } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";

import { useTheme } from "@/context/ThemeContext";
import { useUserLocation } from "@/lib/useUserLocation";
import { fontFamily, type ThemeColors } from "@/lib/theme";

export interface GlobeLocationPinProps {
  /** Posicao do pin (canto superior do dot) relativa ao parent. */
  style?: ViewStyle;
}

const DOT_OUTER = 14;
const DOT_INNER = 7;
const RING = 2;
const LINE_HEIGHT = 22;
const PIN_COLOR = "#f97316"; // laranja, igual ao markerColor antigo do cobe

export function GlobeLocationPin({ style }: GlobeLocationPinProps) {
  const { colors } = useTheme();
  const location = useUserLocation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {/* Dot estilo map marker moderno: anel branco em volta + miolo
          laranja. Sombra discreta destaca sobre o globo. */}
      <View style={styles.dotOuter}>
        <View style={styles.dotInner} />
      </View>
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
    dotOuter: {
      width: DOT_OUTER,
      height: DOT_OUTER,
      borderRadius: DOT_OUTER / 2,
      backgroundColor: "#ffffff",
      borderWidth: RING,
      borderColor: "rgba(0, 0, 0, 0.12)",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 4,
      elevation: 4,
    },
    dotInner: {
      width: DOT_INNER,
      height: DOT_INNER,
      borderRadius: DOT_INNER / 2,
      backgroundColor: PIN_COLOR,
    },
    line: {
      width: StyleSheet.hairlineWidth,
      height: LINE_HEIGHT,
      backgroundColor: c.text,
      opacity: 0.6,
      marginTop: 2,
    },
    labelWrap: {
      marginTop: 2,
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
