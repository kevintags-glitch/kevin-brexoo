import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TRADES } from "@/config/trades";
import { Illustration } from "@/components/marketing/illustrations";
import { PageHero } from "@/components/marketing/PageHero";
import { Container } from "@/components/marketing/Section";

export const metadata: Metadata = {
  title: "Project leads by trade and city",
  description: "Brexoo for builders, electricians, plumbers, HVAC, renovation, landscaping, cleaning, roofing and painting across the USA, Australia and New Zealand.",
  alternates: { canonical: "/leads" },
};

export default function LeadsIndex() {
  return (
    <>
      <PageHero eyebrow="Leads by trade" title="Find your next project, wherever you work." accent={["wherever"]} body="Choose your trade to see how Brexoo captures, qualifies and books work in your cities." />
      <section className="bg-white pb-24">
        <Container>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRADES.map((t) => (
              <li key={t.slug}>
                <Link href={`/leads/${t.slug}`} className="group flex h-full flex-col rounded-[22px] border border-line p-6 hover:shadow-lg">
                  <Illustration name={t.illustration} className="size-14" />
                  <span className="mt-5 text-[19px] font-semibold">{t.name}</span>
                  <span className="mt-1 flex-1 text-[14px] text-ink-3">Leads for {t.work}</span>
                  <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-blue group-hover:gap-2">
                    See cities <ArrowRight className="size-3.5" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
