import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Building2, CircleQuestionMark, FileText, Inbox, LifeBuoy, Radar, ShieldCheck, Sparkles, Store } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { SlideIn, SnapCarousel, WordsReveal } from "@/components/marketing/motion";
import { PageHero } from "@/components/marketing/PageHero";
import { Reveal } from "@/components/marketing/Reveal";
import { Container, CtaBand, Eyebrow } from "@/components/marketing/Section";

export const metadata: Metadata = { title: "Resources", description: "Guides to how Brexoo works, its AI, record types, managed services, pricing and policies." };

const START = [
  { icon: BookOpen, title: "How Brexoo works", body: "The workflow from first enquiry to won work, step by step.", href: "/how-it-works" },
  { icon: Sparkles, title: "Brex AI", body: "What Brex AI and the visitor assistant can and can't do, and the safety controls.", href: "/ai" },
  { icon: LifeBuoy, title: "Managed services", body: "Optional human qualification and follow-up, scoped in writing.", href: "/managed-services" },
  { icon: FileText, title: "Pricing and billing terms", body: "Plan limits, setup fees and the fine print.", href: "/pricing" },
  { icon: ShieldCheck, title: "Privacy", body: "What data we handle, why, and your choices.", href: "/legal/privacy" },
  { icon: CircleQuestionMark, title: "Acceptable use", body: "The rules that keep Brexoo trustworthy for businesses and their customers.", href: "/legal/acceptable-use" },
];

const RECORD_TYPES = [
  { icon: Building2, name: "Verified project opportunity", body: "A real project seen in a source you're permitted to use, such as a planning register or tender feed. It shows the source, the date it was observed and what you may do with the contact details." },
  { icon: Inbox, name: "Direct enquiry", body: "Someone contacted you through your page, chat or by phone. This is the only kind of record that represents a confirmed request for your services." },
  { icon: Store, name: "Business prospect", body: "A business that might buy from you, like a developer or property manager. It isn't a project and isn't asking for anything yet." },
  { icon: Radar, name: "Inferred intent signal", body: "A prediction drawn from evidence, such as repeat visits or a near start date. Brexoo always labels it as inferred and shows the evidence. It's never presented as a confirmed request." },
];

const GUIDES = [
  { id: "respond-fast", title: "Answer new enquiries within the hour", body: "Set your response-time target in Settings. Every new enquiry creates a follow-up task due inside that window, assigned to the right person, and overdue tasks rise to the top of your dashboard. Brex AI can draft the first reply from the record so the only job left is to check it and send it." },
  { id: "write-questions", title: "Write qualification questions customers will answer", body: "Start from your industry template and keep the list short. Ask what changes your quote: scope, location, timing, access, and budget range. Always allow “Not sure”. Customers see a few questions at a time, and only the ones for the service they picked." },
  { id: "service-area", title: "Set a service area you can defend", body: "Add the suburbs, postcodes or ZIP codes you actually travel to. Fit scores mark anything outside them as a mismatch instead of hiding it, so you can still choose to take the job. You can change the area at any time; existing records keep the score they had when they arrived." },
  { id: "ai-drafts", title: "Use Brex AI drafts safely", body: "Brex AI reads only your own records and never sends anything. Treat each draft as a starting point: check names, dates and prices, remove anything you can't promise, and send it from your own email. If a customer has opted out, Brexoo blocks the draft." },
  { id: "imports", title: "Import project records responsibly", body: "Register each source first, with its terms and whether you may contact the people in it. Brexoo records the observed date and permitted use with every row, and records marked “not permitted” can be saved for research but not contacted." },
];

export default function ResourcesPage() {
  return (
    <>
      <PageHero eyebrow="Resources" title="Everything you need to know." body="Guides to how Brexoo works, what its AI does, how records are labelled, and the policies behind it." />

      <section className="overflow-hidden bg-white pb-20">
        <Container>
          <Eyebrow>Start here</Eyebrow>
          <SnapCarousel label="guides" className="-mt-4">
            {START.map(({ icon: Icon, title, body, href }) => (
              <Link key={href} href={href} className="group flex h-full min-h-[260px] flex-col rounded-[26px] border border-line bg-white p-7 shadow-xs transition-shadow hover:shadow-lg">
                <span className="grid size-12 place-items-center rounded-2xl bg-blue-soft text-blue transition-colors group-hover:bg-blue group-hover:text-white">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="mt-8 text-[26px] font-light tracking-[-0.02em]">{title}</span>
                <span className="mt-2 flex-1 text-[15px] font-light leading-relaxed text-ink-3">{body}</span>
                <span className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-blue">
                  Read <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            ))}
          </SnapCarousel>
        </Container>
      </section>

      <section id="record-types" className="scroll-mt-24 bg-[#0f2742] py-24 text-white sm:py-32">
        <Container>
          <p className="text-[13px] font-medium uppercase tracking-[0.24em] text-[#5fd4ea]">Know your records</p>
          <WordsReveal text="Four kinds of record. Never mixed up." className="mt-4 max-w-[18ch] text-[40px] font-extralight leading-[1.05] tracking-[-0.04em] sm:text-[60px]" />
          <div className="mt-14 grid gap-px overflow-hidden rounded-[28px] bg-white/10 md:grid-cols-2">
            {RECORD_TYPES.map(({ icon: Icon, name, body }, i) => (
              <SlideIn key={name} from={i % 2 === 0 ? "left" : "right"} delay={Math.floor(i / 2) * 0.1} className="bg-[#0f2742] p-8 sm:p-10">
                <Icon className="size-7 text-[#5fd4ea]" strokeWidth={1.4} aria-hidden />
                <h3 className="mt-6 text-[26px] font-light tracking-[-0.02em]">{name}</h3>
                <p className="mt-3 text-[16px] font-light leading-relaxed text-white/70">{body}</p>
              </SlideIn>
            ))}
          </div>
        </Container>
      </section>

      <section id="guides" className="scroll-mt-24 bg-white py-20 sm:py-28">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="lg:sticky lg:top-28 lg:h-fit">
            <Eyebrow>Guides</Eyebrow>
            <h2 className="mt-4 text-[38px] font-light leading-[1.05] tracking-[-0.04em] sm:text-[48px]">Practical habits that win work.</h2>
            <nav aria-label="Guides" className="mt-8 grid gap-2">
              {GUIDES.map((g) => (
                <a key={g.id} href={`#${g.id}`} className="text-[15px] font-light text-ink-3 hover:text-blue">
                  {g.title}
                </a>
              ))}
            </nav>
          </div>
          <div className="grid gap-5">
            {GUIDES.map((g, i) => (
              <Reveal key={g.id} delay={0.04 * i}>
                <article id={g.id} className="scroll-mt-28 rounded-[24px] border border-line p-7 sm:p-9">
                  <p className="text-[12px] text-ink-3 tabular">Guide {String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-2 text-[24px] font-light tracking-[-0.02em]">{g.title}</h3>
                  <p className="mt-3 text-[16px] font-light leading-relaxed text-ink-2">{g.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <CtaBand title="Still have a question?" body="Ask Brex AI with the chat button, or talk to our team.">
        <ButtonLink href="/demo" variant="inverse" size="lg">
          Talk to us
        </ButtonLink>
      </CtaBand>
    </>
  );
}
