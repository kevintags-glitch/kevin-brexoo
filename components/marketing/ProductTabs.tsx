"use client";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Illustration, type IllustrationName } from "./illustrations";

export type ProductTab = { id: string; label: string; icon: IllustrationName; title: string; body: string; points: string[]; href: string; visual: ReactNode };

const DURATION = 7000;

/**
 * Notion-style tabbed product tour. Tabs advance on their own with a progress line, pause while
 * the pointer or focus is inside, and follow the WAI-ARIA tabs pattern (arrow keys, Home/End).
 */
export function ProductTabs({ tabs }: { tabs: ProductTab[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0);
  const reduce = useReducedMotion();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (paused || reduce) return;
    const t = window.setTimeout(() => {
      setActive((a) => (a + 1) % tabs.length);
      setCycle((c) => c + 1);
    }, DURATION);
    return () => window.clearTimeout(t);
  }, [active, paused, reduce, tabs.length, cycle]);

  const select = (i: number, focus = false) => {
    setActive(i);
    setCycle((c) => c + 1);
    if (focus) refs.current[i]?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    const map: Record<string, number> = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: tabs.length - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    select((map[e.key]! + tabs.length) % tabs.length, true);
  };
  const tab = tabs[active]!;

  return (
    <div onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div role="tablist" aria-label="Product tour" onKeyDown={onKey} className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={i === active}
            aria-controls={`panel-${t.id}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => select(i)}
            className={cn(
              "relative flex shrink-0 items-center gap-2.5 overflow-hidden rounded-xl border px-4 py-2.5 text-left text-[15px] font-medium transition-colors",
              i === active ? "border-ink/10 bg-white text-ink shadow-sm" : "border-transparent text-ink-3 hover:bg-surface-2 hover:text-ink",
            )}
          >
            <Illustration name={t.icon} tone={i === active ? "navy" : "cloud"} className="size-8" />
            {t.label}
            {i === active && !reduce ? (
              <motion.span key={`${cycle}-${paused}`} aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-blue" initial={{ scaleX: 0 }} animate={{ scaleX: paused ? 0 : 1 }} transition={{ duration: paused ? 0 : DURATION / 1000, ease: "linear" }} />
            ) : null}
          </button>
        ))}
      </div>
      <div className="mt-6 overflow-hidden rounded-[28px] border border-line bg-surface-2/60">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab.id}
            role="tabpanel"
            id={`panel-${tab.id}`}
            aria-labelledby={`tab-${tab.id}`}
            tabIndex={0}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="grid items-center gap-8 p-6 outline-none sm:p-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12"
          >
            <div>
              <h3 className="type-section">{tab.title}</h3>
              <p className="type-body mt-3 text-ink-2">{tab.body}</p>
              <ul className="mt-5 grid gap-2">
                {tab.points.map((p) => (
                  <li key={p} className="type-body flex gap-2.5 text-ink-2">
                    <span aria-hidden className="mt-[9px] size-1.5 shrink-0 rounded-full bg-teal" />
                    {p}
                  </li>
                ))}
              </ul>
              <Link href={tab.href} className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-medium text-blue hover:gap-2.5">
                Learn more <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="min-w-0">{tab.visual}</div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
