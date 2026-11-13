/**
 * Original spot illustrations in a hand-drawn line style: ink strokes with small brand-blue and
 * teal fills. Decorative only (aria-hidden); every use has a visible text label next to it.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type IllustrationName = "house" | "bolt" | "tap" | "fan" | "hammer" | "leaf" | "spray" | "roof" | "calendar" | "magnifier" | "spark" | "chat" | "chart" | "shield";

const INK = "var(--ink)";
const BLUE = "var(--signal)";
const TEAL = "var(--teal)";

function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 96 96" aria-hidden className={cn("size-16", className)} fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const PARTS: Record<IllustrationName, ReactNode> = {
  house: (
    <>
      <path d="M20 46 48 22l28 24" />
      <path d="M26 41v33h44V41" />
      <rect x="42" y="54" width="13" height="20" rx="1.5" fill={BLUE} fillOpacity={0.18} />
      <rect x="31" y="49" width="8" height="8" rx="1" fill={TEAL} fillOpacity={0.35} />
      <path d="M62 30v-9h6v14" />
      <path d="M14 74h68" strokeDasharray="2 5" />
    </>
  ),
  bolt: (
    <>
      <circle cx="48" cy="48" r="28" fill={BLUE} fillOpacity={0.1} />
      <path d="M52 18 32 52h15l-4 26 21-35H49z" fill={TEAL} fillOpacity={0.3} />
      <path d="M74 30c3 5 4 11 2 17M22 64c-3-5-4-11-2-17" />
    </>
  ),
  tap: (
    <>
      <path d="M22 40h30a10 10 0 0 1 10 10v6" />
      <path d="M22 32v16" />
      <rect x="34" y="24" width="12" height="8" rx="2" fill={BLUE} fillOpacity={0.2} />
      <path d="M40 24v-6M34 18h12" />
      <path d="M62 64c0 4-3 7-6 7s-6-3-6-7c0-4 6-10 6-10s6 6 6 10z" fill={TEAL} fillOpacity={0.35} />
      <path d="M58 80c3 0 6-1 8-3" strokeDasharray="2 4" />
    </>
  ),
  fan: (
    <>
      <rect x="16" y="20" width="64" height="56" rx="8" />
      <circle cx="48" cy="48" r="19" fill={BLUE} fillOpacity={0.12} />
      <path d="M48 48c0-9 6-14 11-12s3 9-11 12zM48 48c8 4 9 12 5 15s-9-2-5-15zM48 48c-8 5-15 2-15-3s7-7 15 3z" fill={TEAL} fillOpacity={0.35} />
      <circle cx="48" cy="48" r="2.5" fill={INK} />
    </>
  ),
  hammer: (
    <>
      <path d="M30 70 58 42" strokeWidth={5} />
      <path d="M50 26l14-6 12 12-6 14-6-6-8 2-6-6 2-8z" fill={BLUE} fillOpacity={0.2} />
      <rect x="18" y="72" width="24" height="6" rx="2" fill={TEAL} fillOpacity={0.3} />
      <path d="M22 62l-6 6M72 58l6 4" strokeDasharray="2 4" />
    </>
  ),
  leaf: (
    <>
      <path d="M26 72c0-28 18-46 48-48 0 30-18 48-46 48z" fill={TEAL} fillOpacity={0.25} />
      <path d="M26 72c10-14 22-26 38-36" />
      <path d="M40 58l-2-12M50 48l10 1" />
      <path d="M14 80h68" strokeDasharray="2 5" />
    </>
  ),
  spray: (
    <>
      <path d="M38 36h20l4 10v30a4 4 0 0 1-4 4H38a4 4 0 0 1-4-4V46z" fill={BLUE} fillOpacity={0.15} />
      <path d="M40 36V26h14l10 6-4 4H54" />
      <path d="M38 56h20" />
      <circle cx="72" cy="24" r="2" fill={TEAL} stroke="none" />
      <circle cx="78" cy="32" r="1.6" fill={TEAL} stroke="none" />
      <circle cx="76" cy="18" r="1.3" fill={TEAL} stroke="none" />
      <path d="M68 28l6-2" />
    </>
  ),
  roof: (
    <>
      <path d="M14 50 48 24l34 26" />
      <path d="M22 44l26-20 26 20" fill={BLUE} fillOpacity={0.15} />
      <path d="M26 46v28h44V46" />
      <path d="M58 62h16v-8l-6-4-10 4z" fill={TEAL} fillOpacity={0.3} />
      <path d="M66 50v-6" />
    </>
  ),
  calendar: (
    <>
      <rect x="18" y="24" width="60" height="52" rx="7" />
      <path d="M18 38h60M34 18v12M62 18v12" />
      <rect x="28" y="46" width="12" height="10" rx="2" fill={BLUE} fillOpacity={0.25} />
      <rect x="44" y="46" width="12" height="10" rx="2" />
      <rect x="60" y="46" width="10" height="10" rx="2" />
      <rect x="28" y="60" width="12" height="9" rx="2" />
      <rect x="44" y="60" width="12" height="9" rx="2" fill={TEAL} fillOpacity={0.35} />
    </>
  ),
  magnifier: (
    <>
      <circle cx="42" cy="42" r="20" fill={BLUE} fillOpacity={0.12} />
      <path d="M57 57l17 17" strokeWidth={5} />
      <path d="M34 40h16M42 32v16" stroke={TEAL} />
    </>
  ),
  spark: (
    <>
      <path d="M48 16c3 18 8 23 26 26-18 3-23 8-26 26-3-18-8-23-26-26 18-3 23-8 26-26z" fill={BLUE} fillOpacity={0.15} />
      <path d="M74 66c1 6 3 8 9 9-6 1-8 3-9 9-1-6-3-8-9-9 6-1 8-3 9-9z" fill={TEAL} fillOpacity={0.4} />
    </>
  ),
  chat: (
    <>
      <path d="M16 26h44a6 6 0 0 1 6 6v20a6 6 0 0 1-6 6H34l-12 10V58h-6a6 6 0 0 1-6-6V32a6 6 0 0 1 6-6z" fill={BLUE} fillOpacity={0.12} />
      <path d="M50 64h20l10 8v-8h2a4 4 0 0 0 4-4V46" />
      <path d="M24 38h28M24 46h18" stroke={TEAL} />
    </>
  ),
  chart: (
    <>
      <path d="M18 18v60h60" />
      <rect x="28" y="52" width="10" height="20" rx="2" fill={BLUE} fillOpacity={0.2} />
      <rect x="44" y="40" width="10" height="32" rx="2" fill={BLUE} fillOpacity={0.3} />
      <rect x="60" y="26" width="10" height="46" rx="2" fill={TEAL} fillOpacity={0.4} />
      <path d="M26 44l18-12 14 6 18-16" strokeDasharray="3 4" />
    </>
  ),
  shield: (
    <>
      <path d="M48 16 74 26v20c0 16-11 28-26 34-15-6-26-18-26-34V26z" fill={BLUE} fillOpacity={0.12} />
      <path d="M36 48l9 9 16-18" stroke={TEAL} strokeWidth={3} />
    </>
  ),
};

export function Illustration({ name, className }: { name: IllustrationName; className?: string }) {
  return <Frame className={className}>{PARTS[name]}</Frame>;
}
