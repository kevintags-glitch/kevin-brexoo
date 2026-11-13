"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTemplate } from "@/config/industry-templates";
import { requireOrg } from "@/lib/auth/session";
import type { Json as RawJson } from "@/lib/supabase/database.types";

type Json = NonNullable<RawJson>;
import type { StepId } from "./steps";

export type StepState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string>; savedAt?: number };

type Ctx = Awaited<ReturnType<typeof requireOrg>>;

function errs(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of err.issues) out[i.path.join(".")] ??= i.message;
  return out;
}

function payload(form: FormData) {
  try {
    return JSON.parse(String(form.get("payload") ?? "{}"));
  } catch {
    return {};
  }
}

async function markStep(ctx: Ctx, step: StepId) {
  const { supabase, org } = ctx;
  const { data } = await supabase.from("onboarding").select("status, completed_steps").eq("organization_id", org.id).single();
  if (data?.status === "not_started" || data?.status === "needs_changes") await supabase.rpc("advance_onboarding", { p_to: "in_progress" });
  const steps = new Set(data?.completed_steps ?? []);
  steps.add(step);
  await supabase.from("onboarding").update({ completed_steps: [...steps] }).eq("organization_id", org.id);
}

/** Shallow-merges sections of organizations.settings, reading the latest copy first. */
async function mergeSettings(ctx: Ctx, patch: Record<string, Record<string, unknown>>) {
  const { data } = await ctx.supabase.from("organizations").select("settings").eq("id", ctx.org.id).single();
  const settings = ((data?.settings ?? {}) as Record<string, Record<string, unknown>>) ?? {};
  const next = { ...settings };
  for (const [key, value] of Object.entries(patch)) next[key] = { ...(settings[key] ?? {}), ...value };
  return ctx.supabase.from("organizations").update({ settings: next as Json }).eq("id", ctx.org.id);
}

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v))
  .pipe(z.union([z.literal(""), z.string().url("Enter a valid web address")]));

export async function saveBusiness(_: StepState, form: FormData): Promise<StepState> {
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Enter your business name").max(120),
      legal_name: z.string().trim().max(160).default(""),
      website: optionalUrl,
      phone: z.string().trim().max(40).default(""),
      contact_name: z.string().trim().min(1, "Who should customers deal with?").max(120),
      timezone: z.string().min(1),
    })
    .refine((v) => v.phone || v.website, { message: "Add a phone number or a website", path: ["phone"] })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: errs(parsed.error) };
  const ctx = await requireOrg();
  const { legal_name, ...cols } = parsed.data;
  const { error } = await ctx.supabase
    .from("organizations")
    .update({ ...cols, website: cols.website || null, phone: cols.phone || null })
    .eq("id", ctx.org.id);
  if (!error) await mergeSettings(ctx, { business: { legal_name } });
  if (error) return { error: error.code === "42501" ? "Only an owner can change business details." : "Couldn't save. Please try again." };
  await markStep(ctx, "business");
  revalidatePath("/app", "layout");
  return { ok: true, savedAt: Date.now() };
}

const servicesSchema = z.object({
  services: z.array(z.string()).min(1, "Choose at least one service"),
  focus: z.enum(["residential", "commercial", "both"]),
  areas: z
    .array(z.object({ label: z.string().trim().min(2).max(80), postcode: z.string().trim().max(12).optional().default(""), radius_km: z.coerce.number().int().min(0).max(500).optional() }))
    .min(1, "Add at least one service area"),
  exclusions: z.string().trim().max(500).default(""),
});

export async function saveServices(_: StepState, form: FormData): Promise<StepState> {
  const parsed = servicesSchema.safeParse(payload(form));
  if (!parsed.success) return { fieldErrors: errs(parsed.error) };
  const ctx = await requireOrg();
  const { supabase, org } = ctx;
  const codes = parsed.data.services.filter((c) => getTemplate(c));
  const { data: existing } = await supabase.from("org_services").select("category_code").eq("organization_id", org.id);
  const existingCodes = new Set((existing ?? []).map((e) => e.category_code));
  const remove = [...existingCodes].filter((c) => !codes.includes(c));
  if (remove.length) await supabase.from("org_services").delete().eq("organization_id", org.id).in("category_code", remove);
  const { error } = await supabase.from("org_services").upsert(
    codes.map((code) => ({ organization_id: org.id, category_code: code, template_version: getTemplate(code)!.version, focus: parsed.data.focus })),
    { onConflict: "organization_id,category_code" },
  );
  if (error) return { error: "Couldn't save services." };

  // Seed qualification questions from each newly added template; existing edits are kept.
  const { data: qs } = await supabase.from("org_questions").select("key").eq("organization_id", org.id);
  const have = new Set((qs ?? []).map((q) => q.key));
  const rows: { organization_id: string; key: string; label: string; kind: string; options: Json; is_public: boolean; required: boolean; source: string; sort: number }[] = [];
  let sort = have.size;
  for (const code of codes) {
    for (const q of getTemplate(code)!.questions) {
      if (have.has(q.key)) continue;
      have.add(q.key);
      rows.push({ organization_id: org.id, key: q.key, label: q.label, kind: q.kind, options: (q.options ?? []) as Json, is_public: q.public ?? false, required: q.required ?? false, source: "template", sort: sort++ });
    }
  }
  if (rows.length) await supabase.from("org_questions").insert(rows);

  await supabase.from("service_areas").delete().eq("organization_id", org.id);
  await supabase.from("service_areas").insert(
    parsed.data.areas.map((a) => ({ organization_id: org.id, label: a.label, postcode: a.postcode || null, radius_km: a.radius_km ?? null })),
  );
  await mergeSettings(ctx, { coverage: { exclusions: parsed.data.exclusions } });
  await markStep(ctx, "services");
  revalidatePath("/app", "layout");
  return { ok: true, savedAt: Date.now() };
}

export async function saveIdeal(_: StepState, form: FormData): Promise<StepState> {
  const parsed = z
    .object({
      min_budget: z.string().max(40).default(""),
      preferred_jobs: z.string().trim().max(500).default(""),
      capacity_per_month: z.string().trim().max(20).default(""),
      avoid: z.string().trim().max(500).default(""),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: errs(parsed.error) };
  const ctx = await requireOrg();
  await mergeSettings(ctx, { ideal: parsed.data });
  await markStep(ctx, "ideal");
  return { ok: true, savedAt: Date.now() };
}

const questionSchema = z.object({
  id: z.string().optional(),
  key: z.string().regex(/^[a-z][a-z0-9_]{1,40}$/),
  label: z.string().trim().min(2, "Write the question").max(160),
  kind: z.enum(["text", "select", "yes_no", "date"]),
  options: z.array(z.string().trim().min(1).max(60)).max(12).default([]),
  is_public: z.boolean(),
  required: z.boolean(),
  active: z.boolean(),
  source: z.enum(["template", "custom"]),
});

export async function saveQualification(_: StepState, form: FormData): Promise<StepState> {
  const parsed = z.object({ questions: z.array(questionSchema).max(40) }).safeParse(payload(form));
  if (!parsed.success) return { fieldErrors: errs(parsed.error) };
  const ctx = await requireOrg();
  const { supabase, org } = ctx;
  const rows = parsed.data.questions.map((q, i) => ({
    organization_id: org.id,
    key: q.key,
    label: q.label,
    kind: q.kind,
    options: (q.kind === "select" ? q.options : []) as Json,
    is_public: q.is_public,
    required: q.required,
    active: q.active,
    source: q.source,
    sort: i,
  }));
  const keys = rows.map((r) => r.key);
  const { data: existing } = await supabase.from("org_questions").select("key").eq("organization_id", org.id);
  const stale = (existing ?? []).map((e) => e.key).filter((k) => !keys.includes(k));
  if (stale.length) await supabase.from("org_questions").delete().eq("organization_id", org.id).in("key", stale);
  const { error } = await supabase.from("org_questions").upsert(rows, { onConflict: "organization_id,key" });
  if (error) return { error: "Couldn't save questions." };
  await markStep(ctx, "qualification");
  return { ok: true, savedAt: Date.now() };
}

export async function saveBrand(_: StepState, form: FormData): Promise<StepState> {
  const parsed = z
    .object({
      description: z.string().trim().min(20, "Write at least a sentence or two (20+ characters)").max(1200),
      logo_url: z.union([z.literal(""), z.string().url()]).default(""),
      tagline: z.string().trim().max(120).default(""),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: errs(parsed.error) };
  const ctx = await requireOrg();
  const { error } = await mergeSettings(ctx, { brand: parsed.data });
  if (error) return { error: "Couldn't save. Only an owner can change brand details." };
  await markStep(ctx, "brand");
  return { ok: true, savedAt: Date.now() };
}

export async function saveOperations(_: StepState, form: FormData): Promise<StepState> {
  const parsed = z
    .object({
      response_hours: z.coerce.number().int().min(1, "At least 1 hour").max(168),
      notify_emails: z
        .string()
        .default("")
        .transform((s) => s.split(/[\s,;]+/).filter(Boolean))
        .pipe(z.array(z.string().email("One of the emails isn't valid")).max(10)),
      default_owner_id: z.string().default(""),
      working_hours: z.string().trim().max(120).default(""),
      channels: z.array(z.enum(["email", "phone", "sms"])).default([]),
      meeting_types: z.array(z.enum(["phone", "video", "site_visit"])).default([]),
      meeting_minutes: z.coerce.number().int().min(15).max(240).default(60),
      buffer_minutes: z.coerce.number().int().min(0).max(120).default(15),
    })
    .safeParse({ ...Object.fromEntries(form), channels: form.getAll("channels"), meeting_types: form.getAll("meeting_types") });
  if (!parsed.success) return { fieldErrors: errs(parsed.error) };
  const ctx = await requireOrg();
  const { channels, meeting_types, meeting_minutes, buffer_minutes, ...ops } = parsed.data;
  await mergeSettings(ctx, { operations: ops, engagement: { channels }, appointments: { meeting_types, meeting_minutes, buffer_minutes } });
  await markStep(ctx, "operations");
  return { ok: true, savedAt: Date.now() };
}

export async function submitOnboarding(): Promise<StepState & { status?: string; note?: string | null }> {
  const { supabase, org } = await requireOrg();
  const { data: cur } = await supabase.from("onboarding").select("status").eq("organization_id", org.id).single();
  if (cur?.status === "not_started" || cur?.status === "needs_changes") await supabase.rpc("advance_onboarding", { p_to: "in_progress" });
  const { data, error } = await supabase.rpc("advance_onboarding", { p_to: "submitted" });
  if (error) return { error: "Couldn't submit. Please try again." };
  const { data: ob } = await supabase.from("onboarding").select("review_note").eq("organization_id", org.id).single();
  revalidatePath("/app", "layout");
  return { ok: true, status: data ?? undefined, note: ob?.review_note };
}
