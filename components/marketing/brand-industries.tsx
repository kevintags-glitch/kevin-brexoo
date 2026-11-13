import Link from "next/link";
import { Ellipsis, Fan, House, Leaf, PaintRoller, ShowerHead, SprayCan, Zap, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/** The brand guide's industry set ("Built for these industries"). */
export const BRAND_INDUSTRIES: { label: string; icon: LucideIcon; href: string; green?: boolean }[] = [
  { label: "Builders & Developers", icon: House, href: "/builders" },
  { label: "Electricians", icon: Zap, href: "/trades" },
  { label: "Plumbers", icon: ShowerHead, href: "/trades" },
  { label: "Renovation & Remodeling", icon: PaintRoller, href: "/builders" },
  { label: "HVAC", icon: Fan, href: "/trades" },
  { label: "Lawn & Outdoor", icon: Leaf, href: "/trades", green: true },
  { label: "Cleaning Services", icon: SprayCan, href: "/trades" },
  { label: "More Services", icon: Ellipsis, href: "/industries" },
];

export function IndustryTiles({ variant = "strip", className }: { variant?: "strip" | "grid"; className?: string }) {
  return (
    <ul className={cn(variant === "strip" ? "grid grid-cols-4 sm:grid-cols-8" : "grid grid-cols-2 gap-3 sm:grid-cols-4", className)}>
      {BRAND_INDUSTRIES.map(({ label, icon: Icon, href, green }) => (
        <li key={label}>
          <Link
            href={href}
            className={cn(
              "pressable group flex h-full flex-col items-center gap-2 text-center",
              variant === "strip" ? "rounded-xl px-1 py-3 hover:bg-blue-soft/70" : "rounded-2xl border border-line bg-surface px-3 py-6 shadow-xs hover:border-blue/40 hover:shadow-sm",
            )}
          >
            <Icon className={cn(variant === "strip" ? "size-7" : "size-9", green ? "text-[#16a34a]" : "text-blue")} strokeWidth={1.75} aria-hidden />
            <span className={cn("font-medium leading-tight text-ink", variant === "strip" ? "text-[11px] sm:text-[12px]" : "text-[14px]")}>{label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
