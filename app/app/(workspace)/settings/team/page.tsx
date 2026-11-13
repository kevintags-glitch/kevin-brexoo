import type { Metadata } from "next";
import { TeamManager } from "@/components/app/TeamManager";
import { getMembers } from "@/features/crm/queries";
import { requireOrg } from "@/lib/auth/session";
import { SITE_URL } from "@/lib/env";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const ctx = await requireOrg();
  const [members, invites] = await Promise.all([
    getMembers(ctx),
    ctx.supabase.from("invitations").select("id, email, role, expires_at, token").eq("organization_id", ctx.org.id).is("accepted_at", null).order("created_at"),
  ]);
  return <TeamManager members={members} invites={(invites.data ?? []).map((i) => ({ ...i, email: String(i.email) }))} isOwner={ctx.isOwner} me={ctx.user.id} siteUrl={SITE_URL} />;
}
