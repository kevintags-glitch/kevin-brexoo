import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { INDUSTRY_TEMPLATES } from "@/config/industry-templates";
import { ButtonLink } from "@/components/ui";
import { IndustryTiles } from "@/components/marketing/brand-industries";
import { BUILDER_CODES, INDUSTRY_ICON } from "@/components/marketing/industry-icons";
import { PageHero } from "@/components/marketing/PageHero";
import { Reveal } from "@/components/marketing/Reveal";
import { Container, CtaBand, SectionHeading } from "@/components/marketing/Section";

export const metadata: Metadata = { title: "Industries", description: "Brexoo is built for builders, trades and home service businesses, with qualification questions for each." };

export default function IndustriesPage() {
  return (
    <>
      <PageHero eyebrow="Industries" title="Built for builders and home services." body="Pick the services you offer. Each comes with its own enquiry questions, qualification criteria and pipeline language, which you can tailor.">
        <ButtonLink href="/demo" size="lg">
          Request a Demo <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
      </PageHero>
      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="Built for these industries" title="Start with the work you do." />
          <IndustryTiles variant="grid" className="mt-10" />
        </Container>
      </section>
      <section className="border-t border-line bg-surface py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="Every service we support" title={`${INDUSTRY_TEMPLATES.length} service templates, and growing.`} />
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INDUSTRY_TEMPLATES.map((t, i) => {
              const Icon = INDUSTRY_ICON[t.code]!;
              return (
                <Reveal as="li" key={t.code} delay={(i % 3) * 0.03}>
                  <Link href={BUILDER_CODES.includes(t.code) ? "/builders" : "/trades"} className="group flex h-full items-start gap-4 rounded-2xl border border-line bg-canvas p-5 hover:border-blue/40">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-soft text-blue">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-[16px] font-semibold group-hover:text-blue">{t.name}</span>
                      <span className="mt-1 block text-[14px] text-ink-3">{t.opportunityTypes.join(" · ")}</span>
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        </Container>
      </section>
      <div className="pt-20">
        <CtaBand title="See Brexoo with your services." body="We'll set up a demo using your trade, your service area and your questions.">
          <ButtonLink href="/demo" variant="inverse" size="lg">
            Request a Demo
          </ButtonLink>
        </CtaBand>
      </div>
    </>
  );
}
