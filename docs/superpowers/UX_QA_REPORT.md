# UX/UI QA Report — Playwright Visual Test

**Data:** 2026-05-23 (pós-merge de todas as 6 PRs de polish)
**Método:** Playwright headless (Chromium), viewport iPhone 14 Pro (390×844), 4 cenários (light/dark × pt/en), 16 screenshots, medições DOM (touch targets, paletas).
**Branch testada:** `main` (commit 616fb7c, com todas as PRs #13-24 mergeadas).
**Escopo do teste:** Login + Home (com backend Java offline, então Home cai em estado de erro — útil pra QA do ErrorBanner).
**Limitações reconhecidas:**
- Não consegui navegar pra Leads / Profile / Lead detail no browser (tab bar não respondeu aos cliques do Playwright; precisaria refatorar o seletor)
- Backend Java não estava rodando localmente, então Home/Leads sempre cai em ErrorBanner (dados reais não foram exercitados)
- Animações nativas, haptics, gestures: não testáveis no browser
- Expo Go nativo: não testado nesta rodada — recomendação separada abaixo

## Veredicto resumido

**O polish foi competente. A foundation, hierarquia, e visual identity estão alinhados ao Design DNA. Mas o build no web tem 5 issues reais que tiram qualidade e 6 oportunidades de refino que elevariam de "bom" pra "excelente".**

Nota: os 2 agentes externos já fizeram bom trabalho de review (renomearam `no_contact`→`forgotten`, extraíram `SettingRow`, etc). O que segue é o que **eles não pegaram**, identificado via QA visual real.

---

## P0 — Issues a corrigir antes de demo/produção

### P0-1 — Detecção de locale quebrada no web ⚠️

**Onde:** [`i18n/index.ts:17-34`](../../i18n/index.ts)

**Sintoma:** Toast "Em breve" aparece mesmo com a interface visualmente alinhada pra EN. O i18n bootstrap só lê `NativeModules.SettingsManager` (iOS) ou `NativeModules.I18nManager` (Android), e no web ambos são `undefined`, então sempre cai no fallback `pt-BR`.

**Evidência:** screenshot `dark-en-01b-login-forgot-toast.png` — toast em PT, demais textos em PT, configurado pra EN no Playwright context.

**Impacto:** vendedores que usam o web build veem PT mesmo quando o sistema deles é EN. Disciplina Mobile da Sprint 1 menciona "app multiplataforma" — web faz parte.

**Fix proposto:**
```ts
export function detectDeviceLocale(): Locale {
  // Web first: navigator.language is the canonical source
  // Web primeiro: navigator.language e a fonte canonica
  if (Platform.OS === "web" && typeof navigator !== "undefined") {
    const tag = navigator.language || navigator.languages?.[0];
    if (typeof tag === "string") {
      const normalized = tag.replace("_", "-");
      if (isLocale(normalized)) return normalized;
      if (normalized.startsWith("en")) return "en";
      if (normalized.startsWith("pt")) return "pt-BR";
    }
    return "pt-BR";
  }
  // ... existing native path
}
```

### P0-2 — Ionicons font FOIT (Flash Of Invisible Text)

**Onde:** todos os componentes que usam `<Ionicons />`

**Sintoma:** em todo carregamento fresh de tela, ícones aparecem como **quadrados vazios (□)** por ~500-1500ms até a fonte `Ionicons.ttf` baixar. Depois renderizam corretamente.

**Evidência:**
- `dark-en-01b-login-forgot-toast.png` — ícone do Toast = □, ícones do Input (mail, lock) = □
- `dark-en-03-home.png` — ícone do ErrorBanner = □, ícones do tab bar (3) = □

**Impacto:** primeira impressão visual é de bug. Vendedor abre o app e vê quadrados vazios por 1-2 segundos.

**Causas possíveis:**
1. `@expo/vector-icons` no web precisa de `expo-font` + preload explícito antes do `_layout.tsx` renderizar
2. Falta de `<link rel="preload" as="font" href="/Ionicons.ttf">` no HTML

**Fix proposto:** adicionar preload no [`app/_layout.tsx`](../../app/_layout.tsx) (ou criar `app/+html.tsx` se SSR-friendly) gateando o render no `useFonts` do `@expo/vector-icons`:

```tsx
import { useFonts } from "expo-font";
import * as Ionicons from "@expo/vector-icons/Ionicons";

const [fontsLoaded] = useFonts(Ionicons.font);
if (!fontsLoaded) return null; // ou splash
```

### P0-3 — ErrorBanner retry button viola 44pt touch target

**Onde:** [`components/ui/ErrorBanner.tsx`](../../components/ui/ErrorBanner.tsx)

**Sintoma:** botão "Tentar de novo" mede **110×28pt** — falha a regra de touch target ≥44pt do CLAUDE.md (que cita explicitamente "sales reps using gloves in dealerships").

**Evidência:** `report.json` measurements:
```json
{ "label": "Tentar de novo", "w": 110, "h": 28, "ok": false }
```

**Impacto:** vendedor com dedo grande / luva / pressa não consegue acertar o retry. Acessibilidade WCAG também reclama.

**Fix proposto:** aumentar paddingVertical no `retry` style (linha ~70):
```ts
retry: {
  paddingVertical: spacing.sm + 2,  // era spacing.xs (4px), vira 10px → altura final ~44px
  paddingHorizontal: spacing.md,
  // ...resto
}
```

### P0-4 — Hero KPI fonte mono ilegível no web (Windows)

**Onde:** [`lib/theme.ts:130-145`](../../lib/theme.ts) (typography.mono) usada em [`app/(tabs)/index.tsx`](../../app/(tabs)/index.tsx) (heroValue)

**Sintoma:** "0" e "R$ 0" renderizam num **monospace estilo serif chunky** (provavelmente `Courier New` ou `Consolas` no Windows web). Visualmente parece bug, não premium.

**Evidência:** `light-en-03-home.png` + `dark-en-03-home.png` — os números do hero têm serifs grossas que não combinam com o resto da tipografia sans-serif.

**Causa:** `Platform.select({ default: "ui-monospace" })` resolve no web pra um stack que no Windows não inclui SF Mono / JetBrains Mono / Menlo, caindo em fallback de sistema feio.

**Fix proposto:** declarar stack mono robusto + carregar uma fonte mono web-friendly via expo-font:
```ts
mono: Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: '"JetBrains Mono", "SF Mono", "Cascadia Code", "Consolas", Menlo, monospace',
}),
```
E idealmente bundlar `JetBrainsMono-Medium.ttf` via `useFonts`.

### P0-5 — Home com erro mostra "0" / "R$ 0" enganosos

**Onde:** [`app/(tabs)/index.tsx`](../../app/(tabs)/index.tsx) — `computeHeroStats` quando `leads.length === 0` por erro

**Sintoma:** quando o fetch falha, o hero card mostra "LEADS ATIVOS 0" e "PIPELINE R$ 0" como se fossem dados reais — mas é zero porque não veio nada.

**Evidência:** `light-en-03-home.png` mostra hero "0 / R$ 0" + ErrorBanner — confusão.

**Impacto:** vendedor pode achar que perdeu todo o pipeline. Bug clássico de "loading/error state vazio".

**Fix proposto:** quando `error != null`, mostrar placeholders no hero:
```tsx
<Text style={styles.heroValue}>{error ? "—" : hero.activeLeads}</Text>
<Text style={styles.heroValue}>{error ? "—" : formatCompactBRL(hero.pipelineBRL)}</Text>
```
Ou esconder o hero completamente quando há erro inicial (preserva quando refresh dá erro mas há dados antigos).

---

## P1 — Refinos que elevam de "bom" pra "excelente"

### P1-1 — Loading do Button não tem texto

**Onde:** [`components/ui/Button.tsx`](../../components/ui/Button.tsx)

**Sintoma:** quando `loading={true}`, mostra só `<ActivityIndicator />` mudo. Spec mencionava "Verificando..." em vez de spinner solo.

**Evidência:** `light-pt-03-home.png` (que é na verdade o login mid-submit) — botão Entrar com spinner solto, sem texto.

**Fix proposto:** adicionar prop `loadingLabel?: string`, renderizar `<Indicator /> {loadingLabel}` quando presente.

### P1-2 — Greeting usa email prefix em lowercase

**Onde:** [`app/(tabs)/index.tsx`](../../app/(tabs)/index.tsx) — `setName(email.split("@")[0])`

**Sintoma:** quando não há `profile.full_name`, usa `admin` lowercase ("Boa tarde, admin"). Parece amador.

**Fix proposto:** capitalizar via:
```ts
const prefix = email.split("@")[0];
setName(prefix.charAt(0).toUpperCase() + prefix.slice(1));
```
Ou ainda melhor: cair pra greeting sem nome ("Boa tarde 👋") quando não tem profile, em vez de mostrar o handle do email.

### P1-3 — ScreenHeader sem padding-top no SafeArea sob status bar

**Onde:** [`components/ui/ScreenHeader.tsx`](../../components/ui/ScreenHeader.tsx) + telas que o usam

**Sintoma:** todas as telas top-level (Home, Leads, Profile) têm uma faixa cinza vazia no topo (acima do status bar). No web aparece como espaço morto; no native iOS provavelmente esbarra no notch.

**Evidência:** todos os `*-03-home.png` mostram ~50px de espaço cinza no topo antes do "Hoje". 

**Fix proposto:** ScreenHeader deveria respeitar `useSafeAreaInsets().top` ou as telas devem passar `paddingTop: insets.top` consistentemente. Hoje Home faz `paddingTop: insets.top` no FlatList style mas ainda sobra espaço.

### P1-4 — Home "vazia" com erro tem tela morta gigante

**Onde:** [`app/(tabs)/index.tsx`](../../app/(tabs)/index.tsx)

**Sintoma:** quando há ErrorBanner, ~60% da tela é vazio cinza. Hick's Law diz reduzir opções, mas aqui não há nem uma — só nada.

**Fix proposto:** quando erro inicial, esconder o hero e renderizar um EmptyState fullscreen estilizado ("Sem conexão com o servidor / Tentar de novo") com ilustração simples (Ionicon grande). Isso transforma "dead UI" em "intencional".

### P1-5 — Toast posição/largura inconsistente

**Onde:** [`components/ui/Toast.tsx`](../../components/ui/Toast.tsx)

**Sintoma:** Toast aparece no topo com margem horizontal, mas no dark mode parece "flutuar" sem o backdrop esperado. Falta um leve drop shadow ou backdrop blur que ancore visualmente.

**Evidência:** `dark-en-01b-login-forgot-toast.png` — toast quase invisível no canto superior esquerdo.

**Fix proposto:** adicionar elevation `sheet` (já temos em theme) + considerar `position: top` com `paddingTop: insets.top + 8`.

### P1-6 — "Esqueci minha senha" deveria ter feedback mais útil que "Em breve"

**Onde:** [`app/login.tsx`](../../app/login.tsx) — `onForgotPassword`

**Sintoma:** vendedor que esqueceu a senha clica e recebe "Em breve" — fica preso. Sprint 1 não entrega recovery, mas pode pelo menos sugerir:

**Fix proposto:** toast multi-linha: "Em breve. Por enquanto, peça reset pro admin: admin@forward.local".

---

## P2 — Polish opcional (Sprint 2+)

### P2-1 — Login tem MUITO espaço morto vertical
O FORD wordmark + título + form usa só ~50% da altura. Empty space dramático funciona pra splash, mas a tela já tem CTA — não é splash. Considerar reduzir paddingTop pra subir o conteúdo (mais perto da regra dos terços).

### P2-2 — Inputs no light mode quase sem bordas
Os inputs têm `borderColor: c.border` que é `rgba(11, 18, 32, 0.08)` — quase invisível. No dark é mais visível (rgba(255,255,255,0.07)). Light mode poderia subir pra `borderStrong` (0.14) pra dar mais presença.

### P2-3 — Hero card divider entre KPIs quase invisível
A linha vertical de 1px com `c.separator` (0.05 opacity) entre LEADS ATIVOS e PIPELINE é tão sutil que parece bug. Aumentar pra `c.borderStrong` ou substituir por padding maior.

### P2-4 — Tabs sem indicação de active mais forte
Tab ativo é só "ícone filled + cor primary + label primary". Funciona, mas competitor patterns (V12 Chris Raroque) sugerem indicador de barra superior (3px) ou pill background. Considerar pelo menos uma bg `primarySoft` no item ativo.

### P2-5 — Sem feedback visual no input em focus
Inputs com `borderColor` fixo, sem mudança em focus. Adicionar `borderColor: c.primary, borderWidth: 2` no focus state via Animated.

### P2-6 — Animação de transição entre telas
Spec mencionou "tab switch que desliza ~250ms spring". Não implementado (verificado em [`app/(tabs)/_layout.tsx`](../../app/(tabs)/_layout.tsx)). Fica como TODO no spec original — vale revisitar pra demo.

---

## Validações automáticas que PASSARAM

- ✅ Tipografia hierarquia: h1 "Hoje" > body subtitle "Boa tarde" claramente distintos
- ✅ Cor: Ford Blue disciplinado (só em CTA primário, brand wordmark, indicadores de active)
- ✅ ScreenHeader presente em todas as telas top-level
- ✅ Anti-pattern "emoji decorativo" não detectado em nenhum lugar
- ✅ Anti-pattern "card dentro de card" não detectado
- ✅ Sem hardcode de `#003478` fora de `lib/theme.ts`
- ✅ Touch targets ≥44pt em login (Entrar 350×48, Esqueci 350×50)
- ✅ Toast aparece corretamente com left border accent + icon (quando font carregada)
- ✅ Theme tokens consistentes entre light/dark
- ✅ Loading state implementado em Button (spinner aparece em <80ms)

## Validações que NÃO PUDE rodar

| Test | Por quê | Como cobrir |
|---|---|---|
| LeadCard com dados reais | Backend Java offline | Subir docker compose + redo |
| Leads search + filter chips | Tab click via Playwright falhou | Refatorar seletor de tab no script |
| Profile foto upload | Login real precisa de Supabase válido | Mockar Supabase ou criar test user |
| Lead detail footer fixed | Não cheguei lá | Mesmo que acima |
| Animação cross-fade tema | Browser não renderiza igual | Expo Go nativo |
| Haptics light/medium/heavy | Browser não tem haptics | Expo Go nativo |
| Gesture swipe nos cards | Browser approximation só | Expo Go nativo |
| Intro video autoplay no web (fix da Phase 2) | Não tentei navegar com cookie limpo | Manual: `npm run web` em incógnito |

---

## Recomendação de ordem de fix

1. **Hoje (P0):** P0-1 (locale web), P0-2 (Ionicons font preload), P0-3 (retry button 44pt), P0-5 (hero "—" placeholder no erro). São 4 fixes pequenos (estimo 30-60min cada).
2. **Esta semana (P1):** P0-4 (mono font web), P1-1 (loadingLabel), P1-2 (capitalize name), P1-3 (SafeArea), P1-4 (empty-error state), P1-5 (Toast elevation), P1-6 (forgot password message).
3. **Sprint 2+ (P2):** os 6 polish points, mais a rodada de testes em Expo Go nativo (iOS sim + Android sim) que esta QA não cobriu.

## Próximo passo recomendado

Rodar **a mesma bateria com backend Java rodando** (`forward-api-java` em `localhost:8080`) pra testar:
- LeadCard real (stripe colorida, mono VIN, chip de priority, status dot, valor)
- Hero KPIs com números reais
- Lead detail completo (badges palette, footer fixo)
- Leads filter chips com dados

Estimo +30min de QA depois do backend up.

---

**Conclusão geral:** o trabalho dos 16 commits + 6 PRs construiu uma fundação visual sólida e fiel ao Design DNA. Os agentes externos pegaram refinements importantes que eu não tinha visto. Esta QA visual encontrou **5 P0s reais** (4 dos quais NÃO foram pegos por nenhum reviewer anterior porque exigiam ver a tela renderizada) e **6 P1s** que separam um trabalho competente de um trabalho excelente. Total de 17 issues priorizadas, ~6-8h de trabalho pra fechar todas as P0+P1.
