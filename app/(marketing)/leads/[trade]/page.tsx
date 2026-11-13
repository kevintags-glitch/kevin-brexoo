import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SAMPLE_BY_KEY } from "@/config/samples";
import { TRADES, TRADE_BY_SLUG } from "@/config/trades";
import { ButtonLink } from "@/components/ui";
import { MarketsGrid, tradeOpportunities, tradeQuestions } from "@/components/marketing/LeadsPage";
import { OverviewMock } from "@/components/marketing/mocks";
import { PageHero } from "@/components/marketing/PageHero";
import { Container, CtaBand, Eyebrow } from "@/components/marketing/Section";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbLd } from "@/lib/seo";

export const dynamicParams = false;
export function generateStaticParams() {
  return TRADES.map((t) => ({ trade: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ trade: string }> }): Promise<Metadata> {
  const t = TRADE_BY_SLUG[(await params).trade];
  if (!t) return {};
  return {
    title: `Project leads and CRM for ${t.plural}`,
    description: `Capture, qualify and book ${t.work} jobs in the USA, Australia and New Zealand. Explainable fit, buying intent, booking requests and Brex AI for ${t.plural}.`,
    alternates: { canonical: `/leads/${t.slug}` },
  };
}

export default async function TradePage({ params }: { params: Promise<{ trade: string }> }) {
  const t = TRADE_BY_SLUG[(await params).trade];
  if (!t) notFound();
  const biz = SAMPLE_BY_KEY[t.sample];
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Leads", path: "/leads" }, { name: t.name, path: `/leads/${t.slug}` }])} />
      <PageHero variant="split" eyebrow={t.name} title={`Find and win more ${t.work} jobs.`} accent={["win"]} body={`Brexoo gives ${t.plural} a page that captures enquiries, a fit score you can explain, booking requests and a pipeline that keeps every follow-up moving.`} aside={<OverviewMock business={biz} />}>
        <ButtonLink href="/demo" size="lg">
          Request a Demo
        </ButtonLink>
        <ButtonLink href={t.industryPage} size="lg" variant="outline">
          How it works for {t.name.toLowerCase().split(" ")[0]}
        </ButtonLink>
      </PageHero>
      <section className="border-y border-line bg-surface-2/40 py-16">
        <Container className="grid gap-10 md:grid-cols-2">
          <div>
            <Eyebrow>Typical opportunities</Eyebrow>
            <ul className="mt-4 flex flex-wrap gap-2">
              {tradeOpportunities(t).map((o) => (
                <li key={o} className="type-body rounded-full border border-line bg-white px-4 py-2">
                  {o}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Eyebrow>Your enquiry form asks</Eyebrow>
            <ul className="type-body mt-4 grid gap-1.5 text-ink-2">
              {tradeQuestions(t).map((q) => (
                <li key={q.key}>{q.label}</li>
              ))}
            </ul>
          </div>
        </Container>
      </section>
      <section className="bg-white py-16 sm:py-20">
        <Container>
          <Eyebrow>Cities</Eyebrow>
          <h2 className="type-section mt-4">{t.name} across three countries</h2>
          <div className="mt-10">
            <MarketsGrid trade={t} countries={["US", "AU", "NZ"]} />
          </div>
        </Container>
      </section>
      <CtaBand title={`Brexoo for ${t.plural}.`} body="See it with your services and service areas.">
        <ButtonLink href="/demo" variant="inverse" size="lg">
          Request a Demo
        </ButtonLink>
      </CtaBand>
    </>
  );
}
