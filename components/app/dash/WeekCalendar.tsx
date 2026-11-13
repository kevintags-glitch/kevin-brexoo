import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/cn";
import { utcToZonedInputs } from "@/lib/format";

type Appt = { id: string; starts_at: string; type: "phone" | "video" | "site_visit"; status: string; opportunity_id: string | null; contact: { full_name: string } | null };
type Task = { id: string; due_at: string | null };
type Req = { requested_start: string | null };

const TYPE = {
  site_visit: { label: "Site visit", cls: "border-l-teal bg-teal-soft text-teal-ink" },
  phone: { label: "Call", cls: "border-l-blue bg-blue-soft text-blue" },
  video: { label: "Video", cls: "border-l-violet-ink bg-violet-soft text-violet-ink" },
} as const;

/** Seven days from today in the business's time zone: bookings, requests and follow-ups due. */
export function WeekCalendar({ appts, tasks, requests, timezone, now }: { appts: Appt[]; tasks: Task[]; requests: Req[]; timezone: string; now: number }) {
  const day = (iso: string) => utcToZonedInputs(iso, timezone).date;
  const days = Array.from({ length: 7 }, (_, i) => {
    const iso = new Date(now + i * 86_400_000).toISOString();
    return { key: day(iso), iso };
  });
  const wd = new Intl.DateTimeFormat("en-AU", { timeZone: timezone, weekday: "short" });
  const dn = new Intl.DateTimeFormat("en-AU", { timeZone: timezone, day: "numeric" });
  const tm = new Intl.DateTimeFormat("en-AU", { timeZone: timezone, hour: "numeric", minute: "2-digit" });
  const live = appts.filter((a) => ["scheduled", "confirmed", "rescheduled"].includes(a.status));

  return (
    <div className="overflow-x-auto">
      <ol className="grid min-w-[760px] grid-cols-7 divide-x divide-line border-t border-line">
        {days.map((d, i) => {
          const items = live.filter((a) => day(a.starts_at) === d.key);
          const due = tasks.filter((t) => t.due_at && day(t.due_at) === d.key).length;
          const asked = requests.filter((r) => r.requested_start && day(r.requested_start) === d.key).length;
          return (
            <li key={d.key} className={cn("flex min-h-[176px] flex-col gap-1.5 p-2.5", i === 0 && "bg-blue-soft/30")}>
              <Link href={`/app/appointments?m=${d.key.slice(0, 7)}&d=${d.key}`} className="mb-1 flex items-baseline gap-1.5 rounded-md px-1 hover:bg-surface-2">
                <span className="text-[11px] font-medium uppercase tracking-wide text-ink-3">{i === 0 ? "Today" : wd.format(new Date(d.iso))}</span>
                <span className={cn("text-[15px] font-medium tabular", i === 0 && "text-blue")}>{dn.format(new Date(d.iso))}</span>
              </Link>
              {items.map((a) => (
                <Link key={a.id} href={a.opportunity_id ? `/app/opportunities/${a.opportunity_id}` : "/app/appointments"} className={cn("rounded-md border-l-[3px] px-2 py-1.5 text-[12px] leading-tight hover:brightness-95", TYPE[a.type].cls)}>
                  <span className="block font-medium tabular">{tm.format(new Date(a.starts_at))}</span>
                  <span className="block truncate">{a.contact?.full_name ?? TYPE[a.type].label}</span>
                </Link>
              ))}
              {asked ? (
                <Link href="/app/appointments" className="flex items-center gap-1 rounded-md border border-dashed border-blue/50 px-2 py-1 text-[11px] font-medium text-blue">
                  <CalendarClock className="size-3" aria-hidden /> {asked} requested
                </Link>
              ) : null}
              {due ? <span className="mt-auto px-1 text-[11px] text-ink-3">{due} follow-up{due > 1 ? "s" : ""} due</span> : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
