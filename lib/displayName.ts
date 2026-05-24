// Helpers para escolher um nome human-friendly em qualquer hero/header.
// Consumido por home (greeting) e profile (hero name). Manter aqui pra
// que o tratamento de username/email seja consistente entre telas.

export function toFriendlyFirstName(input: string): string {
  const first = input.split(/\s+/)[0] ?? "";
  const cleaned = first.replace(/\d+$/, "").replace(/[._\-]+/g, "");
  if (!cleaned) return "";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

export type FriendlyNameInput = {
  fullName?: string | null;
  email?: string | null;
};

// Resolve o melhor display name disponivel, ja humanizado.
// Retorna null quando nao ha nada utilizavel (caller decide fallback i18n).
export function friendlyDisplayName({ fullName, email }: FriendlyNameInput): string | null {
  const fromName = fullName ? toFriendlyFirstName(fullName) : "";
  if (fromName) return fromName;
  const fromEmail = email ? toFriendlyFirstName(email.split("@")[0] ?? "") : "";
  if (fromEmail) return fromEmail;
  return null;
}
