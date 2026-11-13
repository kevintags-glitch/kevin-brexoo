import { cookies } from "next/headers";
import { Shell } from "@/components/app/Shell";
import { notificationsQuery, unreadSince } from "@/features/notifications/query";
import { requireOrg } from "@/lib/auth/session";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireOrg();
  const { supabase, org, user, profile, memberships } = ctx;
  const [unreviewed, overdue, team, store, notes] = await Promise.all([
    supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("organization_id", org.id).eq("status", "unreviewed"),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("organization_id", org.id).eq("status", "open").lt("due_at", new Date().toISOString()),
    supabase.from("memberships").select("profile:profiles(full_name, email)").eq("organization_id", org.id).order("created_at").limit(8),
    cookies(),
    notificationsQuery(ctx).gt("created_at", unreadSince(ctx)).limit(100),
  ]);
  const today = new Intl.DateTimeFormat("en-AU", { timeZone: org.timezone, weekday: "long", day: "numeric", month: "long" }).format(new Date());
  return (
    <Shell
      orgName={org.name}
      orgs={memberships.map((m) => ({ id: m.organization.id, name: m.organization.name }))}
      activeOrgId={org.id}
      userName={profile?.full_name ?? ""}
      userEmail={user.email ?? ""}
      team={(team.data ?? []).map((m) => m.profile?.full_name || m.profile?.email || "Teammate")}
      today={today}
      counts={{ unreviewed: unreviewed.count ?? 0, overdue: overdue.count ?? 0, notifications: notes.data?.length ?? 0 }}
      initialCollapsed={store.get("brexoo_sidebar")?.value === "1"}
    >
      <main id="main">{children}</main>
    </Shell>
  );
}
