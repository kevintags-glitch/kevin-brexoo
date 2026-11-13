"use client";
import { AnimatePresence, LayoutGroup, motion, useInView, useReducedMotion } from "motion/react";
import { Check, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui";
import { SAMPLE_BY_KEY } from "@/config/samples";
import { cn } from "@/lib/cn";
import { AppWindow } from "./mocks";

const EASE = [0.23, 1, 0.32, 1] as const;
const B = SAMPLE_BY_KEY.builders;
const SARAH = B.leads[0]!;
const OTHERS = B.leads.slice(1, 4);
const STEPS = 5; // 0 list · 1 new lead · 2 fit · 3 moved to booked · 4 calendar slot
const STEP_MS = 1900;

/**
 * The first screen's product demo: a lead arrives, its fit fills in, it moves to Booked and the
 * visit lands on the calendar, on a loop. It pauses off-screen; reduced motion shows the end state.
 */
export function HeroDemo({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduce || !inView) return;
    const t = window.setTimeout(() => setStep((s) => (s + 1) % (STEPS + 1)), step === STEPS ? 2600 : STEP_MS);
    return () => window.clearTimeout(t);
  }, [step, inView, reduce]);

  const s = reduce ? STEPS : step;
  const arrived = s >= 1;
  const fit = s >= 2;
  const booked = s >= 3;
  const onCalendar = s >= 4;

  return (
    <div ref={ref} className={className} aria-hidden>
      <AppWindow url="app.brexoo.com/leads">
        <LayoutGroup>
          <div className="grid gap-0 sm:grid-cols-[1.05fr_1fr]">
            {/* Leads list */}
            <div className="border-line p-4 sm:border-r">
              <div className="flex items-center justify-between">
                <span className="type-label text-ink-3">LEADS</span>
                <span className="type-label rounded-full bg-blue-soft px-2 py-0.5 text-blue tabular">{arrived ? OTHERS.length + 1 : OTHERS.length}</span>
              </div>
              <ul className="mt-3 grid gap-2">
                <AnimatePresence initial={false}>
                  {arrived ? (
                    <motion.li
                      key="sarah"
                      layout
                      initial={{ opacity: 0, y: -16, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.2 } }}
                      transition={{ duration: 0.5, ease: EASE }}
                      className="rounded-xl border border-blue/40 bg-blue-soft/40 p-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar name={SARAH.name} className="size-8" />
                        <div className="min-w-0 flex-1">
                          <p className="type-product truncate font-medium">{SARAH.name}</p>
                          <p className="truncate text-[12px] text-ink-3">
                            <MapPin className="mr-0.5 inline size-3" />
                            {SARAH.suburb} {SARAH.postcode}
                          </p>
                        </div>
                        <span className="size-2 rounded-full bg-blue" />
                      </div>
                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white">
                        <motion.div className="h-full origin-left rounded-full bg-[linear-gradient(90deg,var(--teal),var(--signal))]" initial={false} animate={{ scaleX: fit ? 0.82 : 0 }} transition={{ duration: 0.9, ease: EASE }} />
                      </div>
                      <motion.p className="mt-1.5 text-[12px] font-medium text-green-ink" initial={false} animate={{ opacity: fit ? 1 : 0 }} transition={{ duration: 0.3 }}>
                        Strong fit · 82
                      </motion.p>
                    </motion.li>
                  ) : null}
                </AnimatePresence>
                {OTHERS.map((l) => (
                  <motion.li key={l.ref} layout transition={{ duration: 0.5, ease: EASE }} className="flex items-center gap-2.5 rounded-xl border border-line p-3">
                    <Avatar name={l.name} className="size-8" />
                    <div className="min-w-0 flex-1">
                      <p className="type-product truncate">{l.name}</p>
                      <p className="truncate text-[12px] text-ink-3">{l.suburb}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Pipeline + calendar */}
            <div className="grid content-start gap-4 border-t border-line p-4 sm:border-t-0">
              <div className="grid grid-cols-3 gap-2">
                {["New", "Qualified", "Booked"].map((col, k) => (
                  <div key={col} className="min-h-[92px] rounded-xl bg-surface-2/70 p-2">
                    <p className="type-label mb-2 text-ink-3">{col}</p>
                    {(k === 0 && arrived && !booked) || (k === 2 && booked) ? (
                      <motion.div layoutId="sarah-card" transition={{ duration: 0.6, ease: EASE }} className={cn("rounded-lg border bg-white p-2 shadow-xs", k === 2 ? "border-teal/50" : "border-line")}>
                        <p className="truncate text-[12px] font-medium">{SARAH.name.split(" ")[0]}</p>
                        <p className="truncate text-[11px] text-ink-3">New build</p>
                      </motion.div>
                    ) : k === 1 ? (
                      <div className="rounded-lg border border-line bg-white p-2">
                        <p className="truncate text-[12px] font-medium">{OTHERS[1]!.name.split(" ")[0]}</p>
                        <p className="truncate text-[11px] text-ink-3">Duplex</p>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-line p-3">
                <p className="type-label text-ink-3">THIS WEEK</p>
                <div className="mt-2 grid grid-cols-5 gap-1.5">
                  {["M", "T", "W", "T", "F"].map((d, k) => (
                    <div key={k} className="grid gap-1">
                      <span className="text-center text-[11px] text-ink-3">{d}</span>
                      {[0, 1, 2].map((r) => {
                        const target = k === 2 && r === 0;
                        const busy = (k + r) % 4 === 1;
                        return (
                          <motion.span
                            key={r}
                            className={cn("h-6 rounded-md", busy ? "bg-teal-soft" : "bg-surface-2/80", target && "relative")}
                            initial={false}
                            animate={target && onCalendar ? { scale: [0.9, 1.06, 1] } : { scale: 1 }}
                            transition={{ duration: 0.5, ease: EASE }}
                          >
                            {target ? (
                              <motion.span className="absolute inset-0 grid place-items-center rounded-md bg-blue text-white" initial={false} animate={{ opacity: onCalendar ? 1 : 0 }} transition={{ duration: 0.25 }}>
                                <Check className="size-3.5" />
                              </motion.span>
                            ) : null}
                          </motion.span>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </LayoutGroup>
      </AppWindow>
    </div>
  );
}
