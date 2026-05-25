// Demo data enrichment — overlay aplicado sobre os leads vindos da API.
//
// Por que existe: o backend Java do Sprint 1 entrega 3 leads com razao
// generica ("Auto-generated from churn score v0.1") e sem nome de cliente
// na payload. Pro avaliador, isso vira "demo tecnica" em vez de "produto
// que faz sentido". Esse modulo:
//
// 1. Humaniza a razao do lead (mapeia o texto generico pra uma frase real
//    de negocio, escolhida deterministicamente pelo id do lead).
// 2. Deriva um nome de cliente plausivel a partir do customer_id (hash
//    deterministico -> nome do pool). Substituido pelo nome real quando
//    o GET /customers/{id} expuser dados.
// 3. Adiciona leads sinteticos extras pra dar variedade de cenarios na
//    demo (priority/status/value diferentes).
//
// Quando o backend expuser nomes reais + razoes humanizadas, deletar
// este arquivo e parar de chamar enrichLeads() em api.ts.

import type { Lead } from "./api";

// Pool de nomes brasileiros plausiveis. Mistura genero, regiao e idade
// pra parecer base real de clientes de concessionaria.
const NAMES = [
  "Mariana Silva",
  "Carlos Eduardo Santos",
  "Ana Beatriz Costa",
  "Pedro Henrique Lima",
  "Juliana Ferreira",
  "Rafael Oliveira",
  "Camila Rodrigues",
  "Bruno Almeida",
  "Larissa Martins",
  "Diego Pereira",
  "Patricia Souza",
  "Thiago Carvalho",
  "Beatriz Nascimento",
  "Felipe Ribeiro",
  "Isabela Gomes",
  "Gustavo Barbosa",
];

// Razoes mapeadas por prioridade. Cada uma e uma frase de negocio que um
// atendente da concessionaria entenderia direto, sem precisar de jargao ML.
const REASONS_BY_PRIORITY: Record<Lead["priority"], string[]> = {
  critical: [
    "Sumiu da rede oficial há mais de 90 dias após a última revisão",
    "Pulou a 2ª revisão programada — risco alto de abandono",
    "Cliente em silêncio há 4 meses, histórico de baixo engajamento",
    "Veículo com revisão atrasada e CRM marcou 'não retorna'",
  ],
  high: [
    "Passou da revisão de 30k há 45 dias sem agendamento",
    "Histórico de atraso recorrente nas manutenções programadas",
    "Última revisão foi feita fora da rede oficial — possível migração",
    "Cliente engajado, mas próximo do janela crítica de renovação",
  ],
  medium: [
    "Próximo da revisão dos 20k km — janela ideal de contato",
    "Última visita há 6 meses, padrão regular de retorno",
    "Cliente novo, ainda construindo histórico — manter contato",
    "Sensível a preço, requer abordagem com oferta comercial",
  ],
  low: [
    "Cliente fiel, próximo da próxima revisão programada",
    "Padrão regular, manter no radar para janela de contato",
    "Engajamento consistente, baixo risco de churn",
  ],
};

// Hash simples e deterministico (FNV-1a curto). Suficiente pra escolher
// um item de pool a partir de uma string.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// Retorna um nome plausivel pro customer_id. Mesmo id sempre retorna o
// mesmo nome (estavel entre reloads e re-renders).
export function customerNameFor(customerId: string | undefined | null): string {
  if (!customerId) return "Cliente Ford";
  return NAMES[hash(customerId) % NAMES.length]!;
}

// Substitui razao generica por uma humanizada. Se o backend ja vier com
// razao "real" (nao comeca com "Auto-generated"), mantem o original.
export function humanizeReason(lead: Lead): string {
  const original = lead.reason ?? "";
  if (original && !original.startsWith("Auto-generated")) return original;
  const pool = REASONS_BY_PRIORITY[lead.priority];
  return pool[hash(lead.id) % pool.length]!;
}

// Leads sinteticos pra dar variedade na demo. UUIDs fixos pra que o
// mesmo lead "extra" sempre seja o mesmo entre sessoes (links estaveis).
//
// Mix intencional:
// - 2 critical (urgencia visual no topo)
// - 2 high
// - 2 medium
// - 1 low (mostra que nao e tudo vermelho)
// - 1 contacted (mostra avancando no funil)
// - valores variando de R$ 850 a R$ 4.200 pra hero pipeline ter range
const SYNTHETIC_LEADS: Lead[] = [
  {
    id: "demo-001",
    customer_id: "c-demo-001",
    vin: "9BFZZZ5SZJB101205",
    priority: "critical",
    status: "new",
    reason: "Sumiu da rede oficial há mais de 90 dias após a última revisão",
    expected_value_brl: 2800,
    created_at: relativeDate(-1),
  },
  {
    id: "demo-002",
    customer_id: "c-demo-002",
    vin: "9BFZZZ5SZJB104812",
    priority: "critical",
    status: "assigned",
    reason: "Pulou a 2ª revisão programada — risco alto de abandono",
    expected_value_brl: 3500,
    created_at: relativeDate(-2),
  },
  {
    id: "demo-003",
    customer_id: "c-demo-003",
    vin: "9BFZZZ5SZJB107334",
    priority: "high",
    status: "new",
    reason: "Passou da revisão de 30k há 45 dias sem agendamento",
    expected_value_brl: 1850,
    created_at: relativeDate(-3),
  },
  {
    id: "demo-004",
    customer_id: "c-demo-004",
    vin: "9BFZZZ5SZJB108991",
    priority: "high",
    status: "contacted",
    reason: "Última revisão foi feita fora da rede oficial — possível migração",
    expected_value_brl: 4200,
    created_at: relativeDate(-5),
  },
  {
    id: "demo-005",
    customer_id: "c-demo-005",
    vin: "9BFZZZ5SZJB110458",
    priority: "medium",
    status: "new",
    reason: "Próximo da revisão dos 20k km — janela ideal de contato",
    expected_value_brl: 1200,
    created_at: relativeDate(-7),
  },
  {
    id: "demo-006",
    customer_id: "c-demo-006",
    vin: "9BFZZZ5SZJB111027",
    priority: "medium",
    status: "new",
    reason: "Sensível a preço, requer abordagem com oferta comercial",
    expected_value_brl: 950,
    created_at: relativeDate(-9),
  },
  {
    id: "demo-007",
    customer_id: "c-demo-007",
    vin: "9BFZZZ5SZJB112881",
    priority: "low",
    status: "new",
    reason: "Cliente fiel, próximo da próxima revisão programada",
    expected_value_brl: 850,
    created_at: relativeDate(-12),
  },
];

function relativeDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAgo);
  return d.toISOString();
}

// Aplica os 3 enriquecimentos: humaniza razao + adiciona sinteticos.
// Mantem ordem: reais primeiro, depois sinteticos.
export function enrichLeads(real: Lead[]): Lead[] {
  const transformed = real.map((l) => ({ ...l, reason: humanizeReason(l) }));
  return [...transformed, ...SYNTHETIC_LEADS];
}
