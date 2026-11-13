"use client";
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

export type PickedTime = { start: string; type: "phone" | "video" | "site_visit" } | null;
const TYPE_LABEL = { phone: "Phone call", video: "Video call", site_visit: "Site visit" } as const;

/**
 * Lets a visitor ask for a time from the business's free slots (in the business's time zone).
 * "Not sure" is the default; nothing is booked until the business confirms.
 */
export function TimePicker({ slots, timezone, minutes, types, value, onChange, day, setDay }: { slots: string[]; timezone: string; minutes: number; types: string[]; value: PickedTime; onChange: (v: PickedTime) => void; day: string | null; setDay: (d: string) => void }) {
  const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" });
  const dayLabel = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short", day: "numeric", month: "short" });
  const timeLabel = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "numeric", minute: "2-digit" });
  const byDay = new Map<string, string[]>();
  for (const s of slots) {
    const k = dayKey.format(new Date(s));
    byDay.set(k, [...(byDay.get(k) ?? []), s]);
  }
  const days = [...byDay.keys()].slice(0, 10);
  const active = day && byDay.has(day) ? day : days[0];
  const allowed = (["site_visit", "phone", "video"] as const).filter((t) => types.includes(t));
  const [chosenType, setChosenType] = useState<"phone" | "video" | "site_visit">(value?.type ?? allowed[0] ?? "phone");
  const type = value?.type ?? chosenType;
  const pickType = (t: typeof chosenType) => {
    setChosenType(t);
    if (value) onChange({ ...value, type: t });
  };

  return (
    <div className="grid gap-4">
      <fieldset>
        <legend className="text-[13px] font-medium text-ink-2">Type of appointment</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {allowed.map((t) => (
            <button key={t} type="button" aria-pressed={type === t} onClick={() => pickType(t)} className={cn("min-h-10 rounded-full border px-4 text-[14px]", type === t ? "border-blue bg-blue-soft font-medium text-blue" : "border-line-strong text-ink-2")}>
              {TYPE_LABEL[t]} · {minutes} min
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <p className="text-[13px] font-medium text-ink-2" id="days-label">
          Pick a day
        </p>
        <div role="group" aria-labelledby="days-label" className="scrollbar-none -mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
          {days.map((d) => {
            const [wd, ...rest] = dayLabel.format(new Date(byDay.get(d)![0]!)).replace(",", "").split(" ");
            return (
              <button key={d} type="button" aria-pressed={d === active} onClick={() => setDay(d)} className={cn("grid min-w-[64px] shrink-0 place-items-center rounded-xl border px-2 py-2 text-center", d === active ? "border-blue bg-blue text-white" : "border-line-strong text-ink-2 hover:border-ink-3")}>
                <span className="text-[11px] uppercase tracking-wide opacity-80">{wd}</span>
                <span className="text-[15px] font-semibold tabular">{rest.reverse().join(" ")}</span>
              </button>
            );
          })}
        </div>
      </div>
      {active ? (
        <div role="group" aria-label="Available times" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {byDay.get(active)!.map((s) => (
            <button key={s} type="button" aria-pressed={value?.start === s} onClick={() => onChange({ start: s, type })} className={cn("h-10 rounded-lg border text-[14px] tabular", value?.start === s ? "border-blue bg-blue font-semibold text-white" : "border-line text-ink-2 hover:border-blue/50")}>
              {timeLabel.format(new Date(s))}
            </button>
          ))}
        </div>
      ) : null}
      <button type="button" aria-pressed={!value} onClick={() => onChange(null)} className={cn("flex min-h-10 items-center gap-2 rounded-xl border px-4 text-left text-[14px]", !value ? "border-blue bg-blue-soft font-medium text-blue" : "border-line-strong text-ink-2")}>
        <CalendarDays className="size-4" aria-hidden /> Not sure yet — please contact me
      </button>
      <p className="text-[12px] text-ink-3">Times are in {timezone.replace("_", " ")}. This is a request: the business will confirm it with you.</p>
    </div>
  );
}
