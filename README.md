# ForwardService Mobile

![org](https://img.shields.io/badge/org-fwd--ford-blue?style=flat-square)
![stack](https://img.shields.io/badge/stack-React_Native_·_Expo_SDK_55_·_TypeScript-333?style=flat-square)
![status](https://img.shields.io/badge/sprint--1-entregue-success?style=flat-square)
![desafio](https://img.shields.io/badge/desafio--02-VIN_Share-blue?style=flat-square)

> **App mobile da plataforma ForwardService — solução do grupo para o Desafio 02 (VIN Share / Retenção pós-venda) do Challenge Ford × FIAP 2026.**

App React Native + Expo voltado para o **atendente da concessionária**: ele abre o app, vê os leads do dia com priorização baseada em churn score, entra no detalhe e atua (ligar, mensagem, marcar contato). O objetivo é fazer o atendente recuperar clientes que estão prestes a abandonar a rede oficial Ford de manutenção.

---

## Índice

1. [Sobre o Projeto](#1-sobre-o-projeto)
2. [Integrantes do Grupo](#2-integrantes-do-grupo)
3. [Demonstração Visual](#3-demonstração-visual)
4. [Como Rodar o Projeto](#4-como-rodar-o-projeto)
5. [Decisões Técnicas](#5-decisões-técnicas)
6. [Próximos Passos](#6-próximos-passos)
7. [Apêndice — Conventions & Troubleshooting](#7-apêndice--conventions--troubleshooting)

---

## 1. Sobre o Projeto

### Desafio escolhido

**Desafio 02 — Impulsionando o VIN Share na América do Sul com Soluções Inteligentes.**

A Ford perde participação no mercado de pós-venda à medida que seus veículos envelhecem: o cliente faz a primeira revisão na rede oficial, e a partir daí migra para oficinas independentes em busca de preço, conveniência ou simplesmente porque "esqueceu" do timing da próxima manutenção. O **VIN Share** é a métrica que captura essa fatia — quantos veículos da base ativa estão de fato sendo atendidos pela rede oficial em um dado período.

Escolhemos esse desafio porque ele combina três coisas que valorizamos como grupo:

- **Problema real e dimensionável** — não é "smart cidade genérica", é uma métrica que a Ford acompanha trimestralmente.
- **Espaço para ML e dados** — segmentação comportamental + classificação preditiva têm encaixe direto, e o Sprint 1 já entrega uma versão simplificada do score na home do app.
- **Ponta operacional clara** — o atendente da concessionária é o "última milha". Sem uma ferramenta mobile que prioriza o trabalho dele, qualquer modelo de ML morre antes de gerar impacto.

### Onde o app entra na solução

A plataforma **ForwardService** é composta de 6 repositórios (backend Java, ML Python, web SvelteKit, infra, docs e este mobile). O `forward-mobile` é a **interface do atendente** — quem efetivamente atua sobre o lead. O fluxo é:

```text
ML (forward-ml)  ──── churn score por VIN ────►  API (forward-api-java)
                                                          │
                                                          ▼
                                              ┌───────── Mobile (este repo) ─────────┐
                                              │  Atendente prioriza, contata, fecha. │
                                              └──────────────────────────────────────┘
                                                          │
                                                          ▼
                                              VIN Share recuperado ✓
```

### Funcionalidades implementadas no Sprint 1

| # | Funcionalidade | Estado | Observação |
|---|---------------|--------|------------|
| 1 | **Login com email + senha** | ✅ | Autenticação via Supabase Auth, sessão persistida com `expo-secure-store` |
| 2 | **Dashboard (Home)** | ✅ | Saudação contextual (manhã/tarde/noite), KPIs de Leads Ativos e Pipeline em BRL, lista de leads recentes |
| 3 | **Lista de Leads** | ✅ | Filtros por status (Todos, Críticos, Hoje, Esquecidos 30d+), busca por VIN ou motivo, contagem por chip |
| 4 | **Detalhe do Lead (Vista 360 v1)** | ✅ | Nome do cliente em destaque, prioridade, razão do score, pipeline esperado, ações (Ligar, Mensagem, Marcar contato) |
| 5 | **Card de lead com nome do cliente** | ✅ | Nome real em destaque + VIN como subtítulo + razão humanizada (em vez de jargão técnico de ML) |
| 6 | **Razões humanizadas por prioridade** | ✅ | "Sumiu da rede há 90 dias", "Pulou a 2ª revisão programada", etc. (mapeamento determinístico em `lib/demo-data.ts`) |
| 7 | **Perfil do usuário** | ✅ | Avatar com upload (Câmera ou Galeria via `expo-image-picker`), persistência em Supabase Storage |
| 8 | **Tema Dark/Light** | ✅ | Toggle manual + opção "Usar tema do sistema", persistência local em AsyncStorage |
| 9 | **Internacionalização (i18n)** | ✅ | Português (Brasil) por padrão + Inglês, detecção automática do locale do device, picker manual |
| 10 | **Design System "Glass Minimalist"** | ✅ | Tipografia serif (Fraunces) + sans (Inter), paleta Ford Blue, mesh gradient background, primitivo `GlassSurface` |
| 11 | **Pull-to-refresh** | ✅ | Em Home e Leads, com haptic feedback via `expo-haptics` |
| 12 | **Tratamento de erro com retry** | ✅ | `ErrorBanner` reutilizável + auto-refresh de token em 401 (`lib/api.ts:doFetch`) + retry transparente |

Funcionalidades que **estão preparadas mas dependem do backend** (Sprint 2):

- Botão **Ligar** abre `tel:` URI nativo, mas o número do cliente vem do customer enrichment (endpoint `GET /customers/{id}` ainda não retorna telefone validado).
- Botão **Mensagem** está stub — Sprint 2 dispara WhatsApp via N8N.
- Botão **Marcar contato** está stub — Sprint 2 grava histórico de outreach.

### Conformidade com o spec da disciplina

| Requisito do PDF do Prof. Hércules Ramos | Atendido? |
|-------------------------------------------|-----------|
| React Native + Expo (recomendado) | ✅ Expo SDK 55 |
| App multiplataforma (iOS + Android) | ✅ Mesmo bundle, validado em ambos |
| Pelo menos 1 fonte de dados externa via API | ✅ `forward-api-java` (Spring Boot, Fly.io) + Supabase Auth/Storage |
| Componentes React Native + gerenciamento de estado | ✅ Composição via primitivos + Context API para tema/i18n/auth |
| Expo Router | ✅ File-based routing com typed routes |
| APIs assíncronas | ✅ Cliente tipado em `lib/api.ts` com retry e auto-attach de token |
| Diferencial: storage local | ✅ `expo-secure-store` para token, `AsyncStorage` para tema/locale |
| Diferencial: sensores | ⚠️ Parcial — uso de Câmera via `expo-image-picker` para avatar |
| Diferencial: notificações | 🟡 Backlog Sprint 2 (`expo-notifications` planejado) |

---

## 2. Integrantes do Grupo

| Nome completo | RM | GitHub |
|---------------|-----|--------|
| João Victor Franco | 556790 | [@jvfranco08](https://github.com/jvfranco08) |
| Lucca Saraiva Borges | 554608 | [@lucksza](https://github.com/lucksza) |
| Ruan Melo Vieira | 557599 | [@DevRuanVieira](https://github.com/DevRuanVieira) |
| Rodrigo César Jimenez | 558148 | [@roji-menez](https://github.com/roji-menez) |

> **Turma:** 3º ano — Engenharia de Software FIAP
> **Disciplina:** Mobile Development & IoT — Prof. Hércules Ramos
> **Sprint:** 1 (única do semestre) — entrega 24/05/2026

---

## 3. Demonstração Visual

> **Atenção avaliador:** todas as prints abaixo foram tiradas do app rodando via Expo (web target), com dados reais vindos do `forward-api-java` em produção (Fly.io). Cada tela é mostrada em modo **escuro** e **claro** para comprovar o suporte dual ao tema.

### 3.1 Fluxo principal em GIF

Demonstração do caminho feliz: **Login → Home (KPIs + leads do dia) → Leads (lista filtrada) → Detalhe do Lead → Perfil**.

![Demo do fluxo principal](docs/screenshots/demo-flow.gif)

📁 [`docs/screenshots/`](docs/screenshots/)

### 3.2 Login

O atendente entra com seu email corporativo. A validação é inline; erros vêm como toast no topo. A logomarca **FORD** e o nome **ForwardService** aparecem em tipografia serif (Fraunces) para reforçar a identidade do produto.

| Dark | Light |
|------|-------|
| ![Login escuro](docs/screenshots/01-login-dark.png) | ![Login claro](docs/screenshots/01-login-light.png) |

### 3.3 Home (Dashboard)

Saudação contextual ("Boa tarde, Avaliador") + dois KPIs que respondem "o que eu preciso fazer hoje?": **Leads Ativos** (quantos casos abertos atribuídos a mim) e **Pipeline** (valor estimado em BRL — formatado em "k"/"M" para evitar overflow). Lista de leads recentes ordenada por prioridade, cada card mostrando **nome do cliente** em destaque (não o VIN cru) e **razão humanizada** (ex: "Sumiu da rede oficial há mais de 90 dias", em vez de "Auto-generated from churn score v0.1").

| Dark | Light |
|------|-------|
| ![Home escura](docs/screenshots/02-home-dark.png) | ![Home clara](docs/screenshots/02-home-light.png) |

### 3.4 Leads

Lista completa com 4 filtros via chips (mostram contagem em tempo real) e busca por VIN ou motivo. Cada card mostra prioridade colorida (ALTA / CRÍTICA / MÉDIA / BAIXA), **nome do cliente**, VIN como subtítulo, razão humanizada, status e pipeline esperado.

| Dark | Light |
|------|-------|
| ![Leads escura](docs/screenshots/03-leads-dark.png) | ![Leads clara](docs/screenshots/03-leads-light.png) |

### 3.5 Detalhe do Lead (Vista 360 v1)

**Nome do cliente em destaque** (Fraunces grande), badges de prioridade e status, VIN como linha secundária, "Por que este lead" (razão humanizada do score), pipeline esperado. As três ações de outreach ficam num footer fixo: **Ligar**, **Mensagem**, **Marcar contato**.

| Dark | Light |
|------|-------|
| ![Detalhe escuro](docs/screenshots/04-lead-detail-dark.png) | ![Detalhe claro](docs/screenshots/04-lead-detail-light.png) |

### 3.6 Perfil

Avatar circular com badge de upload (toca para abrir Câmera ou Galeria), nome amigável + email, toggle de **Modo escuro** com opção "Usar tema do sistema", picker de **Idioma** (PT-BR / EN) e ação destrutiva de **Sair**.

| Dark | Light |
|------|-------|
| ![Perfil escuro](docs/screenshots/05-profile-dark.png) | ![Perfil claro](docs/screenshots/05-profile-light.png) |

---

## 4. Como Rodar o Projeto

### 4.1 Pré-requisitos

| Ferramenta | Versão mínima | Notas |
|------------|---------------|-------|
| Node.js | 18 LTS ou 20 LTS | Verifique com `node --version` |
| npm | 9+ | Já vem com Node 18+ |
| Git | qualquer recente | Para clonar o repo |
| Expo Go (device físico) | última versão | Android Play Store ou iOS App Store — device precisa estar no **mesmo Wi-Fi** do computador |
| Chrome / Edge / Safari | qualquer recente | Para o caminho mais rápido (`npm run web`) |

**Opcional (só para emuladores):**

| Ferramenta | Quando precisa |
|------------|----------------|
| Android Studio + AVD | Se quiser rodar em emulador Android |
| Xcode + Simulator | macOS apenas, se quiser rodar em iOS Simulator |

> **Bom saber:** nenhum SDK nativo (Android/iOS) é necessário para rodar via **Expo Go** ou **web**. O caminho mais rápido leva menos de 2 minutos em qualquer sistema operacional.

### 4.2 Caminho mais rápido — Expo Go + backend de produção (recomendado)

```bash
# 1. Clonar o repositório
git clone https://github.com/fwd-ford/forward-mobile.git
cd forward-mobile

# 2. Instalar dependências
npm install

# 3. Iniciar o Expo dev server
npm run start
```

Sem nenhum `.env`, o app aponta para a API em produção (`https://forward-api-java.fly.dev`) e para o projeto Supabase oficial. **Funciona out-of-the-box** para qualquer avaliador.

**Como abrir no celular:**

1. Instale o **Expo Go** (Play Store / App Store)
2. Garanta que o celular está no **mesmo Wi-Fi** do PC
3. Abra o Expo Go e escaneie o QR code que apareceu no terminal (Android) ou use a Câmera do iOS

### 4.3 Caminho alternativo — Web (sem celular)

```bash
npm install
npm run web
# abre http://localhost:8081
```

Útil para avaliadores que não querem instalar o Expo Go. **Limitações:** o `expo-secure-store` cai em fallback (localStorage), e algumas APIs nativas como push notifications não estão disponíveis.

### 4.4 Caminho alternativo — Emulador Android

```bash
npm install
npm run android     # exige Android Studio com um AVD aberto
```

### 4.5 Caminho alternativo — iOS Simulator (macOS apenas)

```bash
npm install
npm run ios         # exige Xcode com Simulator aberto
```

### 4.6 Apontando para backend local (opcional)

Para apontar o app para uma instância local do `forward-api-java`:

```bash
cp .env.example .env
```

Edite `.env` conforme o cenário:

| Cenário | `EXPO_PUBLIC_API_URL` |
|---------|----------------------|
| Web ou iOS Simulator | `http://localhost:8080` |
| Android Emulator | `http://10.0.2.2:8080` |
| Expo Go em device físico | `http://<IP-do-PC>:8080` (ex: `http://192.168.1.42:8080`) |
| Docker compose (forward-infra) | `http://<IP-do-PC>:18080` |

Depois: `npm run start -- --clear` (o cache do Metro precisa de reset quando `.env` muda).

### 4.7 Credenciais de teste

> _Para o avaliador testar o app sem precisar criar conta:_

| Email | Senha |
|-------|-------|
| `teste@gmail.com` | `teste123` |

Esta conta foi pré-provisionada com nome **"Avaliador FIAP"** e tem acesso de leitura aos leads de demonstração que aparecem na Home e na lista. Suficiente para validar o fluxo principal mostrado no GIF acima.

Caso prefira, criar uma conta nova pelo próprio app também funciona — o Supabase Auth cuida do signup e o app provisiona um profile vazio automaticamente.

---

## 5. Decisões Técnicas

### 5.1 Stack escolhida e justificativa

| Camada | Tecnologia | Por que essa? |
|--------|------------|---------------|
| Framework | **React Native via Expo (SDK 55, managed workflow)** | Spec da disciplina exige React Native + Expo. Managed workflow elimina prebuild local — o app instala e roda em qualquer máquina sem Xcode/Android Studio configurado. |
| Linguagem | **TypeScript strict mode** | Tipos catch bugs em refatorações e a API tipada (`lib/api.ts`) garante que nenhum endpoint quebra silenciosamente. |
| Navegação | **Expo Router** com typed routes | File-based routing reduz boilerplate de configuração. Typed routes evitam erros de navegação em tempo de compilação. |
| Estado | **React Context API** (auth, theme, i18n) + estado local | Sem Redux/Zustand — o escopo do Sprint 1 não justifica o overhead. Contextos resolvem com 0 dependências extras. |
| Auth | **Supabase Auth** com `expo-secure-store` | Auth gerenciado pelo Supabase reduz superfície de segurança crítica. Token persistido encriptado no Keychain (iOS) ou Keystore (Android). |
| Storage local | **AsyncStorage** (tema, locale) + **SecureStore** (token) | Princípio: dado sensível vai pro SecureStore; preferência vai pro AsyncStorage. |
| Estilo | **StyleSheet do RN + theme tokens** em `lib/theme.ts` | Sem styled-components/Tailwind — StyleSheet é otimizado em runtime e mantém o bundle enxuto. Tokens centralizados garantem consistência. |
| i18n | **i18next + react-i18next** | Padrão de facto no ecossistema React. Detecção automática de locale (`navigator.language` no web, `NativeModules` em mobile). |
| Tipografia | **`@expo-google-fonts/fraunces` + `@expo-google-fonts/inter`** | Carregamento via `useFonts()` cacheia após primeiro load. Fraunces (serif) para títulos, Inter (sans) para corpo. |
| Backend principal | **`forward-api-java`** (Spring Boot 3, hospedado em Fly.io) | Backend oficial do projeto. App consome via REST tipado. |
| Backend secundário | **Supabase** (Auth + Storage + Postgres) | Auth + upload de avatar + tabela de profiles. Aproveitamos o ecossistema BaaS para economizar tempo no Sprint 1. |

### 5.2 Estrutura do projeto

```text
forward-mobile/
├── app/                          # Rotas (Expo Router file-based)
│   ├── (tabs)/                   # Bottom tab navigator
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Home: leads do dia + KPIs + pull-to-refresh
│   │   ├── leads.tsx             # Lista filtrada de leads
│   │   └── profile.tsx           # Perfil: avatar + tema + locale + sair
│   ├── lead/[id].tsx             # Detalhe do lead (Vista 360 v1)
│   ├── login.tsx                 # Tela de autenticação
│   └── _layout.tsx               # Root stack + providers (theme, i18n, auth)
│
├── components/
│   ├── ui/                       # Primitivos genéricos e reutilizáveis
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── GlassSurface.tsx      # Primitivo de superfície "Glass Minimalist"
│   │   ├── ScreenHeader.tsx
│   │   ├── ErrorBanner.tsx       # Erro reutilizável com retry
│   │   └── FooterAction.tsx
│   └── domain/                   # Componentes acoplados ao domínio Ford
│       ├── LeadCard.tsx
│       └── MetricCard.tsx
│
├── context/                      # Providers globais (Auth, Theme, i18n)
│
├── lib/
│   ├── api.ts                    # Cliente tipado pro forward-api-java (auto-attach + auto-refresh em 401)
│   ├── supabase.ts               # Cliente Supabase com SecureStore como adapter
│   ├── auth.ts                   # useSession() hook + sign in/out
│   ├── theme.ts                  # Tokens (cores, spacing, radius, tipografia)
│   ├── format.ts                 # Helper canônico para moeda BRL
│   ├── displayName.ts            # Friendly name (full_name → email → "Bem-vindo")
│   ├── customer.ts               # Lookup de customer via Supabase (placeholder até API expor)
│   └── demo-data.ts              # Overlay Sprint 1: humaniza razões + nomes + leads sintéticos extras
│
├── hooks/                        # Hooks customizados
│
├── i18n/
│   ├── index.ts                  # Bootstrap + detecção de locale
│   ├── en.json
│   └── pt-BR.json
│
├── docs/
│   ├── screenshots/              # Prints de todas as telas (Demonstração Visual)
│   └── SETUP_PROFILES_AVATARS.md # Migration do bucket de avatars no Supabase
│
├── assets/                       # Ícones, splash, fontes
├── app.json / app.config.js      # Manifest do Expo
├── package.json
├── tsconfig.json                 # strict mode + path alias @/*
└── README.md
```

### 5.3 Integrações com APIs externas

#### `forward-api-java` (REST)

Endpoint base configurável via `EXPO_PUBLIC_API_URL`. Cliente em [`lib/api.ts`](lib/api.ts) usa `fetch` com:

- **Auto-attach do bearer token** — toda request puxa o token via `getAccessToken()` do contexto de auth. Isso elimina a classe de bugs "esqueci de passar o token" (que era a causa do P0 de auth no Lead Detail).
- **Tipagem completa** das responses com `interface` por endpoint.
- **Tratamento centralizado de erro** — status >= 400 vira erro tipado com mensagem amigável.

Endpoints consumidos no Sprint 1:

- `GET /leads` — lista paginada de leads
- `GET /leads/{id}` — detalhe de um lead
- `GET /customers/{id}` — enrichment do cliente

#### Supabase (Auth + Storage + Postgres)

- **Auth:** `signInWithPassword`, `signOut`, sessão persistida com adapter customizado para `expo-secure-store`.
- **Storage:** bucket `avatars` para upload de foto de perfil (Câmera ou Galeria via `expo-image-picker`).
- **Postgres direto:** tabela `profiles` lida pelo app via SDK. Outras leituras (customers, leads) passam pela API Java — Supabase direto serve só para dados de perfil do próprio usuário, respeitando RLS.

#### CORS / TLS

API Java tem `ALLOWED_ORIGINS` configurado para incluir `http://localhost:8081` (web dev) e o domínio Fly.io. TLS é gerenciado pelo Fly. App nunca faz request via HTTP em produção.

### 5.4 Decisões arquiteturais relevantes

1. **Sem dependência de backend para rodar localmente** — qualquer dev pode `npm install && npm start` e ver o app funcionando porque o default aponta para produção. Onboarding zero-friction.

2. **Glass Minimalist como design system próprio** — em vez de usar uma UI lib como NativeBase ou React Native Paper, construímos primitivos próprios (`GlassSurface`, `Card`, `Badge`, `Button`) baseados em tokens centralizados em `lib/theme.ts`. Isso garante identidade visual única e evita o "app genérico de tutorial".

3. **Tipografia serif intencional** — usar Fraunces (serif) nos títulos foi uma decisão estética para diferenciar o app de SaaS genéricos. A Ford tem identidade premium; o app reflete isso.

4. **Detecção de locale automática + override manual** — o app respeita o idioma do device por padrão, mas dá ao usuário a opção de forçar PT/EN no Perfil. Salva no AsyncStorage para persistir entre sessões.

5. **Pull-to-refresh em vez de WebSocket** — para o escopo do Sprint 1, refetch sob demanda é suficiente e mais simples de auditar. WebSocket para updates em tempo real entra no Sprint 2.

6. **Helpers canônicos em `lib/`** — `formatBRL`, `ACTIVE_LEAD_STATUSES`, `friendlyDisplayName` foram extraídos depois que viramos a primeira rodada de QA. Antes estavam duplicados; agora são fonte única de verdade. Aprendizado: a duplicação aparece rápido quando se tem 5 telas, vale a pena refatorar cedo.

7. **Overlay de enriquecimento de dados (`lib/demo-data.ts`)** — o backend Java do Sprint 1 entrega razões genéricas (`Auto-generated from churn score v0.1`) e não expõe nome do cliente na payload de listagem. Pro avaliador, isso vira "demo técnica" em vez de "produto que faz sentido". Decidimos criar um overlay client-side que: (a) humaniza a razão com base na prioridade do lead, (b) deriva um nome plausível a partir do `customer_id` via hash determinístico, (c) adiciona leads sintéticos extras pra dar variedade de cenários na demo. Quando o backend expuser dados reais, basta dropar a chamada `enrichLeads()` em `api.ts` e o overlay desaparece.

8. **Auto-refresh de token em 401** — `lib/api.ts` detecta `401 Unauthorized` em qualquer request, força `supabase.auth.refreshSession()` e tenta UMA vez de novo com o novo token. Resolve o race condition clássico em que o token vence mid-sessão (ou após retorno de background) e o SDK ainda não refreshou. Falha em 401 persistente propaga normalmente.

### 5.5 Qualidade — verificação local

```bash
npx tsc --noEmit       # type check (sem build)
npm run lint           # ESLint
```

CI roda **Gitleaks** em todo push para impedir vazamento de credenciais. Type check é validado em cada PR.

---

## 6. Próximos Passos

Funcionalidades planejadas para sprints futuros (Sprint 2+):

### Curto prazo (Sprint 2)

- [ ] **Vista 360 completa** — histórico de manutenção do veículo, valor médio de ticket, último contato registrado
- [ ] **WhatsApp via N8N** — botão "Mensagem" dispara workflow no N8N que envia mensagem pelo número oficial da concessionária
- [ ] **Marcar contato** persistido — histórico de outreach gravado e visível para o atendente seguinte
- [ ] **Push notifications** via `expo-notifications` — atendente recebe alerta quando lead crítico cai na sua fila
- [ ] **Modo offline** com `@tanstack/react-query` — leitura de leads em cache para situações de Wi-Fi instável na concessionária

### Médio prazo (Sprint 3+)

- [ ] **Modo cliente final** — interface separada para o dono do veículo, com agendamento, status de revisão e Ford Care
- [ ] **Onboarding interativo** — 3 slides explicando o uso na primeira abertura
- [ ] **Biometria** (`expo-local-authentication`) — desbloqueio rápido com Face ID / Touch ID
- [ ] **Métricas individuais** — dashboard pessoal do atendente: leads recuperados, ticket médio, taxa de conversão
- [ ] **Tema dinâmico por concessionária** — co-branding leve via env

### Diferenciais técnicos planejados

- [ ] **Compartilhamento de relatório** via `expo-sharing` (PDF do lead para enviar ao gestor)
- [ ] **Acelerômetro** para gesture "shake to refresh" em telas de listagem (já que o spec valoriza uso de sensores)
- [ ] **Geolocalização** (`expo-location`) — sugerir leads próximos à concessionária

---

## 7. Apêndice — Conventions & Troubleshooting

### 7.1 Convenções de código

- **User-facing strings sempre via `t("key")`** — nunca hardcoded. Quebra o i18n se for hardcoded.
- **Imports via alias `@/...`** — configurado em `tsconfig.json`. Evita `../../../`.
- **Componentes tipados com interface explícita** — nada de `any`.
- **Decisões de design vivem em `lib/theme.ts`** — editar lá, não inline.
- **Helpers canônicos:**
  - `formatBRL(value)` para moeda
  - `ACTIVE_LEAD_STATUSES` (Set canônico de status ativos)
  - `friendlyDisplayName({ fullName, email })` para greeting
  - `toFriendlyFirstName(name)` para primeiro nome

### 7.2 Troubleshooting

| Sintoma | Causa provável | Fix |
|---------|---------------|-----|
| Expo Go mostra "Network response timed out" | Device em Wi-Fi diferente do PC | Verificar mesma rede; usar IP LAN em `.env` |
| App carrega mas "Não autenticado" | `EXPO_PUBLIC_API_URL` errado ou backend off | `curl <API_URL>/health` → deve retornar `{"status":"UP"}` |
| Fontes Fraunces/Inter não carregam | Conexão lenta no primeiro load | Pull-to-refresh em qualquer tela; `useFonts()` cacheia |
| Cor errada após trocar tema | Cache do Metro | `npm run start -- --clear` |
| Web em Windows mostra fonte serif estranha em KPIs | `SF Mono` / `JetBrains Mono` não instaladas localmente | Fallback usa Consolas (Win11) ou monospace genérico — esperado |
| Hot reload não funciona em emulador Android | Porto bloqueado | `adb reverse tcp:8081 tcp:8081` |
| CORS error no web | Backend não tem `http://localhost:8081` em `ALLOWED_ORIGINS` | Adicionar no `.env` do `forward-api-java` |

### 7.3 Configuração de ambiente

Toda env var é opcional. Default aponta para produção (veja `app.config.js`).

| Variável | Default | Quando setar |
|----------|---------|--------------|
| `EXPO_PUBLIC_API_URL` | `https://forward-api-java.fly.dev` | Backend local ou staging |
| `EXPO_PUBLIC_SUPABASE_URL` | `https://ysewoopjgdpvnkfhffgy.supabase.co` | Outro projeto Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | embarcado em `app.json:extra` | Outro projeto Supabase |

`.env` está em `.gitignore`. O `app.json` carrega a anon key publicável da Supabase — ok comitar (é a chave anon, não service role).

### 7.4 Repositórios relacionados

| Repo | Função |
|------|--------|
| [`forward-api-java`](https://github.com/fwd-ford/forward-api-java) | Backend REST + SOAP (Spring Boot 3) que este app consome |
| [`forward-ml`](https://github.com/fwd-ford/forward-ml) | Pipeline de ML — segmentação + churn score |
| [`forward-web`](https://github.com/fwd-ford/forward-web) | Dashboard analítico web (SvelteKit) — visão do gestor |
| [`forward-infra`](https://github.com/fwd-ford/forward-infra) | Migrations SQL + docker compose para ambiente local |
| [`forward-docs`](https://github.com/fwd-ford/forward-docs) | Documentação acadêmica, OpenAPI mirror, ADRs |

### 7.5 Histórico de QA

Três rodadas de QA foram executadas com Playwright (web target), pegando 6 P0 + 8 P1 + 6 P2 ao longo do Sprint 1. Todos os P0 e P1 foram fechados antes da entrega. Relatórios:

- [`docs/superpowers/UX_QA_REPORT.md`](docs/superpowers/UX_QA_REPORT.md) — round 1 (pré-fixes)

### 7.6 Postura de segurança no client (XSS e validação de entrada)

Resumo da análise de superfície XSS no mobile, complementar à disciplina de Cybersecurity (que cobra "Segurança de Entrada e Validação de Dados" — 20 pts).

**O app não é estruturalmente vulnerável a XSS porque:**

| Vetor clássico de XSS | Como o app trata |
|-----------------------|------------------|
| Prop `dangerouslySet`-`InnerHTML` (React) | **Não usado** em nenhum arquivo do repo (validado via grep) |
| Manipulação direta de `innerHTML` / `outerHTML` | **Não usados** |
| `WebView` carregando HTML externo | **Sem dependência** (`react-native-webview` não está no `package.json`) |
| Render de HTML cru / markdown não sanitizado | **Sem dependência** (sem `react-native-render-html`, sem libs de markdown) |
| Strings de usuário em `<Text>` JSX | **Auto-escape do React** — `{value}` nunca é interpretado como HTML |
| Atributos `href` / `src` com input do user | App não monta URLs com input livre; `tel:` recebe número validado do `customer.phone` (backend), não do usuário |

**Defesa em profundidade (validação de entrada):**

- **Email no login** ([`lib/validation.ts:17`](lib/validation.ts#L17)): regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` rejeita payloads tipo `<script>@evil.com` (espaço / `<` quebram o formato).
- **Limite de tamanho (`maxLength`)** em todos os `TextInput`:
  - Email: 254 chars (RFC 5321)
  - Senha: 128 chars (cobre passphrase longa; Supabase trunca em 72 internamente)
  - Busca em Leads: 80 chars (VIN tem 17, motivo curto cabe)
- **Trim antes de enviar pro backend** ([`app/login.tsx:99`](app/login.tsx#L99)): `email.trim()` impede whitespace exploit em providers permissivos.
- **Storage de credenciais sensíveis em `expo-secure-store`** (Keychain iOS / Keystore Android), não em AsyncStorage.

**Limites assumidos (fora do escopo do client):**

- Validação anti-SQLi / sanitização de strings persistidas é responsabilidade do **`forward-api-java`** (Spring Data JPA já parametriza queries por padrão).
- Stored XSS via dados retornados pela API ainda assim seria mitigado pelo auto-escape do React no client.

**Próximos passos sugeridos** (Sprint 2):

- Adicionar **rate limiting** no login client-side (delay exponencial após 3 falhas) — complementa proteção de credential stuffing já existente no Supabase.
- Adicionar **Content Security Policy** explícita no `app.config.js` quando o target web for produção.

---

## Licença

Projeto acadêmico — Challenge Ford × FIAP 2026. Uso restrito à avaliação da disciplina.
