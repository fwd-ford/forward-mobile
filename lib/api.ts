// Typed client for the forward-api-java REST endpoints.
// Cliente tipado para o forward-api-java.

import Constants from "expo-constants";

import { getAccessToken } from "./session";
import { supabase } from "./supabase";

// app.config.js writes apiBaseUrl from EXPO_PUBLIC_API_URL or falls back to Fly.
// Esse fallback abaixo so cobre se alguem rodar sem app.config.js (build quebrada).
const baseUrl =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  "https://forward-api-java.fly.dev";

export interface Problem {
  type: string;
  title: string;
  status: number;
  detail?: string;
  code?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  constructor(problem: Problem) {
    super(problem.detail ?? problem.title);
    this.status = problem.status;
    this.code = problem.code;
  }
}

async function doFetch(path: string, init: RequestInit | undefined, token: string | null) {
  const headers = new Headers(init?.headers ?? {});
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${baseUrl}${path}`, { ...init, headers });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Pega o JWT do Supabase a cada request. autoRefreshToken cuida da renovacao,
  // entao chamar aqui sempre devolve o token vivo (ou null se nao logado).
  let token = await getAccessToken();
  let res = await doFetch(path, init, token);

  // 401 com token vivo: provavelmente o token expirou mas o SDK ainda nao
  // refreshou (race tipico apos trocar idioma/voltar do background). Forcamos
  // o refresh e tentamos UMA vez. Se ainda 401, propaga.
  if (res.status === 401 && token) {
    const refreshed = await supabase.auth.refreshSession().catch(() => null);
    const newToken = refreshed?.data.session?.access_token ?? (await getAccessToken());
    if (newToken && newToken !== token) {
      token = newToken;
      res = await doFetch(path, init, token);
    }
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as Problem | null;
    throw new ApiError(
      body ?? { type: "about:blank", title: res.statusText, status: res.status },
    );
  }
  return (await res.json()) as T;
}

// Domain types mirror the forward-api-java DTOs (records under com.fwdford.forwardapi.model).
// Tipos de dominio espelham os DTOs do forward-api-java.

export interface Vehicle {
  vin: string;
  customer_id?: string;
  model: string;
  year: number;
  version?: string;
  color?: string;
  discontinued: boolean;
  purchase_date?: string;
  last_service_at?: string;
}

export interface Lead {
  id: string;
  customer_id: string;
  vin?: string;
  dealer_id?: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "new" | "assigned" | "contacted" | "converted" | "lost" | "expired";
  reason?: string;
  expected_value_brl?: number;
  created_at: string;
}

export type LeadStatus = Lead["status"];

// Active = ainda no funil. Excluir explicitamente os terminais protege contra
// novos status surgirem no backend e silenciosamente quebrarem a contagem.
export const ACTIVE_LEAD_STATUSES: ReadonlySet<LeadStatus> = new Set([
  "new",
  "assigned",
  "contacted",
  "converted",
]);

export interface ChurnScore {
  id: string;
  customer_id: string;
  vin?: string;
  model_version: string;
  segment: "fiel" | "abandono" | "esquecido" | "economico";
  churn_probability: number;
  confidence?: number;
  computed_at: string;
}

// Demo enrichment: o backend Java do Sprint 1 entrega razao generica e nao
// expoe nome do cliente; o enrichLeads adiciona razoes humanas + leads
// sinteticos pra demo. Quando o backend expuser dados reais, dropar o
// import e a chamada abaixo. Ver lib/demo-data.ts.
import { enrichLeads } from "./demo-data";

export const api = {
  getVehicle: (vin: string) => request<Vehicle>(`/api/v1/vehicles/${vin}`),
  listLeads: async (params: { dealerId?: string; status?: Lead["status"]; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.dealerId) qs.set("dealer_id", params.dealerId);
    if (params.status) qs.set("status", params.status);
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    const real = await request<Lead[]>(`/api/v1/leads${query ? `?${query}` : ""}`);
    return enrichLeads(real);
  },
  getScore: (customerId: string) => request<ChurnScore>(`/api/v1/scores/${customerId}`),
};
