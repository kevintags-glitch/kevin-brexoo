import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { MarkWatermark } from "@/components/brand/BrandMotif";
import { BRAND_ICON_LABEL, BrandIcon, TONE_CYCLE, type BrandIconName } from "./brand-icons";

const STRIP: BrandIconName[] = ["home", "bolt", "tap", "ac", "hammer", "leaf", "spray", "roof", "lead", "fit", "pipeline", "calendar", "client", "mappin", "shield", "won"];

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/ai", label: "Brex AI" },
      { href: "/managed-services", label: "Managed services" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Industries",
    links: [
      { href: "/industries", label: "All industries" },
      { href: "/builders", label: "Builders & developers" },
      { href: "/trades", label: "Trades & home services" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/resources", label: "Resources" },
      { href: "/demo", label: "Request a demo" },
      { href: "/login", label: "Log in" },
      { href: "/signup", label: "Create an account" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/acceptable-use", label: "Acceptable use" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-surface">
      <MarkWatermark className="absolute -bottom-32 -right-20 h-[420px] text-[#E6F4FF]" />
      <div className="relative mx-auto max-w-[1200px] px-4 pt-12 sm:px-6">
        <ul aria-label="What Brexoo covers" className="flex flex-wrap gap-3">
          {STRIP.map((n, k) => (
            <li key={n}>
              <BrandIcon name={n} tone={TONE_CYCLE[k % TONE_CYCLE.length]} className="size-10" />
              <span className="sr-only">{BRAND_ICON_LABEL[n]}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative mx-auto grid max-w-[1200px] gap-12 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_2fr]">
        <div className="max-w-xs">
          <Logo knockout="var(--surface)" />
          <p className="mt-4 text-[15px] font-medium leading-snug text-ink">The AI Growth Platform for Builders &amp; Home Services.</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-3">Find project leads. Qualify opportunities. Book more jobs.</p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="font-sans text-[13px] font-medium tracking-normal text-ink">{col.title}</h2>
              <ul className="mt-3 grid gap-0.5 sm:gap-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="inline-flex min-h-10 items-center text-sm text-ink-3 transition-colors hover:text-ink sm:min-h-0">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="relative border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 py-6 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Brexoo. All rights reserved.</p>
          <p>Brexoo helps you find and follow up opportunities. It does not guarantee leads, appointments or revenue.</p>
        </div>
      </div>
    </footer>
  );
}
