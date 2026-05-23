# Spec: Polish visual + UX do forward-mobile

**Data:** 2026-05-23
**Status:** Aguardando aprovação do Jota
**Escopo:** Frente 1 de 4 do refino do forward-mobile (polish + UX das telas existentes). Fase 5 (onboarding+dealer), Fase 6 (offline-resilient) e features novas ficam em specs separadas.
**Branch alvo:** `feat/polish-design-system` (a partir de `main`)

---

## 1. Contexto

### 1.1 Estado de `main` em 2026-05-23

O forward-mobile já tem foundation sólida mergeada (PRs #10/#11/#12):

- **Theme system** light/dark com cross-fade, semantic tokens em `lib/theme.ts`, `useColorScheme()` + override persistido
- **11 UI primitives:** Badge, Button, Card, EmptyState, Input, IntroVideo, LoadingScreen, LocalePicker, ProfileAvatar, Skeleton, Toast
- **Hooks:** useShake, useFadeIn, haptics (light/medium/heavy/success/warning/error/selection)
- **i18n** PT-BR/EN com picker
- **Auth + photo upload** funcionais (Supabase)
- **Lead palette** completa: `leadStatusPalette`, `leadPriorityPalette`, `churnSegmentPalette`

5 telas existem e são funcionais ponta-a-ponta: `login`, `(tabs)/index` (Home), `(tabs)/leads`, `(tabs)/profile`, `lead/[id]`.

### 1.2 Diagnóstico — onde está cru

Auditoria das 5 telas + LeadCard:

| Tela | Estado |
|---|---|
| **login** | Bom. Tem fade-in, shake, haptics, validation, server error box. Falta marca Ford (sem logo) e respiração emocional (V4). |
| **Home** | Crua. Título "Today's leads" como `<Text>` solto, sem greeting, sem KPI, sem skeleton de loading, erro como texto vermelho simples. |
| **Leads** | Mais crua que Home. Sem header sequer. Mesma listagem da Home, sem busca, sem filtros. Duplicação evidente. |
| **Profile** | Funcional, mas duas seções (avatar+user + photo buttons) competem; locale row e theme card têm padrões visuais quase iguais; subcomponente `PhotoButton` inline (vale extrair). |
| **Lead detail** | Mínimo. TODO conhecido (`API da Sprint 1 nao expoe GET lead por id` — `listLeads` + find). Card único com VIN + 2 badges + reason + valor. Sem ações (call/message/marcar contato), sem timeline, sem cliente/veículo, sem score. Erro = `<Text>` simples. Loading = "..." |
| **LeadCard** | Mostra só VIN + priority + reason + status + value. Não usa `leadStatusPalette` recém-criada (tone="textMuted" hardcoded). Sem indicador visual de urgência. Sem idade do lead. |

### 1.3 Bug do intro (V8 do guia diz "todo estado precisa funcionar")

Bug confirmado em `components/ui/IntroVideo.tsx:33-37`:

- `p.play()` é chamado dentro do callback de `useVideoPlayer`, que roda *durante* o render
- No web (`expo-video@55.0.15`), `_mountedVideos` ainda está vazio nesse momento — `play()` itera Set vazio e nada acontece
- No nativo a implementação retém o "play pending"; no web não
- Bônus: `playsInline` não é passado, várias engines web bloqueiam autoplay sem ele
- Resultado: `<video>` monta com src, pinta primeiro frame, congela

Fix entra como seção 7 deste spec.

---

## 2. Design DNA (síntese do `UX-UI_GUIDE.txt`)

Quatro camadas com posição tomada nas tensões entre os 12 vídeos.

### 2.1 Foundation — regras pinadas em `lib/theme.ts`

| Token | Decisão | Origem |
|---|---|---|
| **Type sizes** | 4 tamanhos efetivos (`h1=28`, `h2=22`, `h3=18`, `body=16`/`caption=13`) + mono para números (R$, score, VIN) | V2-sênior, V5, V8 |
| **Type weights** | 2 pesos canônicos (regular 400, semibold 600). `extrabold` reservado a `h1` da tela. | V5, V2 |
| **Line-height** | 1.2x em headings (já está: 34/28/24), 1.4x body (16→22, já está) | V5 |
| **Letter-spacing** | -0.4px em h1/h2 (não temos hoje, adicionar) | V5 |
| **Spacing** | 4pt grid (já está). Regras de relacionamento: 16 entre elementos relacionados, 32 entre grupos, 48+ entre seções. | V2, V3, V5, V8 |
| **Color** | 60/30/10 com Ford Blue disciplinado em CTA + branding. Hierarquia de texto por opacidade (`text` 100%, `textMuted` ~70%, `textSubtle` ~50%). | V2, V3, V8 |
| **Semantic** | `success` verde, `warning` âmbar, `critical` vermelho, `error` magenta. Já existem em theme — usar **apenas** com significado real. | V8 |
| **Icons** | Ionicons (já adotado). `*-outline` em estado inativo, sem sufixo em ativo. Tamanho casa com line-height do texto adjacente. | V6, V8, V12 |
| **Elevation** | 3 níveis canônicos: `card` = sm/md, `sheet` = lg, `popover` = primary. Já temos `elevationLight/Dark` separadas. | V8 |

### 2.2 Behavior — como o app se move

- **Uma tela, um propósito** (V9). Ações contextuais vão em bottom sheets, não em flyouts/popovers.
- **Touch targets ≥ 44pt** (V1 Fitts, CLAUDE.md). Auditar badges, chevrons, ícones de ação clicáveis.
- **Por seção, uma direção** (V9). Em mobile, lista vertical OU carrossel horizontal — nunca grid 2D.
- **Hick** (V1). Filtros: 3-4 chips na primeira linha, resto em sheet. 1 botão primário por tela.
- **Feedback obrigatório** (V1, V8, V12). Toda ação = haptic (já temos `lib/haptics`) + visual (≥80ms) + às vezes copy.
- **Bottom bar contextual** (V9). Tabs sempre nas telas raiz. Em `lead/[id]`, tabs somem; ações (Call / Message / Mark contacted) aparecem fixadas no rodapé.

### 2.3 State — 5 estados pra cada tela com dados

| Estado | Padrão |
|---|---|
| **Loading** | Skeleton com forma do conteúdo (LeadCard skeleton = mesmo layout, blocos `Skeleton`). Aparece em <100ms. `LoadingScreen` só pra splash global. |
| **Empty (sem dados ainda)** | `EmptyState` com icon + título + descrição + CTA (`action` prop). CTA acionável, não "Tente novamente vago". |
| **Empty (filtro/busca sem resultado)** | `EmptyState` com sugestão concreta: "Sem leads com 'X'. Tente VIN parcial ou nome do cliente." |
| **Error** | Banner inline com mensagem real + botão **Tentar de novo**. Hoje é só `<Text>` vermelho — substituir. Componente novo: `ErrorBanner`. |
| **Refreshing** | RefreshControl (já presente na Home). Adicionar em Leads. |
| **Content** | Layout final. |

### 2.4 Emotion — raro e intencional

Posição: **Linear+Vercel 80%, Duolingo 20% só em vitória legítima.** Detalhes:

- **Login:** logo Ford com fade-in + leve scale (já tem useFadeIn). Server error com shake (já tem).
- **Tab switch:** transição slide horizontal ~250ms spring (V12). Hoje é cut. Configurar no `(tabs)/_layout.tsx`.
- **Pull to refresh:** RefreshControl com tint `colors.primary`. Haptic light no início do refresh.
- **Lead convertido → ritual gift/reveal/celebration** (V10). Quando vendedor marca "converted":
  1. *Antecipation:* botão de confirmar segura ~300ms com mini-progress
  2. *Reveal:* badge "Converted" gira/expande no card
  3. *Celebration:* toast verde + haptic success forte + texto "Conversão registrada"
  *Implementação:* fora deste spec — vai pra spec separada que cobre actions reais. Aqui só preparamos `Toast` com variant `success` enriquecida (spring, com icon, com optional `subtitle`).
- **Score visual:** se a tela exibir score numérico, número em mono. Score ≥ 90 = leve glow no container (sub-animação V12). *Fora do polish atual* — entra quando lead detail integrar score. Reservar API no design.
- **Microfeedback em wait:** Button já tem `loading` prop. Garantir que aparece em <80ms e tem texto "Verificando..." em vez de só spinner mudo.

### 2.5 Anti-patterns — recusados explicitamente

| Anti-pattern | Por quê fora |
|---|---|
| Emoji decorativo em UI | V6 — sinal de "AI-vibe-coded". Sempre Ionicon. |
| Card dentro de card | V9 — espaço caro em mobile, agrupa com whitespace+label. |
| Cor primária em tudo | V2/V3 — Ford Blue só em CTA primário e branding. |
| KPI repetido em N lugares | V6 — cada número aparece no nível mais alto onde faz sentido. |
| 5+ tamanhos de fonte | V2/V5 — sintoma de falta de sistema. |
| Tela morta sem estado | V8/V11 — todo estado existe. |
| Celebração trivializada | V10 — Robinhood multado em US$ 7.5M. Cerimônia só em vitória real. |
| Mascote/ilustração customizada | Sem orçamento, sem gerar com IA. Foco em tipografia + cor + Ionicons. |

### 2.6 Posição final

> **Vibe é Linear + Vercel, com momentos Duolingo só em vitória.**
> Vendedor Ford em concessionária precisa de credibilidade visual primeiro: hierarquia limpa, números em mono, Ford Blue com disciplina, zero ruído. Emoção entra pontualmente — login que respira, lead convertido com cerimônia, tab switch que desliza. O resto é Linear.

---

## 3. Foundation — mudanças em `lib/theme.ts`

| Adicionar | Detalhe |
|---|---|
| `fontFamily.mono` | `Platform.select({ ios: "Menlo", android: "monospace", default: "ui-monospace" })` |
| `typography.mono` | `{ fontFamily: fontFamily.mono, fontSize: fontSize.lg, fontWeight: fontWeight.semibold }` — usar em R$, score, VIN |
| `typography.h1.letterSpacing` | `-0.4` |
| `typography.h2.letterSpacing` | `-0.3` |
| `elevation.card / sheet / popover` | Aliases nomeados sobre `elevationLight/Dark`: `card→sm`, `sheet→lg`, `popover→primary`. Mais semântico que `sm/md/lg`. Manter os tokens antigos por compat. |

Sem cores novas. O `leadStatusPalette` / `leadPriorityPalette` já existentes vão começar a ser realmente usados (hoje LeadCard hardcoda `tone="textMuted"`).

---

## 4. Components — mudanças

### 4.1 LeadCard (rewrite — `components/domain/LeadCard.tsx`)

**Antes:** VIN h3 + priority badge à direita, reason em textMuted, status badge + valor mono à direita.

**Depois:**

```
┌─────────────────────────────────────────┐
│ ▎ CRÍTICO            há 2 dias          │ ← left-border 3px cor da priority
│ ▎                                       │   + chip de priority colorida (não badge)
│ ▎ 9BWZZZ377VT012345                     │ ← VIN em mono, semibold
│ ▎                                       │
│ ▎ Revisão 60k em atraso há 12 dias      │ ← reason em body textMuted
│ ▎                                       │
│ ▎ ● Novo            R$ 12.400           │ ← status com dot colorido + valor mono
└─────────────────────────────────────────┘
```

Detalhes:
- `borderLeftWidth: 3, borderLeftColor: priorityPalette[priority].color`
- Priority **chip** (não Badge) no topo direito com palette correta — atualmente Badge fica monocromática
- `created_at` → relative time via util novo `lib/relative-time.ts` ("agora", "há X min", "há X h", "há X dias", "DD/MM")
- VIN com `typography.mono`, truncado em 17 chars (full VIN size, mas se vier maior, ellipsis)
- Status com **dot** 6px colorido + label, mais discreto que badge cheia
- Valor em mono
- Touch target: card inteiro Pressable, hitSlop=8, scale ao pressionar (0.99)

**Composição com customer/vehicle/score (Phase 2 — não neste PR):**
A API hoje devolve só `customer_id` e `vin` — para mostrar nome do cliente e modelo do veículo precisamos compor 2 fetches a mais (lead → `customers/{id}` + `vehicles/{vin}`). Isso virá quando integrarmos TanStack Query (Fase 6 do port) — não dá pra fazer bem sem cache. Por ora, VIN é o identificador visual.

### 4.2 ErrorBanner (componente novo — `components/ui/ErrorBanner.tsx`)

```tsx
type Props = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;  // i18n key default "common.retry"
};
```

Visual: surface com borderColor `error`, ícone `alert-circle-outline` à esquerda, mensagem, botão **Tentar de novo** à direita. Substitui o `<Text style={styles.error}>` em Home/Leads/LeadDetail.

### 4.3 LeadCardSkeleton (componente novo — `components/domain/LeadCardSkeleton.tsx`)

Reproduz o layout do LeadCard com `<Skeleton>` blocks. Mostrar 3-5 unidades durante loading inicial.

### 4.4 ScreenHeader (componente novo — `components/ui/ScreenHeader.tsx`)

Padronizar header de tab. Hoje cada tela faz à mão de jeito diferente (Home tem View+Text inline, Leads não tem nada, Profile tem header próprio).

```tsx
type Props = {
  title: string;       // h1
  subtitle?: string;   // body textMuted, e.g. "Bom dia, João"
  trailing?: ReactNode; // opcional, e.g. filter button
};
```

Aplicação consistente nas 3 tabs.

### 4.5 PhotoButton (extrair — `components/ui/PhotoButton.tsx`)

Hoje é subcomponente inline em `profile.tsx`. Extrair para arquivo próprio (já é tipado, basta mover). Reduz `profile.tsx` em ~50 linhas.

### 4.6 Outros componentes (sem mudanças estruturais)

- **Button:** add micro-bounce no pressed state (`transform: scale(0.97)`). Loading state com texto, não só spinner.
- **Toast:** já com variants, adicionar `subtitle?: string` opcional. Já tem spring? Verificar e garantir.
- **Skeleton:** sem mudança.
- **EmptyState:** já aceita `action` ReactNode — usar nas telas.

---

## 5. Telas — mudanças

### 5.1 `app/login.tsx`

**Manter:** validation, useFadeIn, useShake, server error box, haptics, KeyboardAvoidingView.

**Adicionar:**
- Logo Ford no topo (asset existe? confirmar; senão, palavra "FORD" extrabold tamanho 4xl com letter-spacing -0.4)
- Subtitle "Forward Service" abaixo do título (já existe `t("auth.subtitle")` — confirmar)
- Footer fixo: "Esqueci minha senha" link (não funcional ainda — abre toast "Em breve"). Visual de footer puxa o olho pro fim da página, evita "ar morto" no bottom.
- Animação de entrada: hoje só fade. Adicionar scale leve de 0.96→1.0 no header.

### 5.2 `app/(tabs)/index.tsx` (Home)

**Refator:**
- ScreenHeader: title "Hoje" / subtitle "Bom dia, João" (puxar de `profile.full_name`, fallback email). i18n: `home.greeting` com vars.
- Hero stat card (V6 — KPI no nível mais alto): 1 card grande no topo com **2 KPIs**: "Leads ativos: 12" + "Pipeline: R$ 38k". Mono nos números. Não repetir esses números em lugar nenhum.
- LeadCardSkeleton em loading
- ErrorBanner com retry no lugar do `<Text style={styles.error}>`
- EmptyState com action="Ver todos os leads" → push pra `/leads`
- Lista limitada a "top 5 críticos do dia". Botão "Ver todos" abaixo da lista → `/leads`

### 5.3 `app/(tabs)/leads.tsx`

**Refator:**
- ScreenHeader: title "Leads" / subtitle "{n} ativos"
- Barra de busca persistente (`Input` com icon search-outline). Filtra client-side por VIN/reason por enquanto.
- Chips de filtro (priority): "Todos · Críticos · Hoje · Sem contato 30d+". 4 chips max (Hick). Selection com haptic light + bg primarySoft.
- LeadCardSkeleton em loading
- ErrorBanner com retry
- EmptyState diferenciado: "sem dados" vs "filtro vazio" (com sugestão)
- RefreshControl (hoje não tem)
- Push to `/lead/[id]` com `<Link>` (já existe)

### 5.4 `app/(tabs)/profile.tsx`

**Refator (mais cosmético):**
- Reorganização: user card + ações de foto viram **uma seção só** chamada "Perfil" (não duas competindo). PhotoButton row vira parte do user card como bottom row.
- Theme card e Locale row são visualmente quase iguais — padronizar como mesmo componente `SettingRow` (icon + label + value + chevron). Mas com Switch no theme.
- Sign out: botão `variant="ghost"` com cor `error`, em vez de secondary cinza.
- Header com ScreenHeader (titulo "Perfil" sem subtitle).

### 5.5 `app/lead/[id].tsx`

**Refator (maior mudança visual):**
- Header: VIN em mono h2 com letter-spacing tight + back button (já vem do Stack)
- Section 1 — **Status & priority**: dois badges grandes lado a lado, usando `leadStatusPalette` e `leadPriorityPalette` corretos (não tone hardcoded)
- Section 2 — **Razão**: card com label "Por que este lead", body com `reason`. Sem `Card` cheio, só um bloco com label uppercase + body.
- Section 3 — **Valor esperado**: card com label "Pipeline", valor mono enorme, e abaixo `created_at` relative
- Section 4 — **Ações** (footer fixo, bottom): 3 botões grandes "Ligar / Mensagem / Marcar contato" (não funcionais ainda — abrem toast "Em breve" e fazem haptic). Touch targets 56pt.
- Loading: skeleton da estrutura completa, não "..."
- Error: ErrorBanner com retry, no centro vertical

> **Nota técnica:** o TODO em [lead/[id].tsx:22-26](../../../app/lead/[id].tsx#L22-L26) sobre API não expor `GET /leads/{id}` continua. Por ora seguimos com `listLeads + find`. Quando o endpoint singular existir, swap trivial.

### 5.6 `app/(tabs)/_layout.tsx`

- Adicionar animação `tabBarShowLabel` consistente, ícones outline→filled ao selecionar (V12)
- Transição entre tabs: usar `tabBarStyle` com slide animation se Expo Router suportar (verificar; senão deixa como está — não é P0)

---

## 6. Intro fix — `components/ui/IntroVideo.tsx`

Fix do bug confirmado na análise da V8 (todo estado precisa funcionar):

```tsx
const player = useVideoPlayer(INTRO_SOURCE, (p) => {
  p.loop = false;
  p.muted = true;
  // remove p.play() — não funciona em web durante setup
});

useEffect(() => {
  player.play();  // chamada após mount, funciona em ambas plataformas
  const sub = player.addListener("playToEnd", finish);

  // Fallback web: se autoplay for bloqueado, libera em 6s
  // Fallback web: se autoplay for bloqueado, libera em 6s
  const timeout = setTimeout(finish, 6000);

  return () => {
    sub.remove();
    clearTimeout(timeout);
  };
}, [player, finish]);

return (
  // ...
  <VideoView
    player={player}
    style={{ width, height }}
    contentFit="cover"
    nativeControls={false}
    allowsPictureInPicture={false}
    playsInline  // <-- adicionar
  />
);
```

3 mudanças, ~5 linhas. Comportamento:
- Nativo: funciona como antes, timeout de 6s nunca dispara porque `playToEnd` chega bem antes
- Web autoplay OK: também funciona, `playToEnd` chega antes do timeout
- Web autoplay bloqueado: timeout libera em 6s, usuário não fica preso

---

## 7. Out of scope (explicitamente)

- **Fase 5** — onboarding 3 slides parallax + dealer-selection (spec separada)
- **Fase 6** — TanStack Query persistente + composição cliente+veículo+score no LeadCard (spec separada)
- **Push notifications, editar lead, histórico de interações** (Sprint 2+)
- **Mock de ações reais** (call/message/mark contacted abrem toast "Em breve" neste spec; ligação real virá quando backend expor endpoint)
- **EAS Build, deploy** (CLAUDE.md já marca como out of Sprint 1)
- **Testes** (suite ainda não foi setada; pode entrar em spec separada de testing)

---

## 8. Success criteria

Antes de merge, checklist:

- [ ] `npm run typecheck` zero erros
- [ ] `npm run lint` zero warnings novos
- [ ] Todas as 5 telas têm os 5 estados implementados (loading, empty, content, error, refreshing onde aplicável)
- [ ] Toda Pressable tem haptic apropriado (light pra navegação, medium pra ações, success pra confirmações, error pra falhas)
- [ ] Touch targets ≥ 44pt em todos os elementos interativos (checar visualmente com hitSlop)
- [ ] Light + dark mode visualmente coerentes em todas as telas
- [ ] PT-BR + EN funcionam (LocalePicker, todos os textos novos têm chaves i18n)
- [ ] Intro roda em iOS, Android e web (com fallback timeout funcional no web)
- [ ] Hero stat da Home, valores e VINs em mono
- [ ] LeadCard mostra priority com left-border + chip colorida correta
- [ ] Botões de ação no lead detail no rodapé fixo
- [ ] Nenhum emoji decorativo em UI
- [ ] `lib/theme.ts` typography tem `mono` e letter-spacing nos headings
- [ ] Demo (1min) gravada no Expo Go pra anexar no PR

---

## 9. Estimativa

| Bloco | Esforço estimado |
|---|---|
| Foundation (theme.ts updates) | 30 min |
| Components novos (ErrorBanner, LeadCardSkeleton, ScreenHeader, PhotoButton extraído) | 2h |
| LeadCard rewrite | 1h |
| Telas refactor (5 telas) | 3-4h |
| Intro fix | 15 min |
| Testes manuais (light/dark, PT/EN, iOS sim, Android sim, web) | 1h |
| Polish iterativo e ajuste fino | 1-2h |
| **Total** | **~8-10h** |

Cabe em 1-2 sessões. Não bloqueia Sprint 1 (mobile não é deliverable hard de 24/05 — é parte da disciplina Mobile/IoT mas demonstrável com o estado atual; refino aumenta a nota).

---

## 10. Open questions

- [ ] Logo Ford existe em `assets/`? Se sim, qual arquivo? Se não, vamos com palavra "FORD" tipográfica.
- [ ] `home.greeting` deve ler `profile.full_name` (já temos em Supabase) ou email? Sugiro full_name com fallback email.
- [ ] Footer com "Esqueci minha senha" no login: i18n key + comportamento (toast "Em breve" ou hide se Sprint 1 não inclui flow)?
- [ ] Tab transition slide-horizontal: Expo Router suporta nativamente? Se for hack grande, fica fora deste spec.

---

## 11. Próximos passos depois deste spec

1. Você revisa este doc, comenta inline o que mudar
2. Aprovado → commit do spec
3. Skill `writing-plans` gera o implementation plan tarefa-por-tarefa
4. Execução em PR `feat/polish-design-system`, idealmente em commits pequenos e demoáveis
