// Horizontal shake animation — call shake() to trigger a quick "no" gesture.
// Spread translateX onto an Animated.View transform. Useful for form errors.
// Animacao de shake horizontal — gesto de "no" rapido para erro de form.

import { useRef } from "react";
import { Animated } from "react-native";

const DISPLACEMENT = 8;
const STEP_DURATION = 60;

export function useShake() {
  const translateX = useRef(new Animated.Value(0)).current;

  function shake() {
    translateX.setValue(0);
    Animated.sequence([
      Animated.timing(translateX, {
        toValue: -DISPLACEMENT,
        duration: STEP_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: DISPLACEMENT,
        duration: STEP_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: -DISPLACEMENT / 2,
        duration: STEP_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: STEP_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  }

  return { translateX, shake };
}
