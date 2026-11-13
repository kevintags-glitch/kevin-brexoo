import "server-only";
import type { OrgContext } from "@/lib/auth/session";

const WEEK = 7 * 86_400_000;

/** Activity by teammates (or the system) since the user last opened notifications. */
export function unreadSince(ctx: OrgContext) {
  return ctx.profile?.notifications_seen_at ?? new Date(Date.now() - WEEK).toISOString();
}

export function notificationsQuery(ctx: OrgContext) {
  return ctx.supabase
    .from("activity_events")
    .select("id, kind, summary, created_at, opportunity_id, contact_id, actor:profiles(full_name)")
    .eq("organization_id", ctx.org.id)
    .or(`actor_id.is.null,actor_id.neq.${ctx.user.id}`);
}
