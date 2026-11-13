"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui";
import { cn } from "@/lib/cn";

export const NAV = [
  { href: "/how-it-works", label: "Product" },
  { href: "/industries", label: "Industries" },
  { href: "/pricing", label: "Pricing" },
  { href: "/resources", label: "Resources" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the sheet on navigation and on Escape; lock page scroll while it's open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-200",
        scrolled || open ? "border-b border-line bg-canvas/80 backdrop-blur-xl backdrop-saturate-150" : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-8 px-4 sm:px-6">
        <Link href="/" className="rounded-lg" aria-label="Brexoo home">
          <Logo knockout="var(--canvas)" />
        </Link>
        <nav aria-label="Main" className="hidden flex-1 items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink transition-colors hover:text-blue aria-[current=page]:text-blue"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          <ButtonLink href="/login" variant="outline" size="sm" className="px-4 font-semibold">
            Log in
          </ButtonLink>
          <ButtonLink href="/demo" size="sm" className="px-4 font-semibold">
            Request a Demo
          </ButtonLink>
        </div>
        <button
          type="button"
          className="pressable -mr-2 ml-auto grid size-11 place-items-center rounded-lg text-ink md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      <div
        id="mobile-nav"
        hidden={!open}
        className="h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-canvas px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden"
      >
        <nav aria-label="Mobile" className="grid" onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="border-b border-line py-4 font-display text-2xl tracking-tight text-ink">
              {item.label}
            </Link>
          ))}
          <Link href="/ai" className="border-b border-line py-4 font-display text-2xl tracking-tight text-ink">
            Brex AI
          </Link>
        </nav>
        <div className="mt-6 grid gap-3">
          <ButtonLink href="/demo" size="lg">
            Request a Demo
          </ButtonLink>
          <ButtonLink href="/login" variant="secondary" size="lg">
            Log in
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
