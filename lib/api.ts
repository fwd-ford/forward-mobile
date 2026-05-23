// Typed client for the forward-api-java REST endpoints.
// Cliente tipado para o forward-api-java.

import Constants from "expo-constants";

const baseUrl =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  "http://localhost:18080";

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

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${baseUrl}${path}`, { ...init, headers });
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

export const api = {
  getVehicle: (vin: string, token?: string) => request<Vehicle>(`/api/v1/vehicles/${vin}`, undefined, token),
  listLeads: (params: { dealerId?: string; status?: Lead["status"]; limit?: number } = {}, token?: string) => {
    const qs = new URLSearchParams();
    if (params.dealerId) qs.set("dealer_id", params.dealerId);
    if (params.status) qs.set("status", params.status);
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return request<Lead[]>(`/api/v1/leads${query ? `?${query}` : ""}`, undefined, token);
  },
  getScore: (customerId: string, token?: string) =>
    request<ChurnScore>(`/api/v1/scores/${customerId}`, undefined, token),
};
