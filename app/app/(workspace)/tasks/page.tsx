import type { Metadata } from "next";
import Link from "next/link";
import { ListTodo } from "lucide-react";
import { Page, PageHeader } from "@/components/app/PageHeader";
import { TaskList } from "@/components/app/crm/widgets";
import { Card, CardHeader, EmptyState } from "@/components/ui";
import { getMembers } from "@/features/crm/queries";
import { requireOrg } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { utcToZonedInputs } from "@/lib/format";

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ who?: string }> }) {
  const sp = await searchParams;
  const ctx = await requireOrg();
  const { supabase, org, user } = ctx;
  const mine = sp.who !== "all";
  let q = supabase
    .from("tasks")
    .select("id, title, status, due_at, opportunity_id, assignee:profiles!tasks_assignee_id_fkey(full_name, email), opportunity:opportunities(title)")
    .eq("organization_id", org.id)
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(300);
  if (mine) q = q.eq("assignee_id", user.id);
  const [{ data }, members] = await Promise.all([q, getMembers(ctx)]);
  const tasks = data ?? [];
  const tz = org.timezone;
  const today = utcToZonedInputs(new Date().toISOString(), tz).date;
  const now = Date.now();
  const open = tasks.filter((t) => t.status === "open");
  const groups = [
    { id: "overdue", title: "Overdue", items: open.filter((t) => t.due_at && new Date(t.due_at).getTime() < now) },
    { id: "today", title: "Today", items: open.filter((t) => t.due_at && new Date(t.due_at).getTime() >= now && utcToZonedInputs(t.due_at, tz).date === today) },
    { id: "upcoming", title: "Upcoming", items: open.filter((t) => t.due_at && utcToZonedInputs(t.due_at, tz).date > today) },
    { id: "nodate", title: "No due date", items: open.filter((t) => !t.due_at) },
    { id: "done", title: "Recently completed", items: tasks.filter((t) => t.status === "done").slice(-10).reverse() },
  ];

  return (
    <Page>
      <PageHeader
        title="Tasks"
        description="Follow-ups for you and your team. New enquiries create one automatically."
        actions={
          <div className="inline-flex rounded-xl bg-surface-2 p-1" role="group" aria-label="Whose tasks">
            {[
              ["mine", "Mine"],
              ["all", "Everyone"],
            ].map(([id, label]) => (
              <Link key={id} href={`/app/tasks?who=${id}`} aria-current={(mine ? "mine" : "all") === id ? "page" : undefined} className={cn("rounded-lg px-3 py-1.5 text-[14px]", (mine ? "mine" : "all") === id ? "bg-surface font-medium shadow-xs" : "text-ink-3")}>
                {label}
              </Link>
            ))}
          </div>
        }
        className="mb-6"
      />
      <Card className="mb-6 p-5">
        <TaskList tasks={[]} timezone={tz} members={members} now={now} />
      </Card>
      {open.length === 0 && groups[4]!.items.length === 0 ? (
        <Card>
          <EmptyState icon={<ListTodo />} title="No tasks" description="Tasks you add, and follow-ups created from new enquiries, show up here." />
        </Card>
      ) : (
        <div className="grid gap-6">
          {groups
            .filter((g) => g.items.length)
            .map((g) => (
              <Card key={g.id}>
                <CardHeader title={<span className={g.id === "overdue" ? "text-red-ink" : undefined}>{`${g.title} · ${g.items.length}`}</span>} />
                <div className="px-5 pb-2 pt-1">
                  <TaskList
                    tasks={g.items.map((t) => ({ ...t, title: t.opportunity ? `${t.title}` : t.title }))}
                    timezone={tz}
                    members={members}
                    now={now}
                    hideAdd
                    links={Object.fromEntries(g.items.filter((t) => t.opportunity_id).map((t) => [t.id, `/app/opportunities/${t.opportunity_id}`]))}
                  />
                </div>
              </Card>
            ))}
        </div>
      )}
    </Page>
  );
}
