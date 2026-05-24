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
4. [Como Rodar o Projeto](#4-como-rodar-o-projeto) _(próximo commit)_
5. [Decisões Técnicas](#5-decisões-técnicas) _(próximo commit)_
6. [Próximos Passos](#6-próximos-passos) _(próximo commit)_
7. [Apêndice — Conventions & Troubleshooting](#7-apêndice--conventions--troubleshooting) _(próximo commit)_

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
| 4 | **Detalhe do Lead (Vista 360 v1)** | ✅ | VIN, prioridade, razão do score, pipeline esperado, ações (Ligar, Mensagem, Marcar contato) |
| 5 | **Perfil do usuário** | ✅ | Avatar com upload (Câmera ou Galeria via `expo-image-picker`), persistência em Supabase Storage |
| 6 | **Tema Dark/Light** | ✅ | Toggle manual + opção "Usar tema do sistema", persistência local em AsyncStorage |
| 7 | **Internacionalização (i18n)** | ✅ | Português (Brasil) por padrão + Inglês, detecção automática do locale do device, picker manual |
| 8 | **Design System "Glass Minimalist"** | ✅ | Tipografia serif (Fraunces) + sans (Inter), paleta Ford Blue, mesh gradient background, primitivo `GlassSurface` |
| 9 | **Pull-to-refresh** | ✅ | Em Home e Leads, com haptic feedback via `expo-haptics` |
| 10 | **Tratamento de erro com retry** | ✅ | `ErrorBanner` reutilizável, toasts em validação de form |

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

> _GIF do fluxo principal (login → home → leads → detalhe → registrar contato) será adicionado aqui antes da gravação do vídeo final._

📁 [`docs/screenshots/`](docs/screenshots/)

### 3.2 Login

O atendente entra com seu email corporativo. A validação é inline; erros vêm como toast no topo. A logomarca **FORD** e o nome **ForwardService** aparecem em tipografia serif (Fraunces) para reforçar a identidade do produto.

| Dark | Light |
|------|-------|
| ![Login escuro](docs/screenshots/01-login-dark.png) | ![Login claro](docs/screenshots/01-login-light.png) |

### 3.3 Home (Dashboard)

Saudação contextual ("Boa tarde, Jvfranco08") + dois KPIs que respondem "o que eu preciso fazer hoje?": **Leads Ativos** (quantos casos abertos atribuídos a mim) e **Pipeline** (valor estimado em BRL — formatado em "k"/"M" para evitar overflow). Lista de leads recentes ordenada por prioridade.

| Dark | Light |
|------|-------|
| ![Home escura](docs/screenshots/02-home-dark.png) | ![Home clara](docs/screenshots/02-home-light.png) |

### 3.4 Leads

Lista completa com 4 filtros via chips (mostram contagem em tempo real) e busca por VIN ou motivo. Cada card mostra prioridade colorida (ALTA / CRÍTICA / MÉDIA / BAIXA), VIN, razão do score, status e pipeline.

| Dark |
|------|
| ![Leads escura](docs/screenshots/03-leads-dark.png) |

> _Print clara de Leads será adicionada antes da entrega final (em geração)._

### 3.5 Detalhe do Lead (Vista 360 v1)

VIN no topo, badges de prioridade e status, "Por que este lead" (razão do score do modelo de ML), pipeline esperado. As três ações de outreach ficam num footer fixo: **Ligar**, **Mensagem**, **Marcar contato**.

| Dark | Light |
|------|-------|
| ![Detalhe escuro](docs/screenshots/04-lead-detail-dark.png) | ![Detalhe claro](docs/screenshots/04-lead-detail-light.png) |

### 3.6 Perfil

Avatar circular com badge de upload (toca para abrir Câmera ou Galeria), nome amigável + email, toggle de **Modo escuro** com opção "Usar tema do sistema", picker de **Idioma** (PT-BR / EN) e ação destrutiva de **Sair**.

| Dark | Light |
|------|-------|
| ![Perfil escuro](docs/screenshots/05-profile-dark.png) | ![Perfil claro](docs/screenshots/05-profile-light.png) |

---

## Licença

Projeto acadêmico — Challenge Ford × FIAP 2026. Uso restrito à avaliação da disciplina.
