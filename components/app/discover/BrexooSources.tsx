"use client";
import { useOptimistic, useTransition } from "react";
import { Radar } from "lucide-react";
import { setPlatformSource } from "@/features/collector/actions";
import { cn } from "@/lib/cn";

export type PlatformSourceRow = {
  key: string;
  name: string;
  kind: string;
  country: string;
  provider: string;
  licence: string;
  attribution_url: string | null;
  enabled: boolean;
  disabled_reason: string | null;
  lastRun: string | null;
  switched_off: boolean;
  records: number;
};

const KIND: Record<string, string> = { planning: "Planning applications", permit: "Building permits", tender: "Public tenders", provider: "Data provider", enquiry: "Enquiries" };
const COUNTRY: Record<string, string> = { AU: "Australia", US: "United States", NZ: "New Zealand" };

/**
 * The official public sources Brexoo collects from on the business's behalf. Matching projects
 * arrive automatically; owners can switch any source off.
 */
export function BrexooSources({ sources, isOwner }: { sources: PlatformSourceRow[]; isOwner: boolean }) {
  const [pending, start] = useTransition();
  const [rows, setRow] = useOptimistic(sources, (cur, next: { key: string; on: boolean }) => cur.map((s) => (s.key === next.key ? { ...s, switched_off: !next.on } : s)));
  const total = rows.reduce((n, s) => n + s.records, 0);
  const on = rows.filter((s) => s.enabled && !s.switched_off).length;

  return (
    <details className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 sm:px-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-[30%] bg-[#0F2742] text-white" aria-hidden>
          <Radar className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium">Brexoo sources</span>
          <span className="block text-[13px] text-ink-3">
            {on} of {rows.length} official public sources on · {total} project{total === 1 ? "" : "s"} matched to your services and areas
          </span>
        </span>
        <span className="text-[13px] font-medium text-blue group-open:hidden">Show</span>
        <span className="hidden text-[13px] font-medium text-blue group-open:inline">Hide</span>
      </summary>
      <ul className="divide-y divide-line border-t border-line">
        {rows.map((s) => {
          const active = s.enabled && !s.switched_off;
          return (
            <li key={s.key} className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium">
                  {s.name} <span className="font-normal text-ink-3">· {KIND[s.kind] ?? s.kind} · {COUNTRY[s.country] ?? s.country}</span>
                </p>
                <p className="text-[12px] text-ink-3">
                  {s.provider} · {s.licence}
                  {s.attribution_url ? (
                    <>
                      {" · "}
                      <a href={s.attribution_url} target="_blank" rel="noreferrer noopener" className="text-blue hover:underline">
                        Source
                      </a>
                    </>
                  ) : null}
                </p>
                <p className="text-[12px] text-ink-3">
                  {s.enabled ? (s.lastRun ? `Updated ${s.lastRun}` : "Waiting for its first update") : `Paused by Brexoo${s.disabled_reason ? `: ${s.disabled_reason}` : ""}`} · {s.records} for you
                </p>
              </div>
              <label className={cn("inline-flex min-h-10 shrink-0 items-center gap-2.5 text-[13px]", (!isOwner || !s.enabled) && "opacity-60")}>
                <input
                  type="checkbox"
                  role="switch"
                  className="peer sr-only"
                  checked={active}
                  disabled={!isOwner || !s.enabled || pending}
                  onChange={(e) => {
                    const next = e.target.checked;
                    start(async () => {
                      setRow({ key: s.key, on: next });
                      await setPlatformSource(s.key, next);
                    });
                  }}
                  aria-label={`${s.name}: ${active ? "on" : "off"}`}
                />
                <span aria-hidden className="relative h-6 w-10 rounded-full bg-line-strong transition-colors peer-checked:bg-blue peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-4" />
                {active ? "On" : "Off"}
              </label>
            </li>
          );
        })}
      </ul>
      <p className="border-t border-line px-4 py-3 text-[12px] text-ink-3 sm:px-5">
        Public registers are collected without personal details, and contacting people found in them for marketing isn&apos;t permitted. Use them to spot work early, then go through tenders, builders or your usual channels.
      </p>
    </details>
  );
}
