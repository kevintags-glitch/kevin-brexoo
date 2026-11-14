import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { INDUSTRY_TEMPLATES } from "@/config/industry-templates";
import { ButtonLink } from "@/components/ui";
import { BUILDER_CODES, INDUSTRY_ICON } from "@/components/marketing/industry-icons";
import { Marquee, TiltIn, WipeIn } from "@/components/marketing/motion";
import { PageHero } from "@/components/marketing/PageHero";
import { Container, CtaBand, Eyebrow } from "@/components/marketing/Section";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { alternates: { canonical: "/industries" }, title: "Industries", description: "Brexoo is built for builders, trades and home service businesses, with qualification questions for each." };

/** The eight launch groups from the master plan, as a bento grid. */
const GROUPS = [
  { title: "Builders & developers", body: "New homes, extensions, duplexes and development sites, qualified on land, budget and timing.", href: "/builders", codes: ["home_builder", "property_developer"], span: "md:col-span-2 md:row-span-2", tone: "bg-[#0f2742] text-white" },
  { title: "Electricians", body: "Rewires, switchboards, EV chargers and solar.", href: "/trades", codes: ["electrician"], span: "", tone: "bg-white" },
  { title: "Plumbers", body: "Hot water, bathrooms, drainage and gas.", href: "/trades", codes: ["plumber"], span: "", tone: "bg-white" },
  { title: "HVAC", body: "Split systems, ducted installs and servicing.", href: "/trades", codes: ["hvac"], span: "", tone: "bg-[#e6f4ff]" },
  { title: "Renovation & remodelling", body: "Kitchens, bathrooms and whole-home renovations.", href: "/builders", codes: ["renovation"], span: "md:col-span-2", tone: "bg-white" },
  { title: "Landscaping & lawn care", body: "Design, construction and regular maintenance.", href: "/trades", codes: ["landscaping", "lawn_care"], span: "", tone: "bg-white" },
  { title: "Cleaning", body: "Regular, end-of-lease and commercial cleans.", href: "/trades", codes: ["cleaning"], span: "", tone: "bg-[#06b6d4] text-[#062635]" },
  { title: "Roofing & painting", body: "Restorations, repairs, interiors and exteriors.", href: "/trades", codes: ["roofing", "painting"], span: "md:col-span-2", tone: "bg-white" },
];

export default function IndustriesPage() {
  return (
    <>
      <PageHero
        variant="split"
        eyebrow="Industries"
        title="Built for builders and home services." accent={["home", "services"]}
        body="Pick the services you offer. Each comes with its own enquiry questions, qualification criteria and pipeline language, which you can tailor."
        aside={
          <div className="grid grid-cols-3 gap-4">
            {INDUSTRY_TEMPLATES.slice(0, 9).map((t, i) => {
              const Icon = INDUSTRY_ICON[t.code]!;
              return (
                <div key={t.code} className={cn("grid aspect-square place-items-center rounded-[22px] border border-line bg-white shadow-sm", i % 2 === 1 && "translate-y-6")}>
                  <Icon className="size-8 text-blue" strokeWidth={1.3} aria-hidden />
                </div>
              );
            })}
          </div>
        }
      >
        <ButtonLink href="/demo" size="lg">
          Request a Demo <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
      </PageHero>

      <section className="bg-page py-16 sm:py-24">
        <Container>
          <Eyebrow>Eight launch industries</Eyebrow>
          <h2 className="type-section mt-4 max-w-[20ch]">Start with the work you do.</h2>
          <div className="mt-12 grid auto-rows-[minmax(210px,auto)] grid-cols-1 gap-4 md:grid-cols-4">
            {GROUPS.map((g, i) => {
              const Icon = INDUSTRY_ICON[g.codes[0]!]!;
              return (
                <WipeIn key={g.title} delay={(i % 4) * 0.08} className={g.span}>
                  <Link href={g.href} className={cn("group flex h-full flex-col justify-between rounded-[28px] border border-line p-7 transition-shadow hover:shadow-lg", g.tone)}>
                    <div className="flex items-start justify-between">
                      <Icon className="size-8 opacity-90" strokeWidth={1.3} aria-hidden />
                      <ArrowUpRight className="size-5 opacity-50 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:opacity-100" aria-hidden />
                    </div>
                    <div>
                      <h3 className={cn(" leading-[1.05] tracking-[-0.03em]", i === 0 ? "type-section" : "type-subhead")}>{g.title}</h3>
                      <p className="type-body mt-2 max-w-md opacity-75">{g.body}</p>
                    </div>
                  </Link>
                </WipeIn>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="overflow-hidden border-y border-line bg-surface-2/50 py-14">
        <p className="mb-6 text-center text-[13px] uppercase tracking-[0.24em] text-ink-3">Opportunities Brexoo is set up to qualify</p>
        <Marquee speed={60}>
          {INDUSTRY_TEMPLATES.flatMap((t) => t.opportunityTypes.slice(0, 2)).map((o, i) => (
            <span key={`${o}-${i}`} className="type-subhead shrink-0 text-ink">
              {o} <span className="px-3 text-teal">·</span>
            </span>
          ))}
        </Marquee>
      </section>

      <section className="bg-page py-16 sm:py-24">
        <Container>
          <Eyebrow>Every service we support</Eyebrow>
          <h2 className="type-section mt-4">{INDUSTRY_TEMPLATES.length} service templates, and growing.</h2>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INDUSTRY_TEMPLATES.map((t, i) => {
              const Icon = INDUSTRY_ICON[t.code]!;
              return (
                <li key={t.code} className="h-full">
                  <TiltIn delay={(i % 3) * 0.06} className="h-full">
                    <Link href={BUILDER_CODES.includes(t.code) ? "/builders" : "/trades"} className="group flex h-full items-start gap-4 rounded-2xl border border-line bg-white p-5 hover:border-blue/40">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-soft text-blue">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span>
                        <span className="type-body block group-hover:text-blue">{t.name}</span>
                        <span className="mt-1 block text-[14px] text-ink-3">{t.opportunityTypes.join(" · ")}</span>
                      </span>
                    </Link>
                  </TiltIn>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>
      <div className="bg-page pt-8">
        <CtaBand title="See Brexoo with your services." body="We'll set up a demo using your trade, your service area and your questions.">
          <ButtonLink href="/demo" variant="inverse" size="lg">
            Request a Demo
          </ButtonLink>
        </CtaBand>
      </div>
    </>
  );
}
