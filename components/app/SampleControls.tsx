"use client";
import { useState, useTransition } from "react";
import { FlaskConical, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui";
import { clearSampleData, loadSampleData, type SampleState } from "@/features/samples/actions";

/** Shown on an empty dashboard: fill the workspace with the same examples the website uses. */
export function ExploreSamples({ businessName, industry, isOwner }: { businessName: string; industry: string; isOwner: boolean }) {
  const [state, setState] = useState<SampleState>({});
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-blue/40 bg-blue-soft/40 p-5 sm:flex-row sm:items-center">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-blue shadow-xs">
        <Sparkles className="size-5" aria-hidden />
      </span>
      <div className="flex-1">
        <p className="text-[15px] font-semibold">Explore Brexoo with sample data</p>
        <p className="text-[13px] text-ink-3">
          Load the {industry.toLowerCase()} example from our website ({businessName}): leads, a booked visit, a won client and projects to discover. Remove it any time.
        </p>
        {state.error ? <p className="mt-1 text-[13px] text-red-ink" role="alert">{state.error}</p> : null}
      </div>
      {isOwner ? (
        <Button pending={pending} onClick={() => start(async () => setState(await loadSampleData()))}>
          Load sample data
        </Button>
      ) : (
        <p className="text-[13px] text-ink-3">Ask an owner to load it.</p>
      )}
    </div>
  );
}

/** Persistent banner while sample records are in the workspace. */
export function SampleBanner({ count, isOwner }: { count: number; isOwner: boolean }) {
  const [state, setState] = useState<SampleState>({});
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-ink/20 bg-amber-soft px-4 py-2.5 text-[13px] text-amber-ink" role="status">
      <FlaskConical className="size-4 shrink-0" aria-hidden />
      <span className="flex-1">
        You&apos;re viewing <strong className="font-semibold">{count} sample leads</strong>. They&apos;re examples, not real customers, and are never sent to integrations.
      </span>
      {state.error ? <span className="text-red-ink">{state.error}</span> : null}
      {isOwner ? (
        <Button size="sm" variant="secondary" pending={pending} onClick={() => start(async () => setState(await clearSampleData()))}>
          <X className="size-3.5" aria-hidden /> Clear sample data
        </Button>
      ) : null}
    </div>
  );
}
