import type { Metadata } from "next";
import { DemoForm } from "@/components/marketing/DemoForm";
import { Container, Eyebrow } from "@/components/marketing/Section";

export const metadata: Metadata = { title: "Request a demo", description: "See Brexoo with your services and service area." };

export default function DemoPage() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(45%_60%_at_10%_0%,color-mix(in_oklab,var(--sky)_12%,transparent),transparent_70%)]" />
      <Container className="grid gap-12 py-16 sm:py-24 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <Eyebrow>Request a demo</Eyebrow>
          <h1 className="mt-4 text-[40px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[56px]">See Brexoo with your own work.</h1>
          <p className="mt-5 max-w-[48ch] text-[17px] leading-relaxed text-ink-2">
            Tell us a little about your business. We'll set up a demo using your services and service area, walk through the workflow and answer your questions.
          </p>
          <dl className="mt-10 grid gap-6">
            {[
              ["30 minutes", "A focused walkthrough, not a sales marathon."],
              ["Your trade", "Qualification questions and pages for your services."],
              ["Straight answers", "Including what Brexoo doesn't do yet."],
            ].map(([t, b]) => (
              <div key={t} className="border-l-2 border-blue pl-4">
                <dt className="text-[15px] font-semibold">{t}</dt>
                <dd className="mt-0.5 text-[15px] text-ink-3">{b}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative">
          <DemoForm />
        </div>
      </Container>
    </section>
  );
}
