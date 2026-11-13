"use client";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import { OverviewMock } from "./mocks";

/** The hero product shot starts tilted back and settles flat as you scroll into it. */
export function HeroProduct() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.25"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  const rotateX = useTransform(progress, [0, 1], [16, 0]);
  const scale = useTransform(progress, [0, 1], [0.92, 1]);
  const y = useTransform(progress, [0, 1], [40, 0]);

  return (
    <div ref={ref} className="relative mx-auto max-w-[1080px] [perspective:1600px]">
      <div aria-hidden className="absolute inset-x-[8%] -bottom-6 top-[20%] -z-10 rounded-[40px] bg-[radial-gradient(60%_60%_at_50%_40%,color-mix(in_oklab,var(--sky)_28%,transparent),transparent_70%)] blur-2xl" />
      <motion.div style={reduce ? undefined : { rotateX, scale, y, transformOrigin: "50% 0%" }} className="will-change-transform">
        <OverviewMock />
      </motion.div>
    </div>
  );
}
