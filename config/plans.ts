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

export const PLAN_BY_CODE = Object.fromEntries(PLANS.map((p) => [p.code, p])) as Record<Plan["code"], Plan>;
