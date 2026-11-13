import { Shell } from "@/components/app/Shell";
import { requireOrg } from "@/lib/auth/session";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { supabase, org, user, profile, memberships } = await requireOrg();
  const [unreviewed, overdue] = await Promise.all([
    supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("organization_id", org.id).eq("status", "unreviewed"),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("organization_id", org.id).eq("status", "open").lt("due_at", new Date().toISOString()),
  ]);
  return (
    <Shell
      orgName={org.name}
      orgs={memberships.map((m) => ({ id: m.organization.id, name: m.organization.name }))}
      activeOrgId={org.id}
      userName={profile?.full_name ?? ""}
      userEmail={user.email ?? ""}
      counts={{ unreviewed: unreviewed.count ?? 0, overdue: overdue.count ?? 0 }}
    >
      <main id="main">{children}</main>
    </Shell>
  );
}
