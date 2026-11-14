import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { PLANS, priceFor, type EntitlementKey } from "@/config/plans";
import { ButtonLink, Notice } from "@/components/ui";
import { PageHero } from "@/components/marketing/PageHero";
import { BrandIcon } from "@/components/marketing/brand-icons";
import { HoverTilt, TiltIn } from "@/components/marketing/motion";
import { Container, Faq, SectionHeading } from "@/components/marketing/Section";
import { cn } from "@/lib/cn";
import { CurrencySwitcher } from "@/components/marketing/CurrencySwitcher";
import { CURRENCY_NAME, formatPrice, TAX_NOTE } from "@/lib/currency";
import { visitorCurrency } from "@/lib/currency.server";

export const metadata: Metadata = { alternates: { canonical: "/pricing" }, title: "Pricing", description: "Brexoo plans for small builders and home-service businesses, in US, Australian or New Zealand dollars, with clear limits, setup fees and billing terms." };

const ROWS: { key: EntitlementKey; label: string; unit?: string }[] = [
  { key: "published_pages", label: "Published landing pages" },
  { key: "seats", label: "Team seats" },
  { key: "brex_ai_requests_month", label: "Brex AI requests", unit: "/ month" },
  { key: "visitor_chat_conversations_month", label: "Visitor chat conversations", unit: "/ month" },
  { key: "connected_mailboxes", label: "Connected mailboxes (coming)" },
  { key: "managed_service_hours_month", label: "Managed service hours", unit: "/ month" },
];

function cell(v: number | null, unit?: string) {
  if (v === null) return "Unlimited";
  if (v === 0) return <Minus className="mx-auto size-4 text-ink-3" aria-label="Not included" />;
  return `${v.toLocaleString("en-AU")}${unit ? ` ${unit}` : ""}`;
}

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ currency?: string | string[] }> }) {
  const currency = await visitorCurrency((await searchParams).currency);
  return (
    <>
      <PageHero eyebrow="Pricing" title="Clear plans. Limits you can see." accent={["see"]} body="Built for builders and construction teams of 1–15 people. Every plan includes the full enquiry-to-outcome workflow; plans differ in pages, seats, Brex AI usage and optional human-managed services." />
      <section className="py-16 sm:py-24">
        <Container>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <Notice tone="amber" title="Illustrative pricing" className="max-w-3xl">
              Pilot prices, shown in {CURRENCY_NAME[currency]} {TAX_NOTE[currency]}. We set local prices for the USA (USD), Australia (AUD) and New Zealand (NZD), and your final price, taxes and terms are confirmed in writing before you&apos;re billed.
            </Notice>
            <div className="shrink-0">
              <p className="mb-2 text-[12px] font-medium text-ink-3">Show prices in</p>
              <CurrencySwitcher current={currency} />
            </div>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {PLANS.map((p, i) => {
              const featured = p.code === "growth";
              const price = priceFor(p, currency);
              return (
                <TiltIn key={p.code} delay={i * 0.12} className="h-full">
                <HoverTilt
                  className={cn("flex h-full scroll-mt-28 flex-col rounded-[26px] border bg-white p-8", featured ? "border-blue shadow-lg ring-4 ring-blue/10" : "border-line shadow-xs")}
                >
                  <span id={p.code} className="absolute -top-28" aria-hidden />
                  {featured ? <span className="absolute -top-3 left-7 rounded-full bg-blue px-2.5 py-1 text-[12px] font-medium text-on-blue">Most teams</span> : null}
                  <BrandIcon name={p.code === "launch" ? "page" : p.code === "growth" ? "pipeline" : "team"} tone={p.code === "launch" ? "cloud" : p.code === "growth" ? "blue" : "navy"} className="size-12" />
                  <h2 className="type-card mt-4">{p.name}</h2>
                  <p className="mt-2 min-h-12 text-[14px] leading-relaxed text-ink-3">{p.positioning}</p>
                  <p className="mt-6 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                    <span className="whitespace-nowrap text-[44px] leading-none tracking-[-0.035em] tabular font-light xl:text-[50px]">{formatPrice(price.monthly, currency)}</span>
                    <span className="whitespace-nowrap text-ink-3">/ month</span>
                  </p>
                  <p className="mt-1 text-[13px] text-ink-3">
                    plus {formatPrice(price.setup, currency)} one-off setup · {TAX_NOTE[currency]}
                  </p>
                  <ButtonLink href={`/signup?plan=${p.code}`} variant={featured ? "primary" : "secondary"} size="lg" className="mt-7">
                    Choose {p.name}
                  </ButtonLink>
                  <ul className="mt-7 grid gap-2.5 border-t border-line pt-6">
                    {p.highlights.map((h) => (
                      <li key={h} className="flex gap-2.5 text-[14px] text-ink-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-teal-ink" aria-hidden />
                        {h}
                      </li>
                    ))}
                  </ul>
                </HoverTilt>
                </TiltIn>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-surface py-16 sm:py-24">
        <Container>
          <SectionHeading eyebrow="Compare" title="Plan limits" />
          <div className="mt-10 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[640px] text-left text-[14px]">
              <caption className="sr-only">Limits by plan</caption>
              <thead className="bg-surface-2/60">
                <tr>
                  <th scope="col" className="px-5 py-3.5 font-medium text-ink-3">
                    Limit
                  </th>
                  {PLANS.map((p) => (
                    <th key={p.code} scope="col" className="px-5 py-3.5 text-center font-medium">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.key} className="border-t border-line">
                    <th scope="row" className="px-5 py-3.5 font-normal text-ink-2">
                      {r.label}
                    </th>
                    {PLANS.map((p) => (
                      <td key={p.code} className="px-5 py-3.5 text-center tabular">
                        {cell(p.entitlements[r.key], r.unit)}
                      </td>
                    ))}
                  </tr>
                ))}
                {["Enquiry capture, CRM pipeline, tasks and appointments", "Explainable fit score and activity history", "Consent records, opt-outs and audit log"].map((f) => (
                  <tr key={f} className="border-t border-line">
                    <th scope="row" className="px-5 py-3.5 font-normal text-ink-2">
                      {f}
                    </th>
                    {PLANS.map((p) => (
                      <td key={p.code} className="px-5 py-3.5 text-center">
                        <Check className="mx-auto size-4 text-teal-ink" aria-label="Included" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading eyebrow="Billing terms" title="The fine print, not hidden." />
          <Faq
            items={[
              { q: "What does the setup fee cover?", a: "Onboarding review, your first landing page draft and an internal quality check before you approve it." },
              { q: "Can I change plans?", a: "Yes. Upgrades apply straight away. Downgrades apply from your next billing period, and limits above the new plan stop accepting new items (nothing is deleted)." },
              { q: "What happens if I go over a limit?", a: "Nothing is charged automatically. You'll see your usage in Settings and choose whether to upgrade." },
              { q: "Cancellation and refunds", a: "Final cancellation, renewal, refund and failed-payment terms are confirmed in your agreement before billing starts." },
              { q: "Do you guarantee results?", a: "No plan guarantees leads, appointments or revenue. Managed services guarantee the agreed effort and reporting." },
            ]}
          />
        </Container>
      </section>
    </>
  );
}
