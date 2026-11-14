import { Check, CircleHelp, Minus, Phone } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { brexExample } from "@/features/marketing/brex-example";
import { cn } from "@/lib/cn";
import { BrandIcon } from "./brand-icons";

const STATUS = {
  match: { icon: Check, cls: "bg-[#E4F6EE] text-[#13795B]", word: "Matches" },
  partial: { icon: Minus, cls: "bg-[#FDF3E1] text-[#9A5B06]", word: "Partly" },
  mismatch: { icon: Minus, cls: "bg-[#FDECEA] text-[#B42318]", word: "Doesn't match" },
  unknown: { icon: CircleHelp, cls: "bg-[#EEF2F7] text-[#5F6F86]", word: "Unknown" },
} as const;

/**
 * Brex AI working on a real sample enquiry. Every line below is produced by the product's own
 * functions (fit, intent, summary, next best action, draft) for the Coastline Homes sample lead.
 */
export function BrexAiExample() {
  const ex = brexExample();
  const unknowns = ex.fit.factors.filter((f) => f.status === "unknown");
  const intentLevel = ex.intent.level === "unknown" ? "Not enough evidence" : `${ex.intent.level[0]!.toUpperCase()}${ex.intent.level.slice(1)}`;

  return (
    <div className="overflow-hidden rounded-[28px] border border-line bg-white shadow-xl">
      {/* The record */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-[#F3F9FF] px-5 py-4 sm:px-6">
        <span className="grid size-10 place-items-center rounded-full bg-[#7C5CC4] text-[13px] font-medium text-white" aria-hidden>
          {ex.lead.name.split(" ").map((p) => p[0]).join("")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="type-card leading-tight">{ex.lead.name}</p>
          <p className="truncate text-[13px] text-ink-3">
            {ex.lead.title} · {ex.location} {ex.lead.postcode} · via landing page
          </p>
        </div>
        <span className="rounded-full border border-[#F3C979] bg-[#FDF3E1] px-2.5 py-0.5 text-[11px] font-medium text-[#9A5B06]">Sample record</span>
      </div>
      <blockquote className="border-b border-line px-5 py-4 text-[14px] italic leading-relaxed text-ink-2 sm:px-6">“{ex.lead.message}”</blockquote>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-px bg-line md:grid-cols-2">
        {/* Why it's a match */}
        <section className="bg-white p-5 sm:p-6" aria-label="Fit">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-ink-3">Why it&apos;s a match</p>
            <p className="text-[13px] font-medium text-[#13795B]">
              {ex.fit.label} · {ex.fit.score}/100
            </p>
          </div>
          <ul className="mt-3 grid gap-2">
            {ex.fit.factors.map((f) => {
              const st = STATUS[f.status];
              return (
                <li key={f.key} className="flex items-start gap-2.5 text-[13px]">
                  <span className={cn("mt-px grid size-5 shrink-0 place-items-center rounded-full", st.cls)} title={st.word}>
                    <st.icon className="size-3" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="font-medium text-ink">{f.label}</span> <span className="text-ink-3">· weight {f.weight}</span>
                    <span className="block text-ink-2">{f.detail}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Buying intent */}
        <section className="bg-white p-5 sm:p-6" aria-label="Buying intent">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-ink-3">Buying intent</p>
            <p className="text-[13px] font-medium text-[#2F6FE4]">
              {intentLevel} · <span className="font-normal italic">inferred</span>
            </p>
          </div>
          <ul className="mt-3 grid gap-2">
            {ex.intent.evidence.map((e) => (
              <li key={e.label} className="flex items-center justify-between gap-3 text-[13px] text-ink-2">
                {e.label}
                <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular", e.effect > 0 ? "bg-[#E6F4FF] text-[#2F6FE4]" : "bg-[#FDECEA] text-[#B42318]")}>
                  {e.effect > 0 ? "+" : "−"}
                  {e.weight}
                </span>
              </li>
            ))}
          </ul>
          {unknowns.length ? (
            <div className="mt-4 rounded-xl bg-[#F6F8FB] p-3 text-[13px]">
              <p className="font-medium text-ink">Ask about</p>
              <p className="text-ink-2">{unknowns.map((u) => u.detail.replace(/ not (stated|given)$/i, "").toLowerCase()).join(", ")}: not on the record yet, so Brex AI doesn&apos;t guess.</p>
            </div>
          ) : null}
        </section>
      </div>

      {/* Brex AI */}
      <section className="border-t border-line bg-[#0F2742] p-5 text-white sm:p-6" aria-label="Brex AI">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-[30%] bg-white/10">
            <LogoMark className="size-4" color="#ffffff" />
          </span>
          <p className="text-[14px] font-medium">Brex AI</p>
          <span className="text-[12px] text-white/55">reads this record only</span>
        </div>
        <ul className="mt-4 grid gap-2">
          {ex.summary.map((s) => (
            <li key={s.text} className="break-words text-[14px] leading-relaxed text-white/85">
              {s.text} {s.cite ? <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[11px] text-[#5FD4EA]">{s.cite}</span> : null}
            </li>
          ))}
        </ul>
        <div className="mt-5 rounded-2xl bg-white p-4 text-[#0F2742]">
          <p className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.12em] text-[#0E7490]">
            <BrandIcon name="spark" tone="teal" className="size-6" /> Recommended next action
          </p>
          <p className="mt-2 text-[15px] font-medium">{ex.next.text.replace(/^Next best action:\s*/, "")}</p>
          {ex.draft ? (
            <div className="mt-3 rounded-xl border border-line bg-[#F3F9FF] p-3">
              <p className="flex items-center gap-1.5 text-[12px] font-medium text-ink-3">
                <Phone className="size-3.5" aria-hidden /> Draft {ex.draft.channel === "phone" ? "call script" : "email"} · waiting for your approval
              </p>
              <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-ink-2">{ex.draft.body}</pre>
              <div className="mt-3 flex flex-wrap gap-2" aria-hidden>
                <span className="rounded-lg bg-[#0F2742] px-3 py-1.5 text-[12px] font-medium text-white">Approve</span>
                <span className="rounded-lg border border-line bg-white px-3 py-1.5 text-[12px] font-medium text-ink-2">Edit</span>
                <span className="rounded-lg border border-line bg-white px-3 py-1.5 text-[12px] font-medium text-ink-2">Book site visit</span>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
