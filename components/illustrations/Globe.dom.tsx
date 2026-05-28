// Globe.dom.tsx — Expo DOM Component que renderiza o globo pontilhado
// estilo MagicUI (cobe.js + WebGL). Diretiva 'use dom' empacota como
// webview transparente nativa (Expo 50+). Estatico inclinado, sem
// rotacao, com markers nas capitais brasileiras.
// Spec: docs/superpowers/specs/2026-05-25-mobile-dashboard-redesign-design.md

"use dom";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";

export interface GlobeProps {
  size?: number;
  /** Latitude do marker laranja (cidade do usuario). Default SP. */
  markerLat?: number;
  /** Longitude do marker laranja (cidade do usuario). Default SP. */
  markerLng?: number;
}

// Globe propositadamente theme-agnostic: esfera escura com continentes
// brancos funciona visualmente em ambos os temas (light e dark) e EVITA
// o problema de recriar o globo no theme toggle (DOM Components piscam
// quando re-montam — globo "sumia" ao alternar tema).
export default function Globe({
  size = 324,
  markerLat = -23.55,
  markerLng = -46.63,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: size * 2,
      height: size * 2,
      // Pose centralizando America do Sul (Brasil ao centro).
      // phi 5.5 traz longitude -60 (centro do Brasil) pra face visivel.
      // theta 0.3 = leve inclinacao N-S pra equilibrar hemisferios.
      phi: 5.5,
      theta: 0.3,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [1, 1, 1],
      markerColor: [249 / 255, 115 / 255, 22 / 255], // #f97316 laranja
      glowColor: [0.6, 0.6, 0.6],
      markers: [
        { location: [markerLat, markerLng] as [number, number], size: 0.07 },
      ],
      // onRender mantem o render loop ativo. Estatico: nao incrementa phi.
      onRender: (state) => {
        state.phi = 5.5;
        state.theta = 0.3;
      },
    });
    return () => {
      globe.destroy();
    };
  }, [size, markerLat, markerLng]);

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
