/**
 * Plan hypotheses (blueprint §14.1, §14.2). These are illustrative working figures, not validated
 * prices: every surface that shows them also shows that caveat. Entitlements are data, so feature
 * checks read limits instead of hard-coding plan names.
 */

export type EntitlementKey =
  | "seats"
  | "published_pages"
  | "brex_ai_requests_month"
  | "visitor_chat_conversations_month"
  | "connected_mailboxes"
  | "managed_service_hours_month"
  | "exports";

export type Plan = {
  code: "launch" | "growth" | "managed";
  name: string;
  monthlyPriceMinor: number;
  setupFeeMinor: number;
  currency: "USD";
  positioning: string;
  /** null = no fixed limit in this hypothesis. */
  entitlements: Record<EntitlementKey, number | null>;
  highlights: string[];
};

export const PLANS: Plan[] = [
  {
    code: "launch",
    name: "Launch",
    monthlyPriceMinor: 29900,
    setupFeeMinor: 49900,
    currency: "USD",
    positioning: "A landing page that captures enquiries, and a CRM to follow them through.",
    entitlements: {
      seats: 3,
      published_pages: 1,
      brex_ai_requests_month: 200,
      visitor_chat_conversations_month: 300,
      connected_mailboxes: 0,
      managed_service_hours_month: 0,
      exports: 1,
    },
    highlights: [
      "1 published landing page",
      "Enquiry capture with consent and spam checks",
      "CRM pipeline, tasks and appointments",
      "Brex AI summaries and drafts (200 / month)",
      "Up to 3 team seats",
    ],
  },
  {
    code: "growth",
    name: "Growth",
    monthlyPriceMinor: 69900,
    setupFeeMinor: 79900,
    currency: "USD",
    positioning: "More pages, more summaries and drafts, and more seats for teams running several services.",
    entitlements: {
      seats: 10,
      published_pages: 3,
      brex_ai_requests_month: 1000,
      visitor_chat_conversations_month: 1500,
      connected_mailboxes: 2,
      managed_service_hours_month: 0,
      exports: 1,
    },
    highlights: [
      "Up to 3 published landing pages",
      "Everything in Launch",
      "Brex AI (1,000 / month)",
      "Up to 10 team seats",
      "Discovery credits when sourced data launches",
    ],
  },
  {
    code: "managed",
    name: "Managed",
    monthlyPriceMinor: 199900,
    setupFeeMinor: 149900,
    currency: "USD",
    positioning: "The software plus a separately scoped, human-run qualification service.",
    entitlements: {
      seats: 25,
      published_pages: 5,
      brex_ai_requests_month: 3000,
      visitor_chat_conversations_month: 5000,
      connected_mailboxes: 5,
      managed_service_hours_month: 20,
      exports: 1,
    },
    highlights: [
      "Everything in Growth",
      "Human qualification and follow-up, with agreed hours",
      "Written service levels, channels and contact limits",
      "Up to 25 team seats",
    ],
  },
];

export type Currency = "USD" | "AUD" | "NZD";
export const CURRENCIES: Currency[] = ["USD", "AUD", "NZD"];

/**
 * Local price points per currency (minor units). Set per market and rounded, not converted daily,
 * so prices stay stable. USD matches `monthlyPriceMinor` / `setupFeeMinor` above.
 */
export const PRICES: Record<Plan["code"], Record<Currency, { monthly: number; setup: number }>> = {
  launch: { USD: { monthly: 29900, setup: 49900 }, AUD: { monthly: 44900, setup: 74900 }, NZD: { monthly: 49900, setup: 82900 } },
  growth: { USD: { monthly: 69900, setup: 79900 }, AUD: { monthly: 104900, setup: 119900 }, NZD: { monthly: 114900, setup: 129900 } },
  managed: { USD: { monthly: 199900, setup: 149900 }, AUD: { monthly: 299900, setup: 224900 }, NZD: { monthly: 329900, setup: 249900 } },
};

/** The plan's monthly price and setup fee in the given currency. */
export function priceFor(plan: Pick<Plan, "code">, currency: Currency) {
  return PRICES[plan.code][currency];
}

export const PLAN_BY_CODE = Object.fromEntries(PLANS.map((p) => [p.code, p])) as Record<Plan["code"], Plan>;
