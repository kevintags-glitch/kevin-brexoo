import { Gauge, Minus, Plus } from "lucide-react";
import { INTENT_LABEL, type Intent } from "@/features/crm/intent";
import { cn } from "@/lib/cn";

const TONE = { high: "text-green-ink bg-green-soft", medium: "text-amber-ink bg-amber-soft", low: "text-ink-2 bg-surface-2", unknown: "text-ink-3 bg-surface-2" } as const;

/** Buying intent with the evidence behind it. Always labelled as inferred. */
export function IntentCard({ intent }: { intent: Intent }) {
  return (
    <div className="mt-5 border-t border-line pt-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[14px] font-semibold">
          <Gauge className="size-4 text-ink-3" aria-hidden /> Buying intent
        </p>
        <span className={cn("rounded-full px-2.5 py-1 text-[12px] font-medium", TONE[intent.level])}>{INTENT_LABEL[intent.level]}</span>
      </div>
      <p className="mt-1 text-[12px] text-ink-3">Inferred from the record. A prediction, not something the customer told you.</p>
      {intent.evidence.length ? (
        <ul className="mt-3 grid gap-1.5">
          {intent.evidence.map((e) => (
            <li key={e.label} className="flex items-center gap-2 text-[13px] text-ink-2">
              {e.effect > 0 ? <Plus className="size-3.5 text-green-ink" aria-label="Raises intent" /> : <Minus className="size-3.5 text-ink-3" aria-label="Lowers intent" />}
              {e.label}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[13px] text-ink-3">No evidence recorded yet.</p>
      )}
    </div>
  );
}
