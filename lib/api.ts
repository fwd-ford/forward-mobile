// Typed client for the forward-api-java REST endpoints (JWT issued by the API).
// Every call is routed to the offline demo store when the session is "demo".
// Cliente tipado para o forward-api-java; em modo demo usa o store offline.

import Constants from "expo-constants";

import type { Customer } from "./customer";
import {
  DEMO_USER,
  demoGetCustomer,
  demoGetLead,
  demoGetScore,
  demoGetVehicle,
  demoListLeads,
  demoUpdateLead,
  humanizeReason,
} from "./demo-data";
import { canTransition } from "./lead-status";
import { getAccessToken, isDemoSession, setSession, type SessionUser } from "./session";

// app.config.js writes apiBaseUrl from EXPO_PUBLIC_API_URL or falls back to Fly.
export const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  "https://forward-api-java.fly.dev";

// Fail fast instead of hanging on a dead backend (mobile networks can stall).
const REQUEST_TIMEOUT_MS = 12_000;

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

  /** Backend unreachable (offline, DNS, timeout, 5xx gateway) -> offer demo mode. */
  get isUnavailable(): boolean {
    return this.status === 0 || this.status === 502 || this.status === 503 || this.status === 504;
  }
}

async function doFetch(path: string, init: RequestInit | undefined, token: string | null) {
  const headers = new Headers(init?.headers ?? {});
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json, application/problem+json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${API_BASE_URL}${path}`, { ...init, headers, signal: controller.signal });
  } catch {
    throw new ApiError({
      type: "about:blank",
      title: "Servidor indisponível",
      status: 0,
      code: "NETWORK",
      detail: "Não foi possível conectar ao servidor da ForwardService.",
    });
  } finally {
    clearTimeout(timer);
  }
}

async function request<T>(path: string, init?: RequestInit, opts: { auth?: boolean } = {}): Promise<T> {
  const auth = opts.auth ?? true;
  const token = auth ? await getAccessToken() : null;
  const res = await doFetch(path, init, token);

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as Problem | null;
    // Expired/revoked token: drop the session so the router sends the user to /login.
    if (res.status === 401 && auth) await setSession(null);
    throw new ApiError(body ?? { type: "about:blank", title: res.statusText, status: res.status });
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function demoDelay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function notFound(what: string): ApiError {
  return new ApiError({ type: "about:blank", title: "Não encontrado", status: 404, detail: `${what} não encontrado.` });
}

// Domain types mirror the forward-api-java DTOs (snake_case JSON).
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
  updated_at?: string;
  notes?: string;
  customer_name?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  churn_probability?: number;
  segment?: string;
}

export type LeadStatus = Lead["status"];

// Active = still in the funnel. Terminal statuses are excluded explicitly.
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

export interface LoginResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  user: SessionUser;
}

function withReadableReason(lead: Lead): Lead {
  return { ...lead, reason: humanizeReason(lead) };
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>(
      "/api/v1/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      { auth: false },
    ),

  me: async (): Promise<SessionUser> =>
    isDemoSession() ? demoDelay(DEMO_USER) : request<SessionUser>("/api/v1/me"),

  listLeads: async (params: { status?: LeadStatus; limit?: number } = {}): Promise<Lead[]> => {
    if (isDemoSession()) return demoDelay(demoListLeads(params));
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    const leads = await request<Lead[]>(`/api/v1/leads${query ? `?${query}` : ""}`);
    return leads.map(withReadableReason);
  },

  getLead: async (id: string): Promise<Lead> => {
    if (isDemoSession()) {
      const lead = demoGetLead(id);
      if (!lead) throw notFound("Lead");
      return demoDelay(lead);
    }
    return withReadableReason(await request<Lead>(`/api/v1/leads/${encodeURIComponent(id)}`));
  },

  updateLead: async (id: string, patch: { status?: LeadStatus; notes?: string }): Promise<Lead> => {
    if (isDemoSession()) {
      const current = demoGetLead(id);
      if (!current) throw notFound("Lead");
      if (patch.status && !canTransition(current.status, patch.status)) {
        throw new ApiError({
          type: "about:blank",
          title: "Conflito",
          status: 409,
          code: "LEAD_INVALID_TRANSITION",
          detail: "Transição de status não permitida para este lead.",
        });
      }
      return demoDelay(demoUpdateLead(id, patch)!);
    }
    return withReadableReason(
      await request<Lead>(`/api/v1/leads/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    );
  },

  getCustomer: async (id: string): Promise<Customer> => {
    if (isDemoSession()) {
      const customer = demoGetCustomer(id);
      if (!customer) throw notFound("Cliente");
      return demoDelay(customer);
    }
    return request<Customer>(`/api/v1/customers/${encodeURIComponent(id)}`);
  },

  getScore: async (customerId: string): Promise<ChurnScore> => {
    if (isDemoSession()) {
      const score = demoGetScore(customerId);
      if (!score) throw notFound("Score");
      return demoDelay(score);
    }
    return request<ChurnScore>(`/api/v1/customers/${encodeURIComponent(customerId)}/score`);
  },

  getVehicle: async (vin: string): Promise<Vehicle> => {
    if (isDemoSession()) {
      const vehicle = demoGetVehicle(vin);
      if (!vehicle) throw notFound("Veículo");
      return demoDelay(vehicle);
    }
    return request<Vehicle>(`/api/v1/vehicles/${encodeURIComponent(vin)}`);
  },
};
