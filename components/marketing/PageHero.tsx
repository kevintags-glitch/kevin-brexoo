import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Parallax, WordsReveal } from "./motion";
import { Reveal } from "./Reveal";
import { Container, Eyebrow } from "./Section";

/**
 * Page heroes come in three shapes so pages don't open the same way:
 * - "left": a big thin headline, left aligned
 * - "center": an oversized centred headline with a soft glow
 * - "split": headline left, a floating visual right (parallax)
 */
export function PageHero({
  eyebrow,
  title,
  body,
  children,
  variant = "left",
  aside,
}: {
  eyebrow: string;
  title: string;
  body: ReactNode;
  children?: ReactNode;
  variant?: "left" | "center" | "split";
  aside?: ReactNode;
}) {
  const center = variant === "center";
  return (
    <section className="relative overflow-hidden bg-white">
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0",
          center
            ? "bg-[radial-gradient(50%_60%_at_50%_100%,rgb(59_130_246/0.08),transparent_70%)]"
            : "bg-[radial-gradient(40%_60%_at_100%_0%,rgb(6_182_212/0.07),transparent_70%)]",
        )}
      />
      <Container className={cn("relative py-20 sm:py-28", variant === "split" && "grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]", center && "text-center")}>
        <div>
          <Reveal>
            <Eyebrow>{eyebrow}</Eyebrow>
          </Reveal>
          <WordsReveal
            as="h1"
            text={title}
            className={cn(
              "mt-5 font-extralight leading-[1.02] tracking-[-0.045em] text-ink",
              center ? "mx-auto max-w-[16ch] text-[44px] sm:text-[80px]" : "max-w-[17ch] text-[42px] sm:text-[68px]",
            )}
          />
          <Reveal delay={0.25}>
            <p className={cn("mt-6 max-w-[58ch] text-[17px] font-light leading-relaxed text-ink-2 sm:text-[20px]", center && "mx-auto")}>{body}</p>
          </Reveal>
          {children ? (
            <Reveal delay={0.35} className={cn("mt-9 flex flex-col gap-3 sm:flex-row", center && "justify-center")}>
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
