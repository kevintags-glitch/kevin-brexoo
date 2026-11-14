/**
 * Brexoo brand icons, drawn in the logo's language: one heavy monoline weight with round caps,
 * stadium and circle forms that overlap and interlock like the mark, in Midnight with a single
 * Signal Blue or Growth Teal accent. 80+ original icons on a 96-unit grid. Decorative only
 * (aria-hidden); every use has a visible label beside it.
 */
import type React from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// Colours come from CSS variables so one drawing can sit on any brand tile (see BrandIcon tones).
const N = "var(--bi-ink, var(--brand-mark))"; // Midnight, from the logo artwork
const B = "var(--bi-blue, var(--signal))"; // Signal Blue accent
const T = "var(--bi-teal, var(--teal))"; // Growth Teal accent

/** Accent stroke (one per icon). */
const a = (d: string, c: string = B) => <path d={d} stroke={c} />;
/** Accent filled dot. */
const dot = (cx: number, cy: number, r = 5, c: string = T) => <circle cx={cx} cy={cy} r={r} fill={c} stroke="none" />;
/** The logo's interlocking motif, scaled into a corner: a stadium and a circle. */
const loop = (x: number, y: number, s = 1, c: string = B) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} stroke={c} strokeWidth={6 / s}>
    <rect x="0" y="0" width="14" height="22" rx="7" />
    <circle cx="16" cy="15" r="8" />
  </g>
);

export const BRAND_ICONS = {
  // ── Trades ───────────────────────────────────────────────────────────────────────────────
  home: <>
    <path d="M18 46 48 20l30 26" /><rect x="26" y="42" width="44" height="34" rx="6" />{a("M42 76V60a6 6 0 0 1 12 0v16")}
  </>,
  extension: <>
    <path d="M14 48 38 28l24 20" /><rect x="20" y="44" width="36" height="32" rx="6" />{a("M56 52h20a6 6 0 0 1 6 6v18H56")}
  </>,
  duplex: <>
    <path d="M12 44 30 28l18 16 18-16 18 16" /><rect x="18" y="42" width="60" height="34" rx="6" />{a("M48 42v34")}
  </>,
  bolt: <>
    <circle cx="48" cy="48" r="30" />{a("M52 26 38 50h14l-6 22 16-26H48z", T)}
  </>,
  panel: <>
    <rect x="24" y="16" width="48" height="64" rx="8" /><path d="M36 32h24M36 46h24M36 60h10" />{dot(60, 62, 6, B)}
  </>,
  evcharger: <>
    <rect x="22" y="18" width="32" height="58" rx="8" /><path d="M54 40h8a8 8 0 0 1 8 8v14a6 6 0 0 0 12 0V34" />{a("M40 32l-6 12h10l-6 12", T)}
  </>,
  tap: <>
    <path d="M18 42h28a14 14 0 0 1 14 14v6" /><rect x="30" y="22" width="20" height="12" rx="6" />{a("M60 72a6 6 0 0 1-12 0c0-6 6-12 6-12s6 6 6 12z", T)}
  </>,
  hotwater: <>
    <rect x="28" y="14" width="40" height="68" rx="20" />{a("M42 40c-4 6 4 8 0 14M54 40c-4 6 4 8 0 14", B)}
  </>,
  drain: <>
    <circle cx="48" cy="48" r="30" /><circle cx="48" cy="48" r="16" />{a("M40 48h16M48 40v16", T)}
  </>,
  ac: <>
    <rect x="14" y="24" width="68" height="30" rx="15" /><path d="M28 42h40" />{a("M32 66c0 6-4 8-4 12M48 66c0 6-4 8-4 12M64 66c0 6-4 8-4 12", B)}
  </>,
  heatpump: <>
    <rect x="16" y="22" width="64" height="52" rx="10" /><circle cx="42" cy="48" r="14" />{a("M66 34v28", T)}
  </>,
  roller: <>
    <rect x="20" y="16" width="48" height="22" rx="11" /><path d="M68 27h8v18H44v14" />{a("M44 59v20", B)}
  </>,
  roof: <>
    <path d="M12 52 48 22l36 30" /><path d="M24 48v28h48V48" />{a("M60 32V20h10v20", T)}
  </>,
  hammer: <>
    <path d="M34 62 66 30" />{a("M56 20l20 20-8 8-20-20z", B)}<path d="M30 66 20 76" />
  </>,
  leaf: <>
    <path d="M22 74c0-30 20-50 52-52 0 32-20 52-52 52z" />{a("M22 74c12-16 24-28 38-36", T)}
  </>,
  spray: <>
    <path d="M36 36h22l6 12v28a6 6 0 0 1-6 6H40a6 6 0 0 1-6-6V48z" /><path d="M40 36V24h14l10 6" />{dot(74, 22, 4)}{dot(80, 32, 3)}
  </>,

  // ── CRM ──────────────────────────────────────────────────────────────────────────────────
  lead: <>
    <circle cx="40" cy="36" r="14" /><path d="M16 78a24 24 0 0 1 48 0" />{a("M70 30v20M60 40h20", B)}
  </>,
  inbox: <>
    <rect x="14" y="22" width="68" height="52" rx="12" /><path d="M14 52h18l6 10h20l6-10h18" />{dot(70, 22, 7, B)}
  </>,
  fit: <>
    <circle cx="48" cy="48" r="30" /><circle cx="48" cy="48" r="16" />{dot(48, 48, 6, B)}
  </>,
  intent: <>
    <path d="M18 66a30 30 0 0 1 60 0" />{a("M48 66 64 42", T)}<circle cx="48" cy="66" r="5" />
  </>,
  pipeline: <>
    <rect x="12" y="20" width="20" height="56" rx="10" /><rect x="38" y="20" width="20" height="40" rx="10" />{a("M64 20h20v24H64z", T)}
  </>,
  task: <>
    <rect x="18" y="16" width="60" height="64" rx="12" /><path d="M32 36h32M32 50h20" />{a("M32 64l6 6 12-12", T)}
  </>,
  calendar: <>
    <rect x="14" y="22" width="68" height="56" rx="12" /><path d="M14 40h68M34 14v14M62 14v14" />{dot(58, 60, 7, B)}
  </>,
  booking: <>
    <rect x="14" y="22" width="56" height="54" rx="12" /><path d="M14 40h56M30 14v14M54 14v14" />{a("M62 62l8 8 14-16", T)}
  </>,
  client: <>
    <circle cx="36" cy="38" r="12" /><path d="M14 78a22 22 0 0 1 44 0" />{a("M66 36l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z", T)}
  </>,
  repeat: <>
    <path d="M24 44a24 24 0 0 1 44-12" /><path d="M72 52a24 24 0 0 1-44 12" />{a("M66 18v16H50M30 78V62h16", B)}
  </>,
  report: <>
    <path d="M16 16v64h64" /><rect x="28" y="50" width="10" height="20" rx="5" /><rect x="46" y="38" width="10" height="32" rx="5" />{a("M64 26h0v44", T)}
  </>,
  source: <>
    <circle cx="28" cy="28" r="10" /><circle cx="68" cy="28" r="10" /><path d="M28 38v10a10 10 0 0 0 10 10h20a10 10 0 0 0 10-10V38" />{a("M48 58v20", B)}
  </>,
  discover: <>
    <circle cx="42" cy="42" r="24" /><path d="M60 60l18 18" />{a("M34 42h16M42 34v16", T)}
  </>,
  mappin: <>
    <path d="M48 82s26-22 26-44a26 26 0 0 0-52 0c0 22 26 44 26 44z" /><circle cx="48" cy="38" r="9" stroke={B} />
  </>,
  notification: <>
    <path d="M26 64V44a22 22 0 0 1 44 0v20l6 8H20z" /><path d="M40 78a8 8 0 0 0 16 0" />{dot(70, 22, 7, B)}
  </>,
  webhook: <>
    <circle cx="28" cy="64" r="10" /><circle cx="68" cy="64" r="10" /><circle cx="48" cy="28" r="10" />{a("M38 64h20M43 37 33 55M53 37l10 18", T)}
  </>,

  // ── Places ───────────────────────────────────────────────────────────────────────────────
  city: <>
    <rect x="16" y="34" width="22" height="44" rx="6" /><rect x="44" y="18" width="22" height="60" rx="6" />{a("M72 50h10v28H72", T)}
  </>,
  suburb: <>
    <path d="M12 54 30 38l18 16" /><path d="M48 54l18-16 18 16" /><path d="M18 50v26h24V50M54 50v26h24V50" />{dot(30, 66, 4, B)}
  </>,
  county: <>
    <path d="M18 22h60l-8 26 8 28H18l8-28z" />{a("M38 40h20M38 56h14", B)}
  </>,
  zip: <>
    <rect x="14" y="26" width="68" height="44" rx="12" /><path d="M28 42h14M28 54h22" />{a("M62 40v16", T)}
  </>,
  us: <>
    <rect x="12" y="24" width="72" height="48" rx="12" /><path d="M12 42h72M12 56h72" />{a("M12 36V24h26v18H12", B)}
  </>,
  au: <>
    <path d="M22 44c0-12 10-20 22-20 4 0 6 4 10 4 10 0 22 6 22 22 0 14-10 24-24 24-8 0-12-6-18-6-8 0-12-6-12-12z" />{dot(66, 80, 5, T)}
  </>,
  nz: <>
    <path d="M50 14c4 6 6 12 14 18 6 4 4 12-2 14-6 2-10 6-12 10" /><path d="M44 58c-6 6-14 10-18 20 8 2 16-2 22-10 4-6 8-8 10-12" />{dot(70, 26, 5, T)}
  </>,
  timezone: <>
    <circle cx="48" cy="48" r="30" /><path d="M48 32v16l10 8" />{a("M18 48h60", T)}
  </>,

  // ── Trust & operations ───────────────────────────────────────────────────────────────────
  shield: <>
    <path d="M48 14l28 10v22c0 18-12 30-28 36-16-6-28-18-28-36V24z" />{a("M36 48l9 9 16-18", T)}
  </>,
  audit: <>
    <rect x="20" y="14" width="48" height="64" rx="10" /><path d="M32 32h24M32 46h16" />{a("M60 58a10 10 0 1 1 0 .1M68 66l10 10", B)}
  </>,
  consent: <>
    <rect x="16" y="20" width="64" height="56" rx="12" /><rect x="28" y="38" width="16" height="16" rx="5" />{a("M31 46l4 4 7-8", T)}<path d="M52 46h16" />
  </>,
  team: <>
    <circle cx="34" cy="38" r="11" /><circle cx="62" cy="38" r="11" stroke={B} /><path d="M14 76a20 20 0 0 1 40 0M42 76a20 20 0 0 1 40 0" />
  </>,
  approve: <>
    <circle cx="48" cy="48" r="30" />{a("M34 48l10 10 20-22", T)}
  </>,
  export: <>
    <rect x="18" y="38" width="60" height="40" rx="12" />{a("M48 52V14M34 28l14-14 14 14", B)}
  </>,
  page: <>
    <rect x="16" y="14" width="64" height="68" rx="12" /><path d="M16 32h64" />{a("M30 48h36M30 62h22", B)}
  </>,
  form: <>
    <rect x="16" y="18" width="64" height="16" rx="8" /><rect x="16" y="42" width="64" height="16" rx="8" />{a("M28 66h40a0 0 0 0 1 0 0v8a6 6 0 0 1-6 6H34a6 6 0 0 1-6-6z", B)}
  </>,

  // ── Communication & outcomes ─────────────────────────────────────────────────────────────
  spark: <>
    <path d="M44 14c3 16 8 21 24 24-16 3-21 8-24 24-3-16-8-21-24-24 16-3 21-8 24-24z" />{a("M72 58c1 6 3 8 9 9-6 1-8 3-9 9-1-6-3-8-9-9 6-1 8-3 9-9z", T)}
  </>,
  chat: <>
    <path d="M14 26a10 10 0 0 1 10-10h40a10 10 0 0 1 10 10v24a10 10 0 0 1-10 10H38L24 72V60a10 10 0 0 1-10-10z" />{a("M30 32h28M30 44h18", B)}
  </>,
  phone: <>
    <rect x="28" y="12" width="40" height="72" rx="12" /><path d="M42 72h12" />{dot(48, 26, 4, B)}
  </>,
  video: <>
    <rect x="12" y="26" width="52" height="44" rx="12" />{a("M64 42l20-12v36L64 54", T)}
  </>,
  sitevisit: <>
    <path d="M48 82s22-18 22-36a22 22 0 0 0-44 0c0 18 22 36 22 36z" />{a("M38 44l10-8 10 8v10H38z", B)}
  </>,
  quote: <>
    <rect x="18" y="14" width="60" height="68" rx="12" /><path d="M30 32h36M30 46h22" />{a("M56 60h12v10H56z", T)}
  </>,
  won: <>
    <path d="M30 18h36v18a18 18 0 0 1-36 0z" /><path d="M48 54v12M36 78h24" />{a("M30 24H18v4a12 12 0 0 0 12 12M66 24h12v4a12 12 0 0 1-12 12", T)}
  </>,
  star: <>
    <path d="M48 14l10 22 24 3-18 16 5 24-21-12-21 12 5-24-18-16 24-3z" />{dot(48, 48, 6, B)}
  </>,
  // ── More trades ──────────────────────────────────────────────────────────────────────────
  kitchen: <>
    <rect x="14" y="40" width="68" height="38" rx="8" /><path d="M14 56h68M48 40v38" />{a("M28 28h12M56 22v10", T)}
  </>,
  bathroom: <>
    <path d="M14 48h68v8a20 20 0 0 1-20 20H34a20 20 0 0 1-20-20z" /><path d="M24 48V24a8 8 0 0 1 16 0" />{dot(40, 34, 5, B)}
  </>,
  deck: <>
    <path d="M12 46h72M18 46v30M78 46v30M12 62h72" />{a("M30 46V30h36v16", T)}
  </>,
  fence: <>
    <path d="M22 78V30l8-10 8 10v48M58 78V30l8-10 8 10v48" />{a("M14 44h68M14 62h68", B)}
  </>,
  flooring: <>
    <rect x="14" y="14" width="68" height="68" rx="10" /><path d="M14 38h68M14 62h68M40 14v24M56 38v24M32 62v20" stroke={T} />
  </>,
  solar: <>
    <path d="M14 70l12-40h44l12 40z" /><path d="M20 52h56M48 30v40" />{dot(76, 18, 7, T)}
  </>,
  window: <>
    <rect x="20" y="14" width="56" height="68" rx="10" /><path d="M20 48h56M48 14v68" />{a("M30 26l10-6", B)}
  </>,
  gutter: <>
    <path d="M12 30h72v10a8 8 0 0 1-8 8H20a8 8 0 0 1-8-8z" /><path d="M70 48v24" />{a("M70 78a5 5 0 0 1-10 0c0-5 5-10 5-10s5 5 5 10z", T)}
  </>,
  pool: <>
    <rect x="14" y="30" width="68" height="40" rx="20" />{a("M24 50c6-6 10 6 16 0s10 6 16 0 10 6 16 0", B)}
  </>,
  concrete: <>
    <path d="M18 70h60" /><rect x="24" y="30" width="48" height="28" rx="14" />{a("M34 70l-6 10M62 70l6 10", T)}
  </>,
  pest: <>
    <ellipse cx="48" cy="52" rx="16" ry="22" /><path d="M48 30v44M32 44 18 36M64 44l14-8M32 62l-14 8M64 62l14 8" />{dot(48, 24, 6, T)}
  </>,
  tools: <>
    <path d="M30 66 66 30" /><circle cx="70" cy="26" r="10" />{a("M22 74l8-8M26 26l44 44", B)}
  </>,
  // ── More CRM ─────────────────────────────────────────────────────────────────────────────
  email: <>
    <rect x="12" y="22" width="72" height="52" rx="12" /><path d="M14 28l34 24 34-24" />{dot(76, 22, 7, B)}
  </>,
  sms: <>
    <rect x="28" y="12" width="40" height="72" rx="12" />{a("M38 34h20a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H46l-8 6z", T)}
  </>,
  route: <>
    <circle cx="26" cy="70" r="8" /><circle cx="70" cy="26" r="8" />{a("M34 70h20a12 12 0 0 0 0-24H42a12 12 0 0 1 0-24h20", B)}
  </>,
  contract: <>
    <rect x="18" y="14" width="52" height="68" rx="10" /><path d="M30 32h28M30 46h18" />{a("M48 70c6-8 10 4 16-4l12-12", T)}
  </>,
  invoice: <>
    <path d="M22 14h52v68l-9-6-9 6-8-6-8 6-9-6-9 6z" /><path d="M34 34h28M34 48h18" />{dot(60, 62, 6, B)}
  </>,
  money: <>
    <rect x="12" y="26" width="72" height="44" rx="12" /><circle cx="48" cy="48" r="10" stroke={T} />{dot(24, 48, 4, B)}
  </>,
  responsetime: <>
    <circle cx="48" cy="52" r="28" /><path d="M48 36v16l12 8M40 14h16" />{a("M76 30l6-6", T)}
  </>,
  filter: <>
    <path d="M16 20h64L56 50v24l-16 8V50z" />{dot(70, 70, 8, T)}
  </>,
  tag: <>
    <path d="M14 46V20a6 6 0 0 1 6-6h26l36 36-32 32z" />{dot(32, 32, 7, B)}
  </>,
  import: <>
    <rect x="18" y="14" width="60" height="68" rx="12" /><path d="M32 56h32" />{a("M48 24v24M38 38l10 10 10-10", T)}
  </>,
  link: <>
    <rect x="12" y="34" width="38" height="28" rx="14" />{a("M46 34h24a14 14 0 0 1 0 28H46", B)}
  </>,
  growth: <>
    <path d="M16 78h64" />{a("M20 64l18-18 14 12 26-28", T)}<path d="M60 30h18v18" />
  </>,
  brand: <>{loop(22, 18, 2.4, N)}</>,
} satisfies Record<string, ReactNode>;

export type BrandIconName = keyof typeof BRAND_ICONS;
export const BRAND_ICON_NAMES = Object.keys(BRAND_ICONS) as BrandIconName[];

/**
 * Tones put an icon on a brand-coloured tile, like the app icon:
 * - line: no tile (Midnight strokes, blue/teal accents)
 * - navy: Midnight tile, Cloud White strokes, Growth Teal accents
 * - cloud: Cloud White tile, Midnight strokes
 * - blue: Signal Blue tile, white strokes, Cloud White accents
 * - teal: Growth Teal tile, Midnight strokes, white accents
 */
export type BrandTone = "line" | "navy" | "cloud" | "blue" | "teal";
const TONES: Record<Exclude<BrandTone, "line">, { tile: string; vars: Record<string, string> }> = {
  navy: { tile: "bg-[#0F2742]", vars: { "--bi-ink": "#E6F4FF", "--bi-blue": "#3B82F6", "--bi-teal": "#06B6D4" } },
  cloud: { tile: "bg-[#E6F4FF]", vars: { "--bi-ink": "#02336A", "--bi-blue": "#3B82F6", "--bi-teal": "#0891B2" } },
  blue: { tile: "bg-[#3B82F6]", vars: { "--bi-ink": "#ffffff", "--bi-blue": "#E6F4FF", "--bi-teal": "#0F2742" } },
  teal: { tile: "bg-[#06B6D4]", vars: { "--bi-ink": "#0F2742", "--bi-blue": "#ffffff", "--bi-teal": "#E6F4FF" } },
};
export const TONE_CYCLE: BrandTone[] = ["navy", "cloud", "blue", "cloud", "teal", "cloud"];

export function BrandIcon({ name, className, tone = "line" }: { name: BrandIconName; className?: string; tone?: BrandTone }) {
  const size = className?.includes("size-") ? className : cn("size-14", className);
  const svg = (cls?: string) => (
    <svg viewBox="0 0 96 96" aria-hidden className={cls} fill="none" stroke={N} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round">
      {BRAND_ICONS[name]}
    </svg>
  );
  if (tone === "line") return <span className={cn("inline-grid shrink-0 [&>svg]:size-full", size)}>{svg()}</span>;
  const t = TONES[tone];
  return (
    <span aria-hidden className={cn("inline-grid shrink-0 place-items-center rounded-[28%] shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]", t.tile, size)} style={t.vars as React.CSSProperties}>
      {svg("size-[64%]")}
    </span>
  );
}

/** Captions for the icon wall (screen-reader list and tooltips). */
export const BRAND_ICON_LABEL: Record<BrandIconName, string> = {
  home: "New homes", extension: "Extensions", duplex: "Duplexes", bolt: "Electrical", panel: "Switchboards", evcharger: "EV chargers",
  tap: "Plumbing", hotwater: "Hot water", drain: "Drainage", ac: "Air conditioning", heatpump: "Heat pumps", roller: "Painting",
  roof: "Roofing", hammer: "Renovation", leaf: "Landscaping", spray: "Cleaning", lead: "New leads", inbox: "Enquiries", fit: "Fit score",
  intent: "Buying intent", pipeline: "Pipeline", task: "Follow-ups", calendar: "Calendar", booking: "Bookings", client: "Clients",
  repeat: "Repeat work", report: "Reports", source: "Lead sources", discover: "Discover", mappin: "Service areas", notification: "Notifications",
  webhook: "Make.com", city: "Cities", suburb: "Suburbs", county: "Counties", zip: "ZIP & postcodes", us: "United States", au: "Australia",
  nz: "New Zealand", timezone: "Time zones", shield: "Data protection", audit: "Audit log", consent: "Consent", team: "Team", approve: "Approvals",
  export: "Exports", page: "Landing pages", form: "Enquiry forms", spark: "Smart summaries", chat: "Website chat", phone: "Phone calls",
  video: "Video calls", sitevisit: "Site visits", quote: "Quotes", won: "Won jobs", star: "Ideal jobs", brand: "Brexoo",
  kitchen: "Kitchens", bathroom: "Bathrooms", deck: "Decks", fence: "Fencing", flooring: "Flooring", solar: "Solar", window: "Windows",
  gutter: "Gutters", pool: "Pools", concrete: "Concreting", pest: "Pest control", tools: "Maintenance", email: "Email follow-ups",
  sms: "Text messages", route: "Travel routes", contract: "Contracts", invoice: "Invoices", money: "Job value", responsetime: "Response time",
  filter: "Smart filters", tag: "Tags", import: "Imports", link: "Integrations", growth: "Growth",
};
