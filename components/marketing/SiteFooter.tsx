import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/ai", label: "Brexoo AI" },
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
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-[1200px] gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.2fr_2fr]">
        <div className="max-w-xs">
          <Logo knockout="var(--surface)" />
          <p className="mt-4 text-[15px] font-semibold leading-snug text-ink">The AI Growth Platform for Builders &amp; Home Services.</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-3">Find project leads. Qualify opportunities. Book more jobs.</p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="font-sans text-[13px] font-semibold tracking-normal text-ink">{col.title}</h2>
              <ul className="mt-3 grid gap-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-ink-3 transition-colors hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 py-6 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Brexoo. All rights reserved.</p>
          <p>Brexoo helps you find and follow up opportunities. It does not guarantee leads, appointments or revenue.</p>
        </div>
      </div>
    </footer>
  );
}
