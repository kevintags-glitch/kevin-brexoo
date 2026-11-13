"use client";
import { motion, useReducedMotion } from "motion/react";
import { FLIP, MARK } from "./Logo";

const EASE = [0.23, 1, 0.32, 1] as const;

/**
 * The Brexoo mark drawing itself: the outline traces in, the brand fill settles, then two rings
 * breathe slowly behind it. Transform/opacity/stroke only; a still mark for reduced motion.
 */
export function AnimatedMark({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div className={className} aria-hidden>
      <div className="relative aspect-square w-full">
        {!reduce
          ? [0, 1].map((k) => (
              <motion.span
                key={k}
                className="absolute inset-[6%] rounded-full border"
                style={{ borderColor: k ? "rgb(6 182 212 / 0.35)" : "rgb(59 130 246 / 0.3)" }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [0.86, 1.04, 0.86], opacity: [0, 0.9, 0] }}
                transition={{ duration: 6, ease: "easeInOut", repeat: Infinity, delay: 2.2 + k * 3 }}
              />
            ))
          : null}
        <svg viewBox="0 20 1400 1320" className="relative h-full w-full overflow-visible">
          <g transform={FLIP}>
            <motion.path
              d={MARK}
              fill="var(--brand-mark)"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, ease: EASE, delay: reduce ? 0 : 1.5 }}
            />
            {!reduce ? (
              <motion.path
                d={MARK}
                fill="none"
                stroke="var(--brand-mark)"
                strokeWidth={60}
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 1 }}
                animate={{ pathLength: 1, opacity: [1, 1, 0] }}
                transition={{ pathLength: { duration: 1.8, ease: [0.45, 0, 0.2, 1] }, opacity: { duration: 2.6, times: [0, 0.7, 1] } }}
              />
            ) : null}
          </g>
        </svg>
      </div>
    </div>
  );
}
