// Offline demo store. Powers "Modo demonstracao": the whole app (login ->
// home -> leads -> lead detail -> actions -> profile) works without network,
// with the same shapes returned by forward-api-java. Mutations (status
// changes) live in memory for the session, so the funnel can be exercised.
//
// Armazenamento offline do modo demonstracao. Mesmos formatos da API; as
// mudancas de status ficam em memoria durante a sessao.

import type { ChurnScore, Lead, Vehicle } from "./api";
import type { Customer } from "./customer";
import type { SessionUser } from "./session";

export const DEMO_USER: SessionUser = {
  id: "demo-user-maria",
  name: "Maria Souza",
  email: "maria.demo@forward.dev",
  role: "ATENDENTE",
  dealer_id: "demo-dealer-01",
  dealer_name: "Ford Pinheiros (demo)",
};

// Pool of plausible Brazilian names, used when a payload has no customer name.
// Pool de nomes usado quando a API nao expoe o nome do cliente.
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

const REASONS_BY_PRIORITY: Record<Lead["priority"], string[]> = {
  critical: [
    "Sumiu da rede oficial há mais de 90 dias após a última revisão",
    "Pulou a 2ª revisão programada, risco alto de abandono",
    "Cliente em silêncio há 4 meses, histórico de baixo engajamento",
  ],
  high: [
    "Passou da revisão de 30 mil km há 45 dias sem agendamento",
    "Histórico de atraso recorrente nas manutenções programadas",
    "Última revisão foi feita fora da rede oficial, possível migração",
  ],
  medium: [
    "Próximo da revisão dos 20 mil km, janela ideal de contato",
    "Última visita há 6 meses, padrão regular de retorno",
    "Sensível a preço, requer abordagem com oferta comercial",
  ],
  low: [
    "Cliente fiel, próximo da próxima revisão programada",
    "Engajamento consistente, baixo risco de churn",
  ],
};

// FNV-1a: deterministic pick from a pool (same id -> same result).
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function customerNameFor(customerId: string | undefined | null): string {
  if (!customerId) return "Cliente Ford";
  return NAMES[hash(customerId) % NAMES.length]!;
}

/** Keeps real reasons; replaces the generic ML placeholder with a business sentence. */
export function humanizeReason(lead: Lead): string {
  const original = lead.reason ?? "";
  if (original && !original.startsWith("Auto-generated")) return original;
  const pool = REASONS_BY_PRIORITY[lead.priority];
  return pool[hash(lead.id) % pool.length]!;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

type DemoSeed = Omit<Lead, "created_at" | "dealer_id"> & { ageDays: number; phone: string | null };

const SEED: DemoSeed[] = [
  {
    id: "b41c2d9e-3a7f-4c11-9e02-6d1f0a7c5b01", customer_id: "c-demo-001", customer_name: "Mariana Silva", vin: "9BFZZZ5SZJB101205",
    vehicle_model: "Ranger XLS", vehicle_year: 2021, priority: "critical", status: "new",
    reason: "Sumiu da rede oficial há mais de 90 dias após a última revisão",
    expected_value_brl: 2800, churn_probability: 0.91, segment: "abandono", ageDays: 1, phone: "+5511900000001",
  },
  {
    id: "7e05f3a1-9c2b-4e8d-a1f4-2b6c8d0e1f02", customer_id: "c-demo-002", customer_name: "Carlos Eduardo Santos", vin: "9BFZZZ5SZJB104812",
    vehicle_model: "Territory Titanium", vehicle_year: 2022, priority: "critical", status: "assigned",
    reason: "Pulou a 2ª revisão programada, risco alto de abandono",
    expected_value_brl: 3500, churn_probability: 0.87, segment: "abandono", ageDays: 2, phone: "+5511900000002",
  },
  {
    id: "c93b8e72-1d4a-4f6b-8c3e-5a7b9d1f2e03", customer_id: "c-demo-003", customer_name: "Ana Beatriz Costa", vin: "9BFZZZ5SZJB107334",
    vehicle_model: "Bronco Sport Wildtrak", vehicle_year: 2022, priority: "high", status: "new",
    reason: "Passou da revisão de 30 mil km há 45 dias sem agendamento",
    expected_value_brl: 1850, churn_probability: 0.74, segment: "esquecido", ageDays: 3, phone: "+5511900000003",
  },
  {
    id: "2d6a41f0-8e3c-4b7a-9d15-3c5e7f9a1b04", customer_id: "c-demo-004", customer_name: "Pedro Henrique Lima", vin: "9BFZZZ5SZJB108991",
    vehicle_model: "Ka SE 1.0", vehicle_year: 2019, priority: "high", status: "contacted",
    reason: "Última revisão foi feita fora da rede oficial, possível migração",
    expected_value_brl: 4200, churn_probability: 0.69, segment: "economico", ageDays: 5, phone: null,
  },
  {
    id: "e8710c5b-4f2d-4a9e-b6c1-7d9f1b3c5e05", customer_id: "c-demo-005", customer_name: "Juliana Ferreira", vin: "9BFZZZ5SZJB110458",
    vehicle_model: "Maverick Lariat", vehicle_year: 2023, priority: "medium", status: "new",
    reason: "Próximo da revisão dos 20 mil km, janela ideal de contato",
    expected_value_brl: 1200, churn_probability: 0.48, segment: "fiel", ageDays: 7, phone: "+5511900000005",
  },
  {
    id: "5fa2d8c3-6b1e-4d7f-a3c9-9e1b3d5f7a06", customer_id: "c-demo-006", customer_name: "Rafael Oliveira", vin: "9BFZZZ5SZJB111027",
    vehicle_model: "EcoSport Freestyle", vehicle_year: 2020, priority: "medium", status: "new",
    reason: "Sensível a preço, requer abordagem com oferta comercial",
    expected_value_brl: 950, churn_probability: 0.52, segment: "economico", ageDays: 9, phone: "+5511900000006",
  },
  {
    id: "91c4e6b7-2a8f-4c3d-8e5b-1f3a5c7e9b07", customer_id: "c-demo-007", customer_name: "Camila Rodrigues", vin: "9BFZZZ5SZJB112881",
    vehicle_model: "Ranger Raptor", vehicle_year: 2024, priority: "low", status: "new",
    reason: "Cliente fiel, próximo da próxima revisão programada",
    expected_value_brl: 850, churn_probability: 0.18, segment: "fiel", ageDays: 12, phone: "+5511900000007",
  },
  {
    id: "4b8d0a2e-7c5f-4e1a-9b3d-8a0c2e4f6d08", customer_id: "c-demo-008", customer_name: "Bruno Almeida", vin: "9BFZZZ5SZJB113540",
    vehicle_model: "Transit Furgão", vehicle_year: 2021, priority: "high", status: "converted",
    reason: "Frota com revisão vencida, contato comercial realizado",
    expected_value_brl: 5400, churn_probability: 0.63, segment: "esquecido", ageDays: 15, phone: "+5511900000008",
  },
  {
    id: "d27f9c16-3e8b-4a5c-b7d2-4c6e8a0b2f09", customer_id: "c-demo-009", customer_name: "Larissa Martins", vin: "9BFZZZ5SZJB114112",
    vehicle_model: "Mustang Mach-E", vehicle_year: 2023, priority: "medium", status: "lost",
    reason: "Cliente mudou de cidade, sem concessionária próxima",
    expected_value_brl: 1500, churn_probability: 0.58, segment: "abandono", ageDays: 20, phone: null,
  },
];

let leads: Lead[] = [];
let customers: Record<string, Customer> = {};

/** Restores the pristine demo dataset (called on every demo sign-in). */
export function resetDemoData(): void {
  leads = SEED.map(({ ageDays, phone: _phone, ...rest }) => ({
    ...rest,
    dealer_id: DEMO_USER.dealer_id ?? undefined,
    created_at: daysAgo(ageDays),
  }));
  customers = Object.fromEntries(
    SEED.map((s) => [
      s.customer_id,
      {
        id: s.customer_id,
        full_name: s.customer_name ?? customerNameFor(s.customer_id),
        phone: s.phone,
        opt_in_whatsapp: s.phone !== null,
      },
    ]),
  );
}
resetDemoData();

export function demoListLeads(params: { status?: Lead["status"]; limit?: number } = {}): Lead[] {
  const filtered = params.status ? leads.filter((l) => l.status === params.status) : leads;
  return filtered.slice(0, params.limit ?? filtered.length).map((l) => ({ ...l }));
}

export function demoGetLead(id: string): Lead | null {
  const found = leads.find((l) => l.id === id);
  return found ? { ...found } : null;
}

export function demoUpdateLead(id: string, patch: Partial<Pick<Lead, "status" | "notes">>): Lead | null {
  const idx = leads.findIndex((l) => l.id === id);
  if (idx < 0) return null;
  const updated: Lead = { ...leads[idx]!, ...patch, updated_at: new Date().toISOString() };
  leads[idx] = updated;
  return { ...updated };
}

export function demoGetCustomer(id: string): Customer | null {
  return customers[id] ? { ...customers[id]! } : null;
}

export function demoGetScore(customerId: string): ChurnScore | null {
  const lead = leads.find((l) => l.customer_id === customerId);
  if (!lead || lead.churn_probability == null) return null;
  return {
    id: `score-${customerId}`,
    customer_id: customerId,
    vin: lead.vin,
    model_version: "demo-v3",
    segment: (lead.segment ?? "fiel") as ChurnScore["segment"],
    churn_probability: lead.churn_probability,
    confidence: 0.8,
    computed_at: lead.created_at,
  };
}

export function demoGetVehicle(vin: string): Vehicle | null {
  const lead = leads.find((l) => l.vin === vin);
  if (!lead) return null;
  return {
    vin,
    customer_id: lead.customer_id,
    model: lead.vehicle_model ?? "Ford",
    year: lead.vehicle_year ?? 2022,
    discontinued: /Ka|EcoSport/.test(lead.vehicle_model ?? ""),
  };
}
