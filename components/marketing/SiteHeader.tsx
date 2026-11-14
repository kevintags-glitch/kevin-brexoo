"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu as MenuIcon, X } from "lucide-react";
import { TRADES } from "@/config/trades";
import { Illustration, type IllustrationName } from "./illustrations";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui";
import { cn } from "@/lib/cn";

export const NAV = [
  { href: "/how-it-works", label: "Product" },
  { href: "/industries", label: "Industries" },
  { href: "/pricing", label: "Pricing" },
  { href: "/resources", label: "Resources" },
];

const PRODUCT_MENU: { href: string; label: string; body: string; icon: IllustrationName }[] = [
  { href: "/how-it-works", label: "How it works", body: "From first enquiry to won work", icon: "magnifier" },
  { href: "/ai", label: "Brex AI", body: "Summaries, intent and drafts", icon: "spark" },
  { href: "/#calendar", label: "Calendar & bookings", body: "Visitors request, you confirm", icon: "calendar" },
  { href: "/managed-services", label: "Managed services", body: "People who qualify for you", icon: "chat" },
];

function Menu({ label, active, children }: { label: string; active: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={cn("type-nav flex items-center gap-1 rounded-lg px-3 py-2 transition-colors hover:text-white", active ? "text-[#5FD4EA]" : "text-white/85")}>
        {label}
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 pt-2" onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
          <div className="rounded-2xl border border-line bg-white p-2 shadow-lg">{children}</div>
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({ href, label, body, icon }: { href: string; label: string; body?: string; icon: IllustrationName }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-surface-2">
      <Illustration name={icon} className="size-9 shrink-0" />
      <span>
        <span className="block text-[14px] font-medium text-ink">{label}</span>
        {body ? <span className="block text-[13px] text-ink-3">{body}</span> : null}
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [pastFilm, setPastFilm] = useState(false);
  const [open, setOpen] = useState(false);
  // On the home page the first screen is the film alone: the bar stays out of the way until the
  // visitor scrolls past it (or tabs into it).
  const home = pathname === "/";

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      setPastFilm(window.scrollY > window.innerHeight * 0.85);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  const hidden = home && !pastFilm && !open;

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
      data-hidden={hidden || undefined}
      className={cn(
        "top-0 z-50 border-b border-white/10 bg-[#0F2742] text-white transition-[transform,box-shadow] duration-300 ease-out",
        home ? "fixed inset-x-0" : "sticky",
        hidden ? "-translate-y-full focus-within:translate-y-0" : "translate-y-0",
        scrolled || open ? "shadow-[0_6px_24px_rgb(15_39_66/0.25)]" : "",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-8 px-4 sm:px-6">
        <Link href="/" className="rounded-lg" aria-label="Brexoo home">
          <Logo tone="white" />
        </Link>
        <nav aria-label="Main" className="hidden flex-1 items-center gap-1 md:flex">
          <Menu label="Product" active={["/how-it-works", "/ai", "/managed-services"].includes(pathname)}>
            <div className="grid w-[300px] gap-0.5">
              {PRODUCT_MENU.map((m) => (
                <MenuItem key={m.href} {...m} />
              ))}
            </div>
          </Menu>
          <Menu label="Industries" active={pathname.startsWith("/leads") || ["/industries", "/builders", "/trades"].includes(pathname)}>
            <div className="grid w-[540px] grid-cols-2 gap-0.5">
              {TRADES.map((t) => (
                <MenuItem key={t.slug} href={`/leads/${t.slug}`} label={t.name} icon={t.illustration} />
              ))}
            </div>
            <Link href="/industries" className="mt-1 flex items-center justify-between rounded-xl border-t border-line px-3 pb-1.5 pt-3 text-[13px] font-medium text-blue hover:underline">
              All industries and service templates <span aria-hidden>→</span>
            </Link>
          </Menu>
          {NAV.slice(2).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className="type-nav rounded-lg px-3 py-2 text-white/85 transition-colors hover:text-white aria-[current=page]:text-[#5FD4EA]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          <Link href="/login" className="type-button inline-flex h-9 items-center rounded-lg border border-white/40 px-4 text-white transition-colors hover:border-white hover:bg-white/10">
            Log in
          </Link>
          <ButtonLink href="/demo" variant="inverse" size="sm" className="px-4 font-medium">
            Request a Demo
          </ButtonLink>
        </div>
        <button
          type="button"
          className="pressable -mr-2 ml-auto grid size-11 place-items-center rounded-lg text-white md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <MenuIcon className="size-5" />}
        </button>
      </div>
      <div
        id="mobile-nav"
        hidden={!open}
        className="h-[calc(100dvh-4rem)] overflow-y-auto border-t border-white/10 bg-white text-ink px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden"
      >
        <nav aria-label="Mobile" className="grid" onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="type-subhead border-b border-line py-4 text-ink">
              {item.label}
            </Link>
          ))}
          <Link href="/ai" className="type-subhead border-b border-line py-4 text-ink">
            Brex AI
          </Link>
          <p className="pt-5 text-[12px] font-medium uppercase tracking-[0.12em] text-ink-3">Industries</p>
          <div className="grid grid-cols-2 gap-1 py-2">
            {TRADES.map((t) => (
              <Link key={t.slug} href={`/leads/${t.slug}`} className="type-body flex items-center gap-2 rounded-lg py-2 text-ink-2">
                <Illustration name={t.illustration} className="size-7" />
                {t.name}
              </Link>
            ))}
          </div>
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
