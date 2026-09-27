// Session store for the app. Holds the JWT issued by forward-api-java
// (POST /api/v1/auth/login) or a local "demo" session that runs fully offline.
// Native persists in expo-secure-store (Android Keystore / iOS Keychain);
// web falls back to localStorage.
//
// Sessao do app: guarda o JWT emitido pela forward-api-java ou uma sessao
// "demo" offline. No celular fica criptografada no SecureStore (Keystore).

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export type UserRole = "ATENDENTE" | "GESTOR" | "ADMIN";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  dealer_id: string | null;
  dealer_name: string | null;
}

export interface Session {
  mode: "api" | "demo";
  accessToken: string | null;
  // Epoch ms. Null for demo sessions (never expire).
  expiresAt: number | null;
  user: SessionUser;
}

const STORE_KEY = "forward.session.v1";

let current: Session | null = null;
let hydrated = false;
const listeners = new Set<(s: Session | null) => void>();

async function readRaw(): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof window === "undefined" ? null : window.localStorage.getItem(STORE_KEY);
  }
  return SecureStore.getItemAsync(STORE_KEY);
}

async function writeRaw(value: string | null): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window === "undefined") return;
    if (value === null) window.localStorage.removeItem(STORE_KEY);
    else window.localStorage.setItem(STORE_KEY, value);
    return;
  }
  if (value === null) await SecureStore.deleteItemAsync(STORE_KEY);
  else await SecureStore.setItemAsync(STORE_KEY, value);
}

function isExpired(s: Session): boolean {
  return s.mode === "api" && s.expiresAt !== null && Date.now() >= s.expiresAt;
}

/** Loads the persisted session once (drops it if the JWT already expired). */
export async function loadSession(): Promise<Session | null> {
  if (hydrated) return current;
  try {
    const raw = await readRaw();
    const parsed = raw ? (JSON.parse(raw) as Session) : null;
    current = parsed && !isExpired(parsed) ? parsed : null;
    if (parsed && !current) await writeRaw(null);
  } catch {
    // Corrupted payload: start signed out instead of crashing the boot.
    current = null;
  }
  hydrated = true;
  return current;
}

export function getSession(): Session | null {
  return current;
}

export async function setSession(next: Session | null): Promise<void> {
  current = next;
  hydrated = true;
  await writeRaw(next ? JSON.stringify(next) : null);
  listeners.forEach((fn) => fn(next));
}

export function onSessionChange(fn: (s: Session | null) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function isDemoSession(): boolean {
  return current?.mode === "demo";
}

/** Returns a live access token, or null when signed out, in demo mode or expired. */
export async function getAccessToken(): Promise<string | null> {
  const s = current ?? (await loadSession());
  if (!s || s.mode !== "api") return null;
  if (isExpired(s)) {
    await setSession(null);
    return null;
  }
  return s.accessToken;
}
