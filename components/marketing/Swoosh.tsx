import { cn } from "@/lib/cn";

/** The brand guide's sweeping Signal Blue wave, used behind heroes and on brand surfaces. */
export function Swoosh({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const a = tone === "dark" ? "#1f6feb" : "#3b82f6";
  const b = tone === "dark" ? "#3b9bff" : "#93c5fd";
  return (
    <svg aria-hidden viewBox="0 0 1200 600" preserveAspectRatio="none" className={cn("pointer-events-none", className)}>
      <defs>
        <linearGradient id={`sw-${tone}-a`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor={b} stopOpacity="0" />
          <stop offset="0.55" stopColor={b} stopOpacity="0.55" />
          <stop offset="1" stopColor={a} stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id={`sw-${tone}-b`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor={a} stopOpacity="0" />
          <stop offset="1" stopColor={a} stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <path d="M0 600 C 320 520, 560 300, 820 160 C 960 85, 1080 40, 1200 0 L1200 600 Z" fill={`url(#sw-${tone}-a)`} />
      <path d="M380 600 C 640 520, 860 380, 1040 250 C 1110 200, 1160 160, 1200 120 L1200 600 Z" fill={`url(#sw-${tone}-b)`} />
    </svg>
  );
}
