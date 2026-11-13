import type { Metadata } from "next";
import { DemoForm } from "@/components/marketing/DemoForm";
import { SlideIn, WordsReveal } from "@/components/marketing/motion";
import { Container, Eyebrow } from "@/components/marketing/Section";

export const metadata: Metadata = { alternates: { canonical: "/demo" }, title: "Request a demo", description: "See Brexoo with your services and service area." };

const NEXT = [
  ["You send the form", "It takes about a minute. We only ask what we need to prepare."],
  ["We set up your demo", "Your services, your service area and your qualification questions."],
  ["We walk you through it", "30 minutes, including what Brexoo doesn't do yet."],
];

export default function DemoPage() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_60%_at_0%_0%,rgb(6_182_212/0.08),transparent_70%),radial-gradient(40%_50%_at_100%_100%,rgb(59_130_246/0.07),transparent_70%)]" />
      <Container className="relative grid gap-14 py-16 sm:py-24 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <Eyebrow>Request a demo</Eyebrow>
          <WordsReveal as="h1" text="See Brexoo with your own work." className="mt-5 max-w-[14ch] text-[44px] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[68px]" />
          <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-ink-2 sm:text-[19px]">
            Tell us a little about your business. Available for builders and home-service businesses in the USA, Australia and New Zealand.
          </p>
          <ol className="relative mt-12 grid gap-8 border-l border-line pl-8">
            {NEXT.map(([t, b], i) => (
              <li key={t} className="relative">
                <SlideIn from="left" delay={0.15 + i * 0.12}>
                  <span className="absolute -left-[45px] top-0 z-10 grid size-6 place-items-center rounded-full border border-blue bg-white text-[11px] font-medium text-blue tabular">{i + 1}</span>
                  <p className="text-[19px]">{t}</p>
                  <p className="mt-1 text-[15px] text-ink-3">{b}</p>
                </SlideIn>
              </li>
            ))}
          </ol>
        </div>
        <SlideIn from="right" delay={0.1}>
          <DemoForm />
        </SlideIn>
      </Container>
    </section>
  );
}
