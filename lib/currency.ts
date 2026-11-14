import { CURRENCIES, type Currency } from "@/config/plans";

/** Cookie a visitor's chosen currency is remembered in. */
export const CURRENCY_COOKIE = "brexoo_currency";

const BY_COUNTRY: Record<string, Currency> = { US: "USD", AU: "AUD", NZ: "NZD" };

export function isCurrency(v: unknown): v is Currency {
  return typeof v === "string" && (CURRENCIES as string[]).includes(v.toUpperCase());
}

/** USA → USD, Australia → AUD, New Zealand → NZD; anywhere else sees USD. */
export function currencyForCountry(country: string | null | undefined): Currency {
  return BY_COUNTRY[(country ?? "").trim().toUpperCase()] ?? "USD";
}

/**
 * The currency to show a visitor, in priority order: an explicit `?currency=` choice, the choice
 * they saved with the switcher, then the country their request comes from (Vercel's
 * `x-vercel-ip-country` header), then USD.
 */
export function resolveCurrency({ query, cookie, country }: { query?: string | string[] | null; cookie?: string | null; country?: string | null }): Currency {
  const q = Array.isArray(query) ? query[0] : query;
  if (isCurrency(q)) return q.toUpperCase() as Currency;
  if (isCurrency(cookie)) return cookie.toUpperCase() as Currency;
  return currencyForCountry(country);
}

const SYMBOL: Record<Currency, string> = { USD: "US$", AUD: "A$", NZD: "NZ$" };

/** A price with an unambiguous symbol (US$, A$, NZ$), whole units when there are no cents. */
export function formatPrice(minor: number, currency: Currency): string {
  const units = minor / 100;
  const n = units.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(units) ? 0 : 2, maximumFractionDigits: 2 });
  return `${SYMBOL[currency]}${n}`;
}

/** How tax is described next to a price in each market. */
export const TAX_NOTE: Record<Currency, string> = { USD: "before tax", AUD: "excl. GST", NZD: "excl. GST" };

export const CURRENCY_NAME: Record<Currency, string> = { USD: "US dollars", AUD: "Australian dollars", NZD: "New Zealand dollars" };

/** Remembers a visitor's currency choice for a year (browser only). */
export function saveCurrencyChoice(c: Currency) {
  document.cookie = `${CURRENCY_COOKIE}=${c}; path=/; max-age=31536000; samesite=lax`;
}
