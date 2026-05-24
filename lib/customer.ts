// Customer fetch — TODO: forward-api-java has no GET /customers/{id} yet,
// so for Sprint 1 we query Supabase directly. RLS may block depending on the
// caller's JWT role (dealer/admin pass, vanilla authenticated does not). On
// block, the caller treats the customer as unknown and gracefully degrades
// (e.g. Call action stays disabled). When the Java endpoint lands, swap
// getCustomerById here for an api.getCustomer(id) and drop the import.
//
// Busca customer via Supabase direto (placeholder); migrar pra forward-api-java
// quando o GET /customers/{id} for exposto.

import { supabase } from "./supabase";

export interface Customer {
  id: string;
  full_name: string;
  phone: string | null;
  opt_in_whatsapp: boolean;
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("id, full_name, phone, opt_in_whatsapp")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as Customer;
}
