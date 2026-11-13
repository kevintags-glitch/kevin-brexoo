import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, Search } from "lucide-react";
import { Page, PageHeader } from "@/components/app/PageHeader";
import { fitTone } from "@/components/app/crm/FitCard";
import { NewOpportunity } from "@/components/app/crm/NewOpportunity";
import { Avatar, Badge, ButtonLink, Card, EmptyState, Input } from "@/components/ui";
import { fitFor, getFitContext } from "@/features/crm/queries";
import { QUAL_LABEL, STAGE_BY_ID } from "@/features/crm/stages";
import { requireOrg } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Enquiries" };

const TABS = [
  { id: "unreviewed", label: "To review" },
  { id: "qualifying", label: "Qualifying" },
  { id: "qualified", label: "Qualified" },
  { id: "disqualified", label: "Disqualified" },
  { id: "all", label: "All" },
] as const;

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const status = (TABS.find((t) => t.id === sp.status)?.id ?? "unreviewed") as (typeof TABS)[number]["id"];
  const q = (sp.q ?? "").trim().slice(0, 80);
  const ctx = await requireOrg();
  const { supabase, org } = ctx;

  let query = supabase
    .from("enquiries")
    .select(
      "id, reference, status, source, received_at, answers, duplicate_count, contact:contacts!inner(full_name, email, phone, do_not_contact), project:projects(category_code, location_text, postcode, start_timing, budget_label, details, title), opportunities!opportunities_enquiry_id_organization_id_fkey(id, stage, owner:profiles!opportunities_owner_id_fkey(full_name, email))",
    )
    .eq("organization_id", org.id)
    .order("received_at", { ascending: false })
    .limit(100);
  if (status !== "all") query = query.eq("status", status);
  if (q) {
    const safe = q.replace(/[%,()]/g, " ");
    query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`, { referencedTable: "contacts" });
  }
  const [{ data: rows }, fc, counts] = await Promise.all([
    query,
    getFitContext(ctx),
    supabase.from("enquiries").select("status").eq("organization_id", org.id),
  ]);
  const countBy = (s: string) => (counts.data ?? []).filter((r) => s === "all" || r.status === s).length;

  return (
    <Page wide>
      <PageHeader title="Enquiries" description="Every enquiry from your pages and chat, plus anything you add yourself." actions={<NewOpportunity services={fc.orgServices} />} className="mb-6" />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Filter by status" className="-mx-1 flex gap-1 overflow-x-auto px-1 scrollbar-none">
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={`/app/enquiries?status=${t.id}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              aria-current={status === t.id ? "page" : undefined}
              className={cn("inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-[14px]", status === t.id ? "bg-surface font-medium shadow-xs ring-1 ring-line" : "text-ink-3 hover:bg-surface-2 hover:text-ink")}
            >
              {t.label}
              <span className="text-[12px] tabular text-ink-3">{countBy(t.id)}</span>
            </Link>
          ))}
        </nav>
        <form className="relative md:w-72" role="search">
          <input type="hidden" name="status" value={status} />
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <Input name="q" defaultValue={q} placeholder="Search name, email or phone" aria-label="Search enquiries" className="pl-9" />
        </form>
      </div>

      <Card className="overflow-hidden">
        {rows?.length ? (
          <ul className="divide-y divide-line">
            {rows.map((r) => {
              const opp = r.opportunities?.[0];
              const fit = fitFor(fc, r.project, r.answers);
              const svc = fc.orgServices.find((s) => s.code === r.project?.category_code)?.name;
              const stage = opp ? STAGE_BY_ID[opp.stage] : null;
              return (
                <li key={r.id}>
                  <Link href={opp ? `/app/opportunities/${opp.id}` : "#"} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3.5 transition-colors hover:bg-surface-2/60 sm:px-5 md:grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_120px_130px_96px]">
                    <Avatar name={r.contact.full_name} />
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 truncate text-[14px] font-medium">
                        {r.status === "unreviewed" ? <span className="size-1.5 shrink-0 rounded-full bg-blue" aria-label="Unreviewed" /> : null}
                        <span className="truncate">{r.contact.full_name}</span>
                        {r.contact.do_not_contact ? <Badge tone="red">DNC</Badge> : null}
                      </p>
                      <p className="truncate text-[13px] text-ink-3">
                        {svc ?? r.project?.title ?? "Enquiry"}
                        {r.project?.location_text ? ` · ${r.project.location_text}` : ""}
                      </p>
                    </div>
                    <div className="hidden min-w-0 md:block">
                      <Badge tone={fitTone(fit.label)}>{fit.score !== null ? `${fit.label} · ${fit.score}` : fit.label}</Badge>
                    </div>
                    <div className="hidden md:block">{stage ? <Badge tone={stage.tone}>{stage.label}</Badge> : <Badge tone={QUAL_LABEL[r.status].tone}>{QUAL_LABEL[r.status].label}</Badge>}</div>
                    <p className="hidden truncate text-[13px] text-ink-3 md:block">{opp?.owner?.full_name || opp?.owner?.email || "Unassigned"}</p>
                    <p className="text-right text-[12px] tabular text-ink-3">{formatRelative(r.received_at, org.timezone)}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={<Inbox />}
            title={q ? "No matches" : status === "unreviewed" ? "You're all caught up" : "Nothing here yet"}
            description={q ? "Try another name, email or phone number." : "New enquiries from your landing page and chat appear here the moment they're sent."}
            action={
              !q && status === "unreviewed" ? (
                <ButtonLink href="/app/landing-pages" variant="secondary">
                  Check your landing page
                </ButtonLink>
              ) : null
            }
          />
        )}
      </Card>
    </Page>
  );
}
