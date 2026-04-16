// Supabase client bound to the app configuration.
// On native, persists the session in expo-secure-store.
// On web, falls back to localStorage.
// Cliente Supabase: native usa secure-store, web usa localStorage.

import "react-native-url-polyfill/auto";
import Constants from "expo-constants";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { createClient, type SupportedStorage } from "@supabase/supabase-js";

const url = Constants.expoConfig?.extra?.supabaseUrl as string | undefined;
const anonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined;

const nativeStorage: SupportedStorage = {
  getItem: (k) => SecureStore.getItemAsync(k),
  setItem: (k, v) => SecureStore.setItemAsync(k, v),
  removeItem: (k) => SecureStore.deleteItemAsync(k),
};

const webStorage: SupportedStorage = {
  getItem: (k) => (typeof window === "undefined" ? null : window.localStorage.getItem(k)),
  setItem: (k, v) => {
    if (typeof window !== "undefined") window.localStorage.setItem(k, v);
  },
  removeItem: (k) => {
    if (typeof window !== "undefined") window.localStorage.removeItem(k);
  },
};

export const supabase = createClient(url ?? "", anonKey ?? "", {
  auth: {
    storage: Platform.OS === "web" ? webStorage : nativeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});
