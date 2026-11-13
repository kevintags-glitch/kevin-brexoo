"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { askBrex, type BrexReply, type BrexTool } from "@/features/brex-ai/actions";
import { Notice } from "@/components/ui";
import { cn } from "@/lib/cn";

type Turn = { q: string; r?: BrexReply };

const QUICK: { label: string; tool: BrexTool }[] = [
  { label: "What's overdue?", tool: "overdue" },
  { label: "Summarise my pipeline", tool: "pipeline" },
  { label: "Which records are missing information?", tool: "missing" },
  { label: "Show recent enquiries", tool: "recent" },
];

export function BrexChat() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [pending, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth", block: "end" }), [turns]);

  const ask = (q: string, tool?: BrexTool) => {
    if (!q.trim() || pending) return;
    setInput("");
    setTurns((t) => [...t, { q }]);
    start(async () => {
      const r = await askBrex({ question: q, tool });
      setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, r } : x)));
    });
  };

  return (
    <div className="flex min-h-[calc(100dvh-14rem)] flex-col">
      <div className="flex-1 space-y-6" aria-live="polite">
        {turns.length === 0 ? (
          <div className="grid place-items-center py-10 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-blue to-teal text-white shadow-md">
              <Sparkles className="size-6" aria-hidden />
            </span>
            <h2 className="mt-5 text-[24px] font-semibold tracking-tight">Ask Brex AI about your work</h2>
            <p className="mt-2 max-w-md text-[14px] text-ink-3">Brex AI reads your own Brexoo records, read-only, and points to where each answer came from. On any enquiry you can also ask for a summary, a draft reply or a site-visit brief.</p>
            <div className="mt-6 flex max-w-xl flex-wrap justify-center gap-2">
              {QUICK.map((q) => (
                <button key={q.label} type="button" onClick={() => ask(q.label, q.tool)} className="pressable rounded-full border border-line-strong bg-surface px-3.5 py-2 text-[13px] text-ink-2 hover:bg-surface-2">
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {turns.map((t, i) => (
          <div key={i} className="grid gap-3">
            <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-blue px-4 py-2.5 text-[14px] text-on-blue">{t.q}</div>
            <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-line bg-surface p-4 text-[14px] leading-relaxed text-ink-2 shadow-xs">
              {!t.r ? (
                <p className="flex items-center gap-2 text-ink-3">
                  <span className="size-2 animate-pulse rounded-full bg-blue" /> Looking through your records…
                </p>
              ) : (
                <div className="grid gap-1.5">
                  {t.r.error ? <Notice tone="amber">{t.r.error}</Notice> : null}
                  {t.r.segments.map((s, j) => (
                    <p key={j}>
                      {s.text}
                      {s.cite ? <span className="ml-1.5 rounded bg-blue-soft px-1.5 py-0.5 text-[11px] font-medium text-blue">{s.cite}</span> : null}
                    </p>
                  ))}
                  {t.r.links?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {t.r.links.map((l) => (
                        <Link key={l.href} href={l.href} className="rounded-lg border border-line px-2.5 py-1 text-[13px] text-blue hover:bg-surface-2">
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>
      <form
        className="sticky bottom-4 mt-8 flex items-center gap-2 rounded-2xl border border-line bg-surface p-2 shadow-md"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <label htmlFor="brex-input" className="sr-only">
          Ask Brex AI
        </label>
        <input id="brex-input" value={input} onChange={(e) => setInput(e.target.value)} maxLength={500} placeholder="Ask about overdue tasks, your pipeline, missing details…" className="h-11 min-w-0 flex-1 bg-transparent px-3 text-[15px] outline-none placeholder:text-ink-3" autoComplete="off" />
        <button type="submit" disabled={!input.trim() || pending} className={cn("pressable grid size-10 place-items-center rounded-xl bg-blue text-on-blue disabled:opacity-40")} aria-label="Ask">
          <ArrowUp className="size-5" />
        </button>
      </form>
      <p className="mt-2 text-center text-[12px] text-ink-3">Brex AI can't send, book, change or delete anything.</p>
    </div>
  );
}
