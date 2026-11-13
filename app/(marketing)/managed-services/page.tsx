import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui";
import { PageHero } from "@/components/marketing/PageHero";
import { CountUp, StickySteps, TiltIn } from "@/components/marketing/motion";
import { Container, CtaBand, Faq, SectionHeading } from "@/components/marketing/Section";

export const metadata: Metadata = { alternates: { canonical: "/managed-services" },
  title: "Managed services",
  description: "Optional, separately scoped human qualification and follow-up, run inside your Brexoo workspace.",
};

export default function ManagedServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Managed services"
        title="People who qualify and follow up for you." accent={["for", "you"]}
        body="An optional service, scoped in writing: agreed channels, hours, contact limits and escalation rules. Our team works inside your Brexoo workspace, so every call and note is on the record."
      >
        <ButtonLink href="/demo" size="lg">
          Discuss the service
        </ButtonLink>
      </PageHero>
      <section className="border-y border-line bg-white py-16">
        <Container className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {[
            { to: 20, label: "Hours a month", sub: "Included in the Managed plan" },
            { to: 4, label: "Things agreed in writing", sub: "Channels, hours, brief, service levels" },
            { to: 6, label: "Steps per handoff", sub: "Every one on the record" },
            { to: 0, label: "Guaranteed outcomes", sub: "We guarantee effort, not results" },
          ].map((s) => (
            <div key={s.label}>
              <CountUp to={s.to} className="block text-[60px] font-semibold leading-none tracking-[-0.025em]" />
              <p className="mt-3 text-[15px] font-medium">{s.label}</p>
              <p className="text-[14px] text-ink-3">{s.sub}</p>
            </div>
          ))}
        </Container>
      </section>
      <section className="py-20 sm:py-28">
        <Container>
          <SectionHeading eyebrow="What's agreed up front" title="Defined, not open-ended." />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Channels", "Which channels we use, in your approved business identity."],
              ["Hours and limits", "Service hours per month and contact limits per prospect."],
              ["Your instructions", "Qualification brief, disqualifiers and handoff conditions."],
              ["Service levels", "Response expectations, escalation rules and exclusions."],
            ].map(([t, b], i) => (
              <TiltIn key={t} delay={i * 0.08} className="rounded-[24px] border border-line bg-white p-7 shadow-xs">
                <p className="text-[20px]">{t}</p>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-3">{b}</p>
              </TiltIn>
            ))}
          </div>
        </Container>
      </section>
      <section className="bg-surface-2/50 py-20 sm:py-28">
        <Container>
          <SectionHeading eyebrow="How our team works" title="Facts separate from opinions." body="Agents record what the prospect said separately from their own interpretation and from AI suggestions." />
          <StickySteps
            className="mt-14"
            steps={[
              { title: "Sign in securely", body: "Each agent has an individual account with multi-factor authentication. No shared logins." },
              { title: "Read your instructions first", body: "Confirm the qualification brief, then review the project, its source and any contact restrictions." },
              { title: "Contact only through approved channels", body: "Using your approved business identity, within the contact limits you agreed." },
              { title: "Record what was said", body: "Answers go on the record, separate from the agent's opinion. Then set the next action or close with a reason." },
              { title: "Book only when confirmed", body: "An appointment is made only after the customer confirms and availability is checked." },
              { title: "Hand off cleanly", body: "You get a structured summary, and service time is logged against your hours." },
            ]}
          />
        </Container>
      </section>
      <section className="py-20 sm:py-28">
        <Container className="max-w-3xl">
          <Faq
            items={[
              { q: "Is this included in every plan?", a: "No. Human-managed services are part of the Managed plan, with hours agreed in writing. Software automation is never presented as human work, or the other way round." },
              { q: "Do you guarantee appointments?", a: "No. We guarantee the agreed effort, process and reporting, not outcomes we don't control." },
              { q: "What happens to unused hours?", a: "That is set out in your service schedule before you start." },
            ]}
          />
        </Container>
      </section>
      <CtaBand title="Talk to us about your capacity." body="We'll scope hours, channels and limits around how your team works.">
        <ButtonLink href="/demo" variant="inverse" size="lg">
          Discuss the service
        </ButtonLink>
      </CtaBand>
    </>
  );
}
