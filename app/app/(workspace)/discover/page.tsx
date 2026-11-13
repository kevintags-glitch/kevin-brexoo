import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Download, MapPin, Search, ShieldCheck, Upload } from "lucide-react";
import { Page } from "@/components/app/PageHeader";
import { Pagination, StatusPill } from "@/components/app/dash";
import { FilterBar } from "@/components/app/dash/FilterBar";
import { RecordActions } from "@/components/app/discover/RecordActions";
import { INDUSTRY_ICON } from "@/components/marketing/industry-icons";
import { ButtonLink, EmptyState } from "@/components/ui";
import { BUDGET_ORDER } from "@/features/crm/fit";
import { getFitContext } from "@/features/crm/queries";
import { budgetBucket, freshness, matchRecord } from "@/features/discovery/match";
import { requireOrg } from "@/lib/auth/session";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Discover projects" };

const PAGE_SIZE = 10;
const SOURCE_TYPE: Record<string, string> = { customer_provided: "Customer-provided", public: "Public register", licensed: "Licensed data", partner: "Partner feed" };

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const ctx = await requireOrg();
  const { supabase, org, isOwner } = ctx;
  const status = sp.status ?? "active";
  let query = supabase
    .from("project_records")
    .select("*, source:discovery_sources!project_records_source_id_organization_id_fkey(name, source_type, permitted_use)")
    .eq("organization_id", org.id)
    .order("observed_at", { ascending: false, nullsFirst: false })
    .limit(1000);
  if (status === "active") query = query.neq("status", "dismissed");
  else if (status !== "all") query = query.eq("status", status);
  if (sp.type) query = query.eq("category_code", sp.type);
  if (sp.source) query = query.eq("source_id", sp.source);
  const q = (sp.q ?? "").trim().slice(0, 80).replace(/[%,()]/g, " ");
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,location_text.ilike.%${q}%`);
  const [{ data }, fc, sources] = await Promise.all([query, getFitContext(ctx), supabase.from("discovery_sources").select("id, name").eq("organization_id", org.id).order("name")]);

  let rows = (data ?? []).map((r) => ({ ...r, fit: matchRecord(fc, r), fresh: freshness(r.observed_at) }));
  if (sp.location) rows = rows.filter((r) => (r.fit.factors.find((f) => f.key === "location")?.detail ?? "").includes(sp.location!));
  if (sp.budget) rows = rows.filter((r) => budgetBucket(r.estimated_value_minor) === sp.budget);
  if (sp.timeline) rows = rows.filter((r) => (r.timeline ?? "").toLowerCase().includes(sp.timeline!.toLowerCase()));
  if (sp.sort !== "recent") rows.sort((a, b) => (b.fit.score ?? -1) - (a.fit.score ?? -1));
  const page = Math.max(1, Number(sp.page) || 1);
  const shown = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const qs = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...extra })) if (v) p.set(k, v);
    return `/app/discover?${p.toString()}`;
  };
  const hasSources = (sources.data ?? []).length > 0;

  return (
    <Page wide className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="type-subhead">Discover Projects</h1>
          <p className="max-w-2xl text-[14px] text-ink-3">Project opportunities from sources you&apos;ve approved, ranked by how well they match your services, areas and ideal work. Every record shows where it came from and when.</p>
        </div>
        {isOwner ? (
          <ButtonLink href="/app/discover/import">
            <Upload className="size-4" aria-hidden /> Import projects
          </ButtonLink>
        ) : null}
      </div>

      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
        <FilterBar
          search={{ name: "q", label: "Search", placeholder: "Project, location or keyword" }}
          filters={[
            { name: "location", label: "Location", options: [{ value: "", label: "Anywhere" }, ...fc.serviceAreas.map((a) => ({ value: a.label, label: `In ${a.label}` }))] },
            { name: "type", label: "Project type", options: [{ value: "", label: "All types" }, ...fc.orgServices.map((s) => ({ value: s.code, label: s.name }))] },
            { name: "budget", label: "Budget", options: [{ value: "", label: "Any budget" }, ...BUDGET_ORDER.map((b) => ({ value: b, label: b }))] },
            { name: "timeline", label: "Timeline", options: [{ value: "", label: "Any time" }, ...["1 month", "1–3 months", "3–6 months", "6+ months"].map((t) => ({ value: t, label: `Within ${t}`.replace("Within 6+", "6+") }))] },
            { name: "status", label: "Show", options: [{ value: "", label: "New & saved" }, { value: "new", label: "New only" }, { value: "saved", label: "Saved" }, { value: "dismissed", label: "Dismissed" }, { value: "all", label: "Everything" }] },
            ...(hasSources ? [{ name: "source", label: "Source", options: [{ value: "", label: "All sources" }, ...(sources.data ?? []).map((s) => ({ value: s.id, label: s.name }))] }] : []),
          ]}
        />
      </section>

      {shown.length ? (
        <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
          <ul className="divide-y divide-line">
            {shown.map((r) => {
              const Icon = (r.category_code && INDUSTRY_ICON[r.category_code]) || Search;
              const svc = fc.orgServices.find((s) => s.code === r.category_code)?.name;
              const pct = r.fit.score;
              return (
                <li key={r.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
                  <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--blue-soft),var(--surface-2))] text-blue" aria-hidden>
                    <Icon className="size-7" strokeWidth={1.6} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-sans type-card">{r.title}</h2>
                      {pct !== null ? (
                        <span className={`rounded-full px-2 py-0.5 text-[12px] font-medium tabular ${pct >= 75 ? "bg-green-soft text-green-ink" : pct >= 50 ? "bg-amber-soft text-amber-ink" : "bg-surface-2 text-ink-2"}`} title={r.fit.factors.map((f) => `${f.label}: ${f.detail}`).join("\n")}>
                          {pct}% Match
                        </span>
                      ) : (
                        <StatusPill tone="neutral">Needs info</StatusPill>
                      )}
                      {r.project_stage ? <StatusPill tone="violet">{r.project_stage}</StatusPill> : null}
                    </div>
                    {r.description ? <p className="mt-1 line-clamp-2 text-[14px] text-ink-2">{r.description}</p> : null}
                    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-3">
                      {svc ? <span className="font-medium text-ink-2">{svc}</span> : null}
                      {r.location_text ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" aria-hidden /> {r.location_text}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="size-3.5" aria-hidden /> Timeline: {r.timeline ?? "not stated"}
                      </span>
                      {r.estimated_value_minor != null ? <span>Est. {formatMoney(r.estimated_value_minor, r.currency ?? org.currency, { compact: true })}</span> : null}
                    </p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5">
                        <ShieldCheck className="size-3.5" aria-hidden /> {r.source?.name} · {SOURCE_TYPE[r.source?.source_type ?? ""] ?? "Source"}
                      </span>
                      <span className={r.fresh.tone === "green" ? "text-green-ink" : r.fresh.tone === "amber" ? "text-amber-ink" : ""}>{r.fresh.label}</span>
                      <span>Imported {formatDate(r.imported_at, org.timezone)}</span>
                      {r.source_url ? (
                        <a href={r.source_url} target="_blank" rel="noreferrer noopener" className="text-blue hover:underline">
                          View source
                        </a>
                      ) : null}
                      {r.contact_permission === "not_permitted" ? <span className="text-red-ink">Contact not permitted by source</span> : r.contact_permission === "unknown" ? <span>Contact permission unconfirmed</span> : null}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <RecordActions id={r.id} status={r.status} opportunityId={r.saved_opportunity_id} title={r.title} />
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-line">
            <Pagination page={page} pageSize={PAGE_SIZE} total={rows.length} noun={rows.length === 1 ? "project" : "projects"} hrefFor={(p) => qs({ page: String(p) })} />
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-line bg-surface shadow-xs">
          <EmptyState
            icon={<Search />}
            title={hasSources ? "No projects match these filters" : "Add your first project source"}
            description={
              hasSources
                ? "Try widening the location, type or timeline, or show saved and dismissed records."
                : "Import projects from a source you have the right to use, such as your own client list, a referral partner or a licensed feed. Each record keeps its source and date."
            }
            action={
              isOwner && !hasSources ? (
                <div className="flex flex-wrap justify-center gap-2">
                  <ButtonLink href="/app/discover/import">
                    <Upload className="size-4" aria-hidden /> Import projects
                  </ButtonLink>
                  <a href="/templates/brexoo-project-records.csv" download className="pressable inline-flex h-10 items-center gap-2 rounded-[10px] border border-line-strong px-4 text-sm font-medium hover:bg-surface-2">
                    <Download className="size-4" aria-hidden /> CSV template
                  </a>
                </div>
              ) : null
            }
          />
        </section>
      )}
      <p className="text-[12px] text-ink-3">
        Match % is the same explainable fit used on enquiries: service, location, timing and stated value. Hover a match to see its factors. Brexoo only searches sources you&apos;ve registered; it doesn&apos;t scrape or buy data on your behalf.{" "}
        <Link href="/app/discover/import" className="text-blue hover:underline">
          Manage sources
        </Link>
      </p>
    </Page>
  );
}
