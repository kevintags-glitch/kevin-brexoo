import Link from "next/link";
import type { ReactNode } from "react";
import { Notice } from "@/components/ui";
import { ScrollProgress } from "./motion";
import { Container } from "./Section";

const DOCS = [
  { href: "/legal/privacy", label: "Privacy policy" },
  { href: "/legal/terms", label: "Terms of service" },
  { href: "/legal/acceptable-use", label: "Acceptable use" },
];

/** Legal pages read like documents: a reading-progress line and a pinned list of policies. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <ScrollProgress />
      <Container className="grid gap-12 py-16 sm:py-24 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-ink-3">Policies</p>
          <nav aria-label="Policies" className="mt-4 flex gap-4 lg:grid lg:gap-2">
            {DOCS.map((d) => (
              <Link key={d.href} href={d.href} className="text-[15px] font-light text-ink-2 hover:text-blue aria-[current=page]:font-normal aria-[current=page]:text-blue" aria-current={d.label.startsWith(title.split(" ")[0]!) ? "page" : undefined}>
                {d.label}
              </Link>
            ))}
          </nav>
        </aside>
        <article className="max-w-3xl">
          <h1 className="text-[44px] font-extralight leading-[1.02] tracking-[-0.025em] sm:text-[60px]">{title}</h1>
          <p className="mt-3 text-sm text-ink-3">Last updated {updated}</p>
          <Notice tone="amber" className="mt-8" title="Draft for legal review">
            This document is a working draft. It must be reviewed by qualified counsel in each launch market (the USA, Australia and New Zealand) before Brexoo is sold.
          </Notice>
          <div className="mt-10 grid gap-6 text-[16px] font-light leading-relaxed text-ink-2 [&_h2]:mt-8 [&_h2]:font-sans [&_h2]:text-[22px] [&_h2]:font-light [&_h2]:tracking-[-0.01em] [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_ul]:grid [&_ul]:gap-1.5">
            {children}
          </div>
        </article>
      </Container>
    </>
  );
}
