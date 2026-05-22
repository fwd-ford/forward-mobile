// Fade-in + small upward translate on mount. Spread the returned values onto
// an Animated.View {opacity, transform: [{translateY}]}. Use to give static
// content a gentle "appear" rather than a hard pop on screen mount.
// Fade-in + leve subida ao montar — entrada suave para conteudo estatico.

import { useEffect, useRef } from "react";
import { Animated } from "react-native";

export function useFadeIn(duration = 320, fromY = 12) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(fromY)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, duration]);

  return { opacity, translateY };
}
