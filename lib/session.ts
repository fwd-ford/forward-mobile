// Session helpers shared across screens. Thin wrapper over supabase.auth.
// Helpers de sessao usados em todas as telas.

import { supabase } from "./supabase";

// getAccessToken returns the current Supabase access token, or null when not signed in.
// getAccessToken: retorna o access token atual ou null.
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
