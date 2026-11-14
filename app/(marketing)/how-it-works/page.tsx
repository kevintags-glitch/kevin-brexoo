import type { Metadata } from "next";
import { Check } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { BrexMock, CalendarMock, DiscoverMock, FitCardMock, PipelineMock } from "@/components/marketing/mocks";
import { DrawLine, ScrollMarquee, SlideIn, SnapCarousel } from "@/components/marketing/motion";
import { BrandIcon, type BrandIconName } from "@/components/marketing/brand-icons";
import { PageHero } from "@/components/marketing/PageHero";
import { ProjectSources } from "@/components/marketing/ProjectSources";
import { Container, CtaBand, Eyebrow } from "@/components/marketing/Section";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { alternates: { canonical: "/how-it-works" },
  title: "How it works",
  description: "Discover, qualify, engage, book and win: how Brexoo moves an opportunity from first interest to won work.",
};

const STEPS = [
  { id: "discover", kicker: "Discover", title: "Every opportunity, with where it came from.", body: "Your landing page and chat assistant send enquiries straight in. Add opportunities you hear about yourself, and import project records from sources you're allowed to use.", points: ["Verified project, direct enquiry, business prospect and inferred signal are labelled differently", "Observed date and import date kept apart"], visual: <DiscoverMock /> },
  { id: "qualify", kicker: "Qualify", title: "Fit you can explain to your team.", body: "Fit compares the opportunity with your services, areas and preferences. Buying intent is inferred from recorded evidence and labelled that way.", points: ["Unknowns are listed, not guessed", "Qualify or disqualify with a recorded reason"], visual: <FitCardMock /> },
  { id: "win", kicker: "Engage", title: "Fast follow-up without losing control.", body: "A follow-up task is created the moment an enquiry arrives. Brex AI drafts the reply; you approve it and send it.", points: ["Do-not-contact blocks outreach", "Every contact attempt is on the timeline"], visual: <BrexMock /> },
  { id: "book", kicker: "Book", title: "Appointments that stay accurate.", body: "Visitors pick from your free times on your page; you confirm with one click. Phone, video or site visit, always in your business's time zone across the USA, Australia and New Zealand.", points: ["Scheduled, confirmed, attended, no-show, cancelled, rescheduled", "Booking advances the pipeline"], visual: <CalendarMock /> },
  { id: "grow", kicker: "Win & grow", title: "Outcomes, and what they teach you.", body: "Close opportunities as won or lost with a reason. Reports show response time, lead sources, win rate and pipeline by stage.", points: ["Measured on outcomes, not raw lead volume"], visual: <PipelineMock /> },
];

const STEP_ICON: Record<string, BrandIconName> = { discover: "discover", qualify: "fit", win: "pipeline", book: "booking", grow: "won" };

const LIFECYCLE = [
  ["Discover", "Enquiries from your page and records you add, each with source and freshness."],
  ["Identify", "Project type, location, timing and scope, with unknowns clearly marked."],
  ["Score", "Explainable fit and a separate confidence level. Never an unexplained AI score."],
  ["Capture", "Contact, project and enquiry saved as one traceable record."],
  ["Qualify", "Your questions, your criteria, a recorded decision with a reason."],
  ["Engage", "Tasks and drafts for approved communication, respecting opt-outs."],
  ["Book", "Calls and site visits with time zone, status and history."],
  ["Convert", "Estimate, won or lost, with value and loss reasons."],
  ["Learn", "Outcomes by source, industry and service to guide decisions."],
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title="From first interest to won work." accent={["won", "work"]}
        body="One workflow for the whole life of an opportunity, with a record of every step so nothing depends on memory or a spreadsheet."
      >
        <ButtonLink href="/demo" size="lg">
          Request a Demo
        </ButtonLink>
        <ButtonLink href="#discover" size="lg" variant="outline">
          Start the tour
        </ButtonLink>
        <ButtonLink href="#sources" size="lg" variant="ghost">
          Where projects come from
        </ButtonLink>
      </PageHero>

      {/* A drawn line runs down the page; steps swing in from alternating sides. */}
      <section className="relative bg-page py-16 sm:py-24">
        <DrawLine />
        <Container className="relative grid gap-28 sm:gap-40">
          {STEPS.map((s, i) => {
            const flip = i % 2 === 1;
            return (
              <article key={s.id} id={s.id} className="grid scroll-mt-28 items-center gap-10 max-md:pl-10 md:grid-cols-2 md:gap-24">
                <SlideIn from={flip ? "right" : "left"} className={cn(flip && "md:order-last")}>
                  <BrandIcon name={STEP_ICON[s.id]!} tone={(["navy", "blue", "teal", "cloud", "navy"] as const)[i]} className="mb-5 size-16" />
                  <p className="type-label flex items-center gap-3 uppercase tracking-[0.2em] text-blue">
                    <span className="text-ink-3 tabular">{String(i + 1).padStart(2, "0")}</span>
                    {s.kicker}
                  </p>
                  <h2 className="type-section mt-4">{s.title}</h2>
                  <p className="type-body mt-5 text-ink-2">{s.body}</p>
                  <ul className="mt-6 grid gap-2.5">
                    {s.points.map((p) => (
                      <li key={p} className="type-body flex gap-2.5 text-ink-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-teal-ink" aria-hidden />
                        {p}
                      </li>
                    ))}
                  </ul>
                </SlideIn>
                <SlideIn from={flip ? "left" : "right"} delay={0.1}>
                  {s.visual}
                </SlideIn>
              </article>
            );
          })}
        </Container>
      </section>

      {/* Exactly where projects come from, how they're checked and scored, and who sees them. */}
      <section id="sources" aria-labelledby="sources-title" className="scroll-mt-24 border-t border-line bg-[#F6F9FC] py-20 sm:py-28">
        <Container>
          <Eyebrow>Sourcing rules</Eyebrow>
          <h2 id="sources-title" className="type-section mt-4 max-w-[22ch]">How Brexoo finds projects, in full.</h2>
          <p className="type-body mt-5 max-w-[64ch] text-ink-2">
            The same rules the product enforces: where an opportunity may come from, what has to be true before it&apos;s labelled verified, how intent is scored, and why your leads are never shared.
          </p>
          <div className="mt-12">
            <ProjectSources detailed />
          </div>
        </Container>
      </section>

      {/* The lifecycle as a sideways carousel under a drifting word band. */}
      <section className="overflow-hidden border-t border-line bg-surface-2/50 py-20 sm:py-28">
        <ScrollMarquee text="Discover · Identify · Score · Capture · Qualify · Engage · Book · Convert · Learn ·" />
        <Container className="-mt-6">
          <Eyebrow>The full lifecycle</Eyebrow>
          <h2 className="type-section mt-4">Nine stages, one record.</h2>
          <SnapCarousel label="lifecycle stages" className="mt-8">
            {LIFECYCLE.map(([t, b], i) => (
              <div key={t} className="flex h-full min-h-[220px] flex-col justify-between rounded-[24px] border border-line bg-white p-7 shadow-xs">
                <p className="text-[56px] leading-none tracking-[-0.035em] text-blue/30 tabular font-light">{String(i + 1).padStart(2, "0")}</p>
                <div>
                  <p className="type-subhead">{t}</p>
                  <p className="type-body mt-1.5 text-ink-3">{b}</p>
                </div>
              </div>
            ))}
          </SnapCarousel>
        </Container>
      </section>

      <div className="bg-page pt-24">
        <CtaBand title="Walk through it with us." body="A 30-minute demo using your services and service area.">
          <ButtonLink href="/demo" variant="inverse" size="lg">
            Request a Demo
          </ButtonLink>
        </CtaBand>
      </div>
    </>
  );
}
