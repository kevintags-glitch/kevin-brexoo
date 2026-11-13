import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CircleX, Download, Inbox, EllipsisVertical, ScanSearch, Sparkles } from "lucide-react";
import { Page } from "@/components/app/PageHeader";
import { DataTable, IconTile, Pagination, StatusPill } from "@/components/app/dash";
import { FilterBar } from "@/components/app/dash/FilterBar";
import { fitTone } from "@/components/app/crm/FitCard";
import { NewOpportunity } from "@/components/app/crm/NewOpportunity";
import { Avatar, EmptyState } from "@/components/ui";
import { getMembers } from "@/features/crm/queries";
import { FIT_LABELS, listEnquiries } from "@/features/crm/lists";
import { QUAL_LABEL, STAGE_BY_ID } from "@/features/crm/stages";
import { requireOrg } from "@/lib/auth/session";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Enquiries" };

const PAGE_SIZE = 20;

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const filters = { q: sp.q ?? "", status: sp.status === "all" ? "" : (sp.status ?? ""), service: sp.service ?? "", owner: sp.owner ?? "", fit: sp.fit ?? "" };
  const ctx = await requireOrg();
  const { supabase, org, isOwner } = ctx;
  const [{ rows, fc }, members, statusRows] = await Promise.all([listEnquiries(ctx, filters), getMembers(ctx), supabase.from("enquiries").select("status").eq("organization_id", org.id)]);

  const all = statusRows.data ?? [];
  const count = (s?: string) => all.filter((r) => !s || r.status === s).length;
  const stats = [
    { label: "All enquiries", n: count(), icon: <Inbox />, status: "" },
    { label: "To review", n: count("unreviewed"), icon: <Sparkles />, status: "unreviewed" },
    { label: "Qualifying", n: count("qualifying"), icon: <ScanSearch />, status: "qualifying" },
    { label: "Qualified", n: count("qualified"), icon: <BadgeCheck />, status: "qualified" },
    { label: "Disqualified", n: count("disqualified"), icon: <CircleX />, status: "disqualified" },
  ];

  const page = Math.max(1, Number(sp.page) || 1);
  const shown = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const qs = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...extra })) if (v) p.set(k, v);
    return `/app/enquiries?${p.toString()}`;
  };
  const exportHref = `/app/enquiries/export?${new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString()}`;
  const tz = org.timezone;

  return (
    <Page wide className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] sm:text-[28px]">Enquiries</h1>
          <p className="text-[14px] text-ink-3">Every enquiry from your pages and chat, plus anything you add yourself.</p>
        </div>
        <div className="flex gap-2">
            <>
              <NewOpportunity services={fc.orgServices} />
              {isOwner ? (
                <a href={exportHref} className="pressable grid size-10 place-items-center rounded-[10px] bg-midnight text-white hover:bg-midnight-hover dark:bg-blue dark:text-on-blue" aria-label="Export these enquiries as CSV" title="Export CSV (owners only, recorded in the audit log)">
                  <Download className="size-4" />
                </a>
              ) : null}
            </>
        </div>
      </div>

      <section aria-label="Enquiries by status" className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-xs sm:grid-cols-3 lg:grid-cols-5 max-sm:[&>*:last-child]:col-span-2">
        {stats.map((s) => {
          const active = (filters.status || "") === s.status;
          return (
            <Link key={s.label} href={qs({ status: s.status || "all", page: "" })} aria-current={active ? "true" : undefined} className={active ? "flex items-center gap-3 bg-surface p-4 ring-2 ring-inset ring-blue/30" : "flex items-center gap-3 bg-surface p-4 hover:bg-surface-2/60"}>
              <IconTile tone="dark">{s.icon}</IconTile>
              <span className="min-w-0">
                <span className="block truncate text-[13px] text-ink-3">{s.label}</span>
                <span className="block font-display text-[22px] font-semibold leading-tight tabular">{s.n.toLocaleString("en-AU")}</span>
              </span>
            </Link>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
        <FilterBar
          search={{ name: "q", label: "Search", placeholder: "Name, email or phone" }}
          filters={[
            { name: "status", label: "Status", options: [{ value: "", label: "All status" }, ...Object.entries(QUAL_LABEL).map(([value, v]) => ({ value, label: v.label }))] },
            { name: "service", label: "Service", options: [{ value: "", label: "All services" }, ...fc.orgServices.map((s) => ({ value: s.code, label: s.name }))] },
            { name: "fit", label: "Fit", options: [{ value: "", label: "Any fit" }, ...FIT_LABELS.map((f) => ({ value: f, label: f }))] },
            { name: "owner", label: "Owner", options: [{ value: "", label: "Anyone" }, { value: "me", label: "Me" }, { value: "unassigned", label: "Unassigned" }, ...members.map((m) => ({ value: m.id, label: m.name }))] },
          ]}
        />
        {shown.length ? (
          <>
            <div className="border-t border-line">
              <DataTable
                minWidth={980}
                head={[{ label: "Contact" }, { label: "Contact details" }, { label: "Service" }, { label: "Fit" }, { label: "Stage" }, { label: "Owner" }, { label: "Received" }, { label: <span className="sr-only">Actions</span>, className: "w-12" }]}
              >
                {shown.map((r) => {
                  const opp = r.opportunities?.[0];
                  const stage = opp ? STAGE_BY_ID[opp.stage] : null;
                  const svc = fc.orgServices.find((s) => s.code === r.project?.category_code)?.name;
                  const href = opp ? `/app/opportunities/${opp.id}` : "#";
                  return (
                    <tr key={r.id} className="group hover:bg-surface-2/50">
                      <td className="py-3 pl-5 pr-4">
                        <Link href={href} className="flex items-center gap-3">
                          <Avatar name={r.contact.full_name} className="size-9" />
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5 font-semibold">
                              {r.status === "unreviewed" ? <span className="size-1.5 shrink-0 rounded-full bg-blue" aria-label="Unreviewed" /> : null}
                              <span className="truncate group-hover:text-blue">{r.contact.full_name}</span>
                            </span>
                            <span className="block text-[12px] tabular text-ink-3">#{r.reference}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="block whitespace-nowrap text-[13px] font-medium">{r.contact.phone ?? "—"}</span>
                        <span className="block max-w-[200px] truncate text-[12px] text-ink-3">{r.contact.email ?? ""}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="block text-[13px] font-medium">{svc ?? r.project?.title ?? "Enquiry"}</span>
                        <span className="block max-w-[180px] truncate text-[12px] text-ink-3">{r.project?.location_text ?? "No location"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill tone={fitTone(r.fit.label)}>{r.fit.score !== null ? `${r.fit.label.replace(" fit", "")} · ${r.fit.score}` : "Needs info"}</StatusPill>
                      </td>
                      <td className="px-4 py-3">
                        {r.contact.do_not_contact ? <StatusPill tone="red">Do not contact</StatusPill> : stage ? <StatusPill tone={stage.tone}>{stage.label}</StatusPill> : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] text-ink-2">{opp?.owner?.full_name || opp?.owner?.email || <span className="text-ink-3">Unassigned</span>}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] tabular text-ink-3">{formatRelative(r.received_at, tz)}</td>
                      <td className="py-3 pl-2 pr-5 text-right">
                        <Link href={href} className="grid size-8 place-items-center rounded-lg text-ink-3 hover:bg-surface-2 hover:text-ink" aria-label={`Open ${r.contact.full_name}`}>
                          <EllipsisVertical className="size-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </DataTable>
            </div>
            <div className="border-t border-line">
              <Pagination page={page} pageSize={PAGE_SIZE} total={rows.length} noun={rows.length === 1 ? "enquiry" : "enquiries"} hrefFor={(p) => qs({ page: String(p) })} />
            </div>
          </>
        ) : (
          <div className="border-t border-line">
            <EmptyState
              icon={<Inbox />}
              title={Object.values(filters).some(Boolean) ? "No enquiries match these filters" : "No enquiries yet"}
              description={Object.values(filters).some(Boolean) ? "Try clearing a filter or searching for something else." : "New enquiries from your landing page and chat appear here the moment they're sent."}
            />
          </div>
        )}
      </section>
    </Page>
  );
}
