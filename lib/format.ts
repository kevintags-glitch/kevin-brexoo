/** Formatting helpers. Times are stored in UTC and rendered in the organisation's time zone (§15.3). */

export function formatMoney(minor: number | null | undefined, currency = "AUD", opts: { compact?: boolean } = {}) {
  if (minor == null) return "—";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: opts.compact || minor % 100 === 0 ? 0 : 2,
    notation: opts.compact ? "compact" : "standard",
  }).format(minor / 100);
}

/** Parses "12,500" or "12500.50" into minor units; null for empty or invalid input. */
export function parseMoneyToMinor(input: string): number | null {
  const cleaned = input.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

export function formatDateTime(iso: string | null | undefined, timeZone: string, opts: Intl.DateTimeFormatOptions = {}) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    ...opts,
  }).format(new Date(iso));
}

export function formatDate(iso: string | null | undefined, timeZone: string) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-AU", { timeZone, day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

/** "3 min ago", "Yesterday", then an absolute date after a week (relative dates rot). */
export function formatRelative(iso: string | null | undefined, timeZone: string, now = new Date()) {
  if (!iso) return "—";
  const then = new Date(iso);
  const diff = (now.getTime() - then.getTime()) / 1000;
  const future = diff < 0;
  const s = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (s < 45) return future ? "in a moment" : "just now";
  if (s < 3600) return rtf.format(Math.round((future ? 1 : -1) * (s / 60)), "minute");
  if (s < 86400) return rtf.format(Math.round((future ? 1 : -1) * (s / 3600)), "hour");
  if (s < 7 * 86400) return rtf.format(Math.round((future ? 1 : -1) * (s / 86400)), "day");
  return formatDate(iso, timeZone);
}

/**
 * Converts a wall-clock date and time in a time zone (e.g. "2026-11-20", "09:30",
 * "Australia/Sydney") to a UTC ISO string. Handles daylight-saving offsets for that date.
 */
export function zonedTimeToUtc(date: string, time: string, timeZone: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  if (!y || !m || !d || hh == null || mm == null || Number.isNaN(hh) || Number.isNaN(mm)) throw new Error("Invalid date or time");
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  // Offset of the zone at the guessed instant, applied twice to settle across DST transitions.
  const offset1 = tzOffsetMinutes(new Date(guess), timeZone);
  const first = guess - offset1 * 60_000;
  const offset2 = tzOffsetMinutes(new Date(first), timeZone);
  return new Date(guess - offset2 * 60_000).toISOString();
}

export function tzOffsetMinutes(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - at.getTime()) / 60_000);
}

/** Splits a UTC ISO time into the date and time inputs for a time zone. */
export function utcToZonedInputs(iso: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n.toLocaleString("en-AU")} ${new Intl.PluralRules("en").select(n) === "one" ? one : many}`;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
}
