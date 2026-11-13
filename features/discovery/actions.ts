"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrg } from "@/lib/auth/session";
import { validateCsv } from "./csv";

export type DiscoveryState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string>; imported?: number; skipped?: number; errors?: string[]; sourceId?: string };

export async function createSource(_: DiscoveryState, form: FormData): Promise<DiscoveryState> {
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Name the source").max(120),
      source_type: z.enum(["customer_provided", "public", "licensed", "partner"]),
      provider: z.string().trim().max(120).default(""),
      permitted_use: z.string().trim().min(5, "Describe what you're allowed to do with this data").max(1000),
      attribution_url: z.union([z.literal(""), z.string().url("Enter a full web address")]).default(""),
      limitations: z.string().trim().max(1000).default(""),
      confirm: z.literal("on", { message: "Confirm you have the right to use this data" }),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[String(i.path[0])] ??= i.message;
    return { fieldErrors: fe };
  }
  const { supabase, org, user, isOwner } = await requireOrg();
  if (!isOwner) return { error: "Only an owner can register data sources." };
  const { confirm: _c, ...d } = parsed.data;
  const { data, error } = await supabase
    .from("discovery_sources")
    .insert({ ...d, provider: d.provider || null, attribution_url: d.attribution_url || null, limitations: d.limitations || null, organization_id: org.id, created_by: user.id })
    .select("id")
    .single();
  if (error || !data) return { error: "Couldn't save the source." };
  revalidatePath("/app/discover/import");
  return { ok: true, sourceId: data.id };
}

export async function importRecords(_: DiscoveryState, form: FormData): Promise<DiscoveryState> {
  const sourceId = String(form.get("source_id") ?? "");
  const file = form.get("file");
  if (!/^[0-9a-f-]{36}$/.test(sourceId)) return { error: "Choose a source first." };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a CSV file." };
  if (file.size > 2 * 1024 * 1024) return { error: "Keep files under 2 MB (about 2,000 rows)." };
  const { supabase, org, isOwner } = await requireOrg();
  if (!isOwner) return { error: "Only an owner can import records." };
  const { data: source } = await supabase.from("discovery_sources").select("id").eq("id", sourceId).eq("organization_id", org.id).maybeSingle();
  if (!source) return { error: "That source wasn't found." };

  const { records, errors } = validateCsv(await file.text());
  if (!records.length) return { error: errors[0] ?? "No valid rows found.", errors };
  const rows = records.map((r) => ({
    organization_id: org.id,
    source_id: sourceId,
    external_id: r.external_id,
    title: r.title,
    description: r.description,
    category_code: r.category,
    location_text: r.location,
    postcode: r.postcode,
    project_stage: r.stage,
    estimated_value_minor: r.estimated_value,
    currency: r.estimated_value != null ? org.currency : null,
    timeline: r.timeline,
    observed_at: r.observed_at,
    source_url: r.source_url,
    contact_name: r.contact_name,
    contact_email: r.contact_email,
    contact_phone: r.contact_phone,
    contact_permission: r.contact_permission,
    last_verified_at: new Date().toISOString(),
  }));
  // Re-importing the same external_id refreshes the record (keeps one record per source id).
  const { error } = await supabase.from("project_records").upsert(rows, { onConflict: "source_id,external_id", ignoreDuplicates: false });
  if (error) return { error: "Import failed. Check the file and try again." };
  revalidatePath("/app/discover");
  return { ok: true, imported: rows.length, skipped: errors.length, errors: errors.slice(0, 20) };
}

export async function saveRecord(id: string): Promise<{ ok?: boolean; error?: string; opportunityId?: string | null }> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return { error: "Invalid record." };
  const { supabase } = await requireOrg();
  const { data, error } = await supabase.rpc("save_project_record", { p_record: id });
  if (error) return { error: "Couldn't save that record." };
  revalidatePath("/app/discover");
  revalidatePath("/app", "layout");
  return { ok: true, opportunityId: (data as { opportunity_id?: string | null }).opportunity_id ?? null };
}

export async function setRecordStatus(id: string, status: "new" | "dismissed") {
  const { supabase } = await requireOrg();
  await supabase.rpc("set_project_record_status", { p_record: id, p_status: status });
  revalidatePath("/app/discover");
}
