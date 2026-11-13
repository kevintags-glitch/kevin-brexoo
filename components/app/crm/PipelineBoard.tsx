"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { moveStage } from "@/features/crm/actions";
import { LOSS_REASONS, STAGES, type LossReason, type Stage } from "@/features/crm/stages";
import { Avatar, Badge, Button, Field, Notice, Select, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { Dialog } from "./widgets";

export type BoardCard = { id: string; title: string; contact: string; location: string | null; stage: Stage; value_minor: number | null; currency: string; owner: string | null; ageDays: number; fitLabel: string };

/**
 * Pipeline board (§9.4). Drag a card between columns, or use its "Move to" menu: the menu is the
 * keyboard and screen-reader path, and moving to Lost always asks for a reason.
 */
export function PipelineBoard({ cards, currency }: { cards: BoardCard[]; currency: string }) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useOptimistic(cards, (state, m: { id: string; stage: Stage }) => state.map((c) => (c.id === m.id ? { ...c, stage: m.stage } : c)));
  const [, start] = useTransition();
  const [over, setOver] = useState<Stage | null>(null);
  const [lost, setLost] = useState<{ id: string } | null>(null);
  const [reason, setReason] = useState<LossReason | "">("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const move = (id: string, stage: Stage, lossReason?: LossReason, lossNote?: string) => {
    const card = optimistic.find((c) => c.id === id);
    if (!card || card.stage === stage) return;
    if (stage === "lost" && !lossReason) {
      setLost({ id });
      return;
    }
    setError(null);
    start(async () => {
      setOptimistic({ id, stage });
      const r = await moveStage(id, stage, lossReason ?? null, lossNote);
      if (r.error) setError(r.error);
      router.refresh();
    });
  };

  return (
    <>
      {error ? <Notice tone="red" className="mb-4">{error}</Notice> : null}
      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8">
        <div className="grid auto-cols-[minmax(272px,1fr)] grid-flow-col gap-3">
          {STAGES.map((s) => {
            const col = optimistic.filter((c) => c.stage === s.id);
            const total = col.reduce((sum, c) => sum + (c.value_minor ?? 0), 0);
            return (
              <section
                key={s.id}
                aria-label={`${s.label}, ${col.length} opportunities`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(s.id);
                }}
                onDragLeave={() => setOver((cur) => (cur === s.id ? null : cur))}
                onDrop={(e) => {
                  e.preventDefault();
                  setOver(null);
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) move(id, s.id);
                }}
                className={cn("relative flex min-h-[420px] flex-col rounded-2xl bg-surface-2/60 p-2 transition-colors duration-150", over === s.id && "bg-blue-soft ring-2 ring-blue/40")}
              >
                <header className="flex items-center justify-between gap-2 px-2 pb-2 pt-1">
                  <div className="flex items-center gap-2">
                    <Badge tone={s.tone} dot>
                      {s.label}
                    </Badge>
                    <span className="text-[12px] tabular text-ink-3">{col.length}</span>
                  </div>
                  {total ? <span className="text-[12px] tabular text-ink-3">{formatMoney(total, currency, { compact: true })}</span> : null}
                </header>
                <p className="px-2 pb-2 text-[11px] leading-snug text-ink-3">{s.meaning}</p>
                <ul className="grid content-start gap-2">
                  {col.map((c) => (
                    <li
                      key={c.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", c.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      className="group relative cursor-grab rounded-xl border border-line bg-surface p-3 shadow-xs transition-shadow hover:shadow-sm active:cursor-grabbing"
                    >
                      <Link href={`/app/opportunities/${c.id}`} className="block text-[14px] font-medium leading-snug hover:text-blue">
                        {c.contact}
                      </Link>
                      <p className="mt-0.5 truncate text-[12px] text-ink-3">
                        {c.title}
                        {c.location ? ` · ${c.location}` : ""}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        {c.owner ? <Avatar name={c.owner} className="size-6 text-[10px]" /> : <span className="text-[11px] text-ink-3">Unassigned</span>}
                        <span className="text-[11px] text-ink-3">{c.ageDays === 0 ? "today" : `${c.ageDays}d`}</span>
                        <span className="ml-auto text-[12px] font-medium tabular">{c.value_minor ? formatMoney(c.value_minor, c.currency, { compact: true }) : ""}</span>
                      </div>
                      <label className="sr-only" htmlFor={`move-${c.id}`}>
                        Move {c.contact} to stage
                      </label>
                      <select
                        id={`move-${c.id}`}
                        value={c.stage}
                        onChange={(e) => move(c.id, e.target.value as Stage)}
                        className="mt-2 h-8 w-full rounded-lg border border-line bg-surface px-2 text-[12px] text-ink-2 opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100 max-md:opacity-100"
                      >
                        {STAGES.map((x) => (
                          <option key={x.id} value={x.id}>
                            Move to: {x.label}
                          </option>
                        ))}
                      </select>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
      <Dialog open={Boolean(lost)} onClose={() => setLost(null)} title="Close as lost">
        <div className="grid gap-4">
          <Field label="Reason" htmlFor="b_loss">
            <Select id="b_loss" value={reason} onChange={(e) => setReason(e.target.value as LossReason)}>
              <option value="">Choose a reason</option>
              {LOSS_REASONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Note" htmlFor="b_note" optional>
            <Textarea id="b_note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setLost(null)}>
              Cancel
            </Button>
            <Button
              disabled={!reason}
              onClick={() => {
                if (lost && reason) move(lost.id, "lost", reason, note);
                setLost(null);
                setReason("");
                setNote("");
              }}
            >
              Close as lost
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
