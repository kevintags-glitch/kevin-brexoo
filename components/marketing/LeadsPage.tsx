import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { getTemplate } from "@/config/industry-templates";
import { COUNTRIES, type CountryCode } from "@/config/locations";
import { SAMPLE_BY_KEY, ago, sampleEmail } from "@/config/samples";
import { citiesIn, cityRegion, countrySlug, type SeoCity } from "@/config/seo-markets";
import type { Trade } from "@/config/trades";
import { ButtonLink } from "@/components/ui";
import { Illustration } from "./illustrations";
import { DiscoverMock, FitCardMock } from "./mocks";
import { Reveal } from "./Reveal";
import { Container, CtaBand, Eyebrow, Faq } from "./Section";

export function tradeQuestions(trade: Trade) {
  const seen = new Set<string>();
  return trade.templates.flatMap((code) => getTemplate(code)?.questions ?? []).filter((q) => q.public && !seen.has(q.key) && seen.add(q.key)).slice(0, 6);
}

export function tradeOpportunities(trade: Trade) {
  return [...new Set(trade.templates.flatMap((code) => getTemplate(code)?.opportunityTypes ?? []))].slice(0, 6);
}

/** Markets grid: every target city in a country, grouped by state, for one trade. */
export function MarketsGrid({ trade, countries }: { trade: Trade; countries: CountryCode[] }) {
  return (
    <div className="grid gap-10">
      {countries.map((cc) => {
        const byState = new Map<string, SeoCity[]>();
        for (const city of citiesIn(cc)) byState.set(cityRegion(city).name, [...(byState.get(cityRegion(city).name) ?? []), city]);
        return (
          <section key={cc} aria-labelledby={`m-${cc}`}>
            <h3 id={`m-${cc}`} className="type-card">
              <Link href={`/leads/${trade.slug}/${countrySlug(cc)}`} className="hover:text-blue">
                {COUNTRIES[cc].name}
              </Link>
            </h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...byState.entries()].flatMap(([state, cities]) =>
                cities.map((city) => (
                  <li key={city.slug}>
                    <Link href={`/leads/${trade.slug}/${countrySlug(cc)}/${cityRegion(city).slug}/${city.slug}`} className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 hover:border-blue/40">
                      <span>
                        <span className="block text-[15px] font-medium group-hover:text-blue">{city.name}</span>
                        <span className="block text-[13px] text-ink-3">{state}</span>
                      </span>
                      <ArrowRight className="size-4 text-ink-3 group-hover:text-blue" aria-hidden />
                    </Link>
                  </li>
                )),
              )}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** The local page body: unique per trade and city (areas, postcodes, counties, questions, example lead). */
export function LocalLeads({ trade, city }: { trade: Trade; city: SeoCity }) {
  const region = cityRegion(city);
  const country = COUNTRIES[city.country];
  const biz = SAMPLE_BY_KEY[trade.sample];
  const lead = biz.leads.find((l) => l.stage === "new") ?? biz.leads[0]!;
  const area = city.areas[0]!;
  const questions = tradeQuestions(trade);
  const opps = tradeOpportunities(trade);
  const nearby = citiesIn(city.country).filter((c) => c.slug !== city.slug).slice(0, 6);
  const place = `${city.name}, ${city.country === "US" ? region.code : region.name}`;
  const faqs = [
    { q: `How does Brexoo find ${trade.work} leads in ${city.name}?`, a: `Your Brexoo page captures enquiries from people in ${city.name} and the areas you choose, and you can import project records from sources you're allowed to use. Every lead keeps its source and date.` },
    { q: `Can I limit leads to the ${city.country === "US" ? "ZIP codes" : "suburbs"} I travel to?`, a: `Yes. Add ${city.country === "US" ? "counties, cities and ZIP codes" : "suburbs and postcodes"} as service areas, for example ${city.areas.slice(0, 3).map((a) => `${a.name} ${a.postcode}`).join(", ")}. Leads outside them are flagged, not hidden.` },
    { q: "Which time zone and currency will I see?", a: `${city.name} businesses work in ${region.tz.replace("_", " ")} time and ${country.currency}. Bookings, reminders and reports all follow your business's time zone.` },
    { q: "Does Brexoo guarantee leads?", a: "No. Brexoo helps you capture, qualify and follow up opportunities faster. Results depend on your market, your offer and how quickly you respond." },
  ];

  return (
    <>
      <section className="bg-white py-16 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Eyebrow>Areas you can cover</Eyebrow>
            <h2 className="type-section mt-4">
              {city.name} {city.country === "US" ? "neighborhoods and ZIP codes" : "suburbs and postcodes"}
            </h2>
            <p className="type-body mt-4 max-w-[60ch] text-ink-2">
              Set up service areas around {place}
              {city.counties?.length ? `, across ${city.counties.join(", ")}` : ""}. Each area gets its own local page for your business, so people searching nearby find you.
            </p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {city.areas.map((a) => (
                <li key={`${a.name}-${a.postcode}`} className="type-body flex items-center gap-2 rounded-xl border border-line px-4 py-3">
                  <MapPin className="size-4 text-blue" aria-hidden />
                  <span className="font-medium">{a.name}</span>
                  <span className="ml-auto text-[13px] text-ink-3 tabular">{a.postcode}</span>
                </li>
              ))}
            </ul>
          </div>
          <Reveal className="rounded-[24px] border border-line bg-surface-2/50 p-6">
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-ink-3">Example lead · {city.name}</p>
            <div className="mt-4 rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="type-card">{lead.name}</p>
                  <p className="text-[14px] text-ink-2">
                    {lead.title} · {area.name}, {city.name} {area.postcode}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-green-soft px-2.5 py-1 text-[12px] font-medium text-green-ink">{lead.fit}</span>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-ink-2">“{lead.message}”</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
                <div>
                  <dt className="text-ink-3">Timing</dt>
                  <dd className="font-medium">{lead.timing}</dd>
                </div>
                <div>
                  <dt className="text-ink-3">Received</dt>
                  <dd className="font-medium">{ago(lead.hoursAgo)}</dd>
                </div>
              </dl>
              <p className="mt-4 text-[12px] text-ink-3">Illustrative example ({sampleEmail(lead.name)}). Not a real customer.</p>
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="border-y border-line bg-surface-2/40 py-16 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>{trade.name}</Eyebrow>
            <h2 className="type-section mt-4">What {city.name} customers ask for</h2>
            <ul className="mt-6 flex flex-wrap gap-2">
              {opps.map((o) => (
                <li key={o} className="type-body rounded-full border border-line bg-white px-4 py-2">
                  {o}
                </li>
              ))}
            </ul>
            <h3 className="type-card mt-10">Questions your enquiry form asks</h3>
            <ol className="mt-3 grid gap-2">
              {questions.map((q, i) => (
                <li key={q.key} className="type-body flex gap-3 text-ink-2">
                  <span className="text-[13px] text-ink-3 tabular">{String(i + 1).padStart(2, "0")}</span>
                  {q.label}
                </li>
              ))}
            </ol>
          </div>
          <div className="grid gap-4">
            <FitCardMock />
            <DiscoverMock business={biz} />
          </div>
        </Container>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <Eyebrow>Questions</Eyebrow>
            <h2 className="type-section mt-4">
              {trade.name} in {city.name}
            </h2>
          </div>
          <Faq items={faqs} />
        </Container>
      </section>

      <section className="border-t border-line bg-white py-14">
        <Container>
          <h2 className="type-card">More {country.name} cities</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {nearby.map((c) => (
              <li key={c.slug}>
                <Link href={`/leads/${trade.slug}/${countrySlug(c.country)}/${cityRegion(c).slug}/${c.slug}`} className="inline-flex rounded-full border border-line px-4 py-2 text-[14px] hover:border-blue/40 hover:text-blue">
                  {trade.name} in {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <div className="bg-white pt-4">
        <CtaBand title={`Win more ${trade.plural.split(" and ")[0]} work in ${city.name}.`} body="See Brexoo set up with your services and service areas.">
          <ButtonLink href="/demo" variant="inverse" size="lg">
            Request a Demo
          </ButtonLink>
        </CtaBand>
      </div>
    </>
  );
}

export function TradeHeroIcon({ trade }: { trade: Trade }) {
  return <Illustration name={trade.illustration} className="size-16" />;
}

