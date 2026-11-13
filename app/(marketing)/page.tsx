import { ArrowRight, CalendarDays, ChartColumn, Database, Eye, Funnel, Lock, Search, ShieldCheck, Sparkles, Users, Waypoints } from "lucide-react";
import { INDUSTRY_TEMPLATES } from "@/config/industry-templates";
import { PLANS } from "@/config/plans";
import { ButtonLink } from "@/components/ui";
import { HeroProduct } from "@/components/marketing/HeroProduct";
import { IndustryTiles } from "@/components/marketing/brand-industries";
import { Swoosh } from "@/components/marketing/Swoosh";
import { INDUSTRY_ICON } from "@/components/marketing/industry-icons";
import { BookingMock, DiscoverMock, FitCardMock, PhonePageMock, PipelineMock, XooMock } from "@/components/marketing/mocks";
import { Reveal } from "@/components/marketing/Reveal";
import { Container, CtaBand, Faq, SectionHeading } from "@/components/marketing/Section";
import { WorkflowStory, type StoryStep } from "@/components/marketing/WorkflowStory";
import { formatMoney } from "@/lib/format";

const STEPS: StoryStep[] = [
  {
    id: "discover",
    kicker: "01 Discover",
    title: "See every opportunity with its source and date.",
    body: "Enquiries from your page land next to opportunities you add yourself. Each record says where it came from and when it was observed, so you know what you're looking at.",
    points: ["Enquiries, projects and prospects kept distinct", "Source, observed date and freshness on every record", "Sourced project data added only from approved sources"],
    visual: <DiscoverMock />,
  },
  {
    id: "qualify",
    kicker: "02 Qualify",
    title: "Know why it fits, and what's still missing.",
    body: "A transparent fit score built from service, location, timing and stated budget, shown factor by factor. Confidence in the evidence is shown separately.",
    points: ["No black-box scores and no invented budgets", "Missing details listed before you quote", "Your own qualification questions per service"],
    visual: <FitCardMock />,
  },
  {
    id: "engage",
    kicker: "03 Engage",
    title: "Reply fast, with drafts you approve.",
    body: "Xoo AI summarises the enquiry and drafts a follow-up from the record itself. You edit and approve. Nothing is sent on its own.",
    points: ["Summaries quote the underlying record", "Do-not-contact respected everywhere", "Follow-up tasks created automatically"],
    visual: <XooMock />,
  },
  {
    id: "book",
    kicker: "04 Book",
    title: "Book the call or site visit in the right time zone.",
    body: "Phone calls, video meetings and site visits with clear status: scheduled, confirmed, attended, no-show or rescheduled, each with a full history.",
    points: ["Times shown in the business's time zone", "Reschedules and cancellations kept on record", "Booking moves the opportunity forward"],
    visual: <BookingMock />,
  },
  {
    id: "win",
    kicker: "05 Win",
    title: "Track outcomes and learn what works.",
    body: "Move opportunities through estimate, won or lost with a reason. See response times, win rate and which sources and services bring the best work.",
    points: ["Loss reasons, not just losses", "Response time from enquiry to first contact", "Pipeline value where you've entered it"],
    visual: <PipelineMock />,
  },
];

const PROMISES = [
  { icon: Waypoints, title: "Provenance on every record", body: "Source, date and evidence travel with each opportunity. Inferred details are labelled as inferred." },
  { icon: Sparkles, title: "AI drafts, you decide", body: "Xoo AI reads and drafts. Sending, booking, deleting and exporting always need a person." },
  { icon: Lock, title: "Your data stays yours", body: "Every record is scoped to your business and checked on the server and in the database." },
];

const FAQS = [
  {
    q: "Does Brexoo guarantee leads or appointments?",
    a: "No. Brexoo gives you the tools to capture, qualify and follow up opportunities quickly. Results depend on your market, your offer and how you respond. Optional managed services are scoped separately, in writing.",
  },
  {
    q: "Where do opportunities come from?",
    a: "Today: enquiries from your Brexoo landing page and its chat assistant, plus records you add yourself. Sourced project data (for example tender or approval registers) is added one approved source at a time, after legal and permitted-use review, and always shows its source and date.",
  },
  {
    q: "Will the AI contact my customers?",
    a: "No. Xoo AI summarises, explains fit and drafts messages for you to review. It has read-only access to your own records and cannot send, book, delete or export anything.",
  },
  {
    q: "Can I use Brexoo for more than one trade?",
    a: "Yes. Choose every service you offer. Each comes with its own qualification questions, which you can edit or extend for your business.",
  },
  {
    q: "Who can see my enquiries?",
    a: "Only members of your organisation. Public pages never expose CRM records, and visitor details go only to the business they contacted.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,var(--canvas)_0%,var(--surface)_100%)]" />
        <Swoosh className="absolute -right-[10%] bottom-0 -z-10 h-[78%] w-[85%] max-lg:hidden" />
        <Swoosh className="absolute -right-1/3 bottom-0 -z-10 h-[40%] w-[160%] lg:hidden" />
        <Container className="grid items-center gap-12 pb-12 pt-14 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:pb-20">
          <div>
            <Reveal>
              <p className="text-[15px] font-semibold text-blue sm:text-[16px]">The AI Growth Platform for Builders &amp; Home Services</p>
              <span aria-hidden className="mt-3 block h-1 w-14 rounded-full bg-signal" />
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-6 max-w-[14ch] text-[42px] font-bold leading-[1.04] tracking-[-0.035em] text-ink sm:text-[58px] lg:text-[64px]">Turn Local Demand Into Your Next Project.</h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-ink-2 sm:text-[18px]">
                Project enquiries, AI-assisted qualification and follow-up for builders, trades and home service businesses.
              </p>
              <p className="mt-3 text-[16px] font-medium text-ink">Find project leads. Qualify opportunities. Book more jobs. Grow your business.</p>
            </Reveal>
            <Reveal delay={0.15} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/demo" size="lg" className="px-6 font-semibold">
                Request a Demo <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href="/how-it-works" size="lg" variant="outline" className="px-6 font-semibold text-ink">
                See How It Works
              </ButtonLink>
            </Reveal>
            <Reveal delay={0.2}>
              <ul className="mt-10 grid grid-cols-5 divide-x divide-line">
                {[
                  { icon: Search, label: "Discover Projects" },
                  { icon: Funnel, label: "Qualify with AI" },
                  { icon: Users, label: "Manage Leads (CRM)" },
                  { icon: CalendarDays, label: "Book Appointments" },
                  { icon: ChartColumn, label: "Grow Revenue" },
                ].map(({ icon: Icon, label }) => (
                  <li key={label} className="flex flex-col items-center gap-2 px-1 text-center">
                    <Icon className="size-7 text-blue" strokeWidth={1.6} aria-hidden />
                    <span className="text-[11px] font-semibold leading-tight text-ink sm:text-[13px]">{label}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <div className="relative">
            <HeroProduct />
          </div>
        </Container>
        <Container className="pb-16 sm:pb-20">
          <Reveal className="rounded-[22px] border border-line bg-surface/95 p-2 shadow-md backdrop-blur">
            <p className="sr-only">Built for these industries</p>
            <IndustryTiles />
          </Reveal>
        </Container>
      </section>

      {/* Promises */}
      <section className="border-y border-line bg-surface">
        <Container className="grid gap-px py-2 sm:grid-cols-3">
          {PROMISES.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 0.05} className="px-2 py-8 sm:px-6">
              <Icon className="size-5 text-blue" aria-hidden />
              <h2 className="mt-4 font-sans text-[16px] font-semibold tracking-normal">{title}</h2>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-3">{body}</p>
            </Reveal>
          ))}
        </Container>
      </section>

      {/* Workflow */}
      <section id="workflow" className="py-24 sm:py-32">
        <Container>
          <SectionHeading
            eyebrow="One workflow"
            title="From first interest to won work, in one place."
            body="Most service businesses lose good jobs between the enquiry and the follow-up. Brexoo keeps every step, and every handover, in view."
          />
          <div className="mt-14 sm:mt-20">
            <WorkflowStory steps={STEPS} />
          </div>
        </Container>
      </section>

      {/* Industries */}
      <section className="border-t border-line bg-surface py-24 sm:py-32">
        <Container>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading
              eyebrow="Built for your trade"
              title="One platform, tuned to the work you do."
              body="Pick your services. Brexoo sets up the right questions, forms and pipeline language for each one, and you can tailor every question."
            />
            <Reveal className="flex gap-3">
              <ButtonLink href="/builders" variant="secondary">
                For builders
              </ButtonLink>
              <ButtonLink href="/trades" variant="secondary">
                For trades
              </ButtonLink>
            </Reveal>
          </div>
          <ul className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {INDUSTRY_TEMPLATES.map((t, i) => {
              const Icon = INDUSTRY_ICON[t.code]!;
              return (
                <Reveal as="li" key={t.code} delay={(i % 5) * 0.03} className="group rounded-2xl border border-line bg-canvas p-4 transition-colors duration-200 hover:border-line-strong hover:bg-surface">
                  <Icon className="size-6 text-blue" strokeWidth={1.75} aria-hidden />
                  <p className="mt-6 text-[15px] font-medium">{t.name}</p>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink-3">{t.opportunityTypes.slice(0, 3).join(", ")}</p>
                </Reveal>
              );
            })}
          </ul>
        </Container>
      </section>

      {/* Landing pages */}
      <section className="py-24 sm:py-32">
        <Container className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Landing pages"
              title="A page that turns visitors into enquiries."
              body="Brexoo drafts a mobile-first page from your onboarding answers: your services, areas, process and FAQs, with a short enquiry form and a chat assistant that only uses what you've approved."
            />
            <Reveal className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                ["Approve before it's live", "Every change is a new version. Nothing publishes until an owner approves it."],
                ["Progressive questions", "Visitors answer a few questions at a time, with “Not sure” always allowed."],
                ["Consent and spam checks", "Clear consent, rate limits and bot protection on every form."],
                ["Never loses an enquiry", "Enquiries save before any notification is attempted."],
              ].map(([t, b]) => (
                <div key={t}>
                  <p className="text-[15px] font-semibold">{t}</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-ink-3">{b}</p>
                </div>
              ))}
            </Reveal>
          </div>
          <Reveal className="relative">
            <div aria-hidden className="absolute inset-0 -z-10 m-auto size-[420px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--sky)_22%,transparent),transparent_65%)]" />
            <PhonePageMock />
          </Reveal>
        </Container>
      </section>

      {/* Trust */}
      <section className="border-y border-line bg-surface py-24 sm:py-28">
        <Container>
          <SectionHeading eyebrow="Trust" title="Built to be honest about data." align="center" body="The rules we build by, so you can rely on what Brexoo shows you." />
          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Database, t: "Tenant isolation", b: "Every query is scoped to your organisation, enforced on the server and by row-level security in the database." },
              { icon: Eye, t: "Evidence, not guesses", b: "Fit factors show their reasons. Unknowns stay unknown. Budgets count only when the customer stated them." },
              { icon: ShieldCheck, t: "Consent and opt-outs", b: "Consent is recorded with each enquiry. Do-not-contact blocks outreach and is kept for suppression." },
              { icon: Lock, t: "Audit trail", b: "Approvals, publishing, stage changes and bookings are logged with who did what, and when." },
            ].map(({ icon: Icon, t, b }, i) => (
              <Reveal key={t} delay={i * 0.04} className="rounded-2xl border border-line bg-canvas p-6">
                <Icon className="size-5 text-teal-ink" aria-hidden />
                <p className="mt-5 text-[16px] font-semibold">{t}</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-3">{b}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Pricing teaser */}
      <section className="py-24 sm:py-32">
        <Container>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading eyebrow="Pricing" title="Plans that grow with your team." body="Clear limits, no hidden extras. Figures are illustrative while we run our pilot." />
            <Reveal>
              <ButtonLink href="/pricing" variant="secondary">
                Compare plans <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
            </Reveal>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {PLANS.map((p, i) => (
              <Reveal key={p.code} delay={i * 0.05} className="flex flex-col rounded-2xl border border-line bg-surface p-6 shadow-xs">
                <p className="text-[15px] font-semibold">{p.name}</p>
                <p className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-semibold tracking-tight tabular">{formatMoney(p.monthlyPriceMinor, p.currency)}</span>
                  <span className="text-sm text-ink-3">/ month</span>
                </p>
                <p className="mt-1 text-[13px] text-ink-3">+ {formatMoney(p.setupFeeMinor, p.currency)} setup</p>
                <p className="mt-4 text-[14px] leading-relaxed text-ink-2">{p.positioning}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="pb-24 sm:pb-32">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading eyebrow="Questions" title="Straight answers." body="If yours isn't here, ask us during a demo." />
          <Reveal>
            <Faq items={FAQS} />
          </Reveal>
        </Container>
      </section>

      <CtaBand title="Find your next project." body="See Brexoo with your own services and service area. We'll walk through the workflow and answer your questions.">
        <ButtonLink href="/demo" variant="inverse" size="lg" className="px-6">
          Request a demo
        </ButtonLink>
        <ButtonLink href="/signup" size="lg" className="border border-white/20 bg-white/10 px-6 text-white shadow-none hover:bg-white/15">
          Create an account
        </ButtonLink>
      </CtaBand>
    </>
  );
}
