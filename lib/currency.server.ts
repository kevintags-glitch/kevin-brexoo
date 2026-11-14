import "server-only";
import { cookies, headers } from "next/headers";
import type { Currency } from "@/config/plans";
import { CURRENCY_COOKIE, resolveCurrency } from "./currency";

/** Resolves the visitor's currency on the server from the query, their saved choice and their country. */
export async function visitorCurrency(query?: string | string[] | null): Promise<Currency> {
  const [h, c] = await Promise.all([headers(), cookies()]);
  return resolveCurrency({ query, cookie: c.get(CURRENCY_COOKIE)?.value, country: h.get("x-vercel-ip-country") });
}
