import { CalendarDays, CircleCheck, FileText, Inbox, ListTodo, MessageSquare, Shuffle, UserRound, Ban, type LucideIcon } from "lucide-react";
import { formatDateTime } from "@/lib/format";

const ICONS: Record<string, LucideIcon> = {
  enquiry_received: Inbox,
  stage_changed: Shuffle,
  owner_changed: UserRound,
  task_created: ListTodo,
  task_completed: CircleCheck,
  note_added: MessageSquare,
  appointment_booked: CalendarDays,
  do_not_contact_set: Ban,
};

export type TimelineEvent = { id: number; kind: string; summary: string; created_at: string; actor?: { full_name: string | null; email: string | null } | null };

export function Timeline({ events, timezone }: { events: TimelineEvent[]; timezone: string }) {
  if (!events.length) return <p className="text-[14px] text-ink-3">No activity yet.</p>;
  return (
    <ol className="relative grid gap-4 before:absolute before:bottom-2 before:left-[13px] before:top-2 before:w-px before:bg-line">
      {events.map((e) => {
        const Icon = ICONS[e.kind] ?? (e.kind.startsWith("appointment") ? CalendarDays : e.kind.startsWith("qualification") ? CircleCheck : FileText);
        return (
          <li key={e.id} className="relative flex gap-3">
            <span className="relative z-10 grid size-7 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-3">
              <Icon className="size-3.5" aria-hidden />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-[14px] text-ink">{e.summary}</p>
              <p className="text-[12px] text-ink-3">
                {formatDateTime(e.created_at, timezone)}
                {e.actor ? ` · ${e.actor.full_name || e.actor.email}` : e.kind === "enquiry_received" ? " · Website" : " · System"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
