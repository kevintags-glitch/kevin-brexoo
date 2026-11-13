import type { ReactNode } from "react";
import { Reveal } from "./Reveal";
import { Container, Eyebrow } from "./Section";

export function PageHero({ eyebrow, title, body, children }: { eyebrow: string; title: ReactNode; body: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(45%_70%_at_15%_0%,color-mix(in_oklab,var(--sky)_12%,transparent),transparent_70%),radial-gradient(35%_60%_at_90%_10%,color-mix(in_oklab,var(--teal)_10%,transparent),transparent_70%)]" />
      <Container className="py-16 sm:py-24">
        <Reveal>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-4 max-w-[18ch] text-[40px] font-medium leading-[1.04] tracking-[-0.03em] sm:text-[60px]">{title}</h1>
          <p className="mt-5 max-w-[60ch] text-[17px] leading-relaxed text-ink-2 sm:text-[19px]">{body}</p>
          {children ? <div className="mt-8 flex flex-col gap-3 sm:flex-row">{children}</div> : null}
        </Reveal>
      </Container>
    </section>
  );
}
