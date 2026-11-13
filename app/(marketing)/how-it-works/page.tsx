import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui";
import { BookingMock, DiscoverMock, FitCardMock, PipelineMock, XooMock } from "@/components/marketing/mocks";
import { PageHero } from "@/components/marketing/PageHero";
import { Reveal } from "@/components/marketing/Reveal";
import { Container, CtaBand, SectionHeading } from "@/components/marketing/Section";
import { WorkflowStory } from "@/components/marketing/WorkflowStory";

export const metadata: Metadata = {
  title: "How it works",
  description: "Discover, qualify, engage, book and win: how Brexoo moves an opportunity from first interest to won work.",
};

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
        title="Discover, qualify, engage, book, win."
        body="Brexoo is one workflow for the whole life of an opportunity, with a record of every step so nothing depends on memory or a spreadsheet."
      >
        <ButtonLink href="/demo" size="lg">
          Request a demo
        </ButtonLink>
      </PageHero>
      <section className="py-20 sm:py-28">
        <Container>
          <WorkflowStory
            steps={[
              { id: "d", kicker: "Discover", title: "Every opportunity, with where it came from.", body: "Your landing page and chat assistant send enquiries straight in. Add opportunities you hear about yourself. Sourced project data arrives one approved source at a time.", points: ["Enquiry, prospect and project opportunity are different things, and labelled so", "Observed date and import date kept apart"], visual: <DiscoverMock /> },
              { id: "q", kicker: "Qualify", title: "Fit you can explain to your team.", body: "Fit compares the opportunity with your services, areas and preferences. Confidence describes the evidence. Both show their reasons.", points: ["Unknowns are listed, not guessed", "Qualify or disqualify with a recorded reason"], visual: <FitCardMock /> },
              { id: "e", kicker: "Engage", title: "Fast follow-up without losing control.", body: "A follow-up task is created the moment an enquiry arrives. Xoo AI drafts the reply; you approve it and send it.", points: ["Do-not-contact blocks outreach", "Every contact attempt is on the timeline"], visual: <XooMock /> },
              { id: "b", kicker: "Book", title: "Appointments that stay accurate.", body: "Phone, video or site visit. Times are stored in UTC and shown in your business's time zone, including across daylight-saving changes.", points: ["Scheduled, confirmed, attended, no-show, cancelled, rescheduled", "Booking advances the pipeline"], visual: <BookingMock /> },
              { id: "w", kicker: "Win", title: "Outcomes, and what they teach you.", body: "Close opportunities as won or lost with a reason. Reports show response time, qualification rate, win rate and pipeline by stage.", points: ["Measured on validity and outcomes, not raw lead volume"], visual: <PipelineMock /> },
            ]}
          />
        </Container>
      </section>
      <section className="border-t border-line bg-surface py-20 sm:py-28">
        <Container>
          <SectionHeading eyebrow="The full lifecycle" title="Nine stages, one record." />
          <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
            {LIFECYCLE.map(([t, b], i) => (
              <Reveal as="li" key={t} delay={(i % 3) * 0.04} className="bg-surface p-6">
                <p className="text-[12px] font-semibold tabular text-ink-3">{String(i + 1).padStart(2, "0")}</p>
                <p className="mt-3 text-[17px] font-semibold">{t}</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-3">{b}</p>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>
      <div className="pt-24">
        <CtaBand title="Walk through it with us." body="A 30-minute demo using your services and service area.">
          <ButtonLink href="/demo" variant="inverse" size="lg">
            Request a demo
          </ButtonLink>
        </CtaBand>
      </div>
    </>
  );
}
