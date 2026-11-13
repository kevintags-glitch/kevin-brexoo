"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/app/settings", label: "Business" },
  { href: "/app/settings/team", label: "Team" },
  { href: "/app/settings/plan", label: "Plan & usage" },
  { href: "/app/settings/integrations", label: "Integrations" },
  { href: "/app/settings/audit", label: "Audit log" },
];

export function SettingsNav() {
  const p = usePathname();
  return (
    <nav aria-label="Settings" className="-mx-1 mb-8 flex gap-1 overflow-x-auto border-b border-line px-1 scrollbar-none">
      {ITEMS.map((i) => (
        <Link key={i.href} href={i.href} aria-current={p === i.href ? "page" : undefined} className={cn("-mb-px shrink-0 border-b-2 px-3 py-2.5 text-[14px]", p === i.href ? "border-blue font-medium text-ink" : "border-transparent text-ink-3 hover:text-ink")}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
