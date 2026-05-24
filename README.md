# forward-mobile

![org](https://img.shields.io/badge/org-fwd--ford-blue?style=flat-square)
![stack](https://img.shields.io/badge/stack-React_Native_·_Expo_·_TypeScript-333?style=flat-square)

Mobile app for **ForwardService** — visão atendente (leads, Vista 360,
mensageria) e visão cliente (agendamento, status, Ford Care). Stack
React Native + Expo + Supabase. Disciplinas atendidas: Mobile (Sprint 2+)
e provedor da prova-de-conceito Frontend do Sprint 1.

## Stack

- React Native via **Expo SDK 51** (managed workflow — sem prebuild local)
- **Expo Router** (navegação file-based + typed routes)
- **Supabase JS SDK** para auth (sessão persistida via `expo-secure-store`)
- **TypeScript strict mode**
- **i18next** (pt-BR padrão + en com detecção de locale do device)
- Design system **Glass Minimalist**: Fraunces + Inter via `@expo-google-fonts`,
  mesh gradient + `GlassSurface` primitive, paleta dark/light Ford Blue

## Pré-requisitos

| Ferramenta | Versão | Notas |
| ---------- | ------ | ----- |
| Node.js | 18 LTS ou 20 LTS | `node --version` |
| npm | 9+ (bundled com Node 18) | `npm --version` |
| Expo Go (device físico) | última disponível na loja | Android/iOS, mesmo Wi-Fi do PC |
| Chrome / Edge / Safari (web) | qualquer recente | para `npm run web` |
| Android Studio (opcional) | — | só se for usar emulador Android |
| Xcode (opcional, macOS only) | — | só se for usar iOS Simulator |

Nenhum SDK Android/iOS é necessário pra rodar via Expo Go ou web.

## Estrutura

```text
app/                    Rotas file-based (Expo Router)
  (tabs)/               Bottom tab navigator
    _layout.tsx
    index.tsx           Home: leads do dia + pull-to-refresh
    leads.tsx           Lista de leads com filtros (busca, status, data)
    profile.tsx         Perfil + tema + locale + sign out
  lead/[id].tsx         Detalhe do lead (Vista 360 v1)
  login.tsx             Auth (email + senha)
  _layout.tsx           Root stack
components/
  ui/                   Primitivos (Button, Card, Badge, GlassSurface,
                        ScreenHeader, ErrorBanner, FooterAction, ...)
  domain/               Domínio (LeadCard, MetricCard)
lib/
  api.ts                Cliente tipado pro forward-api-java
  supabase.ts           Cliente Supabase com SecureStore
  auth.ts               useSession hook + sign in/out
  theme.ts              Tokens de design (cores, spacing, radius, tipografia)
  displayName.ts        Friendly name fallback (full_name → email → "Bem-vindo")
i18n/
  index.ts              Bootstrap + detecção de locale (iOS/Android/web)
  en.json, pt-BR.json   Traduções
```

## Quick start

### Caminho mais rápido (Expo Go + Fly prod, sem setup)

```bash
npm install
npm run start
```

Sem `.env`, o app aponta para a API em produção (`forward-api-java.fly.dev`)
e Supabase de produção. Funciona pra qualquer dev fora da LAN.

Scaneie o QR code com o Expo Go (Android) ou Camera (iOS). O device precisa
estar no mesmo Wi-Fi do PC.

### Web (testes rápidos no browser)

```bash
npm run web
# abre em http://localhost:8081 por padrão
```

Útil pra iterar UI sem device, ver console do Metro, e fazer screenshot.
Limitações: `expo-secure-store` cai em fallback (localStorage), e push
notifications não funcionam.

### Android emulador / iOS simulator

```bash
npm run android       # exige Android Studio + AVD aberto
npm run ios           # macOS only, exige Xcode + Simulator aberto
```

### Backend local (overrides via .env)

Para apontar o app pra uma instância local do `forward-api-java`:

```bash
cp .env.example .env
```

Edite `.env` conforme o cenário:

| Cenário | EXPO_PUBLIC_API_URL |
| ------- | ------------------- |
| Web ou iOS simulator | `http://localhost:8080` |
| Android emulator | `http://10.0.2.2:8080` |
| Expo Go em device físico | `http://<IP-do-PC>:8080` (ex: `http://192.168.1.42:8080`) |
| Docker compose (forward-infra) | `http://<IP-do-PC>:18080` |

Depois: `npm run start --clear` (cache do Metro precisa de reset quando
`.env` muda).

## Configuration

Toda env var é opcional. Default aponta pra produção (veja `app.config.js`).

| Variável | Default | Quando setar |
| -------- | ------- | ------------ |
| `EXPO_PUBLIC_API_URL` | `https://forward-api-java.fly.dev` | Backend local ou staging |
| `EXPO_PUBLIC_SUPABASE_URL` | `https://ysewoopjgdpvnkfhffgy.supabase.co` | Outro projeto Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | embarcado em `app.json:extra` | Outro projeto Supabase |

`.env` está em `.gitignore`. O `app.json` carrega a anon key publicável da
Supabase — ok comitar (é a chave anon, não service role).

## Sprint 1 — entregas e estado

| Tela | Estado | Funcionalidade |
| ---- | ------ | -------------- |
| Login | ✅ | Auth email+senha via Supabase, validação de form, ErrorBanner |
| Home | ✅ | Leads do dia + hero KPIs (activeLeads, pipelineBRL) + pull-to-refresh |
| Leads | ✅ | Lista filtrada (status, prioridade, busca), chips com contagem |
| Lead Detail | ✅ | Vista mínima: VIN, customer, motivo, ações (Ligar tel: + outros stubs) |
| Profile | ✅ | Avatar (Camera/Galeria), toggle dark/light, locale picker pt-BR/en, sign out |
| i18n | ✅ | pt-BR (padrão) + en, detecção via `navigator.language` no web e NativeModules em mobile |
| Design system | ✅ | Glass Minimalist consolidado (Fraunces+Inter, mesh bg, GlassSurface, theme tokens) |

Sprints futuras: Vista 360 completa, agendamento, WhatsApp via N8N, push
notifications, onboarding flow, modo cliente final.

## Conventions

- User-facing strings sempre via `t("key")` — nunca hardcoded.
- Imports via alias `@/...` (configurado em `tsconfig.json`).
- Componentes tipados com interfaces explícitas; nada de `any`.
- Decisões de design vivem em `lib/theme.ts` — editar lá, não inline.
- Helpers canônicos:
  - `formatBRL(value)` para moeda
  - `ACTIVE_LEAD_STATUSES` (set canônico de status ativos)
  - `friendlyDisplayName({ fullName, email })` para greeting
  - `toFriendlyFirstName(name)` para primeiro nome

## Verificação local

```bash
npx tsc --noEmit                   # type check (sem build)
npm run lint                       # ESLint (se configurado)
```

CI roda Gitleaks em todo push. Type check é validado manualmente via PR.

## Troubleshooting

| Sintoma | Causa provável | Fix |
| ------- | -------------- | --- |
| Expo Go mostra "Network response timed out" | Device em Wi-Fi diferente do PC | Verificar mesma rede; usar IP LAN em `.env` |
| App carrega mas "Não autenticado" | `EXPO_PUBLIC_API_URL` errado ou backend off | `curl <API_URL>/health` → deve retornar `{"status":"UP"}` |
| Fontes Fraunces/Inter não carregam | Conexão lenta no primeiro load | Pull-to-refresh em qualquer tela; `useFonts()` cacheia |
| Cor errada após trocar tema | Cache do Metro | `npm run start -- --clear` |
| Web em Windows mostra fonte serif estranha em KPIs | `SF Mono` / `JetBrains Mono` não instaladas localmente | Fallback usa Consolas (Win11) ou monospace genérico — esperado |
| Hot reload não funciona em emulador Android | Porto bloqueado | `adb reverse tcp:8081 tcp:8081` |
| CORS error no web | Backend não tem `http://localhost:8081` em `ALLOWED_ORIGINS` | Adicionar no `.env` do forward-api-java |

## Repos relacionados

- [`forward-api-java`](https://github.com/fwd-ford/forward-api-java) — backend REST + SOAP que este app consome
- [`forward-infra`](https://github.com/fwd-ford/forward-infra) — migrations SQL + docker compose
- [`forward-docs`](https://github.com/fwd-ford/forward-docs) — artefatos acadêmicos e OpenAPI mirror

## Status QA

Relatório visual completo (Playwright) em
[`docs/superpowers/UX_QA_REPORT.md`](docs/superpowers/UX_QA_REPORT.md).
Issues P0/P1 abertas tracked via GitHub Issues do repo.
