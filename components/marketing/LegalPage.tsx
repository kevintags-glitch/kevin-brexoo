import type { ReactNode } from "react";
import { Notice } from "@/components/ui";
import { Container } from "./Section";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <Container className="max-w-3xl py-16 sm:py-24">
      <h1 className="text-[40px] font-medium tracking-[-0.03em]">{title}</h1>
      <p className="mt-2 text-sm text-ink-3">Last updated {updated}</p>
      <Notice tone="amber" className="mt-8" title="Draft for legal review">
        This document is a working draft. It must be reviewed by qualified counsel for the launch jurisdiction before Brexoo is sold.
      </Notice>
      <div className="mt-10 grid gap-6 text-[15px] leading-relaxed text-ink-2 [&_h2]:mt-6 [&_h2]:font-sans [&_h2]:text-[18px] [&_h2]:font-semibold [&_h2]:tracking-normal [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_ul]:grid [&_ul]:gap-1.5">
        {children}
      </div>
    </Container>
  );
}
