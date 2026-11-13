import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Page, PageHeader } from "@/components/app/PageHeader";
import { PageEditor } from "@/components/app/pages/PageEditor";
import { Card, CardHeader } from "@/components/ui";
import { parsePageContent } from "@/features/landing-pages/content";
import { requireOrg } from "@/lib/auth/session";
import { SITE_URL } from "@/lib/env";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Edit landing page" };

export default async function EditLandingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, org, isOwner } = await requireOrg();
  const { data: page } = await supabase.from("landing_pages").select("*").eq("id", id).eq("organization_id", org.id).maybeSingle();
  if (!page) notFound();

  const [versions, services, areas, questions] = await Promise.all([
    supabase.from("landing_page_versions").select("id, version, content, created_at, approved_at, published_at, creator:profiles!landing_page_versions_created_by_fkey(full_name), approver:profiles!landing_page_versions_approved_by_fkey(full_name)").eq("page_id", id).order("version", { ascending: false }),
    supabase.from("org_services").select("category_code, category:service_categories(name, sort)").eq("organization_id", org.id),
    supabase.from("service_areas").select("label").eq("organization_id", org.id).order("label"),
    supabase.from("org_questions").select("key, label, kind, options, required").eq("organization_id", org.id).eq("is_public", true).eq("active", true).order("sort"),
  ]);

  const submitted = versions.data?.find((v) => v.id === page.submitted_version_id);
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  const flags = {
    draftDiffers: !submitted || !same(parsePageContent(page.draft), parsePageContent(submitted.content)),
    awaitingApproval: Boolean(submitted && !submitted.approved_at && page.submitted_version_id !== page.published_version_id),
    readyToPublish: Boolean(submitted && submitted.approved_at && page.submitted_version_id !== page.published_version_id),
  };
  const settings = (org.settings ?? {}) as { brand?: { description?: string; logo_url?: string } };

  return (
    <Page wide>
      <PageHeader eyebrow={<Link href="/app/landing-pages" className="hover:text-ink">Landing pages</Link>} title={page.title} className="mb-6" />
      <PageEditor
        page={{ id: page.id, title: page.title, slug: String(page.slug), status: page.status, draft: parsePageContent(page.draft) }}
        flags={flags}
        isOwner={isOwner}
        liveUrl={`${SITE_URL}/p/${page.slug}`}
        base={{
          business: { name: org.name, website: org.website, phone: org.phone, timezone: org.timezone, country: org.country, description: settings.brand?.description ?? null, logo_url: settings.brand?.logo_url ?? null },
          services: (services.data ?? []).sort((a, b) => (a.category?.sort ?? 0) - (b.category?.sort ?? 0)).map((s) => ({ code: s.category_code, name: s.category?.name ?? s.category_code })),
          areas: (areas.data ?? []).map((a) => a.label),
          places: [],
          questions: (questions.data ?? []).map((q) => ({ key: q.key, label: q.label, kind: q.kind as "text", options: Array.isArray(q.options) ? (q.options as string[]) : [], required: q.required })),
        }}
      />
      <Card className="mt-8">
        <CardHeader title="Version history" description="Each submission is an immutable snapshot with its approval." />
        <ol className="mt-3 divide-y divide-line">
          {(versions.data ?? []).length === 0 ? <li className="px-5 py-4 text-[14px] text-ink-3">No versions yet. Submitting the draft creates version 1.</li> : null}
          {(versions.data ?? []).map((v) => (
            <li key={v.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-[14px]">
              <span className="w-10 font-semibold tabular">v{v.version}</span>
              <span className="text-ink-3">Submitted {formatDateTime(v.created_at, org.timezone)}{v.creator?.full_name ? ` by ${v.creator.full_name}` : ""}</span>
              <span className="text-ink-3">{v.approved_at ? `Approved ${formatDateTime(v.approved_at, org.timezone)}${v.approver?.full_name ? ` by ${v.approver.full_name}` : ""}` : "Not approved"}</span>
              {v.id === page.published_version_id ? <span className="font-medium text-green-ink">Live</span> : v.published_at ? <span className="text-ink-3">Was live</span> : null}
            </li>
          ))}
        </ol>
        <div className="h-3" />
      </Card>
    </Page>
  );
}
