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

// Capitaliza cada palavra do nome completo, tratando preposicoes em PT-BR
// como minusculas ("Joao Victor da Silva", nao "Joao Victor Da Silva").
// Usado quando precisamos do nome completo (ex.: greeting "Bem-vindo,
// Joao Victor Franco") em vez do primeiro nome humanizado.
const LOWERCASE_PARTICLES = new Set(["da", "de", "do", "das", "dos", "e"]);

export function toFullName(input: string): string {
  return input
    .trim()
    .split(/\s+/)
    .map((part, i) => {
      const lower = part.toLowerCase();
      if (i > 0 && LOWERCASE_PARTICLES.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export function friendlyFullName({ fullName, email }: FriendlyNameInput): string | null {
  if (fullName) return toFullName(fullName);
  if (email) {
    const local = email.split("@")[0] ?? "";
    return local ? toFriendlyFirstName(local) : null;
  }
  return null;
}
