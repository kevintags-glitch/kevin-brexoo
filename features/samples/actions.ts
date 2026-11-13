"use server";
import { revalidatePath } from "next/cache";
import { sampleForServices } from "@/config/samples";
import { requireOrg } from "@/lib/auth/session";

export type SampleState = { ok?: boolean; error?: string; message?: string };

/** Loads the example workspace that matches the business's services (same records as the website). */
export async function loadSampleData(): Promise<SampleState> {
  const ctx = await requireOrg();
  if (!ctx.isOwner) return { error: "Only owners can load sample data." };
  const { data: svc } = await ctx.supabase.from("org_services").select("category_code").eq("organization_id", ctx.org.id);
  const biz = sampleForServices((svc ?? []).map((s) => s.category_code));
  const { data, error } = await ctx.supabase.rpc("load_sample_data", { p_org: ctx.org.id, p_key: biz.key });
  if (error) return { error: "We couldn't load the sample data. Please try again." };
  revalidatePath("/app", "layout");
  const r = data as { already_loaded?: boolean; leads?: number };
  return { ok: true, message: r.already_loaded ? "Sample data is already loaded." : `Loaded ${r.leads} sample leads from ${biz.name}.` };
}

export async function clearSampleData(): Promise<SampleState> {
  const ctx = await requireOrg();
  if (!ctx.isOwner) return { error: "Only owners can clear sample data." };
  const { error } = await ctx.supabase.rpc("clear_sample_data", { p_org: ctx.org.id });
  if (error) return { error: "We couldn't clear the sample data. Please try again." };
  revalidatePath("/app", "layout");
  return { ok: true, message: "Sample data removed." };
}
