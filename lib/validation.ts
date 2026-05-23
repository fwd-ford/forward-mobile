// Pure validation functions. Return ValidationError with an i18n key (and
// optional interpolation vars) rather than raw strings — callers translate
// at render time via t(error.key, error.vars).
// Validacoes puras — retornam chave i18n, nao string traduzida.

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN_LENGTH = 6;
export const NAME_MIN_LENGTH = 2;

export type ValidationError = {
  key: string;
  vars?: Record<string, string | number>;
};

export type ValidationResult = ValidationError | undefined;

export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  if (!trimmed) return { key: "validation.email_required" };
  if (!EMAIL_REGEX.test(trimmed)) return { key: "validation.email_invalid" };
  return undefined;
}

export function validatePassword(password: string): ValidationResult {
  if (!password) return { key: "validation.password_required" };
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      key: "validation.password_too_short",
      vars: { count: PASSWORD_MIN_LENGTH },
    };
  }
  return undefined;
}

export function validateRequired(value: string, fieldKey: string): ValidationResult {
  if (!value.trim()) return { key: "validation.required", vars: { field: fieldKey } };
  return undefined;
}

export function validateName(name: string): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) return { key: "validation.name_required" };
  if (trimmed.length < NAME_MIN_LENGTH) return { key: "validation.name_short" };
  return undefined;
}
