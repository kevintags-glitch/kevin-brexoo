"use client";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

/**
 * The 12-second Brexoo logo film (rendered from the brand vector paths). Plays muted and looped;
 * as you scroll past, it eases back and fades so the page below takes over. Reduced-motion users
 * get the still poster frame.
 */
export function HeroVideo({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : { scale, opacity, y }} className="h-full w-full will-change-transform">
        {reduce ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/media/brexoo-logo-intro-poster.jpg" alt="Brexoo — Discover, Qualify, Win" className="h-full w-full object-cover" />
        ) : (
          <video className="h-full w-full object-cover" autoPlay muted loop playsInline preload="auto" poster="/media/brexoo-logo-intro-poster.jpg" aria-label="Brexoo logo animation: Discover, Qualify, Win">
            <source src="/media/brexoo-logo-intro.webm" type="video/webm" />
            <source src="/media/brexoo-logo-intro.mp4" type="video/mp4" />
          </video>
        )}
      </motion.div>
    </div>
  );
}
