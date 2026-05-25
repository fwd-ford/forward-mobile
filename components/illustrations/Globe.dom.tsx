// Globe.dom.tsx — Expo DOM Component que renderiza o globo pontilhado
// estilo MagicUI (cobe.js + WebGL). Diretiva 'use dom' empacota como
// webview transparente nativa (Expo 50+). Estatico inclinado, sem
// rotacao, com markers nas capitais brasileiras.
// Spec: docs/superpowers/specs/2026-05-25-mobile-dashboard-redesign-design.md

"use dom";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";

export interface GlobeProps {
  theme: "light" | "dark";
  size?: number;
}

const BRAZIL_MARKERS = [
  { location: [-23.55, -46.63] as [number, number], size: 0.07 }, // São Paulo
];

export default function Globe({ theme, size = 324 }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const isDark = theme === "dark";
    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: size * 2,
      height: size * 2,
      // Pose centralizando America do Sul (Brasil ao centro).
      // phi 5.5 traz longitude -60 (centro do Brasil) pra face visivel.
      // theta 0.3 = leve inclinacao N-S pra equilibrar hemisferios.
      phi: 5.5,
      theta: 0.3,
      dark: isDark ? 1 : 0,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      // baseColor define a cor dos dots de continentes. Light mode usa
      // dots escuros (#333) sobre esfera clara; dark usa dots brancos.
      baseColor: isDark ? [1, 1, 1] : [0.2, 0.2, 0.2],
      markerColor: [249 / 255, 115 / 255, 22 / 255], // #f97316 laranja
      glowColor: isDark ? [0.05, 0.05, 0.05] : [0.95, 0.95, 0.95],
      markers: BRAZIL_MARKERS,
      // onRender mantem o render loop ativo. Estatico: nao incrementa phi.
      onRender: (state) => {
        state.phi = 5.5;
        state.theta = 0.3;
      },
    });
    return () => {
      globe.destroy();
    };
  }, [theme, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        background: "transparent",
        display: "block",
      }}
    />
  );
}
