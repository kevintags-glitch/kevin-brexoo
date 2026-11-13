import type { Metadata } from "next";
import Link from "next/link";
import { Bell, CalendarCheck, CircleCheck, FileText, Inbox, ListTodo, MessageSquare, Radar, SquareKanban, UserRound } from "lucide-react";
import { Page, PageHeader } from "@/components/app/PageHeader";
import { Button, Card, EmptyState } from "@/components/ui";
import { markNotificationsRead } from "@/features/notifications/actions";
import { notificationsQuery, unreadSince } from "@/features/notifications/query";
import { requireOrg } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Notifications" };

const FILTERS = [
  { id: "all", label: "All", kinds: null },
  { id: "leads", label: "Leads", kinds: ["enquiry_received", "discovered"] },
  { id: "appointments", label: "Appointments", kinds: ["appointment_booked", "appointment_scheduled", "appointment_confirmed", "appointment_attended", "appointment_no_show", "appointment_cancelled", "appointment_rescheduled"] },
  { id: "pipeline", label: "Pipeline", kinds: ["stage_changed", "value_changed", "owner_changed", "qualification_in_progress", "qualification_qualified", "qualification_disqualified"] },
  { id: "tasks", label: "Tasks & notes", kinds: ["task_created", "task_completed", "task_cancelled", "task_reopened", "note_added"] },
] as const;

function iconFor(kind: string) {
  if (kind.startsWith("enquiry")) return Inbox;
  if (kind.startsWith("appointment")) return CalendarCheck;
  if (kind.startsWith("stage") || kind.startsWith("value")) return SquareKanban;
  if (kind.startsWith("task")) return ListTodo;
  if (kind.startsWith("note")) return MessageSquare;
  if (kind.startsWith("owner")) return UserRound;
  if (kind.startsWith("qualification")) return CircleCheck;
  if (kind === "discovered") return Radar;
  return FileText;
}

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const ctx = await requireOrg();
  const { filter = "all" } = await searchParams;
  const f = FILTERS.find((x) => x.id === filter) ?? FILTERS[0];
  let q = notificationsQuery(ctx).order("created_at", { ascending: false }).limit(100);
  if (f.kinds) q = q.in("kind", [...f.kinds]);
  const { data } = await q;
  const since = unreadSince(ctx);
  const items = data ?? [];
  const unread = items.filter((n) => +new Date(n.created_at) > +new Date(since)).length;

  return (
    <Page>
      <PageHeader
        className="mb-6"
        title="Notifications"
        description={unread ? `${unread >= 100 ? "100+" : unread} new since you last looked` : "You're all caught up"}
        actions={
          <form action={markNotificationsRead}>
            <Button type="submit" variant="secondary" size="sm" disabled={!unread}>
              Mark all as read
            </Button>
          </form>
        }
      />
      <nav aria-label="Filter notifications" className="mb-5 flex gap-1.5 overflow-x-auto scrollbar-none">
        {FILTERS.map((x) => (
          <Link key={x.id} href={x.id === "all" ? "/app/notifications" : `/app/notifications?filter=${x.id}`} aria-current={x.id === f.id ? "page" : undefined} className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-[13px]", x.id === f.id ? "border-blue bg-blue-soft font-medium text-blue" : "border-line text-ink-2 hover:bg-surface-2")}>
            {x.label}
          </Link>
        ))}
      </nav>
      <Card>
        {items.length === 0 ? (
          <EmptyState icon={<Bell />} title="Nothing here yet" description="New enquiries, bookings and pipeline changes made by your team will show up here." />
        ) : (
          <ul className="divide-y divide-line">
            {items.map((n) => {
              const Icon = iconFor(n.kind);
              const isNew = +new Date(n.created_at) > +new Date(since);
              return (
                <li key={n.id}>
                  <Link href={n.opportunity_id ? `/app/opportunities/${n.opportunity_id}` : "/app/enquiries"} className={cn("flex items-start gap-3 px-5 py-3.5 hover:bg-surface-2/50", isNew && "bg-blue-soft/40")}>
                    <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink-2">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px]">{n.summary}</span>
                      <span className="block text-[12px] text-ink-3">
                        {n.actor?.full_name ? `${n.actor.full_name} · ` : ""}
                        {formatRelative(n.created_at, ctx.org.timezone)}
                      </span>
                    </span>
                    {isNew ? <span className="mt-2 size-2 shrink-0 rounded-full bg-blue" aria-label="New" /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <p className="mt-4 text-[13px] text-ink-3">
        Want these in Slack, SMS or email? <Link href="/app/settings/integrations" className="text-blue hover:underline">Connect Make.com</Link>.
      </p>
    </Page>
  );
}
