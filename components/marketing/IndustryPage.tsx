import { INDUSTRY_BY_CODE } from "@/config/industry-templates";
import { ButtonLink } from "@/components/ui";
import { INDUSTRY_ICON } from "./industry-icons";
import { FitCardMock, PhonePageMock } from "./mocks";
import { PageHero } from "./PageHero";
import { Reveal } from "./Reveal";
import { Container, CtaBand, SectionHeading } from "./Section";

export function IndustryPage({ eyebrow, title, body, codes, workflow }: { eyebrow: string; title: string; body: string; codes: string[]; workflow: { t: string; b: string }[] }) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} body={body}>
        <ButtonLink href="/demo" size="lg">
          Request a demo
        </ButtonLink>
        <ButtonLink href="/pricing" size="lg" variant="secondary">
          Explore plans
        </ButtonLink>
      </PageHero>

      <section className="py-20 sm:py-28">
        <Container>
          <SectionHeading eyebrow="Your services" title="Questions that fit the work." body="Each service comes with qualification questions drawn from how the work is actually scoped. Keep them, edit them or add your own." />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {codes.map((code, i) => {
              const t = INDUSTRY_BY_CODE[code]!;
              const Icon = INDUSTRY_ICON[code]!;
              return (
                <Reveal key={code} delay={(i % 3) * 0.04} className="rounded-2xl border border-line bg-surface p-6 shadow-xs">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-xl bg-blue-soft text-blue">
                      <Icon className="size-[18px]" aria-hidden />
                    </span>
                    <h3 className="font-sans text-[16px] font-semibold tracking-normal">{t.name}</h3>
                  </div>
                  <p className="mt-4 text-[13px] font-medium text-ink-3">Typical opportunities</p>
                  <p className="mt-1 text-[14px] text-ink-2">{t.opportunityTypes.join(" · ")}</p>
                  <p className="mt-4 text-[13px] font-medium text-ink-3">We ask</p>
                  <ul className="mt-1.5 grid gap-1">
                    {t.questions.slice(0, 4).map((q) => (
                      <li key={q.key} className="text-[14px] text-ink-2">
                        {q.label}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-surface py-20 sm:py-28">
        <Container className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="How it works for you" title="A clear path from enquiry to booked visit." />
            <ol className="mt-10 grid gap-6">
              {workflow.map((s, i) => (
                <Reveal as="li" key={s.t} delay={i * 0.04} className="flex gap-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line-strong text-[13px] font-semibold tabular text-ink-2">{i + 1}</span>
                  <div>
                    <p className="text-[16px] font-semibold">{s.t}</p>
                    <p className="mt-1 text-[15px] leading-relaxed text-ink-3">{s.b}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
          <Reveal className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
            <PhonePageMock className="max-sm:hidden" />
            <FitCardMock />
          </Reveal>
        </Container>
      </section>

      <div className="pt-24">
        <CtaBand title="See it with your services." body="We'll set up a demo using your trade, your service area and your questions.">
          <ButtonLink href="/demo" variant="inverse" size="lg">
            Request a demo
          </ButtonLink>
        </CtaBand>
      </div>
    </>
  );
}
