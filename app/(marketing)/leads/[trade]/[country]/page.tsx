import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COUNTRIES, type CountryCode } from "@/config/locations";
import { countryFromSlug } from "@/config/seo-markets";
import { TRADES, TRADE_BY_SLUG } from "@/config/trades";
import { ButtonLink } from "@/components/ui";
import { MarketsGrid } from "@/components/marketing/LeadsPage";
import { PageHero } from "@/components/marketing/PageHero";
import { Container } from "@/components/marketing/Section";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbLd } from "@/lib/seo";

export const dynamicParams = false;
export function generateStaticParams() {
  return TRADES.flatMap((t) => (Object.keys(COUNTRIES) as CountryCode[]).map((c) => ({ trade: t.slug, country: COUNTRIES[c].slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ trade: string; country: string }> }): Promise<Metadata> {
  const p = await params;
  const t = TRADE_BY_SLUG[p.trade];
  const cc = countryFromSlug(p.country);
  if (!t || !cc) return {};
  return {
    title: `${t.name} leads in ${COUNTRIES[cc].name}`,
    description: `Project leads, qualification and booking for ${t.plural} across ${COUNTRIES[cc].name}, in local time and ${COUNTRIES[cc].currency}.`,
    alternates: { canonical: `/leads/${t.slug}/${p.country}` },
  };
}

export default async function TradeCountryPage({ params }: { params: Promise<{ trade: string; country: string }> }) {
  const p = await params;
  const t = TRADE_BY_SLUG[p.trade];
  const cc = countryFromSlug(p.country);
  if (!t || !cc) notFound();
  const country = COUNTRIES[cc];
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Leads", path: "/leads" }, { name: t.name, path: `/leads/${t.slug}` }, { name: country.name, path: `/leads/${t.slug}/${p.country}` }])} />
      <PageHero eyebrow={`${t.name} · ${country.name}`} title={`${t.name} leads across ${country.name}.`} accent={[country.name.split(" ")[0]!]} body={`Service areas by ${country.labels.region.toLowerCase()}, ${country.labels.city.toLowerCase()}${country.labels.suburb ? ` and ${country.labels.suburb.toLowerCase()}` : ""}, ${country.labels.postcode} matching, and every booking in your local time zone and ${country.currency}.`}>
        <ButtonLink href="/demo" size="lg">
          Request a Demo
        </ButtonLink>
      </PageHero>
      <section className="bg-page pb-24">
        <Container>
          <MarketsGrid trade={t} countries={[cc]} />
        </Container>
      </section>
    </>
  );
}
