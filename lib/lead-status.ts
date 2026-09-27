// Lead funnel rules shared by the UI and the offline demo store. Mirrors the
// transitions enforced by forward-api-java (PATCH /api/v1/leads/{id} -> 409
// LEAD_INVALID_TRANSITION when violated).
// Regras do funil de leads; espelham as transicoes validadas pela API.

import type { LeadStatus } from "./api";

export const LEAD_TRANSITIONS: Record<LeadStatus, readonly LeadStatus[]> = {
  new: ["assigned", "contacted", "lost"],
  assigned: ["contacted", "lost"],
  contacted: ["converted", "lost"],
  converted: [],
  lost: [],
  expired: [],
};

export function canTransition(from: LeadStatus, to: LeadStatus): boolean {
  return LEAD_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Next "happy path" step for the primary action button, or null when terminal. */
export function nextPrimaryStatus(status: LeadStatus): LeadStatus | null {
  if (status === "new" || status === "assigned") return "contacted";
  if (status === "contacted") return "converted";
  return null;
}

export function isTerminal(status: LeadStatus): boolean {
  return LEAD_TRANSITIONS[status]?.length === 0;
}
