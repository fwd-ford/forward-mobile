# Mobile Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Project rule forbids subagent-driven dev for production code (see `feedback_code_rules` memory).

**Goal:** Reimplementar a home `app/(tabs)/index.tsx` do forward-mobile pixel-perfect ao Figma FORD (light node 1:2, dark node 8:55), incluindo migração global Fraunces→Playfair Display e Inter→Manrope, e novos componentes (Globe via Expo DOM Component, RotatingClock, LeadCardCompact, PriorityBadge, HeroStatsBlock, AppBackground).

**Architecture:** Migração mínima de fontes (swap dos valores em `fontFamily`, keys ficam iguais), adição de tokens novos no theme (gradients, hero vertical, lead card compact, bottom bar) sem remover existentes. Novos componentes isolados em `components/illustrations/`, `components/ui/` e `components/domain/`. Rewrite cirúrgico do `index.tsx`. Verificação por typecheck + lint + Playwright MCP (projeto não tem Jest).

**Tech Stack:** React Native 0.83 + Expo SDK 55 + Expo Router + TypeScript strict. Novas deps: `cobe` (globo), `@expo-google-fonts/playfair-display`, `@expo-google-fonts/manrope`, `@react-native-masked-view/masked-view`.

**Spec:** `docs/superpowers/specs/2026-05-25-mobile-dashboard-redesign-design.md` (commits `e3946b3` + `46810ae`).

**Branch:** `redesign/dashboard-figma` (já criada).

---

## Convenções

- Todos os comandos rodam de `forward-repos/forward-mobile/` (a branch já está checked out).
- Commits em PT-BR seguindo padrão dos commits recentes (`feat(mobile):`, `feat+fix(mobile):`, `chore(mobile):`, `docs(mobile):`).
- Comments bilingual (EN primeiro, PT-BR quando agregar contexto cultural). Code em EN.
- Cada task termina com commit. Não batch commits.
- `npm run typecheck` é o gate primário. `npm run lint` é secundário.

---

## Task 1: Adicionar dependências, remover fontes antigas

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Adicionar novas deps**

Run:

```bash
npm install cobe @expo-google-fonts/playfair-display @expo-google-fonts/manrope @react-native-masked-view/masked-view
```

Expected: deps adicionadas em `dependencies`, lockfile atualizado, sem erros de peer.

- [ ] **Step 2: Remover deps antigas de fontes**

Run:

```bash
npm uninstall @expo-google-fonts/fraunces @expo-google-fonts/inter
```

Expected: deps removidas.

- [ ] **Step 3: Verificar package.json**

Run:

```bash
grep -E '"(cobe|playfair-display|manrope|masked-view|fraunces|inter)"' package.json
```

Expected output (Fraunces e Inter NÃO devem aparecer):

```text
"@expo-google-fonts/manrope": "^X.Y.Z",
"@expo-google-fonts/playfair-display": "^X.Y.Z",
"@react-native-masked-view/masked-view": "^X.Y.Z",
"cobe": "^X.Y.Z",
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(mobile): trocar Fraunces+Inter por Playfair+Manrope, adicionar cobe e masked-view"
```

---

## Task 2: Atualizar `lib/theme.ts` — fontFamily + novos typography + cores

**Files:**

- Modify: `lib/theme.ts`

- [ ] **Step 1: Ler estado atual**

Run:

```bash
sed -n '120,145p' lib/theme.ts
```

Expected: bloco atual de `fontFamily` exportando Fraunces + Inter.

- [ ] **Step 2: Substituir bloco `fontFamily` no `lib/theme.ts`**

Substituir o bloco entre os comentários `// Font families — Fraunces...` e o fechamento `} as const;` (linhas ~119-140) por:

```ts
// Font families — Playfair Display (display serif) + Manrope (sans body)
// loaded via expo-google-fonts in _layout.tsx. Keys preservadas pra que a
// migração ocorra sem precisar atualizar nenhum consumer (todo lugar que
// usava Fraunces via displayBold passa a renderizar Playfair Bold, etc).
// Mono fica em system stack (no bundle), com Windows fallback.
// Fontes: Playfair Display + Manrope via @expo-google-fonts; mono em system stack.
export const fontFamily = {
  // Display serif (Playfair Display) — for h-display + h-section.
  displayRegular: "PlayfairDisplay_400Regular",
  displaySemibold: "PlayfairDisplay_600SemiBold",
  displayBold: "PlayfairDisplay_700Bold",
  displayItalic: "PlayfairDisplay_500Medium_Italic",
  // Sans body (Manrope) — for body, captions, labels, mono fallback.
  regular: "Manrope_400Regular",
  medium: "Manrope_500Medium",
  semibold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  light: "Manrope_300Light",
  // Mono stack (system).
  mono: Platform.select({
    ios: "Menlo",
    android: "monospace",
    default:
      'ui-monospace, "SF Mono", "JetBrains Mono", "Cascadia Code", "Consolas", "Liberation Mono", Menlo, monospace',
  }) as string,
} as const;
```

- [ ] **Step 3: Atualizar `hDisplay` em `typography`**

Localizar bloco `hDisplay` (linha ~272) e substituir:

```ts
// Before:
hDisplay: {
  fontFamily: fontFamily.displayBold,
  fontSize: fontSize["5xl"],
  lineHeight: 44,
  letterSpacing: -1.2,
},

// After (Figma values):
hDisplay: {
  fontFamily: fontFamily.displayRegular,
  fontSize: 36,
  lineHeight: 45,
  letterSpacing: -1.8,
},
```

- [ ] **Step 4: Adicionar novas entries de `typography`**

Logo após o bloco `monoSmall` (linha ~342, antes do `} as const;` que fecha typography), inserir:

```ts
  // Home redesign — Figma pixel-perfect entries.
  // Adicionados no redesign 2026-05-25, consumidos por home + componentes
  // novos (HeroStatsBlock, LeadCardCompact, RotatingClock, PriorityBadge).
  hKpiValue: {
    fontFamily: fontFamily.displayRegular,
    fontSize: 48,
    lineHeight: 48,
    letterSpacing: -2.4,
  },
  hKpiLabel: {
    fontFamily: fontFamily.displayItalic,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.8,
  },
  hSectionItalic: {
    fontFamily: fontFamily.displayItalic,
    fontSize: 20,
    lineHeight: 30,
    letterSpacing: -1,
  },
  cardValue: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    letterSpacing: -0.7,
  },
  cardId: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    letterSpacing: -0.6,
  },
  cardMeta: {
    fontFamily: fontFamily.light,
    fontSize: 10,
    letterSpacing: -0.5,
  },
  cardTime: {
    fontFamily: fontFamily.light,
    fontSize: 14,
    letterSpacing: -0.7,
  },
  clockHero: {
    fontFamily: fontFamily.regular,
    fontSize: 80,
    lineHeight: 80,
    letterSpacing: -4,
  },
  badge: {
    fontFamily: fontFamily.light,
    fontSize: 10,
    letterSpacing: -0.5,
  },
```

- [ ] **Step 5: Adicionar tokens novos de cor em `ThemeColors` type**

Localizar a interface `ThemeColors` (linha ~11) e adicionar antes do fechamento `}`:

```ts
  // Home redesign tokens (Figma node 1:2 / 8:55).
  bgGradientFrom: string;
  bgGradientTo: string;
  heroVerticalBg: string;
  heroVerticalBorder: string;
  clockGradientFrom: string;
  clockGradientMid: string;
  clockGradientTo: string;
  leadCardCompactBg: string;
  leadCardCompactText: string;
  bottomBarBg: string;
```

- [ ] **Step 6: Adicionar valores em `palette.light`**

Localizar o objeto `palette.light` (linha ~57). Antes do fechamento `},`, adicionar:

```ts
    // Home redesign — Figma node 1:2 (light).
    bgGradientFrom: "#f0e9e9",
    bgGradientTo: "#4b4b4b",
    heroVerticalBg: "rgba(255, 255, 255, 0.51)",
    heroVerticalBorder: "#c5c5c5",
    clockGradientFrom: "rgba(0, 0, 0, 0.09)",
    clockGradientMid: "rgba(51, 51, 51, 0.49)",
    clockGradientTo: "#666666",
    leadCardCompactBg: "rgba(217, 217, 217, 0.66)",
    leadCardCompactText: "#3a3838",
    bottomBarBg: "rgba(238, 238, 238, 0.98)",
```

- [ ] **Step 7: Adicionar valores em `palette.dark`**

Localizar o objeto `palette.dark`. Antes do fechamento `},`, adicionar:

```ts
    // Home redesign — Figma node 8:55 (dark).
    bgGradientFrom: "#4a4a4a",
    bgGradientTo: "#0d0d0d",
    heroVerticalBg: "rgba(0, 0, 0, 0.51)",
    heroVerticalBorder: "#4c4c4c",
    clockGradientFrom: "rgba(255, 255, 255, 0.09)",
    clockGradientMid: "rgba(255, 255, 255, 0.49)",
    clockGradientTo: "#ffffff",
    leadCardCompactBg: "rgba(9, 9, 9, 0.66)",
    leadCardCompactText: "#ffffff",
    bottomBarBg: "rgba(15, 15, 15, 0.98)",
```

- [ ] **Step 8: Typecheck**

Run:

```bash
npm run typecheck
```

Expected: zero erros. Se aparecer erro tipo "Property 'bgGradientFrom' is missing" em outro arquivo, isso é esperado e será resolvido nas próximas tasks (esses arquivos consomem o theme).

- [ ] **Step 9: Commit**

```bash
git add lib/theme.ts
git commit -m "feat(mobile): migrar tokens pra Playfair+Manrope e adicionar tokens da home redesign"
```

---

## Task 3: Atualizar font loading em `app/_layout.tsx`

**Files:**

- Modify: `app/_layout.tsx`

- [ ] **Step 1: Localizar bloco `useFonts`**

Run:

```bash
grep -nE "(useFonts|Fraunces|Inter|@expo-google-fonts)" app/_layout.tsx
```

Expected: linhas com imports de `@expo-google-fonts/fraunces` e `@expo-google-fonts/inter`, e chamada de `useFonts({...})`.

- [ ] **Step 2: Trocar imports e useFonts**

Substituir os imports de fontes e a chamada de `useFonts`:

```ts
// Before:
import {
  useFonts,
  Fraunces_400Regular,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

// After:
import {
  useFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium_Italic,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import {
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
```

E o objeto passado pra `useFonts`:

```ts
// Before:
const [fontsLoaded] = useFonts({
  Fraunces_400Regular,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
});

// After:
const [fontsLoaded] = useFonts({
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium_Italic,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
});
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: zero erros.

- [ ] **Step 4: Smoke test app boot**

Run em outro terminal:

```bash
CI=1 BROWSER=none npm run start -- --port 8090
```

Esperar até ver "Bundling complete". Abrir `http://localhost:8090` no browser. App deve carregar e renderizar texto em Playfair (display) e Manrope (body). Se Text mostrar em system font, expo-font não carregou — verificar console pra erros.

Encerrar o processo (Ctrl+C) depois de validar.

- [ ] **Step 5: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat(mobile): carregar Playfair Display e Manrope no app boot"
```

---

## Task 4: Atualizar `lib/format.ts` — opção `omitCurrency`

**Files:**

- Modify: `lib/format.ts`

- [ ] **Step 1: Substituir conteúdo**

Substituir o arquivo `lib/format.ts` inteiro:

```ts
// Formatadores compartilhados entre telas.
// formatBRL: valor monetario em pt-BR.
//   - { compact: true }: troca valores >= R$ 1.000 por sufixo k
//     (ex.: R$ 12k).
//   - { omitCurrency: true } (combinado com compact): omite o prefixo
//     "R$ " — usado em telas com tipografia editorial onde o R$ tira
//     o ar do numero (ex.: home hero "2742k").

type FormatBRLOptions = {
  compact?: boolean;
  omitCurrency?: boolean;
};

const BRL_FULL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const NUMBER_PT_BR = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});

export function formatBRL(value: number, options: FormatBRLOptions = {}): string {
  if (options.compact && value >= 1000) {
    const k = value / 1000;
    const formatted = k.toFixed(k >= 10 ? 0 : 1);
    return options.omitCurrency ? `${formatted}k` : `R$ ${formatted}k`;
  }
  if (options.omitCurrency) {
    return NUMBER_PT_BR.format(value);
  }
  return BRL_FULL.format(value);
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: zero erros. Callers existentes passam só `{ compact: true }` então são compatíveis.

- [ ] **Step 3: Commit**

```bash
git add lib/format.ts
git commit -m "feat(mobile): adicionar opcao omitCurrency em formatBRL"
```

---

## Task 5: Atualizar `lib/displayName.ts` — `toFullName`

**Files:**

- Modify: `lib/displayName.ts`

- [ ] **Step 1: Adicionar `toFullName` ao final do arquivo**

Adicionar antes do fechamento do arquivo (após `friendlyDisplayName`):

```ts
// Capitaliza cada palavra do nome completo, tratando preposicoes em PT-BR
// como minusculas ("Joao Victor da Silva", nao "Joao Victor Da Silva").
// Usado quando precisamos do nome completo (ex.: greeting "Bem-vindo,
// Joao Victor Franco") em vez do primeiro nome humanizado.
const LOWERCASE_PARTICLES = new Set(["da", "de", "do", "das", "dos", "e"]);

export function toFullName(input: string): string {
  return input
    .trim()
    .split(/\s+/)
    .map((part, i) => {
      const lower = part.toLowerCase();
      if (i > 0 && LOWERCASE_PARTICLES.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export function friendlyFullName({ fullName, email }: FriendlyNameInput): string | null {
  if (fullName) return toFullName(fullName);
  if (email) {
    const local = email.split("@")[0] ?? "";
    return local ? toFriendlyFirstName(local) : null;
  }
  return null;
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: zero erros.

- [ ] **Step 3: Commit**

```bash
git add lib/displayName.ts
git commit -m "feat(mobile): adicionar toFullName e friendlyFullName em displayName"
```

---

## Task 6: Criar `components/ui/AppBackground.tsx`

**Files:**

- Create: `components/ui/AppBackground.tsx`

- [ ] **Step 1: Criar o arquivo**

Conteúdo completo:

```tsx
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
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: zero erros.

- [ ] **Step 3: Commit**

```bash
git add components/ui/AppBackground.tsx
git commit -m "feat(mobile): adicionar AppBackground com gradient vertical do theme"
```

---

## Task 7: Adicionar asset `raptor-card.png`

**Files:**

- Create: `assets/images/raptor-card.png`

- [ ] **Step 1: Exportar a imagem do Figma**

No Figma Desktop:

1. Abrir o arquivo FORD.
2. Selecionar o nó `raptor (1) 1` (fileKey `67DfKMsKwzwNs5aNdJe6x2`, nodeId aproximado `5:28` — pode usar qualquer instância das 6 no design).
3. Export → PNG @3x (resolução suficiente pra retina iPhone).
4. Salvar em `assets/images/raptor-card.png`.

Alternativa via MCP (se preferir automatizar):

```bash
# Buscar URL do asset via get_design_context — depois fazer curl
# No design context da home, a imagem aparece como imgRaptor11 com URL:
# https://www.figma.com/api/mcp/asset/fce9a302-... (URL muda — usar a do design_context atual)
curl -o assets/images/raptor-card.png "<URL_DO_ASSET>"
```

- [ ] **Step 2: Verificar dimensões**

Imagem deve ter aspecto ~102x53 (ou múltiplo). Pra @3x: ~306x159.

Run:

```bash
ls -la assets/images/raptor-card.png
```

Expected: arquivo existe, tamanho não-zero (esperado 5-30kb).

- [ ] **Step 3: Commit**

```bash
git add assets/images/raptor-card.png
git commit -m "feat(mobile): adicionar foto da Raptor F-150 pro LeadCardCompact"
```

---

## Task 8: Criar `components/illustrations/Globe.dom.tsx`

**Files:**

- Create: `components/illustrations/Globe.dom.tsx`

- [ ] **Step 1: Criar diretório**

```bash
mkdir -p components/illustrations
```

- [ ] **Step 2: Criar o arquivo Globe.dom.tsx**

Conteúdo completo:

```tsx
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
      phi: 4.7,                          // pose estatica inclinada (~151° do Figma)
      theta: 0.3,
      dark: isDark ? 1 : 0,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: isDark ? [0.3, 0.3, 0.3] : [1, 1, 1],
      markerColor: [249 / 255, 115 / 255, 22 / 255], // #f97316 laranja
      glowColor: isDark ? [0.1, 0.1, 0.1] : [0.9, 0.9, 0.9],
      markers: BRAZIL_MARKERS,
      onRender: () => {
        // Estatico: nao rotaciona phi a cada frame.
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
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: zero erros. DOM Components com `'use dom'` são tipados como componentes normais; o Expo handle a empacotagem no build.

- [ ] **Step 4: Verificar import paths**

Run:

```bash
grep -E "(cobe|@expo-google)" package.json
```

Confirmar que `cobe` aparece em dependencies.

- [ ] **Step 5: Commit**

```bash
git add components/illustrations/Globe.dom.tsx
git commit -m "feat(mobile): adicionar Globe DOM Component pontilhado estatico com markers BR"
```

---

## Task 9: Criar `components/illustrations/RotatingClock.tsx`

**Files:**

- Create: `components/illustrations/RotatingClock.tsx`

- [ ] **Step 1: Criar o arquivo**

Conteúdo completo:

```tsx
// RotatingClock — texto HH:MM gigante (Manrope 80) com gradient
// transparente via MaskedView + LinearGradient. Atualiza por minuto.
// Spec Figma node 1:2 (light) / 8:55 (dark): clockGradientFrom/Mid/To.
// Memoizado pra evitar re-render de Globe/HeroStatsBlock no tick.
// Relogio gigante decorativo da home, atualiza por minuto.

import { useEffect, useMemo, useState, memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/context/ThemeContext";
import { typography } from "@/lib/theme";

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function nowHHMM(date = new Date()): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const REFRESH_MS = 60_000;

function RotatingClockComponent() {
  const { colors } = useTheme();
  const [value, setValue] = useState<string>(() => nowHHMM());

  useEffect(() => {
    const id = setInterval(() => {
      setValue(nowHHMM());
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const gradientColors = useMemo(
    () => [
      colors.clockGradientFrom,
      colors.clockGradientMid,
      colors.clockGradientTo,
    ],
    [colors.clockGradientFrom, colors.clockGradientMid, colors.clockGradientTo],
  );

  return (
    <MaskedView
      style={styles.container}
      maskElement={
        <View style={styles.maskInner}>
          <Text style={styles.text}>{value}</Text>
        </View>
      }
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={styles.gradient}
      />
    </MaskedView>
  );
}

export const RotatingClock = memo(RotatingClockComponent);

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 90,
  },
  maskInner: {
    flex: 1,
    backgroundColor: "transparent",
  },
  text: {
    ...typography.clockHero,
    color: "black", // ignorado: o MaskedView usa o alpha do texto
  },
  gradient: {
    flex: 1,
  },
});
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: zero erros.

- [ ] **Step 3: Commit**

```bash
git add components/illustrations/RotatingClock.tsx
git commit -m "feat(mobile): adicionar RotatingClock com text gradient via MaskedView"
```

---

## Task 10: Criar `components/ui/PriorityBadge.tsx`

**Files:**

- Create: `components/ui/PriorityBadge.tsx`

- [ ] **Step 1: Criar o arquivo**

Conteúdo completo:

```tsx
// PriorityBadge — badge compacto (radius 5, 10px text) que reflete
// lead.priority via leadPriorityPalette existente em lib/theme.
// Usado em LeadCardCompact (home redesign). Reutilizavel em qualquer
// lista de leads onde queremos um sinal visual compacto da prioridade.
// Badge de prioridade no formato do Figma node 1:2.

import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";

import { leadPriorityPalette, radius, spacing, typography, type LeadPriorityKey } from "@/lib/theme";

export interface PriorityBadgeProps {
  priority: LeadPriorityKey;
  style?: ViewStyle;
}

export function PriorityBadge({ priority, style }: PriorityBadgeProps) {
  const { t } = useTranslation();
  const palette = leadPriorityPalette[priority];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: palette.bg, borderColor: palette.border },
        style,
      ]}
    >
      <Text style={[styles.label, { color: palette.color }]} numberOfLines={1}>
        {t(palette.labelKey)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm - 3, // 5px conforme Figma
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  label: {
    ...typography.badge,
  },
});
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: zero erros.

- [ ] **Step 3: Commit**

```bash
git add components/ui/PriorityBadge.tsx
git commit -m "feat(mobile): adicionar PriorityBadge consumindo leadPriorityPalette"
```

---

## Task 11: Criar `components/ui/HeroStatsBlock.tsx`

**Files:**

- Create: `components/ui/HeroStatsBlock.tsx`

- [ ] **Step 1: Criar o arquivo**

Conteúdo completo:

```tsx
// HeroStatsBlock — card vertical translucido com dois KPIs empilhados.
// Reproduz o bloco esquerdo do Figma node 1:2 / 8:55: label italic 16
// (Playfair) + value serif 48 (Playfair Regular). Background usa
// heroVerticalBg do tema, com border heroVerticalBorder.
// Bloco vertical de KPIs da home: label italic + numero serif gigante.

import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/context/ThemeContext";
import { spacing, typography, type ThemeColors } from "@/lib/theme";

export interface HeroStatsItem {
  label: string;
  value: string;
}

export interface HeroStatsBlockProps {
  items: [HeroStatsItem, HeroStatsItem];
}

export function HeroStatsBlock({ items }: HeroStatsBlockProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [first, second] = items;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>{first.label}</Text>
        <Text style={styles.value}>{first.value}</Text>
      </View>
      <View style={[styles.row, styles.rowSpacing]}>
        <Text style={styles.label}>{second.label}</Text>
        <Text style={styles.value}>{second.value}</Text>
      </View>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.heroVerticalBg,
      borderColor: c.heroVerticalBorder,
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: spacing["2xl"],
      paddingVertical: spacing.lg,
      width: 235,
      minHeight: 202,
    },
    row: {
      gap: spacing.xs,
    },
    rowSpacing: {
      marginTop: spacing.lg,
    },
    label: {
      ...typography.hKpiLabel,
      color: c.text,
    },
    value: {
      ...typography.hKpiValue,
      color: c.text,
    },
  });
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: zero erros.

- [ ] **Step 3: Commit**

```bash
git add components/ui/HeroStatsBlock.tsx
git commit -m "feat(mobile): adicionar HeroStatsBlock translucido vertical com 2 KPIs"
```

---

## Task 12: Criar `components/domain/LeadCardCompact.tsx`

**Files:**

- Create: `components/domain/LeadCardCompact.tsx`

- [ ] **Step 1: Criar o arquivo**

Conteúdo completo:

```tsx
// LeadCardCompact — variante quadrada 170x115 do LeadCard pra grid 2x3
// na home (Figma node 1:2 / 8:55). Mostra valor + ID curto + foto Raptor
// + nome do customer + reason + hora relativa + PriorityBadge.
// Distinta do LeadCard "lista" que continua em /leads.
// Card compacto pra grid da home redesign 2026-05-25.

import { useMemo, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { useTheme } from "@/context/ThemeContext";
import type { Lead } from "@/lib/api";
import { customerNameFor } from "@/lib/demo-data";
import { formatBRL } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { formatRelativeTime } from "@/lib/relative-time";
import { spacing, typography, type ThemeColors } from "@/lib/theme";

const raptorAsset = require("@/assets/images/raptor-card.png");

export interface LeadCardCompactProps {
  lead: Lead;
  onPress?: () => void;
}

const SCALE_PRESSED = 0.97;
const CARD_WIDTH = 170;
const CARD_HEIGHT = 115;
const ID_LENGTH = 5;

function shortId(id: string): string {
  return id.replace(/-/g, "").slice(0, ID_LENGTH).toUpperCase();
}

export function LeadCardCompact({ lead, onPress }: LeadCardCompactProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scale = useRef(new Animated.Value(1)).current;

  const customer = customerNameFor(lead.customer_id);
  const relativeTime = formatRelativeTime(lead.created_at, t);
  const valueText =
    lead.expected_value_brl != null ? formatBRL(lead.expected_value_brl) : "—";

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scale, {
      toValue: SCALE_PRESSED,
      useNativeDriver: true,
      speed: 60,
      bounciness: 0,
    }).start();
  };
  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 60,
      bounciness: 6,
    }).start();
  };

  const body = (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.value} numberOfLines={1}>
          {valueText}
        </Text>
        <PriorityBadge priority={lead.priority} style={styles.badge} />
      </View>
      <Text style={styles.id} numberOfLines={1}>
        ID:{shortId(lead.id)}
      </Text>
      <Image
        source={raptorAsset}
        style={styles.image}
        resizeMode="contain"
        accessible={false}
      />
      <Text style={styles.customer} numberOfLines={1}>
        {customer}
      </Text>
      <View style={styles.bottomRow}>
        <Text style={styles.reason} numberOfLines={1}>
          {lead.reason ?? ""}
        </Text>
        <Text style={styles.time} numberOfLines={1}>
          {relativeTime ?? ""}
        </Text>
      </View>
    </View>
  );

  if (!onPress) return body;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => {
          haptic.light();
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`${customer}, ${valueText}`}
      >
        {body}
      </Pressable>
    </Animated.View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      backgroundColor: c.leadCardCompactBg,
      borderRadius: 5,
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 6,
      overflow: "hidden",
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.xs,
    },
    value: {
      ...typography.cardValue,
      color: c.leadCardCompactText,
      flexShrink: 1,
    },
    badge: {
      flexShrink: 0,
    },
    id: {
      ...typography.cardId,
      color: c.leadCardCompactText,
      marginTop: 2,
    },
    image: {
      width: 102,
      height: 53,
      alignSelf: "center",
      marginTop: -4,
    },
    customer: {
      ...typography.cardMeta,
      color: c.leadCardCompactText,
      marginTop: 2,
    },
    bottomRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.xs,
      marginTop: 2,
    },
    reason: {
      ...typography.cardMeta,
      color: c.leadCardCompactText,
      flex: 1,
    },
    time: {
      ...typography.cardTime,
      color: c.leadCardCompactText,
    },
  });
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: zero erros.

- [ ] **Step 3: Commit**

```bash
git add components/domain/LeadCardCompact.tsx
git commit -m "feat(mobile): adicionar LeadCardCompact 170x115 com PriorityBadge e foto Raptor"
```

---

## Task 13: Criar `components/domain/LeadCardCompactSkeleton.tsx`

**Files:**

- Create: `components/domain/LeadCardCompactSkeleton.tsx`

- [ ] **Step 1: Criar o arquivo**

Conteúdo completo:

```tsx
// LeadCardCompactSkeleton — placeholder do LeadCardCompact com mesma
// dimensao (170x115), mesma cor de background, e barras de shimmer
// representando texto/imagem. Usado em initialLoading da home.
// Skeleton compativel com LeadCardCompact pra estado de loading.

import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { Skeleton } from "@/components/ui/Skeleton";
import { useTheme } from "@/context/ThemeContext";
import { spacing, type ThemeColors } from "@/lib/theme";

const CARD_WIDTH = 170;
const CARD_HEIGHT = 115;

export function LeadCardCompactSkeleton() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Skeleton width={70} height={14} />
        <Skeleton width={52} height={14} radius={5} />
      </View>
      <Skeleton width={50} height={12} style={styles.id} />
      <Skeleton width={102} height={53} style={styles.image} />
      <Skeleton width={120} height={10} style={styles.customer} />
      <View style={styles.bottomRow}>
        <Skeleton width={90} height={10} />
        <Skeleton width={36} height={14} />
      </View>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      backgroundColor: c.leadCardCompactBg,
      borderRadius: 5,
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 6,
      overflow: "hidden",
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.xs,
    },
    id: {
      marginTop: 4,
    },
    image: {
      alignSelf: "center",
      marginTop: 2,
    },
    customer: {
      marginTop: 4,
    },
    bottomRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.xs,
      marginTop: 4,
    },
  });
}
```

- [ ] **Step 2: Verificar API do Skeleton existente**

Run:

```bash
grep -nE "(width|height|radius|style)" components/ui/Skeleton.tsx | head -20
```

Se a API real for diferente (ex: `Skeleton` aceita `style={{width, height}}` em vez de props diretas), ajustar o uso em `LeadCardCompactSkeleton.tsx` correspondentemente. Variant default deve funcionar.

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: zero erros.

- [ ] **Step 4: Commit**

```bash
git add components/domain/LeadCardCompactSkeleton.tsx
git commit -m "feat(mobile): adicionar LeadCardCompactSkeleton no formato 170x115"
```

---

## Task 14: Atualizar i18n (`en.json` + `pt-BR.json`)

**Files:**

- Modify: `i18n/en.json`
- Modify: `i18n/pt-BR.json`

- [ ] **Step 1: Modificar `i18n/pt-BR.json`**

Localizar bloco `"home"` (linha ~32). Substituir as keys:

```json
// Before (manter empty/error/etc, alterar somente as listadas):
"home": {
  "greeting_morning": "Bom dia, {{name}}",
  "greeting_afternoon": "Boa tarde, {{name}}",
  "greeting_evening": "Boa noite, {{name}}",
  "today": "Hoje",
  "recent_leads": "Leads recentes",
  ...
  "hero": {
    "active_leads": "Leads ativos",
    "pipeline": "Pipeline"
  },
  ...
}

// After:
"home": {
  "welcome": "Bem-vindo, {{name}}",
  "recent_leads": "Últimos Leads",
  "empty": "Nenhum lead no momento",
  "empty_title": "Sem leads por enquanto",
  "empty_description": "Quando novos leads forem atribuídos a você, eles aparecem aqui.",
  "error": "Falha ao carregar dados",
  "error_title": "Sem conexão com o servidor",
  "hero": {
    "leads_label": "Leads",
    "value_label": "Valor"
  },
  "see_all_with_count": "Ver todos os {{count}} leads"
}
```

Remover: `greeting_morning`, `greeting_afternoon`, `greeting_evening`, `today`, `hero.active_leads`, `hero.pipeline`.

Adicionar: `welcome`, `hero.leads_label`, `hero.value_label`.

Atualizar: `recent_leads` para "Últimos Leads".

- [ ] **Step 2: Modificar `i18n/en.json`**

Aplicar mesma transformação:

```json
"home": {
  "welcome": "Welcome, {{name}}",
  "recent_leads": "Latest Leads",
  "empty": "No leads yet",
  "empty_title": "No leads yet",
  "empty_description": "When new leads are assigned to you, they will appear here.",
  "error": "Failed to load data",
  "error_title": "No connection to server",
  "hero": {
    "leads_label": "Leads",
    "value_label": "Value"
  },
  "see_all_with_count": "See all {{count}} leads"
}
```

(Mantenha as keys empty/error existentes se já existirem com texto diferente em EN — alterar somente se a tradução atual estiver desatualizada.)

- [ ] **Step 3: Verificar JSON válido**

Run:

```bash
node -e "JSON.parse(require('fs').readFileSync('i18n/pt-BR.json','utf8'))" && \
node -e "JSON.parse(require('fs').readFileSync('i18n/en.json','utf8'))"
```

Expected: nenhuma saída (sucesso) e exit code 0. Se houver SyntaxError, corrigir.

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: zero erros. Se i18n keys forem tipadas (algum `keyof` derivado), pode aparecer erro temporário — ignorar até `index.tsx` ser atualizado.

- [ ] **Step 5: Commit**

```bash
git add i18n/pt-BR.json i18n/en.json
git commit -m "feat(mobile): trocar greeting dinamico por welcome estatico na i18n da home"
```

---

## Task 15: Rewrite `app/(tabs)/index.tsx`

**Files:**

- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Substituir o arquivo inteiro**

Conteúdo completo:

```tsx
// Home — Figma pixel-perfect redesign (2026-05-25).
// Layout (Figma node 1:2 light / 8:55 dark):
//   - AppBackground gradient vertical fullscreen
//   - Hero area (altura ~460) absolute positioned:
//       greeting "Bem-vindo, {nome completo}" Playfair 36 top-left
//       RotatingClock HH:MM gigante top-right
//       Globe DOM Component pontilhado canto direito
//       HeroStatsBlock vertical com bleed -80 a esquerda (Leads + Valor)
//   - SectionTitle "Ultimos Leads" Playfair italic 20
//   - Grid 2 colunas de LeadCardCompact (3 linhas, 6 leads)
//   - SeeAllPill no footer quando ha mais leads
// Spec: docs/superpowers/specs/2026-05-25-mobile-dashboard-redesign-design.md
// Home redesign: greeting + clock + globe + hero vertical + grid de cards.

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { AppBackground } from "@/components/ui/AppBackground";
import Globe from "@/components/illustrations/Globe.dom";
import { RotatingClock } from "@/components/illustrations/RotatingClock";
import { HeroStatsBlock } from "@/components/ui/HeroStatsBlock";
import { LeadCardCompact } from "@/components/domain/LeadCardCompact";
import { LeadCardCompactSkeleton } from "@/components/domain/LeadCardCompactSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useTheme } from "@/context/ThemeContext";
import { ACTIVE_LEAD_STATUSES, api, ApiError, type Lead } from "@/lib/api";
import { toFullName, toFriendlyFirstName } from "@/lib/displayName";
import { formatBRL } from "@/lib/format";
import { fetchMyProfile } from "@/lib/profile";
import { supabase } from "@/lib/supabase";
import { radius, spacing, typography, type ThemeColors } from "@/lib/theme";

type HeroStats = {
  activeLeads: number;
  pipelineBRL: number;
};

const TOP_VISIBLE = 6;
const HERO_FETCH_LIMIT = 200;
const GRID_HORIZONTAL_PADDING = 30;
const GRID_GAP = 8;
const HERO_AREA_HEIGHT = 460;

function computeHeroStats(leads: Lead[]): HeroStats {
  const activeLeads = leads.filter((l) => ACTIVE_LEAD_STATUSES.has(l.status)).length;
  const pipelineBRL = leads.reduce((sum, l) => sum + (l.expected_value_brl ?? 0), 0);
  return { activeLeads, pipelineBRL };
}

const Greeting = memo(function Greeting({ name }: { name: string }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Text style={styles.greeting} numberOfLines={2}>
      {t("home.welcome", { name })}
    </Text>
  );
});

const HeroDecoration = memo(function HeroDecoration({ isDark }: { isDark: boolean }) {
  return (
    <>
      <View style={decorationStyles.clockWrap}>
        <RotatingClock />
      </View>
      <View style={decorationStyles.globeWrap}>
        <Globe theme={isDark ? "dark" : "light"} size={324} />
      </View>
    </>
  );
});

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors, mode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDark = mode === "dark";

  const [leads, setLeads] = useState<Lead[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<string>("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.listLeads({ limit: HERO_FETCH_LIMIT });
      setLeads(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("home.error"));
    }
  }, [t]);

  useEffect(() => {
    void (async () => {
      await load();
      setInitialLoading(false);
    })();
  }, [load]);

  useEffect(() => {
    void (async () => {
      const profile = await fetchMyProfile().catch(() => null);
      if (profile?.full_name) {
        setName(toFullName(profile.full_name));
        return;
      }
      const auth = await supabase.auth.getUser();
      const email = auth.data.user?.email;
      if (email) {
        const local = email.split("@")[0] ?? "";
        setName(toFriendlyFirstName(local));
      }
    })();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const hero = useMemo(() => computeHeroStats(leads), [leads]);
  const topLeads = useMemo(() => leads.slice(0, TOP_VISIBLE), [leads]);

  const showHero = !(error && leads.length === 0);

  const heroItems = useMemo(
    () =>
      [
        { label: t("home.hero.leads_label"), value: String(hero.activeLeads) },
        {
          label: t("home.hero.value_label"),
          value: formatBRL(hero.pipelineBRL, { compact: true, omitCurrency: true }),
        },
      ] as const,
    [hero, t],
  );

  return (
    <AppBackground>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.list}
        data={initialLoading ? [] : topLeads}
        keyExtractor={(l) => l.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.text}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.heroArea}>
              <Greeting name={name} />
              <HeroDecoration isDark={isDark} />
              {showHero ? (
                <View style={styles.heroStatsWrap}>
                  <HeroStatsBlock items={heroItems as unknown as Parameters<typeof HeroStatsBlock>[0]["items"]} />
                </View>
              ) : null}
            </View>
            {error && leads.length > 0 ? (
              <View style={styles.errorWrap}>
                <ErrorBanner message={error} onRetry={() => void load()} />
              </View>
            ) : null}
            {!initialLoading && topLeads.length > 0 ? (
              <Text style={styles.sectionTitle}>{t("home.recent_leads")}</Text>
            ) : null}
            {initialLoading ? (
              <Text style={styles.sectionTitle}>{t("home.recent_leads")}</Text>
            ) : null}
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: GRID_GAP }} />}
        ListEmptyComponent={
          initialLoading ? (
            <View style={styles.skeletonGrid}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={styles.skeletonCell}>
                  <LeadCardCompactSkeleton />
                </View>
              ))}
            </View>
          ) : error ? (
            <View style={styles.emptyWrap}>
              <EmptyState
                icon="cloud-offline-outline"
                title={t("home.error_title")}
                description={error}
              />
              <Pressable
                onPress={() => void load()}
                style={({ pressed }) => [
                  styles.retryPill,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
              >
                <Text style={styles.retryPillLabel}>{t("common.retry")}</Text>
              </Pressable>
            </View>
          ) : (
            <EmptyState
              icon="briefcase-outline"
              title={t("home.empty_title")}
              description={t("home.empty_description")}
            />
          )
        }
        ListFooterComponent={
          !initialLoading && leads.length > TOP_VISIBLE ? (
            <Pressable
              onPress={() => router.push("/leads")}
              accessibilityRole="button"
              style={({ pressed }) => [styles.seeAll, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.seeAllLabel}>
                {t("home.see_all_with_count", { count: leads.length })}
              </Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => (
          <LeadCardCompact
            lead={item}
            onPress={() =>
              router.push({
                pathname: "/lead/[id]",
                params: { id: item.id },
              })
            }
          />
        )}
      />
    </AppBackground>
  );
}

const decorationStyles = StyleSheet.create({
  clockWrap: {
    position: "absolute",
    left: 175,
    top: 100,
  },
  globeWrap: {
    position: "absolute",
    left: 69,
    top: 130,
    width: 324,
    height: 315,
  },
});

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { backgroundColor: "transparent" },
    list: { paddingBottom: spacing["6xl"] },
    heroArea: {
      height: HERO_AREA_HEIGHT,
      paddingTop: 45,
    },
    heroStatsWrap: {
      position: "absolute",
      left: -80,
      top: 192,
    },
    columnWrapper: {
      gap: GRID_GAP,
      paddingHorizontal: GRID_HORIZONTAL_PADDING,
    },
    sectionTitle: {
      ...typography.hSectionItalic,
      color: c.text,
      paddingHorizontal: GRID_HORIZONTAL_PADDING,
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    errorWrap: {
      paddingHorizontal: GRID_HORIZONTAL_PADDING,
      marginBottom: spacing.lg,
    },
    skeletonGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: GRID_HORIZONTAL_PADDING,
      gap: GRID_GAP,
    },
    skeletonCell: {
      width: 170,
    },
    emptyWrap: {
      alignItems: "center",
      marginTop: spacing["2xl"],
      gap: spacing.lg,
      paddingHorizontal: GRID_HORIZONTAL_PADDING,
    },
    retryPill: {
      paddingVertical: spacing.md - 2,
      paddingHorizontal: spacing["2xl"],
      borderRadius: radius.pill,
      backgroundColor: c.primary,
    },
    retryPillLabel: {
      ...typography.body,
      fontFamily: undefined, // herda do typography
      color: c.primaryText,
    },
    seeAll: {
      marginTop: spacing.xl,
      marginHorizontal: spacing["2xl"],
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderStrong,
      alignItems: "center",
    },
    seeAllLabel: {
      ...typography.caption,
      color: c.text,
    },
    greeting: {
      ...typography.hDisplay,
      color: c.text,
      paddingHorizontal: GRID_HORIZONTAL_PADDING,
      maxWidth: 280,
    },
  });
}
```

Nota técnica: tipagem do `items` no `HeroStatsBlock` aceita exatamente `[HeroStatsItem, HeroStatsItem]` (tupla). O array `heroItems` é construído com `as const` retornando `readonly [..., ...]`, então usei um cast no JSX. Se preferir não castar, declarar `heroItems` como `[HeroStatsItem, HeroStatsItem]` explicitamente.

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: zero erros. Se aparecer "Cannot find module" pra Globe DOM Component, verificar que o arquivo se chama exatamente `Globe.dom.tsx` (a extensão `.dom.tsx` é parte do nome — não é `.tsx` simples).

- [ ] **Step 3: Lint**

```bash
npm run lint
```

Expected: zero warnings novos. Warnings preexistentes podem permanecer.

- [ ] **Step 4: Smoke test app boot**

Em outro terminal:

```bash
CI=1 BROWSER=none npm run start -- --port 8090
```

Abrir `http://localhost:8090` no browser, navegar para a Home tab. Confirmar:

- Background tem gradient (não cor flat)
- Greeting "Bem-vindo, {nome}" em serif Playfair
- Clock HH:MM gigante visível no canto direito
- Globo pontilhado visível atrás do clock
- Hero card vertical com bleed à esquerda mostrando "Leads / X" e "Valor / Yk"
- Section title "Últimos Leads" italic
- Grid 2x3 (até 6 LeadCardCompact)

Se algum desses elementos estiver faltando, voltar e debugar antes de seguir. Encerrar processo depois de validar.

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/index.tsx
git commit -m "feat(mobile): rewrite home com gradient, hero vertical, globe e grid 2x3"
```

---

## Task 16: Ajustar `app/(tabs)/_layout.tsx` — tabBar bottomBarBg

**Files:**

- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Localizar `tabBarStyle`**

Run:

```bash
grep -nE "(tabBarStyle|tabBar)" "app/(tabs)/_layout.tsx"
```

Expected: linha(s) com `tabBarStyle: { ... }` ou `screenOptions={{ tabBarStyle: ... }}`.

- [ ] **Step 2: Adicionar/atualizar `backgroundColor`**

Localizar o bloco `tabBarStyle` e garantir que `backgroundColor: colors.bottomBarBg`. Se o arquivo já consome `useTheme()`, basta trocar o valor. Se não consome, adicionar:

```tsx
// Imports no topo:
import { useTheme } from "@/context/ThemeContext";

// Dentro do componente, antes do return:
const { colors } = useTheme();

// No screenOptions:
screenOptions={{
  ...existing,
  tabBarStyle: {
    ...existing tabBarStyle,
    backgroundColor: colors.bottomBarBg,
  },
}}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: zero erros.

- [ ] **Step 4: Smoke test**

Rodar o app (`CI=1 BROWSER=none npm run start -- --port 8090`), confirmar visualmente que a tab bar bottom muda de cor entre light e dark mode (toggle via Profile).

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/_layout.tsx
git commit -m "feat(mobile): aplicar bottomBarBg do theme na tab bar"
```

---

## Task 17: Smoke test outras telas após font swap global

**Files:** (nenhum modificado por padrão; eventuais ajustes locais decididos durante o smoke test)

- [ ] **Step 1: Iniciar app**

```bash
CI=1 BROWSER=none npm run start -- --port 8090
```

- [ ] **Step 2: Navegar e inspecionar cada tela**

Abrir `http://localhost:8090` e visitar:

- `/login`
- `/(tabs)/` (home — já validado em Task 15)
- `/(tabs)/leads`
- `/(tabs)/profile`
- `/lead/<algum id>` (clicar num card da home ou leads)

Em cada tela, verificar:

- [ ] Headings/títulos renderizam em Playfair Display (serif)
- [ ] Body/inputs/labels renderizam em Manrope (sans com formas distintas do Inter)
- [ ] Layout NÃO quebrou — `Fraunces` e `Inter` têm métricas próximas de `Playfair` e `Manrope` então normalmente é OK, mas algum heading pode ter altura diferente

- [ ] **Step 3: Anotar regressões visuais**

Se algum elemento quebrar (linha de altura, overflow, sobreposição), capturar screenshot via Playwright MCP e listar no PR body como follow-up. Não corrigir agora — escopo é home; ajustes pontuais virão em PRs subsequentes.

- [ ] **Step 4: Encerrar e seguir**

Encerrar processo. Não há commit a fazer nesta task.

---

## Task 18: Playwright visual QA da home

**Files:** (nenhum; captura artefatos em `tmp/qa/`)

- [ ] **Step 1: Iniciar app em background**

```bash
mkdir -p tmp/qa
CI=1 BROWSER=none npm run start -- --port 8090
```

Esperar "Bundling complete".

- [ ] **Step 2: Sequência Playwright MCP (em sessão Claude separada ou inline)**

Em uma sessão paralela:

```text
browser_navigate http://localhost:8090
browser_resize 393 852       # iPhone 16
browser_take_screenshot tmp/qa/home-light.png

# Toggle dark via Profile → Switch real
browser_navigate http://localhost:8090/profile
browser_click <switch dark mode>
browser_navigate http://localhost:8090
browser_take_screenshot tmp/qa/home-dark.png
```

- [ ] **Step 3: Forçar estado de loading**

Adicionar throttle de network via Playwright MCP `browser_route` ou simular `initialLoading: true` editando temporariamente o componente. Capturar `home-loading.png`.

- [ ] **Step 4: Forçar estado de erro**

Bloquear request a `/leads` (ou parar o backend). Capturar `home-error-with-cache.png` e `home-error-empty.png`.

- [ ] **Step 5: Validar checklist do spec**

Abrir `tmp/qa/*.png` e comparar com Figma node 1:2 e 8:55. Marcar cada item do "Checklist visual de fidelidade" do spec.

- [ ] **Step 6: Encerrar app**

Não há commit nesta task. Os screenshots vão anexados ao PR no Task 19.

---

## Task 19: Criar PR final

**Files:** N/A (operação de git/PR)

- [ ] **Step 1: Pull main + rebase**

```bash
git fetch origin
git rebase origin/main
```

Se houver conflitos, resolver e continuar (`git rebase --continue`).

- [ ] **Step 2: Push branch**

```bash
git push -u origin redesign/dashboard-figma
```

- [ ] **Step 3: Abrir PR via gh**

```bash
gh pr create --title "design(mobile): redesign da home seguindo Figma pixel-perfect" --body "$(cat <<'EOF'
## Sumário

- Rewrite completo de `app/(tabs)/index.tsx` seguindo Figma FORD (light node 1:2, dark node 8:55).
- Migração global de fonte: Fraunces → Playfair Display, Inter → Manrope (keys de `fontFamily` preservadas).
- Novos componentes: `AppBackground`, `Globe.dom`, `RotatingClock`, `PriorityBadge`, `HeroStatsBlock`, `LeadCardCompact`, `LeadCardCompactSkeleton`.
- Novos tokens no theme: gradients de background, hero vertical, lead card compact, bottom bar (light + dark).
- Asset novo: `assets/images/raptor-card.png`.
- i18n: trocar greeting dinâmico por `home.welcome` estático com nome completo.

Spec: `docs/superpowers/specs/2026-05-25-mobile-dashboard-redesign-design.md`.

## Test plan

- [ ] `npm run typecheck` passa
- [ ] `npm run lint` sem warnings novos
- [ ] Home renderiza fiel ao Figma em light (anexar screenshot)
- [ ] Home renderiza fiel ao Figma em dark (anexar screenshot)
- [ ] Toggle dark/light no Profile inverte gradient/hero/cards/badge
- [ ] Pull-to-refresh funciona
- [ ] Tap em LeadCardCompact navega pra `/lead/[id]`
- [ ] "Ver todos (N)" navega pra `/leads`
- [ ] Estados: loading skeletons, error banner com cache, empty state, error sem cache
- [ ] Globe renderiza em iOS, Android e Web (DOM Component via webview)
- [ ] Outras telas (Login, Leads, Profile, Lead Detail) não regrediram com font swap

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Anexar screenshots à PR**

Abrir a PR no GitHub, anexar `tmp/qa/home-light.png` e `tmp/qa/home-dark.png` ao body como comentário ou edit. Anexar também screenshots do Figma side-by-side (capturar via `get_screenshot` MCP).

- [ ] **Step 5: Aguardar review**

PR aberta. Próximo passo (fora do escopo deste plano) é review + merge seguindo o padrão `feedback_pr_workflow`.

---

## Self-Review do plano (executar após escrever)

**Spec coverage:**

- [x] Background gradient → Task 6 (AppBackground) + Task 2 (cores)
- [x] Greeting Playfair 36 estática → Task 15 (rewrite index) + Task 2 (hDisplay) + Task 5 (toFullName)
- [x] Clock dinâmico HH:MM → Task 9 (RotatingClock)
- [x] Globe cobe.js via DOM Component → Task 8 (Globe.dom.tsx)
- [x] Hero card vertical com bleed → Task 11 (HeroStatsBlock) + Task 15 (positioning)
- [x] Grid 2x3 LeadCardCompact → Task 12 + Task 13 (Skeleton) + Task 15 (FlatList numColumns)
- [x] PriorityBadge → Task 10
- [x] formatBRL omitCurrency → Task 4
- [x] Migration global fontes → Task 1 (deps) + Task 2 (theme) + Task 3 (font loading)
- [x] i18n add/update/remove → Task 14
- [x] Tab bar bottomBarBg → Task 16
- [x] Smoke outras telas → Task 17
- [x] Playwright QA → Task 18
- [x] PR final → Task 19

**Placeholder scan:** Nenhum "TBD/TODO/etc" em steps acionáveis. As palavras "TODO" no spec são conceituais (memory de TODO futuro, não placeholders deste plano).

**Type consistency:**

- `LeadPriorityKey` (Task 10) bate com export de `lib/theme.ts` (verificado em leitura).
- `LeadStatus` (não usado no badge; só `ACTIVE_LEAD_STATUSES` na home) consistente.
- `Lead` type usado em LeadCardCompact (Task 12) tem campos `id, customer_id, priority, status, reason, expected_value_brl, created_at` — todos verificados em `lib/api.ts:82-92`.
- `HeroStatsBlock` props `items: [HeroStatsItem, HeroStatsItem]` consistente entre Task 11 e Task 15.
- `Globe` props `theme: "light" | "dark"`, `size?: number` consistente entre Task 8 e Task 15.

**Riscos identificados não cobertos:**

- Asset Raptor (Task 7) exige ação manual no Figma Desktop ou curl. Engineer pode precisar deste exato asset ou substituir por placeholder até obter.
- Step `decorationStyles` em index.tsx tem números (`left: 175 top: 100` clock, `left: 69 top: 130` globe) que **são aproximações** das coords absolute do Figma transladadas pra dentro do `heroArea` height:460. Pode precisar ajuste fino com olhos no device (esperado no Step 4 do Task 15).
