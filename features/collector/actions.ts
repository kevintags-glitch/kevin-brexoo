"use server";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hashKey } from "@/lib/auth/bearer";
import { requireOrg } from "@/lib/auth/session";
import { SITE_URL } from "@/lib/env";

export type InboundState = { ok?: boolean; error?: string; url?: string };

const LABELS = ["Make.com", "Facebook Lead Ads", "Google Forms", "Hipages", "Website form", "Other"] as const;

/** Owners create an inbound link for an outside tool. The full link is shown once; only its hash is kept. */
export async function createInboundKey(_: InboundState, form: FormData): Promise<InboundState> {
  const ctx = await requireOrg();
  if (!ctx.isOwner) return { error: "Only owners can create inbound links." };
  const parsed = z.enum(LABELS).safeParse(form.get("label"));
  if (!parsed.success) return { error: "Choose where the leads come from." };
  const key = `bxk_${randomBytes(24).toString("base64url")}`;
  const { error } = await ctx.supabase.from("inbound_keys").insert({
    organization_id: ctx.org.id,
    key_hash: hashKey(key),
    key_hint: key.slice(-6),
    label: parsed.data,
    created_by: ctx.user.id,
  });
  if (error) return { error: "We couldn't create the link. Please try again." };
  revalidatePath("/app/settings/integrations");
  return { ok: true, url: `${SITE_URL}/api/inbound/enquiries/${key}` };
}

export async function revokeInboundKey(id: string): Promise<InboundState> {
  const ctx = await requireOrg();
  if (!ctx.isOwner) return { error: "Only owners can revoke inbound links." };
  const { error } = await ctx.supabase.from("inbound_keys").update({ revoked_at: new Date().toISOString() }).eq("id", id).eq("organization_id", ctx.org.id);
  if (error) return { error: "We couldn't revoke the link." };
  revalidatePath("/app/settings/integrations");
  return { ok: true };
}

/** Owners switch a Brexoo source on or off for their business. */
export async function setPlatformSource(key: string, enabled: boolean): Promise<{ ok?: boolean; error?: string }> {
  const ctx = await requireOrg();
  if (!ctx.isOwner) return { error: "Only owners can change sources." };
  const { error } = await ctx.supabase.rpc("set_platform_source_enabled", { p_org: ctx.org.id, p_key: key, p_enabled: enabled });
  if (error) return { error: "We couldn't update the source." };
  revalidatePath("/app/discover");
  return { ok: true };
}
