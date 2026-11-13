import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COUNTRIES } from "@/config/locations";
import { SEO_CITIES, cityRegion, countrySlug, findCity } from "@/config/seo-markets";
import { TRADES, TRADE_BY_SLUG } from "@/config/trades";
import { ButtonLink } from "@/components/ui";
import { LocalLeads, TradeHeroIcon } from "@/components/marketing/LeadsPage";
import { PageHero } from "@/components/marketing/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { absolute, breadcrumbLd } from "@/lib/seo";

type P = { trade: string; country: string; state: string; city: string };

export const dynamicParams = false;
export function generateStaticParams(): P[] {
  return TRADES.flatMap((t) => SEO_CITIES.map((c) => ({ trade: t.slug, country: countrySlug(c.country), state: cityRegion(c).slug, city: c.slug })));
}

function resolve(p: P) {
  const trade = TRADE_BY_SLUG[p.trade];
  const city = findCity(p.country, p.state, p.city);
  return trade && city ? { trade, city, region: cityRegion(city) } : null;
}

export async function generateMetadata({ params }: { params: Promise<P> }): Promise<Metadata> {
  const p = await params;
  const r = resolve(p);
  if (!r) return {};
  const where = `${r.city.name}, ${r.city.country === "US" ? r.region.code : r.region.name}`;
  const path = `/leads/${p.trade}/${p.country}/${p.state}/${p.city}`;
  const title = `${r.trade.name} leads in ${where}`;
  const description = `Find, qualify and book ${r.trade.work} jobs in ${where}${r.city.counties ? ` and ${r.city.counties[0]}` : ""}: ${r.city.areas
    .slice(0, 3)
    .map((a) => `${a.name} ${a.postcode}`)
    .join(", ")} and more. Brexoo for ${r.trade.plural}.`;
  return { title, description, alternates: { canonical: path }, openGraph: { title, description, url: absolute(path) } };
}

export default async function CityPage({ params }: { params: Promise<P> }) {
  const p = await params;
  const r = resolve(p);
  if (!r) notFound();
  const { trade, city, region } = r;
  const country = COUNTRIES[city.country];
  const path = `/leads/${p.trade}/${p.country}/${p.state}/${p.city}`;
  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Brexoo for ${trade.plural} in ${city.name}`,
    serviceType: "Lead management and CRM software",
    provider: { "@type": "Organization", name: "Brexoo", url: absolute("/") },
    url: absolute(path),
    areaServed: {
      "@type": "City",
      name: city.name,
      containedInPlace: { "@type": "State", name: region.name, containedInPlace: { "@type": "Country", name: country.name } },
    },
    audience: { "@type": "BusinessAudience", audienceType: trade.name },
  };
  return (
    <>
      <JsonLd data={serviceLd} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Leads", path: "/leads" },
          { name: trade.name, path: `/leads/${trade.slug}` },
          { name: country.name, path: `/leads/${trade.slug}/${p.country}` },
          { name: city.name, path },
        ])}
      />
      <PageHero
        variant="split"
        eyebrow={`${trade.name} · ${city.name}, ${city.country === "US" ? region.code : region.name}`}
        title={`Find and win ${trade.work} jobs in ${city.name}.`}
        accent={[city.name.split(" ").pop()!]}
        body={`Brexoo helps ${trade.plural} in ${city.name}${city.counties ? ` and ${city.counties.slice(0, 2).join(" and ")}` : ""} capture enquiries, check fit against the ${city.country === "US" ? "ZIP codes" : "suburbs"} you cover, and confirm bookings in ${region.tz.replace("_", " ")} time.`}
        aside={
          <div className="grid place-items-center rounded-[28px] border border-line bg-surface-2/50 p-10">
            <TradeHeroIcon trade={trade} />
            <p className="mt-4 text-center text-[15px] font-semibold">{city.name}</p>
            <p className="text-center text-[13px] text-ink-3">
              {city.areas.length} areas · {country.currency} · {region.tz.split("/")[1]?.replace("_", " ")}
            </p>
          </div>
        }
      >
        <ButtonLink href="/demo" size="lg">
          Request a Demo
        </ButtonLink>
        <ButtonLink href={`/leads/${trade.slug}`} size="lg" variant="outline">
          Other cities
        </ButtonLink>
      </PageHero>
      <LocalLeads trade={trade} city={city} />
    </>
  );
}
