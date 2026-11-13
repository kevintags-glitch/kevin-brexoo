import Link from "next/link";
import { ArrowDown, ArrowRight, CalendarDays, ChartColumn, Eye, Funnel, Lock, Search, ShieldCheck, Sparkles, Users, Waypoints } from "lucide-react";
import { INDUSTRY_TEMPLATES } from "@/config/industry-templates";
import { PLANS } from "@/config/plans";
import { ButtonLink } from "@/components/ui";
import { HeroVideo } from "@/components/marketing/HeroVideo";
import { INDUSTRY_ICON } from "@/components/marketing/industry-icons";
import { DiscoverMock, FitCardMock, OverviewMock, PipelineMock } from "@/components/marketing/mocks";
import { CountUp, HorizontalPin, Marquee, ScrollChat, ScrollMarquee, SlideIn, StackCards, TiltIn, WordsReveal, ZoomIn } from "@/components/marketing/motion";
import { Reveal } from "@/components/marketing/Reveal";
import { Container, CtaBand, Eyebrow, Faq } from "@/components/marketing/Section";
import { formatMoney } from "@/lib/format";

const ENGINES = [
  {
    n: "01",
    title: "Discover",
    lead: "Find projects and prospects.",
    body: "Enquiries from your pages and projects from sources you approve, side by side. Every record shows where it came from and when it was seen.",
    href: "/how-it-works#discover",
    visual: <DiscoverMock />,
  },
  {
    n: "02",
    title: "Qualify",
    lead: "Understand intent and fit.",
    body: "An explainable match for every lead: service, area, timing and stated budget, plus buying-intent evidence that's labelled as inferred, never as fact.",
    href: "/how-it-works#qualify",
    visual: <FitCardMock />,
  },
  {
    n: "03",
    title: "Win",
    lead: "Engage and manage the work.",
    body: "Follow-ups, site visits and proposals in one pipeline, with Brex AI drafting the next message for you to approve.",
    href: "/how-it-works#win",
    visual: <PipelineMock />,
  },
];

const FAQS = [
  { q: "Does Brexoo guarantee leads or jobs?", a: "No. Brexoo helps you find, qualify and follow up opportunities faster. Results depend on your market, your offer and how you respond." },
  { q: "Where do projects come from?", a: "Your landing page and its chat, records you add yourself, and project sources you register and have the right to use. Each one keeps its source and date." },
  { q: "Will Brex AI contact my customers?", a: "No. Brex AI summarises, explains fit, suggests the next best action and drafts messages. A person always approves and sends." },
  { q: "Which countries do you support?", a: "Brexoo launches in the United States, Australia and New Zealand, with local time zones and currencies for each business." },
];

export default function HomePage() {
  return (
    <>
      {/* 1 — The logo film fills the first screen. */}
      <section className="relative h-[calc(100dvh-4rem)] min-h-[520px] overflow-hidden bg-white">
        <HeroVideo />
        <div className="absolute inset-x-0 bottom-[7%] flex flex-col items-center gap-6 px-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/demo" size="lg" className="px-7">
              Request a Demo <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/how-it-works" size="lg" variant="outline" className="bg-white/80 px-7 backdrop-blur">
              See How It Works
            </ButtonLink>
          </div>
          <a href="#intro" className="flex flex-col items-center gap-1.5 text-[11px] uppercase tracking-[0.3em] text-ink-3 hover:text-ink">
            Scroll
            <ArrowDown className="size-4 motion-safe:animate-bounce" aria-hidden />
          </a>
        </div>
      </section>

      {/* 1b — The promise, big and thin. */}
      <section id="intro" className="bg-white py-24 md:py-32">
        <Container className="text-center">
          <Reveal>
            <p className="text-[13px] font-medium uppercase tracking-[0.28em] text-blue">The AI Growth Platform for Builders &amp; Home Services</p>
          </Reveal>
          <WordsReveal as="h1" text="Turn local demand into your next project." className="mx-auto mt-6 max-w-[17ch] text-[44px] font-extralight leading-[1.02] tracking-[-0.045em] text-ink sm:text-[72px] lg:text-[96px]" />
          <Reveal delay={0.3}>
            <p className="mx-auto mt-8 max-w-[52ch] text-[17px] font-light leading-relaxed text-ink-2 sm:text-[20px]">Find project leads. Qualify opportunities. Book more jobs. Grow your business — across the USA, Australia and New Zealand.</p>
          </Reveal>
          <Reveal delay={0.4}>
            <ul className="mx-auto mt-14 grid max-w-3xl grid-cols-5 divide-x divide-line">
              {[
                { icon: Search, label: "Discover Projects", href: "/how-it-works#discover" },
                { icon: Funnel, label: "Qualify with AI", href: "/how-it-works#qualify" },
                { icon: Users, label: "Manage Leads", href: "/how-it-works#win" },
                { icon: CalendarDays, label: "Book Appointments", href: "/how-it-works#book" },
                { icon: ChartColumn, label: "Grow Revenue", href: "/how-it-works#grow" },
              ].map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  <Link href={href} className="group flex flex-col items-center gap-2 px-1 text-center">
                    <Icon className="size-6 text-blue transition-transform duration-300 group-hover:-translate-y-1" strokeWidth={1.4} aria-hidden />
                    <span className="text-[11px] font-normal leading-tight text-ink-2 group-hover:text-ink sm:text-[13px]">{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>

      {/* 2 — Three engines: pinned, scrolls sideways. */}
      <section id="engines" className="relative bg-white">
        <Container className="pt-24 text-center md:pt-28">
          <Eyebrow>Three engines, one platform</Eyebrow>
          <WordsReveal text="Discover. Qualify. Win." className="mt-4 text-[44px] font-extralight tracking-[-0.045em] sm:text-[72px]" />
        </Container>
        <HorizontalPin>
          {ENGINES.map((e) => (
            <div key={e.n} className="grid w-full max-w-[1180px] items-center gap-10 rounded-[32px] bg-surface-2/60 p-8 md:grid-cols-[1fr_1fr] md:p-14">
              <div>
                <p className="text-[96px] font-extralight leading-none tracking-[-0.06em] text-blue/25 md:text-[140px]">{e.n}</p>
                <h3 className="mt-2 text-[44px] font-light tracking-[-0.04em] md:text-[60px]">{e.title}</h3>
                <p className="mt-2 text-[20px] font-light text-ink-2">{e.lead}</p>
                <p className="mt-5 max-w-md text-[16px] leading-relaxed text-ink-3">{e.body}</p>
                <Link href={e.href} className="mt-6 inline-flex items-center gap-2 text-[15px] font-medium text-blue hover:gap-3">
                  How {e.title.toLowerCase()} works <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
              <div className="max-md:hidden">{e.visual}</div>
            </div>
          ))}
        </HorizontalPin>
      </section>

      {/* 3 — Industries: two marquees moving opposite ways. */}
      <section className="overflow-hidden bg-white py-24">
        <Container className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Eyebrow>Built for these industries</Eyebrow>
            <WordsReveal text="One platform, tuned to your trade." className="mt-4 max-w-[16ch] text-[40px] font-light leading-[1.05] tracking-[-0.04em] sm:text-[56px]" />
          </div>
          <ButtonLink href="/industries" variant="outline">
            All industries <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </Container>
        <div className="mt-14 grid gap-4">
          {[INDUSTRY_TEMPLATES.slice(0, 8), INDUSTRY_TEMPLATES.slice(8)].map((row, r) => (
            <Marquee key={r} reverse={r === 1} speed={r === 0 ? 42 : 50}>
              {row.map((t) => {
                const Icon = INDUSTRY_ICON[t.code]!;
                return (
                  <Link key={t.code} href={["home_builder", "property_developer", "renovation"].includes(t.code) ? "/builders" : "/trades"} className="flex shrink-0 items-center gap-3 rounded-full border border-line bg-white px-6 py-4 text-[17px] font-light text-ink shadow-xs transition-colors hover:border-blue/40 hover:text-blue">
                    <Icon className="size-5 text-blue" strokeWidth={1.5} aria-hidden />
                    {t.name}
                  </Link>
                );
              })}
            </Marquee>
          ))}
        </div>
        <ScrollMarquee text="Builders · Electricians · Plumbers · HVAC · Renovation · Roofing · Landscaping · Cleaning ·" className="mt-16" />
      </section>

      {/* 4 — Facts that count up. */}
      <section className="border-y border-line bg-white py-20">
        <Container className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {[
            { to: 3, label: "Launch markets", sub: "USA · Australia · New Zealand" },
            { to: 15, label: "Service templates", sub: "Questions tuned per trade" },
            { to: 9, label: "Pipeline stages", sub: "New to won, with reasons" },
            { to: 100, suffix: "%", label: "Records with a source", sub: "Every lead shows where it came from" },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <CountUp to={s.to} suffix={s.suffix} className="block text-[56px] font-extralight leading-none tracking-[-0.05em] text-ink sm:text-[72px]" />
              <p className="mt-3 text-[15px] font-medium">{s.label}</p>
              <p className="text-[14px] font-light text-ink-3">{s.sub}</p>
            </Reveal>
          ))}
        </Container>
      </section>

      {/* 5 — Principles as stacking cards. */}
      <section className="bg-white py-24">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="lg:sticky lg:top-28 lg:h-fit">
            <Eyebrow>Trust, built in</Eyebrow>
            <WordsReveal text="Honest about data. Careful with people." className="mt-4 text-[40px] font-light leading-[1.05] tracking-[-0.04em] sm:text-[52px]" />
            <p className="mt-5 max-w-md text-[17px] font-light leading-relaxed text-ink-2">A predicted opportunity is never shown as a confirmed request. Brexoo keeps verified projects, direct enquiries, business prospects and inferred intent apart.</p>
            <ButtonLink href="/resources" variant="outline" className="mt-8">
              How we handle data
            </ButtonLink>
          </div>
          <StackCards
            items={[
              { title: "Provenance on every record.", body: "Source, observed date and permitted use travel with each opportunity. Inferred details are labelled as inferred.", tone: "bg-white text-ink", icon: <Waypoints className="text-blue" /> },
              { title: "Fit you can explain.", body: "Every match shows its factors and what's missing. Budgets count only when the customer stated them.", tone: "bg-[#e6f4ff] text-ink", icon: <Eye className="text-blue" /> },
              { title: "Brex AI drafts. You decide.", body: "Sending, booking, deleting and exporting always need a person. Brex AI reads only your own records.", tone: "bg-[#0f2742] text-white", icon: <Sparkles className="text-[#06b6d4]" /> },
              { title: "Your data stays yours.", body: "Each business is isolated by the server and by row-level security in the database, and every sensitive action is audited.", tone: "bg-[#06b6d4] text-[#062635]", icon: <Lock /> },
            ]}
          />
        </Container>
      </section>

      {/* 6 — Brex AI: a conversation that plays out as you scroll. */}
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff,#f4f9ff)] py-28">
        <Container className="grid items-start gap-14 lg:grid-cols-2">
          <SlideIn from="left" className="lg:sticky lg:top-32">
            <Eyebrow>Brex AI</Eyebrow>
            <h2 className="mt-4 text-[40px] font-light leading-[1.05] tracking-[-0.04em] sm:text-[56px]">Your project and sales assistant.</h2>
            <p className="mt-5 max-w-md text-[17px] font-light leading-relaxed text-ink-2">Summaries that quote the record, the next best action, follow-up drafts and site-visit briefs. Grounded in your data, never sent on its own.</p>
            <ButtonLink href="/ai" className="mt-8">
              Meet Brex AI <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </SlideIn>
          <div className="rounded-[28px] border border-line bg-white p-5 shadow-lg sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-[#0f2742] text-white">
                <Sparkles className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-[14px] font-semibold">Brex AI</p>
                <p className="text-[12px] text-ink-3">Read-only · cites your records</p>
              </div>
            </div>
            <ScrollChat
              messages={[
                { from: "user", text: "Summarise this lead and the next best action." },
                { from: "ai", text: "Sarah wants a double-storey new build in Merewether, starting in 1–3 months. She owns the land. Budget wasn't stated.", meta: "Enquiry 7F3A21C0" },
                { from: "ai", text: "Buying intent: High — requested a site visit, gave a near start date and resubmitted once.", meta: "Inferred from recorded evidence" },
                { from: "ai", text: "Next best action: call Sarah to confirm budget range, then book a site visit.", meta: "Next step" },
                { from: "user", text: "Draft the follow-up email." },
                { from: "ai", text: "Hi Sarah, thanks for getting in touch about your new build in Merewether… (draft ready for your review)", meta: "Nothing is sent without your approval" },
              ]}
            />
          </div>
        </Container>
      </section>

      {/* 7 — Product shot zooms into place. */}
      <section className="bg-white py-24">
        <Container className="text-center">
          <Eyebrow>Your workspace</Eyebrow>
          <WordsReveal text="Every lead, task and booking in one calm place." className="mx-auto mt-4 max-w-[20ch] text-[40px] font-light leading-[1.05] tracking-[-0.04em] sm:text-[56px]" />
        </Container>
        <Container className="mt-14">
          <ZoomIn>
            <OverviewMock />
          </ZoomIn>
        </Container>
      </section>

      {/* 8 — Plans tilt up. */}
      <section className="bg-white pb-24">
        <Container>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <Eyebrow>Pricing</Eyebrow>
              <h2 className="mt-4 text-[40px] font-light tracking-[-0.04em] sm:text-[52px]">Plans that grow with you.</h2>
              <p className="mt-2 text-[15px] font-light text-ink-3">Illustrative pricing in USD while we run our pilot.</p>
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
                  <p className="mt-5 text-[52px] font-extralight leading-none tracking-[-0.05em] tabular">{formatMoney(p.monthlyPriceMinor, p.currency)}</p>
                  <p className="mt-1 text-[13px] text-ink-3">per month · {formatMoney(p.setupFeeMinor, p.currency)} setup</p>
                  <p className="mt-5 text-[15px] font-light leading-relaxed text-ink-2">{p.positioning}</p>
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
            <h2 className="mt-4 text-[40px] font-light leading-[1.05] tracking-[-0.04em] sm:text-[52px]">USA · Australia · New Zealand</h2>
            <p className="mt-5 max-w-md text-[17px] font-light leading-relaxed text-ink-2">Each business works in its own time zone and currency, with appointments and reports in local time.</p>
          </SlideIn>
          <SlideIn from="right" className="grid gap-3">
            {[
              { c: "United States", d: "USD · Eastern to Pacific time" },
              { c: "Australia", d: "AUD · Sydney, Brisbane, Perth and more" },
              { c: "New Zealand", d: "NZD · Auckland time" },
            ].map((m) => (
              <div key={m.c} className="flex items-center justify-between rounded-2xl border border-line px-6 py-5">
                <span className="text-[20px] font-light">{m.c}</span>
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
            <h2 className="mt-4 text-[40px] font-light tracking-[-0.04em]">Straight answers.</h2>
            <p className="mt-3 text-[16px] font-light text-ink-3">
              Or ask Brex AI — the chat button is bottom right. <ShieldCheck className="inline size-4 text-teal-ink" aria-hidden />
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
