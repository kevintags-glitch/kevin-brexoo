import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui";
import { PageHero } from "@/components/marketing/PageHero";
import { Reveal } from "@/components/marketing/Reveal";
import { Container, CtaBand, Faq, SectionHeading } from "@/components/marketing/Section";

export const metadata: Metadata = {
  title: "Managed services",
  description: "Optional, separately scoped human qualification and follow-up, run inside your Brexoo workspace.",
};

export default function ManagedServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Managed services"
        title="People to qualify and follow up, when you need them."
        body="An optional service, scoped in writing: agreed channels, hours, contact limits and escalation rules. Our team works inside your Brexoo workspace, so every call and note is on the record."
      >
        <ButtonLink href="/demo" size="lg">
          Discuss the service
        </ButtonLink>
      </PageHero>
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
              <Reveal key={t} delay={i * 0.04} className="rounded-2xl border border-line bg-surface p-6 shadow-xs">
                <p className="text-[16px] font-semibold">{t}</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-3">{b}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>
      <section className="border-y border-line bg-surface py-20 sm:py-28">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading eyebrow="How our team works" title="Facts separate from opinions." body="Agents record what the prospect said separately from their own interpretation and from AI suggestions." />
          <Reveal>
            <ol className="grid gap-4">
              {[
                "Sign in with an individual account and multi-factor authentication",
                "Confirm your instructions, then review the project, source and contact restrictions",
                "Use only approved channels and your approved identity",
                "Record answers, set the next action or close with a reason",
                "Book an appointment only after confirmation and an availability check",
                "Send you a structured handoff summary and log service time",
              ].map((s, i) => (
                <li key={s} className="flex gap-4 rounded-xl border border-line bg-canvas p-4">
                  <span className="text-[13px] font-semibold tabular text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[15px] text-ink-2">{s}</span>
                </li>
              ))}
            </ol>
          </Reveal>
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
