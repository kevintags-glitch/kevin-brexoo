import { INDUSTRY_BY_CODE } from "@/config/industry-templates";
import { ButtonLink } from "@/components/ui";
import { cn } from "@/lib/cn";
import { INDUSTRY_ICON } from "./industry-icons";
import { SAMPLE_BY_KEY, type SampleBusiness } from "@/config/samples";
import { FitCardMock, PhonePageMock } from "./mocks";
import { HorizontalPin, Marquee, Parallax, SlideIn, TiltIn } from "./motion";
import { PageHero } from "./PageHero";
import { Container, CtaBand, Eyebrow } from "./Section";

/**
 * Shared content model for the builders and trades pages, with two different scroll designs:
 * - "zigzag" (builders): services swing in from alternating sides, the workflow pins and slides sideways
 * - "tiles" (trades): services tilt up as a tile wall, questions drift past in a marquee,
 *   and the workflow sits beside a floating phone
 */
export function IndustryPage({
  eyebrow,
  title,
  body,
  codes,
  workflow,
  layout,
  accent,
  sample = "builders",
}: {
  eyebrow: string;
  title: string;
  body: string;
  codes: string[];
  workflow: { t: string; b: string }[];
  layout: "zigzag" | "tiles";
  accent?: string[];
  sample?: SampleBusiness["key"];
}) {
  return (
    <>
      <PageHero variant={layout === "zigzag" ? "split" : "left"} eyebrow={eyebrow} title={title} accent={accent} body={body} aside={<PhonePageMock business={SAMPLE_BY_KEY[sample]} />}>
        <ButtonLink href="/demo" size="lg">
          Request a Demo
        </ButtonLink>
        <ButtonLink href="/pricing" size="lg" variant="outline">
          Explore plans
        </ButtonLink>
      </PageHero>

      {layout === "zigzag" ? <ZigzagServices codes={codes} /> : <TileServices codes={codes} />}

      {layout === "zigzag" ? (
        <section className="bg-surface-2/50">
          <Container className="pt-20 sm:pt-28">
            <Eyebrow>How it works for you</Eyebrow>
            <h2 className="type-section mt-4 max-w-[20ch]">A clear path from enquiry to site visit.</h2>
          </Container>
          <HorizontalPin>
            {workflow.map((s, i) => (
              <div key={s.t} className="flex w-full max-w-[880px] flex-col justify-between gap-10 rounded-[32px] border border-line bg-white p-10 shadow-sm md:min-h-[420px] md:p-14">
                <p className="text-[120px] leading-none tracking-[-0.025em] text-blue/20 tabular font-light">{String(i + 1).padStart(2, "0")}</p>
                <div>
                  <h3 className="type-section">{s.t}</h3>
                  <p className="type-body mt-4 max-w-xl text-ink-2">{s.b}</p>
                </div>
              </div>
            ))}
          </HorizontalPin>
        </section>
      ) : (
        <section className="border-y border-line bg-surface-2/50 py-20 sm:py-28">
          <Container className="grid items-start gap-14 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <Eyebrow>How it works for you</Eyebrow>
              <h2 className="type-section mt-4 max-w-[18ch]">From the first message to the booked visit.</h2>
              <ol className="mt-12 grid gap-4">
                {workflow.map((s, i) => (
                  <li key={s.t}>
                    <SlideIn from="bottom" delay={i * 0.06} className="flex gap-5 rounded-[22px] border border-line bg-white p-6">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue text-[14px] font-medium text-white tabular">{i + 1}</span>
                      <div>
                        <p className="type-body">{s.t}</p>
                        <p className="type-body mt-1 text-ink-3">{s.b}</p>
                      </div>
                    </SlideIn>
                  </li>
                ))}
              </ol>
            </div>
            <Parallax speed={0.18} className="lg:sticky lg:top-28">
              <FitCardMock />
            </Parallax>
          </Container>
        </section>
      )}

      <div className="bg-page pt-24">
        <CtaBand title="See it with your services." body="We'll set up a demo using your trade, your service area and your questions.">
          <ButtonLink href="/demo" variant="inverse" size="lg">
            Request a Demo
          </ButtonLink>
        </CtaBand>
      </div>
    </>
  );
}

function ZigzagServices({ codes }: { codes: string[] }) {
  return (
    <section className="bg-page py-20 sm:py-28">
      <Container>
        <Eyebrow>Your services</Eyebrow>
        <h2 className="type-section mt-4 max-w-[20ch]">Questions that fit the work.</h2>
        <div className="mt-16 grid gap-20">
          {codes.map((code, i) => {
            const t = INDUSTRY_BY_CODE[code]!;
            const Icon = INDUSTRY_ICON[code]!;
            const flip = i % 2 === 1;
            return (
              <div key={code} className="grid items-center gap-10 md:grid-cols-2 md:gap-20">
                <SlideIn from={flip ? "right" : "left"} className={cn(flip && "md:order-last")}>
                  <Icon className="size-10 text-blue" strokeWidth={1.2} aria-hidden />
                  <h3 className="mt-5 text-[40px] leading-none tracking-[-0.025em] sm:text-[56px] font-light">{t.name}</h3>
                  <p className="type-body mt-4 text-ink-2">{t.opportunityTypes.join(" · ")}</p>
                </SlideIn>
                <SlideIn from={flip ? "left" : "right"} delay={0.1}>
                  <div className="rounded-[26px] border border-line bg-surface-2/40 p-7">
                    <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-ink-3">We ask</p>
                    <ul className="mt-4 grid gap-2">
                      {t.questions.slice(0, 5).map((q, k) => (
                        <li key={q.key} className="type-body flex items-baseline gap-3 border-b border-line pb-2 text-ink-2 last:border-0">
                          <span className="text-[12px] text-ink-3 tabular">{String(k + 1).padStart(2, "0")}</span>
                          {q.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                </SlideIn>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

function TileServices({ codes }: { codes: string[] }) {
  const questions = codes.flatMap((c) => INDUSTRY_BY_CODE[c]!.questions.slice(0, 2).map((q) => q.label));
  return (
    <section className="overflow-hidden bg-page py-20 sm:py-28">
      <Container>
        <Eyebrow>Your services</Eyebrow>
        <h2 className="type-section mt-4 max-w-[20ch]">Every trade, its own questions.</h2>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {codes.map((code, i) => {
            const t = INDUSTRY_BY_CODE[code]!;
            const Icon = INDUSTRY_ICON[code]!;
            return (
              <li key={code}>
                <TiltIn delay={(i % 4) * 0.07} className="h-full">
                  <div className="group flex h-full flex-col rounded-[24px] border border-line bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue/40 hover:shadow-lg">
                    <span className="grid size-12 place-items-center rounded-2xl bg-blue-soft text-blue transition-colors group-hover:bg-blue group-hover:text-white">
                      <Icon className="size-6" strokeWidth={1.5} aria-hidden />
                    </span>
                    <h3 className="type-subhead mt-6">{t.name}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-ink-3">{t.opportunityTypes.join(" · ")}</p>
                  </div>
                </TiltIn>
              </li>
            );
          })}
        </ul>
      </Container>
      <div className="mt-16 grid gap-3">
        <p className="text-center text-[13px] uppercase tracking-[0.24em] text-ink-3">Questions your customers answer</p>
        <Marquee speed={70}>
          {questions.map((q, i) => (
            <span key={`${q}-${i}`} className="type-body shrink-0 rounded-full border border-line bg-surface-2/60 px-5 py-3 text-ink-2">
              {q}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
