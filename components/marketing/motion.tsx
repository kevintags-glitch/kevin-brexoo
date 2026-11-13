"use client";
/**
 * Scroll and reveal choreography for the marketing site. Each page uses a different combination so
 * no two pages scroll the same way. Everything respects prefers-reduced-motion and animates only
 * transform/opacity (plus SVG stroke for the drawn timeline).
 */
import { motion, useInView, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const EASE = [0.23, 1, 0.32, 1] as const;

/** Thin reading-progress line under the header. */
export function ScrollProgress({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll();
  const x = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });
  return <motion.div aria-hidden style={{ scaleX: x }} className={cn("fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-[linear-gradient(90deg,var(--teal),var(--signal))]", className)} />;
}

/** Headline that rises word by word, with a slight blur, as it enters. */
export function WordsReveal({ text, className, as = "h2", delay = 0 }: { text: string; className?: string; as?: "h1" | "h2" | "p"; delay?: number }) {
  const reduce = useReducedMotion();
  const Tag = as;
  const words = text.split(" ");
  if (reduce) return <Tag className={className}>{text}</Tag>;
  return (
    <Tag className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "105%", opacity: 0, filter: "blur(6px)" }}
            whileInView={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.9, ease: EASE, delay: delay + i * 0.06 }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/** Moves its children at a different speed to the page (positive = slower, floats up). */
export function Parallax({ children, speed = 0.2, className }: { children: ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * 100}%`, `${-speed * 100}%`]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}

/** Slides in from the left or right as it enters (for zig-zag layouts). */
export function SlideIn({ children, from = "left", className, delay = 0 }: { children: ReactNode; from?: "left" | "right" | "bottom"; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  const initial = from === "bottom" ? { y: 60, opacity: 0 } : { x: from === "left" ? -80 : 80, opacity: 0 };
  return (
    <motion.div className={className} initial={initial} whileInView={{ x: 0, y: 0, opacity: 1 }} viewport={{ once: true, margin: "0px 0px -15% 0px" }} transition={{ duration: 0.9, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}

/** Tilts up from a 3D angle into place: used for card grids. */
export function TiltIn({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      style={{ transformPerspective: 1000 }}
      initial={{ rotateX: 28, y: 50, opacity: 0, scale: 0.96 }}
      whileInView={{ rotateX: 0, y: 0, opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ type: "spring", duration: 1, bounce: 0.18, delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Vertical scroll drives a horizontal track: the section pins while panels slide past.
 * On small screens it falls back to a swipeable row.
 */
export function HorizontalPin({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const count = Children.count(children);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", `-${((count - 1) / count) * 100}%`]);
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  if (reduce) {
    return <div className={cn("grid gap-6 md:grid-cols-3", className)}>{children}</div>;
  }
  return (
    <>
      <div ref={ref} className={cn("relative max-md:hidden", className)} style={{ height: `${count * 90}vh` }}>
        <div className="sticky top-0 flex h-dvh items-center overflow-hidden">
          <motion.div className="flex h-[78vh]" style={{ x, width: `${count * 100}vw` }}>
            {Children.map(children, (c) => (
              <div className="flex h-full w-screen shrink-0 items-center justify-center px-8">{c}</div>
            ))}
          </motion.div>
          <div className="absolute inset-x-0 bottom-8 mx-auto h-[3px] w-48 overflow-hidden rounded-full bg-surface-2">
            <motion.div className="h-full origin-left bg-blue" style={{ scaleX: progress }} />
          </div>
        </div>
      </div>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-6 scrollbar-none md:hidden">
        {Children.map(children, (c) => (
          <div className="w-[86vw] shrink-0 snap-center">{c}</div>
        ))}
      </div>
    </>
  );
}

/** Infinite marquee (CSS), optionally reversed. Duplicated content keeps the loop seamless. */
export function Marquee({ children, reverse, speed = 40, className }: { children: ReactNode; reverse?: boolean; speed?: number; className?: string }) {
  return (
    <div className={cn("group flex overflow-hidden mask-fade-x", className)}>
      {[0, 1].map((k) => (
        <div
          key={k}
          aria-hidden={k === 1}
          className="flex shrink-0 items-center gap-4 pr-4 motion-safe:animate-[marquee_var(--d)_linear_infinite] group-hover:[animation-play-state:paused]"
          style={{ ["--d" as string]: `${speed}s`, animationDirection: reverse ? "reverse" : "normal" }}
        >
          {children}
        </div>
      ))}
    </div>
  );
}

/** Big words that slide sideways with scroll position. */
export function ScrollMarquee({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["5%", "-45%"]);
  return (
    <div ref={ref} className={cn("overflow-hidden", className)} aria-hidden>
      <motion.p style={reduce ? undefined : { x }} className="whitespace-nowrap text-[13vw] font-extralight leading-none tracking-[-0.05em] text-ink/[0.06]">
        {text} {text}
      </motion.p>
    </div>
  );
}

/** Counts up when visible. */
export function CountUp({ to, suffix = "", className, duration = 1.6 }: { to: number; suffix?: string; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView || reduce) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / (duration * 1000));
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration, reduce]);
  return (
    <span ref={ref} className={cn("tabular", className)}>
      {(reduce ? to : n).toLocaleString("en-US")}
      {suffix}
    </span>
  );
}

/** Cards that pin and stack on top of each other, earlier ones shrinking back. */
export function StackCards({ items, className }: { items: { title: string; body: string; tone: string; icon: ReactNode }[]; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      {items.map((it, i) => (
        <StackCard key={it.title} index={i} total={items.length} {...it} />
      ))}
    </div>
  );
}

function StackCard({ index, total, title, body, tone, icon }: { index: number; total: number; title: string; body: string; tone: string; icon: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1 - (total - index) * 0.04]);
  const opacity = useTransform(scrollYProgress, [0, 0.9, 1], [1, 1, 0.6]);
  return (
    <div ref={ref} className="h-[62vh]">
      <motion.div
        style={reduce ? { top: `${96 + index * 22}px` } : { scale, opacity, top: `${96 + index * 22}px` }}
        className={cn("sticky flex min-h-[320px] origin-top flex-col justify-between rounded-[28px] border border-line p-8 shadow-lg sm:p-12", tone)}
      >
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium uppercase tracking-[0.2em] opacity-70">{String(index + 1).padStart(2, "0")}</span>
          <span className="[&_svg]:size-8">{icon}</span>
        </div>
        <div>
          <h3 className="max-w-[18ch] text-[32px] font-light leading-[1.08] tracking-[-0.03em] sm:text-[48px]">{title}</h3>
          <p className="mt-4 max-w-xl text-[16px] leading-relaxed opacity-80 sm:text-[18px]">{body}</p>
        </div>
      </motion.div>
    </div>
  );
}

/** An SVG line that draws down the page as you scroll (vertical timeline). */
export function DrawLine({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const len = useSpring(scrollYProgress, { stiffness: 90, damping: 25 });
  return (
    <div ref={ref} aria-hidden className={cn("pointer-events-none absolute inset-y-0 left-1/2 w-6 -translate-x-1/2 max-md:left-6", className)}>
      <svg className="h-full w-full" viewBox="0 0 24 1000" preserveAspectRatio="none">
        <path d="M12 0 C 22 120, 2 240, 12 360 S 22 600, 12 720 S 2 900, 12 1000" fill="none" stroke="var(--line)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <motion.path d="M12 0 C 22 120, 2 240, 12 360 S 22 600, 12 720 S 2 900, 12 1000" fill="none" stroke="url(#dl)" strokeWidth="3" vectorEffect="non-scaling-stroke" style={{ pathLength: reduce ? 1 : len }} />
        <defs>
          <linearGradient id="dl" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#06B6D4" />
            <stop offset="1" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/** A chat that plays out as the section scrolls through the viewport. */
export function ScrollChat({ messages, className }: { messages: { from: "user" | "ai"; text: string; meta?: string }[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end center"] });
  const [shown, setShown] = useState(reduce ? messages.length : 1);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (!reduce) setShown(Math.max(1, Math.min(messages.length, Math.ceil(v * (messages.length + 0.5)))));
  });
  return (
    <div ref={ref} className={cn("grid gap-3", className)} aria-live="polite">
      {messages.map((m, i) => (
        <motion.div
          key={i}
          initial={false}
          animate={i < shown ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.45, ease: EASE }}
          className={cn("max-w-[86%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed", m.from === "user" ? "ml-auto rounded-br-md bg-blue text-white" : "rounded-bl-md border border-line bg-surface text-ink-2 shadow-sm")}
        >
          {m.text}
          {m.meta ? <span className="mt-1.5 block text-[11px] font-medium text-teal-ink">{m.meta}</span> : null}
        </motion.div>
      ))}
    </div>
  );
}

/** Scales an element from small to full as it scrolls into the centre (zoom-in reveal). */
export function ZoomIn({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.82, 1]);
  const radius = useTransform(scrollYProgress, [0, 1], [48, 24]);
  const opacity = useTransform(scrollYProgress, [0, 0.4, 1], [0, 1, 1]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : { scale, borderRadius: radius, opacity }} className="overflow-hidden">
        {children}
      </motion.div>
    </div>
  );
}

export type { MotionValue };

/** A horizontal, snap-scrolling row with previous/next buttons (resources, lifecycle). */
export function SnapCarousel({ children, label, className }: { children: ReactNode; label: string; className?: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const move = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(280, el.clientWidth * 0.8), behavior: "smooth" });
  };
  return (
    <div className={cn("relative", className)}>
      <div className="mb-5 flex justify-end gap-2">
        <button type="button" onClick={() => move(-1)} aria-label={`Previous ${label}`} className="pressable grid size-11 place-items-center rounded-full border border-line-strong bg-white text-ink hover:border-blue hover:text-blue">
          <span aria-hidden>←</span>
        </button>
        <button type="button" onClick={() => move(1)} aria-label={`Next ${label}`} className="pressable grid size-11 place-items-center rounded-full border border-line-strong bg-white text-ink hover:border-blue hover:text-blue">
          <span aria-hidden>→</span>
        </button>
      </div>
      <ul ref={ref} aria-label={label} className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-4 sm:-mx-6 sm:scroll-px-6 sm:px-6">
        {Children.map(children, (c) => (
          <li className="w-[82vw] shrink-0 snap-start sm:w-[420px]">{c}</li>
        ))}
      </ul>
    </div>
  );
}

/** Follows the pointer with a gentle 3D tilt and a moving highlight (pricing cards). */
export function HoverTilt({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const [t, setT] = useState({ rx: 0, ry: 0, gx: 50, gy: 0 });
  return (
    <motion.div
      className={cn("relative", className)}
      style={{ transformPerspective: 900 }}
      animate={reduce ? undefined : { rotateX: t.rx, rotateY: t.ry }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        setT({ rx: (0.5 - py) * 8, ry: (px - 0.5) * 10, gx: px * 100, gy: py * 100 });
      }}
      onPointerLeave={() => setT({ rx: 0, ry: 0, gx: 50, gy: 0 })}
    >
      {children}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: `radial-gradient(420px circle at ${t.gx}% ${t.gy}%, rgb(59 130 246 / 0.08), transparent 60%)` }} />
    </motion.div>
  );
}

/**
 * Steps on the right scroll normally; the big counter on the left stays pinned and changes to the
 * step in view (managed services).
 */
export function StickySteps({ steps, className }: { steps: { title: string; body: string }[]; className?: string }) {
  const [active, setActive] = useState(0);
  return (
    <div className={cn("grid gap-10 md:grid-cols-[0.8fr_1.2fr]", className)}>
      <div className="max-md:hidden">
        <div className="sticky top-32">
          <p className="text-[13px] uppercase tracking-[0.24em] text-ink-3">Step</p>
          <div className="relative mt-2 h-[180px] overflow-hidden">
            {steps.map((_, i) => (
              <motion.p
                key={i}
                aria-hidden
                className="absolute inset-0 text-[180px] font-extralight leading-none tracking-[-0.06em] text-blue tabular"
                initial={false}
                animate={{ y: i === active ? "0%" : i < active ? "-100%" : "100%", opacity: i === active ? 1 : 0 }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                {String(i + 1).padStart(2, "0")}
              </motion.p>
            ))}
          </div>
          <div className="mt-6 h-[3px] w-48 overflow-hidden rounded-full bg-surface-2">
            <motion.div className="h-full origin-left bg-[linear-gradient(90deg,var(--teal),var(--signal))]" animate={{ scaleX: (active + 1) / steps.length }} transition={{ duration: 0.5, ease: EASE }} />
          </div>
        </div>
      </div>
      <ol className="grid gap-6">
        {steps.map((s, i) => (
          <StickyStep key={s.title} index={i} onActive={setActive} {...s} active={i === active} />
        ))}
      </ol>
    </div>
  );
}

function StickyStep({ index, title, body, active, onActive }: { index: number; title: string; body: string; active: boolean; onActive: (i: number) => void }) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });
  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);
  return (
    <li ref={ref} className={cn("rounded-[24px] border p-7 transition-colors duration-500 sm:p-9", active ? "border-blue/40 bg-white shadow-lg" : "border-line bg-surface-2/50")}>
      <p className="text-[13px] font-medium text-ink-3 md:hidden">Step {index + 1}</p>
      <p className="text-[24px] font-light leading-snug tracking-[-0.02em] sm:text-[28px]">{title}</p>
      <p className="mt-3 text-[16px] font-light leading-relaxed text-ink-2">{body}</p>
    </li>
  );
}

/** Reveals content with a clip-path wipe from bottom to top (industry bento). */
export function WipeIn({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ clipPath: "inset(100% 0% 0% 0% round 28px)" }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0% round 28px)" }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 1.1, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}
