import { notFound } from "next/navigation";
import { PreviewClient } from "@/components/app/pages/PreviewClient";
import { parsePageContent } from "@/features/landing-pages/content";
import { requireOrg } from "@/lib/auth/session";

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, org } = await requireOrg();
  const { data: page } = await supabase.from("landing_pages").select("id, slug, title, draft").eq("id", id).eq("organization_id", org.id).maybeSingle();
  if (!page) notFound();
  const settings = (org.settings ?? {}) as { brand?: { description?: string; logo_url?: string } };
  const [services, areas, questions] = await Promise.all([
    supabase.from("org_services").select("category_code, category:service_categories(name, sort)").eq("organization_id", org.id),
    supabase.from("service_areas").select("label").eq("organization_id", org.id).order("label"),
    supabase.from("org_questions").select("key, label, kind, options, required").eq("organization_id", org.id).eq("is_public", true).eq("active", true).order("sort"),
  ]);
  return (
    <PreviewClient
      initial={{
        page_id: page.id,
        slug: String(page.slug),
        title: page.title,
        content: parsePageContent(page.draft),
        business: { name: org.name, website: org.website, phone: org.phone, timezone: org.timezone, country: org.country, description: settings.brand?.description ?? null, logo_url: settings.brand?.logo_url ?? null },
        services: (services.data ?? []).sort((a, b) => (a.category?.sort ?? 0) - (b.category?.sort ?? 0)).map((s) => ({ code: s.category_code, name: s.category?.name ?? s.category_code })),
        areas: (areas.data ?? []).map((a) => a.label),
        questions: (questions.data ?? []).map((q) => ({ key: q.key, label: q.label, kind: q.kind as "text", options: Array.isArray(q.options) ? (q.options as string[]) : [], required: q.required })),
      }}
    />
  );
}
