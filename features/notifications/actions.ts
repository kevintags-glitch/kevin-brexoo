"use server";
import { revalidatePath } from "next/cache";
import { requireOrg } from "@/lib/auth/session";

/** Marks everything up to now as read for the signed-in user (it's their own profile row). */
export async function markNotificationsRead() {
  const { supabase, user } = await requireOrg();
  await supabase.from("profiles").update({ notifications_seen_at: new Date().toISOString() }).eq("id", user.id);
  revalidatePath("/app", "layout");
}
