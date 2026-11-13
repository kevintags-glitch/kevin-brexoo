import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, ShieldCheck } from "lucide-react";
import { PLANS } from "@/config/plans";
import { ButtonLink } from "@/components/ui";
import { AnimatedMark } from "@/components/brand/AnimatedMark";
import { HeroDemo } from "@/components/marketing/HeroDemo";
import { IconWall } from "@/components/marketing/IconWall";
import { BookingMock, CalendarMock, DiscoverMock, FitCardMock, PipelineMock } from "@/components/marketing/mocks";
import { Illustration, type IllustrationName } from "@/components/marketing/illustrations";
import { ProductTabs, type ProductTab } from "@/components/marketing/ProductTabs";
import { COUNTRIES, findRegion } from "@/config/locations";
import { SAMPLE_BY_KEY } from "@/config/samples";
import { TRADES } from "@/config/trades";
import { CountUp, SlideIn, TiltIn, WordsReveal } from "@/components/marketing/motion";
import { Reveal } from "@/components/marketing/Reveal";
import { Container, CtaBand, Eyebrow, Faq } from "@/components/marketing/Section";
import { JsonLd } from "@/components/seo/JsonLd";
import { absolute } from "@/lib/seo";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: { absolute: "Brexoo — Find, qualify and win local projects" }, alternates: { canonical: "/" } };

const ORG_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Brexoo",
  url: absolute("/"),
  logo: absolute("/brand/brexoo-logo.png"),
  description: "The growth platform for builders and home-service businesses in the USA, Australia and New Zealand.",
  areaServed: ["US", "AU", "NZ"].map((c) => ({ "@type": "Country", name: c })),
};

const TABS: ProductTab[] = [
  { id: "discover", label: "Discover", icon: "magnifier", title: "Every opportunity, with where it came from.", body: "Enquiries from your page and chat, and project records from sources you're allowed to use, side by side.", points: ["Verified projects, enquiries, prospects and inferred signals labelled apart", "Observed date and source on every record"], href: "/how-it-works#discover", visual: <DiscoverMock /> },
  { id: "qualify", label: "Qualify", icon: "chart", title: "Fit you can explain, intent you can check.", body: "Each lead shows why it fits your services, areas and timing, plus buying intent inferred from dated evidence.", points: ["Unknowns are listed, never guessed", "Budgets count only when the customer stated them"], href: "/how-it-works#qualify", visual: <FitCardMock /> },
  { id: "win", label: "Win", icon: "hammer", title: "A pipeline that keeps moving.", body: "Follow-ups, visits and proposals in one board, with outcomes and reasons recorded for every job.", points: ["Follow-up task created the moment an enquiry arrives", "Clients and repeat work tracked automatically"], href: "/how-it-works#win", visual: <PipelineMock /> },
  { id: "calendar", label: "Calendar", icon: "calendar", title: "Bookings without the back-and-forth.", body: "Visitors request a free time on your page; you confirm it, and it lands on your calendar and dashboard.", points: ["Your days, hours, meeting length and buffers", "Always in your business's time zone"], href: "/how-it-works#book", visual: <CalendarMock /> },
];

const FEATURES: { icon: IllustrationName; title: string; body: string; href: string }[] = [
  { icon: "chat", title: "Landing pages that capture", body: "A mobile-first page per business with a short enquiry form, chat and time requests.", href: "/how-it-works#discover" },
  { icon: "magnifier", title: "Discover projects", body: "Import project records from approved sources, with provenance and contact permissions.", href: "/how-it-works#discover" },
  { icon: "chart", title: "Fit and buying intent", body: "Explainable scores that show their factors, and intent that's always labelled inferred.", href: "/how-it-works#qualify" },
  { icon: "calendar", title: "Calendar and bookings", body: "A weekly view on your dashboard, booking requests from your page and reminders.", href: "/how-it-works#book" },
  { icon: "chart", title: "Clients & repeat work", body: "Every won job becomes a client record, with lifetime value and the next project to chase.", href: "/how-it-works#grow" },
  { icon: "bolt", title: "Notifications & Make.com", body: "In-app alerts and signed webhooks to Slack, SMS or email through your Make scenarios.", href: "/resources#guides" },
];

const TRUST = [
  { title: "Provenance on every record", body: "Source, observed date and permitted use travel with each opportunity." },
  { title: "People stay in control", body: "Sending, booking, deleting and exporting always need a person." },
  { title: "Your data stays yours", body: "Each business is isolated in the app and by row-level security in the database." },
  { title: "Everything audited", body: "Sensitive actions and integration changes are written to the audit log." },
];

const FAQS = [
  { q: "Does Brexoo guarantee leads or jobs?", a: "No. Brexoo helps you find, qualify and follow up opportunities faster. Results depend on your market, your offer and how you respond." },
  { q: "Where do projects come from?", a: "Your landing page and its chat, records you add yourself, and project sources you register and have the right to use. Each one keeps its source and date." },
  { q: "Do I need to change how my team works?", a: "No. Brexoo follows the way you already quote and book: your services, your areas, your questions and your hours. Most teams are set up in a day." },
  { q: "Which countries do you support?", a: "Brexoo launches in the United States, Australia and New Zealand, with local time zones and currencies for each business." },
];

export default function HomePage() {
  return (
    <>
      <JsonLd data={ORG_LD} />
      {/* 1 — First screen: no words. The logo mark draws itself beside a live CRM demo. */}
      <section aria-labelledby="home-title" className="relative overflow-hidden bg-white">
        <h1 id="home-title" className="sr-only">
          Brexoo: find, qualify and win local projects
        </h1>
        <Container className="grid min-h-[calc(100dvh-4rem)] items-center gap-10 py-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <AnimatedMark className="mx-auto w-full max-w-[260px] sm:max-w-[340px] lg:max-w-[420px]" />
          <HeroDemo className="w-full" />
        </Container>
        <a href="#promise" aria-label="Scroll to learn more" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-ink-3 hover:text-ink sm:block">
          <ArrowDown className="size-5 motion-safe:animate-bounce" aria-hidden />
        </a>
      </section>

      {/* 1b — The promise and the primary call to action. */}
      <section id="promise" className="scroll-mt-16 bg-white pb-24 pt-8 sm:pt-12">
        <Container>
          <Eyebrow>For builders &amp; home services · USA · Australia · New Zealand</Eyebrow>
          <WordsReveal text="Turn local demand into your next project." accent={["next", "project."]} className="type-promo mt-5 max-w-[16ch] text-ink" />
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <Reveal delay={0.2}>
              <p className="type-body max-w-[52ch] text-ink-2">
                Brexoo finds project leads, shows you which ones fit and keeps every follow-up and booking moving, so you spend your time on the jobs you&apos;re most likely to win.
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

      {/* 2 — Who it's for: launch industries, each with its own illustration. */}
      <section aria-label="Industries" className="border-y border-line bg-white py-8">
        <Container>
          <p className="text-[14px] text-ink-3">Built for builders and home-service businesses in the United States, Australia and New Zealand</p>
          <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 lg:grid-cols-8">
            {TRADES.map((t) => (
              <li key={t.slug}>
                <Link href={`/leads/${t.slug}`} className="group flex items-center gap-2.5 text-[14px] font-medium text-ink-2 hover:text-ink">
                  <Illustration name={t.illustration} className="size-9 transition-transform duration-300 group-hover:-translate-y-0.5" />
                  <span className="leading-tight">{t.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* 3 — Product tour in tabs. */}
      <section id="engines" className="scroll-mt-20 bg-white py-24 sm:py-28">
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
              <WordsReveal text="One workspace, tuned to every trade." accent={["every", "trade."]} className="type-section mt-4 max-w-[18ch]" />
              <p className="type-body mt-4 max-w-[58ch] text-ink-2">These sample businesses are the same ones you can load into your own workspace to explore. They're examples, not customers.</p>
            </div>
            <ButtonLink href="/industries" variant="outline">
              All industries <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRADES.map((t, k) => {
              const b = SAMPLE_BY_KEY[t.sample];
              const leads = b.leads.filter((l) => l.stage !== "won" && l.stage !== "lost").slice(0, 2);
              return (
                <li key={t.slug}>
                  <TiltIn delay={(k % 4) * 0.06} className="h-full">
                    <Link href={`/leads/${t.slug}`} className="group flex h-full flex-col rounded-[22px] border border-line bg-white p-5 transition-shadow hover:shadow-lg">
                      <div className="flex items-start justify-between">
                        <Illustration name={t.illustration} className="size-12" />
                        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-3">{COUNTRIES[b.country].name}</span>
                      </div>
                      <p className="mt-4 text-[13px] font-medium text-blue">{t.name}</p>
                      <p className="type-card">{b.name}</p>
                      <p className="text-[13px] text-ink-3">
                        {b.city}, {findRegion(b.country, b.state)?.code}
                      </p>
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
      <section aria-labelledby="covers" className="overflow-hidden bg-white py-20">
        <Container className="mb-10">
          <Eyebrow>One platform</Eyebrow>
          <h2 id="covers" className="type-section mt-4 max-w-[22ch]">Every trade, every step, every place you work.</h2>
        </Container>
        <IconWall />
      </section>

      {/* 5 — Facts that count up. */}
      <section className="border-y border-line bg-white py-20">
        <Container className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {[
            { to: 3, label: "Launch markets", sub: "USA · Australia · New Zealand" },
            { to: 15, label: "Service templates", sub: "Questions tuned per trade" },
            { to: 9, label: "Pipeline stages", sub: "New to won, with reasons" },
            { to: 100, suffix: "%", label: "Records with a source", sub: "Every lead shows where it came from" },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <CountUp to={s.to} suffix={s.suffix} className="block text-[56px] leading-none tracking-[-0.035em] text-ink sm:text-[72px] font-light" />
              <p className="mt-3 text-[15px] font-medium">{s.label}</p>
              <p className="text-[14px] text-ink-3">{s.sub}</p>
            </Reveal>
          ))}
        </Container>
      </section>

      {/* 6 — Features with line illustrations, then the trust principles. */}
      <section className="bg-white py-24 sm:py-28">
        <Container>
          <Eyebrow>Everything in one place</Eyebrow>
          <WordsReveal text="Less admin. More of the right jobs." accent={["right", "jobs."]} className="type-section mt-4 max-w-[18ch]" />
          <ul className="mt-12 grid gap-px overflow-hidden rounded-[24px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, k) => (
              <li key={f.title} className="bg-white">
                <Reveal delay={(k % 3) * 0.05} className="h-full">
                  <Link href={f.href} className="group flex h-full flex-col p-7 hover:bg-surface-2/40">
                    <Illustration name={f.icon} className="size-14" />
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
          <div className="mt-16 grid gap-10 rounded-[28px] bg-[#0f2742] p-8 text-white sm:p-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <Illustration name="shield" className="size-14 [--ink:white]" />
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
      <section id="calendar" className="scroll-mt-20 bg-white py-24 sm:py-28">
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

      {/* 8 — Plans tilt up. */}
      <section className="bg-white pb-24">
        <Container>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <Eyebrow>Pricing</Eyebrow>
              <h2 className="type-section mt-4">Plans that grow with you.</h2>
              <p className="type-body mt-2 text-ink-3">Illustrative pricing in USD while we run our pilot.</p>
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
                  <p className="mt-5 text-[52px] leading-none tracking-[-0.035em] tabular font-light">{formatMoney(p.monthlyPriceMinor, p.currency)}</p>
                  <p className="mt-1 text-[13px] text-ink-3">per month · {formatMoney(p.setupFeeMinor, p.currency)} setup</p>
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
      <section id="markets" className="scroll-mt-20 border-t border-line bg-white py-24">
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
      <section className="bg-white pb-24">
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
