// Customer lookup through forward-api-java (GET /api/v1/customers/{id}), which
// enforces dealer scoping server-side. Returns null when not visible so the
// caller can degrade gracefully (e.g. Call action disabled).
// Busca do cliente via API (escopo por concessionaria aplicado no backend).

import { api } from "./api";

export interface Customer {
  id: string;
  full_name: string;
  phone: string | null;
  opt_in_whatsapp: boolean;
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  try {
    return await api.getCustomer(id);
  } catch {
    return null;
  }
}
