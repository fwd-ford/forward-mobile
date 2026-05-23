# Mobile Polish + UX Design — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refinar visual + UX das 5 telas existentes do forward-mobile aplicando o Design DNA (Linear+Vercel base, Duolingo só em vitória) sintetizado dos 12 vídeos UX/UI; corrigir bug do intro no web.

**Architecture:** Foundation primeiro (tokens em theme.ts), depois componentes compartilhados novos (ScreenHeader, ErrorBanner, LeadCardSkeleton), depois domain (LeadCard rewrite), depois telas uma por vez (login → home → leads → profile → lead detail), depois polish de tab bar e PR final.

**Tech Stack:** Expo SDK 55, React Native 0.83, React 19, TypeScript 5.9 strict, Expo Router, Ionicons, react-i18next, react-native-reanimated, Supabase JS SDK.

**Branch:** `feat/polish-design-system` (já criada a partir de `main`, spec commitada como `ea296ac`).

**Spec de referência:** [docs/superpowers/specs/2026-05-23-mobile-polish-design.md](../specs/2026-05-23-mobile-polish-design.md)

**Verification model:** Sem test runner instalado neste projeto (CLAUDE.md confirma `tests/` vazio). Verificação por:
1. `npm run typecheck` (exit 0)
2. `npm run lint` (exit 0)
3. Smoke test manual em `npm run web` ou Expo Go (descrito por tarefa)
4. Light + dark mode visual em cada tela tocada

---

## File Structure

### Novos arquivos
- `lib/relative-time.ts` — formatador "há X dias / agora / DD/MM" (i18n-aware)
- `components/ui/ScreenHeader.tsx` — header padrão para tabs (title + optional subtitle + optional trailing)
- `components/ui/ErrorBanner.tsx` — banner inline de erro com retry
- `components/ui/PhotoButton.tsx` — extraído do inline em profile.tsx
- `components/domain/LeadCardSkeleton.tsx` — skeleton da forma do LeadCard novo

### Arquivos modificados
- `lib/theme.ts` — adicionar fontFamily.mono, typography.mono, letter-spacing em h1/h2, elevation aliases semânticos
- `components/ui/IntroVideo.tsx` — fix autoplay web (mover play() pra useEffect, playsInline, timeout 6s)
- `components/domain/LeadCard.tsx` — rewrite completo (left-border + chip + mono + dot + relative time + Pressable)
- `app/login.tsx` — adicionar "logo" tipográfico Ford + footer "Esqueci minha senha" + scale na entrada
- `app/(tabs)/index.tsx` — ScreenHeader + greeting + hero KPI + skeleton + ErrorBanner + empty CTA + top 5 com "Ver todos"
- `app/(tabs)/leads.tsx` — ScreenHeader + search input + filter chips + skeleton + RefreshControl + ErrorBanner
- `app/(tabs)/profile.tsx` — consolidar user+photo, padronizar SettingRow, ghost ícone error no sign out, ScreenHeader
- `app/lead/[id].tsx` — rewrite: sections (status, reason, value) + footer fixo com 3 ações + skeleton + ErrorBanner
- `app/(tabs)/_layout.tsx` — ícones outline→filled ao selecionar
- `i18n/pt-BR.json` + `i18n/en.json` — chaves novas (incrementais em cada task que precisar)

---

## Open Questions Resolvidas (do spec seção 10)

| Q | Decisão pra este plano |
|---|---|
| Logo Ford asset | Não existe em `assets/` (verificado). Usar palavra **"FORD"** tipográfica (extrabold, letter-spacing -0.4, tamanho 4xl). |
| Greeting source | `profile.full_name` (já carregado em profile.tsx). Em Home, refetchar via `fetchMyProfile` e cair pra primeira parte do email se null. Greeting **com hora**: "Bom dia/tarde/noite, {nome}". |
| Footer "Esqueci minha senha" | Inclui como link no login. Ação = `Toast` "Em breve" com variant info. |
| Tab transition slide | Expo Router 55 usa react-navigation por baixo. `animation: "shift"` na Stack do `app/_layout.tsx` cobre stack transitions; pra tabs não há slide nativo simples. **Fora do escopo** deste plano — fica TODO no PR. Foco do polish de tabs aqui é ícone outline→filled. |

---

## Phase 1 — Foundation

### Task 1: Updates em `lib/theme.ts` (mono font, letter-spacing, elevation aliases)

**Files:**
- Modify: `lib/theme.ts:101-145` (fontFamily, typography, novas exports de elevation)

- [ ] **Step 1: Adicionar `fontFamily.mono`**

Edit `lib/theme.ts` substituindo o bloco `fontFamily`:

```ts
import { Platform } from "react-native";

// ... (existing imports)

export const fontFamily = {
  regular: "System",
  medium: "System",
  semibold: "System",
  bold: "System",
  extrabold: "System",
  mono: Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "ui-monospace",
  }) as string,
} as const;
```

(`Platform.select` retorna `string | undefined` no genérico — o cast pra `string` é seguro porque `default` sempre cobre.)

- [ ] **Step 2: Adicionar `typography.mono` e letter-spacing em h1/h2**

Substituir o bloco `export const typography = { ... }`:

```ts
export const typography = {
  h1: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.extrabold,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  h2: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  h3: { fontSize: fontSize.xl, fontWeight: fontWeight.semibold, lineHeight: 24 },
  body: { fontSize: fontSize.lg, fontWeight: fontWeight.regular, lineHeight: 22 },
  caption: { fontSize: fontSize.md, fontWeight: fontWeight.regular, lineHeight: 18 },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, letterSpacing: 0.5 },
  mono: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0,
  },
  monoSmall: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    letterSpacing: 0,
  },
} as const;
```

- [ ] **Step 3: Adicionar aliases semânticos de elevation**

Após o bloco `export const elevationDark`, adicionar:

```ts
// Semantic elevation aliases — usar nas telas em vez de sm/md/lg/primary direto.
// Card = elemento normal. Sheet = modal/bottom-sheet. Popover = floating action.
// Aliases semânticos: card / sheet / popover.
export const elevationAliasLight = {
  card: elevationLight.sm,
  sheet: elevationLight.lg,
  popover: elevationLight.primary,
} as const;

export const elevationAliasDark = {
  card: elevationDark.sm,
  sheet: elevationDark.lg,
  popover: elevationDark.primary,
} as const;
```

- [ ] **Step 4: Verificar typecheck**

Run:
```bash
npm run typecheck
```
Expected: exit 0 (zero erros).

Se quebrar com "Cannot find name 'Platform'", garantir que o `import { Platform } from "react-native";` foi adicionado no topo.

- [ ] **Step 5: Commit**

```bash
git add lib/theme.ts
git commit -m "feat(theme): add mono typography, letter-spacing on headings, semantic elevation aliases

- fontFamily.mono per platform (Menlo/monospace)
- typography.mono and typography.monoSmall for numbers (R\$, VIN, score)
- letter-spacing -0.4/-0.3 on h1/h2 per UX guide
- elevationAliasLight/Dark with card/sheet/popover names

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 2 — Intro bug fix (urgent, isolated)

### Task 2: Corrigir autoplay do `IntroVideo` no web

**Files:**
- Modify: `components/ui/IntroVideo.tsx:33-66`

- [ ] **Step 1: Mover `play()` do setup pro useEffect e adicionar fallback timeout**

Em `components/ui/IntroVideo.tsx`, substituir o `useVideoPlayer` (linhas ~33-37) e o `useEffect` (linhas ~49-52):

```tsx
const player = useVideoPlayer(INTRO_SOURCE, (p) => {
  p.loop = false;
  p.muted = true;
  // play() removed from setup — does not work on web during render phase
  // (the <video> DOM element isn't mounted yet, so the call iterates an
  // empty Set). Moved to useEffect below.
  // play() saiu do setup — no web nao funciona durante render.
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
  // Native: play() pending until VideoView mounts (handled by impl).
  // Web: VideoView.web.js requires the <video> in DOM before play().
  // useEffect runs post-mount, so this works on both platforms.
  // Nativo retem play() pendente; web exige <video> montado.
  player.play();
  const sub = player.addListener("playToEnd", finish);

  // Web autoplay can be blocked silently by the browser. After 6s with no
  // playToEnd event, release the gate so the user is never stuck on intro.
  // Native always reaches playToEnd well before this timeout fires.
  // Fallback de 6s pra autoplay bloqueado no web.
  const blockedTimeout = setTimeout(finish, 6000);

  return () => {
    sub.remove();
    clearTimeout(blockedTimeout);
  };
}, [player, finish]);
```

- [ ] **Step 2: Adicionar `playsInline` no `<VideoView>`**

Encontrar o `<VideoView ... />` (linhas ~59-65) e adicionar a prop `playsInline`:

```tsx
<VideoView
  player={player}
  style={{ width, height }}
  contentFit="cover"
  nativeControls={false}
  allowsPictureInPicture={false}
  playsInline
/>
```

- [ ] **Step 3: Verificar typecheck**

Run:
```bash
npm run typecheck
```
Expected: exit 0.

- [ ] **Step 4: Smoke test no web**

Run:
```bash
npm run web
```

Esperado:
- Vídeo de intro toca normalmente na primeira abertura
- Se o browser bloquear autoplay (raro com `muted` + `playsInline`), em 6s o overlay some sozinho e o app continua pro login/home
- Botão "Pular" no canto continua funcionando

Encerrar dev server com Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add components/ui/IntroVideo.tsx
git commit -m "fix(intro): web autoplay bug; play() to useEffect, add playsInline + 6s fallback

Root cause: useVideoPlayer's setup callback runs during render. On web,
VideoPlayerWeb.play() iterates an empty _mountedVideos Set because the
<video> element only mounts after render. play() became a no-op and the
intro froze on the first frame. Native impl retained the pending play(),
masking the issue.

Fix:
- Move player.play() into useEffect (post-mount, works on both platforms)
- Add playsInline to <VideoView> (some web engines block muted autoplay otherwise)
- Add 6s timeout fallback calling finish() — if autoplay is blocked
  for any reason, the user is released from the intro gate

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 3 — Shared utilities

### Task 3: `lib/relative-time.ts` — formatador de tempo relativo

**Files:**
- Create: `lib/relative-time.ts`
- Modify: `i18n/pt-BR.json` (adicionar bloco `time.*`)
- Modify: `i18n/en.json` (adicionar bloco `time.*`)

- [ ] **Step 1: Adicionar chaves i18n**

Em `i18n/pt-BR.json`, adicionar no nível raiz (antes do `cta` final, ordem alfabética por convenção):

```json
  "time": {
    "now": "agora",
    "minutes_ago": "há {{count}} min",
    "hours_ago": "há {{count}}h",
    "days_ago": "há {{count}} dia",
    "days_ago_plural": "há {{count}} dias"
  },
```

Em `i18n/en.json`, mesmo bloco:

```json
  "time": {
    "now": "now",
    "minutes_ago": "{{count}}m ago",
    "hours_ago": "{{count}}h ago",
    "days_ago": "{{count}} day ago",
    "days_ago_plural": "{{count}} days ago"
  },
```

- [ ] **Step 2: Criar a utility**

Create `lib/relative-time.ts`:

```ts
// Relative time formatter — "agora", "ha 5 min", "ha 3h", "ha 2 dias",
// then falls back to DD/MM after 7 days. Locale-agnostic: takes the
// TFunction from react-i18next, so caller controls translation.
// Formatador relativo: i18n-aware via TFunction passada do caller.

import type { TFunction } from "i18next";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

/**
 * Format an ISO timestamp as a short relative label.
 * - < 60s: "now"
 * - < 60min: "5m ago"
 * - < 24h: "3h ago"
 * - < 7d: "2 days ago" (plural-aware)
 * - >= 7d: "DD/MM" (zero-padded)
 *
 * @param iso ISO 8601 timestamp string (e.g. Lead.created_at)
 * @param t react-i18next TFunction, scoped to the "time" namespace
 * @param now optional "now" timestamp for deterministic testing (defaults to Date.now())
 */
export function formatRelativeTime(
  iso: string,
  t: TFunction,
  now: number = Date.now(),
): string {
  const target = Date.parse(iso);
  if (Number.isNaN(target)) return "";

  const diff = Math.max(0, now - target);

  if (diff < MINUTE_MS) return t("time.now");

  if (diff < HOUR_MS) {
    const count = Math.floor(diff / MINUTE_MS);
    return t("time.minutes_ago", { count });
  }

  if (diff < DAY_MS) {
    const count = Math.floor(diff / HOUR_MS);
    return t("time.hours_ago", { count });
  }

  if (diff < WEEK_MS) {
    const count = Math.floor(diff / DAY_MS);
    // i18next plural fallback: count=1 hits "time.days_ago", count>1 hits "time.days_ago_plural"
    // (configured via the *_plural suffix convention from compatibilityJSON: "v4")
    return count === 1
      ? t("time.days_ago", { count })
      : t("time.days_ago_plural", { count });
  }

  // Older than a week — short date "DD/MM"
  const d = new Date(target);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}
```

- [ ] **Step 3: Verificar typecheck**

```bash
npm run typecheck
```
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add lib/relative-time.ts i18n/pt-BR.json i18n/en.json
git commit -m "feat(time): relative time formatter for lead age display

- formatRelativeTime(iso, t) returns 'now' / '5m ago' / '3h ago' / '2 days ago' / 'DD/MM'
- Pluralization via i18next *_plural suffix convention
- Caller passes TFunction so component owns locale subscription

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 4 — New components

### Task 4: `components/ui/ScreenHeader.tsx`

**Files:**
- Create: `components/ui/ScreenHeader.tsx`

- [ ] **Step 1: Criar o componente**

Create `components/ui/ScreenHeader.tsx`:

```tsx
// Standard header for tab screens. Replaces the ad-hoc <View><Text/></View>
// pattern repeated across (tabs)/index, leads, profile. Title is h1, optional
// subtitle is body textMuted, optional trailing slot is right-aligned for
// actions like filter / refresh / count.
// Header padronizado das tabs. Substitui o markup inline duplicado.

import { useMemo, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/context/ThemeContext";
import { spacing, typography, type ThemeColors } from "@/lib/theme";

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}

export function ScreenHeader({ title, subtitle, trailing }: ScreenHeaderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.lg,
    },
    text: { flex: 1, gap: spacing.xs },
    title: {
      ...typography.h1,
      color: c.text,
    },
    subtitle: {
      ...typography.body,
      color: c.textMuted,
    },
    trailing: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
  });
}
```

- [ ] **Step 2: Verificar typecheck**

```bash
npm run typecheck
```
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add components/ui/ScreenHeader.tsx
git commit -m "feat(ui): add ScreenHeader for consistent tab screen headers

Standardizes the ad-hoc header markup repeated across (tabs)/index,
leads, profile. Title is h1; optional subtitle (body/textMuted) and
optional trailing slot for actions or counts.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: `components/ui/ErrorBanner.tsx`

**Files:**
- Create: `components/ui/ErrorBanner.tsx`
- Modify: `i18n/pt-BR.json` (chave `common.retry`)
- Modify: `i18n/en.json` (chave `common.retry`)

- [ ] **Step 1: Adicionar chaves i18n**

Em `i18n/pt-BR.json`, adicionar bloco `common` no nível raiz:

```json
  "common": {
    "retry": "Tentar de novo",
    "coming_soon": "Em breve"
  },
```

Em `i18n/en.json`:

```json
  "common": {
    "retry": "Try again",
    "coming_soon": "Coming soon"
  },
```

- [ ] **Step 2: Criar o componente**

Create `components/ui/ErrorBanner.tsx`:

```tsx
// Inline error banner with optional retry action. Replaces the <Text style={error}>
// pattern in Home, Leads, LeadDetail. Always renders an icon for scannability;
// retry button only renders if onRetry is provided.
// Banner inline de erro: icon + mensagem + retry opcional.

import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/context/ThemeContext";
import { radius, spacing, typography, type ThemeColors } from "@/lib/theme";
import { haptic } from "@/lib/haptics";

export interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  /** Override the default retry label. Pass an i18n key if you want a non-default label. */
  retryLabel?: string;
}

export function ErrorBanner({ message, onRetry, retryLabel }: ErrorBannerProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
      <Text style={styles.message} numberOfLines={3}>
        {message}
      </Text>
      {onRetry ? (
        <Pressable
          onPress={() => {
            haptic.light();
            onRetry();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={retryLabel ?? t("common.retry")}
          style={({ pressed }) => [styles.retry, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.retryLabel}>{retryLabel ?? t("common.retry")}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      backgroundColor: c.errorSoft,
      borderColor: c.error,
      borderWidth: 1,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      marginHorizontal: spacing.xl,
      marginBottom: spacing.md,
    },
    message: {
      flex: 1,
      ...typography.caption,
      color: c.text,
      fontWeight: "600",
    },
    retry: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.sm,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.error,
    },
    retryLabel: {
      ...typography.caption,
      fontWeight: "700",
      color: c.error,
    },
  });
}
```

- [ ] **Step 3: Verificar typecheck**

```bash
npm run typecheck
```
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add components/ui/ErrorBanner.tsx i18n/pt-BR.json i18n/en.json
git commit -m "feat(ui): add ErrorBanner with optional retry

Replaces the bare <Text style={error}> pattern across Home, Leads,
LeadDetail. Banner shows icon + message + optional 'Try again' button.
Haptic light on retry tap. i18n keys common.retry / common.coming_soon
added (coming_soon used by upcoming action-button stubs).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: `components/domain/LeadCardSkeleton.tsx`

**Files:**
- Create: `components/domain/LeadCardSkeleton.tsx`

> **Nota:** Este componente espelha o layout do LeadCard *novo* (Task 8). Como Task 8 ainda não rodou, criamos o skeleton agora com base no layout planejado e ele já vai estar pronto pra quando o LeadCard novo entrar.

- [ ] **Step 1: Criar o componente**

Create `components/domain/LeadCardSkeleton.tsx`:

```tsx
// Skeleton placeholder matching the shape of the rewritten LeadCard.
// Used during initial load on Home and Leads. Render 3-5 stacked
// instances inside the list while data is fetching.
// Esqueleto do LeadCard novo: usado no loading inicial.

import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing, type ThemeColors } from "@/lib/theme";

export function LeadCardSkeleton() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Card style={styles.card}>
      <View style={styles.leftStripe} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Skeleton width={72} height={18} borderRadius={radius.sm} />
          <Skeleton width={56} height={14} borderRadius={radius.sm} />
        </View>
        <Skeleton width="80%" height={16} borderRadius={radius.sm} />
        <Skeleton width="60%" height={14} borderRadius={radius.sm} />
        <View style={styles.row}>
          <Skeleton width={48} height={14} borderRadius={radius.sm} />
          <Skeleton width={72} height={16} borderRadius={radius.sm} />
        </View>
      </View>
    </Card>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      padding: 0,
      overflow: "hidden",
    },
    leftStripe: {
      width: 3,
      backgroundColor: c.border,
    },
    body: {
      flex: 1,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
  });
}
```

- [ ] **Step 2: Verificar typecheck**

```bash
npm run typecheck
```
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add components/domain/LeadCardSkeleton.tsx
git commit -m "feat(domain): add LeadCardSkeleton placeholder matching new card shape

Skeleton mirrors the layout of the upcoming LeadCard rewrite: left
priority stripe + VIN/relative-time row + reason lines + status/value
row. Used in initial load on Home and Leads before data arrives.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 5 — Component cleanup

### Task 7: Extrair `PhotoButton` para arquivo próprio

**Files:**
- Create: `components/ui/PhotoButton.tsx`
- Modify: `app/(tabs)/profile.tsx` (remover subcomponente inline, importar do novo path)

- [ ] **Step 1: Criar `components/ui/PhotoButton.tsx`**

Create `components/ui/PhotoButton.tsx`:

```tsx
// Photo source button (Camera / Gallery / Remove). Square card with icon
// circle + label. Extracted from profile.tsx where it lived as an inline
// subcomponent. Destructive variant flips colors to error tones.
// Extraido do profile.tsx pra reuso e clareza.

import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/context/ThemeContext";
import { radius, spacing, typography, type ThemeColors } from "@/lib/theme";

export interface PhotoButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

export function PhotoButton({
  icon,
  label,
  onPress,
  disabled,
  destructive,
}: PhotoButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && { opacity: 0.5 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View
        style={[
          styles.iconWrap,
          destructive ? { backgroundColor: colors.errorSoft } : undefined,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={destructive ? colors.error : colors.primary}
        />
      </View>
      <Text
        style={[
          styles.label,
          destructive ? { color: colors.error } : undefined,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    button: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      paddingVertical: spacing.md + 2,
      alignItems: "center",
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      ...typography.caption,
      fontWeight: "600",
      color: c.text,
    },
    pressed: { opacity: 0.7 },
  });
}
```

- [ ] **Step 2: Remover subcomponente inline em `profile.tsx`**

Em `app/(tabs)/profile.tsx`:

- Remover o bloco `type PhotoButtonProps = { ... }` (linhas ~295-303)
- Remover a function `PhotoButton({ ... }) { ... }` (linhas ~305-348)
- Adicionar import no topo, junto dos outros UI imports:

```tsx
import { PhotoButton } from "@/components/ui/PhotoButton";
```

- Atualizar os três `<PhotoButton ... />` (linhas ~185-210) removendo as props `colors` e `styles` — agora o componente busca tudo internamente:

```tsx
<PhotoButton
  icon="camera-outline"
  label={t("profile.camera")}
  onPress={onPickFromCamera}
  disabled={uploadingPhoto}
/>
<PhotoButton
  icon="images-outline"
  label={t("profile.gallery")}
  onPress={onPickFromLibrary}
  disabled={uploadingPhoto}
/>
{profile?.avatar_url ? (
  <PhotoButton
    icon="trash-outline"
    label={t("profile.remove")}
    onPress={onRemovePhoto}
    disabled={uploadingPhoto}
    destructive
  />
) : null}
```

E como o `createStyles` no `profile.tsx` ainda tem chaves `photoButton/photoIconWrap/photoButtonLabel/pressedSoft` específicas pra esse subcomponente, removê-las (`pressedSoft` ainda é usada em outros lugares — manter; remover só as `photoButton*`):

Procurar e remover do `createStyles`:
- `photoButton: { ... }` (entrada inteira)
- `photoIconWrap: { ... }` (entrada inteira)
- `photoButtonLabel: { ... }` (entrada inteira)

Manter `pressedSoft` (usada por avatarPressable, themeCard, etc) e `photoButtonsRow` (usada pelo wrapper).

- [ ] **Step 3: Verificar typecheck**

```bash
npm run typecheck
```
Expected: exit 0.

Se reclamar de "Cannot find name 'PhotoButton'", revisar o import.
Se reclamar de "Property 'X' does not exist on type", revisar se algum style restante referencia `photoButton*`.

- [ ] **Step 4: Smoke test rápido**

```bash
npm run web
```

Navegar para Profile (precisa estar logado — se não tiver, fazer login com credenciais Supabase de teste). Verificar:
- Os 3 botões Camera/Galeria/Remover (se houver foto) aparecem
- Tap funciona, abre o picker
- Variant destructive (Remover) está em vermelho

Ctrl+C pra parar.

- [ ] **Step 5: Commit**

```bash
git add components/ui/PhotoButton.tsx app/\(tabs\)/profile.tsx
git commit -m "refactor(profile): extract PhotoButton to its own UI component

PhotoButton was an inline subcomponent in profile.tsx that needed
colors and styles passed through props. Now self-contained: reads
useTheme() internally and owns its StyleSheet. Removes ~50 lines from
profile.tsx and frees the component to be reused if needed later.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

> **Note for Windows shells:** o nome do diretório `(tabs)` tem parênteses; em PowerShell pode precisar de aspas: `git add 'app/(tabs)/profile.tsx'`. Em Git Bash, escapar com `\(` `\)` funciona.

---

## Phase 6 — Domain component

### Task 8: Rewrite `components/domain/LeadCard.tsx`

**Files:**
- Modify: `components/domain/LeadCard.tsx` (rewrite completo)

- [ ] **Step 1: Substituir o conteúdo do arquivo**

Substituir TODO o conteúdo de `components/domain/LeadCard.tsx`:

```tsx
// LeadCard — domain component for showing a lead in lists.
// Layout (left to right):
//   [3px priority stripe] [body]
// Body rows:
//   1. Priority chip (colored, uppercase) on the left + relative time on the right
//   2. VIN in mono semibold
//   3. Reason in body textMuted (optional)
//   4. Status dot + label on the left + expected value (mono, primary color) on the right
// Pressable wraps the whole thing; haptic light on press; scale 0.99 on press.
// Card de lead na lista: stripe + chip + VIN mono + razao + status + valor.

import React, { useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/Card";
import { useTheme } from "@/context/ThemeContext";
import { haptic } from "@/lib/haptics";
import type { Lead } from "@/lib/api";
import { formatRelativeTime } from "@/lib/relative-time";
import {
  leadPriorityPalette,
  leadStatusPalette,
  radius,
  spacing,
  typography,
  type ThemeColors,
} from "@/lib/theme";

export interface LeadCardProps {
  lead: Lead;
  onPress?: () => void;
}

const SCALE_PRESSED = 0.99;

export function LeadCard({ lead, onPress }: LeadCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scale = useRef(new Animated.Value(1)).current;

  const priority = leadPriorityPalette[lead.priority];
  const status = leadStatusPalette[lead.status];
  const relativeTime = formatRelativeTime(lead.created_at, t);

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

  const cardBody = (
    <Card style={styles.card}>
      <View style={[styles.stripe, { backgroundColor: priority.color }]} />
      <View style={styles.body}>
        <View style={styles.row}>
          <View style={[styles.chip, { backgroundColor: priority.bg, borderColor: priority.border }]}>
            <Text style={[styles.chipLabel, { color: priority.color }]} numberOfLines={1}>
              {t(priority.labelKey)}
            </Text>
          </View>
          {relativeTime ? (
            <Text style={styles.time} numberOfLines={1}>
              {relativeTime}
            </Text>
          ) : null}
        </View>

        <Text style={styles.vin} numberOfLines={1}>
          {lead.vin ?? "—"}
        </Text>

        {lead.reason ? (
          <Text style={styles.reason} numberOfLines={2}>
            {lead.reason}
          </Text>
        ) : null}

        <View style={styles.row}>
          <View style={styles.statusGroup}>
            <View style={[styles.dot, { backgroundColor: status.color }]} />
            <Text style={styles.statusLabel} numberOfLines={1}>
              {t(status.labelKey)}
            </Text>
          </View>
          {lead.expected_value_brl != null ? (
            <Text style={styles.value} numberOfLines={1}>
              {formatBRL(lead.expected_value_brl)}
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );

  if (!onPress) return cardBody;

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
        accessibilityLabel={`${t(priority.labelKey)} · ${lead.vin ?? ""}`}
      >
        {cardBody}
      </Pressable>
    </Animated.View>
  );
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      padding: 0,
      overflow: "hidden",
    },
    stripe: {
      width: 3,
    },
    body: {
      flex: 1,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.md,
    },
    chip: {
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 2,
      borderRadius: radius.sm,
      borderWidth: 1,
    },
    chipLabel: {
      ...typography.label,
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    time: {
      ...typography.caption,
      color: c.textSubtle,
    },
    vin: {
      ...typography.mono,
      color: c.text,
    },
    reason: {
      ...typography.body,
      color: c.textMuted,
    },
    statusGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs + 2,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusLabel: {
      ...typography.caption,
      color: c.textMuted,
      fontWeight: "600",
    },
    value: {
      ...typography.mono,
      color: c.primary,
      fontWeight: "700",
    },
  });
}
```

- [ ] **Step 2: Atualizar callers que passavam só `<LeadCard lead={item} />` sem onPress**

Em `app/(tabs)/index.tsx`:
- O `renderItem={({ item }) => <LeadCard lead={item} />}` (linha ~66) precisa ganhar onPress pra navegar pra `/lead/[id]`. Adicionar import e wrapper:

```tsx
import { router } from "expo-router";

// ... dentro do componente ...
renderItem={({ item }) => (
  <LeadCard
    lead={item}
    onPress={() => router.push({ pathname: "/lead/[id]", params: { id: item.id } })}
  />
)}
```

Em `app/(tabs)/leads.tsx`:
- Hoje usa `<Link href={...} asChild><View><LeadCard lead={item}/></View></Link>`. Substituir pelo mesmo padrão da Home:

```tsx
import { router } from "expo-router";

// ... dentro do renderItem ...
renderItem={({ item }) => (
  <LeadCard
    lead={item}
    onPress={() => router.push({ pathname: "/lead/[id]", params: { id: item.id } })}
  />
)}
```

E remover o `import { Link } from "expo-router";` que vira não-utilizado.

- [ ] **Step 3: Verificar typecheck e lint**

```bash
npm run typecheck && npm run lint
```
Expected: ambos exit 0.

Se lint reclamar de import não-utilizado em leads.tsx, remover (provavelmente `Link`).

- [ ] **Step 4: Smoke test**

```bash
npm run web
```

Abrir Home (se estiver logado, senão login). Esperado:
- Cada LeadCard tem stripe colorida à esquerda (vermelho pra critical, cinza pra low, etc)
- Chip de prioridade no topo esquerdo em uppercase
- Tempo relativo "há X min/h/dias" no topo direito (ou "agora")
- VIN em fonte monoespaçada
- Dot colorido + label de status à esquerda do valor
- Valor em mono azul Ford (light) ou azul claro (dark)
- Pressionar o card: leve scale + navega pra detail

Testar light e dark mode (toggle no Profile).

Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add components/domain/LeadCard.tsx app/\(tabs\)/index.tsx app/\(tabs\)/leads.tsx
git commit -m "feat(LeadCard): rewrite with priority stripe, mono VIN, status dot, relative time

Major redesign per design spec:
- 3px left stripe colored by priority (leadPriorityPalette)
- Uppercase priority chip with palette bg/border/color
- Relative-time label (now / Xm ago / Xh ago / X days ago / DD/MM) on right
- VIN in mono typography (Menlo/monospace)
- Status shown as colored dot + label (more discreet than badge)
- Expected value in mono, primary color, no fraction digits
- Whole card is Pressable with haptic light + scale spring on press
- Callers in Home and Leads updated to pass onPress and navigate via router.push

leadStatusPalette and leadPriorityPalette (already in theme.ts) are now
actually used — previously LeadCard hardcoded tone='textMuted'.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 7 — Screen refactors

### Task 9: Refatorar `app/login.tsx` (logo tipográfico + footer + scale anim)

**Files:**
- Modify: `app/login.tsx`
- Modify: `i18n/pt-BR.json` (chave `auth.forgot_password`)
- Modify: `i18n/en.json` (chave `auth.forgot_password`)

- [ ] **Step 1: Adicionar chaves i18n**

Em `i18n/pt-BR.json`, dentro do bloco `auth`, adicionar:

```json
    "forgot_password": "Esqueci minha senha",
```

Em `i18n/en.json`:

```json
    "forgot_password": "Forgot password",
```

- [ ] **Step 2: Substituir conteúdo de `app/login.tsx`**

Substituir TODO o conteúdo de `app/login.tsx`:

```tsx
import { useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast, type ToastVariant } from "@/components/ui/Toast";
import { useTheme } from "@/context/ThemeContext";
import { useFadeIn } from "@/hooks/useFadeIn";
import { useShake } from "@/hooks/useShake";
import { signInWithEmail } from "@/lib/auth";
import { haptic } from "@/lib/haptics";
import { fontWeight, radius, spacing, typography, type ThemeColors } from "@/lib/theme";
import {
  validateEmail,
  validatePassword,
  type ValidationError,
} from "@/lib/validation";

type Errors = {
  email?: ValidationError;
  password?: ValidationError;
};

function validate(values: { email: string; password: string }): Errors {
  const errors: Errors = {};
  const email = validateEmail(values.email);
  if (email) errors.email = email;
  const password = validatePassword(values.password);
  if (password) errors.password = password;
  return errors;
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { translateX, shake } = useShake();
  const { opacity, translateY } = useFadeIn(360);

  // Scale-in for the header — sits on top of the fade. Subtle (0.96 -> 1).
  // Scale leve junto do fade pra entrada mais viva.
  const scale = useRef(new Animated.Value(0.96)).current;
  useMemo(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 8,
      bounciness: 6,
    }).start();
    return null;
  }, [scale]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: "", variant: "info" });

  const errors = useMemo(() => validate({ email, password }), [email, password]);
  const visibleErrors: Errors = submitted ? errors : {};
  const hasErrors = Object.keys(errors).length > 0;
  const buttonDisabled = submitted && hasErrors;

  async function onSubmit() {
    setSubmitted(true);
    setServerError(null);
    if (hasErrors) {
      haptic.error();
      shake();
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      haptic.success();
      router.replace("/");
    } catch {
      haptic.error();
      setServerError(t("auth.error"));
      shake();
    } finally {
      setLoading(false);
    }
  }

  function onForgotPassword() {
    haptic.light();
    setToast({
      visible: true,
      message: t("common.coming_soon"),
      variant: "info",
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing["4xl"], paddingBottom: insets.bottom + spacing["2xl"] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.header,
            { opacity, transform: [{ translateY }, { scale }] },
          ]}
        >
          <Text style={styles.brand}>FORD</Text>
          <Text style={styles.title}>{t("app.name")}</Text>
          <Text style={styles.subtitle}>{t("auth.subtitle")}</Text>
        </Animated.View>

        <View style={styles.form}>
          <Input
            label={t("auth.email")}
            placeholder={t("auth.email_placeholder")}
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            shakeAnim={translateX}
            error={
              visibleErrors.email
                ? t(visibleErrors.email.key, visibleErrors.email.vars)
                : undefined
            }
          />
          <Input
            label={t("auth.password")}
            placeholder="••••••"
            icon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            shakeAnim={translateX}
            error={
              visibleErrors.password
                ? t(visibleErrors.password.key, visibleErrors.password.vars)
                : undefined
            }
          />

          {serverError ? (
            <View style={styles.serverErrorBox}>
              <Text style={styles.serverErrorText}>{serverError}</Text>
            </View>
          ) : null}

          <Button
            label={t("auth.sign_in")}
            loading={loading}
            disabled={buttonDisabled}
            onPress={onSubmit}
            style={styles.submit}
          />
        </View>

        <Pressable
          onPress={onForgotPassword}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t("auth.forgot_password")}
          style={({ pressed }) => [styles.forgotWrap, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.forgotLabel}>{t("auth.forgot_password")}</Text>
        </Pressable>
      </ScrollView>

      <Toast
        message={toast.message}
        variant={toast.variant}
        visible={toast.visible}
        onHide={() => setToast((p) => ({ ...p, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: spacing.xl,
      justifyContent: "center",
    },
    header: {
      alignItems: "center",
      marginBottom: spacing["2xl"],
      gap: spacing.xs,
    },
    brand: {
      fontSize: 40,
      fontWeight: fontWeight.extrabold,
      letterSpacing: 6,
      color: c.primary,
      marginBottom: spacing.md,
    },
    title: { ...typography.h1, color: c.text },
    subtitle: {
      ...typography.body,
      color: c.textMuted,
      textAlign: "center",
      paddingHorizontal: spacing.lg,
    },
    form: { width: "100%" },
    serverErrorBox: {
      borderWidth: 1,
      borderColor: c.error,
      backgroundColor: c.errorSoft,
      borderRadius: radius.md,
      padding: spacing.md,
      marginTop: spacing.xs,
      marginBottom: spacing.md,
    },
    serverErrorText: {
      ...typography.caption,
      fontWeight: "600",
      color: c.error,
      textAlign: "center",
    },
    submit: { marginTop: spacing.md },
    forgotWrap: {
      alignItems: "center",
      paddingVertical: spacing.lg,
      marginTop: spacing.md,
    },
    forgotLabel: {
      ...typography.caption,
      color: c.primary,
      fontWeight: "600",
    },
  });
}
```

- [ ] **Step 3: Verificar typecheck e lint**

```bash
npm run typecheck && npm run lint
```
Expected: ambos exit 0.

- [ ] **Step 4: Smoke test**

```bash
npm run web
```

Esperado em /login (sign out se estiver logado):
- "FORD" grande em letter-spacing 6, cor primary, no topo
- Título "ForwardService" abaixo
- Subtitle abaixo
- Form de email + senha
- Botão "Entrar"
- Footer "Esqueci minha senha" centralizado, tappable, abre toast "Em breve"
- Header anima com fade + slide-up + scale leve na entrada
- Submit com credenciais erradas: shake + haptic error + banner vermelho

Light + dark.

Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add app/login.tsx i18n/pt-BR.json i18n/en.json
git commit -m "feat(login): typographic FORD brand, forgot-password footer, scale-in animation

- Brand wordmark 'FORD' (extrabold, letter-spacing 6) above the title
- Forgot password footer link (opens 'coming soon' toast for now)
- Header entrance combines fade-in (already present) + spring scale 0.96 to 1
- Toast added to the screen for the forgot-password feedback

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Refatorar `app/(tabs)/index.tsx` (Home — greeting, hero KPI, skeleton, ErrorBanner, top 5)

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Modify: `i18n/pt-BR.json` (greeting com hora, hero, see_all)
- Modify: `i18n/en.json`

- [ ] **Step 1: Adicionar chaves i18n**

Em `i18n/pt-BR.json`, atualizar/expandir o bloco `home`:

```json
  "home": {
    "greeting_morning": "Bom dia, {{name}}",
    "greeting_afternoon": "Boa tarde, {{name}}",
    "greeting_evening": "Boa noite, {{name}}",
    "today": "Hoje",
    "todays_leads": "Leads de hoje",
    "empty": "Nenhum lead no momento",
    "empty_title": "Sem leads por enquanto",
    "empty_description": "Quando novos leads forem atribuidos a voce, eles aparecem aqui.",
    "error": "Falha ao carregar dados",
    "hero": {
      "active_leads": "Leads ativos",
      "pipeline": "Pipeline"
    },
    "see_all": "Ver todos os leads",
    "see_all_with_count": "Ver todos os {{count}} leads"
  },
```

(O `home.greeting` legado some — só `home.greeting_morning|afternoon|evening` ficam.)

Em `i18n/en.json`:

```json
  "home": {
    "greeting_morning": "Good morning, {{name}}",
    "greeting_afternoon": "Good afternoon, {{name}}",
    "greeting_evening": "Good evening, {{name}}",
    "today": "Today",
    "todays_leads": "Today's leads",
    "empty": "No leads at the moment",
    "empty_title": "No leads yet",
    "empty_description": "When new leads are assigned to you, they will show up here.",
    "error": "Failed to load data",
    "hero": {
      "active_leads": "Active leads",
      "pipeline": "Pipeline"
    },
    "see_all": "See all leads",
    "see_all_with_count": "See all {{count}} leads"
  },
```

- [ ] **Step 2: Substituir o conteúdo de `app/(tabs)/index.tsx`**

```tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { LeadCard } from "@/components/domain/LeadCard";
import { LeadCardSkeleton } from "@/components/domain/LeadCardSkeleton";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useTheme } from "@/context/ThemeContext";
import { api, ApiError, type Lead } from "@/lib/api";
import { fetchMyProfile } from "@/lib/profile";
import { getAccessToken } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { radius, spacing, typography, type ThemeColors } from "@/lib/theme";

type HeroStats = {
  activeLeads: number;
  pipelineBRL: number;
};

const TOP_VISIBLE = 5;

function greetingKey(hour: number): "home.greeting_morning" | "home.greeting_afternoon" | "home.greeting_evening" {
  if (hour < 12) return "home.greeting_morning";
  if (hour < 18) return "home.greeting_afternoon";
  return "home.greeting_evening";
}

function computeHeroStats(leads: Lead[]): HeroStats {
  const activeLeads = leads.filter((l) => l.status !== "lost" && l.status !== "expired").length;
  const pipelineBRL = leads.reduce((sum, l) => sum + (l.expected_value_brl ?? 0), 0);
  return { activeLeads, pipelineBRL };
}

function formatCompactBRL(value: number): string {
  if (value >= 1000) {
    const k = value / 1000;
    return `R$ ${k.toFixed(k >= 10 ? 0 : 1)}k`;
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<string>("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = (await getAccessToken()) ?? undefined;
      const data = await api.listLeads({ limit: 50 }, token);
      setLeads(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("home.error"));
    }
  }, [t]);

  // Initial load — drives the skeleton state.
  // Carga inicial: alimenta o skeleton enquanto chega.
  useEffect(() => {
    void (async () => {
      await load();
      setInitialLoading(false);
    })();
  }, [load]);

  // Greeting name — try profile.full_name first, fall back to email prefix.
  // Nome para greeting: profile primeiro, depois prefixo do email.
  useEffect(() => {
    void (async () => {
      const profile = await fetchMyProfile().catch(() => null);
      if (profile?.full_name) {
        setName(profile.full_name.split(" ")[0]);
        return;
      }
      const auth = await supabase.auth.getUser();
      const email = auth.data.user?.email;
      if (email) setName(email.split("@")[0]);
    })();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const hero = useMemo(() => computeHeroStats(leads), [leads]);
  const topLeads = useMemo(() => leads.slice(0, TOP_VISIBLE), [leads]);
  const greeting = t(greetingKey(new Date().getHours()), { name: name || "" });

  return (
    <FlatList
      style={[styles.container, { paddingTop: insets.top }]}
      data={initialLoading ? [] : topLeads}
      keyExtractor={(l) => l.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
      ListHeaderComponent={
        <View>
          <ScreenHeader title={t("home.today")} subtitle={greeting.trim()} />

          <Card style={styles.hero}>
            <View style={styles.heroCol}>
              <Text style={styles.heroLabel}>{t("home.hero.active_leads")}</Text>
              <Text style={styles.heroValue}>{hero.activeLeads}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroCol}>
              <Text style={styles.heroLabel}>{t("home.hero.pipeline")}</Text>
              <Text style={styles.heroValue}>{formatCompactBRL(hero.pipelineBRL)}</Text>
            </View>
          </Card>

          {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}

          {initialLoading ? (
            <View style={styles.skeletonStack}>
              <LeadCardSkeleton />
              <LeadCardSkeleton />
              <LeadCardSkeleton />
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        !initialLoading && !error ? (
          <EmptyState
            icon="briefcase-outline"
            title={t("home.empty_title")}
            description={t("home.empty_description")}
          />
        ) : null
      }
      ListFooterComponent={
        !initialLoading && leads.length > TOP_VISIBLE ? (
          <Pressable
            onPress={() => router.push("/leads")}
            style={({ pressed }) => [styles.seeAll, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.seeAllLabel}>
              {t("home.see_all_with_count", { count: leads.length })}
            </Text>
          </Pressable>
        ) : null
      }
      renderItem={({ item }) => (
        <LeadCard
          lead={item}
          onPress={() => router.push({ pathname: "/lead/[id]", params: { id: item.id } })}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
    />
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { backgroundColor: c.bg },
    list: { paddingBottom: spacing["4xl"] },
    hero: {
      flexDirection: "row",
      alignItems: "stretch",
      marginHorizontal: spacing.xl,
      marginBottom: spacing.lg,
      padding: spacing.lg,
    },
    heroCol: { flex: 1, gap: spacing.xs },
    heroDivider: {
      width: 1,
      backgroundColor: c.separator,
      marginHorizontal: spacing.md,
    },
    heroLabel: {
      ...typography.label,
      color: c.textMuted,
      textTransform: "uppercase",
    },
    heroValue: {
      ...typography.mono,
      fontSize: 28,
      color: c.text,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    skeletonStack: {
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
    },
    seeAll: {
      marginTop: spacing.lg,
      marginHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: "center",
    },
    seeAllLabel: {
      ...typography.caption,
      fontWeight: "700",
      color: c.primary,
    },
  });
}
```

- [ ] **Step 3: Verificar typecheck e lint**

```bash
npm run typecheck && npm run lint
```
Expected: ambos exit 0.

- [ ] **Step 4: Smoke test**

```bash
npm run web
```

Em /home (logado):
- ScreenHeader com "Hoje" e greeting (ex: "Bom dia, Jota")
- Card hero com 2 KPIs lado a lado: "Leads ativos" + "Pipeline" em mono
- Durante load inicial: 3 skeletons da forma do LeadCard
- Após load: top 5 leads exibidos como LeadCard novos
- Pull-to-refresh funciona, tint primary
- Se houver mais de 5 leads: botão "Ver todos os N leads" no fim → push /leads
- Se erro: ErrorBanner com "Tentar de novo"

Light + dark.

Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/index.tsx i18n/pt-BR.json i18n/en.json
git commit -m "feat(home): ScreenHeader, time-aware greeting, hero KPI card, skeleton, ErrorBanner

- ScreenHeader replaces ad-hoc header markup
- Greeting picks morning/afternoon/evening by local time, name from profile.full_name (fallback to email prefix)
- Hero card shows 2 KPIs in mono: active leads count + pipeline sum (compact BRL: R\$ 38k)
- Top 5 leads shown; if more exist, footer 'See all N leads' pushes to /leads
- LeadCardSkeleton x3 during initial load (not on subsequent refreshes)
- ErrorBanner with retry replaces plain red text
- Pull-to-refresh tint changed to primary color

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Refatorar `app/(tabs)/leads.tsx` (search + filter chips + skeleton + RefreshControl)

**Files:**
- Modify: `app/(tabs)/leads.tsx`
- Modify: `i18n/pt-BR.json` (leads.title, search_placeholder, filters, empty_search)
- Modify: `i18n/en.json`

- [ ] **Step 1: Adicionar chaves i18n**

Em `i18n/pt-BR.json`, adicionar bloco `leads` no nível raiz:

```json
  "leads": {
    "title": "Leads",
    "subtitle_count": "{{count}} ativos",
    "subtitle_count_one": "{{count}} ativo",
    "search_placeholder": "Buscar por VIN ou motivo",
    "filter": {
      "all": "Todos",
      "critical": "Críticos",
      "today": "Hoje",
      "no_contact": "Sem contato 30d+"
    },
    "empty_search_title": "Nada encontrado",
    "empty_search_description": "Sem leads para '{{query}}'. Tente VIN parcial ou outro filtro."
  },
```

Em `i18n/en.json`:

```json
  "leads": {
    "title": "Leads",
    "subtitle_count": "{{count}} active",
    "subtitle_count_one": "{{count}} active",
    "search_placeholder": "Search by VIN or reason",
    "filter": {
      "all": "All",
      "critical": "Critical",
      "today": "Today",
      "no_contact": "No contact 30d+"
    },
    "empty_search_title": "Nothing found",
    "empty_search_description": "No leads for '{{query}}'. Try a partial VIN or another filter."
  },
```

- [ ] **Step 2: Substituir o conteúdo de `app/(tabs)/leads.tsx`**

```tsx
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { LeadCard } from "@/components/domain/LeadCard";
import { LeadCardSkeleton } from "@/components/domain/LeadCardSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useTheme } from "@/context/ThemeContext";
import { haptic } from "@/lib/haptics";
import { api, ApiError, type Lead } from "@/lib/api";
import { getAccessToken } from "@/lib/session";
import { radius, spacing, typography, type ThemeColors } from "@/lib/theme";

type FilterKey = "all" | "critical" | "today" | "no_contact";

const DAY_MS = 24 * 60 * 60 * 1000;

function applyFilters(leads: Lead[], filter: FilterKey, query: string): Lead[] {
  let out = leads;

  switch (filter) {
    case "critical":
      out = out.filter((l) => l.priority === "critical");
      break;
    case "today": {
      const cutoff = Date.now() - DAY_MS;
      out = out.filter((l) => Date.parse(l.created_at) >= cutoff);
      break;
    }
    case "no_contact": {
      const cutoff = Date.now() - 30 * DAY_MS;
      out = out.filter(
        (l) => l.status !== "contacted" && l.status !== "converted" && Date.parse(l.created_at) <= cutoff,
      );
      break;
    }
    case "all":
    default:
      break;
  }

  const q = query.trim().toLowerCase();
  if (q.length > 0) {
    out = out.filter(
      (l) =>
        (l.vin ?? "").toLowerCase().includes(q) ||
        (l.reason ?? "").toLowerCase().includes(q),
    );
  }

  return out;
}

export default function LeadsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = (await getAccessToken()) ?? undefined;
      setLeads(await api.listLeads({ limit: 100 }, token));
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filtered = useMemo(() => applyFilters(leads, filter, query), [leads, filter, query]);
  const activeCount = useMemo(
    () => leads.filter((l) => l.status !== "lost" && l.status !== "expired").length,
    [leads],
  );

  function onFilterPress(k: FilterKey) {
    haptic.selection();
    setFilter(k);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={t("leads.title")}
        subtitle={
          activeCount === 1
            ? t("leads.subtitle_count_one", { count: activeCount })
            : t("leads.subtitle_count", { count: activeCount })
        }
      />

      <View style={styles.controls}>
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder={t("leads.search_placeholder")}
          icon="search-outline"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {(["all", "critical", "today", "no_contact"] as FilterKey[]).map((k) => {
            const active = filter === k;
            return (
              <Pressable
                key={k}
                onPress={() => onFilterPress(k)}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && { opacity: 0.8 },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {t(`leads.filter.${k}`)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}

      {initialLoading ? (
        <View style={styles.skeletonStack}>
          <LeadCardSkeleton />
          <LeadCardSkeleton />
          <LeadCardSkeleton />
          <LeadCardSkeleton />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            !error ? (
              query.trim().length > 0 ? (
                <EmptyState
                  icon="search-outline"
                  title={t("leads.empty_search_title")}
                  description={t("leads.empty_search_description", { query: query.trim() })}
                />
              ) : (
                <EmptyState
                  icon="briefcase-outline"
                  title={t("home.empty_title")}
                  description={t("home.empty_description")}
                />
              )
            ) : null
          }
          renderItem={({ item }) => (
            <LeadCard
              lead={item}
              onPress={() => router.push({ pathname: "/lead/[id]", params: { id: item.id } })}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        />
      )}
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    controls: {
      paddingHorizontal: spacing.xl,
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    chips: {
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    chipLabel: {
      ...typography.caption,
      fontWeight: "600",
      color: c.text,
    },
    chipLabelActive: {
      color: c.primaryText,
    },
    skeletonStack: {
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
    },
    list: {
      padding: spacing.xl,
      paddingBottom: spacing["4xl"],
    },
  });
}
```

- [ ] **Step 3: Verificar typecheck e lint**

```bash
npm run typecheck && npm run lint
```
Expected: ambos exit 0.

- [ ] **Step 4: Smoke test**

```bash
npm run web
```

Em /leads:
- ScreenHeader "Leads" / "{N} ativos"
- Input de busca com search-outline
- Linha de 4 chips: Todos · Críticos · Hoje · Sem contato 30d+
- Chip selecionado fica azul Ford com texto branco
- Mudar chip dispara haptic selection
- Skeleton x4 no load inicial
- Digitar na busca filtra em tempo real; busca vazia mostra empty padrão; busca com texto mostra empty "Nada encontrado para 'X'"
- Pull-to-refresh com tint primary
- Tap em LeadCard navega pra detail

Light + dark.

Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/leads.tsx i18n/pt-BR.json i18n/en.json
git commit -m "feat(leads): ScreenHeader, search input, 4 filter chips, skeleton, ErrorBanner

- ScreenHeader 'Leads' with '{N} active' subtitle
- Search input (VIN or reason, client-side filter, case-insensitive)
- 4 filter chips: All / Critical / Today / No contact 30d+ (haptic selection on switch)
- LeadCardSkeleton x4 during initial load
- ErrorBanner with retry
- Search-empty vs no-data empty states differentiated
- Removed unused <Link> import (LeadCard now owns its own Pressable)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: Refatorar `app/(tabs)/profile.tsx` (ScreenHeader, consolidação, SettingRow, sign out)

**Files:**
- Modify: `app/(tabs)/profile.tsx`
- Modify: `i18n/pt-BR.json` (profile.subtitle se necessário)
- Modify: `i18n/en.json`

> **Nota:** PhotoButton já foi extraído na Task 7. Esta tarefa foca em (a) substituir o header manual por ScreenHeader, (b) unificar Theme card + Locale row em um padrão visual consistente, (c) tornar Sign out mais distinto (ghost com cor error).

- [ ] **Step 1: Substituir o conteúdo de `app/(tabs)/profile.tsx`**

```tsx
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

import { Button } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { LocalePicker } from "@/components/ui/LocalePicker";
import { PhotoButton } from "@/components/ui/PhotoButton";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Toast, type ToastVariant } from "@/components/ui/Toast";
import { useLocale } from "@/context/LocaleContext";
import { useTheme } from "@/context/ThemeContext";
import { signOut } from "@/lib/auth";
import { deleteAvatar, uploadAvatar } from "@/lib/avatar-upload";
import { haptic } from "@/lib/haptics";
import { pickFromCamera, pickFromLibrary, type PickedImage } from "@/lib/image-picker";
import { LOCALE_LABEL, LOCALE_SHORT } from "@/lib/locale";
import { fetchMyProfile, updateMyProfile, type Profile } from "@/lib/profile";
import { supabase } from "@/lib/supabase";
import { radius, spacing, typography, type ThemeColors } from "@/lib/theme";

type ProfileState = {
  email: string | null;
  profile: Profile | null;
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors, mode, toggleTheme, isOverridden, resetToSystem } = useTheme();
  const { locale } = useLocale();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [state, setState] = useState<ProfileState | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [localePickerOpen, setLocalePickerOpen] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: "", variant: "success" });

  useEffect(() => {
    void (async () => {
      const [authRes, profile] = await Promise.all([
        supabase.auth.getUser(),
        fetchMyProfile().catch(() => null),
      ]);
      setState({ email: authRes.data.user?.email ?? null, profile });
    })();
  }, []);

  function showToast(message: string, variant: ToastVariant = "success") {
    setToast({ visible: true, message, variant });
  }

  async function applyPhoto(picked: PickedImage) {
    setUploadingPhoto(true);
    try {
      const url = await uploadAvatar(picked);
      const updated = await updateMyProfile({ avatar_url: url });
      setState((prev) => (prev ? { ...prev, profile: updated } : prev));
      haptic.success();
      showToast(t("profile.photo_updated"));
    } catch {
      haptic.error();
      showToast(t("profile.photo_failed"), "error");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function onPickFromLibrary() {
    haptic.light();
    const picked = await pickFromLibrary();
    if (picked) await applyPhoto(picked);
  }

  async function onPickFromCamera() {
    haptic.light();
    const picked = await pickFromCamera();
    if (picked) await applyPhoto(picked);
  }

  async function onRemovePhoto() {
    haptic.warning();
    setUploadingPhoto(true);
    try {
      await deleteAvatar();
      const updated = await updateMyProfile({ avatar_url: null });
      setState((prev) => (prev ? { ...prev, profile: updated } : prev));
      haptic.success();
      showToast(t("profile.photo_removed"));
    } catch {
      haptic.error();
      showToast(t("profile.photo_remove_failed"), "error");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function onSignOut() {
    haptic.medium();
    await signOut();
    router.replace("/login");
  }

  if (!state) return <LoadingScreen label={t("loading.profile")} />;

  const { email, profile } = state;
  const displayName = profile?.full_name ?? t("profile.unnamed");
  const avatarSource = profile?.full_name ?? email ?? "?";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing["4xl"] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title={t("tabs.profile")} />

        {/* User card: avatar + name + email + photo actions all in one block */}
        {/* Card do usuario: avatar + identidade + acoes de foto numa secao so */}
        <View style={styles.userCard}>
          <View style={styles.userTop}>
            <Pressable
              onPress={onPickFromLibrary}
              disabled={uploadingPhoto}
              style={({ pressed }) => [styles.avatarPressable, pressed && styles.pressedSoft]}
              accessibilityRole="button"
              accessibilityLabel={t("profile.change_photo")}
            >
              <ProfileAvatar uri={profile?.avatar_url} source={avatarSource} size={64} />
              <View style={styles.avatarBadge}>
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color={colors.primaryText} />
                ) : (
                  <Ionicons name="camera" size={12} color={colors.primaryText} />
                )}
              </View>
            </Pressable>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {email ?? "—"}
              </Text>
            </View>
          </View>

          <View style={styles.photoButtonsRow}>
            <PhotoButton
              icon="camera-outline"
              label={t("profile.camera")}
              onPress={onPickFromCamera}
              disabled={uploadingPhoto}
            />
            <PhotoButton
              icon="images-outline"
              label={t("profile.gallery")}
              onPress={onPickFromLibrary}
              disabled={uploadingPhoto}
            />
            {profile?.avatar_url ? (
              <PhotoButton
                icon="trash-outline"
                label={t("profile.remove")}
                onPress={onRemovePhoto}
                disabled={uploadingPhoto}
                destructive
              />
            ) : null}
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t("profile.appearance")}</Text>

        <SettingRow
          icon={mode === "dark" ? "moon" : "sunny"}
          label={mode === "dark" ? t("profile.dark_mode") : t("profile.light_mode")}
          value={isOverridden ? t("profile.theme_manual") : t("profile.theme_auto")}
          colors={colors}
          styles={styles}
          right={
            <Switch
              value={mode === "dark"}
              onValueChange={() => {
                haptic.selection();
                toggleTheme();
              }}
              trackColor={{ false: colors.borderStrong, true: colors.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={colors.borderStrong}
            />
          }
        />

        {isOverridden ? (
          <Pressable
            onPress={() => {
              haptic.light();
              resetToSystem();
            }}
            style={({ pressed }) => [styles.linkRow, pressed && styles.pressedSoft]}
            accessibilityRole="button"
            accessibilityLabel={t("profile.follow_system")}
          >
            <Text style={styles.linkText}>{t("profile.follow_system")}</Text>
          </Pressable>
        ) : null}

        <Text style={styles.sectionTitle}>{t("profile.language")}</Text>

        <Pressable
          onPress={() => {
            haptic.light();
            setLocalePickerOpen(true);
          }}
          style={({ pressed }) => [pressed && styles.pressedSoft]}
          accessibilityRole="button"
          accessibilityLabel={`${t("profile.language")}: ${LOCALE_LABEL[locale]}`}
        >
          <SettingRow
            icon="globe-outline"
            label={t("profile.language")}
            value={`${LOCALE_LABEL[locale]} · ${LOCALE_SHORT[locale]}`}
            colors={colors}
            styles={styles}
            right={<Ionicons name="chevron-down" size={16} color={colors.textSubtle} />}
          />
        </Pressable>

        <Text style={styles.sectionTitle}>{t("profile.account")}</Text>

        <View style={styles.actionsCard}>
          <Button label={t("profile.sign_out")} variant="ghost" onPress={onSignOut} />
        </View>
      </ScrollView>

      <Toast
        message={toast.message}
        variant={toast.variant}
        visible={toast.visible}
        onHide={() => setToast((p) => ({ ...p, visible: false }))}
      />

      <LocalePicker visible={localePickerOpen} onClose={() => setLocalePickerOpen(false)} />
    </View>
  );
}

// SettingRow — local component, unifies the theme card and locale row visually.
// Linha de configuracao: icone esquerda + label/value + slot direito.
type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  right: React.ReactNode;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
};

function SettingRow({ icon, label, value, right, colors, styles }: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIconWrap}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <View style={styles.settingTextos}>
          <Text style={styles.settingLabel}>{label}</Text>
          <Text style={styles.settingValue} numberOfLines={1}>
            {value}
          </Text>
        </View>
      </View>
      {right}
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    scrollContent: { paddingHorizontal: 0 },
    userCard: {
      marginHorizontal: spacing.xl,
      marginBottom: spacing.xl,
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing.lg,
    },
    userTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
    },
    avatarPressable: { position: "relative" },
    avatarBadge: {
      position: "absolute",
      bottom: -2,
      right: -2,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: c.surface,
    },
    userInfo: { flex: 1 },
    userName: {
      ...typography.h3,
      color: c.text,
    },
    userEmail: {
      ...typography.caption,
      color: c.textMuted,
      marginTop: 2,
    },
    photoButtonsRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    sectionTitle: {
      ...typography.label,
      color: c.textMuted,
      textTransform: "uppercase",
      paddingHorizontal: spacing.xl,
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
    },
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      marginHorizontal: spacing.xl,
      marginBottom: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    settingLeft: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    settingIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    settingTextos: { flex: 1 },
    settingLabel: {
      ...typography.caption,
      color: c.textMuted,
    },
    settingValue: {
      ...typography.body,
      fontWeight: "700",
      color: c.text,
      marginTop: 2,
    },
    linkRow: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
      marginBottom: spacing.lg,
    },
    linkText: {
      ...typography.caption,
      color: c.primary,
      fontWeight: "600",
    },
    actionsCard: {
      marginHorizontal: spacing.xl,
      marginBottom: spacing.xl,
    },
    pressedSoft: {
      opacity: 0.7,
    },
  });
}
```

- [ ] **Step 2: Verificar typecheck e lint**

```bash
npm run typecheck && npm run lint
```
Expected: ambos exit 0.

- [ ] **Step 3: Smoke test**

```bash
npm run web
```

Em /profile (logado):
- ScreenHeader "Perfil"
- User card único contendo: avatar com badge câmera + nome + email + linha com 3 photo buttons
- Seção "Aparência" com SettingRow (icon sol/lua + label + value + Switch)
- Se override ativo, link "Voltar a seguir o sistema"
- Seção "Idioma" com SettingRow tappable (abre LocalePicker)
- Seção "Conta" com botão ghost "Sair" (cinza com borda; antes era secondary)
- Toggle theme dispara haptic selection
- Tap em sign out faz haptic medium e navega pra /login

Light + dark.

Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add app/\(tabs\)/profile.tsx
git commit -m "refactor(profile): ScreenHeader, unified user card, SettingRow, ghost sign-out

- ScreenHeader replaces manual title block
- User card now contains avatar + name + email + photo buttons all in one
  visually cohesive section (was two competing blocks)
- New local SettingRow component unifies theme toggle and language picker
  with the same icon + label + value + right-slot structure
- Sign out button changed to variant='ghost' (was secondary) for cleaner
  visual distinction from primary CTAs in other screens
- Theme toggle now triggers haptic.selection on switch

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 13: Refatorar `app/lead/[id].tsx` (sections + footer fixo de ações + skeleton + ErrorBanner)

**Files:**
- Modify: `app/lead/[id].tsx`
- Modify: `i18n/pt-BR.json` (lead.section.*, lead.actions.*)
- Modify: `i18n/en.json`

- [ ] **Step 1: Adicionar chaves i18n**

Em `i18n/pt-BR.json`, atualizar o bloco `lead`:

```json
  "lead": {
    "priority": "Prioridade",
    "status": "Status",
    "reason": "Motivo",
    "expected_value": "Valor esperado",
    "view_customer": "Ver cliente",
    "call": "Ligar",
    "message": "Enviar WhatsApp",
    "section": {
      "reason": "Por que este lead",
      "value": "Pipeline esperado",
      "created": "Criado"
    },
    "actions": {
      "call": "Ligar",
      "message": "Mensagem",
      "mark_contacted": "Marcar contato"
    },
    "not_found": "Lead não encontrado"
  },
```

Em `i18n/en.json`:

```json
  "lead": {
    "priority": "Priority",
    "status": "Status",
    "reason": "Reason",
    "expected_value": "Expected value",
    "view_customer": "View customer",
    "call": "Call",
    "message": "Send WhatsApp",
    "section": {
      "reason": "Why this lead",
      "value": "Expected pipeline",
      "created": "Created"
    },
    "actions": {
      "call": "Call",
      "message": "Message",
      "mark_contacted": "Mark contacted"
    },
    "not_found": "Lead not found"
  },
```

- [ ] **Step 2: Substituir o conteúdo de `app/lead/[id].tsx`**

```tsx
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast, type ToastVariant } from "@/components/ui/Toast";
import { useTheme } from "@/context/ThemeContext";
import { haptic } from "@/lib/haptics";
import { api, ApiError, type Lead } from "@/lib/api";
import { formatRelativeTime } from "@/lib/relative-time";
import {
  leadPriorityPalette,
  leadStatusPalette,
  radius,
  spacing,
  typography,
  type ThemeColors,
} from "@/lib/theme";

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: "", variant: "info" });

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      // Placeholder: API da Sprint 1 nao expoe GET lead por id.
      // Swap pra api.getLead(id) quando o endpoint singular existir.
      const all = await api.listLeads({ limit: 200 });
      setLead(all.find((l) => l.id === id) ?? null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("home.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  function onComingSoonAction(actionKey: string) {
    haptic.medium();
    setToast({
      visible: true,
      message: `${t(actionKey)}: ${t("common.coming_soon")}`,
      variant: "info",
    });
  }

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.scroll}>
          <Skeleton width={240} height={28} borderRadius={radius.sm} />
          <View style={styles.skeletonRow}>
            <Skeleton width={84} height={28} borderRadius={radius.sm} />
            <Skeleton width={84} height={28} borderRadius={radius.sm} />
          </View>
          <Skeleton width="100%" height={80} borderRadius={radius.lg} />
          <Skeleton width="100%" height={120} borderRadius={radius.lg} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing["3xl"] }]}>
        <ErrorBanner message={error} onRetry={() => void load()} />
      </View>
    );
  }

  if (!lead) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.muted}>{t("lead.not_found")}</Text>
      </View>
    );
  }

  const priority = leadPriorityPalette[lead.priority];
  const status = leadStatusPalette[lead.status];
  const relativeTime = formatRelativeTime(lead.created_at, t);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 96 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.vin} numberOfLines={1}>
          {lead.vin ?? "—"}
        </Text>

        <View style={styles.badgesRow}>
          <View style={[styles.badge, { backgroundColor: priority.bg, borderColor: priority.border }]}>
            <Text style={[styles.badgeLabel, { color: priority.color }]}>
              {t(priority.labelKey)}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: status.bg, borderColor: status.border }]}>
            <Text style={[styles.badgeLabel, { color: status.color }]}>
              {t(status.labelKey)}
            </Text>
          </View>
        </View>

        {lead.reason ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t("lead.section.reason")}</Text>
            <Text style={styles.sectionBody}>{lead.reason}</Text>
          </View>
        ) : null}

        {lead.expected_value_brl != null ? (
          <Card style={styles.valueCard}>
            <Text style={styles.sectionLabel}>{t("lead.section.value")}</Text>
            <Text style={styles.valueBig}>{formatBRL(lead.expected_value_brl)}</Text>
            {relativeTime ? (
              <Text style={styles.created}>
                {t("lead.section.created")}: {relativeTime}
              </Text>
            ) : null}
          </Card>
        ) : null}
      </ScrollView>

      {/* Footer fixo com 3 acoes (stubs por enquanto) */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <FooterAction
          icon="call-outline"
          label={t("lead.actions.call")}
          onPress={() => onComingSoonAction("lead.actions.call")}
          colors={colors}
          styles={styles}
        />
        <FooterAction
          icon="chatbubble-ellipses-outline"
          label={t("lead.actions.message")}
          onPress={() => onComingSoonAction("lead.actions.message")}
          colors={colors}
          styles={styles}
        />
        <FooterAction
          icon="checkmark-circle-outline"
          label={t("lead.actions.mark_contacted")}
          onPress={() => onComingSoonAction("lead.actions.mark_contacted")}
          colors={colors}
          styles={styles}
        />
      </View>

      <Toast
        message={toast.message}
        variant={toast.variant}
        visible={toast.visible}
        onHide={() => setToast((p) => ({ ...p, visible: false }))}
      />
    </View>
  );
}

type FooterActionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
};

function FooterAction({ icon, label, onPress, colors, styles }: FooterActionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.footerBtn, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={styles.footerBtnLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    scroll: {
      padding: spacing.xl,
      gap: spacing.lg,
    },
    vin: {
      ...typography.mono,
      fontSize: 22,
      color: c.text,
      fontWeight: "700",
      letterSpacing: -0.2,
    },
    badgesRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    badge: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.sm,
      borderWidth: 1,
    },
    badgeLabel: {
      ...typography.label,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    section: {
      gap: spacing.sm,
    },
    sectionLabel: {
      ...typography.label,
      color: c.textMuted,
      textTransform: "uppercase",
    },
    sectionBody: {
      ...typography.body,
      color: c.text,
    },
    valueCard: {
      gap: spacing.sm,
    },
    valueBig: {
      ...typography.mono,
      fontSize: 32,
      color: c.primary,
      fontWeight: "800",
      letterSpacing: -0.4,
    },
    created: {
      ...typography.caption,
      color: c.textSubtle,
    },
    footer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: "row",
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      backgroundColor: c.surface,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    footerBtn: {
      flex: 1,
      minHeight: 56,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      backgroundColor: c.primarySoft,
    },
    footerBtnLabel: {
      ...typography.caption,
      fontWeight: "700",
      color: c.primary,
    },
    skeletonRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    muted: { ...typography.body, color: c.textMuted },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.bg,
    },
  });
}
```

- [ ] **Step 3: Verificar typecheck e lint**

```bash
npm run typecheck && npm run lint
```
Expected: ambos exit 0.

- [ ] **Step 4: Smoke test**

```bash
npm run web
```

Em /leads tap em qualquer lead pra abrir o detail:
- Header (vem do Stack) com back arrow
- VIN grande em mono no topo
- Linha com 2 badges (Priority + Status) usando as palette corretas
- Seção "Por que este lead" com motivo (se houver)
- Card "Pipeline esperado" com valor enorme em mono primary + idade do lead
- Footer fixo com 3 botões: Ligar / Mensagem / Marcar contato
- Cada botão dispara haptic medium + toast "Em breve"
- Loading: skeleton da estrutura
- Erro: ErrorBanner com retry

Light + dark.

Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add app/lead/\[id\].tsx i18n/pt-BR.json i18n/en.json
git commit -m "feat(lead-detail): redesign with sections, fixed action footer, skeleton, ErrorBanner

- VIN displayed prominently in mono at top (was inside Card)
- Priority + Status badges use leadPriorityPalette / leadStatusPalette properly
- 'Why this lead' section with proper label/body hierarchy
- 'Expected pipeline' card with big mono value + relative created_at
- Fixed bottom footer with 3 large action buttons (Call / Message / Mark contacted)
  All currently stub to a 'coming soon' toast — wired up for when actions exist
- Loading state shows skeleton matching the structure (was '...')
- Error state shows ErrorBanner with retry (was plain red text)
- Not-found state has a proper message instead of bare ellipsis

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 8 — Tab layout polish

### Task 14: Tab bar — ícones outline → filled ao selecionar

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Ler o estado atual e diff necessário**

```bash
cat app/\(tabs\)/_layout.tsx
```

Se o arquivo usar `Tabs` do `expo-router` com `tabBarIcon`, basta condicionar o nome do ícone em função de `focused`. Substituir o conteúdo conforme abaixo (este é o padrão idiomático Expo Router 55):

```tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/context/ThemeContext";

type TabIconKey = "index" | "leads" | "profile";

const ICONS: Record<TabIconKey, { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
  index: { focused: "home", unfocused: "home-outline" },
  leads: { focused: "briefcase", unfocused: "briefcase-outline" },
  profile: { focused: "person-circle", unfocused: "person-circle-outline" },
};

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? ICONS.index.focused : ICONS.index.unfocused} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: t("tabs.leads"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? ICONS.leads.focused : ICONS.leads.unfocused} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? ICONS.profile.focused : ICONS.profile.unfocused} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

> **Se o arquivo atual tiver estrutura significativamente diferente** (algum padrão custom de tab bar), preservar a estrutura e aplicar só o padrão `focused ? "icon" : "icon-outline"` em cada `tabBarIcon`. Não reescrever lógica fora desse escopo.

- [ ] **Step 2: Verificar typecheck e lint**

```bash
npm run typecheck && npm run lint
```
Expected: ambos exit 0.

- [ ] **Step 3: Smoke test**

```bash
npm run web
```

Esperado:
- Tab bar visível com 3 ícones (Home / Leads / Profile)
- Tab selecionada: ícone filled, cor primary
- Tabs não-selecionadas: ícone outline, cor textMuted
- Trocar de tab visualmente troca o fill

Light + dark.

Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add app/\(tabs\)/_layout.tsx
git commit -m "feat(tabs): outline to filled icon transition on tab selection

Active tab uses filled Ionicon (home, briefcase, person-circle); inactive
tab uses *-outline variant. Color follows existing primary/textMuted
scheme. Subtle but cleanly distinguishes selection state.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 9 — Verification + PR

### Task 15: Verificação completa

**Files:** nenhum (apenas commands)

- [ ] **Step 1: Typecheck final**

```bash
npm run typecheck
```
Expected: exit 0.

- [ ] **Step 2: Lint final**

```bash
npm run lint
```
Expected: exit 0.

- [ ] **Step 3: Smoke test fluxo completo no web**

```bash
npm run web
```

Roteiro:
1. **Intro:** ver vídeo tocando (ou fallback de 6s no web se autoplay bloquear) → vai pra login
2. **Login (light):** marca FORD tipográfica + título + subtitle, animação de entrada (fade+scale)
3. **Login: tap em "Esqueci minha senha"** → toast "Em breve"
4. **Login: submeter senha errada** → shake + haptic error + banner vermelho
5. **Login: submeter credenciais corretas** → navega pra Home
6. **Home:** ScreenHeader "Hoje" + greeting com hora ("Bom dia, X") + hero KPI com 2 números em mono + top 5 LeadCards com stripe colorida + "Ver todos N leads" se houver mais que 5
7. **Home: pull-to-refresh** → tint primary, recarrega
8. **Home: tap em LeadCard** → leve scale + navega pra detail
9. **Lead detail:** VIN em mono + 2 badges palette correta + seção razão + card valor enorme em mono + footer fixo 3 ações
10. **Lead detail: tap em cada ação** → haptic medium + toast "Em breve"
11. **Lead detail: voltar** → tab bar visível de novo
12. **Tab Leads:** ScreenHeader "Leads / {N} ativos" + busca + 4 chips
13. **Leads: digitar busca** → filtro client-side; vazio mostra empty "Nada encontrado para 'X'"
14. **Leads: trocar chips** → haptic selection
15. **Tab Profile:** ScreenHeader "Perfil" + user card consolidado + SettingRow para tema (com Switch) + SettingRow para idioma (tap abre picker) + botão ghost "Sair"
16. **Profile: toggle tema** → haptic + transição cross-fade entre light/dark
17. **Profile: refazer todo o roteiro em dark mode** (a partir do passo 6)
18. **Profile: trocar locale pra EN no LocalePicker** → revisitar Home / Leads / Detail confirmando textos em inglês
19. **Profile: tap em Sair** → haptic medium + volta pro login

- [ ] **Step 4: Marcar success criteria**

Comparar com seção 8 do spec (`docs/superpowers/specs/2026-05-23-mobile-polish-design.md`). Para cada item:
- [ ] `npm run typecheck` zero erros
- [ ] `npm run lint` zero warnings novos
- [ ] Todas as 5 telas têm os 5 estados implementados (loading skeleton, empty com CTA, content, error com retry, refreshing)
- [ ] Toda Pressable tem haptic apropriado
- [ ] Touch targets ≥ 44pt (auditar visualmente)
- [ ] Light + dark mode coerentes em todas as telas
- [ ] PT-BR + EN funcionam, sem chaves faltantes
- [ ] Intro roda em web (com fallback timeout funcional)
- [ ] Hero stat, valores e VINs em mono
- [ ] LeadCard mostra priority com left-border + chip
- [ ] Botões de ação no lead detail no rodapé fixo
- [ ] Nenhum emoji decorativo em UI

- [ ] **Step 5: Commit de marker se houver micro-ajustes**

Se durante o smoke test você ajustar tamanhos / paddings, fazer commit final:

```bash
git add -A
git commit -m "polish: micro-adjustments after manual QA pass

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

Se nada foi ajustado, pular este step.

---

### Task 16: Push da branch e abrir PR

**Files:** nenhum

- [ ] **Step 1: Push da branch**

```bash
git push -u origin feat/polish-design-system
```

Expected: branch criada no remote, link de PR sugerido na saída.

- [ ] **Step 2: Verificar log final antes do PR**

```bash
git log --oneline main..HEAD
```

Expected: ~15 commits limpos, cada um descrevendo uma mudança coesa.

- [ ] **Step 3: Abrir PR via gh CLI**

```bash
gh pr create --title "feat: polish + UX rewrite of mobile screens (Design DNA)" --body "$(cat <<'EOF'
## Summary

Refino visual + UX completo das 5 telas existentes do forward-mobile, aplicando o Design DNA sintetizado dos 12 vídeos UX/UI do guia. Posição tomada: **Linear+Vercel base, Duolingo só em vitória legítima**. Inclui fix do bug do autoplay do intro no web.

Spec: [docs/superpowers/specs/2026-05-23-mobile-polish-design.md](docs/superpowers/specs/2026-05-23-mobile-polish-design.md)
Plan: [docs/superpowers/plans/2026-05-23-mobile-polish-design.md](docs/superpowers/plans/2026-05-23-mobile-polish-design.md)

### Foundation
- `theme.ts` ganha `typography.mono` + `typography.monoSmall`, letter-spacing em h1/h2, semantic elevation aliases (card/sheet/popover)

### Components novos
- `ScreenHeader` — header padrão para tabs
- `ErrorBanner` — inline error com retry, substitui `<Text style={error}>` em todo lugar
- `LeadCardSkeleton` — placeholder da forma do LeadCard novo
- `PhotoButton` — extraído do inline em profile.tsx
- `lib/relative-time.ts` — formatador "há X dias / agora / DD/MM"

### LeadCard rewrite
- Stripe colorida à esquerda por priority
- Chip uppercase em vez de Badge monocromática
- VIN em mono semibold
- Status como dot colorido + label (mais discreto)
- Valor em mono primary
- Pressable inteiro com haptic + scale spring

### Screens
- **Login:** brand 'FORD' tipográfico + footer "Esqueci minha senha" + scale-in
- **Home:** ScreenHeader + greeting com hora + hero KPI card (2 métricas mono) + top 5 + "Ver todos"
- **Leads:** ScreenHeader + busca + 4 filter chips + skeleton + RefreshControl
- **Profile:** ScreenHeader + user card consolidado + SettingRow (theme + locale) + ghost sign out
- **Lead detail:** sections (status / reason / value) + footer fixo de ações + skeleton + ErrorBanner

### Bug fix
- IntroVideo: web autoplay corrigido (play() em useEffect, playsInline, fallback timeout 6s)

### Tabs
- Ícones outline → filled ao selecionar

## Test plan

- [ ] Manual smoke test em \`npm run web\` cobrindo o fluxo completo (login → home → detail → leads → profile → sign out)
- [ ] Light + dark mode verificados em todas as telas
- [ ] PT-BR + EN verificados (LocalePicker funcional)
- [ ] \`npm run typecheck\` zero erros
- [ ] \`npm run lint\` zero warnings novos
- [ ] Intro roda em web (com fallback de 6s se autoplay bloqueado)
- [ ] iOS sim + Android sim (manual, se disponível)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: URL do PR retornada.

- [ ] **Step 4: Confirmar URL do PR**

A saída do `gh pr create` traz a URL completa. Compartilhar com o time.

---

## Resumo de tarefas

| # | Task | Estimativa |
|---|---|---|
| 1 | Foundation: theme.ts (mono + letter-spacing + elevation aliases) | 30 min |
| 2 | Intro web autoplay fix | 15 min |
| 3 | `lib/relative-time.ts` | 30 min |
| 4 | `ScreenHeader` | 20 min |
| 5 | `ErrorBanner` | 30 min |
| 6 | `LeadCardSkeleton` | 20 min |
| 7 | Extract `PhotoButton` | 20 min |
| 8 | `LeadCard` rewrite | 1h |
| 9 | Login refactor | 45 min |
| 10 | Home refactor | 1h |
| 11 | Leads refactor | 1h |
| 12 | Profile refactor | 45 min |
| 13 | Lead detail refactor | 1h |
| 14 | Tab bar icon polish | 15 min |
| 15 | Verification | 1h |
| 16 | PR open | 10 min |
| **Total** | | **~9h** |

---

## Notas finais

- **Branch:** todos os commits vão pra `feat/polish-design-system` (já criada).
- **Test runner:** ausente. Verificação por typecheck + lint + smoke manual.
- **Windows shells:** caminhos com `(tabs)` precisam de escape (`'app/(tabs)/file'` no PowerShell, ou `app/\(tabs\)/file` no bash).
- **Commits pequenos:** cada Task = 1 commit, exceto Task 15 que pode terminar sem commit se nada precisar de ajuste.
- **i18n:** chaves adicionadas em pt-BR e en simultaneamente a cada task que precisa. Não há task separada de i18n.
- **TODO conhecido:** API ainda não expõe `GET /leads/{id}` singular (comentado em `lead/[id].tsx`). Quando existir, swap trivial.
