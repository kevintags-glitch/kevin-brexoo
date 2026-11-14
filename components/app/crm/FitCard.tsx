import { FactorIcon } from "@/components/marketing/mocks";
import { Badge, type Tone } from "@/components/ui";
import type { Confidence, FitResult } from "@/features/crm/fit";

export function fitTone(label: FitResult["label"]): Tone {
  return label === "Strong fit" ? "green" : label === "Possible fit" ? "amber" : label === "Weak fit" ? "red" : "neutral";
}

export function FitCard({ fit, confidence }: { fit: FitResult; confidence: Confidence }) {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[12px] text-ink-3">Fit</p>
          <p className="type-subhead">
            {fit.label}
            {fit.score !== null ? <span className="text-ink-3 tabular"> · {fit.score}</span> : null}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[12px] text-ink-3">Confidence</p>
          <Badge tone={confidence.level === "High" ? "teal" : confidence.level === "Medium" ? "amber" : "neutral"}>{confidence.level}</Badge>
        </div>
      </div>
      <ul className="mt-4 grid gap-2.5">
        {fit.factors.map((f) => (
          <li key={f.key} className="flex items-center gap-3">
            <FactorIcon status={f.status} />
            <div className="min-w-0">
              <p className="text-[13px] font-medium">
                {f.label} <span className="font-normal text-ink-3">· weight {f.weight}</span>
              </p>
              <p className="text-[12px] text-ink-3">{f.detail}</p>
            </div>
          </li>
        ))}
      </ul>
      {fit.missing.length ? (
        <p className="mt-4 rounded-xl bg-amber-soft px-3 py-2.5 text-[13px] text-amber-ink">
          <span className="font-medium">Missing:</span> {fit.missing.join(", ").replace(/[?.]$/, "")}
        </p>
      ) : null}
      <details className="mt-3 text-[12px] text-ink-3">
        <summary className="-my-1 cursor-pointer py-2.5">Why this confidence?</summary>
        <ul className="mt-1.5 grid gap-1 pl-4">
          {confidence.reasons.map((r) => (
            <li key={r} className="list-disc">
              {r}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
