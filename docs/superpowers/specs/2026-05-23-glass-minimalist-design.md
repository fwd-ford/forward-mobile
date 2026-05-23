# Glass Minimalist — Design System Spec

**Data:** 2026-05-23
**Autor:** Jota + Claude Opus 4.7
**Status:** approved, em implementacao

## Motivacao

O design anterior (Ford Blue agressivo + cards solidos + tipografia sans-only) nao alcancou o look minimalista premium que o produto pede. Refs visuais aprovados:

- **Base estetica** (Mailchimp / Mobbin): label-caps minusculo + titulo serif gigante, hierarquia hiper-clara, cards com bordas leves, muito espaco em branco.
- **Camada glass** (TIDE app): superficies semi-transparentes com blur ("frosted glass"), bg dark sutil quase preto, icones outline finos, CTAs brancos pill.

Objetivo: combinar **Mailchimp em hierarquia tipografica** + **TIDE em superficies glass** sob a marca Ford (reduzida ao logo).

## Decisoes fechadas

| | Decisao |
|---|---|
| Modos | Light + dark com paridade total. Dark e a estrela. |
| Ford Blue | So no wordmark/logo. UI = grayscale + branco. CTAs brancos (pill) em dark, pretos (pill) em light. |
| Fontes | Fraunces (display serif variable) + Inter (sans body) via expo-google-fonts |
| Glass | Agressivo (TIDE-style): cards, inputs, hero, tab bar, modais. Tudo |
| BG | Mesh gradient abstrato estatico (sem foto, sem animacao). 3 radial gradients sobrepostos |

## Tokens de cor

### Dark
```
bg               #1E1E1E    (RGB 30,30,30 — pedido explicito)
bgDeep           #161616    (sutilmente mais escuro pra mesh)
bgElevated       #252525    (cards solidos elevados, fallback sem glass)
glassBase        rgba(40,40,40,0.55)    + backdrop-blur 24px
glassBorder      rgba(255,255,255,0.08)
textPrimary      #F5F5F5    (nao puro branco)
textMuted        #9CA3AF
textSubtle       #6B7280
separator        rgba(255,255,255,0.06)
```

### Light
```
bg               #FAFAFA    (off-white)
bgDeep           #F0F0F2
bgElevated       #FFFFFF
glassBase        rgba(255,255,255,0.65)    + backdrop-blur 24px
glassBorder      rgba(0,0,0,0.06)
textPrimary      #1A1A1A
textMuted        #6B7280
textSubtle       #9CA3AF
separator        rgba(0,0,0,0.05)
```

### Brand + semantic (compartilhado)
```
fordBlue         #003478    APENAS wordmark/logo. NUNCA UI.
ctaDark          #FFFFFF    pill branco em dark
ctaLight         #1A1A1A    pill preto em light
success          #10B981
warning          #F59E0B
error            #EF4444
critical         #FF453A    (Apple red)
```

## Tipografia

```
Display:  Fraunces (variable 100-900, soft, opt-sized)
Body:     Inter (variable 100-900)
Mono:     SF Mono / Cascadia / Consolas (system stack, sem bundle)

Escala:
  h-display    40px  Fraunces 700  letter-spacing -1.2   titulos de tela
  h-section    28px  Fraunces 600  letter-spacing -0.8   section headers
  h3           18px  Inter 600                            subsections
  body-lg      17px  Inter 400                            paragraphs
  body         15px  Inter 400                            default
  caption      13px  Inter 400
  label-caps   11px  Inter 600     letter-spacing +1.0    Mailchimp uppercase
  mono         15px  Mono 500
```

Bundle via `useFonts` em `_layout.tsx` (mesmo pattern de Ionicons).

## Sistema de glass

Componente `<GlassSurface>` abstrai por plataforma:

```
iOS native:     expo-blur BlurView intensity=80 + tint='regular'|'dark'
Android native: rgba fill semi-transparent + borda glassBorder
                (Android blur real tem perf ruim em listas)
Web:            backdrop-filter: blur(24px) + bg glassBase + borda
```

Variantes:
- `thin` — blur 12px, mais transparente, pra surfaces aninhadas
- `regular` — blur 24px, padrao
- `thick` — blur 40px, modais e sheets

API:
```tsx
<GlassSurface variant="regular" radius={20}>
  {children}
</GlassSurface>
```

## Mesh gradient background

Componente `<MeshBackground>` fixo no root, atras de tudo. Implementacao: `expo-linear-gradient` em 3 layers absoluteFill.

```
Dark:
  base:        #161616
  layer 1:     top-left,   rgba(40,40,55,0.35)  -> transparent
  layer 2:     top-right,  rgba(60,40,40,0.20)  -> transparent
  layer 3:     bottom,     rgba(30,30,35,0.45)  -> bgDeep

Light:
  base:        #F0F0F2
  layer 1:     top-left,   rgba(220,220,235,0.50) -> transparent
  layer 2:     top-right,  rgba(245,240,235,0.35) -> transparent
  layer 3:     bottom,     rgba(240,240,242,0.40) -> bgDeep
```

## Padroes por tela

### Login
- bg mesh + wordmark **FORD** Fraunces 56px branco
- tagline Inter 15px muted abaixo
- inputs underline-only (sem borda completa, sem card glass) — minimalista
- CTA branco pill bottom + Esqueci senha em ghost

### Home
```
[mesh bg]
  HOJE                           label-caps 11
  Bom dia, Jota                  Fraunces 40
  ┌─────────────── glass ───────────────┐
  │  LEADS ATIVOS    PIPELINE           │
  │       12         R$ 1.2M            │
  └─────────────────────────────────────┘
  Leads recentes                 Fraunces 28
  [glass card lead 1]
  [glass card lead 2]
  ...
  [tab bar glass thick]
```

### Leads
- Mesmo header pattern (label-caps + Fraunces titulo)
- Search bar glass pill
- Filter chips glass (active = solid white com text dark)
- Lista de glass cards

### Profile
- Avatar 80px circular + nome Fraunces 28px + email Inter muted
- Sections com label-caps + glass rows separadas por separator
- Sem card wrapper, rows ficam direto sobre o mesh com glass

### Lead detail
- Header stack minimo
- Label-caps `LEAD` + VIN mono grande
- Status pill colored (mantem palette de status)
- Glass sections de info
- Footer fixed glass thick com 3 CTAs

### Tab bar
- Glass thick com 4 icones outline finos + 1 central destacado
- Sem labels (ou labels so no active, estilo iOS)

## Ordem de implementacao

### Fase 1 — Foundation (1 PR)
- `theme.ts`: novas paletas dark/light com tokens acima
- `_layout.tsx`: useFonts(Fraunces + Inter)
- `components/ui/MeshBackground.tsx`: novo componente fixo no root
- `components/ui/GlassSurface.tsx`: novo componente com abstracao de blur

### Fase 2 — Telas, 1 PR por tela, sem componentizar
Estilos copiados inline em cada tela. Componentizacao vem depois.

1. Login
2. Home
3. Leads
4. Profile
5. Lead detail
6. Tab bar (glass)

### Fase 3 — Componentizacao
Depois que todas as telas estiverem certas:
- `<ScreenTitle>` — label-caps + Fraunces titulo + opt subtitle
- `<GlassCard>` — wrapper com variantes thin/regular/thick
- `<PillButton>` — variantes solid/glass/ghost com pill radius
- Refatorar telas pra usar novos componentes

## Migracao das telas existentes

Telas atuais ja tem:
- ScreenHeader (deprecate por ScreenTitle na fase 3)
- Card (deprecate por GlassCard na fase 3)
- Button (manter, ganha variante `pill`)
- ErrorBanner, EmptyState, Toast — mantem, ganham GlassSurface por dentro

i18n keys nao mudam (so visuals).

## Riscos e mitigacoes

- **Performance do blur no Android**: usar fallback rgba semi-transparent. Testar em emulador antes de mergear cada PR.
- **Bundle size das fontes**: Fraunces + Inter variable ~400KB combinado. Aceitavel pra UX premium.
- **Web fallback do blur**: `backdrop-filter` tem suporte ~95% (caniuse). Browsers antigos veem rgba sem blur — degradacao OK.
- **Mesh gradient em listas longas**: fixed atras de tudo, nao re-renderiza. Performance neutra.
