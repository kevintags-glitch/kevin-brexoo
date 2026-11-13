/**
 * Dashboard building blocks: stat cards with period-over-period deltas, nested "card in card"
 * panels, status pills, avatar stacks and pagination. Server-safe (no client hooks).
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDown, ArrowRight, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/cn";

/** Outer tinted frame with an inner white panel, as in the reference dashboards. */
export function Panel({ className, inner, children }: { className?: string; inner?: string; children: ReactNode }) {
  return (
    <section className={cn("rounded-[20px] border border-line bg-surface-2/70 p-1.5", className)}>
      <div className={cn("h-full rounded-[15px] border border-line bg-surface shadow-xs", inner)}>{children}</div>
    </section>
  );
}

export function PanelHeader({ eyebrow, title, badge, icon, action, className }: { eyebrow: string; title?: ReactNode; badge?: ReactNode; icon?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-4", className)}>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">{eyebrow}</p>
        {title !== undefined ? (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="font-display text-[24px] font-medium leading-none tracking-tight tabular">{title}</span>
            {badge}
          </div>
        ) : null}
      </div>
      {action ?? (icon ? <IconTile>{icon}</IconTile> : null)}
    </div>
  );
}

export function IconTile({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-xl [&_svg]:size-[18px]",
        tone === "dark" ? "bg-[#0b2347] text-white" : "border border-line bg-surface text-teal-ink shadow-xs",
      )}
    >
      {children}
    </span>
  );
}

/** Percentage change pill. `invert` for metrics where down is good (e.g. response time). */
export function Delta({ current, previous, invert, className }: { current: number; previous: number; invert?: boolean; className?: string }) {
  if (!previous && !current) return <span className={cn("rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-3", className)}>—</span>;
  if (!previous) return <span className={cn("rounded-full bg-green-soft px-2 py-0.5 text-[11px] font-medium text-green-ink", className)}>New</span>;
  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  const good = invert ? !up : up;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[11px] font-semibold tabular",
        good ? "border-green-ink/20 bg-green-soft text-green-ink" : "border-red-ink/20 bg-red-soft text-red-ink",
        className,
      )}
      title={`${up ? "Up" : "Down"} ${Math.abs(pct).toFixed(1)}% on the previous period`}
    >
      <Icon className="size-3" strokeWidth={2.5} aria-hidden />
      {Math.abs(pct).toFixed(1)}%<span className="sr-only"> {up ? "increase" : "decrease"}</span>
    </span>
  );
}

export function StatCard({
  label,
  value,
  current,
  previous,
  invert,
  icon,
  footer,
  href,
}: {
  label: string;
  value: ReactNode;
  current: number;
  previous: number;
  invert?: boolean;
  icon: ReactNode;
  footer: ReactNode;
  href: string;
}) {
  return (
    <section className="rounded-[20px] border border-line bg-surface-2/70 p-1.5">
      <div className="flex items-start justify-between gap-3 rounded-[15px] border border-line bg-surface p-4 shadow-xs">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">{label}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-display text-[26px] font-medium leading-none tracking-tight tabular">{value}</span>
            <Delta current={current} previous={previous} invert={invert} />
          </div>
        </div>
        <IconTile>{icon}</IconTile>
      </div>
      <Link href={href} className="group flex items-center justify-between gap-2 px-3 pb-1.5 pt-2.5 text-[12px] text-ink-3 hover:text-ink">
        <span className="truncate">{footer}</span>
        <ArrowRight className="size-4 shrink-0 text-ink-2 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </section>
  );
}

const PILL: Record<string, string> = {
  green: "bg-green-soft text-green-ink",
  blue: "bg-blue-soft text-blue",
  amber: "bg-amber-soft text-amber-ink",
  red: "bg-red-soft text-red-ink",
  teal: "bg-teal-soft text-teal-ink",
  violet: "bg-violet-soft text-violet-ink",
  neutral: "bg-surface-2 text-ink-2",
};

export function StatusPill({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12px] font-medium", PILL[tone] ?? PILL.neutral)}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function AvatarStack({ names, max = 3, extra }: { names: string[]; max?: number; extra?: number }) {
  const shown = names.slice(0, max);
  const more = (extra ?? 0) + Math.max(0, names.length - max);
  return (
    <span className="flex items-center">
      {shown.map((n, i) => (
        <Avatar key={`${n}-${i}`} name={n} className={cn("size-7 ring-2 ring-surface", i > 0 && "-ml-2")} />
      ))}
      {more > 0 ? <span className="-ml-2 grid size-7 place-items-center rounded-full bg-surface-2 text-[10px] font-semibold text-ink-2 ring-2 ring-surface">+{more}</span> : null}
    </span>
  );
}

/** Numbered pagination with ellipses, driven by the `page` search param. */
export function Pagination({ page, pageSize, total, hrefFor, noun }: { page: number; pageSize: number; total: number; hrefFor: (p: number) => string; noun: string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(total, page * pageSize);
  const nums: (number | "…")[] = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1) nums.push(p);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  const btn = "grid size-9 place-items-center rounded-full text-[13px] font-medium tabular transition-colors";
  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 px-5 py-4 sm:flex-row">
      <p className="text-[13px] text-ink-3">
        Showing {from.toLocaleString("en-AU")} to {to.toLocaleString("en-AU")} of {total.toLocaleString("en-AU")} {noun}
      </p>
      <ul className="flex items-center gap-1.5">
        <li>
          {page > 1 ? (
            <Link href={hrefFor(page - 1)} className={cn(btn, "text-ink-2 hover:bg-surface-2")} aria-label="Previous page">
              <ChevronLeft className="size-4" />
            </Link>
          ) : (
            <span className={cn(btn, "text-ink-3/50")} aria-hidden>
              <ChevronLeft className="size-4" />
            </span>
          )}
        </li>
        {nums.map((n, i) => (
          <li key={i}>
            {n === "…" ? (
              <span className={cn(btn, "text-ink-3")}>…</span>
            ) : (
              <Link href={hrefFor(n)} aria-current={n === page ? "page" : undefined} className={cn(btn, n === page ? "bg-[#0b2347] text-white dark:bg-blue dark:text-on-blue" : "bg-surface text-ink-2 shadow-xs ring-1 ring-line hover:bg-surface-2")}>
                {n}
              </Link>
            )}
          </li>
        ))}
        <li>
          {page < pages ? (
            <Link href={hrefFor(page + 1)} className={cn(btn, "text-ink-2 hover:bg-surface-2")} aria-label="Next page">
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span className={cn(btn, "text-ink-3/50")} aria-hidden>
              <ChevronRight className="size-4" />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}

/** Table shell: rounded frame, sticky-free header row with muted labels. */
export function DataTable({ head, children, minWidth = 860 }: { head: { label: ReactNode; className?: string }[]; children: ReactNode; minWidth?: number }) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-left text-[14px]" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-line text-[12px] text-ink-3">
            {head.map((h, i) => (
              <th key={i} scope="col" className={cn("px-4 py-3 font-medium first:pl-5 last:pr-5", h.className)}>
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}
