import type { ReactNode } from "react";
import { MarkOutline } from "@/components/brand/BrandMotif";
import { cn } from "@/lib/cn";
import { Parallax, WordsReveal } from "./motion";
import { Reveal } from "./Reveal";
import { Container, Eyebrow } from "./Section";

/**
 * Page heroes are left-aligned, in two shapes so pages don't open the same way:
 * - "left": a big thin headline
 * - "split": headline left, a floating visual right (parallax)
 * `accent` words are set in the italic serif.
 */
export function PageHero({
  eyebrow,
  title,
  body,
  children,
  variant = "left",
  aside,
  accent,
}: {
  eyebrow: string;
  title: string;
  body: ReactNode;
  children?: ReactNode;
  variant?: "left" | "split";
  aside?: ReactNode;
  accent?: string[];
}) {
  return (
    <section className="relative overflow-hidden bg-page">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_60%_at_100%_0%,rgb(6_182_212/0.07),transparent_70%)]" />
      {variant === "left" ? <MarkOutline className="absolute -right-16 top-1/2 hidden h-[115%] -translate-y-1/2 text-[#E6F4FF] lg:block" strokeWidth={30} /> : null}
      <Container className={cn("relative pb-10 pt-14 sm:py-28", variant === "split" && "grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]")}>
        <div>
          <Reveal>
            <Eyebrow>{eyebrow}</Eyebrow>
          </Reveal>
          <WordsReveal as="h1" text={title} accent={accent} className="type-hero mt-5 max-w-[18ch] text-ink" />
          <Reveal delay={0.25}>
            <p className="type-body mt-6 max-w-[58ch] text-ink-2">{body}</p>
          </Reveal>
          {children ? (
            <Reveal delay={0.35} className="mt-9 flex flex-col gap-3 sm:flex-row">
              {children}
            </Reveal>
          ) : null}
        </div>
        {variant === "split" && aside ? (
          <Parallax speed={0.12} className="max-lg:hidden">
            {aside}
          </Parallax>
        ) : null}
      </Container>
    </section>
  );
}
