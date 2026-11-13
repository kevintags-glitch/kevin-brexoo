"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOrg, requireUser } from "@/lib/auth/session";
import { slugify } from "@/lib/format";

export type FormState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string>; message?: string };

function fieldErrors(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of err.issues) out[String(i.path[0])] ??= i.message;
  return out;
}

export async function createOrganization(_: FormState, form: FormData): Promise<FormState> {
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Enter your business name").max(120),
      slug: z.string().trim().toLowerCase().regex(/^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/, "Use 3–48 lowercase letters, numbers or dashes"),
      timezone: z.string().min(1),
      country: z.string().length(2),
      currency: z.string().length(3),
    })
    .safeParse({ ...Object.fromEntries(form), slug: form.get("slug") || slugify(String(form.get("name") ?? "")) });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const { supabase, user } = await requireUser();
  const { error } = await supabase.rpc("create_organization", {
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
    p_timezone: parsed.data.timezone,
    p_country: parsed.data.country,
    p_currency: parsed.data.currency,
  });
  if (error) {
    if (error.code === "23505") return { fieldErrors: { slug: "That address is taken. Try another." } };
    if (error.message.includes("Verify")) return { error: "Please confirm your email address first." };
    return { error: "We couldn't create the organisation. Please try again." };
  }
  // Carry over the plan chosen on the pricing page (data only; billing is confirmed separately).
  const requested = user.user_metadata?.requested_plan as string | undefined;
  if (requested && ["launch", "growth", "managed"].includes(requested)) {
    const { org } = await requireOrg();
    await supabase.from("organizations").update({ plan_code: requested }).eq("id", org.id);
  }
  redirect("/app/onboarding");
}

export async function switchOrganization(form: FormData) {
  const id = String(form.get("organization_id") ?? "");
  const { supabase } = await requireUser();
  await supabase.rpc("set_active_organization", { p_org: id });
  revalidatePath("/app", "layout");
  redirect("/app");
}

/* Team ------------------------------------------------------------------------------------------- */

export async function inviteMember(_: FormState, form: FormData): Promise<FormState & { link?: string }> {
  const parsed = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email"), role: z.enum(["owner", "member"]) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: { email: parsed.error.issues[0]!.message } };
  const { supabase, org, user, isOwner } = await requireOrg();
  if (!isOwner) return { error: "Only an owner can invite people." };
  const { data: limit } = await supabase.from("plan_entitlements").select("limit_value").eq("plan_code", org.plan_code).eq("key", "seats").maybeSingle();
  const [{ count: members }, { count: pending }] = await Promise.all([
    supabase.from("memberships").select("id", { count: "exact", head: true }).eq("organization_id", org.id),
    supabase.from("invitations").select("id", { count: "exact", head: true }).eq("organization_id", org.id).is("accepted_at", null),
  ]);
  if (limit?.limit_value != null && (members ?? 0) + (pending ?? 0) >= limit.limit_value) return { error: `Your plan includes ${limit.limit_value} seats.` };
  const { data, error } = await supabase
    .from("invitations")
    .insert({ organization_id: org.id, email: parsed.data.email, role: parsed.data.role, invited_by: user.id })
    .select("token")
    .single();
  if (error) return { error: error.code === "23505" ? "There's already an open invitation for that email." : "Couldn't create the invitation." };
  revalidatePath("/app/settings/team");
  const { SITE_URL } = await import("@/lib/env");
  return { ok: true, link: `${SITE_URL}/invite/${data.token}`, message: "Invitation created. Send this link to them; it works for 14 days." };
}

export async function revokeInvitation(id: string) {
  const { supabase, org } = await requireOrg();
  await supabase.from("invitations").delete().eq("id", id).eq("organization_id", org.id);
  revalidatePath("/app/settings/team");
}

export async function changeRole(userId: string, role: "owner" | "member"): Promise<FormState> {
  const { supabase, org } = await requireOrg();
  const { error } = await supabase.from("memberships").update({ role }).eq("organization_id", org.id).eq("user_id", userId);
  revalidatePath("/app/settings/team");
  if (error) return { error: error.message.includes("owner") ? "An organisation needs at least one owner." : "Only an owner can change roles." };
  return { ok: true };
}

export async function removeMember(userId: string): Promise<FormState> {
  const { supabase, org } = await requireOrg();
  const { error } = await supabase.from("memberships").delete().eq("organization_id", org.id).eq("user_id", userId);
  revalidatePath("/app/settings/team");
  if (error) return { error: error.message.includes("owner") ? "An organisation needs at least one owner." : "Couldn't remove that person." };
  return { ok: true };
}

export async function acceptInvitation(token: string): Promise<FormState> {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("accept_invitation", { p_token: token });
  if (error) return { error: error.message.includes("Verify") ? "Please confirm your email first." : "This invitation isn't valid for your account. Check you're signed in with the invited email." };
  revalidatePath("/app", "layout");
  redirect("/app");
}
