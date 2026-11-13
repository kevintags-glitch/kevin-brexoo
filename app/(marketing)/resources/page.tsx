import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CircleQuestionMark, FileText, LifeBuoy, ShieldCheck, Sparkles } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { Reveal } from "@/components/marketing/Reveal";
import { Container } from "@/components/marketing/Section";

export const metadata: Metadata = { title: "Resources", description: "Guides to how Brexoo works, its AI, managed services, pricing and policies." };

const RESOURCES = [
  { icon: BookOpen, title: "How Brexoo works", body: "The workflow from first enquiry to won work, step by step.", href: "/how-it-works" },
  { icon: Sparkles, title: "Brexoo AI", body: "What Xoo AI and the visitor assistant can and can't do, and the safety controls.", href: "/ai" },
  { icon: LifeBuoy, title: "Managed services", body: "Optional human qualification and follow-up, scoped in writing.", href: "/managed-services" },
  { icon: FileText, title: "Pricing and billing terms", body: "Plan limits, setup fees and the fine print.", href: "/pricing" },
  { icon: ShieldCheck, title: "Privacy", body: "What data we handle, why, and your choices.", href: "/legal/privacy" },
  { icon: CircleQuestionMark, title: "Acceptable use", body: "The rules that keep Brexoo trustworthy for businesses and their customers.", href: "/legal/acceptable-use" },
];

export default function ResourcesPage() {
  return (
    <>
      <PageHero eyebrow="Resources" title="Everything you need to know." body="Guides to how Brexoo works, what its AI does, and the policies behind it." />
      <section className="py-16 sm:py-20">
        <Container>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {RESOURCES.map(({ icon: Icon, title, body, href }, i) => (
              <Reveal as="li" key={href} delay={(i % 3) * 0.04}>
                <Link href={href} className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-6 shadow-xs hover:border-blue/40 hover:shadow-sm">
                  <span className="grid size-11 place-items-center rounded-xl bg-blue-soft text-blue">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="mt-5 text-[17px] font-semibold group-hover:text-blue">{title}</span>
                  <span className="mt-1.5 flex-1 text-[14px] leading-relaxed text-ink-3">{body}</span>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-blue">
                    Read <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
