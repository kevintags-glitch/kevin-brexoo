import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import { Page, PageHeader } from "@/components/app/PageHeader";
import { PAGE_STATUS } from "@/features/landing-pages/status";
import { Badge, Button, ButtonLink, Card, EmptyState, Notice } from "@/components/ui";
import { createLandingPage } from "@/features/landing-pages/actions";
import { requireOrg } from "@/lib/auth/session";
import { SITE_URL } from "@/lib/env";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Landing pages" };

export default async function LandingPagesPage() {
  const { supabase, org } = await requireOrg();
  const [pages, ob, services] = await Promise.all([
    supabase.from("landing_pages").select("id, title, slug, status, updated_at, published_at").eq("organization_id", org.id).order("created_at"),
    supabase.from("onboarding").select("status").eq("organization_id", org.id).single(),
    supabase.from("org_services").select("category_code", { count: "exact", head: true }).eq("organization_id", org.id),
  ]);
  const ready = ["approved", "active"].includes(ob.data?.status ?? "");
  const create = (
    <form action={createLandingPage}>
      <Button type="submit" disabled={!services.count}>
        {pages.data?.length ? "New page" : "Create my page"}
      </Button>
    </form>
  );

  return (
    <Page>
      <PageHeader title="Landing pages" description="Pages that turn visitors into enquiries. Every change is versioned and approved before it goes live." actions={pages.data?.length ? create : null} className="mb-8" />
      {!ready ? (
        <Notice tone="amber" className="mb-6" title="Finish setup first">
          Pages are drafted from your setup answers. <Link href="/app/onboarding" className="underline underline-offset-2">Complete setup</Link> to approve and publish.
        </Notice>
      ) : null}
      {pages.data?.length ? (
        <div className="grid gap-3">
          {pages.data.map((p) => {
            const st = PAGE_STATUS[p.status] ?? PAGE_STATUS.draft!;
            return (
              <Card key={p.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <Link href={`/app/landing-pages/${p.id}`} className="text-[16px] font-medium hover:underline">
                    {p.title}
                  </Link>
                  <p className="mt-0.5 truncate text-[13px] text-ink-3">
                    {new URL(SITE_URL).host}/p/{p.slug} · updated {formatRelative(p.updated_at, org.timezone)}
                  </p>
                </div>
                <Badge tone={st.tone} dot>
                  {st.label}
                </Badge>
                <div className="flex gap-2">
                  {p.status === "published" ? (
                    <a href={`/p/${p.slug}`} target="_blank" rel="noreferrer" className="pressable inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-[13px] font-medium text-ink-2 hover:bg-surface-2">
                      View <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                  ) : null}
                  <ButtonLink href={`/app/landing-pages/${p.id}`} variant="secondary" size="sm">
                    Edit
                  </ButtonLink>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<FileText />}
            title="No page yet"
            description={services.count ? "We'll draft one from your services, areas and description. You review every line before it goes live." : "Choose your services in setup first; the page is drafted from them."}
            action={services.count ? create : <ButtonLink href="/app/onboarding?step=services">Choose services</ButtonLink>}
          />
        </Card>
      )}
    </Page>
  );
}
