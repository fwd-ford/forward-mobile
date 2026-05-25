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
  { location: [-22.91, -43.17] as [number, number], size: 0.06 }, // Rio de Janeiro
  { location: [-19.92, -43.94] as [number, number], size: 0.05 }, // Belo Horizonte
  { location: [-25.43, -49.27] as [number, number], size: 0.05 }, // Curitiba
  { location: [-30.03, -51.23] as [number, number], size: 0.05 }, // Porto Alegre
  { location: [-15.78, -47.93] as [number, number], size: 0.05 }, // Brasília
  { location: [-3.13, -60.02] as [number, number], size: 0.05 }, // Manaus
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
      phi: 4.7, // pose estatica inclinada (~151° do Figma)
      theta: 0.3,
      dark: isDark ? 1 : 0,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: isDark ? [0.3, 0.3, 0.3] : [1, 1, 1],
      markerColor: [249 / 255, 115 / 255, 22 / 255], // #f97316 laranja
      glowColor: isDark ? [0.1, 0.1, 0.1] : [0.9, 0.9, 0.9],
      markers: BRAZIL_MARKERS,
      // Estatico: cobe v2 nao requer onRender. Globe renderiza com a
      // pose passada (phi, theta) e nao rotaciona sem globe.update().
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
