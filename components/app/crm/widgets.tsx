"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Ban, Check, Copy, PhoneCall, Plus, Sparkles } from "lucide-react";
import {
  addNote,
  addTask,
  assignOwner,
  bookAppointment,
  logContactAttempt,
  moveStage,
  recordQualification,
  setDoNotContact,
  setTaskStatus,
  setValue,
  updateAppointment,
  type ActionResult,
} from "@/features/crm/actions";
import { APPT_STATUS, APPT_TYPE_LABEL, LOSS_REASONS, STAGES, type LossReason, type Stage } from "@/features/crm/stages";
import { askBrex, type BrexReply, type BrexTool } from "@/features/brex-ai/actions";
import { Badge, Button, Checkbox, Field, Input, Notice, Select, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDateTime, formatRelative, utcToZonedInputs } from "@/lib/format";

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult>({});
  const run = (fn: () => Promise<ActionResult>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      setResult(r);
      if (r.ok) {
        after?.();
        router.refresh();
      }
    });
  return { pending, result, run, setResult };
}

/* Dialog (native <dialog>: focus trap, Escape and backdrop for free) ------------------------------ */
export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(480px,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-0 text-ink shadow-lg backdrop:bg-black/30 backdrop:backdrop-blur-[2px] open:animate-[fade-up_200ms_var(--ease-out)]"
    >
      <div className="p-6">
        <h2 className="font-sans text-[17px] font-semibold tracking-normal">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </dialog>
  );
}

/* Stage ------------------------------------------------------------------------------------------ */
export function StageControl({ oppId, stage, lossReason }: { oppId: string; stage: Stage; lossReason?: LossReason | null }) {
  const { pending, result, run } = useAction();
  const [lostOpen, setLostOpen] = useState(false);
  const [reason, setReason] = useState<LossReason | "">(lossReason ?? "");
  const [note, setNote] = useState("");
  return (
    <div>
      <label htmlFor="stage" className="sr-only">
        Stage
      </label>
      <Select
        id="stage"
        value={stage}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as Stage;
          if (next === "lost") setLostOpen(true);
          else run(() => moveStage(oppId, next));
        }}
      >
        {STAGES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </Select>
      {result.error ? <p className="mt-1 text-[12px] text-red-ink">{result.error}</p> : null}
      <Dialog open={lostOpen} onClose={() => setLostOpen(false)} title="Close as lost">
        <div className="grid gap-4">
          <Field label="Reason" htmlFor="loss_reason">
            <Select id="loss_reason" value={reason} onChange={(e) => setReason(e.target.value as LossReason)}>
              <option value="">Choose a reason</option>
              {LOSS_REASONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Note" htmlFor="loss_note" optional>
            <Textarea id="loss_note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setLostOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!reason} pending={pending} onClick={() => run(() => moveStage(oppId, "lost", reason as LossReason, note), () => setLostOpen(false))}>
              Close as lost
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export function OwnerSelect({ oppId, ownerId, members }: { oppId: string; ownerId: string | null; members: { id: string; name: string }[] }) {
  const { pending, result, run } = useAction();
  return (
    <div>
      <label htmlFor="owner" className="sr-only">
        Owner
      </label>
      <Select id="owner" value={ownerId ?? ""} disabled={pending} onChange={(e) => run(() => assignOwner(oppId, e.target.value || null))}>
        <option value="">Unassigned</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </Select>
      {result.error ? <p className="mt-1 text-[12px] text-red-ink">{result.error}</p> : null}
    </div>
  );
}

export function ValueInput({ oppId, valueMinor, currency }: { oppId: string; valueMinor: number | null; currency: string }) {
  const { pending, result, run } = useAction();
  const [v, setV] = useState(valueMinor != null ? String(valueMinor / 100) : "");
  const initial = valueMinor != null ? String(valueMinor / 100) : "";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (v !== initial) run(() => setValue(oppId, v));
      }}
    >
      <label htmlFor="value" className="sr-only">
        Value
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-ink-3">{currency}</span>
        <Input id="value" inputMode="decimal" placeholder="Not entered" className="pl-12 tabular" value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v !== initial && run(() => setValue(oppId, v))} disabled={pending} />
      </div>
      {result.fieldErrors?.value ? <p className="mt-1 text-[12px] text-red-ink">{result.fieldErrors.value}</p> : null}
    </form>
  );
}

/* Do not contact ------------------------------------------------------------------------------- */
export function DoNotContact({ contactId, value, note }: { contactId: string; value: boolean; note: string | null }) {
  const { pending, run } = useAction();
  const [open, setOpen] = useState(false);
  const [n, setN] = useState("");
  if (value)
    return (
      <div className="rounded-xl bg-red-soft p-3 text-[13px] text-red-ink">
        <p className="flex items-center gap-2 font-semibold">
          <Ban className="size-4" aria-hidden /> Do not contact
        </p>
        {note ? <p className="mt-1 opacity-90">{note}</p> : null}
        <button type="button" className="mt-2 text-[12px] underline underline-offset-2" disabled={pending} onClick={() => run(() => setDoNotContact(contactId, false))}>
          Remove restriction
        </button>
      </div>
    );
  return (
    <>
      <Button variant="ghost" size="sm" className="-ml-2 justify-self-start text-ink-3" onClick={() => setOpen(true)}>
        <Ban className="size-4" aria-hidden /> Mark do not contact
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Mark as do not contact?">
        <p className="text-[14px] text-ink-2">Brexoo will block outreach drafts and contact logging for this person. The record is kept so they aren't contacted again.</p>
        <Field label="Reason" htmlFor="dnc_note" optional className="mt-4">
          <Input id="dnc_note" value={n} onChange={(e) => setN(e.target.value)} placeholder="e.g. Asked not to be contacted" />
        </Field>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" pending={pending} onClick={() => run(() => setDoNotContact(contactId, true, n), () => setOpen(false))}>
            Mark do not contact
          </Button>
        </div>
      </Dialog>
    </>
  );
}

/* Qualification -------------------------------------------------------------------------------- */
export function QualificationPanel({
  enquiryId,
  questions,
  answers,
}: {
  enquiryId: string;
  questions: { key: string; label: string; kind: string; options: string[]; required: boolean }[];
  answers: Record<string, string>;
}) {
  const { pending, result, run } = useAction();
  const [a, setA] = useState<Record<string, string>>(answers);
  const [reason, setReason] = useState("");
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {questions.map((q) => (
          <Field key={q.key} label={q.label} htmlFor={`qa-${q.key}`} optional={!q.required}>
            {q.kind === "select" || q.kind === "yes_no" ? (
              <Select id={`qa-${q.key}`} value={a[q.key] ?? ""} onChange={(e) => setA({ ...a, [q.key]: e.target.value })}>
                <option value="">Unknown</option>
                {(q.kind === "yes_no" ? ["Yes", "No", "Not sure"] : q.options).map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Select>
            ) : (
              <Input id={`qa-${q.key}`} type={q.kind === "date" ? "date" : "text"} value={a[q.key] ?? ""} onChange={(e) => setA({ ...a, [q.key]: e.target.value })} />
            )}
          </Field>
        ))}
      </div>
      <Field label="Decision note" htmlFor="qual_reason" error={result.fieldErrors?.reason} optional>
        <Input id="qual_reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why it is or isn't a fit" />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" pending={pending} onClick={() => run(() => recordQualification(enquiryId, "qualified", a, reason))}>
          <Check className="size-4" aria-hidden /> Qualify
        </Button>
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => recordQualification(enquiryId, "qualifying", a, reason))}>
          Save answers
        </Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => recordQualification(enquiryId, "disqualified", a, reason))}>
          Disqualify
        </Button>
      </div>
      {result.error ? <Notice tone="red">{result.error}</Notice> : null}
      {result.ok ? (
        <p className="text-[13px] text-green-ink" role="status">
          Saved to the record.
        </p>
      ) : null}
    </div>
  );
}

/* Tasks ------------------------------------------------------------------------------------------ */
type TaskRow = { id: string; title: string; status: string; due_at: string | null; assignee?: { full_name: string | null; email: string | null } | null };

export function TaskList({
  tasks,
  timezone,
  oppId,
  contactId,
  members,
  hideAdd,
  links,
  now,
}: {
  now: number;
  tasks: TaskRow[];
  timezone: string;
  oppId?: string;
  contactId?: string;
  members: { id: string; name: string }[];
  hideAdd?: boolean;
  links?: Record<string, string>;
}) {
  const { pending, result, run } = useAction();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [assignee, setAssignee] = useState("");
  return (
    <div>
      <ul className={cn("divide-y divide-line", hideAdd === undefined && tasks.length === 0 && !oppId && !contactId && "hidden")}>
        {tasks.length === 0 ? <li className="py-3 text-[14px] text-ink-3">No tasks yet.</li> : null}
        {tasks.map((t) => {
          const overdue = t.status === "open" && t.due_at && new Date(t.due_at).getTime() < now;
          return (
            <li key={t.id} className="flex items-start gap-3 py-3">
              <Checkbox
                aria-label={t.status === "done" ? `Reopen ${t.title}` : `Complete ${t.title}`}
                checked={t.status === "done"}
                disabled={pending || t.status === "cancelled"}
                onChange={(e) => run(() => setTaskStatus(t.id, e.target.checked ? "done" : "open"))}
              />
              <div className="min-w-0 flex-1">
                {links?.[t.id] ? (
                  <Link href={links[t.id]!} className={cn("text-[14px] hover:text-blue hover:underline", t.status !== "open" && "text-ink-3 line-through")}>
                    {t.title}
                  </Link>
                ) : (
                  <p className={cn("text-[14px]", t.status !== "open" && "text-ink-3 line-through")}>{t.title}</p>
                )}
                <p className={cn("text-[12px]", overdue ? "font-medium text-red-ink" : "text-ink-3")}>
                  {t.due_at ? `${overdue ? "Overdue · " : ""}due ${formatRelative(t.due_at, timezone)}` : "No due date"}
                  {t.assignee ? ` · ${t.assignee.full_name || t.assignee.email}` : ""}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      <form
        hidden={hideAdd}
        className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => addTask({ title, due_date: date || undefined, assignee_id: assignee, opportunity_id: oppId, contact_id: contactId }), () => {
            setTitle("");
            setDate("");
          });
        }}
      >
        <Input aria-label="New task" placeholder="Add a follow-up task" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
        <Input aria-label="Due date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Select aria-label="Assign to" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
          <option value="">Me</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary" pending={pending} disabled={title.trim().length < 2}>
          Add
        </Button>
      </form>
      {result.fieldErrors?.title || result.error ? <p className="mt-1 text-[12px] text-red-ink">{result.fieldErrors?.title ?? result.error}</p> : null}
    </div>
  );
}

/* Notes and contact attempts --------------------------------------------------------------------- */
export function NotesPanel({ oppId, blocked }: { oppId: string; blocked: boolean }) {
  const { pending, result, run } = useAction();
  const [body, setBody] = useState("");
  const [outcome, setOutcome] = useState<"" | "no_answer" | "left_message" | "connected" | "emailed">("");
  return (
    <div className="grid gap-3">
      <Textarea aria-label="Note" rows={3} placeholder="Add a note, or log a call or email" value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="flex flex-wrap items-center gap-2">
        <Select aria-label="Log as" value={outcome} onChange={(e) => setOutcome(e.target.value as typeof outcome)} className="w-auto min-w-44">
          <option value="">Just a note</option>
          <option value="no_answer" disabled={blocked}>
            Called, no answer
          </option>
          <option value="left_message" disabled={blocked}>
            Called, left message
          </option>
          <option value="emailed" disabled={blocked}>
            Sent an email
          </option>
          <option value="connected">Spoke with them</option>
        </Select>
        <Button
          size="sm"
          pending={pending}
          disabled={!outcome && !body.trim()}
          onClick={() => run(() => (outcome ? logContactAttempt(oppId, outcome, body) : addNote(oppId, body)), () => (setBody(""), setOutcome("")))}
        >
          {outcome ? (
            <>
              <PhoneCall className="size-4" aria-hidden /> Log
            </>
          ) : (
            "Add note"
          )}
        </Button>
      </div>
      {result.error || result.fieldErrors?.body ? <p className="text-[12px] text-red-ink">{result.error ?? result.fieldErrors?.body}</p> : null}
    </div>
  );
}

/* Appointments ----------------------------------------------------------------------------------- */
type ApptRow = { id: string; type: "phone" | "video" | "site_visit"; status: keyof typeof APPT_STATUS; starts_at: string; ends_at: string; location: string | null; purpose: string | null; outcome: string | null };

export function AppointmentsPanel({
  appointments,
  timezone,
  oppId,
  contactId,
  defaults,
  location,
  now,
}: {
  now: number;
  appointments: ApptRow[];
  timezone: string;
  oppId?: string;
  contactId: string;
  defaults: { types: string[]; minutes: number };
  location?: string | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <ul className="grid gap-2">
        {appointments.length === 0 ? <li className="text-[14px] text-ink-3">No appointments yet.</li> : null}
        {appointments.map((a) => (
          <AppointmentItem key={a.id} a={a} timezone={timezone} now={now} />
        ))}
      </ul>
      <Button variant="secondary" size="sm" className="mt-3" onClick={() => setOpen(true)}>
        Book appointment
      </Button>
      <BookDialog open={open} onClose={() => setOpen(false)} oppId={oppId} contactId={contactId} timezone={timezone} defaults={defaults} location={location} />
    </div>
  );
}

export function AppointmentItem({ a, timezone, showContact, now }: { a: ApptRow; timezone: string; showContact?: React.ReactNode; now: number }) {
  const { pending, result, run } = useAction();
  const [resched, setResched] = useState(false);
  const z = utcToZonedInputs(a.starts_at, timezone);
  const [date, setDate] = useState(z.date);
  const [time, setTime] = useState(z.time);
  const past = new Date(a.starts_at).getTime() < now;
  const live = a.status === "scheduled" || a.status === "confirmed" || a.status === "rescheduled";
  const st = APPT_STATUS[a.status];
  return (
    <li className="rounded-xl border border-line p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[14px] font-medium">
            {APPT_TYPE_LABEL[a.type]} · {formatDateTime(a.starts_at, timezone)}
          </p>
          <p className="text-[12px] text-ink-3">
            {timezone}
            {a.location ? ` · ${a.location}` : ""}
            {a.purpose ? ` · ${a.purpose}` : ""}
          </p>
          {showContact}
        </div>
        <Badge tone={st.tone}>{st.label}</Badge>
      </div>
      {a.outcome ? <p className="mt-2 text-[13px] text-ink-2">Outcome: {a.outcome}</p> : null}
      {live ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {!past && a.status !== "confirmed" ? (
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => updateAppointment(a.id, { status: "confirmed" }))}>
              Confirmed
            </Button>
          ) : null}
          {past ? (
            <>
              <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => updateAppointment(a.id, { status: "attended" }))}>
                Attended
              </Button>
              <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => updateAppointment(a.id, { status: "no_show" }))}>
                No-show
              </Button>
            </>
          ) : null}
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => setResched((v) => !v)}>
            Reschedule
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => updateAppointment(a.id, { status: "cancelled" }))}>
            Cancel
          </Button>
        </div>
      ) : null}
      {resched ? (
        <form
          className="mt-3 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => updateAppointment(a.id, { date, time }), () => setResched(false));
          }}
        >
          <Input aria-label="New date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
          <Input aria-label="New time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-auto" />
          <Button type="submit" size="sm" pending={pending}>
            Save
          </Button>
        </form>
      ) : null}
      {result.error ? <p className="mt-1 text-[12px] text-red-ink">{result.error}</p> : null}
    </li>
  );
}

export function BookDialog({
  open,
  onClose,
  oppId,
  contactId,
  timezone,
  defaults,
  location,
}: {
  open: boolean;
  onClose: () => void;
  oppId?: string;
  contactId: string;
  timezone: string;
  defaults: { types: string[]; minutes: number };
  location?: string | null;
}) {
  const { pending, result, run } = useAction();
  const [type, setType] = useState(defaults.types[0] ?? "phone");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [minutes, setMinutes] = useState(defaults.minutes);
  const [loc, setLoc] = useState(location ?? "");
  const [purpose, setPurpose] = useState("");
  const fe = result.fieldErrors ?? {};
  return (
    <Dialog open={open} onClose={onClose} title="Book an appointment">
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => bookAppointment({ opportunity_id: oppId, contact_id: contactId, type, date, time, minutes, location: type === "site_visit" ? loc : undefined, purpose }), onClose);
        }}
      >
        <Field label="Type" htmlFor="appt_type">
          <Select id="appt_type" value={type} onChange={(e) => setType(e.target.value)}>
            {(["phone", "video", "site_visit"] as const).map((t) => (
              <option key={t} value={t}>
                {APPT_TYPE_LABEL[t]}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" htmlFor="appt_date" error={fe.date}>
            <Input id="appt_date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Time" htmlFor="appt_time" error={fe.time}>
            <Input id="appt_time" type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>
        <p className="-mt-2 text-[12px] text-ink-3">Times are in {timezone}.</p>
        <Field label="Length (minutes)" htmlFor="appt_len">
          <Input id="appt_len" type="number" min={15} max={480} step={15} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
        </Field>
        {type === "site_visit" ? (
          <Field label="Site address" htmlFor="appt_loc">
            <Input id="appt_loc" value={loc} onChange={(e) => setLoc(e.target.value)} />
          </Field>
        ) : null}
        <Field label="Purpose" htmlFor="appt_purpose" optional>
          <Input id="appt_purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Measure and scope" />
        </Field>
        {result.error ? <Notice tone="red">{result.error}</Notice> : null}
        <p className="text-[12px] text-ink-3">This records the booking in Brexoo. Confirm the time with the customer yourself; nothing is sent automatically.</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" pending={pending}>
            Book
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/* Brex AI panel ----------------------------------------------------------------------------------- */
export function BrexPanel({ oppId }: { oppId: string }) {
  const [reply, setReply] = useState<BrexReply | null>(null);
  const [active, setActive] = useState<BrexTool | null>(null);
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);
  const ask = (tool: BrexTool) => {
    setActive(tool);
    setCopied(false);
    start(async () => setReply(await askBrex({ tool, opportunityId: oppId })));
  };
  const draftText = reply?.draft ? `${reply.draft.subject ? `Subject: ${reply.draft.subject}\n\n` : ""}${reply.draft.body}` : "";
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["summarize", "Summarise"],
            ["draft", "Draft follow-up"],
            ["brief", "Site-visit brief"],
          ] as const
        ).map(([tool, label]) => (
          <Button key={tool} size="sm" variant={active === tool ? "primary" : "secondary"} pending={pending && active === tool} disabled={pending} onClick={() => ask(tool)}>
            {label}
          </Button>
        ))}
      </div>
      <div aria-live="polite">
        {reply ? (
          <div className="mt-4 grid gap-2 text-[14px] leading-relaxed text-ink-2">
            {reply.error ? <Notice tone="amber">{reply.error}</Notice> : null}
            {reply.segments.map((s, i) => (
              <p key={i}>
                {s.text}
                {s.cite ? <span className="ml-1.5 rounded bg-blue-soft px-1.5 py-0.5 text-[11px] font-medium text-blue">{s.cite}</span> : null}
              </p>
            ))}
            {reply.draft ? (
              <div className="mt-1 rounded-xl border border-line bg-surface-2/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">{reply.draft.channel === "email" ? "Draft email" : "Call plan"}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      await navigator.clipboard.writeText(draftText);
                      setCopied(true);
                    }}
                  >
                    {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />} {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-[14px] text-ink">{draftText}</pre>
              </div>
            ) : null}
            <p className="text-[12px] text-ink-3">
              <Sparkles className="mr-1 inline size-3.5" aria-hidden />
              Brex AI reads this record only and never sends anything.{reply.remaining != null ? ` ${reply.remaining} requests left this month.` : ""}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-[13px] text-ink-3">Summaries quote this record. Drafts are for you to review and send yourself.</p>
        )}
      </div>
    </div>
  );
}

export function RecordLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium text-ink hover:text-blue hover:underline">
      {children}
    </Link>
  );
}

/** "New appointment" from the calendar: pick an open opportunity, then book. */
export function NewAppointment({
  opps,
  timezone,
  defaults,
}: {
  opps: { id: string; contactId: string; label: string; location: string | null }[];
  timezone: string;
  defaults: { types: string[]; minutes: number };
}) {
  const [pick, setPick] = useState(false);
  const [chosen, setChosen] = useState<string>("");
  const [book, setBook] = useState(false);
  const opp = opps.find((o) => o.id === chosen);
  return (
    <>
      <Button onClick={() => setPick(true)} disabled={!opps.length} title={opps.length ? undefined : "Add a lead first"}>
        <Plus className="size-4" aria-hidden /> New appointment
      </Button>
      <Dialog open={pick} onClose={() => setPick(false)} title="Who is the appointment with?">
        <Field label="Opportunity" htmlFor="na_opp">
          <Select id="na_opp" value={chosen} onChange={(e) => setChosen(e.target.value)}>
            <option value="">Choose an open opportunity</option>
            {opps.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setPick(false)}>
            Cancel
          </Button>
          <Button
            disabled={!opp}
            onClick={() => {
              setPick(false);
              setBook(true);
            }}
          >
            Continue
          </Button>
        </div>
      </Dialog>
      {opp ? <BookDialog open={book} onClose={() => setBook(false)} oppId={opp.id} contactId={opp.contactId} timezone={timezone} defaults={defaults} location={opp.location} /> : null}
    </>
  );
}
