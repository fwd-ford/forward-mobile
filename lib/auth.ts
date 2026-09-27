// Authentication against forward-api-java: POST /api/v1/auth/login returns a
// JWT (HS256, expiring) that is stored encrypted via lib/session.ts. Demo mode
// signs in locally with the offline dataset.
// Autenticacao na forward-api-java (JWT) + login local do modo demonstracao.

import { useEffect, useState } from "react";

import { api } from "./api";
import { DEMO_USER, resetDemoData } from "./demo-data";
import { getSession, loadSession, onSessionChange, setSession, type Session } from "./session";

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const res = await api.login(email, password);
  await setSession({
    mode: "api",
    accessToken: res.access_token,
    // 30s safety margin so we never send a token that dies in flight.
    expiresAt: Date.now() + Math.max(res.expires_in - 30, 30) * 1000,
    user: res.user,
  });
}

export async function signInDemo(): Promise<void> {
  resetDemoData();
  await setSession({ mode: "demo", accessToken: null, expiresAt: null, user: DEMO_USER });
}

export async function signOut(): Promise<void> {
  await setSession(null);
}

/** Current session + hydration flag; re-renders on sign-in/sign-out/expiry. */
export function useSession(): { session: Session | null; loading: boolean } {
  const [session, setLocal] = useState<Session | null>(getSession());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void loadSession().then((s) => {
      if (!alive) return;
      setLocal(s);
      setLoading(false);
    });
    const off = onSessionChange((s) => setLocal(s));
    return () => {
      alive = false;
      off();
    };
  }, []);

  return { session, loading };
}
