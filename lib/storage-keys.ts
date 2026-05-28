// Centralised storage keys for AsyncStorage. Never use string literals in
// callers — keep the namespace in one place so a rename or audit is safe.
// Chaves de storage centralizadas; proibido usar string literal nos consumers.

export const STORAGE_KEYS = {
  // Bumped to v2 when the design system shipped Glass Minimalist with dark as
  // the canonical default. Old @forward:theme values (potentially "light" from
  // the previous follow-system behavior) would otherwise hijack the new boot.
  // Key bumpada pra invalidar overrides antigos quando dark virou default.
  THEME: "@forward:theme_v2",
  LOCALE: "@forward:locale",
  ONBOARDED: "@forward:onboarded",
  CURRENT_DEALER_ID: "@forward:current_dealer_id",
  LAST_USER: "@forward:last_user",
  CITY: "@forward:city_v1",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
