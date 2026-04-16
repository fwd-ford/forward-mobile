// Auth hook built on Supabase. Exposes the current session and a couple of
// actions. Lightweight by design: everything else reads `supabase.auth` directly.
// Hook de autenticacao baseado em Supabase.

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const sub = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.data.subscription.unsubscribe();
  }, []);

  return { session, loading };
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}
