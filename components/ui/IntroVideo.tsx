import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useVideoPlayer, VideoView } from "expo-video";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/context/ThemeContext";
import { radius, spacing, typography, type ThemeColors } from "@/lib/theme";

// Local asset — bundled into the binary, no runtime download.
// Asset local — empacotado no binario, sem download em runtime.
const INTRO_SOURCE = require("../../assets/video/intro.mp4");

const FADE_OUT_MS = 240;

export interface IntroVideoProps {
  onFinished: () => void;
}

export function IntroVideo({ onFinished }: IntroVideoProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width, height } = useWindowDimensions();
  const opacity = useSharedValue(1);
  const finished = useRef(false);

  const player = useVideoPlayer(INTRO_SOURCE, (p) => {
    p.loop = false;
    p.muted = true;
    p.play();
  });

  // Fade the overlay out, then notify the parent once.
  // Faz fade do overlay e notifica o pai uma unica vez.
  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    opacity.value = withTiming(0, { duration: FADE_OUT_MS }, (done) => {
      if (done) runOnJS(onFinished)();
    });
  }, [onFinished, opacity]);

  useEffect(() => {
    const sub = player.addListener("playToEnd", finish);
    return () => sub.remove();
  }, [player, finish]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.root, overlayStyle]}>
      <Pressable style={styles.fill} onPress={finish} accessibilityRole="button">
        <VideoView
          player={player}
          style={{ width, height }}
          contentFit="cover"
          nativeControls={false}
          allowsPictureInPicture={false}
        />
      </Pressable>
      <Pressable onPress={finish} hitSlop={12} style={styles.skip} accessibilityRole="button">
        <Text style={styles.skipLabel}>{t("intro.skip")}</Text>
      </Pressable>
    </Animated.View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.bg,
      zIndex: 100,
    },
    fill: { flex: 1 },
    skip: {
      position: "absolute",
      top: spacing["3xl"] + spacing.md,
      right: spacing.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: "rgba(11,18,32,0.55)",
      borderWidth: 1,
      borderColor: c.border,
    },
    skipLabel: {
      ...typography.caption,
      color: "#FFFFFF",
    },
  });
}
