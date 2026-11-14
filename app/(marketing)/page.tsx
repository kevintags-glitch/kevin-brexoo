import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, ShieldCheck } from "lucide-react";
import { BRAND_FACTS } from "@/config/facts";
import { PLANS, priceFor } from "@/config/plans";
import { ButtonLink } from "@/components/ui";
import { BrexAiExample } from "@/components/marketing/BrexAiExample";
import { CrmShowcase } from "@/components/marketing/CrmShowcase";
import { ProjectSources } from "@/components/marketing/ProjectSources";
import { StairsFilm } from "@/components/marketing/StairsFilm";
import { IconWall } from "@/components/marketing/IconWall";
import { BrandIcon, TONE_CYCLE, type BrandIconName } from "@/components/marketing/brand-icons";
import { LoopDivider, MarkOutline } from "@/components/brand/BrandMotif";
import { BookingMock, CalendarMock, DiscoverMock, FitCardMock, PipelineMock } from "@/components/marketing/mocks";
import { Illustration } from "@/components/marketing/illustrations";
import { ProductTabs, type ProductTab } from "@/components/marketing/ProductTabs";
import { COUNTRIES, findRegion } from "@/config/locations";
import { SAMPLE_BY_KEY } from "@/config/samples";
import { FOCUS_TRADE, OTHER_TRADES, TRADES } from "@/config/trades";
import { CountUp, SlideIn, TiltIn, WordsReveal } from "@/components/marketing/motion";
import { Reveal } from "@/components/marketing/Reveal";
import { Container, CtaBand, Eyebrow, Faq } from "@/components/marketing/Section";
import { JsonLd } from "@/components/seo/JsonLd";
import { absolute } from "@/lib/seo";
import { CURRENCY_NAME, formatPrice, TAX_NOTE } from "@/lib/currency";
import { visitorCurrency } from "@/lib/currency.server";
import { CurrencySwitcher } from "@/components/marketing/CurrencySwitcher";

export const metadata: Metadata = {
  title: { absolute: "Brexoo — Find, qualify and win local projects" },
  description: "Brexoo helps small builders and construction companies (1–15 people) in the USA, Australia and New Zealand find, qualify and win local projects.",
  alternates: { canonical: "/" },
};

const ORG_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Brexoo",
  url: absolute("/"),
  logo: absolute("/brand/brexoo-logo.png"),
  description: "The growth platform for small builders and construction companies (1–15 people) in the USA, Australia and New Zealand, also used by electricians, plumbers, HVAC and other home-service trades.",
  areaServed: ["US", "AU", "NZ"].map((c) => ({ "@type": "Country", name: c })),
};

const TABS: ProductTab[] = [
  { id: "discover", label: "Discover", icon: "magnifier", title: "Every opportunity, with where it came from.", body: "Enquiries from your page and chat, and project records from sources you're allowed to use, side by side.", points: ["Verified projects, enquiries, prospects and inferred signals labelled apart", "Observed date and source on every record"], href: "/how-it-works#discover", visual: <DiscoverMock /> },
  { id: "qualify", label: "Qualify", icon: "chart", title: "Fit you can explain, intent you can check.", body: "Each lead shows why it fits your services, areas and timing, plus buying intent inferred from dated evidence.", points: ["Unknowns are listed, never guessed", "Budgets count only when the customer stated them"], href: "/how-it-works#qualify", visual: <FitCardMock /> },
  { id: "win", label: "Win", icon: "hammer", title: "A pipeline that keeps moving.", body: "Follow-ups, visits and proposals in one board, with outcomes and reasons recorded for every job.", points: ["Follow-up task created the moment an enquiry arrives", "Clients and repeat work tracked automatically"], href: "/how-it-works#win", visual: <PipelineMock /> },
  { id: "calendar", label: "Calendar", icon: "calendar", title: "Bookings without the back-and-forth.", body: "Visitors request a free time on your page; you confirm it, and it lands on your calendar and dashboard.", points: ["Your days, hours, meeting length and buffers", "Always in your business's time zone"], href: "/how-it-works#book", visual: <CalendarMock /> },
];

const SERVICES: { icon: BrandIconName; title: string; body: string; href: string }[] = [
  { icon: "page", title: "Landing pages that capture", body: "A mobile-first page per business with a short enquiry form, chat and time requests.", href: "/how-it-works#discover" },
  { icon: "discover", title: "Discover projects", body: "Project records from approved sources, with provenance and contact permissions.", href: "/how-it-works#discover" },
  { icon: "fit", title: "Fit and buying intent", body: "Scores that show their factors, and intent that's always labelled inferred.", href: "/how-it-works#qualify" },
  { icon: "pipeline", title: "Pipeline and follow-ups", body: "A task the moment an enquiry arrives, and a board from new to won.", href: "/how-it-works#win" },
  { icon: "calendar", title: "Calendar and bookings", body: "Visitors request a free time; you confirm it and it lands on your dashboard.", href: "/how-it-works#book" },
  { icon: "client", title: "Clients and repeat work", body: "Every won job becomes a client record with lifetime value.", href: "/how-it-works#grow" },
  { icon: "mappin", title: "Local area pages", body: "Pages for the suburbs, cities and ZIP codes you serve, built for local search.", href: "/leads" },
  { icon: "webhook", title: "Notifications and Make.com", body: "In-app alerts and signed webhooks to Slack, SMS or email.", href: "/resources#guides" },
  { icon: "spark", title: "Brex AI", body: "Summaries, next steps and drafts from your own records. You approve everything.", href: "/ai" },
];

const TRUST = [
  { title: "Provenance on every record", body: "Source, observed date and permitted use travel with each opportunity." },
  { title: "People stay in control", body: "Sending, booking, deleting and exporting always need a person." },
  { title: "Your data stays yours", body: "Each business is isolated in the app and by row-level security in the database." },
  { title: "Everything audited", body: "Sensitive actions and integration changes are written to the audit log." },
];

const FAQS = [
  { q: "Does Brexoo guarantee leads or jobs?", a: "No. Brexoo helps you find, qualify and follow up opportunities faster. Results depend on your market, your offer and how you respond." },
  { q: "How does Brexoo find projects?", a: "Through your own landing page and chat, calls and referrals you log, and project records (such as council DA, permit and tender registers) from sources you register and are allowed to use. Every record keeps its source, observed date and contact permission." },
  { q: "Are leads shared with other builders?", a: "No. Brexoo doesn't sell, share or auction leads. Enquiries to your page go only to your workspace, and imported records come only from sources you register." },
  { q: "Do I need to change how my team works?", a: "No. Brexoo follows the way you already quote and book: your services, your areas, your questions and your hours. Most teams are set up in a day." },
  { q: "Which countries do you support?", a: "Brexoo launches in the United States, Australia and New Zealand, with local time zones and currencies for each business." },
];

export default async function HomePage() {
  const currency = await visitorCurrency();
  return (
    <>
      <JsonLd data={ORG_LD} />
      {/* 1 — First screen: the film. The logo shapes climb five service steps and become the Brexoo logo. */}
      <section aria-labelledby="home-title" className="relative h-[calc(100svh-4rem)] min-h-[520px] overflow-hidden bg-white">
        <h1 id="home-title" className="sr-only">
          Brexoo: find, qualify and win local projects
        </h1>
        <StairsFilm className="absolute inset-0" />
        <a href="#workspace" aria-label="Scroll to see the workspace" className="absolute bottom-5 left-1/2 grid size-10 -translate-x-1/2 place-items-center rounded-full text-ink-3 hover:text-ink">
          <ArrowDown className="size-5 motion-safe:animate-bounce" aria-hidden />
        </a>
      </section>

      {/* 2 — The customer workspace, presented with real screens, then every Brexoo service. */}
      <section id="workspace" aria-labelledby="workspace-title" className="relative scroll-mt-16 overflow-hidden bg-page pb-24 pt-16 sm:pt-20">
        <MarkOutline className="absolute -left-40 top-24 hidden h-[520px] text-[#E6F4FF] lg:block" strokeWidth={30} />
        <Container className="relative">
          <div className="mx-auto max-w-[760px] text-center">
            <Eyebrow className="justify-center">The Brexoo workspace</Eyebrow>
            <h2 id="workspace-title" className="type-section mt-4">See the workspace your team will use.</h2>
            <p className="type-body mx-auto mt-4 max-w-[60ch] text-ink-2">Real screens from Coastline Homes, a sample builder in Newcastle, NSW: leads, fit, pipeline, calendar, clients and reports in one place.</p>
          </div>
          <div className="mt-10">
            <CrmShowcase />
          </div>

          <div className="mt-24">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <Eyebrow>Services</Eyebrow>
                <h2 className="type-section mt-4 max-w-[20ch]">Everything Brexoo does for your business.</h2>
              </div>
              <ButtonLink href="/how-it-works" variant="outline">
                See how it works <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
            </div>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map((f, k) => (
                <li key={f.title}>
                  <Reveal delay={(k % 4) * 0.05} className="h-full">
                    <Link href={f.href} className="group flex h-full flex-col rounded-[22px] border border-line bg-white p-6 transition-shadow hover:shadow-lg">
                      <BrandIcon name={f.icon} tone={TONE_CYCLE[k % TONE_CYCLE.length]} className="size-14 transition-transform duration-300 group-hover:-translate-y-0.5" />
                      <p className="type-card mt-5">{f.title}</p>
                      <p className="type-body mt-1.5 flex-1 text-ink-2">{f.body}</p>
                      <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-blue group-hover:gap-2">
                        Learn more <ArrowRight className="size-3.5" aria-hidden />
                      </span>
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* 2b — Brex AI on a real sample enquiry: why it fits, intent, and the next step. */}
      <section id="brex-ai" aria-labelledby="brex-ai-title" className="scroll-mt-20 border-t border-line bg-page py-24 sm:py-28">
        <Container className="grid grid-cols-[minmax(0,1fr)] items-start gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div className="lg:sticky lg:top-28">
            <Eyebrow>Brex AI</Eyebrow>
            <h2 id="brex-ai-title" className="type-section mt-4 max-w-[16ch]">Watch Brex AI qualify a real enquiry.</h2>
            <p className="type-body mt-5 max-w-[48ch] text-ink-2">
              A homeowner asks Coastline Homes, a sample builder in Newcastle, NSW, about a new double-storey home. In seconds Brex AI explains why it&apos;s a strong match, shows the evidence behind the buying intent, lists what&apos;s still unknown and recommends what to do next, with a call script ready for approval.
            </p>
            <ul className="mt-6 grid gap-2.5">
              {["Reads only your own records, and cites where each line came from", "Never guesses: unknowns are listed as unknown", "Never sends, books or deletes anything. You approve every message"].map((t) => (
                <li key={t} className="type-body flex gap-2.5 text-ink-2">
                  <BrandIcon name="approve" tone="cloud" className="size-6 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
            <ButtonLink href="/ai" variant="outline" className="mt-8">
              How Brex AI works <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
          <SlideIn from="right">
            <BrexAiExample />
            <p className="mt-3 text-center text-[12px] text-ink-3">Generated by Brexoo&apos;s own fit, intent and Brex AI logic for a sample record. Not a real customer.</p>
          </SlideIn>
        </Container>
      </section>

      {/* 2c — Exactly how Brexoo finds projects, and what happens next. */}
      <section id="sources" aria-labelledby="sources-title" className="scroll-mt-20 border-t border-line bg-[#F6F9FC] py-24 sm:py-28">
        <Container>
          <Eyebrow>How Brexoo finds projects</Eyebrow>
          <h2 id="sources-title" className="type-section mt-4 max-w-[22ch]">Where every opportunity comes from, and what happens next.</h2>
          <p className="type-body mt-5 max-w-[62ch] text-ink-2">No black box. Each record shows its source, how it was verified and why it scored the way it did, and nothing is shared with other builders.</p>
          <div className="mt-12">
            <ProjectSources />
          </div>
        </Container>
      </section>

      {/* 1b — The promise and the primary call to action. */}
      <section id="promise" className="scroll-mt-16 border-t border-line bg-page py-24">
        <Container>
          <Eyebrow>For small builders &amp; construction companies · USA · Australia · New Zealand</Eyebrow>
          <WordsReveal text="Turn local demand into your next project." accent={["next", "project."]} className="type-promo mt-5 max-w-[16ch] text-ink" />
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <Reveal delay={0.2}>
              <p className="type-body max-w-[52ch] text-ink-2">
                Brexoo is built for builders with 1–15 people. It brings in project enquiries, shows you which ones fit and keeps every follow-up and site visit moving, so you spend your time on the jobs you&apos;re most likely to win.
              </p>
            </Reveal>
            <Reveal delay={0.3} className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/demo" size="lg" className="px-7">
                Request a Demo <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href="/how-it-works" size="lg" variant="outline" className="px-7">
                See How It Works
              </ButtonLink>
            </Reveal>
          </div>
        </Container>
      </section>

      <Container>
        <LoopDivider />
      </Container>

      {/* 2 — Who it's for: small builders first, then the trades Brexoo also works for. */}
      <section aria-label="Who Brexoo is for" className="border-y border-line bg-page py-10">
        <Container className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
          <Link href={`/leads/${FOCUS_TRADE.slug}`} className="group flex items-center gap-5 rounded-[24px] bg-[#0F2742] p-6 text-white transition-shadow hover:shadow-lg sm:p-7">
            <Illustration name={FOCUS_TRADE.illustration} tone="blue" className="size-16 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5" />
            <span>
              <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#5FD4EA]">Built for</span>
              <span className="type-subhead mt-1 block">Small builders &amp; construction companies</span>
              <span className="mt-1 block text-[14px] text-white/70">New homes, extensions, renovations and developments · teams of 1–15 people</span>
            </span>
            <ArrowRight className="ml-auto size-5 shrink-0 text-white/60 transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>
          <div>
            <p className="text-[13px] font-medium text-ink-3">Also works for</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {OTHER_TRADES.map((t) => (
                <li key={t.slug}>
                  <Link href={`/leads/${t.slug}`} className="group inline-flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3.5 text-[13px] font-medium text-ink-2 hover:border-blue/40 hover:text-ink">
                    <Illustration name={t.illustration} tone="cloud" className="size-7" />
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* 3 — Product tour in tabs. */}
      <section id="engines" className="scroll-mt-20 bg-page py-24 sm:py-28">
        <Container>
          <Eyebrow>Discover · Qualify · Win</Eyebrow>
          <WordsReveal text="Everything between the first enquiry and the signed job." accent={["signed", "job."]} className="type-section mt-4 max-w-[20ch]" />
          <p className="type-body mt-5 max-w-[60ch] text-ink-2">One workspace for finding work, deciding what's worth quoting and keeping every follow-up moving. Shown here with a sample builder in Newcastle, NSW.</p>
          <div className="mt-12">
            <ProductTabs tabs={TABS} />
          </div>
        </Container>
      </section>

      {/* 4 — One workspace for every trade: the same sample businesses you can load in the app. */}
      <section className="bg-surface-2/50 py-24 sm:py-28">
        <Container>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <Eyebrow>Example workspaces</Eyebrow>
              <WordsReveal text="Made for builders. Tuned for every trade." accent={["builders."]} className="type-section mt-4 max-w-[18ch]" />
              <p className="type-body mt-4 max-w-[58ch] text-ink-2">Small builders come first; the same workspace adapts to other trades. These sample businesses are the ones you can load into your own workspace to explore. They're examples, not customers.</p>
            </div>
            <ButtonLink href="/industries" variant="outline">
              All industries <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRADES.map((t, k) => {
              const b = SAMPLE_BY_KEY[t.sample];
              const featured = t.slug === FOCUS_TRADE.slug;
              const leads = b.leads.filter((l) => l.stage !== "won" && l.stage !== "lost").slice(0, featured ? 4 : 2);
              return (
                <li key={t.slug} className={featured ? "sm:col-span-2 lg:row-span-2" : undefined}>
                  <TiltIn delay={(k % 4) * 0.06} className="h-full">
                    <Link href={`/leads/${t.slug}`} className={featured ? "group flex h-full flex-col rounded-[22px] border-2 border-[#0F2742] bg-white p-6 transition-shadow hover:shadow-lg" : "group flex h-full flex-col rounded-[22px] border border-line bg-white p-5 transition-shadow hover:shadow-lg"}>
                      <div className="flex items-start justify-between">
                        <Illustration name={t.illustration} tone="navy" className={featured ? "size-16" : "size-12"} />
                        <span className="flex flex-col items-end gap-1.5">
                          {featured ? <span className="rounded-full bg-[#0F2742] px-2.5 py-0.5 text-[11px] font-medium text-white">Our focus</span> : null}
                          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-3">{COUNTRIES[b.country].name}</span>
                        </span>
                      </div>
                      <p className="mt-4 text-[13px] font-medium text-blue">{t.name}</p>
                      <p className="type-card">{b.name}</p>
                      <p className="text-[13px] text-ink-3">
                        {b.city}, {findRegion(b.country, b.state)?.code}
                      </p>
                      {featured ? <p className="type-body mt-3 text-ink-2">{b.tagline} A sample builder with {b.areas.length} service areas and {b.leads.length} leads you can load into your own workspace.</p> : null}
                      <ul className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-2 border-t border-line pt-4">
                        {leads.map((l) => (
                          <li key={l.ref} className="flex min-w-0 items-center justify-between gap-2 text-[13px]">
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium">{l.name}</span>
                              <span className="block truncate text-ink-3">
                                {l.title} · {l.suburb || l.city}
                              </span>
                            </span>
                            <span className={l.fit === "Strong fit" ? "shrink-0 rounded-full bg-green-soft px-2 py-0.5 text-[11px] font-medium text-green-ink" : "shrink-0 rounded-full bg-amber-soft px-2 py-0.5 text-[11px] font-medium text-amber-ink"}>{l.fit}</span>
                          </li>
                        ))}
                      </ul>
                      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-[13px] font-medium text-blue group-hover:gap-2">
                        Leads for {t.plural.split(" ")[0]} <ArrowRight className="size-3.5" aria-hidden />
                      </span>
                    </Link>
                  </TiltIn>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      {/* 4b — Everything Brexoo covers, as a drifting wall of brand icons. */}
      <section aria-labelledby="covers" className="overflow-hidden bg-page py-20">
        <Container className="mb-10">
          <Eyebrow>One platform</Eyebrow>
          <h2 id="covers" className="type-section mt-4 max-w-[22ch]">Every trade, every step, every place you work.</h2>
        </Container>
        <IconWall />
      </section>

      {/* 5 — Brand band: the logo's outline behind the numbers that define Brexoo. */}
      <section className="relative overflow-hidden bg-[#0F2742] py-20 text-white sm:py-24">
        <MarkOutline className="absolute -right-24 top-1/2 h-[150%] -translate-y-1/2 text-white/[0.07]" strokeWidth={26} />
        <MarkOutline className="absolute -left-40 -top-24 h-[80%] text-[#06B6D4]/[0.12]" strokeWidth={22} />
        <Container className="relative grid grid-cols-2 gap-10 md:grid-cols-4">
          {[
            { to: BRAND_FACTS.markets, label: "Launch markets", sub: "USA · Australia · New Zealand", icon: "us" as const, tone: "blue" as const },
            { to: BRAND_FACTS.serviceTemplates, label: "Service templates", sub: "Questions tuned per trade", icon: "form" as const, tone: "teal" as const },
            { to: BRAND_FACTS.pipelineStages, label: "Pipeline stages", sub: "New to won, with reasons", icon: "pipeline" as const, tone: "cloud" as const },
            { to: BRAND_FACTS.recordsWithSourcePct, suffix: "%", label: "Records with a source", sub: "Every lead shows where it came from", icon: "source" as const, tone: "blue" as const },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <BrandIcon name={s.icon} tone={s.tone} className="size-12" />
              <CountUp to={s.to} suffix={s.suffix} className="mt-6 block text-[56px] leading-none tracking-[-0.035em] text-white sm:text-[72px] font-light" />
              <p className="mt-3 text-[15px] font-medium">{s.label}</p>
              <p className="text-[14px] text-white/65">{s.sub}</p>
            </Reveal>
          ))}
        </Container>
      </section>

      {/* 6 — Features with line illustrations, then the trust principles. */}
      <section className="bg-page py-24 sm:py-28">
        <Container>
          <div className="grid gap-10 rounded-[28px] bg-[#0f2742] p-8 text-white sm:p-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <Illustration name="shield" tone="teal" className="size-14" />
              <h2 className="type-section mt-5">Honest about data. Careful with people.</h2>
              <p className="type-body mt-4 text-white/70">A predicted opportunity is never shown as a confirmed request. Verified projects, direct enquiries, business prospects and inferred intent stay clearly apart.</p>
              <ButtonLink href="/resources#record-types" variant="inverse" className="mt-7">
                The four record types
              </ButtonLink>
            </div>
            <ul className="grid gap-5 sm:grid-cols-2">
              {TRUST.map((t) => (
                <li key={t.title} className="rounded-2xl border border-white/10 p-5">
                  <p className="text-[16px] font-medium">{t.title}</p>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-white/65">{t.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* 8 — Calendar: visitors request, you confirm. */}
      <section id="calendar" className="scroll-mt-20 bg-page py-24 sm:py-28">
        <Container>
          <Eyebrow>Bookings &amp; calendar</Eyebrow>
          <WordsReveal text="Visitors pick a time. You confirm with one click." accent={["one", "click."]} className="type-section mt-4 max-w-[20ch]" />
          <p className="type-body mt-5 max-w-[60ch] text-ink-2">Your page offers only your free times, in your time zone. Requests land on your calendar for you to confirm, and every booking shows up on the dashboard and in Make.com.</p>
          <div className="mt-12 grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <SlideIn from="bottom">
              <BookingMock />
            </SlideIn>
            <SlideIn from="bottom" delay={0.1}>
              <CalendarMock />
            </SlideIn>
          </div>
        </Container>
      </section>

      <Container>
        <LoopDivider className="mb-20" />
      </Container>

      {/* 8 — Plans tilt up. */}
      <section className="bg-page pb-24">
        <Container>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <Eyebrow>Pricing</Eyebrow>
              <h2 className="type-section mt-4">Plans that grow with you.</h2>
              <p className="type-body mt-2 text-ink-3">Pilot prices in {CURRENCY_NAME[currency]}, {TAX_NOTE[currency]}.</p>
              <CurrencySwitcher current={currency} className="mt-4" />
            </div>
            <ButtonLink href="/pricing" variant="outline">
              Compare plans <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {PLANS.map((p, i) => (
              <TiltIn key={p.code} delay={i * 0.1}>
                <Link href={`/pricing#${p.code}`} className="group block h-full rounded-[24px] border border-line bg-white p-7 shadow-sm transition-shadow hover:shadow-lg">
                  <p className="text-[15px] font-medium">{p.name}</p>
                  <p className="mt-5 whitespace-nowrap text-[44px] leading-none tracking-[-0.035em] tabular font-light xl:text-[48px]">{formatPrice(priceFor(p, currency).monthly, currency)}</p>
                  <p className="mt-1 text-[13px] text-ink-3">per month · {formatPrice(priceFor(p, currency).setup, currency)} setup</p>
                  <p className="type-body mt-5 text-ink-2">{p.positioning}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-blue group-hover:gap-2.5">
                    See what&apos;s included <ArrowRight className="size-4" aria-hidden />
                  </span>
                </Link>
              </TiltIn>
            ))}
          </div>
        </Container>
      </section>

      {/* 9 — Markets. */}
      <section id="markets" className="scroll-mt-20 border-t border-line bg-page py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <SlideIn from="left">
            <Eyebrow>Where we launch</Eyebrow>
            <h2 className="type-section mt-4">USA · Australia · New Zealand</h2>
            <p className="type-body mt-5 max-w-md text-ink-2">Each business works in its own time zone and currency, with appointments and reports in local time.</p>
          </SlideIn>
          <SlideIn from="right" className="grid gap-3">
            {[
              { c: "United States", d: "USD · Eastern to Pacific time" },
              { c: "Australia", d: "AUD · Sydney, Brisbane, Perth and more" },
              { c: "New Zealand", d: "NZD · Auckland time" },
            ].map((m) => (
              <div key={m.c} className="flex items-center justify-between rounded-2xl border border-line px-6 py-5">
                <span className="type-body">{m.c}</span>
                <span className="text-[14px] text-ink-3">{m.d}</span>
              </div>
            ))}
          </SlideIn>
        </Container>
      </section>

      {/* 10 — FAQ. */}
      <section className="bg-page pb-24">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <Eyebrow>Questions</Eyebrow>
            <h2 className="type-section mt-4">Straight answers.</h2>
            <p className="type-body mt-3 text-ink-3">
              Or ask us — the chat button is bottom right. <ShieldCheck className="inline size-4 text-teal-ink" aria-hidden />
            </p>
          </div>
          <Faq items={FAQS} />
        </Container>
      </section>

      <CtaBand title="Find your next project." body="See Brexoo with your own services and service area.">
        <ButtonLink href="/demo" variant="inverse" size="lg">
          Request a Demo
        </ButtonLink>
        <ButtonLink href="/signup" size="lg" className="border border-white/25 bg-white/10 text-white shadow-none hover:bg-white/15">
          Create an account
        </ButtonLink>
      </CtaBand>
    </>
  );
}
