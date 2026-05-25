# Redesign da Home — Mobile Dashboard Figma Pixel-Perfect

**Data:** 2026-05-25
**Branch:** `redesign/dashboard-figma`
**Figma:** [FORD file](https://www.figma.com/design/67DfKMsKwzwNs5aNdJe6x2/FORD)

- Light: `node-id=1-2`
- Dark: `node-id=8-55`

## Objetivo

Reimplementar `app/(tabs)/index.tsx` do forward-mobile com fidelidade pixel-perfect ao design do Figma, migrando o sistema tipográfico do app para Playfair Display + Manrope (substituindo Fraunces + Inter atuais). A home passa a ter:

- Background com gradient vertical full-screen
- Saudação editorial "Bem-vindo, {nome completo}" em Playfair 36
- Decoração no canto direito: relógio dinâmico HH:MM gigante + globo pontilhado estático estilo MagicUI/cobe.js
- Hero card vertical translúcido com 2 KPIs empilhados (Leads / Valor), com "bleed" intencional à esquerda
- Grid 2x3 de lead cards compactos com foto da Raptor, valor, ID curto, nome, reason, hora e badge de status

## Decisões de produto

| Decisão | Escolha |
| --- | --- |
| Fidelidade ao Figma | Pixel-perfect |
| Tipografia | Migrar globalmente Fraunces → Playfair Display, Inter → Manrope |
| Saudação | "Bem-vindo, {full_name}" estática (typo "Víndo" corrigido) |
| Decoração canto direito | Relógio HH:MM dinâmico (atualiza por minuto) + globo cobe.js via Expo DOM Component |
| Globo: estilo | Pontilhado MagicUI, estático inclinado 151°, fundo transparente |
| Globo: markers | 5-7 dots laranja fixos em capitais BR (SP, RJ, BH, Curitiba, POA, BSB, Manaus) |
| Foto do veículo no card | Raptor F-150 fixa pra todos (bundle local PNG) |
| Badge | Status do lead com cor por temperatura (hot/warm/cold/won/lost) |
| Top N leads na home | 6 (grid 3 linhas x 2 colunas) |
| Card linha 2 (descrição) | `lead.reason` da API |
| Card linha 3 (rodapé) | ID curto (5 chars do UUID) + `last_activity_at` HH:MM |
| Dark mode | Inverter gradient e cores conforme node-id=8-55 |
| Estratégia de PR | Big PR única (tudo num branch só) |

## Arquitetura — arquivos

### Novos

- `components/illustrations/Globe.dom.tsx` — DOM Component (`'use dom'`) que importa `cobe`, renderiza canvas pontilhado estático inclinado com 5-7 markers laranja. Background transparente. Recebe `theme: 'light' | 'dark'` como prop pra ajustar cor dos dots.
- `components/illustrations/RotatingClock.tsx` — texto HH:MM gigante (Manrope 80) com gradient transparente via `MaskedView` + `expo-linear-gradient`. Atualiza por minuto.
- `components/domain/LeadCardCompact.tsx` — variante quadrada 170x115 do LeadCard, com foto Raptor + valor + ID curto + nome + reason + hora + badge status. **Distinta** do `LeadCard` atual (que continua em uso na tela `/leads`).
- `components/domain/LeadCardCompactSkeleton.tsx` — shimmer placeholder no mesmo formato 170x115.
- `components/ui/StatusBadge.tsx` — badge que recebe `status: LeadStatus` e mapeia pra bucket (hot/warm/cold/won/lost), aplicando cores theme-aware.
- `components/ui/HeroStatsBlock.tsx` — bloco vertical reutilizável com label italic 16 + valor serif 48.
- `components/ui/AppBackground.tsx` — `LinearGradient` absoluto fullscreen, lê `bgGradientFrom/To` do theme.
- `assets/images/raptor-card.png` — foto da Raptor F-150 (exportada do Figma).

### Modificados

- `app/(tabs)/index.tsx` — rewrite completo seguindo a estrutura JSX da seção abaixo.
- `app/(tabs)/_layout.tsx` — `tabBarStyle.backgroundColor` recebe `c.bottomBarBg` do theme.
- `app/_layout.tsx` — carregar `@expo-google-fonts/playfair-display` e `@expo-google-fonts/manrope` no font loading hook.
- `lib/theme.ts` — adicionar tokens novos (gradients, hero vertical, lead card compact, bottom bar, badge buckets) e atualizar `fontFamily` + `typography`.
- `lib/format.ts` — adicionar opção `{ compact: true, omitCurrency: true, suffix: 'k' }` em `formatBRL` (formato "2742k").
- `lib/displayName.ts` — adicionar `toFullName(input)` (sanitiza, trim, retorna nome completo). Mantém `toFriendlyFirstName` existente.
- `i18n/en.json` e `i18n/pt-BR.json` — adicionar/remover keys (ver seção Data flow).
- `package.json` — adicionar `cobe`, `@expo-google-fonts/playfair-display`, `@expo-google-fonts/manrope`, `@react-native-masked-view/masked-view`. Remover `@expo-google-fonts/fraunces`, `@expo-google-fonts/inter`.

### DOM Component pattern

```ts
// components/illustrations/Globe.dom.tsx
'use dom';

import { useEffect, useRef } from 'react';
import createGlobe from 'cobe';

type GlobeProps = { theme: 'light' | 'dark' };

export default function Globe({ theme }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2, width: 648, height: 648,
      phi: 0, theta: 0.4,             // pose static inclinada (~151° visual)
      dark: theme === 'dark' ? 1 : 0,
      diffuse: 1.2, mapSamples: 16000, mapBrightness: 6,
      baseColor: theme === 'dark' ? [0.3, 0.3, 0.3] : [1, 1, 1],
      markerColor: [249/255, 115/255, 22/255], // #f97316 laranja
      glowColor: theme === 'dark' ? [0.1, 0.1, 0.1] : [0.9, 0.9, 0.9],
      markers: [
        { location: [-23.55, -46.63], size: 0.07 }, // SP
        { location: [-22.91, -43.17], size: 0.06 }, // RJ
        { location: [-19.92, -43.94], size: 0.05 }, // BH
        { location: [-25.43, -49.27], size: 0.05 }, // Curitiba
        { location: [-30.03, -51.23], size: 0.05 }, // POA
        { location: [-15.78, -47.93], size: 0.05 }, // BSB
        { location: [-3.13,  -60.02], size: 0.05 }, // Manaus
      ],
      onRender: () => {}, // estático, sem update de phi
    });
    return () => globe.destroy();
  }, [theme]);
  return <canvas ref={canvasRef} style={{ width: 324, height: 315, background: 'transparent' }} />;
}
```

## Design tokens

### Tipografia (`lib/theme.ts`)

```ts
fontFamily = {
  regular:    'Manrope_400Regular',
  medium:     'Manrope_500Medium',
  semibold:   'Manrope_600SemiBold',
  light:      'Manrope_300Light',
  serif:      'PlayfairDisplay_400Regular',
  serifItalic:'PlayfairDisplay_500Medium_Italic',
};

typography = {
  hDisplay:   { fontFamily: serif,       fontSize: 36, lineHeight: 45, letterSpacing: -1.8 },
  hKpiValue:  { fontFamily: serif,       fontSize: 48, lineHeight: 48, letterSpacing: -2.4 },
  hKpiLabel:  { fontFamily: serifItalic, fontSize: 16, lineHeight: 24, letterSpacing: -0.8 },
  hSection:   { fontFamily: serifItalic, fontSize: 20, lineHeight: 30, letterSpacing: -1 },
  cardValue:  { fontFamily: 'Manrope_500Medium', fontSize: 14, letterSpacing: -0.7 },
  cardId:     { fontFamily: 'Manrope_400Regular', fontSize: 12, letterSpacing: -0.6 },
  cardMeta:   { fontFamily: 'Manrope_300Light',  fontSize: 10, letterSpacing: -0.5 },
  cardTime:   { fontFamily: 'Manrope_300Light',  fontSize: 14, letterSpacing: -0.7 },
  clockHero:  { fontFamily: 'Manrope_400Regular', fontSize: 80, lineHeight: 80, letterSpacing: -4 },
  badge:      { fontFamily: 'Manrope_300Light',  fontSize: 10, letterSpacing: -0.5 },
};
```

### Cores (light)

```ts
bgGradientFrom:     '#f0e9e9',
bgGradientTo:       '#4b4b4b',
heroVerticalBg:     'rgba(255,255,255,0.51)',
heroVerticalBorder: '#c5c5c5',
clockGradientFrom:  'rgba(0,0,0,0.09)',
clockGradientMid:   'rgba(51,51,51,0.49)',
clockGradientTo:    '#666',
leadCardCompactBg:  'rgba(217,217,217,0.66)',
leadCardCompactText:'#3a3838',
bottomBarBg:        'rgba(238,238,238,0.98)',
```

### Cores (dark)

```ts
bgGradientFrom:     '#4a4a4a',
bgGradientTo:       '#0d0d0d',
heroVerticalBg:     'rgba(0,0,0,0.51)',
heroVerticalBorder: '#4c4c4c',
clockGradientFrom:  'rgba(255,255,255,0.09)',
clockGradientMid:   'rgba(255,255,255,0.49)',
clockGradientTo:    '#ffffff',
leadCardCompactBg:  'rgba(9,9,9,0.66)',
leadCardCompactText:'#ffffff',
bottomBarBg:        'rgba(15,15,15,0.98)',
```

### Badge buckets

```ts
badgeColors = {
  hot:         { light: { bg: '#f0a8a8', text: '#be5252' }, dark: { bg: '#581b1b', text: '#be5252' } },
  warm:        { light: { bg: '#fde0a8', text: '#a67630' }, dark: { bg: '#4a3818', text: '#d4a04a' } },
  cold:        { light: { bg: '#c8d8f0', text: '#3a5a8a' }, dark: { bg: '#1f3050', text: '#6a90c8' } },
  closed_won:  { light: { bg: '#b8e0c8', text: '#3a7050' }, dark: { bg: '#1a3a2a', text: '#5aa080' } },
  closed_lost: { light: { bg: '#d0d0d0', text: '#666'    }, dark: { bg: '#2a2a2a', text: '#888'    } },
};

statusToBucket = {
  new: 'hot', contacted: 'hot',
  qualified: 'warm', test_drive: 'warm',
  proposal: 'cold', negotiation: 'cold',
  closed_won: 'closed_won', closed_lost: 'closed_lost',
};
```

## Estrutura JSX

```tsx
<AppBackground>                                       // LinearGradient absoluto fullscreen
  <FlatList numColumns={2}
            data={topLeads}                           // slice(0, 6)
            columnWrapperStyle={{ gap: 8, paddingHorizontal: 30 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            ListHeaderComponent={
              <View>
                <View style={{ height: 460 }}>        // hero area absolute children
                  <Text style={hDisplay}>             // absolute left:30 top:45
                    Bem-vindo,{'\n'}{fullName}
                  </Text>
                  <RotatingClock />                   // absolute left:209 top:143, HH:MM atual
                  <Globe theme={isDark ? 'dark' : 'light'} />  // absolute left:212 top:171, 324x315
                  <View style={heroCardStyle}>        // absolute left:-80 top:192, w:235 h:202
                    <Text style={hKpiLabel}>{t('home.hero.leads_label')}</Text>   // top:204 left:30
                    <Text style={hKpiValue}>{hero.activeLeads}</Text>             // top:225 left:30
                    <Text style={hKpiLabel}>{t('home.hero.value_label')}</Text>   // top:293 left:34
                    <Text style={hKpiValue}>{formatBRL(hero.pipelineBRL, ...)}</Text> // top:314 left:30
                  </View>
                </View>
                <SectionTitle style={{ paddingHorizontal: 30, marginBottom: spacing.md }}>
                  Últimos Leads
                </SectionTitle>
              </View>
            }
            ListFooterComponent={
              leads.length > 6
                ? <SeeAllPill onPress={() => router.push('/leads')} count={leads.length} />
                : null
            }
            renderItem={({ item }) => <LeadCardCompact lead={item} />} />
</AppBackground>
```

Nota: o `SectionTitle` "Últimos Leads" renderiza **dentro** do `ListHeaderComponent`, logo após o `View` do hero area de altura fixa 460 — garantindo que aparece entre o hero e o grid, sem precisar de um componente separado fora da FlatList.

### LeadCardCompact (170x115, radius 5)

```text
┌────────────────────────────────────────┐
│ R$:1987,32      ┌─[Hot]──┐            │  cardValue + StatusBadge top-right
│ ID:7a3b1                              │  cardId
│      ┌──────────────────────┐         │
│      │   raptor-card.png    │         │  height:53 w:102, posicionada centralizada na metade superior
│      └──────────────────────┘         │
│ João Victor Franco                    │  cardMeta — full_name do customer
│ Pesquisou EcoSport novo      20:31    │  cardMeta reason + cardTime HH:MM last_activity
└────────────────────────────────────────┘
```

## Data flow e estados

### Sources (mantém)

- `api.listLeads({ limit: 200 })` → cálculo client-side de hero stats via `computeHeroStats`
- `fetchMyProfile()` → `full_name`; fallback pra `supabase.auth.getUser().email` → username
- `setInterval(60000)` → atualiza só `now` que alimenta o clock

### Hero values

- `activeLeads`: integer direto, ex. "124"
- `pipelineBRL`: `formatBRL(value, { compact: true, omitCurrency: true, suffix: 'k' })` → "2742k", "120k", "5k". Valores < 1000 renderizam sem sufixo ("742").

### Estados

| Estado | Trigger | Tratamento |
| --- | --- | --- |
| Initial loading | `initialLoading: true` | Hero KPIs em skeleton (placeholder shimmer no tamanho final). Grid com 6 `LeadCardCompactSkeleton`. Greeting + clock + globe renderizam normalmente. |
| Pull-to-refresh | `RefreshControl tintColor={c.text}` | Spinner padrão. Hero e grid mantêm dados anteriores. |
| Error com cache | `error && leads.length > 0` | `ErrorBanner` inline acima do "Últimos Leads". Hero e cards continuam visíveis. |
| Error sem cache | `error && leads.length === 0` | Hero card escondido (`showHero` false). Grid substituído por `EmptyState` `cloud-offline-outline` + retry pill. Greeting + clock + globe permanecem. |
| Empty | `leads.length === 0 && !error` | Hero mostra "0" e "0". Grid substituído por `EmptyState` `briefcase-outline`. |
| Globe falha | DOM Component throw / webview off | `<ErrorBoundary>` silencia, página renderiza sem o globo. |

### i18n

**Adicionar:**

- `home.welcome` → "Bem-vindo, {{name}}" / "Welcome, {{name}}"
- `home.hero.leads_label` → "Leads" / "Leads"
- `home.hero.value_label` → "Valor" / "Value"
- `lead.card.priority_hot|warm|cold|won|lost` → labels do badge traduzidos

**Atualizar:**

- `home.recent_leads` → "Últimos Leads" / "Latest Leads" (era "Leads recentes")

**Remover:**

- `home.greeting_morning`, `home.greeting_afternoon`, `home.greeting_evening`, `home.today`

### Performance

- `FlatList numColumns={2} initialNumToRender={6}` — não precisa virtualizar (limite 6).
- `Globe.dom.tsx` renderiza UMA vez no mount (estático, sem `onRender` updating phi).
- `RotatingClock` memoizado e isolado do resto — re-render por minuto não afeta hero/globe/grid.
- `HeroStatsBlock`, `Greeting`, `Globe` envolvidos em `React.memo` para evitar re-render no tick do clock.

## Testing approach

Project não tem Jest setup — verificação é por typecheck + lint + Playwright QA (padrão validado no QA round 1-3 de 23-24/05).

### Gates automáticos

- `npm run typecheck` — TS strict, todos os novos componentes e tokens tipados.
- `npm run lint` — ESLint sem warnings novos.

### Visual QA via Playwright MCP

```bash
CI=1 BROWSER=none npm run start -- --port 8090
# Em Claude/sessão separada:
browser_navigate http://localhost:8090
browser_resize 393 852          # iPhone 16
browser_take_screenshot home-light.png
# toggle dark via /profile -> Switch real
browser_take_screenshot home-dark.png
```

### Checklist visual de fidelidade

- [ ] Background gradient bege→cinza (light) / cinza→preto (dark) cobrindo fullscreen
- [ ] Greeting "Bem-vindo, {nome}" Playfair 36 quebrando em 2 linhas com leading 1.25
- [ ] Clock HH:MM com text gradient transparent→cor (não cor sólida)
- [ ] Globe pontilhado renderiza inclinado no canto direito com 5+ dots laranja sobre Brasil
- [ ] Hero card vertical com "bleed" intencional à esquerda
- [ ] KPIs "Leads / 124" e "Valor / 2742k" empilhados, valores Playfair 48
- [ ] Grid 2x3 de LeadCardCompact com gap 8px, padding 30px lateral
- [ ] Cada card mostra: R$ valor, ID curto 5 chars, foto Raptor, nome, reason, hora, badge status
- [ ] Badge `hot` em status new/contacted, `warm` em qualified/test_drive, etc.
- [ ] Tab bar inferior com `bottomBarBg` correspondente ao theme
- [ ] Toggle dark/light: gradient, hero card, lead card, badge — todos invertem corretamente

### Estados a forçar

- [ ] `initialLoading: true` → skeletons no grid
- [ ] Backend offline → `ErrorBanner` inline (com cache) + `EmptyState` retry (sem cache)
- [ ] `leads.length === 0` → empty state briefcase
- [ ] Globe webview falha → ErrorBoundary silencia, página renderiza sem o globo

### Smoke físico antes do merge

- [ ] Pull-to-refresh funciona
- [ ] Clock atualiza ao trocar de minuto (aguardar 60s)
- [ ] Tap em LeadCardCompact navega pra `/lead/[id]`
- [ ] "Ver todos (N)" navega pra `/leads`
- [ ] Tab bar permanece visível e clicável

### Side-by-side antes do merge

Anexar à PR:

- Screenshot Figma light vs implementação light
- Screenshot Figma dark vs implementação dark

## Riscos e mitigações

| Risco | Mitigação |
| --- | --- |
| DOM Component (`'use dom'`) requer Expo Web rodando — em Android/iOS abre WebView. Bundle ~600kb extra | Verificar no smoke test físico (não só web). Se inviável, fallback `react-native-skia` documentado como Plano B. |
| Migração global Fraunces → Playfair afeta outras telas (Login, Leads, Profile, Lead Detail) que podem ter regressões | Smoke test em todas as telas após troca da fonte. Adicionar checklist no PR description. |
| Hero card com `left: -80` pode quebrar em devices mais estreitos (320px tipo SE) ou wider (iPad) | Definir `max-width: 393px` na hero area com `alignSelf: 'center'` para preservar a posição relativa do bleed. |
| Globe markers em coords fixas BR — se app for usado em outro país parece deslocado | Aceitável pra Sprint 1 (mercado BR). Documentar como TODO futuro. |
| Foto Raptor fixa em todos os cards parece pouco autêntico | Aceitável para esta iteração; tornar customizável quando API trouxer `vehicle_model_image_url`. |
| Manrope global afeta todos os componentes que usam `fontFamily.regular/medium/etc` | Lint/typecheck pega imports inválidos; smoke visual confirma estética. |

## Build sequence

1. Adicionar deps: `cobe`, `@expo-google-fonts/playfair-display`, `@expo-google-fonts/manrope`, `@react-native-masked-view/masked-view`. Remover Fraunces, Inter.
2. Atualizar `lib/theme.ts` (fontFamily, typography, light/dark colors, badge buckets).
3. Atualizar `app/_layout.tsx` para carregar Playfair + Manrope no `useFonts`.
4. Criar `components/ui/AppBackground.tsx`.
5. Criar `components/illustrations/Globe.dom.tsx`.
6. Criar `components/illustrations/RotatingClock.tsx`.
7. Criar `components/ui/StatusBadge.tsx`.
8. Criar `components/ui/HeroStatsBlock.tsx`.
9. Adicionar `assets/images/raptor-card.png` (exportar do Figma).
10. Criar `components/domain/LeadCardCompact.tsx` e `LeadCardCompactSkeleton.tsx`.
11. Atualizar `lib/format.ts` (opções compact/omitCurrency/suffix).
12. Atualizar `lib/displayName.ts` (`toFullName`).
13. Atualizar i18n (`en.json`, `pt-BR.json`).
14. Rewrite `app/(tabs)/index.tsx`.
15. Ajustar `app/(tabs)/_layout.tsx` (tabBarStyle bottomBarBg).
16. Smoke visual em outras telas (Login, Leads, Profile, Lead Detail) pra validar trocas globais de fonte.
17. Playwright QA: light, dark, empty, error, loading.
18. Side-by-side com Figma para validação final.

## Não-objetivos

- **Não** estender o globo para outras telas (só home).
- **Não** adicionar campo `vehicle_model_image_url` à API forward-api-java nesta iteração.
- **Não** redesenhar `/leads`, `/lead/[id]`, `/profile`, `/login` — escopo é só a home. Outras telas herdam apenas a troca de fonte global; layout permanece.
- **Não** trocar `LeadCard` existente em `/leads` por `LeadCardCompact` — são variantes distintas, cada uma na sua tela.
- **Não** introduzir rotação animada no globo, pull-to-rotate, ou markers dinâmicos.
- **Não** persistir tema dark/light em servidor — continua local-only via ThemeContext + AsyncStorage.
