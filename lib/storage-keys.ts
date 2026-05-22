// Centralised storage keys for AsyncStorage. Never use string literals in
// callers — keep the namespace in one place so a rename or audit is safe.
// Chaves de storage centralizadas; proibido usar string literal nos consumers.

export const STORAGE_KEYS = {
  THEME: "@forward:theme",
  LOCALE: "@forward:locale",
  ONBOARDED: "@forward:onboarded",
  CURRENT_DEALER_ID: "@forward:current_dealer_id",
  LAST_USER: "@forward:last_user",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
