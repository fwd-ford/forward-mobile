// Relative time formatter — "agora", "ha 5 min", "ha 3h", "ha 2 dias",
// then falls back to DD/MM after 7 days. Locale-agnostic: takes the
// TFunction from react-i18next, so caller controls translation.
// Formatador relativo: i18n-aware via TFunction passada do caller.

import type { TFunction } from "i18next";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

/**
 * Format an ISO timestamp as a short relative label.
 * - < 60s: "now"
 * - < 60min: "5m ago"
 * - < 24h: "3h ago"
 * - < 7d: "2 days ago" (plural-aware)
 * - >= 7d: "DD/MM" (zero-padded)
 *
 * @param iso ISO 8601 timestamp string (e.g. Lead.created_at)
 * @param t react-i18next TFunction, scoped to the "time" namespace
 * @param now optional "now" timestamp for deterministic testing (defaults to Date.now())
 */
export function formatRelativeTime(
  iso: string,
  t: TFunction,
  now: number = Date.now(),
): string {
  const target = Date.parse(iso);
  if (Number.isNaN(target)) return "";

  const diff = Math.max(0, now - target);

  if (diff < MINUTE_MS) return t("time.now");

  if (diff < HOUR_MS) {
    const count = Math.floor(diff / MINUTE_MS);
    return t("time.minutes_ago", { count });
  }

  if (diff < DAY_MS) {
    const count = Math.floor(diff / HOUR_MS);
    return t("time.hours_ago", { count });
  }

  if (diff < WEEK_MS) {
    const count = Math.floor(diff / DAY_MS);
    // i18next plural fallback: count=1 hits "time.days_ago", count>1 hits "time.days_ago_plural"
    // (configured via the *_plural suffix convention from compatibilityJSON: "v4")
    return count === 1
      ? t("time.days_ago", { count })
      : t("time.days_ago_plural", { count });
  }

  // Older than a week — short date. Mostra ano so quando difere do corrente
  // pra evitar ambiguidade entre datas do ano atual e anteriores.
  const d = new Date(target);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const targetYear = d.getFullYear();
  const nowYear = new Date(now).getFullYear();
  if (targetYear === nowYear) return `${dd}/${mm}`;
  return `${dd}/${mm}/${String(targetYear).slice(-2)}`;
}
