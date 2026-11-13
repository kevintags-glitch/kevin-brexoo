"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type StoryStep = { id: string; kicker: string; title: string; body: string; points: string[]; visual: ReactNode };

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/**
 * Scroll-told workflow: copy scrolls on the left while the product panel on the right stays
 * pinned and changes with the active step. On small screens each step shows its own panel inline.
 */
export function WorkflowStory({ steps }: { steps: StoryStep[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const reduce = useReducedMotion();

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
      <ol className="relative">
        <span aria-hidden className="absolute bottom-6 left-[15px] top-6 w-px bg-line max-lg:hidden" />
        <motion.span
          aria-hidden
          className="absolute bottom-6 left-[15px] top-6 w-px origin-top bg-blue max-lg:hidden"
          initial={false}
          animate={{ scaleY: active / Math.max(steps.length - 1, 1) }}
          transition={{ duration: reduce ? 0 : 0.5, ease: EASE_OUT }}
        />
        {steps.map((s, i) => (
          <li key={s.id}>
            <div
              ref={(el) => {
                refs.current[i] = el;
              }}
              data-index={i}
              className="relative py-6 lg:flex lg:min-h-[62vh] lg:items-center"
            >
              <div className="flex gap-5">
              <span
                aria-hidden
                className={cn(
                  "relative z-10 mt-1 grid size-8 shrink-0 place-items-center rounded-full border text-[12px] font-semibold tabular transition-colors duration-300 max-lg:hidden",
                  i <= active ? "border-blue bg-blue text-on-blue" : "border-line-strong bg-canvas text-ink-3",
                )}
              >
                {i + 1}
              </span>
              <div className={cn("transition-opacity duration-500 lg:max-w-md", i === active ? "lg:opacity-100" : "lg:opacity-40")}>
                <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-blue">{s.kicker}</p>
                <h3 className="mt-2 text-[28px] font-medium leading-[1.12] sm:text-[34px]">{s.title}</h3>
                <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{s.body}</p>
                <ul className="mt-5 grid gap-2">
                  {s.points.map((p) => (
                    <li key={p} className="flex gap-2.5 text-[15px] text-ink-2">
                      <span aria-hidden className="mt-[9px] size-1.5 shrink-0 rounded-full bg-teal" />
                      {p}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 lg:hidden">{s.visual}</div>
              </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <div className="max-lg:hidden">
        <div className="sticky top-[calc(50vh-230px)] grid min-h-[460px] place-items-center">
          <div aria-hidden className="absolute inset-0 -z-10 rounded-[32px] bg-[radial-gradient(70%_60%_at_60%_40%,color-mix(in_oklab,var(--teal)_16%,transparent),transparent_70%),radial-gradient(60%_50%_at_30%_70%,color-mix(in_oklab,var(--sky)_14%,transparent),transparent_70%)]" />
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={steps[active]!.id}
              className="w-full max-w-[480px]"
              initial={reduce ? false : { opacity: 0, y: 16, scale: 0.98, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={reduce ? undefined : { opacity: 0, y: -12, scale: 0.98, filter: "blur(6px)" }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
            >
              {steps[active]!.visual}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
