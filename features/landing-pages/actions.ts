"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrg } from "@/lib/auth/session";
import type { Json as RawJson } from "@/lib/supabase/database.types";

type Json = NonNullable<RawJson>;
import { generateDraft, pageContentSchema } from "./content";

export type PageActionState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string>; savedAt?: number };

const MESSAGES: Record<string, string> = {
  "42501": "You don't have permission to do that. Ask an owner.",
  "54000": "Your plan's limit for published pages is reached.",
  "22023": "That step isn't available yet.",
};

function rpcError(error: { code?: string; message: string } | null) {
  if (!error) return null;
  if (error.code === "22023" || error.code === "54000") return error.message;
  return MESSAGES[error.code ?? ""] ?? "Something went wrong. Please try again.";
}

export async function createLandingPage() {
  const { supabase, org } = await requireOrg();
  const [services, areas] = await Promise.all([
    supabase.from("org_services").select("category_code, category:service_categories(name)").eq("organization_id", org.id),
    supabase.from("service_areas").select("label").eq("organization_id", org.id).order("created_at"),
  ]);
  const settings = (org.settings ?? {}) as { brand?: { description?: string }; operations?: { response_hours?: number } };
  const draft = generateDraft({
    businessName: org.name,
    description: settings.brand?.description,
    services: (services.data ?? []).map((s) => ({ code: s.category_code, name: s.category?.name ?? s.category_code })),
    areas: (areas.data ?? []).map((a) => a.label),
    responseHours: settings.operations?.response_hours,
  });
  const { count } = await supabase.from("landing_pages").select("id", { count: "exact", head: true }).eq("organization_id", org.id);
  const slug = count ? `${org.slug}-${(count ?? 0) + 1}` : String(org.slug);
  const { data, error } = await supabase
    .from("landing_pages")
    .insert({ organization_id: org.id, slug, title: org.name, draft: draft as unknown as Json })
    .select("id")
    .single();
  if (error || !data) throw new Error("Couldn't create the page");
  redirect(`/app/landing-pages/${data.id}`);
}

export async function saveDraft(pageId: string, raw: unknown, meta: { title: string; slug: string }): Promise<PageActionState> {
  const parsed = pageContentSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[i.path.join(".")] ??= i.message;
    return { fieldErrors, error: "Some fields need attention." };
  }
  if (!/^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/.test(meta.slug)) return { fieldErrors: { slug: "Use 3–48 lowercase letters, numbers or dashes" }, error: "Check the page address." };
  const { supabase } = await requireOrg();
  const { error } = await supabase
    .from("landing_pages")
    .update({ draft: parsed.data as unknown as Json, title: meta.title.trim().slice(0, 120) || "Landing page", slug: meta.slug })
    .eq("id", pageId);
  if (error) return { error: error.code === "23505" ? "That page address is taken." : "Couldn't save the draft." };
  revalidatePath(`/app/landing-pages/${pageId}`);
  return { ok: true, savedAt: Date.now() };
}

async function run(pageId: string, fn: "submit_landing_page" | "approve_landing_page" | "publish_landing_page"): Promise<PageActionState> {
  const { supabase } = await requireOrg();
  const { error } = await supabase.rpc(fn, { p_page: pageId });
  revalidatePath(`/app/landing-pages/${pageId}`);
  revalidatePath("/app/landing-pages");
  revalidatePath("/app", "layout");
  return error ? { error: rpcError(error) ?? undefined } : { ok: true, savedAt: Date.now() };
}

export async function submitPage(pageId: string) {
  return run(pageId, "submit_landing_page");
}
export async function approvePage(pageId: string) {
  return run(pageId, "approve_landing_page");
}
export async function publishPage(pageId: string) {
  return run(pageId, "publish_landing_page");
}
export async function setPagePaused(pageId: string, paused: boolean): Promise<PageActionState> {
  const { supabase } = await requireOrg();
  const { error } = await supabase.rpc("set_landing_page_paused", { p_page: pageId, p_paused: paused });
  revalidatePath(`/app/landing-pages/${pageId}`);
  return error ? { error: rpcError(error) ?? undefined } : { ok: true, savedAt: Date.now() };
}
