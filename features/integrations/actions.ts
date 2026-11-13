"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrg } from "@/lib/auth/session";
import { MAKE_URL, postToMake } from "@/lib/integrations/make";

export type IntegrationState = { ok?: boolean; error?: string; message?: string; url?: string };

const EVENTS = ["enquiry.received", "appointment.booked", "opportunity.won"] as const;

/** Owners connect (or update) the organisation's Make.com webhook. */
export async function saveMakeWebhook(_: IntegrationState, form: FormData): Promise<IntegrationState> {
  const ctx = await requireOrg();
  if (!ctx.isOwner) return { error: "Only owners can change integrations." };
  const parsed = z
    .object({
      url: z.string().trim().regex(MAKE_URL, "Paste a Make.com webhook URL, like https://hook.us1.make.com/abc123…"),
      events: z.array(z.enum(EVENTS)).min(1, "Choose at least one event"),
    })
    .safeParse({ url: form.get("url"), events: form.getAll("events") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form", url: String(form.get("url") ?? "").slice(0, 300) };

  const { supabase, org, user } = ctx;
  const { data: existing } = await supabase.from("integrations").select("id").eq("organization_id", org.id).eq("kind", "make_webhook").maybeSingle();
  const { error } = existing
    ? await supabase.from("integrations").update({ url: parsed.data.url, events: parsed.data.events, enabled: true }).eq("id", existing.id)
    : await supabase.from("integrations").insert({ organization_id: org.id, kind: "make_webhook", url: parsed.data.url, events: parsed.data.events, created_by: user.id });
  if (error) return { error: "We couldn't save the integration. Please try again." };
  revalidatePath("/app/settings/integrations");
  return { ok: true, message: existing ? "Integration updated." : "Make.com connected. Send a test event to check your scenario." };
}

export async function setMakeEnabled(enabled: boolean): Promise<IntegrationState> {
  const ctx = await requireOrg();
  if (!ctx.isOwner) return { error: "Only owners can change integrations." };
  const { error } = await ctx.supabase.from("integrations").update({ enabled }).eq("organization_id", ctx.org.id).eq("kind", "make_webhook");
  if (error) return { error: "We couldn't update the integration." };
  revalidatePath("/app/settings/integrations");
  return { ok: true, message: enabled ? "Integration resumed." : "Integration paused. No events will be sent." };
}

export async function removeMakeWebhook(): Promise<IntegrationState> {
  const ctx = await requireOrg();
  if (!ctx.isOwner) return { error: "Only owners can change integrations." };
  const { error } = await ctx.supabase.from("integrations").delete().eq("organization_id", ctx.org.id).eq("kind", "make_webhook");
  if (error) return { error: "We couldn't remove the integration." };
  revalidatePath("/app/settings/integrations");
  return { ok: true, message: "Integration removed." };
}

/** Sends a sample event straight away, so owners can map fields in their Make scenario. */
export async function sendMakeTest(): Promise<IntegrationState> {
  const ctx = await requireOrg();
  if (!ctx.isOwner) return { error: "Only owners can send test events." };
  const { supabase, org } = ctx;
  const { data: integ } = await supabase.from("integrations").select("id, url, secret").eq("organization_id", org.id).eq("kind", "make_webhook").maybeSingle();
  if (!integ) return { error: "Connect a webhook first." };
  const r = await postToMake(integ.url, integ.secret, "test", { reference: "TEST0001", contact_name: "Sample Customer", category: "Home builders", organization: org.name });
  await supabase.from("integrations").update({ last_delivery_at: new Date().toISOString(), last_status: r.ok ? `Test delivered (${r.status})` : `Test failed (${r.status})` }).eq("id", integ.id);
  revalidatePath("/app/settings/integrations");
  return r.ok ? { ok: true, message: "Test event delivered." } : { error: `Make.com didn't accept the test: ${r.status}` };
}
